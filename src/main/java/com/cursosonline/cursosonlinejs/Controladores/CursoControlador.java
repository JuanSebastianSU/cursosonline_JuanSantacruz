package com.cursosonline.cursosonlinejs.Controladores;

import com.cursosonline.cursosonlinejs.Entidades.Curso;
import com.cursosonline.cursosonlinejs.Repositorios.CursoRepositorio;
import com.cursosonline.cursosonlinejs.Repositorios.UsuarioRepositorio;
import com.cursosonline.cursosonlinejs.Servicios.CursoServicio;
import jakarta.validation.Valid;
import jakarta.validation.constraints.Min;
import jakarta.validation.constraints.NotBlank;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.parameters.P;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.multipart.MultipartFile;

import java.io.IOException;
import java.net.URI;
import java.util.Arrays;
import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/v1/cursos")
@CrossOrigin(origins = "http://localhost:9090", allowCredentials = "true")
public class CursoControlador {

    private final CursoServicio cursoServicio;
    private final CursoRepositorio cursoRepo;
    private final UsuarioRepositorio usuarioRepo;
    private final com.cursosonline.cursosonlinejs.Servicios.LocalStorageService storage;

    public CursoControlador(CursoServicio cursoServicio,
                            CursoRepositorio cursoRepo,
                            UsuarioRepositorio usuarioRepo,
                            com.cursosonline.cursosonlinejs.Servicios.LocalStorageService storage) {
        this.cursoServicio = cursoServicio;
        this.cursoRepo = cursoRepo;
        this.usuarioRepo = usuarioRepo;
        this.storage = storage;
    }

    /* ====================== Helpers seguridad ====================== */

    private static boolean isAdmin() {
        Authentication a = SecurityContextHolder.getContext().getAuthentication();
        if (a == null) return false;
        return a.getAuthorities().stream().anyMatch(ga -> "ROLE_ADMIN".equals(ga.getAuthority()));
    }

    private boolean esInstructorDelCurso(String idCurso) {
        var auth = SecurityContextHolder.getContext().getAuthentication();
        if (auth == null || auth.getName() == null) return false;
        var userOpt = usuarioRepo.findByEmail(auth.getName());
        if (userOpt.isEmpty()) return false;
        var curso = cursoRepo.findById(idCurso).orElse(null);
        return curso != null && userOpt.get().getId().equals(curso.getIdInstructor());
    }

    /* ====================== Endpoints CRUD ====================== */

    @PostMapping(consumes = "application/json", produces = "application/json")
    public ResponseEntity<?> crearCurso(@RequestBody @Valid CrearCursoRequest body) {
        var creado = cursoServicio.crearCursoDesdeDto(body);
        URI location = URI.create("/api/v1/cursos/" + creado.getId());
        return ResponseEntity.created(location).body(creado);
    }

@GetMapping(produces = "application/json")
public ResponseEntity<?> listarCursos(
        @RequestParam(required = false) String categoria,
        @RequestParam(required = false) String nivel,
        @RequestParam(required = false) String estado,
        @RequestParam(required = false, name = "q") String query,
        @RequestParam(defaultValue = "0") @Min(0) int page,
        @RequestParam(defaultValue = "10") @Min(1) int size,
        @RequestParam(defaultValue = "createdAt,desc") String sort,
        @RequestParam(defaultValue = "false") boolean mis // 👈 nuevo
) {
    try {
        Authentication auth = SecurityContextHolder.getContext().getAuthentication();
        boolean admin = isAdmin();

        String userId = null;
        if (auth != null && auth.isAuthenticated() && !"anonymousUser".equals(auth.getName())) {
            userId = usuarioRepo.findByEmail(auth.getName().trim().toLowerCase())
                    .map(u -> u.getId())
                    .orElse(null);
        }

        String filtroInstructor = null;
        String filtroEstado = null;

        if (admin) {
            filtroEstado = estado;
        } 
        else if (userId != null) {
            if (mis) {
                // 👨‍🏫 Panel de instructor → ve sus propios cursos
                filtroInstructor = userId;
            } else {
                // 👨‍🏫 Sección pública → ve solo los publicados
                filtroEstado = "PUBLICADO";
            }
        } 
        else {
            // Usuario no autenticado → solo publicados
            filtroEstado = "PUBLICADO";
        }

        var result = cursoServicio.buscarAvanzado(
                null, filtroInstructor, categoria, query,
                null, nivel, filtroEstado,
                null, null, null, null, null,
                page, size, sort
        );

        var resp = new PageResponse<>(
                result.getContent(), page, size,
                result.getTotalElements(), result.getTotalPages(), sort
        );

        return ResponseEntity.ok(resp);

    } catch (Exception e) {
        e.printStackTrace();
        return ResponseEntity.status(500).body(Map.of(
                "message", "Error interno al listar cursos",
                "error", e.getMessage()
        ));
    }
}



    @GetMapping(value = "/{id}", produces = "application/json")
    public ResponseEntity<?> obtenerCurso(@PathVariable String id) {
        var opt = cursoServicio.obtenerPorId(id);
        if (opt.isEmpty()) return ResponseEntity.notFound().build();

        var curso = opt.get();
        boolean admin = isAdmin();
        boolean instructor = esInstructorDelCurso(curso.getId());

        if (!admin && !instructor) {
            if (curso.getEstado() == Curso.EstadoCurso.ARCHIVADO) {
                return ResponseEntity.status(403).body("Contenido archivado.");
            }
            if (curso.getEstado() != Curso.EstadoCurso.PUBLICADO) {
                return ResponseEntity.status(404).body("Curso no disponible.");
            }
        }
        return ResponseEntity.ok(curso);
    }

    @PreAuthorize("@cursoPermisos.cursoEditablePorAutor(#id) or hasRole('ADMIN')")
    @PutMapping(value = "/{id}", consumes = "application/json", produces = "application/json")
    public ResponseEntity<?> actualizarCurso(@PathVariable("id") @P("id") String id,
                                             @RequestBody @Valid ActualizarCursoRequest body) {
        var cursoOpt = cursoRepo.findById(id);
        if (cursoOpt.isEmpty()) return ResponseEntity.notFound().build();

        var curso = cursoOpt.get();

        // 🔒 Bloqueo total si está PUBLICADO (solo admin puede editar)
        if (curso.getEstado() == Curso.EstadoCurso.PUBLICADO && !isAdmin()) {
            return ResponseEntity.status(403).body(Map.of(
                    "message", "No se puede editar un curso publicado. Archívalo antes de modificarlo."
            ));
        }

        return cursoServicio.actualizarDesdeDto(id, body)
                .<ResponseEntity<?>>map(ResponseEntity::ok)
                .orElseGet(() -> ResponseEntity.notFound().build());
    }

    @PreAuthorize("@cursoPermisos.cursoEditablePorAutor(#id) or hasRole('ADMIN')")
    @PatchMapping(value = "/{id}/estado", consumes = "application/json", produces = "application/json")
    public ResponseEntity<?> cambiarEstado(@PathVariable("id") @P("id") String id,
                                           @RequestBody @Valid EstadoRequest body) {
        var actualizado = cursoServicio.cambiarEstado(id, body.estado());
        return actualizado.<ResponseEntity<?>>map(ResponseEntity::ok)
                .orElseGet(() -> ResponseEntity.notFound().build());
    }

    @PreAuthorize("@cursoPermisos.esDueno(#id) or hasRole('ADMIN')")
    @PatchMapping(value = "/{id}/publicar", produces = "application/json")
    public ResponseEntity<?> publicar(@PathVariable("id") @P("id") String id) {
        return cursoServicio.publicar(id)
                .<ResponseEntity<?>>map(ResponseEntity::ok)
                .orElseGet(() -> ResponseEntity.notFound().build());
    }

    @PreAuthorize("@cursoPermisos.esDueno(#id) or hasRole('ADMIN')")
    @PatchMapping(value = "/{id}/archivar", produces = "application/json")
    public ResponseEntity<?> archivar(@PathVariable("id") @P("id") String id) {
        return cursoServicio.archivar(id)
                .<ResponseEntity<?>>map(ResponseEntity::ok)
                .orElseGet(() -> ResponseEntity.notFound().build());
    }

    @PreAuthorize("@cursoPermisos.esDueno(#id) or hasRole('ADMIN')")
    @DeleteMapping("/{id}")
    public ResponseEntity<?> eliminarCurso(@PathVariable("id") @P("id") String id) {
        return cursoServicio.eliminarPorId(id)
                ? ResponseEntity.noContent().build()
                : ResponseEntity.notFound().build();
    }

    /* ====================== Portada: archivo y por URL ====================== */

    @PreAuthorize("@cursoPermisos.esDueno(#id) or hasRole('ADMIN')")
    @PostMapping(value = "/{id}/portada", consumes = "multipart/form-data", produces = "application/json")
    public ResponseEntity<?> subirPortada(@PathVariable String id,
                                          @RequestParam("file") MultipartFile file) throws IOException {
        var curso = cursoRepo.findById(id).orElse(null);
        if (curso == null) return ResponseEntity.notFound().build();

        // 🔒 Bloqueo si está PUBLICADO
        if (curso.getEstado() == Curso.EstadoCurso.PUBLICADO && !isAdmin()) {
            return ResponseEntity.status(403).body(Map.of(
                    "message", "No se puede modificar la imagen de un curso publicado."
            ));
        }

        if (file == null || file.isEmpty()) {
            return ResponseEntity.badRequest().body(Map.of("message", "Archivo vacío"));
        }
        if (file.getContentType() == null || !file.getContentType().startsWith("image/")) {
            return ResponseEntity.badRequest().body(Map.of("message", "Tipo no permitido, debe ser imagen"));
        }

        String safeName = id.replaceAll("[^a-zA-Z0-9_-]", "");
        String publicUrl = storage.save(file, "cursos", safeName);

        curso.setImagenPortadaUrl(publicUrl);
        cursoRepo.save(curso);

        return ResponseEntity.ok(Map.of("imagenPortadaUrl", publicUrl));
    }

    @PreAuthorize("@cursoPermisos.esDueno(#id) or hasRole('ADMIN')")
    @PostMapping(value = "/{id}/portada/url", consumes = "application/json", produces = "application/json")
    public ResponseEntity<?> asignarPortadaDesdeUrl(@PathVariable String id,
                                                    @RequestBody Map<String, String> body) {
        var curso = cursoRepo.findById(id).orElse(null);
        if (curso == null) return ResponseEntity.notFound().build();

        // 🔒 Bloqueo si está PUBLICADO
        if (curso.getEstado() == Curso.EstadoCurso.PUBLICADO && !isAdmin()) {
            return ResponseEntity.status(403).body(Map.of(
                    "message", "No se puede modificar la imagen de un curso publicado."
            ));
        }

        String url = body.get("url");
        if (url == null || !url.matches("^https?://.+")) {
            return ResponseEntity.badRequest().body(Map.of("message", "URL inválida"));
        }

        curso.setImagenPortadaUrl(url);
        cursoRepo.save(curso);

        return ResponseEntity.ok(Map.of("imagenPortadaUrl", url));
    }

    /* ====================== DTOs y Page wrapper ====================== */

    public static record CrearCursoRequest(
            @NotBlank String titulo,
            String descripcion,
            @NotBlank String categoria,
            @NotBlank String nivel,
            @NotBlank String idioma,
            @Min(0) double precio,
            String imagenPortadaUrl
    ) {}

    public static record ActualizarCursoRequest(
            @NotBlank String titulo,
            String descripcion,
            @NotBlank String categoria,
            @NotBlank String nivel,
            @NotBlank String idioma,
            @Min(0) double precio,
            String imagenPortadaUrl
    ) {}

    public static record EstadoRequest(@NotBlank String estado) {}

    public static class PageResponse<T> {
        public List<T> content;
        public int page;
        public int size;
        public long totalElements;
        public int totalPages;
        public String sort;
        public PageResponse(List<T> content, int page, int size, long totalElements, int totalPages, String sort) {
            this.content = content;
            this.page = page;
            this.size = size;
            this.totalElements = totalElements;
            this.totalPages = totalPages;
            this.sort = sort;
        }
    }
}

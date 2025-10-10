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

import java.net.URI;

@RestController
@RequestMapping("/api/v1/cursos")
@CrossOrigin(origins = "http://localhost:9090", allowCredentials = "true")
public class CursoControlador {

    private final CursoServicio cursoServicio;
    private final CursoRepositorio cursoRepo;
    private final UsuarioRepositorio usuarioRepo;

    public CursoControlador(CursoServicio cursoServicio,
                            CursoRepositorio cursoRepo,
                            UsuarioRepositorio usuarioRepo) {
        this.cursoServicio = cursoServicio;
        this.cursoRepo = cursoRepo;
        this.usuarioRepo = usuarioRepo;
    }

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

    @PostMapping(consumes = "application/json", produces = "application/json")
    public ResponseEntity<?> crearCurso(@RequestBody @Valid CrearCursoRequest body) {
        var creado = cursoServicio.crearCursoDesdeDto(body);
        URI location = URI.create("/api/v1/cursos/" + creado.getId());
        return ResponseEntity.created(location).body(creado);
    }

    @GetMapping(produces = "application/json")
    public ResponseEntity<PageResponse<Curso>> listarCursos(
            @RequestParam(required = false) String categoria,
            @RequestParam(required = false) String nivel,
            @RequestParam(required = false) String estado,
            @RequestParam(required = false, name = "q") String query,
            @RequestParam(defaultValue = "0") @Min(0) int page,
            @RequestParam(defaultValue = "10") @Min(1) int size,
            @RequestParam(defaultValue = "fechaCreacion,desc") String sort
    ) {
        if (!isAdmin()) estado = "PUBLICADO";

        var result = cursoServicio.buscar(categoria, nivel, estado, query, page, size, sort);
        var resp = new PageResponse<>(
                result.getContent(), page, size, result.getTotalElements(), result.getTotalPages(), sort
        );
        return ResponseEntity.ok(resp);
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

    @GetMapping(value = "/buscar", produces = "application/json")
    public ResponseEntity<PageResponse<Curso>> buscarAvanzado(
            @RequestParam(required = false) String id,
            @RequestParam(required = false) String idInstructor,
            @RequestParam(required = false) String categoria,
            @RequestParam(required = false, name = "q") String q,
            @RequestParam(required = false) String idioma,
            @RequestParam(required = false) String nivel,
            @RequestParam(required = false) String estado,
            @RequestParam(required = false) java.math.BigDecimal minPrecio,
            @RequestParam(required = false) java.math.BigDecimal maxPrecio,
            @RequestParam(required = false) Boolean destacado,
            @RequestParam(required = false) Boolean gratuito,
            @RequestParam(required = false) String tags,
            @RequestParam(defaultValue = "0") @Min(0) int page,
            @RequestParam(defaultValue = "10") @Min(1) int size,
            @RequestParam(defaultValue = "createdAt,desc") String sort
    ) {
        if (!isAdmin()) estado = "PUBLICADO";

        java.util.List<String> tagList = null;
        if (tags != null && !tags.isBlank()) {
            tagList = java.util.Arrays.stream(tags.split(","))
                    .map(String::trim).filter(s -> !s.isEmpty()).toList();
        }

        var result = cursoServicio.buscarAvanzado(
                id, idInstructor, categoria, q, idioma, nivel, estado,
                minPrecio, maxPrecio, destacado, gratuito, tagList,
                page, size, sort
        );

        var resp = new PageResponse<>(
                result.getContent(), page, size, result.getTotalElements(), result.getTotalPages(), sort
        );
        return ResponseEntity.ok(resp);
    }

    public static record CrearCursoRequest(
            @NotBlank String titulo,
            String descripcion,
            @NotBlank String categoria,
            @NotBlank String nivel,
            @NotBlank String idioma,
            @Min(0) double precio
    ) {}

    public static record ActualizarCursoRequest(
            @NotBlank String titulo,
            String descripcion,
            @NotBlank String categoria,
            @NotBlank String nivel,
            @NotBlank String idioma,
            @Min(0) double precio
    ) {}

    public static record EstadoRequest(@NotBlank String estado) {}

    public static class PageResponse<T> {
        public java.util.List<T> content;
        public int page;
        public int size;
        public long totalElements;
        public int totalPages;
        public String sort;
        public PageResponse(java.util.List<T> content, int page, int size, long totalElements, int totalPages, String sort) {
            this.content = content;
            this.page = page;
            this.size = size;
            this.totalElements = totalElements;
            this.totalPages = totalPages;
            this.sort = sort;
        }
    }
}

package com.cursosonline.cursosonlinejs.Controladores;

import com.cursosonline.cursosonlinejs.Entidades.Curso;
import com.cursosonline.cursosonlinejs.Entidades.Modulo;
import com.cursosonline.cursosonlinejs.Repositorios.CursoRepositorio;
import com.cursosonline.cursosonlinejs.Repositorios.UsuarioRepositorio;
import com.cursosonline.cursosonlinejs.Servicios.ModuloServicio;
import com.cursosonline.cursosonlinejs.Servicios.InscripcionServicio;
import com.cursosonline.cursosonlinejs.Servicios.SolicitudReintentoModuloServicio;
import jakarta.validation.Valid;
import jakarta.validation.constraints.Min;
import jakarta.validation.constraints.NotBlank;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.web.bind.annotation.*;

import java.math.BigDecimal;
import java.net.URI;
import java.util.List;
import java.util.Map;
import java.util.NoSuchElementException;
import java.util.stream.Collectors;

@RestController
@RequestMapping("/api/v1/cursos/{idCurso}/modulos")
@CrossOrigin(origins = "http://localhost:9090", allowCredentials = "true")
public class ModuloControlador {

    private final ModuloServicio moduloServicio;
    private final CursoRepositorio cursoRepo;
    private final UsuarioRepositorio usuarioRepo;
    private final InscripcionServicio inscripcionServicio;
    private final SolicitudReintentoModuloServicio solicitudReintentoModuloServicio;

    public ModuloControlador(ModuloServicio moduloServicio,
                             CursoRepositorio cursoRepo,
                             UsuarioRepositorio usuarioRepo,
                             InscripcionServicio inscripcionServicio,
                             SolicitudReintentoModuloServicio solicitudReintentoModuloServicio) {
        this.moduloServicio = moduloServicio;
        this.cursoRepo = cursoRepo;
        this.usuarioRepo = usuarioRepo;
        this.inscripcionServicio = inscripcionServicio;
        this.solicitudReintentoModuloServicio = solicitudReintentoModuloServicio;
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

    // --- helper para validar nota mínima ---
    private ResponseEntity<String> validarNotaMinima(BigDecimal nota) {
        if (nota == null) return null; // permitido null (sin nota configurada)
        if (nota.compareTo(BigDecimal.ZERO) < 0 || nota.compareTo(BigDecimal.valueOf(100)) > 0) {
            return ResponseEntity
                    .badRequest()
                    .body("La nota mínima debe estar entre 0 y 100.");
        }
        return null;
    }

    @PostMapping(consumes = "application/json", produces = "application/json")
    @PreAuthorize("hasRole('ADMIN') or @cursoPermisos.esDueno(#idCurso)")
    public ResponseEntity<?> crearModulo(@PathVariable String idCurso, @Valid @RequestBody Modulo body) {
        if (body.getTitulo() == null || body.getTitulo().isBlank()) {
            return ResponseEntity.badRequest().body("El título es obligatorio.");
        }

        // validar nota mínima (0–100, opcional)
        var errorNota = validarNotaMinima(body.getNotaMinimaAprobacion());
        if (errorNota != null) return errorNota;

        body.setId(null);
        body.setIdCurso(idCurso);

        if (body.getOrden() <= 0) {
            body.setOrden(moduloServicio.siguienteOrden(idCurso));
        } else if (moduloServicio.existeOrdenEnCurso(idCurso, body.getOrden())) {
            return ResponseEntity.status(409).body("Ya existe un módulo con ese orden en este curso.");
        }

        Modulo creado = moduloServicio.guardar(body);
        URI location = URI.create("/api/v1/cursos/" + idCurso + "/modulos/" + creado.getId());
        return ResponseEntity.created(location).body(creado);
    }

    @GetMapping(produces = "application/json")
    public ResponseEntity<?> listarModulos(@PathVariable String idCurso) {
        var curso = cursoRepo.findById(idCurso).orElse(null);
        if (curso == null) return ResponseEntity.notFound().build();

        boolean admin = isAdmin();
        boolean instructor = esInstructorDelCurso(idCurso);

        if (!admin && !instructor) {
            if (curso.getEstado() == Curso.EstadoCurso.ARCHIVADO) {
                return ResponseEntity.status(403).body("Contenido archivado.");
            }
            List<Modulo> publicados = moduloServicio.listarPorCurso(idCurso).stream()
                    .filter(m -> m.getEstado() == Modulo.EstadoModulo.PUBLICADO)
                    .collect(Collectors.toList());
            return publicados.isEmpty() ? ResponseEntity.noContent().build() : ResponseEntity.ok(publicados);
        }

        List<Modulo> todos = moduloServicio.listarPorCurso(idCurso);
        return todos.isEmpty() ? ResponseEntity.noContent().build() : ResponseEntity.ok(todos);
    }

    @GetMapping(value = "/{id}", produces = "application/json")
    public ResponseEntity<?> obtenerModulo(@PathVariable String idCurso,
                                           @PathVariable String id) {
        var modulo = moduloServicio.obtener(id);
        if (modulo == null) return ResponseEntity.notFound().build();
        if (!idCurso.equals(modulo.getIdCurso())) {
            return ResponseEntity.status(404).body("El módulo no pertenece al curso especificado.");
        }

        var curso = cursoRepo.findById(idCurso).orElse(null);
        if (curso == null) return ResponseEntity.notFound().build();

        boolean admin = isAdmin();
        boolean instructor = esInstructorDelCurso(idCurso);

        if (!admin && !instructor) {
            if (curso.getEstado() == Curso.EstadoCurso.ARCHIVADO
                    || modulo.getEstado() == Modulo.EstadoModulo.ARCHIVADO) {
                return ResponseEntity.status(403).body("Contenido archivado.");
            }
            if (modulo.getEstado() != Modulo.EstadoModulo.PUBLICADO) {
                return ResponseEntity.status(404).body("Módulo no disponible.");
            }
        }

        return ResponseEntity.ok(modulo);
    }

    @PutMapping(value = "/{id}", consumes = "application/json", produces = "application/json")
    @PreAuthorize("hasRole('ADMIN') or @cursoPermisos.esDueno(#idCurso)")
    public ResponseEntity<?> actualizarModulo(@PathVariable String idCurso,
                                              @PathVariable String id,
                                              @Valid @RequestBody Modulo body) {
        Modulo actual = moduloServicio.obtener(id);
        if (actual == null) return ResponseEntity.notFound().build();
        if (!idCurso.equals(actual.getIdCurso())) {
            return ResponseEntity.status(404).body("El módulo no pertenece al curso especificado.");
        }

        if (body.getTitulo() != null && !body.getTitulo().isBlank()) {
            actual.setTitulo(body.getTitulo().trim());
        }
        if (body.getOrden() > 0 && body.getOrden() != actual.getOrden()) {
            if (moduloServicio.existeOrdenEnCursoExceptoId(idCurso, body.getOrden(), id)) {
                return ResponseEntity.status(409).body("Ya existe un módulo con ese orden en este curso.");
            }
            actual.setOrden(body.getOrden());
        }
        if (body.getDescripcion() != null) {
            actual.setDescripcion(body.getDescripcion());
        }

        // actualizar nota mínima si viene en el body
        if (body.getNotaMinimaAprobacion() != null) {
            var errorNota = validarNotaMinima(body.getNotaMinimaAprobacion());
            if (errorNota != null) return errorNota;
            actual.setNotaMinimaAprobacion(body.getNotaMinimaAprobacion());
        }

        Modulo actualizado = moduloServicio.guardar(actual);
        return ResponseEntity.ok(actualizado);
    }

    @DeleteMapping("/{id}")
    @PreAuthorize("hasRole('ADMIN') or @cursoPermisos.esDueno(#idCurso)")
    public ResponseEntity<?> eliminarModulo(@PathVariable String idCurso, @PathVariable String id) {
        Modulo actual = moduloServicio.obtener(id);
        if (actual == null) return ResponseEntity.notFound().build();
        if (!idCurso.equals(actual.getIdCurso())) {
            return ResponseEntity.status(404).body("El módulo no pertenece al curso especificado.");
        }
        moduloServicio.eliminar(id);
        return ResponseEntity.noContent().build();
    }

    @PatchMapping(value = "/{id}/orden", consumes = "application/json", produces = "application/json")
    @PreAuthorize("hasRole('ADMIN') or @cursoPermisos.esDueno(#idCurso)")
    public ResponseEntity<?> cambiarOrden(@PathVariable String idCurso,
                                          @PathVariable String id,
                                          @RequestBody CambiarOrdenRequest body) {
        if (body == null || body.orden() == null || body.orden() < 1) {
            return ResponseEntity.badRequest().body("Debes enviar un 'orden' >= 1.");
        }
        try {
            Modulo result = moduloServicio.cambiarOrden(idCurso, id, body.orden());
            return ResponseEntity.ok(result);
        } catch (NoSuchElementException e) {
            return ResponseEntity.notFound().build();
        } catch (IllegalArgumentException e) {
            return ResponseEntity.status(404).body(e.getMessage());
        }
    }

    @PatchMapping(value = "/{id}/mover", consumes = "application/json", produces = "application/json")
    @PreAuthorize("hasRole('ADMIN') or @cursoPermisos.esDueno(#idCurso)")
    public ResponseEntity<?> mover(@PathVariable String idCurso,
                                   @PathVariable String id,
                                   @RequestBody MoverRequest body) {
        int delta = 0;
        if (body != null) {
            if (body.delta() != null) {
                delta = body.delta();
            } else if (body.direccion() != null) {
                switch (body.direccion().toLowerCase()) {
                    case "up":
                    case "arriba":
                        delta = -1;
                        break;
                    case "down":
                    case "abajo":
                        delta = +1;
                        break;
                }
            }
        }
        if (delta == 0) return ResponseEntity.badRequest().body("Envía 'delta' (+/-1) o 'direccion' ('up'/'down').");

        try {
            Modulo result = moduloServicio.moverPorDelta(idCurso, id, delta);
            return ResponseEntity.ok(result);
        } catch (NoSuchElementException e) {
            return ResponseEntity.notFound().build();
        } catch (IllegalArgumentException e) {
            return ResponseEntity.status(404).body(e.getMessage());
        }
    }

    @PatchMapping(value = "/orden", consumes = "application/json", produces = "application/json")
    @PreAuthorize("hasRole('ADMIN') or @cursoPermisos.esDueno(#idCurso)")
    public ResponseEntity<?> reordenar(@PathVariable String idCurso,
                                       @RequestBody ReordenarRequest body) {
        if (body == null || body.ids() == null || body.ids().isEmpty()) {
            return ResponseEntity.badRequest().body("Debes enviar 'ids' en el orden deseado.");
        }
        try {
            List<Modulo> result = moduloServicio.reordenarSecuencial(idCurso, body.ids());
            return ResponseEntity.ok(result);
        } catch (IllegalArgumentException e) {
            return ResponseEntity.badRequest().body(e.getMessage());
        }
    }

    @PatchMapping("/{id}/publicar")
    @PreAuthorize("hasRole('ADMIN') or @cursoPermisos.esDueno(#idCurso)")
    public ResponseEntity<?> publicar(@PathVariable String idCurso, @PathVariable String id) {
        var mod = moduloServicio.obtener(id);
        if (mod == null) return ResponseEntity.notFound().build();
        if (!idCurso.equals(mod.getIdCurso())) {
            return ResponseEntity.status(404).body("El módulo no pertenece al curso.");
        }
        return moduloServicio.publicar(id)
                .<ResponseEntity<?>>map(ResponseEntity::ok)
                .orElseGet(() -> ResponseEntity.notFound().build());
    }

    @PatchMapping("/{id}/archivar")
    @PreAuthorize("hasRole('ADMIN') or @cursoPermisos.esDueno(#idCurso)")
    public ResponseEntity<?> archivar(@PathVariable String idCurso, @PathVariable String id) {
        var mod = moduloServicio.obtener(id);
        if (mod == null) return ResponseEntity.notFound().build();
        if (!idCurso.equals(mod.getIdCurso())) {
            return ResponseEntity.status(404).body("El módulo no pertenece al curso.");
        }
        return moduloServicio.archivar(id)
                .<ResponseEntity<?>>map(ResponseEntity::ok)
                .orElseGet(() -> ResponseEntity.notFound().build());
    }

    /**
     * NUEVO: el alumno autenticado solicita reintento de este módulo.
     */
    @PostMapping("/{id}/solicitar-reintento-mio")
    @PreAuthorize("isAuthenticated()")
    public ResponseEntity<?> solicitarReintentoMio(@PathVariable String idCurso,
                                                   @PathVariable("id") String idModulo,
                                                   @RequestBody(required = false) SolicitarReintentoRequest body) {

        // 1) Verificar que el módulo existe y pertenece al curso
        var modulo = moduloServicio.obtener(idModulo);
        if (modulo == null || !idCurso.equals(modulo.getIdCurso())) {
            return ResponseEntity.status(404).body(Map.of(
                    "message", "Módulo no encontrado para este curso."
            ));
        }

        // 2) Obtener id del estudiante actual
        var idEstOpt = inscripcionServicio.obtenerIdEstudianteActual();
        if (idEstOpt.isEmpty()) {
            return ResponseEntity.status(401).body(Map.of(
                    "message", "No autenticado."
            ));
        }
        String idEstudiante = idEstOpt.get();

        // 3) Verificar que está inscrito en el curso
        var inscOpt = inscripcionServicio.obtenerPorCursoYEstudiante(idCurso, idEstudiante);
        if (inscOpt.isEmpty()) {
            return ResponseEntity.status(403).body(Map.of(
                    "message", "No estás inscrito en este curso."
            ));
        }

        String motivo = null;
        if (body != null && body.motivo() != null && !body.motivo().isBlank()) {
            motivo = body.motivo().trim();
        }

        try {
            var sol = solicitudReintentoModuloServicio.crearSolicitud(
                    idCurso,
                    idModulo,
                    idEstudiante,
                    motivo
            );

            return ResponseEntity
                    .created(URI.create("/api/v1/reintentos-modulo/" + sol.getId()))
                    .body(sol);

        } catch (IllegalStateException ex) {
            return ResponseEntity.status(409).body(Map.of(
                    "message", ex.getMessage()
            ));
        }
    }

    public static record CambiarOrdenRequest(@Min(1) Integer orden) {}
    public static record MoverRequest(Integer delta, String direccion) {}
    public static record ReordenarRequest(List<@NotBlank String> ids) {}

    // body opcional para que el alumno envíe un motivo
    public static record SolicitarReintentoRequest(String motivo) {}
}

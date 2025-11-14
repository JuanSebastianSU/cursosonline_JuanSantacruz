package com.cursosonline.cursosonlinejs.Controladores;

import com.cursosonline.cursosonlinejs.Entidades.Curso;
import com.cursosonline.cursosonlinejs.Entidades.Leccion;
import com.cursosonline.cursosonlinejs.Entidades.Leccion.TipoLeccion;
import com.cursosonline.cursosonlinejs.Entidades.Modulo;
import com.cursosonline.cursosonlinejs.Repositorios.CursoRepositorio;
import com.cursosonline.cursosonlinejs.Repositorios.ModuloRepositorio;
import com.cursosonline.cursosonlinejs.Seguridad.LeccionPermisos;
import com.cursosonline.cursosonlinejs.Servicios.LeccionServicio;
import jakarta.validation.Valid;
import jakarta.validation.constraints.Min;
import jakarta.validation.constraints.NotBlank;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.web.bind.annotation.*;
import org.springframework.security.core.Authentication;

import java.net.URI;
import java.util.List;
import java.util.NoSuchElementException;

@RestController
@RequestMapping("/api/v1/modulos/{idModulo}/lecciones")
@CrossOrigin(
        origins = {
                "http://localhost:9090",
                "https://cursosonline-juan-santacruz.vercel.app"
        },
        allowCredentials = "true"
)
public class LeccionControlador {

    private final LeccionServicio leccionServicio;
    private final LeccionPermisos leccionPermisos;
    private final ModuloRepositorio moduloRepo;
    private final CursoRepositorio cursoRepo;

    public LeccionControlador(LeccionServicio leccionServicio,
                              LeccionPermisos leccionPermisos,
                              ModuloRepositorio moduloRepo,
                              CursoRepositorio cursoRepo) {
        this.leccionServicio = leccionServicio;
        this.leccionPermisos = leccionPermisos;
        this.moduloRepo = moduloRepo;
        this.cursoRepo = cursoRepo;
    }

    private static boolean isAdmin() {
        Authentication a = SecurityContextHolder.getContext().getAuthentication();
        if (a == null) return false;
        return a.getAuthorities().stream().anyMatch(ga -> "ROLE_ADMIN".equals(ga.getAuthority()));
    }

    @PostMapping(consumes = "application/json", produces = "application/json")
    @PreAuthorize("hasRole('ADMIN') or @leccionPermisos.esInstructorDelModulo(#idModulo)")
    public ResponseEntity<?> crearLeccion(@PathVariable String idModulo,
                                          @Valid @RequestBody Leccion body) {
        if (body.getTitulo() == null || body.getTitulo().isBlank()) {
            return ResponseEntity.badRequest().body("El título es obligatorio.");
        }
        if (body.getTipo() == null) {
            return ResponseEntity.badRequest().body("El tipo es obligatorio (VIDEO | ARTICULO | QUIZ).");
        }
        if (body.getTipo() != TipoLeccion.QUIZ) {
            if (body.getUrlContenido() == null || body.getUrlContenido().isBlank()) {
                return ResponseEntity.badRequest().body("urlContenido es obligatorio para VIDEO/ARTICULO.");
            }
        }
        if (body.getDuracion() != null && body.getDuracion() < 0) {
            return ResponseEntity.badRequest().body("La duración no puede ser negativa.");
        }

        body.setId(null);
        body.setIdModulo(idModulo);

        Integer orden = body.getOrden();
        if (orden == null || orden <= 0) {
            body.setOrden(leccionServicio.siguienteOrden(idModulo));
        } else if (leccionServicio.existeOrdenEnModulo(idModulo, orden)) {
            return ResponseEntity.status(409).body("Ya existe una lección con ese orden en este módulo.");
        }

        Leccion creada = leccionServicio.guardar(body);
        URI location = URI.create("/api/v1/modulos/" + idModulo + "/lecciones/" + creada.getId());
        return ResponseEntity.created(location).body(creada);
    }

    @GetMapping(produces = "application/json")
    @PreAuthorize("hasRole('ADMIN')"
            + " or @leccionPermisos.esInstructorDelModulo(#idModulo)"
            + " or @leccionPermisos.estaInscritoEnCursoDelModulo(#idModulo)")
    public ResponseEntity<?> listarLecciones(@PathVariable String idModulo) {
        Modulo modulo = moduloRepo.findById(idModulo).orElse(null);
        if (modulo == null) return ResponseEntity.notFound().build();
        Curso curso = cursoRepo.findById(modulo.getIdCurso()).orElse(null);
        if (curso == null) return ResponseEntity.notFound().build();

        boolean admin = isAdmin();
        boolean instructor = leccionPermisos.esInstructorDelModulo(idModulo);

        if (!admin && !instructor) {
            if (curso.getEstado() == Curso.EstadoCurso.ARCHIVADO
                    || modulo.getEstado() == Modulo.EstadoModulo.ARCHIVADO) {
                return ResponseEntity.status(403).body("Contenido archivado.");
            }
            return ResponseEntity.ok(leccionServicio.listarPublicadasPorModulo(idModulo));
        }

        return ResponseEntity.ok(leccionServicio.listarPorModulo(idModulo));
    }

    @GetMapping(value = "/{id}", produces = "application/json")
    @PreAuthorize("hasRole('ADMIN')"
            + " or @leccionPermisos.esInstructorDelModulo(#idModulo)"
            + " or @leccionPermisos.estaInscritoEnCursoDelModulo(#idModulo)")
    public ResponseEntity<?> obtenerLeccion(@PathVariable String idModulo, @PathVariable String id) {
        Leccion l = leccionServicio.obtener(id);
        if (l == null) return ResponseEntity.notFound().build();
        if (!idModulo.equals(l.getIdModulo())) {
            return ResponseEntity.status(404).body("La lección no pertenece al módulo especificado.");
        }

        Modulo modulo = moduloRepo.findById(idModulo).orElse(null);
        if (modulo == null) return ResponseEntity.notFound().build();
        Curso curso = cursoRepo.findById(modulo.getIdCurso()).orElse(null);
        if (curso == null) return ResponseEntity.notFound().build();

        boolean admin = isAdmin();
        boolean instructor = leccionPermisos.esInstructorDelModulo(idModulo);

        if (!admin && !instructor) {
            if (curso.getEstado() == Curso.EstadoCurso.ARCHIVADO
                    || modulo.getEstado() == Modulo.EstadoModulo.ARCHIVADO) {
                return ResponseEntity.status(403).body("Contenido archivado.");
            }
            if (l.getEstado() != Leccion.EstadoPublicacion.PUBLICADO) {
                return ResponseEntity.status(404).body("Lección no disponible.");
            }
        }

        return ResponseEntity.ok(l);
    }

    @PutMapping(value = "/{id}", consumes = "application/json", produces = "application/json")
    @PreAuthorize("hasRole('ADMIN') or @leccionPermisos.esInstructorDelModulo(#idModulo)")
    public ResponseEntity<?> actualizarLeccion(@PathVariable String idModulo,
                                               @PathVariable String id,
                                               @Valid @RequestBody Leccion body) {
        Leccion actual = leccionServicio.obtener(id);
        if (actual == null) return ResponseEntity.notFound().build();
        if (!idModulo.equals(actual.getIdModulo())) {
            return ResponseEntity.status(404).body("La lección no pertenece al módulo especificado.");
        }

        if (body.getTitulo() != null && !body.getTitulo().isBlank()) {
            actual.setTitulo(body.getTitulo().trim());
        }
        if (body.getTipo() != null) {
            actual.setTipo(body.getTipo());
        }
        if (body.getUrlContenido() != null) {
            actual.setUrlContenido(body.getUrlContenido().trim());
        }
        if (body.getDuracion() != null && body.getDuracion() >= 0) {
            actual.setDuracion(body.getDuracion());
        }
        if (body.getOrden() != null && body.getOrden() > 0 && !body.getOrden().equals(actual.getOrden())) {
            if (leccionServicio.existeOrdenEnModuloExceptoId(idModulo, body.getOrden(), id)) {
                return ResponseEntity.status(409).body("Ya existe una lección con ese orden en este módulo.");
            }
            actual.setOrden(body.getOrden());
        }

        Leccion actualizada = leccionServicio.guardar(actual);
        return ResponseEntity.ok(actualizada);
    }

    @PatchMapping("/{id}/publicar")
    @PreAuthorize("hasRole('ADMIN') or @leccionPermisos.esInstructorDelModulo(#idModulo)")
    public ResponseEntity<?> publicar(@PathVariable String idModulo, @PathVariable String id) {
        var l = leccionServicio.obtener(id);
        if (l == null) return ResponseEntity.notFound().build();
        if (!idModulo.equals(l.getIdModulo())) {
            return ResponseEntity.status(404).body("La lección no pertenece al módulo especificado.");
        }

        return leccionServicio.publicar(id)
                .<ResponseEntity<?>>map(ResponseEntity::ok)
                .orElseGet(() -> ResponseEntity.notFound().build());
    }

    @PatchMapping("/{id}/archivar")
    @PreAuthorize("hasRole('ADMIN') or @leccionPermisos.esInstructorDelModulo(#idModulo)")
    public ResponseEntity<?> archivar(@PathVariable String idModulo, @PathVariable String id) {
        var l = leccionServicio.obtener(id);
        if (l == null) return ResponseEntity.notFound().build();
        if (!idModulo.equals(l.getIdModulo())) {
            return ResponseEntity.status(404).body("La lección no pertenece al módulo especificado.");
        }
        return leccionServicio.archivar(id)
                .<ResponseEntity<?>>map(ResponseEntity::ok)
                .orElseGet(() -> ResponseEntity.notFound().build());
    }

    @DeleteMapping("/{id}")
    @PreAuthorize("hasRole('ADMIN') or @leccionPermisos.esInstructorDelModulo(#idModulo)")
    public ResponseEntity<?> eliminarLeccion(@PathVariable String idModulo, @PathVariable String id) {
        Leccion actual = leccionServicio.obtener(id);
        if (actual == null) return ResponseEntity.notFound().build();
        if (!idModulo.equals(actual.getIdModulo())) {
            return ResponseEntity.status(404).body("La lección no pertenece al módulo especificado.");
        }
        leccionServicio.eliminar(id);
        return ResponseEntity.noContent().build();
    }

    @PatchMapping(value = "/{id}/orden", consumes = "application/json", produces = "application/json")
    @PreAuthorize("hasRole('ADMIN') or @leccionPermisos.esInstructorDelModulo(#idModulo)")
    public ResponseEntity<?> cambiarOrden(@PathVariable String idModulo,
                                          @PathVariable String id,
                                          @RequestBody CambiarOrdenRequest body) {
        if (body == null || body.orden() == null || body.orden() < 1) {
            return ResponseEntity.badRequest().body("Debes enviar un 'orden' >= 1.");
        }
        try {
            Leccion result = leccionServicio.cambiarOrden(idModulo, id, body.orden());
            return ResponseEntity.ok(result);
        } catch (NoSuchElementException e) {
            return ResponseEntity.notFound().build();
        } catch (IllegalArgumentException e) {
            return ResponseEntity.status(404).body(e.getMessage());
        }
    }

    @PatchMapping(value = "/{id}/mover", consumes = "application/json", produces = "application/json")
    @PreAuthorize("hasRole('ADMIN') or @leccionPermisos.esInstructorDelModulo(#idModulo)")
    public ResponseEntity<?> mover(@PathVariable String idModulo,
                                   @PathVariable String id,
                                   @RequestBody MoverRequest body) {
        int delta = 0;
        if (body != null) {
            if (body.delta() != null) {
                delta = body.delta();
            } else if (body.direccion() != null) {
                switch (body.direccion().toLowerCase()) {
                    case "up": case "arriba": delta = -1; break;
                    case "down": case "abajo": delta = +1; break;
                }
            }
        }
        if (delta == 0) return ResponseEntity.badRequest().body("Envía 'delta' (+/-1) o 'direccion' ('up'/'down').");

        try {
            Leccion result = leccionServicio.moverPorDelta(idModulo, id, delta);
            return ResponseEntity.ok(result);
        } catch (NoSuchElementException e) {
            return ResponseEntity.notFound().build();
        } catch (IllegalArgumentException e) {
            return ResponseEntity.status(404).body(e.getMessage());
        }
    }

    @PatchMapping(value = "/orden", consumes = "application/json", produces = "application/json")
    @PreAuthorize("hasRole('ADMIN') or @leccionPermisos.esInstructorDelModulo(#idModulo)")
    public ResponseEntity<?> reordenar(@PathVariable String idModulo,
                                       @RequestBody ReordenarRequest body) {
        if (body == null || body.ids() == null || body.ids().isEmpty()) {
            return ResponseEntity.badRequest().body("Debes enviar 'ids' en el orden deseado.");
        }
        try {
            List<Leccion> result = leccionServicio.reordenarSecuencial(idModulo, body.ids());
            return ResponseEntity.ok(result);
        } catch (IllegalArgumentException e) {
            return ResponseEntity.badRequest().body(e.getMessage());
        }
    }

    @PatchMapping(value = "/{id}", consumes = "application/json", produces = "application/json")
    @PreAuthorize("hasRole('ADMIN') or @leccionPermisos.esInstructorDelModulo(#idModulo)")
    public ResponseEntity<?> patchParcial(@PathVariable String idModulo,
                                          @PathVariable String id,
                                          @RequestBody PatchLeccion body) {
        Leccion actual = leccionServicio.obtener(id);
        if (actual == null) return ResponseEntity.notFound().build();
        if (!idModulo.equals(actual.getIdModulo()))
            return ResponseEntity.status(404).body("La lección no pertenece al módulo especificado.");

        if (body.tipo() != null && body.tipo() != TipoLeccion.QUIZ) {
            String url = body.urlContenido() != null ? body.urlContenido() : actual.getUrlContenido();
            if (url == null || url.isBlank()) {
                return ResponseEntity.badRequest().body("urlContenido es obligatorio para VIDEO/ARTICULO.");
            }
        }
        if (body.duracion() != null && body.duracion() < 0) {
            return ResponseEntity.badRequest().body("La duración no puede ser negativa.");
        }

        Leccion res = leccionServicio.patchParcial(
                actual, body.titulo(), body.tipo(), body.urlContenido(), body.duracion()
        );
        return ResponseEntity.ok(res);
    }

    public static record CambiarOrdenRequest(@Min(1) Integer orden) {}
    public static record MoverRequest(Integer delta, String direccion) {}
    public static record ReordenarRequest(List<@NotBlank String> ids) {}
    public static record PatchLeccion(String titulo, TipoLeccion tipo, String urlContenido, Integer duracion) {}
}

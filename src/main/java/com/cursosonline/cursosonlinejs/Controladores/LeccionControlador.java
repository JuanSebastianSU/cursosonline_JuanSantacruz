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
import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.web.bind.annotation.*;

import java.net.URI;
import java.util.List;
import java.util.NoSuchElementException;

// Swagger / OpenAPI
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.Parameter;
import io.swagger.v3.oas.annotations.media.ArraySchema;
import io.swagger.v3.oas.annotations.media.Content;
import io.swagger.v3.oas.annotations.media.Schema;
import io.swagger.v3.oas.annotations.responses.ApiResponse;
import io.swagger.v3.oas.annotations.responses.ApiResponses;
import io.swagger.v3.oas.annotations.security.SecurityRequirement;
import io.swagger.v3.oas.annotations.tags.Tag;

@RestController
@RequestMapping("/api/v1/modulos/{idModulo}/lecciones")
@CrossOrigin(origins = "http://localhost:9090", allowCredentials = "true")
@Tag(
        name = "Lecciones",
        description = "Gestión de lecciones dentro de un módulo (creación, publicación, orden, etc.)."
)
@SecurityRequirement(name = "bearerAuth")
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

    // =========================================================
    // CREAR
    // =========================================================
    @Operation(
            summary = "Crear lección en un módulo",
            description = """
                    Crea una nueva lección dentro de un módulo.
                    Solo el INSTRUCTOR del módulo o un ADMIN pueden crear lecciones.
                    Para tipos VIDEO/ARTICULO es obligatorio 'urlContenido'.
                    """
    )
    @ApiResponses({
            @ApiResponse(responseCode = "201", description = "Lección creada correctamente",
                    content = @Content(schema = @Schema(implementation = Leccion.class))),
            @ApiResponse(responseCode = "400", description = "Datos inválidos"),
            @ApiResponse(responseCode = "401", description = "No autenticado"),
            @ApiResponse(responseCode = "403", description = "No autorizado para crear lecciones en este módulo"),
            @ApiResponse(responseCode = "409", description = "Conflicto de orden en el módulo")
    })
    @PostMapping(consumes = "application/json", produces = "application/json")
    @PreAuthorize("hasRole('ADMIN') or @leccionPermisos.esInstructorDelModulo(#idModulo)")
    public ResponseEntity<?> crearLeccion(
            @Parameter(description = "ID del módulo", example = "mod_123456")
            @PathVariable String idModulo,
            @io.swagger.v3.oas.annotations.parameters.RequestBody(
                    description = "Datos de la lección a crear",
                    required = true,
                    content = @Content(schema = @Schema(implementation = Leccion.class))
            )
            @Valid @RequestBody Leccion body
    ) {
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

    // =========================================================
    // LISTAR (ALUMNO + INSTRUCTOR + ADMIN)
    // =========================================================
    @Operation(
            summary = "Listar lecciones de un módulo",
            description = """
                    Lista las lecciones de un módulo.
                    - Alumnos: solo ven lecciones PUBLICADAS y no archivadas, si el curso/módulo están activos.
                    - Instructores y ADMIN: ven todas las lecciones del módulo.
                    """
    )
    @ApiResponses({
            @ApiResponse(responseCode = "200", description = "Listado de lecciones",
                    content = @Content(array = @ArraySchema(schema = @Schema(implementation = Leccion.class)))),
            @ApiResponse(responseCode = "401", description = "No autenticado"),
            @ApiResponse(responseCode = "403", description = "Contenido archivado"),
            @ApiResponse(responseCode = "404", description = "Curso o módulo no encontrado")
    })
    @GetMapping(produces = "application/json")
    @PreAuthorize("isAuthenticated()")
    public ResponseEntity<?> listarLecciones(
            @Parameter(description = "ID del módulo", example = "mod_123456")
            @PathVariable String idModulo
    ) {
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

    // =========================================================
    // OBTENER (ALUMNO + INSTRUCTOR + ADMIN)
    // =========================================================
    @Operation(
            summary = "Obtener detalles de una lección",
            description = """
                    Devuelve una lección específica.
                    - Alumnos: solo pueden ver lecciones PUBLICADAS y no archivadas.
                    - Instructores/ADMIN: pueden ver cualquier estado.
                    """
    )
    @ApiResponses({
            @ApiResponse(responseCode = "200", description = "Lección encontrada",
                    content = @Content(schema = @Schema(implementation = Leccion.class))),
            @ApiResponse(responseCode = "401", description = "No autenticado"),
            @ApiResponse(responseCode = "403", description = "Contenido archivado"),
            @ApiResponse(responseCode = "404", description = "Lección, módulo o curso no encontrado")
    })
    @GetMapping(value = "/{id}", produces = "application/json")
    @PreAuthorize("isAuthenticated()")
    public ResponseEntity<?> obtenerLeccion(
            @Parameter(description = "ID del módulo", example = "mod_123456")
            @PathVariable String idModulo,
            @Parameter(description = "ID de la lección", example = "lec_123456")
            @PathVariable String id
    ) {
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

    // =========================================================
    // RESTO CRUD (solo instructor/admin)
    // =========================================================
    @Operation(
            summary = "Actualizar completamente una lección",
            description = "Actualiza los datos principales de una lección (título, tipo, URL, duración, orden)."
    )
    @ApiResponses({
            @ApiResponse(responseCode = "200", description = "Lección actualizada correctamente",
                    content = @Content(schema = @Schema(implementation = Leccion.class))),
            @ApiResponse(responseCode = "404", description = "Lección o módulo no encontrado"),
            @ApiResponse(responseCode = "409", description = "Conflicto de orden en el módulo")
    })
    @PutMapping(value = "/{id}", consumes = "application/json", produces = "application/json")
    @PreAuthorize("hasRole('ADMIN') or @leccionPermisos.esInstructorDelModulo(#idModulo)")
    public ResponseEntity<?> actualizarLeccion(
            @Parameter(description = "ID del módulo", example = "mod_123456")
            @PathVariable String idModulo,
            @Parameter(description = "ID de la lección", example = "lec_123456")
            @PathVariable String id,
            @io.swagger.v3.oas.annotations.parameters.RequestBody(
                    description = "Datos a actualizar de la lección",
                    required = true,
                    content = @Content(schema = @Schema(implementation = Leccion.class))
            )
            @Valid @RequestBody Leccion body
    ) {
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

    @Operation(
            summary = "Publicar lección",
            description = "Marca la lección como PUBLICADA para que los estudiantes puedan verla."
    )
    @ApiResponses({
            @ApiResponse(responseCode = "200", description = "Lección publicada correctamente",
                    content = @Content(schema = @Schema(implementation = Leccion.class))),
            @ApiResponse(responseCode = "404", description = "Lección o módulo no encontrado")
    })
    @PatchMapping("/{id}/publicar")
    @PreAuthorize("hasRole('ADMIN') or @leccionPermisos.esInstructorDelModulo(#idModulo)")
    public ResponseEntity<?> publicar(
            @Parameter(description = "ID del módulo", example = "mod_123456")
            @PathVariable String idModulo,
            @Parameter(description = "ID de la lección", example = "lec_123456")
            @PathVariable String id
    ) {
        var l = leccionServicio.obtener(id);
        if (l == null) return ResponseEntity.notFound().build();
        if (!idModulo.equals(l.getIdModulo())) {
            return ResponseEntity.status(404).body("La lección no pertenece al módulo especificado.");
        }

        return leccionServicio.publicar(id)
                .<ResponseEntity<?>>map(ResponseEntity::ok)
                .orElseGet(() -> ResponseEntity.notFound().build());
    }

    @Operation(
            summary = "Archivar lección",
            description = "Marca la lección como ARCHIVADA. No será visible para estudiantes."
    )
    @ApiResponses({
            @ApiResponse(responseCode = "200", description = "Lección archivada correctamente",
                    content = @Content(schema = @Schema(implementation = Leccion.class))),
            @ApiResponse(responseCode = "404", description = "Lección o módulo no encontrado")
    })
    @PatchMapping("/{id}/archivar")
    @PreAuthorize("hasRole('ADMIN') or @leccionPermisos.esInstructorDelModulo(#idModulo)")
    public ResponseEntity<?> archivar(
            @Parameter(description = "ID del módulo", example = "mod_123456")
            @PathVariable String idModulo,
            @Parameter(description = "ID de la lección", example = "lec_123456")
            @PathVariable String id
    ) {
        var l = leccionServicio.obtener(id);
        if (l == null) return ResponseEntity.notFound().build();
        if (!idModulo.equals(l.getIdModulo())) {
            return ResponseEntity.status(404).body("La lección no pertenece al módulo especificado.");
        }
        return leccionServicio.archivar(id)
                .<ResponseEntity<?>>map(ResponseEntity::ok)
                .orElseGet(() -> ResponseEntity.notFound().build());
    }

    @Operation(
            summary = "Eliminar lección",
            description = "Elimina una lección de un módulo. Solo instructor del módulo o ADMIN."
    )
    @ApiResponses({
            @ApiResponse(responseCode = "204", description = "Lección eliminada correctamente"),
            @ApiResponse(responseCode = "404", description = "Lección o módulo no encontrado")
    })
    @DeleteMapping("/{id}")
    @PreAuthorize("hasRole('ADMIN') or @leccionPermisos.esInstructorDelModulo(#idModulo)")
    public ResponseEntity<?> eliminarLeccion(
            @Parameter(description = "ID del módulo", example = "mod_123456")
            @PathVariable String idModulo,
            @Parameter(description = "ID de la lección", example = "lec_123456")
            @PathVariable String id
    ) {
        Leccion actual = leccionServicio.obtener(id);
        if (actual == null) return ResponseEntity.notFound().build();
        if (!idModulo.equals(actual.getIdModulo())) {
            return ResponseEntity.status(404).body("La lección no pertenece al módulo especificado.");
        }
        leccionServicio.eliminar(id);
        return ResponseEntity.noContent().build();
    }

    @Operation(
            summary = "Cambiar orden de una lección",
            description = "Cambia el número de orden de una lección dentro del módulo."
    )
    @ApiResponses({
            @ApiResponse(responseCode = "200", description = "Orden actualizado correctamente",
                    content = @Content(schema = @Schema(implementation = Leccion.class))),
            @ApiResponse(responseCode = "400", description = "Petición inválida"),
            @ApiResponse(responseCode = "404", description = "Lección o módulo no encontrado"),
            @ApiResponse(responseCode = "409", description = "Conflicto de orden")
    })
    @PatchMapping(value = "/{id}/orden", consumes = "application/json", produces = "application/json")
    @PreAuthorize("hasRole('ADMIN') or @leccionPermisos.esInstructorDelModulo(#idModulo)")
    public ResponseEntity<?> cambiarOrden(
            @Parameter(description = "ID del módulo", example = "mod_123456")
            @PathVariable String idModulo,
            @Parameter(description = "ID de la lección", example = "lec_123456")
            @PathVariable String id,
            @io.swagger.v3.oas.annotations.parameters.RequestBody(
                    description = "Nuevo orden de la lección",
                    required = true,
                    content = @Content(schema = @Schema(implementation = CambiarOrdenRequest.class))
            )
            @RequestBody CambiarOrdenRequest body
    ) {
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

    @Operation(
            summary = "Mover lección en el orden",
            description = "Mueve una lección hacia arriba o abajo en el orden mediante 'delta' o 'direccion'."
    )
    @ApiResponses({
            @ApiResponse(responseCode = "200", description = "Lección movida correctamente",
                    content = @Content(schema = @Schema(implementation = Leccion.class))),
            @ApiResponse(responseCode = "400", description = "Petición inválida"),
            @ApiResponse(responseCode = "404", description = "Lección o módulo no encontrado")
    })
    @PatchMapping(value = "/{id}/mover", consumes = "application/json", produces = "application/json")
    @PreAuthorize("hasRole('ADMIN') or @leccionPermisos.esInstructorDelModulo(#idModulo)")
    public ResponseEntity<?> mover(
            @Parameter(description = "ID del módulo", example = "mod_123456")
            @PathVariable String idModulo,
            @Parameter(description = "ID de la lección", example = "lec_123456")
            @PathVariable String id,
            @io.swagger.v3.oas.annotations.parameters.RequestBody(
                    description = "Delta (+/-1) o dirección ('up'/'down') para mover la lección",
                    required = true,
                    content = @Content(schema = @Schema(implementation = MoverRequest.class))
            )
            @RequestBody MoverRequest body
    ) {
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
            Leccion result = leccionServicio.moverPorDelta(idModulo, id, delta);
            return ResponseEntity.ok(result);
        } catch (NoSuchElementException e) {
            return ResponseEntity.notFound().build();
        } catch (IllegalArgumentException e) {
            return ResponseEntity.status(404).body(e.getMessage());
        }
    }

    @Operation(
            summary = "Reordenar lecciones de un módulo",
            description = "Reordena todas las lecciones del módulo según la lista de IDs enviada."
    )
    @ApiResponses({
            @ApiResponse(responseCode = "200", description = "Lecciones reordenadas correctamente",
                    content = @Content(array = @ArraySchema(schema = @Schema(implementation = Leccion.class)))),
            @ApiResponse(responseCode = "400", description = "Petición inválida")
    })
    @PatchMapping(value = "/orden", consumes = "application/json", produces = "application/json")
    @PreAuthorize("hasRole('ADMIN') or @leccionPermisos.esInstructorDelModulo(#idModulo)")
    public ResponseEntity<?> reordenar(
            @Parameter(description = "ID del módulo", example = "mod_123456")
            @PathVariable String idModulo,
            @io.swagger.v3.oas.annotations.parameters.RequestBody(
                    description = "Listado de IDs de lecciones en el orden deseado",
                    required = true,
                    content = @Content(schema = @Schema(implementation = ReordenarRequest.class))
            )
            @RequestBody ReordenarRequest body
    ) {
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

    @Operation(
            summary = "Actualización parcial de lección",
            description = "Permite actualizar parcialmente título, tipo, URL de contenido y duración."
    )
    @ApiResponses({
            @ApiResponse(responseCode = "200", description = "Lección actualizada parcialmente",
                    content = @Content(schema = @Schema(implementation = Leccion.class))),
            @ApiResponse(responseCode = "400", description = "Datos inválidos"),
            @ApiResponse(responseCode = "404", description = "Lección o módulo no encontrado")
    })
    @PatchMapping(value = "/{id}", consumes = "application/json", produces = "application/json")
    @PreAuthorize("hasRole('ADMIN') or @leccionPermisos.esInstructorDelModulo(#idModulo)")
    public ResponseEntity<?> patchParcial(
            @Parameter(description = "ID del módulo", example = "mod_123456")
            @PathVariable String idModulo,
            @Parameter(description = "ID de la lección", example = "lec_123456")
            @PathVariable String id,
            @io.swagger.v3.oas.annotations.parameters.RequestBody(
                    description = "Datos parciales a actualizar en la lección",
                    required = true,
                    content = @Content(schema = @Schema(implementation = PatchLeccion.class))
            )
            @RequestBody PatchLeccion body
    ) {
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

    // ================== DTOs ==================

    @Schema(description = "Petición para cambiar el orden de una lección")
    public static record CambiarOrdenRequest(
            @Schema(description = "Nuevo número de orden (>=1)", example = "2")
            @Min(1) Integer orden
    ) {}

    @Schema(description = "Petición para mover una lección en el orden")
    public static record MoverRequest(
            @Schema(description = "Delta de movimiento (+/-1). Se ignora si se especifica 'direccion'.", example = "1")
            Integer delta,
            @Schema(description = "Dirección del movimiento: 'up'/'down' o 'arriba'/'abajo'", example = "down")
            String direccion
    ) {}

    @Schema(description = "Petición para reordenar las lecciones de un módulo")
    public static record ReordenarRequest(
            @Schema(description = "Lista de IDs de lección en el orden deseado")
            List<@NotBlank String> ids
    ) {}

    @Schema(description = "Datos parciales para actualizar una lección")
    public static record PatchLeccion(
            @Schema(description = "Nuevo título de la lección", example = "Introducción a Java")
            String titulo,
            @Schema(description = "Tipo de lección (VIDEO, ARTICULO, QUIZ)", example = "VIDEO")
            TipoLeccion tipo,
            @Schema(description = "URL del contenido (video/artículo)", example = "https://youtu.be/xxxx")
            String urlContenido,
            @Schema(description = "Duración en minutos", example = "15")
            Integer duracion
    ) {}
}

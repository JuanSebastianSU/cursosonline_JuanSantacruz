package com.cursosonline.cursosonlinejs.Controladores;

import com.cursosonline.cursosonlinejs.Entidades.Inscripcion;
import com.cursosonline.cursosonlinejs.Servicios.CursoServicio;
import com.cursosonline.cursosonlinejs.Servicios.InscripcionServicio;
import jakarta.validation.Valid;
import jakarta.validation.constraints.NotBlank;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.GrantedAuthority;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.web.bind.annotation.*;

import java.net.URI;
import java.time.Instant;
import java.util.List;
import java.util.Map;

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
@RequestMapping("/api/v1/cursos/{idCurso}/inscripciones")
@CrossOrigin(origins = "http://localhost:9090", allowCredentials = "true")
@Tag(
        name = "Inscripciones",
        description = "Gestión de inscripciones de estudiantes en cursos."
)
@SecurityRequirement(name = "bearerAuth")
public class InscripcionControlador {

    private final InscripcionServicio inscripcionServicio;
    private final CursoServicio cursoServicio;

    public InscripcionControlador(InscripcionServicio inscripcionServicio,
                                  CursoServicio cursoServicio) {
        this.inscripcionServicio = inscripcionServicio;
        this.cursoServicio = cursoServicio;
    }

    @Operation(
            summary = "Inscribir estudiante autenticado en un curso",
            description = """
                    Crea una inscripción para el usuario autenticado en el curso indicado.
                    Valida que el curso permita inscripciones, tenga cupo disponible y que no exista ya
                    una inscripción activa para ese estudiante en este curso.
                    """
    )
    @ApiResponses({
            @ApiResponse(responseCode = "201", description = "Inscripción creada correctamente",
                    content = @Content(schema = @Schema(implementation = Inscripcion.class))),
            @ApiResponse(responseCode = "401", description = "No autenticado"),
            @ApiResponse(responseCode = "403", description = "El curso no acepta inscripciones"),
            @ApiResponse(responseCode = "409", description = "Cupo completo o inscripción ya existente")
    })
    @PostMapping(produces = "application/json")
    @PreAuthorize("isAuthenticated()")
    public ResponseEntity<?> inscribirEstudiante(
            @Parameter(description = "ID del curso en el que se desea inscribir", example = "c_123456")
            @PathVariable String idCurso
    ) {
        var idEstudianteOpt = inscripcionServicio.obtenerIdEstudianteActual();
        if (idEstudianteOpt.isEmpty()) {
            return ResponseEntity.status(401).body(Map.of("message","No autenticado."));
        }

        String idEstudiante = idEstudianteOpt.get();

        if (!cursoServicio.puedeInscribirse(idCurso)) {
            return ResponseEntity.status(403).body(Map.of(
                    "message","Este curso no acepta inscripciones (no publicado o fuera de ventana)."
            ));
        }
        if (!cursoServicio.cupoDisponible(idCurso)) {
            return ResponseEntity.status(409).body(Map.of(
                    "message","Cupo completo. No es posible inscribirse."
            ));
        }
        if (inscripcionServicio.existeActiva(idCurso, idEstudiante)) {
            return ResponseEntity.status(409).body(Map.of(
                    "message","Ya tienes una inscripción activa en este curso."
            ));
        }

        Inscripcion creada = new Inscripcion();
        creada.setIdCurso(idCurso);
        creada.setIdEstudiante(idEstudiante);
        creada.setEstado(Inscripcion.EstadoInscripcion.PENDIENTE_PAGO);
        creada.setAccessStartAt(Instant.now());
        creada = inscripcionServicio.guardar(creada);

        URI location = URI.create("/api/v1/cursos/" + idCurso + "/inscripciones/" + creada.getId());
        return ResponseEntity.created(location).body(creada);
    }

    @Operation(
            summary = "Listar inscripciones de un curso",
            description = """
                    Devuelve las inscripciones de un curso. Solo disponible para ADMIN o el INSTRUCTOR del curso.
                    Se puede filtrar opcionalmente por estado.
                    """
    )
    @ApiResponses({
            @ApiResponse(responseCode = "200", description = "Listado de inscripciones",
                    content = @Content(array = @ArraySchema(schema = @Schema(implementation = Inscripcion.class)))),
            @ApiResponse(responseCode = "403", description = "No autorizado para ver inscripciones")
    })
    @GetMapping(produces = "application/json")
    @PreAuthorize("hasRole('ADMIN') or @inscPermisos.esInstructorDelCurso(#idCurso)")
    public ResponseEntity<List<Inscripcion>> listarInscripciones(
            @Parameter(description = "ID del curso", example = "c_123456")
            @PathVariable String idCurso,
            @Parameter(description = "Estado de la inscripción (opcional)", example = "activa")
            @RequestParam(required = false) String estado
    ) {
        List<Inscripcion> data = (estado == null || estado.isBlank())
                ? inscripcionServicio.listarPorCurso(idCurso)
                : inscripcionServicio.listarPorCursoYEstado(idCurso, estado.trim().toLowerCase());
        return ResponseEntity.ok(data);
    }

    @Operation(
            summary = "Obtener detalles de una inscripción",
            description = "Devuelve una inscripción específica de un curso. Solo ADMIN o INSTRUCTOR del curso."
    )
    @ApiResponses({
            @ApiResponse(responseCode = "200", description = "Inscripción encontrada",
                    content = @Content(schema = @Schema(implementation = Inscripcion.class))),
            @ApiResponse(responseCode = "404", description = "Inscripción no encontrada")
    })
    @GetMapping(value = "/{id}", produces = "application/json")
    @PreAuthorize("hasRole('ADMIN') or @inscPermisos.esInstructorDelCurso(#idCurso)")
    public ResponseEntity<?> obtenerInscripcion(
            @Parameter(description = "ID del curso", example = "c_123456")
            @PathVariable String idCurso,
            @Parameter(description = "ID de la inscripción", example = "insc_123456")
            @PathVariable String id
    ) {
        return inscripcionServicio.obtenerPorIdYCurso(id, idCurso)
                .<ResponseEntity<?>>map(ResponseEntity::ok)
                .orElseGet(() -> ResponseEntity.notFound().build());
    }

    @Operation(
            summary = "Actualizar estado de una inscripción",
            description = """
                    Cambia el estado de una inscripción (activa, completada, cancelada, pendiente_pago, suspendida, expirada).
                    Solo ADMIN o INSTRUCTOR del curso. Marcar como COMPLETADA requiere ser ADMIN o INSTRUCTOR.
                    """
    )
    @ApiResponses({
            @ApiResponse(responseCode = "200", description = "Estado actualizado correctamente",
                    content = @Content(schema = @Schema(implementation = Inscripcion.class))),
            @ApiResponse(responseCode = "400", description = "Estado inválido"),
            @ApiResponse(responseCode = "403", description = "No autorizado para cambiar a COMPLETADA"),
            @ApiResponse(responseCode = "404", description = "Inscripción no encontrada")
    })
    @PatchMapping(value = "/{id}/estado", consumes = "application/json", produces = "application/json")
    @PreAuthorize("hasRole('ADMIN') or @inscPermisos.esInstructorDelCurso(#idCurso)")
    public ResponseEntity<?> actualizarEstado(
            @Parameter(description = "ID del curso", example = "c_123456")
            @PathVariable String idCurso,
            @Parameter(description = "ID de la inscripción", example = "insc_123456")
            @PathVariable String id,
            @io.swagger.v3.oas.annotations.parameters.RequestBody(
                    description = "Nuevo estado de la inscripción",
                    required = true,
                    content = @Content(schema = @Schema(implementation = EstadoRequest.class))
            )
            @RequestBody @Valid EstadoRequest body
    ) {
        var inscOpt = inscripcionServicio.obtenerPorIdYCurso(id, idCurso);
        if (inscOpt.isEmpty()) return ResponseEntity.notFound().build();

        var insc = inscOpt.get();
        var antes = insc.getEstado();

        Inscripcion.EstadoInscripcion nuevo;
        try {
            nuevo = parseEstado(body.estado());
        } catch (IllegalArgumentException ex) {
            return ResponseEntity.badRequest().body(Map.of("message", ex.getMessage()));
        }

        if (!inscripcionServicio.estadoPermitido(nuevo)) {
            return ResponseEntity.badRequest().body(Map.of(
                    "message","Estado inválido. Usa: activa | completada | cancelada | pendiente_pago | suspendida | expirada"
            ));
        }

        if (nuevo == Inscripcion.EstadoInscripcion.COMPLETADA) {
            if (!esAdmin() && !esInstructorDelCurso(idCurso)) {
                return ResponseEntity.status(403).body(Map.of(
                        "message", "Solo ADMIN o el INSTRUCTOR del curso pueden marcar como COMPLETADA."
                ));
            }
        }

        var actualizada = inscripcionServicio.actualizarEstado(id, nuevo.name());

        if (antes != Inscripcion.EstadoInscripcion.ACTIVA && nuevo == Inscripcion.EstadoInscripcion.ACTIVA) {
            cursoServicio.incInscritosCount(idCurso, +1);
        } else if (antes == Inscripcion.EstadoInscripcion.ACTIVA && nuevo != Inscripcion.EstadoInscripcion.ACTIVA) {
            cursoServicio.incInscritosCount(idCurso, -1);
        }

        return ResponseEntity.ok(actualizada);
    }

    @Operation(
            summary = "Cancelar / eliminar inscripción",
            description = """
                    Elimina una inscripción. 
                    - ADMIN puede eliminar cualquiera.
                    - Un estudiante puede eliminar solamente su propia inscripción (según la lógica de @inscPermisos.esInscripcionPropia).
                    """
    )
    @ApiResponses({
            @ApiResponse(responseCode = "204", description = "Inscripción eliminada correctamente"),
            @ApiResponse(responseCode = "404", description = "Inscripción no encontrada")
    })
    @DeleteMapping("/{id}")
    @PreAuthorize("hasRole('ADMIN') or @inscPermisos.esInscripcionPropia(#id)")
    public ResponseEntity<?> cancelar(
            @Parameter(description = "ID del curso", example = "c_123456")
            @PathVariable String idCurso,
            @Parameter(description = "ID de la inscripción", example = "insc_123456")
            @PathVariable String id
    ) {
        var inscOpt = inscripcionServicio.obtenerPorIdYCurso(id, idCurso);
        if (inscOpt.isEmpty()) return ResponseEntity.notFound().build();
        inscripcionServicio.eliminar(id);
        return ResponseEntity.noContent().build();
    }

    @Operation(
            summary = "Contador de inscripciones activas",
            description = "Devuelve el número de inscripciones ACTIVAS en un curso."
    )
    @ApiResponses({
            @ApiResponse(responseCode = "200", description = "Contador devuelto correctamente",
                    content = @Content(schema = @Schema(
                            example = "{\"cursoId\": \"c_123456\", \"inscritosActivos\": 42}"
                    )))
    })
    @GetMapping("/contador")
    public ResponseEntity<?> contador(
            @Parameter(description = "ID del curso", example = "c_123456")
            @PathVariable String idCurso
    ) {
        long total = inscripcionServicio.contarActivasPorCurso(idCurso);
        return ResponseEntity.ok(Map.of("cursoId", idCurso, "inscritosActivos", total));
    }

    @Schema(description = "Petición para cambiar el estado de una inscripción")
    public static record EstadoRequest(
            @Schema(description = "Nuevo estado", example = "activa")
            @NotBlank String estado
    ) {}

    // ================== HELPERS ==================

    private static Inscripcion.EstadoInscripcion parseEstado(String raw) {
        if (raw == null) throw new IllegalArgumentException("El estado es obligatorio");
        switch (raw.trim().toLowerCase()) {
            case "activa":      return Inscripcion.EstadoInscripcion.ACTIVA;
            case "completada":  return Inscripcion.EstadoInscripcion.COMPLETADA;
            case "cancelada":   return Inscripcion.EstadoInscripcion.CANCELADA;
            case "pendiente_pago":
            case "pendiente-pago":
            case "pendiente":   return Inscripcion.EstadoInscripcion.PENDIENTE_PAGO;
            case "suspendida":  return Inscripcion.EstadoInscripcion.SUSPENDIDA;
            case "expirada":    return Inscripcion.EstadoInscripcion.EXPIRADA;
            default:
                throw new IllegalArgumentException("Estado inválido: " + raw);
        }
    }

    private boolean esAdmin() {
        Authentication auth = SecurityContextHolder.getContext().getAuthentication();
        if (auth == null) return false;
        for (GrantedAuthority ga : auth.getAuthorities()) {
            if ("ROLE_ADMIN".equals(ga.getAuthority())) return true;
        }
        return false;
    }

    private boolean esInstructorDelCurso(String idCurso) {
        return cursoServicio.obtenerPorId(idCurso)
                .map(c -> {
                    var auth = SecurityContextHolder.getContext().getAuthentication();
                    if (auth == null || auth.getName() == null) return false;
                    try {
                        var userId = inscripcionServicio.obtenerIdEstudianteActual().orElse(null);
                        return userId != null && userId.equals(c.getIdInstructor());
                    } catch (Exception ex) {
                        return false;
                    }
                })
                .orElse(false);
    }
}

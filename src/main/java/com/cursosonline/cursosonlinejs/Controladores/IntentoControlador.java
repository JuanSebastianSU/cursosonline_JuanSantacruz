package com.cursosonline.cursosonlinejs.Controladores;

import com.cursosonline.cursosonlinejs.Entidades.Intento;
import com.cursosonline.cursosonlinejs.Servicios.IntentoServicio;

import jakarta.validation.Valid;
import jakarta.validation.constraints.PositiveOrZero;
import java.math.BigDecimal;

import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import java.net.URI;
import java.time.Instant;
import java.util.List;

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
@RequestMapping("/api/v1/evaluaciones/{idEvaluacion}/intentos")
@CrossOrigin(origins = "http://localhost:9090", allowCredentials = "true")
@Tag(
        name = "Intentos",
        description = "Gestión de intentos de evaluaciones por parte de los estudiantes."
)
@SecurityRequirement(name = "bearerAuth")
public class IntentoControlador {

    private final IntentoServicio intentoServicio;

    public IntentoControlador(IntentoServicio intentoServicio) {
        this.intentoServicio = intentoServicio;
    }

    // ============================
    // INICIAR INTENTO
    // ============================
    @Operation(
            summary = "Iniciar un intento de evaluación",
            description = """
                    Crea un intento en estado EN_PROGRESO para el estudiante autenticado.
                    Si ya existe un intento en progreso para esa evaluación, devuelve 409.
                    Se puede opcionalmente indicar un límite de tiempo en segundos y un puntaje máximo.
                    """
    )
    @ApiResponses({
            @ApiResponse(responseCode = "201", description = "Intento creado correctamente",
                    content = @Content(schema = @Schema(implementation = Intento.class))),
            @ApiResponse(responseCode = "401", description = "No autenticado"),
            @ApiResponse(responseCode = "409", description = "Ya existe un intento en progreso")
    })
    @PostMapping(consumes = "application/json", produces = "application/json")
    @PreAuthorize("isAuthenticated()")
    public ResponseEntity<?> iniciar(
            @Parameter(description = "ID de la evaluación", example = "eval_123456")
            @PathVariable String idEvaluacion,
            @io.swagger.v3.oas.annotations.parameters.RequestBody(
                    description = "Parámetros opcionales para iniciar el intento (límite de tiempo, puntaje máximo)",
                    required = false,
                    content = @Content(schema = @Schema(implementation = IniciarIntentoRequest.class))
            )
            @RequestBody(required = false) IniciarIntentoRequest body
    ) {
        String idEstudiante = intentoServicio.obtenerIdEstudianteActual().orElse(null);
        if (idEstudiante == null) return ResponseEntity.status(401).body("No autenticado.");

        if (intentoServicio.tieneIntentoEnProgreso(idEvaluacion, idEstudiante)) {
            return ResponseEntity.status(409).body("Ya tienes un intento en progreso para esta evaluación.");
        }

        var req = (body == null) ? new IniciarIntentoRequest(null, null) : body;
        Intento creado = intentoServicio.crearEnProgreso(
                idEvaluacion, idEstudiante, req.timeLimitSeconds(), req.puntajeMaximo()
        );

        URI location = URI.create("/api/v1/evaluaciones/" + idEvaluacion + "/intentos/" + creado.getId());
        return ResponseEntity.created(location).body(creado);
    }

    // ============================
    // ENTREGAR
    // ============================
    @Operation(
            summary = "Entregar un intento de evaluación",
            description = """
                    Entrega un intento: se registran las respuestas, el tiempo usado y se marca la fecha de entrega.
                    Pueden ejecutar este endpoint:
                    - ADMIN
                    - Instructor asociado al intento
                    - Estudiante dueño del intento (según visibilidad).
                    """
    )
    @ApiResponses({
            @ApiResponse(responseCode = "200", description = "Intento entregado correctamente",
                    content = @Content(schema = @Schema(implementation = Intento.class))),
            @ApiResponse(responseCode = "401", description = "No autenticado"),
            @ApiResponse(responseCode = "404", description = "Intento no pertenece a la evaluación indicada")
    })
    @PostMapping(value = "/{idIntento}/entregar", consumes = "application/json", produces = "application/json")
    @PreAuthorize("hasRole('ADMIN') " +
            "or @intPermisos.esInstructorDeIntento(#idIntento) " +
            "or @intPermisos.esDuenoDeIntentoConVisibilidad(#idIntento)")
    public ResponseEntity<?> entregar(
            @Parameter(description = "ID de la evaluación", example = "eval_123456")
            @PathVariable String idEvaluacion,
            @Parameter(description = "ID del intento a entregar", example = "int_123456")
            @PathVariable String idIntento,
            @io.swagger.v3.oas.annotations.parameters.RequestBody(
                    description = "Respuestas del intento y tiempo usado",
                    required = true,
                    content = @Content(schema = @Schema(implementation = EntregaRequest.class))
            )
            @Valid @RequestBody EntregaRequest body
    ) {
        String idEstudiante = intentoServicio.obtenerIdEstudianteActual().orElse(null);
        if (idEstudiante == null) return ResponseEntity.status(401).body("No autenticado.");

        var entregado = intentoServicio.entregar(
                idIntento, idEstudiante, body.respuestas(), body.tiempoSegundos(), Instant.now()
        );
        if (!idEvaluacion.equals(entregado.getIdEvaluacion())) {
            return ResponseEntity.status(404).body("El intento no pertenece a la evaluación indicada.");
        }
        return ResponseEntity.ok(entregado);
    }

    // ============================
    // LISTAR TODOS (ADMIN/INSTRUCTOR)
    // ============================
    @Operation(
            summary = "Listar todos los intentos de una evaluación",
            description = """
                    Lista todos los intentos registrados para una evaluación.
                    Solo para ADMIN o el INSTRUCTOR de la evaluación.
                    Se puede filtrar opcionalmente por estado.
                    """
    )
    @ApiResponses({
            @ApiResponse(responseCode = "200", description = "Listado de intentos",
                    content = @Content(array = @ArraySchema(schema = @Schema(implementation = Intento.class)))),
            @ApiResponse(responseCode = "204", description = "No hay intentos para la evaluación"),
            @ApiResponse(responseCode = "403", description = "No autorizado")
    })
    @GetMapping(value = "/todos", produces = "application/json")
    @PreAuthorize("hasRole('ADMIN') or @intPermisos.esInstructorDeEvaluacion(#idEvaluacion)")
    public ResponseEntity<?> listarTodos(
            @Parameter(description = "ID de la evaluación", example = "eval_123456")
            @PathVariable String idEvaluacion,
            @Parameter(description = "Estado del intento (opcional)", example = "EN_PROGRESO")
            @RequestParam(required = false) String estado
    ) {
        var lista = intentoServicio.listarTodosPorEvaluacion(idEvaluacion, estado);
        if (lista.isEmpty()) return ResponseEntity.noContent().build();
        return ResponseEntity.ok(lista);
    }

    // ============================
    // LISTAR MIS INTENTOS
    // ============================
    @Operation(
            summary = "Listar intentos del estudiante autenticado",
            description = "Devuelve los intentos del usuario autenticado para una evaluación determinada."
    )
    @ApiResponses({
            @ApiResponse(responseCode = "200", description = "Listado de intentos del estudiante",
                    content = @Content(array = @ArraySchema(schema = @Schema(implementation = Intento.class)))),
            @ApiResponse(responseCode = "401", description = "No autenticado")
    })
    @GetMapping(produces = "application/json")
    @PreAuthorize("isAuthenticated()")
    public ResponseEntity<?> listar(
            @Parameter(description = "ID de la evaluación", example = "eval_123456")
            @PathVariable String idEvaluacion
    ) {
        String idEstudiante = intentoServicio.obtenerIdEstudianteActual().orElse(null);
        if (idEstudiante == null) return ResponseEntity.status(401).body("No autenticado.");
        List<Intento> intentos = intentoServicio.listarPorEvaluacionYEstudiante(idEvaluacion, idEstudiante);
        return ResponseEntity.ok(intentos);
    }

    // ============================
    // OBTENER UN INTENTO
    // ============================
    @Operation(
            summary = "Obtener detalles de un intento",
            description = """
                    Devuelve un intento específico por ID. 
                    Puede ser visto por ADMIN, el instructor asociado o el estudiante dueño (según reglas de visibilidad).
                    """
    )
    @ApiResponses({
            @ApiResponse(responseCode = "200", description = "Intento encontrado",
                    content = @Content(schema = @Schema(implementation = Intento.class))),
            @ApiResponse(responseCode = "404", description = "Intento no encontrado o no pertenece a la evaluación indicada")
    })
    @GetMapping(value = "/{idIntento}", produces = "application/json")
    @PreAuthorize("hasRole('ADMIN') " +
            "or @intPermisos.esInstructorDeIntento(#idIntento) " +
            "or @intPermisos.esDuenoDeIntentoConVisibilidad(#idIntento)")
    public ResponseEntity<?> obtener(
            @Parameter(description = "ID de la evaluación", example = "eval_123456")
            @PathVariable String idEvaluacion,
            @Parameter(description = "ID del intento", example = "int_123456")
            @PathVariable String idIntento
    ) {
        var intentoOpt = intentoServicio.obtener(idIntento);
        if (intentoOpt.isEmpty()) return ResponseEntity.notFound().build();

        var intento = intentoOpt.get();
        if (!idEvaluacion.equals(intento.getIdEvaluacion())) {
            return ResponseEntity.status(404).body("El intento no pertenece a la evaluación indicada.");
        }
        return ResponseEntity.ok(intento);
    }

    // ============================
    // ACTUALIZAR COMPLETO
    // ============================
    @Operation(
            summary = "Actualizar completamente un intento",
            description = """
                    Actualiza todas las respuestas y el tiempo usado de un intento.
                    Solo ADMIN o el dueño del intento (según visibilidad) pueden modificarlo.
                    """
    )
    @ApiResponses({
            @ApiResponse(responseCode = "200", description = "Intento actualizado correctamente",
                    content = @Content(schema = @Schema(implementation = Intento.class))),
            @ApiResponse(responseCode = "401", description = "No autenticado"),
            @ApiResponse(responseCode = "404", description = "Intento no encontrado o no pertenece a la evaluación indicada")
    })
    @PutMapping(value = "/{idIntento}", consumes = "application/json", produces = "application/json")
    @PreAuthorize("hasRole('ADMIN') or @intPermisos.esDuenoDeIntentoConVisibilidad(#idIntento)")
    public ResponseEntity<?> actualizar(
            @Parameter(description = "ID de la evaluación", example = "eval_123456")
            @PathVariable String idEvaluacion,
            @Parameter(description = "ID del intento", example = "int_123456")
            @PathVariable String idIntento,
            @io.swagger.v3.oas.annotations.parameters.RequestBody(
                    description = "Contenido completo del intento (respuestas y tiempo usado)",
                    required = true,
                    content = @Content(schema = @Schema(implementation = ActualizarIntentoRequest.class))
            )
            @Valid @RequestBody ActualizarIntentoRequest body
    ) {
        String idEstudiante = intentoServicio.obtenerIdEstudianteActual().orElse(null);
        if (idEstudiante == null) return ResponseEntity.status(401).body("No autenticado.");

        var resp = intentoServicio.actualizarCompleto(
                idIntento, idEstudiante, body.respuestas(), body.usedTimeSeconds()
        ).orElse(null);

        if (resp == null) return ResponseEntity.notFound().build();
        if (!idEvaluacion.equals(resp.getIdEvaluacion())) {
            return ResponseEntity.status(404).body("El intento no pertenece a la evaluación indicada.");
        }
        return ResponseEntity.ok(resp);
    }

    // ============================
    // PATCH PARCIAL
    // ============================
    @Operation(
            summary = "Actualizar parcialmente un intento",
            description = "Permite actualizar parcialmente las respuestas y/o el tiempo usado de un intento."
    )
    @ApiResponses({
            @ApiResponse(responseCode = "200", description = "Intento actualizado parcialmente",
                    content = @Content(schema = @Schema(implementation = Intento.class))),
            @ApiResponse(responseCode = "401", description = "No autenticado"),
            @ApiResponse(responseCode = "404", description = "Intento no encontrado o no pertenece a la evaluación indicada")
    })
    @PatchMapping(value = "/{idIntento}", consumes = "application/json", produces = "application/json")
    @PreAuthorize("hasRole('ADMIN') or @intPermisos.esDuenoDeIntentoConVisibilidad(#idIntento)")
    public ResponseEntity<?> patch(
            @Parameter(description = "ID de la evaluación", example = "eval_123456")
            @PathVariable String idEvaluacion,
            @Parameter(description = "ID del intento", example = "int_123456")
            @PathVariable String idIntento,
            @io.swagger.v3.oas.annotations.parameters.RequestBody(
                    description = "Campos parciales a actualizar",
                    required = false,
                    content = @Content(schema = @Schema(implementation = PatchIntentoRequest.class))
            )
            @RequestBody PatchIntentoRequest body
    ) {
        String idEstudiante = intentoServicio.obtenerIdEstudianteActual().orElse(null);
        if (idEstudiante == null) return ResponseEntity.status(401).body("No autenticado.");

        var resp = intentoServicio.patchParcial(
                idIntento, idEstudiante,
                body == null ? null : body.respuestas(),
                body == null ? null : body.usedTimeSeconds()
        ).orElse(null);

        if (resp == null) return ResponseEntity.notFound().build();
        if (!idEvaluacion.equals(resp.getIdEvaluacion())) {
            return ResponseEntity.status(404).body("El intento no pertenece a la evaluación indicada.");
        }
        return ResponseEntity.ok(resp);
    }

    // ============================
    // ELIMINAR INTENTO PROPIO
    // ============================
    @Operation(
            summary = "Eliminar un intento propio en progreso",
            description = """
                    Elimina un intento si es del estudiante autenticado y se encuentra aún en progreso.
                    ADMIN también puede eliminar.
                    Si el intento ya fue entregado o corregido, se devuelve 409.
                    """
    )
    @ApiResponses({
            @ApiResponse(responseCode = "204", description = "Intento eliminado correctamente"),
            @ApiResponse(responseCode = "401", description = "No autenticado"),
            @ApiResponse(responseCode = "404", description = "Intento no encontrado o no pertenece a la evaluación indicada"),
            @ApiResponse(responseCode = "409", description = "No se puede eliminar el intento por su estado actual")
    })
    @DeleteMapping("/{idIntento}")
    @PreAuthorize("hasRole('ADMIN') or @intPermisos.esDuenoDeIntentoConVisibilidad(#idIntento)")
    public ResponseEntity<?> eliminar(
            @Parameter(description = "ID de la evaluación", example = "eval_123456")
            @PathVariable String idEvaluacion,
            @Parameter(description = "ID del intento", example = "int_123456")
            @PathVariable String idIntento
    ) {
        String idEstudiante = intentoServicio.obtenerIdEstudianteActual().orElse(null);
        if (idEstudiante == null) return ResponseEntity.status(401).body("No autenticado.");

        var encontrado = intentoServicio.obtener(idIntento);
        if (encontrado.isEmpty()) return ResponseEntity.notFound().build();
        if (!idEvaluacion.equals(encontrado.get().getIdEvaluacion())) {
            return ResponseEntity.status(404).body("El intento no pertenece a la evaluación indicada.");
        }
        try {
            boolean ok = intentoServicio.eliminarSiPropioYEnProgreso(idIntento, idEstudiante);
            return ok ? ResponseEntity.noContent().build() : ResponseEntity.notFound().build();
        } catch (IllegalStateException ex) {
            return ResponseEntity.status(409).body(ex.getMessage());
        }
    }

    // ============================
    // DTOs
    // ============================

    @Schema(description = "Parámetros opcionales para iniciar un intento")
    public static record IniciarIntentoRequest(
            @Schema(description = "Límite de tiempo en segundos para el intento (null = sin límite)", example = "1800")
            @PositiveOrZero Integer timeLimitSeconds,

            @Schema(description = "Puntaje máximo que puede alcanzar este intento (opcional)", example = "10.0")
            BigDecimal puntajeMaximo
    ) {}

    @Schema(description = "Datos enviados al entregar un intento")
    public static record EntregaRequest(
            @Schema(description = "Tiempo total usado en segundos", example = "1200")
            @PositiveOrZero Integer tiempoSegundos,

            @Schema(description = "Listado de respuestas del intento")
            List<Intento.Respuesta> respuestas
    ) {}

    @Schema(description = "Petición para actualizar completamente un intento")
    public static record ActualizarIntentoRequest(
            @Schema(description = "Listado completo de respuestas del intento")
            List<Intento.Respuesta> respuestas,

            @Schema(description = "Tiempo usado en segundos", example = "900")
            @PositiveOrZero Integer usedTimeSeconds
    ) {}

    @Schema(description = "Petición para actualización parcial de un intento")
    public static record PatchIntentoRequest(
            @Schema(description = "Respuestas a actualizar (opcional)")
            List<Intento.Respuesta> respuestas,

            @Schema(description = "Tiempo usado en segundos (opcional)", example = "600")
            @PositiveOrZero Integer usedTimeSeconds
    ) {}
}

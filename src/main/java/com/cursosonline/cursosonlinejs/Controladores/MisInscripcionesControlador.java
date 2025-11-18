package com.cursosonline.cursosonlinejs.Controladores;

import com.cursosonline.cursosonlinejs.Entidades.Inscripcion;
import com.cursosonline.cursosonlinejs.Servicios.InscripcionServicio;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Map;

// Swagger / OpenAPI
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.Parameter;
import io.swagger.v3.oas.annotations.media.ArraySchema;
import io.swagger.v3.oas.annotations.media.Content;
import io.swagger.v3.oas.annotations.media.Schema;
import io.swagger.v3.oas.annotations.responses.ApiResponse;
import io.swagger.v3.oas.annotations.responses.ApiResponses;  // 👈 ESTE FALTABA
import io.swagger.v3.oas.annotations.security.SecurityRequirement;
import io.swagger.v3.oas.annotations.tags.Tag;

@RestController
@RequestMapping("/api/v1/mi/inscripciones")
@CrossOrigin(origins = "http://localhost:9090", allowCredentials = "true")
@Tag(
        name = "Mis inscripciones",
        description = "Consultas de inscripciones del estudiante autenticado."
)
@SecurityRequirement(name = "bearerAuth")
public class MisInscripcionesControlador {

    private final InscripcionServicio inscripcionServicio;

    public MisInscripcionesControlador(InscripcionServicio inscripcionServicio) {
        this.inscripcionServicio = inscripcionServicio;
    }

    @Operation(
            summary = "Listar mis inscripciones",
            description = """
                    Devuelve las inscripciones del estudiante autenticado.
                    Se puede filtrar opcionalmente por estado (activa, completada, etc.).
                    """
    )
    @ApiResponse(
            responseCode = "200",
            description = "Listado de inscripciones del usuario",
            content = @Content(array = @ArraySchema(schema = @Schema(implementation = Inscripcion.class)))
    )
    @GetMapping(produces = "application/json")
    @PreAuthorize("isAuthenticated()")
    public ResponseEntity<?> listar(
            @Parameter(description = "Estado de la inscripción (opcional)", example = "activa")
            @RequestParam(required = false) String estado
    ) {
        var me = inscripcionServicio.obtenerIdEstudianteActual();
        if (me.isEmpty()) return ResponseEntity.status(401).body(Map.of("message","No autenticado."));
        List<Inscripcion> data = (estado == null || estado.isBlank())
                ? inscripcionServicio.listarPorEstudiante(me.get())
                : inscripcionServicio.listarPorEstudianteYEstado(me.get(), estado.trim().toLowerCase());
        return ResponseEntity.ok(data);
    }

    @Operation(
            summary = "Obtener mi inscripción en un curso",
            description = "Devuelve la inscripción del estudiante autenticado en un curso específico, si existe."
    )
    @ApiResponses({
            @ApiResponse(responseCode = "200", description = "Inscripción encontrada",
                    content = @Content(schema = @Schema(implementation = Inscripcion.class))),
            @ApiResponse(responseCode = "401", description = "No autenticado"),
            @ApiResponse(responseCode = "404", description = "No existe inscripción para este curso")
    })
    @GetMapping(value = "/curso/{idCurso}", produces = "application/json")
    @PreAuthorize("isAuthenticated()")
    public ResponseEntity<?> miInscripcionEnCurso(
            @Parameter(description = "ID del curso", example = "c_123456")
            @PathVariable String idCurso
    ) {
        var me = inscripcionServicio.obtenerIdEstudianteActual();
        if (me.isEmpty()) return ResponseEntity.status(401).body(Map.of("message","No autenticado."));
        return inscripcionServicio.obtenerPorCursoYEstudiante(idCurso, me.get())
                .<ResponseEntity<?>>map(ResponseEntity::ok)
                .orElseGet(() -> ResponseEntity.notFound().build());
    }
}

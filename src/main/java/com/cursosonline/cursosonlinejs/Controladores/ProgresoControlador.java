package com.cursosonline.cursosonlinejs.Controladores;

import com.cursosonline.cursosonlinejs.DTO.CursoProgresoDTO;
import com.cursosonline.cursosonlinejs.Servicios.InscripcionServicio;
import com.cursosonline.cursosonlinejs.Servicios.ProgresoCursoServicio;

import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

// Swagger / OpenAPI
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.Parameter;
import io.swagger.v3.oas.annotations.media.Content;
import io.swagger.v3.oas.annotations.media.Schema;
import io.swagger.v3.oas.annotations.responses.ApiResponse;
import io.swagger.v3.oas.annotations.responses.ApiResponses;
import io.swagger.v3.oas.annotations.security.SecurityRequirement;
import io.swagger.v3.oas.annotations.tags.Tag;

import java.util.Map;

@RestController
@RequestMapping("/api/v1")
@CrossOrigin(origins = "http://localhost:9090", allowCredentials = "true")
@Tag(
        name = "Progreso de curso",
        description = "Endpoints para consultar el progreso de estudiantes en los cursos."
)
@SecurityRequirement(name = "bearerAuth")
public class ProgresoControlador {

    private final ProgresoCursoServicio progresoCursoServicio;
    private final InscripcionServicio inscripcionServicio;

    public ProgresoControlador(ProgresoCursoServicio progresoCursoServicio,
                               InscripcionServicio inscripcionServicio) {
        this.progresoCursoServicio = progresoCursoServicio;
        this.inscripcionServicio = inscripcionServicio;
    }

    /**
     * Progreso del estudiante logueado en un curso.
     * Recalcula y actualiza la inscripción.
     */
    @Operation(
            summary = "Ver mi progreso en un curso",
            description = """
                    Devuelve el progreso detallado del estudiante autenticado en el curso indicado.
                    Además puede actualizar el estado de la inscripción (por ejemplo, marcarla como completada).
                    """
    )
    @ApiResponses({
            @ApiResponse(responseCode = "200", description = "Progreso calculado correctamente",
                    content = @Content(schema = @Schema(implementation = CursoProgresoDTO.class))),
            @ApiResponse(responseCode = "401", description = "No autenticado"),
            @ApiResponse(responseCode = "403", description = "No estás inscrito en este curso")
    })
    @GetMapping("/cursos/{idCurso}/mi-progreso")
    @PreAuthorize("isAuthenticated()")
    public ResponseEntity<?> miProgreso(
            @Parameter(description = "ID del curso", example = "c_123456")
            @PathVariable String idCurso
    ) {
        // Usar el mismo helper que en MisInscripcionesControlador
        var idEstOpt = inscripcionServicio.obtenerIdEstudianteActual();
        if (idEstOpt.isEmpty()) {
            return ResponseEntity.status(401).body(
                    Map.of("message", "No autenticado.")
            );
        }
        String userId = idEstOpt.get();

        // Validar que tenga inscripción en ese curso
        var inscOpt = inscripcionServicio.obtenerPorCursoYEstudiante(idCurso, userId);
        if (inscOpt.isEmpty()) {
            return ResponseEntity.status(403).body(
                    Map.of("message", "No estás inscrito en este curso.")
            );
        }

        CursoProgresoDTO dto = progresoCursoServicio
                .calcularProgresoCurso(idCurso, userId, true);

        return ResponseEntity.ok(dto);
    }

    /**
     * Permite a ADMIN / INSTRUCTOR ver el progreso de un estudiante específico
     * sin modificar la inscripción (sólo consulta).
     */
    @Operation(
            summary = "Ver progreso de un estudiante (ADMIN/INSTRUCTOR)",
            description = "Consulta el progreso de un estudiante específico en un curso, sin modificar la inscripción."
    )
    @ApiResponses({
            @ApiResponse(responseCode = "200", description = "Progreso calculado correctamente",
                    content = @Content(schema = @Schema(implementation = CursoProgresoDTO.class))),
            @ApiResponse(responseCode = "403", description = "No autorizado para este curso")
    })
    @GetMapping("/cursos/{idCurso}/estudiantes/{idEstudiante}/progreso")
    @PreAuthorize("hasRole('ADMIN') or @cursoPermisos.esInstructorDelCurso(#idCurso)")
    public ResponseEntity<?> progresoDeEstudiante(
            @Parameter(description = "ID del curso", example = "c_123456")
            @PathVariable String idCurso,
            @Parameter(description = "ID del estudiante", example = "u_abc123")
            @PathVariable String idEstudiante
    ) {

        CursoProgresoDTO dto = progresoCursoServicio
                .calcularProgresoCurso(idCurso, idEstudiante, false);

        return ResponseEntity.ok(dto);
    }
}

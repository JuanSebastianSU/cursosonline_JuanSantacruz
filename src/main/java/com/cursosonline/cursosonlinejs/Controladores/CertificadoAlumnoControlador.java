package com.cursosonline.cursosonlinejs.Controladores;

import com.cursosonline.cursosonlinejs.DTO.CursoProgresoDTO;
import com.cursosonline.cursosonlinejs.Entidades.Certificado;
import com.cursosonline.cursosonlinejs.Servicios.CertificadoServicio;
import com.cursosonline.cursosonlinejs.Servicios.InscripcionServicio;
import com.cursosonline.cursosonlinejs.Servicios.ProgresoCursoServicio;

import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import java.net.URI;
import java.util.Map;
import java.util.NoSuchElementException;

// 🔽 Swagger / OpenAPI
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.Parameter;
import io.swagger.v3.oas.annotations.tags.Tag;
import io.swagger.v3.oas.annotations.responses.ApiResponse;
import io.swagger.v3.oas.annotations.responses.ApiResponses;

@RestController
@RequestMapping("/api/v1/cursos/{idCurso}")
@CrossOrigin(origins = "http://localhost:9090", allowCredentials = "true")
@Tag(
        name = "Certificados (Alumno)",
        description = "Operaciones para que el alumno autenticado solicite su certificado de un curso que ha aprobado."
)
public class CertificadoAlumnoControlador {

    private final CertificadoServicio certificadoServicio;
    private final ProgresoCursoServicio progresoCursoServicio;
    private final InscripcionServicio inscripcionServicio;

    public CertificadoAlumnoControlador(CertificadoServicio certificadoServicio,
                                        ProgresoCursoServicio progresoCursoServicio,
                                        InscripcionServicio inscripcionServicio) {
        this.certificadoServicio = certificadoServicio;
        this.progresoCursoServicio = progresoCursoServicio;
        this.inscripcionServicio = inscripcionServicio;
    }

    /**
     * El alumno logueado solicita su certificado del curso.
     * - Verifica que esté inscrito en el curso.
     * - Recalcula progreso (y actualiza la inscripción).
     * - Solo emite certificado si el curso está aprobado.
     */
    @PostMapping("/mi-certificado")
    @PreAuthorize("isAuthenticated()")
    @Operation(
            summary = "Emitir mi certificado de curso",
            description = "Permite al alumno autenticado solicitar su certificado del curso indicado, " +
                          "si está inscrito y ha aprobado todos los módulos."
    )
    @ApiResponses({
            @ApiResponse(responseCode = "201", description = "Certificado emitido correctamente"),
            @ApiResponse(responseCode = "401", description = "Usuario no autenticado"),
            @ApiResponse(responseCode = "403", description = "El usuario no está inscrito en el curso"),
            @ApiResponse(responseCode = "404", description = "Inscripción no encontrada para este curso"),
            @ApiResponse(responseCode = "409", description = "Aún no cumple los requisitos o ya existe certificado emitido")
    })
    public ResponseEntity<?> emitirMiCertificado(
            @Parameter(description = "ID del curso para el cual se solicita el certificado",
                       example = "665fa1c2e4b0c72a8f999999")
            @PathVariable String idCurso
    ) {
        // 1) Obtener id del estudiante actual
        var idEstOpt = inscripcionServicio.obtenerIdEstudianteActual();
        if (idEstOpt.isEmpty()) {
            return ResponseEntity.status(401).body(Map.of("message", "No autenticado."));
        }
        String idEstudiante = idEstOpt.get();

        // 2) Verificar que tiene inscripción en ese curso
        var inscOpt = inscripcionServicio.obtenerPorCursoYEstudiante(idCurso, idEstudiante);
        if (inscOpt.isEmpty()) {
            return ResponseEntity.status(403).body(Map.of("message", "No estás inscrito en este curso."));
        }

        // 3) Recalcular progreso (actualizando la inscripción)
        CursoProgresoDTO progreso;
        try {
            progreso = progresoCursoServicio.calcularProgresoCurso(idCurso, idEstudiante, true);
        } catch (NoSuchElementException ex) {
            return ResponseEntity.status(404).body(Map.of("message", "Inscripción no encontrada para este curso."));
        }

        if (!progreso.aprobadoFinal()) {
            return ResponseEntity.status(409).body(Map.of(
                    "message", "Aún no cumples los requisitos para el certificado (no has aprobado todos los módulos)."
            ));
        }

        // 4) Intentar emitir certificado (CertificadoServicio ya valida elegibilidad y duplicados)
        try {
            var creadoOpt = certificadoServicio.emitir(idCurso, idEstudiante);
            if (creadoOpt.isEmpty()) {
                return ResponseEntity.status(409).body(Map.of(
                        "message", "Ya existe un certificado emitido para este curso."
                ));
            }

            Certificado cert = creadoOpt.get();
            return ResponseEntity
                    .created(URI.create("/api/v1/certificados/" + cert.getId()))
                    .body(cert);

        } catch (IllegalStateException ex) {
            // Por si algo no cuadra con la elegibilidad interna
            return ResponseEntity.status(409).body(Map.of("message", ex.getMessage()));
        }
    }
}

package com.cursosonline.cursosonlinejs.Controladores;

import com.cursosonline.cursosonlinejs.Entidades.Certificado;
import com.cursosonline.cursosonlinejs.Servicios.CertificadoServicio;

import jakarta.validation.Valid;
import jakarta.validation.constraints.NotBlank;

import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.parameters.P;
import org.springframework.web.bind.annotation.*;

import java.net.URI;
import java.util.List;
import java.util.Map;

// 🔽 Swagger / OpenAPI
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.Parameter;
import io.swagger.v3.oas.annotations.tags.Tag;
import io.swagger.v3.oas.annotations.responses.ApiResponse;
import io.swagger.v3.oas.annotations.responses.ApiResponses;

@RestController
@RequestMapping("/api/v1")
@CrossOrigin(origins = "http://localhost:9090", allowCredentials = "true")
@Tag(
        name = "Certificados (Administración)",
        description = "Endpoints para administración de certificados: emisión automática y manual, consulta, verificación, revocación y eliminación."
)
public class CertificadoControlador {

    private final CertificadoServicio certificadoServicio;

    public CertificadoControlador(CertificadoServicio certificadoServicio) {
        this.certificadoServicio = certificadoServicio;
    }

    /**
     * Emisión normal (automática) controlada por ADMIN / INSTRUCTOR.
     * Usa la lógica de elegibilidad (inscripción COMPLETADA / aprobadoFinal).
     */
    @PostMapping("/cursos/{idCurso}/certificados")
    @PreAuthorize("hasRole('ADMIN') or @certPermisos.esInstructorDelCurso(#idCurso)")
    @Operation(
            summary = "Emitir certificado (automático)",
            description = "Emite un certificado para un estudiante, validando que tenga la inscripción completada y " +
                          "haya aprobado el curso según las reglas de elegibilidad."
    )
    @ApiResponses({
            @ApiResponse(responseCode = "201", description = "Certificado emitido correctamente"),
            @ApiResponse(responseCode = "400", description = "El estudiante no cumple las condiciones de elegibilidad"),
            @ApiResponse(responseCode = "409", description = "Ya existe un certificado para ese estudiante y curso")
    })
    public ResponseEntity<?> emitir(
            @Parameter(description = "ID del curso para el cual se emite el certificado",
                       example = "665fa1c2e4b0c72a8f000111")
            @PathVariable("idCurso") @P("idCurso") String idCurso,
            @Valid @RequestBody EmitirCertificadoRequest body
    ) {
        try {
            var creado = certificadoServicio.emitir(idCurso, body.idEstudiante());
            if (creado.isEmpty()) {
                return ResponseEntity.status(409).body(Map.of(
                        "message", "Ya existe certificado para este curso y estudiante."
                ));
            }
            var c = creado.get();
            return ResponseEntity.created(URI.create("/api/v1/certificados/" + c.getId())).body(c);
        } catch (IllegalStateException ex) {
            return ResponseEntity.badRequest().body(Map.of("message", ex.getMessage()));
        }
    }

    /**
     * Emisión MANUAL: salta la validación de elegibilidad.
     * Pensado para casos especiales donde el instructor / admin decide
     * otorgar el certificado aunque el sistema no marque todavía al alumno
     * como elegible.
     */
    @PostMapping("/cursos/{idCurso}/certificados/manual")
    @PreAuthorize("hasRole('ADMIN') or @certPermisos.esInstructorDelCurso(#idCurso)")
    @Operation(
            summary = "Emitir certificado manualmente",
            description = "Emite un certificado de forma manual, sin aplicar la validación de elegibilidad. " +
                          "Útil para casos excepcionales controlados por administradores o instructores."
    )
    @ApiResponses({
            @ApiResponse(responseCode = "201", description = "Certificado emitido manualmente"),
            @ApiResponse(responseCode = "409", description = "Ya existe certificado para ese curso y estudiante")
    })
    public ResponseEntity<?> emitirManual(
            @Parameter(description = "ID del curso para el cual se emite manualmente el certificado",
                       example = "665fa1c2e4b0c72a8f000111")
            @PathVariable("idCurso") @P("idCurso") String idCurso,
            @Valid @RequestBody EmitirCertificadoRequest body
    ) {
        var creado = certificadoServicio.emitirManual(idCurso, body.idEstudiante());
        if (creado.isEmpty()) {
            return ResponseEntity.status(409).body(Map.of(
                    "message", "Ya existe certificado para este curso y estudiante."
            ));
        }
        var c = creado.get();
        return ResponseEntity.created(URI.create("/api/v1/certificados/" + c.getId())).body(c);
    }

    @GetMapping("/certificados/{id}")
    @PreAuthorize("hasRole('ADMIN') or @certPermisos.puedeVerCertificado(#id)")
    @Operation(
            summary = "Obtener certificado por ID",
            description = "Devuelve la información detallada de un certificado específico, si el usuario tiene permisos para verlo."
    )
    @ApiResponses({
            @ApiResponse(responseCode = "200", description = "Certificado encontrado"),
            @ApiResponse(responseCode = "404", description = "Certificado no encontrado")
    })
    public ResponseEntity<?> obtener(
            @Parameter(description = "ID del certificado", example = "665fa1c2e4b0c72a8f123456")
            @PathVariable String id
    ) {
        return certificadoServicio.buscarPorId(id)
                .<ResponseEntity<?>>map(ResponseEntity::ok)
                .orElseGet(() -> ResponseEntity.notFound().build());
    }

    @GetMapping("/certificados/verificar/{codigo}")
    @Operation(
            summary = "Verificar un certificado por código",
            description = "Permite verificar la validez de un certificado a partir de su código público."
    )
    @ApiResponses({
            @ApiResponse(responseCode = "200", description = "Certificado válido encontrado"),
            @ApiResponse(responseCode = "404", description = "No existe certificado con ese código")
    })
    public ResponseEntity<?> verificar(
            @Parameter(description = "Código público del certificado", example = "CUR-2025-ABC123")
            @PathVariable String codigo
    ) {
        return certificadoServicio.buscarPorCodigo(codigo)
                .<ResponseEntity<?>>map(ResponseEntity::ok)
                .orElseGet(() -> ResponseEntity.notFound().build());
    }

    @GetMapping("/cursos/{idCurso}/certificados")
    @PreAuthorize("hasRole('ADMIN') or @certPermisos.esInstructorDelCurso(#idCurso)")
    @Operation(
            summary = "Listar certificados de un curso",
            description = "Obtiene todos los certificados emitidos para un curso concreto."
    )
    @ApiResponses({
            @ApiResponse(responseCode = "200", description = "Lista de certificados devuelta"),
            @ApiResponse(responseCode = "204", description = "El curso no tiene certificados emitidos")
    })
    public ResponseEntity<?> listarPorCurso(
            @Parameter(description = "ID del curso", example = "665fa1c2e4b0c72a8f000111")
            @PathVariable String idCurso
    ) {
        List<Certificado> lista = certificadoServicio.listarPorCurso(idCurso);
        return lista.isEmpty() ? ResponseEntity.noContent().build() : ResponseEntity.ok(lista);
    }

    @GetMapping("/estudiantes/{idEstudiante}/certificados")
    @PreAuthorize("hasRole('ADMIN') or @certPermisos.esMismoEstudiante(#idEstudiante)")
    @Operation(
            summary = "Listar certificados de un estudiante",
            description = "Devuelve todos los certificados asociados a un estudiante concreto."
    )
    @ApiResponses({
            @ApiResponse(responseCode = "200", description = "Lista de certificados devuelta"),
            @ApiResponse(responseCode = "204", description = "El estudiante no tiene certificados")
    })
    public ResponseEntity<?> listarPorEstudiante(
            @Parameter(description = "ID del estudiante", example = "665fa1c2e4b0c72a8f777777")
            @PathVariable String idEstudiante
    ) {
        List<Certificado> lista = certificadoServicio.listarPorEstudiante(idEstudiante);
        return lista.isEmpty() ? ResponseEntity.noContent().build() : ResponseEntity.ok(lista);
    }

    @PatchMapping("/certificados/{id}/revocar")
    @PreAuthorize("hasRole('ADMIN') or @certPermisos.esInstructorDeCertificado(#id)")
    @Operation(
            summary = "Revocar un certificado",
            description = "Marca un certificado como revocado. Solo administradores o el instructor asociado pueden revocarlo."
    )
    @ApiResponses({
            @ApiResponse(responseCode = "200", description = "Certificado revocado correctamente"),
            @ApiResponse(responseCode = "404", description = "Certificado no encontrado")
    })
    public ResponseEntity<?> revocar(
            @Parameter(description = "ID del certificado a revocar", example = "665fa1c2e4b0c72a8f123456")
            @PathVariable String id
    ) {
        return certificadoServicio.revocar(id)
                .<ResponseEntity<?>>map(c -> ResponseEntity.ok(Map.of(
                        "message", "Certificado revocado.",
                        "certificado", c
                )))
                .orElseGet(() -> ResponseEntity.notFound().build());
    }

    @DeleteMapping("/certificados/{id}")
    @PreAuthorize("hasRole('ADMIN') or @certPermisos.esInstructorDeCertificado(#id)")
    @Operation(
            summary = "Eliminar un certificado",
            description = "Elimina definitivamente un certificado existente."
    )
    @ApiResponses({
            @ApiResponse(responseCode = "204", description = "Certificado eliminado correctamente"),
            @ApiResponse(responseCode = "404", description = "Certificado no encontrado")
    })
    public ResponseEntity<?> eliminar(
            @Parameter(description = "ID del certificado a eliminar", example = "665fa1c2e4b0c72a8f123456")
            @PathVariable String id
    ) {
        var opt = certificadoServicio.buscarPorId(id);
        if (opt.isEmpty()) return ResponseEntity.notFound().build();
        certificadoServicio.eliminar(id);
        return ResponseEntity.noContent().build();
    }

    // ================== DTO interno ==================

    public static class EmitirCertificadoRequest {
        @NotBlank
        private String idEstudiante;

        public String idEstudiante() { return idEstudiante; }
        public void setIdEstudiante(String idEstudiante) { this.idEstudiante = idEstudiante; }
    }
}

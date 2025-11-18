package com.cursosonline.cursosonlinejs.Controladores;

import com.cursosonline.cursosonlinejs.Entidades.Calificacion;
import com.cursosonline.cursosonlinejs.Repositorios.UsuarioRepositorio;
import com.cursosonline.cursosonlinejs.Servicios.CalificacionServicio;

import jakarta.validation.Valid;
import jakarta.validation.constraints.Min;
import jakarta.validation.constraints.NotNull;

import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.web.bind.annotation.*;

import java.math.BigDecimal;
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
        name = "Calificaciones",
        description = "Gestión de calificaciones de intentos de evaluaciones (crear, consultar, actualizar, publicar y eliminar)."
)
public class CalificacionControlador {

    private final CalificacionServicio calificacionServicio;
    private final UsuarioRepositorio usuarioRepo;

    public CalificacionControlador(CalificacionServicio calificacionServicio,
                                   UsuarioRepositorio usuarioRepo) {
        this.calificacionServicio = calificacionServicio;
        this.usuarioRepo = usuarioRepo;
    }

    private String currentUserId() {
        var auth = SecurityContextHolder.getContext().getAuthentication();
        if (auth == null || auth.getName() == null) return null;
        return usuarioRepo.findByEmail(auth.getName()).map(u -> u.getId()).orElse(null);
    }

    @PostMapping("/intentos/{idIntento}/calificacion")
    @PreAuthorize("hasRole('ADMIN') or @calPermisos.esInstructorDeIntento(#idIntento)")
    @Operation(
            summary = "Calificar un intento de evaluación",
            description = "Crea una calificación para un intento de evaluación. Solo administradores o el instructor del intento pueden calificar."
    )
    @ApiResponses({
            @ApiResponse(responseCode = "201", description = "Calificación creada correctamente"),
            @ApiResponse(responseCode = "400", description = "Datos de calificación inválidos"),
            @ApiResponse(responseCode = "401", description = "Usuario no autenticado"),
            @ApiResponse(responseCode = "409", description = "Intento no válido o ya calificado")
    })
    public ResponseEntity<?> calificar(
            @Parameter(description = "ID del intento a calificar", example = "665fa1c2e4b0c72a8f123456")
            @PathVariable String idIntento,
            @Valid @RequestBody CalificarRequest body
    ) {
        String calificadoPor = currentUserId();
        if (calificadoPor == null) {
            return ResponseEntity.status(401).body(Map.of("message", "No autenticado."));
        }

        try {
            var creada = calificacionServicio.calificar(
                    idIntento,
                    BigDecimal.valueOf(body.getPuntaje()),
                    body.getFeedback(),
                    calificadoPor
            );
            if (creada.isEmpty()) {
                return ResponseEntity.status(409).body(Map.of("message", "Intento no válido o ya calificado."));
            }
            Calificacion c = creada.get();
            return ResponseEntity.created(URI.create("/api/v1/calificaciones/" + c.getId())).body(c);
        } catch (IllegalStateException ex) {
            return ResponseEntity.status(409).body(Map.of("message", ex.getMessage()));
        } catch (IllegalArgumentException ex) {
            return ResponseEntity.badRequest().body(Map.of("message", ex.getMessage()));
        }
    }

    @GetMapping("/intentos/{idIntento}/calificacion")
    @PreAuthorize("hasRole('ADMIN') or @calPermisos.esInstructorDeIntento(#idIntento) or @calPermisos.esDuenoDeIntento(#idIntento)")
    @Operation(
            summary = "Obtener calificación de un intento",
            description = "Devuelve la calificación asociada a un intento de evaluación, si existe."
    )
    @ApiResponses({
            @ApiResponse(responseCode = "200", description = "Calificación encontrada"),
            @ApiResponse(responseCode = "404", description = "No existe calificación para ese intento")
    })
    public ResponseEntity<?> obtenerPorIntento(
            @Parameter(description = "ID del intento", example = "665fa1c2e4b0c72a8f123456")
            @PathVariable String idIntento
    ) {
        return calificacionServicio.buscarPorIntento(idIntento)
                .<ResponseEntity<?>>map(ResponseEntity::ok)
                .orElse(ResponseEntity.notFound().build());
    }

    @GetMapping("/calificaciones/{id}")
    @PreAuthorize("hasRole('ADMIN') or @calPermisos.esInstructorDeCalificacion(#id) or @calPermisos.esDuenoDeCalificacion(#id)")
    @Operation(
            summary = "Obtener calificación por ID",
            description = "Devuelve una calificación específica por su identificador."
    )
    @ApiResponses({
            @ApiResponse(responseCode = "200", description = "Calificación encontrada"),
            @ApiResponse(responseCode = "404", description = "Calificación no encontrada")
    })
    public ResponseEntity<?> obtener(
            @Parameter(description = "ID de la calificación", example = "665fa1c2e4b0c72a8f654321")
            @PathVariable String id
    ) {
        return calificacionServicio.buscarPorId(id)
                .<ResponseEntity<?>>map(ResponseEntity::ok)
                .orElse(ResponseEntity.notFound().build());
    }

    @GetMapping("/evaluaciones/{idEvaluacion}/calificaciones")
    @PreAuthorize("hasRole('ADMIN') or @calPermisos.esInstructorDeEvaluacion(#idEvaluacion)")
    @Operation(
            summary = "Listar calificaciones de una evaluación",
            description = "Obtiene todas las calificaciones asociadas a una evaluación concreta."
    )
    @ApiResponses({
            @ApiResponse(responseCode = "200", description = "Lista de calificaciones devuelta correctamente"),
            @ApiResponse(responseCode = "204", description = "La evaluación no tiene calificaciones registradas")
    })
    public ResponseEntity<?> listarPorEvaluacion(
            @Parameter(description = "ID de la evaluación", example = "665fa1c2e4b0c72a8f000111")
            @PathVariable String idEvaluacion
    ) {
        List<Calificacion> lista = calificacionServicio.listarPorEvaluacion(idEvaluacion);
        return lista.isEmpty() ? ResponseEntity.noContent().build() : ResponseEntity.ok(lista);
    }

    @PatchMapping("/calificaciones/{id}")
    @PreAuthorize("hasRole('ADMIN') or @calPermisos.esInstructorDeCalificacion(#id)")
    @Operation(
            summary = "Actualizar parcialmente una calificación",
            description = "Permite modificar el puntaje y/o el feedback de una calificación existente."
    )
    @ApiResponses({
            @ApiResponse(responseCode = "200", description = "Calificación actualizada correctamente"),
            @ApiResponse(responseCode = "400", description = "Datos de actualización inválidos"),
            @ApiResponse(responseCode = "404", description = "Calificación no encontrada")
    })
    public ResponseEntity<?> actualizar(
            @Parameter(description = "ID de la calificación a actualizar", example = "665fa1c2e4b0c72a8f654321")
            @PathVariable String id,
            @Valid @RequestBody ActualizarCalificacionRequest body
    ) {
        BigDecimal puntajeBD = (body.getPuntaje() != null) ? BigDecimal.valueOf(body.getPuntaje()) : null;
        try {
            return calificacionServicio.actualizarParcial(id, puntajeBD, body.getFeedback())
                    .<ResponseEntity<?>>map(ResponseEntity::ok)
                    .orElse(ResponseEntity.notFound().build());
        } catch (IllegalArgumentException ex) {
            return ResponseEntity.badRequest().body(Map.of("message", ex.getMessage()));
        }
    }

    @PatchMapping("/calificaciones/{id}/publicar")
    @PreAuthorize("hasRole('ADMIN') or @calPermisos.esInstructorDeCalificacion(#id)")
    @Operation(
            summary = "Publicar una calificación",
            description = "Marca una calificación como publicada para que el estudiante pueda verla."
    )
    @ApiResponses({
            @ApiResponse(responseCode = "200", description = "Calificación publicada correctamente"),
            @ApiResponse(responseCode = "404", description = "Calificación no encontrada")
    })
    public ResponseEntity<?> publicar(
            @Parameter(description = "ID de la calificación a publicar", example = "665fa1c2e4b0c72a8f654321")
            @PathVariable String id
    ) {
        return calificacionServicio.publicar(id)
                .<ResponseEntity<?>>map(ResponseEntity::ok)
                .orElse(ResponseEntity.notFound().build());
    }

    @DeleteMapping("/calificaciones/{id}")
    @PreAuthorize("hasRole('ADMIN') or @calPermisos.esInstructorDeCalificacion(#id)")
    @Operation(
            summary = "Eliminar una calificación",
            description = "Elimina definitivamente una calificación existente."
    )
    @ApiResponses({
            @ApiResponse(responseCode = "204", description = "Calificación eliminada correctamente"),
            @ApiResponse(responseCode = "404", description = "Calificación no encontrada")
    })
    public ResponseEntity<?> eliminar(
            @Parameter(description = "ID de la calificación a eliminar", example = "665fa1c2e4b0c72a8f654321")
            @PathVariable String id
    ) {
        boolean ok = calificacionServicio.eliminar(id);
        return ok ? ResponseEntity.noContent().build() : ResponseEntity.notFound().build();
    }

    // ================== DTOs internos ==================

    public static class CalificarRequest {
        @NotNull
        @Min(0)
        private Integer puntaje;
        private String feedback;

        public Integer getPuntaje() { return puntaje; }
        public void setPuntaje(Integer puntaje) { this.puntaje = puntaje; }
        public String getFeedback() { return feedback; }
        public void setFeedback(String feedback) { this.feedback = feedback; }
    }

    public static class ActualizarCalificacionRequest {
        @Min(0)
        private Integer puntaje;
        private String feedback;

        public Integer getPuntaje() { return puntaje; }
        public void setPuntaje(Integer puntaje) { this.puntaje = puntaje; }
        public String getFeedback() { return feedback; }
        public void setFeedback(String feedback) { this.feedback = feedback; }
    }
}

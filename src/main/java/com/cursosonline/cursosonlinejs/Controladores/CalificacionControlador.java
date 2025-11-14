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

@RestController
@RequestMapping("/api/v1")
@CrossOrigin(
        origins = {
                "http://localhost:9090",
                "https://cursosonline-juan-santacruz.vercel.app"
        },
        allowCredentials = "true"
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
    public ResponseEntity<?> calificar(@PathVariable String idIntento,
                                       @Valid @RequestBody CalificarRequest body) {
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
    public ResponseEntity<?> obtenerPorIntento(@PathVariable String idIntento) {
        return calificacionServicio.buscarPorIntento(idIntento)
                .<ResponseEntity<?>>map(ResponseEntity::ok)
                .orElse(ResponseEntity.notFound().build());
    }

    @GetMapping("/calificaciones/{id}")
    @PreAuthorize("hasRole('ADMIN') or @calPermisos.esInstructorDeCalificacion(#id) or @calPermisos.esDuenoDeCalificacion(#id)")
    public ResponseEntity<?> obtener(@PathVariable String id) {
        return calificacionServicio.buscarPorId(id)
                .<ResponseEntity<?>>map(ResponseEntity::ok)
                .orElse(ResponseEntity.notFound().build());
    }

    @GetMapping("/evaluaciones/{idEvaluacion}/calificaciones")
    @PreAuthorize("hasRole('ADMIN') or @calPermisos.esInstructorDeEvaluacion(#idEvaluacion)")
    public ResponseEntity<?> listarPorEvaluacion(@PathVariable String idEvaluacion) {
        List<Calificacion> lista = calificacionServicio.listarPorEvaluacion(idEvaluacion);
        return lista.isEmpty() ? ResponseEntity.noContent().build() : ResponseEntity.ok(lista);
    }

    @PatchMapping("/calificaciones/{id}")
    @PreAuthorize("hasRole('ADMIN') or @calPermisos.esInstructorDeCalificacion(#id)")
    public ResponseEntity<?> actualizar(@PathVariable String id,
                                        @Valid @RequestBody ActualizarCalificacionRequest body) {
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
    public ResponseEntity<?> publicar(@PathVariable String id) {
        return calificacionServicio.publicar(id)
                .<ResponseEntity<?>>map(ResponseEntity::ok)
                .orElse(ResponseEntity.notFound().build());
    }

    @DeleteMapping("/calificaciones/{id}")
    @PreAuthorize("hasRole('ADMIN') or @calPermisos.esInstructorDeCalificacion(#id)")
    public ResponseEntity<?> eliminar(@PathVariable String id) {
        boolean ok = calificacionServicio.eliminar(id);
        return ok ? ResponseEntity.noContent().build() : ResponseEntity.notFound().build();
    }

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

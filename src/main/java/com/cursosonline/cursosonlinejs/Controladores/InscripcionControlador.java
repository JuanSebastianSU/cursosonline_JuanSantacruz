// src/main/java/com/cursosonline/cursosonlinejs/Controladores/InscripcionControlador.java
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

@RestController
@RequestMapping("/api/v1/cursos/{idCurso}/inscripciones")
@CrossOrigin(origins = "http://localhost:9090", allowCredentials = "true")
public class InscripcionControlador {

    private final InscripcionServicio inscripcionServicio;
    private final CursoServicio cursoServicio;

    public InscripcionControlador(InscripcionServicio inscripcionServicio,
                                  CursoServicio cursoServicio) {
        this.inscripcionServicio = inscripcionServicio;
        this.cursoServicio = cursoServicio;
    }

    @PostMapping(produces = "application/json")
    @PreAuthorize("isAuthenticated()")
    public ResponseEntity<?> inscribirEstudiante(@PathVariable String idCurso) {
        var idEstudianteOpt = inscripcionServicio.obtenerIdEstudianteActual();
        if (idEstudianteOpt.isEmpty()) return ResponseEntity.status(401).body(Map.of("message","No autenticado."));

        String idEstudiante = idEstudianteOpt.get();

        if (!cursoServicio.puedeInscribirse(idCurso)) {
            return ResponseEntity.status(403).body(Map.of("message","Este curso no acepta inscripciones (no publicado o fuera de ventana)."));
        }
        if (!cursoServicio.cupoDisponible(idCurso)) {
            return ResponseEntity.status(409).body(Map.of("message","Cupo completo. No es posible inscribirse."));
        }
        if (inscripcionServicio.existeActiva(idCurso, idEstudiante)) {
            return ResponseEntity.status(409).body(Map.of("message","Ya tienes una inscripción activa en este curso."));
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

    @GetMapping(produces = "application/json")
    @PreAuthorize("hasRole('ADMIN') or @inscPermisos.esInstructorDelCurso(#idCurso)")
    public ResponseEntity<List<Inscripcion>> listarInscripciones(@PathVariable String idCurso,
                                                                 @RequestParam(required = false) String estado) {
        List<Inscripcion> data = (estado == null || estado.isBlank())
                ? inscripcionServicio.listarPorCurso(idCurso)
                : inscripcionServicio.listarPorCursoYEstado(idCurso, estado.trim().toLowerCase());
        return ResponseEntity.ok(data);
    }

    @GetMapping(value = "/{id}", produces = "application/json")
    @PreAuthorize("hasRole('ADMIN') or @inscPermisos.esInstructorDelCurso(#idCurso)")
    public ResponseEntity<?> obtenerInscripcion(@PathVariable String idCurso, @PathVariable String id) {
        return inscripcionServicio.obtenerPorIdYCurso(id, idCurso)
                .<ResponseEntity<?>>map(ResponseEntity::ok)
                .orElseGet(() -> ResponseEntity.notFound().build());
    }

    @PatchMapping(value = "/{id}/estado", consumes = "application/json", produces = "application/json")
    @PreAuthorize("hasRole('ADMIN') or @inscPermisos.esInscripcionPropia(#id)")
    public ResponseEntity<?> actualizarEstado(@PathVariable String idCurso,
                                              @PathVariable String id,
                                              @RequestBody @Valid EstadoRequest body) {
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
            return ResponseEntity.badRequest().body(Map.of("message","Estado inválido. Usa: activa | completada | cancelada | pendiente_pago | suspendida | expirada"));
        }

        // *** Regla nueva: SOLO ADMIN o INSTRUCTOR DEL CURSO pueden marcar COMPLETADA ***
        if (nuevo == Inscripcion.EstadoInscripcion.COMPLETADA) {
            if (!esAdmin() && !esInstructorDelCurso(idCurso)) {
                return ResponseEntity.status(403).body(Map.of("message", "Solo ADMIN o el INSTRUCTOR del curso pueden marcar como COMPLETADA."));
            }
        }

        var actualizada = inscripcionServicio.actualizarEstado(id, nuevo.name());

        // Ajustar snapshot del curso según transición ACTIVA <-> no ACTIVA
        if (antes != Inscripcion.EstadoInscripcion.ACTIVA && nuevo == Inscripcion.EstadoInscripcion.ACTIVA) {
            cursoServicio.incInscritosCount(idCurso, +1);
        } else if (antes == Inscripcion.EstadoInscripcion.ACTIVA && nuevo != Inscripcion.EstadoInscripcion.ACTIVA) {
            cursoServicio.incInscritosCount(idCurso, -1);
        }

        return ResponseEntity.ok(actualizada);
    }

    @DeleteMapping("/{id}")
    @PreAuthorize("hasRole('ADMIN') or @inscPermisos.esInscripcionPropia(#id)")
    public ResponseEntity<?> cancelar(@PathVariable String idCurso, @PathVariable String id) {
        var inscOpt = inscripcionServicio.obtenerPorIdYCurso(id, idCurso);
        if (inscOpt.isEmpty()) return ResponseEntity.notFound().build();
        inscripcionServicio.eliminar(id);
        return ResponseEntity.noContent().build();
    }

    @GetMapping("/contador")
    public ResponseEntity<?> contador(@PathVariable String idCurso) {
        long total = inscripcionServicio.contarActivasPorCurso(idCurso); // solo ACTIVA
        return ResponseEntity.ok(Map.of("cursoId", idCurso, "inscritosActivos", total));
    }

    public static record EstadoRequest(@NotBlank String estado) {}

    /* ================= helpers ================= */
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
                    // usamos el mismo util del servicio para resolver userId desde el email
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

// src/main/java/com/cursosonline/cursosonlinejs/Controladores/IntentoControlador.java
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

@RestController
@RequestMapping("/api/v1/evaluaciones/{idEvaluacion}/intentos")
@CrossOrigin(origins = "http://localhost:9090", allowCredentials = "true")
public class IntentoControlador {

    private final IntentoServicio intentoServicio;

    public IntentoControlador(IntentoServicio intentoServicio) {
        this.intentoServicio = intentoServicio;
    }

    /* ============ POST: iniciar intento ============ */
    // Estudiante solo si la evaluación (y su cadena) es visible; Admin/Instructor siempre.
    @PostMapping(consumes = "application/json", produces = "application/json")
    @PreAuthorize("hasRole('ADMIN') " +
            "or @intPermisos.esInstructorDeEvaluacion(#idEvaluacion) " +
            "or @intPermisos.estudiantePuedeInteractuar(#idEvaluacion)")
    public ResponseEntity<?> iniciar(@PathVariable String idEvaluacion,
                                     @RequestBody(required = false) IniciarIntentoRequest body) {
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

    /* ============ POST: entregar ============ */
    // Estudiante dueño SOLO si la cadena es visible; Admin/Instructor siempre.
    @PostMapping(value = "/{idIntento}/entregar", consumes = "application/json", produces = "application/json")
    @PreAuthorize("hasRole('ADMIN') " +
            "or @intPermisos.esInstructorDeIntento(#idIntento) " +
            "or @intPermisos.esDuenoDeIntentoConVisibilidad(#idIntento)")
    public ResponseEntity<?> entregar(@PathVariable String idEvaluacion,
                                      @PathVariable String idIntento,
                                      @Valid @RequestBody EntregaRequest body) {
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

    /* ============ ADMIN/INSTRUCTOR: ver todos de la evaluación ============ */
    @GetMapping(value = "/todos", produces = "application/json")
    @PreAuthorize("hasRole('ADMIN') or @intPermisos.esInstructorDeEvaluacion(#idEvaluacion)")
    public ResponseEntity<?> listarTodos(@PathVariable String idEvaluacion,
                                         @RequestParam(required = false) String estado) {
        var lista = intentoServicio.listarTodosPorEvaluacion(idEvaluacion, estado);
        if (lista.isEmpty()) return ResponseEntity.noContent().build();
        return ResponseEntity.ok(lista);
    }

    /* ============ GET: listar mis intentos en esa evaluación ============ */
    // Estudiante solo si la cadena es visible; Admin/Instructor siempre.
    @GetMapping(produces = "application/json")
    @PreAuthorize("hasRole('ADMIN') " +
            "or @intPermisos.esInstructorDeEvaluacion(#idEvaluacion) " +
            "or @intPermisos.estudiantePuedeInteractuar(#idEvaluacion)")
    public ResponseEntity<?> listar(@PathVariable String idEvaluacion) {
        String idEstudiante = intentoServicio.obtenerIdEstudianteActual().orElse(null);
        if (idEstudiante == null) return ResponseEntity.status(401).body("No autenticado.");
        List<Intento> intentos = intentoServicio.listarPorEvaluacionYEstudiante(idEvaluacion, idEstudiante);
        return ResponseEntity.ok(intentos);
    }

    /* ============ GET: obtener un intento (propio o instructor/admin) ============ */
    // Dueño solo con visibilidad; Admin/Instructor siempre.
    @GetMapping(value = "/{idIntento}", produces = "application/json")
    @PreAuthorize("hasRole('ADMIN') " +
            "or @intPermisos.esInstructorDeIntento(#idIntento) " +
            "or @intPermisos.esDuenoDeIntentoConVisibilidad(#idIntento)")
    public ResponseEntity<?> obtener(@PathVariable String idEvaluacion,
                                     @PathVariable String idIntento) {
        var intentoOpt = intentoServicio.obtener(idIntento);
        if (intentoOpt.isEmpty()) return ResponseEntity.notFound().build();

        var intento = intentoOpt.get();
        if (!idEvaluacion.equals(intento.getIdEvaluacion())) {
            return ResponseEntity.status(404).body("El intento no pertenece a la evaluación indicada.");
        }
        return ResponseEntity.ok(intento);
    }

    /* ============ PUT: actualizar completo (solo dueño y EN_PROGRESO + visibilidad) ============ */
    @PutMapping(value = "/{idIntento}", consumes = "application/json", produces = "application/json")
    @PreAuthorize("@intPermisos.esDuenoDeIntentoConVisibilidad(#idIntento)")
    public ResponseEntity<?> actualizar(@PathVariable String idEvaluacion,
                                        @PathVariable String idIntento,
                                        @Valid @RequestBody ActualizarIntentoRequest body) {
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

    /* ============ PATCH: actualizar parcial (solo dueño y EN_PROGRESO + visibilidad) ============ */
    @PatchMapping(value = "/{idIntento}", consumes = "application/json", produces = "application/json")
    @PreAuthorize("@intPermisos.esDuenoDeIntentoConVisibilidad(#idIntento)")
    public ResponseEntity<?> patch(@PathVariable String idEvaluacion,
                                   @PathVariable String idIntento,
                                   @RequestBody PatchIntentoRequest body) {
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

    /* ============ DELETE: eliminar (solo dueño y EN_PROGRESO + visibilidad) ============ */
    @DeleteMapping("/{idIntento}")
    @PreAuthorize("@intPermisos.esDuenoDeIntentoConVisibilidad(#idIntento)")
    public ResponseEntity<?> eliminar(@PathVariable String idEvaluacion,
                                      @PathVariable String idIntento) {
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

    /* ===== DTOs simples ===== */
    public static record IniciarIntentoRequest(
            @PositiveOrZero Integer timeLimitSeconds,
            BigDecimal puntajeMaximo
    ){}

    public static record EntregaRequest(
            @PositiveOrZero Integer tiempoSegundos,
            List<Intento.Respuesta> respuestas
    ){}

    public static record ActualizarIntentoRequest(
            List<Intento.Respuesta> respuestas,
            @PositiveOrZero Integer usedTimeSeconds
    ){}

    public static record PatchIntentoRequest(
            List<Intento.Respuesta> respuestas,
            @PositiveOrZero Integer usedTimeSeconds
    ){}
}

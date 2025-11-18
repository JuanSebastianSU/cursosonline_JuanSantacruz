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

    // ============================
    // INICIAR INTENTO
    // ============================
    @PostMapping(consumes = "application/json", produces = "application/json")
    @PreAuthorize("isAuthenticated()") // *** CAMBIO ***
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

    // ============================
    // ENTREGAR
    // ============================
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

    // ============================
    // LISTAR TODOS (ADMIN/INSTRUCTOR)
    // ============================
    @GetMapping(value = "/todos", produces = "application/json")
    @PreAuthorize("hasRole('ADMIN') or @intPermisos.esInstructorDeEvaluacion(#idEvaluacion)")
    public ResponseEntity<?> listarTodos(@PathVariable String idEvaluacion,
                                         @RequestParam(required = false) String estado) {
        var lista = intentoServicio.listarTodosPorEvaluacion(idEvaluacion, estado);
        if (lista.isEmpty()) return ResponseEntity.noContent().build();
        return ResponseEntity.ok(lista);
    }

    // ============================
    // LISTAR MIS INTENTOS
    // ============================
    @GetMapping(produces = "application/json")
    @PreAuthorize("isAuthenticated()") // *** CAMBIO ***
    public ResponseEntity<?> listar(@PathVariable String idEvaluacion) {
        String idEstudiante = intentoServicio.obtenerIdEstudianteActual().orElse(null);
        if (idEstudiante == null) return ResponseEntity.status(401).body("No autenticado.");
        List<Intento> intentos = intentoServicio.listarPorEvaluacionYEstudiante(idEvaluacion, idEstudiante);
        return ResponseEntity.ok(intentos);
    }

    // ============================
    // OBTENER UN INTENTO
    // ============================
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

    // ============================
    // ACTUALIZAR COMPLETO
    // ============================
    @PutMapping(value = "/{idIntento}", consumes = "application/json", produces = "application/json")
    @PreAuthorize("hasRole('ADMIN') or @intPermisos.esDuenoDeIntentoConVisibilidad(#idIntento)")
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

    // ============================
    // PATCH PARCIAL
    // ============================
    @PatchMapping(value = "/{idIntento}", consumes = "application/json", produces = "application/json")
    @PreAuthorize("hasRole('ADMIN') or @intPermisos.esDuenoDeIntentoConVisibilidad(#idIntento)")
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

    // ============================
    // ELIMINAR INTENTO PROPIO
    // ============================
    @DeleteMapping("/{idIntento}")
    @PreAuthorize("hasRole('ADMIN') or @intPermisos.esDuenoDeIntentoConVisibilidad(#idIntento)")
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

    // ============================
    // DTOs
    // ============================
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

// src/main/java/com/cursosonline/cursosonlinejs/Controladores/PagoControlador.java
package com.cursosonline.cursosonlinejs.Controladores;

import com.cursosonline.cursosonlinejs.Entidades.Pago;
import com.cursosonline.cursosonlinejs.Repositorios.UsuarioRepositorio;
import com.cursosonline.cursosonlinejs.Servicios.CursoServicio;
import com.cursosonline.cursosonlinejs.Servicios.InscripcionServicio;
import com.cursosonline.cursosonlinejs.Servicios.PagoServicio;

import jakarta.validation.Valid;
import jakarta.validation.constraints.Min;
import jakarta.validation.constraints.NotBlank;
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
@RequestMapping("/api/v1/inscripciones/{idInscripcion}/pagos")
@CrossOrigin(origins = "http://localhost:9090", allowCredentials = "true")
public class PagoControlador {

    private final PagoServicio pagoServicio;
    private final UsuarioRepositorio usuarioRepo;
    private final InscripcionServicio inscripcionServicio; // <-- nuevo
    private final CursoServicio cursoServicio;             // <-- nuevo

    public PagoControlador(PagoServicio pagoServicio,
                           UsuarioRepositorio usuarioRepo,
                           InscripcionServicio inscripcionServicio,
                           CursoServicio cursoServicio) {
        this.pagoServicio = pagoServicio;
        this.usuarioRepo = usuarioRepo;
        this.inscripcionServicio = inscripcionServicio;
        this.cursoServicio = cursoServicio;
    }

    private String currentUserId() {
        var auth = SecurityContextHolder.getContext().getAuthentication();
        if (auth == null || auth.getName() == null) return null;
        return usuarioRepo.findByEmail(auth.getName()).map(u -> u.getId()).orElse(null);
    }

    @GetMapping(produces = "application/json")
    @PreAuthorize("hasRole('ADMIN') or @pagoPermisos.esInstructorDeInscripcion(#idInscripcion) or @pagoPermisos.esDuenoDeInscripcion(#idInscripcion)")
    public ResponseEntity<List<Pago>> listarPagos(@PathVariable String idInscripcion) {
        return ResponseEntity.ok(pagoServicio.listarPorInscripcion(idInscripcion));
    }

    @GetMapping(value = "/{id}", produces = "application/json")
    @PreAuthorize("hasRole('ADMIN') or @pagoPermisos.esInstructorDeInscripcion(#idInscripcion) or @pagoPermisos.esDuenoDeInscripcion(#idInscripcion)")
    public ResponseEntity<?> obtenerPago(@PathVariable String idInscripcion, @PathVariable String id) {
        Pago pago = pagoServicio.listaPago(id);
        if (pago == null) return ResponseEntity.notFound().build();
        if (!idInscripcion.equals(pago.getIdInscripcion())) {
            return ResponseEntity.status(404).body(Map.of("message","El pago no pertenece a la inscripción especificada."));
        }
        return ResponseEntity.ok(pago);
    }

    @PostMapping(path = "/borrador", consumes = "application/json", produces = "application/json")
    @PreAuthorize("@pagoPermisos.esDuenoDeInscripcion(#idInscripcion)")
    public ResponseEntity<?> crearBorrador(@PathVariable String idInscripcion,
                                           @Valid @RequestBody CrearBorradorRequest body) {

        if (body.monto() == null || body.monto().compareTo(BigDecimal.ZERO) <= 0) {
            return ResponseEntity.badRequest().body(Map.of("message", "El monto debe ser mayor a 0."));
        }
        if (body.moneda() == null || body.moneda().isBlank()) {
            return ResponseEntity.badRequest().body(Map.of("message", "La moneda es obligatoria."));
        }
        if (body.metodo() == null) {
            return ResponseEntity.badRequest().body(Map.of("message", "El método de pago es obligatorio."));
        }

        String uid = currentUserId();
        if (uid == null) return ResponseEntity.status(401).body(Map.of("message","No autenticado."));

        Pago creado = pagoServicio.crearBorrador(
                idInscripcion, uid,
                body.monto(), body.moneda(), body.metodo(),
                body.referencia(), body.cupon(), body.gateway(), body.idempotencyKey()
        );
        URI location = URI.create("/api/v1/inscripciones/" + idInscripcion + "/pagos/" + creado.getId());
        return ResponseEntity.created(location).body(creado);
    }

    @PostMapping(path = "/{id}/checkout", produces = "application/json")
    @PreAuthorize("@pagoPermisos.esDuenoDePago(#id)")
    public ResponseEntity<?> aceptar(@PathVariable String idInscripcion, @PathVariable String id) {
        String uid = currentUserId();
        if (uid == null) return ResponseEntity.status(401).body(Map.of("message","No autenticado."));
        var ok = pagoServicio.aceptarPorUsuario(id, uid).orElse(null);
        if (ok == null) return ResponseEntity.notFound().build();
        if (!idInscripcion.equals(ok.getIdInscripcion())) {
            return ResponseEntity.status(404).body(Map.of("message","El pago no pertenece a la inscripción especificada."));
        }
        return ResponseEntity.ok(ok);
    }

    @PatchMapping(path = "/{id}", consumes = "application/json", produces = "application/json")
    @PreAuthorize("@pagoPermisos.esDuenoDePago(#id)")
    public ResponseEntity<?> editarBorrador(@PathVariable String idInscripcion,
                                            @PathVariable String id,
                                            @RequestBody EditarBorradorRequest body) {
        var editado = pagoServicio.actualizarBorrador(
                id,
                body.monto(), body.moneda(), body.metodo(),
                body.referencia(), body.cupon(), body.gateway()
        ).orElse(null);

        if (editado == null) return ResponseEntity.notFound().build();
        if (!idInscripcion.equals(editado.getIdInscripcion())) {
            return ResponseEntity.status(404).body(Map.of("message","El pago no pertenece a la inscripción especificada."));
        }
        return ResponseEntity.ok(editado);
    }

    @DeleteMapping("/{id}")
    @PreAuthorize("@pagoPermisos.esDuenoDePago(#id)")
    public ResponseEntity<?> eliminarBorrador(@PathVariable String idInscripcion,
                                              @PathVariable String id) {
        String uid = currentUserId();
        if (uid == null) return ResponseEntity.status(401).body(Map.of("message","No autenticado."));
        try {
            boolean ok = pagoServicio.eliminarSiPendiente(id, idInscripcion, uid);
            return ok ? ResponseEntity.noContent().build()
                      : ResponseEntity.notFound().build();
        } catch (IllegalStateException ex) {
            return ResponseEntity.status(409).body(Map.of("message", ex.getMessage()));
        }
    }

    // ==================== APROBAR (admin/instructor) ====================
    @PostMapping("/{id}/aprobar")
    @PreAuthorize("hasRole('ADMIN') or @pagoPermisos.esInstructorDeInscripcion(#idInscripcion)")
    public ResponseEntity<?> aprobarPago(@PathVariable String idInscripcion,
                                         @PathVariable String id,
                                         @RequestBody(required = false) Map<String, Object> body) {

        String gatewayPaymentId = body != null ? (String) body.get("gatewayPaymentId") : null;
        String authorizationCode = body != null ? (String) body.get("authorizationCode") : null;
        String reciboUrl = body != null ? (String) body.get("reciboUrl") : null;

        var pago = pagoServicio.marcarAprobado(id, gatewayPaymentId, authorizationCode, reciboUrl, true)
                .orElse(null);
        if (pago == null) return ResponseEntity.notFound().build();

        // Activar inscripción si estaba pendiente y ajustar snapshot del curso
        String idCurso = inscripcionServicio.activarSiPendientePago(idInscripcion);
        if (idCurso != null) {
            cursoServicio.incInscritosCount(idCurso, +1); // incremento atómico
        }

        return ResponseEntity.ok(pago);
    }

    /* ==================== DTOs ==================== */
    public static record CrearBorradorRequest(
            @NotNull @Min(0) BigDecimal monto,
            @NotBlank String moneda,
            @NotNull Pago.MetodoPago metodo,
            String referencia,
            String cupon,
            String gateway,
            String idempotencyKey
    ) {}

    public static record EditarBorradorRequest(
            BigDecimal monto,
            String moneda,
            Pago.MetodoPago metodo,
            String referencia,
            String cupon,
            String gateway
    ) {}
}

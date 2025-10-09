// src/main/java/com/cursosonline/cursosonlinejs/Servicios/PagoServicio.java
package com.cursosonline.cursosonlinejs.Servicios;

import com.cursosonline.cursosonlinejs.Entidades.Pago;
import com.cursosonline.cursosonlinejs.Repositorios.PagoRepositorio;
import org.springframework.stereotype.Service;

import java.math.BigDecimal;
import java.time.Instant;
import java.util.List;
import java.util.Optional;

@Service
public class PagoServicio {

    private final PagoRepositorio pagoRepositorio;
    private final InscripcionServicio inscripcionServicio;
    private final CursoServicio cursoServicio;

    public PagoServicio(PagoRepositorio pagoRepositorio,
                        InscripcionServicio inscripcionServicio,
                        CursoServicio cursoServicio) { // <—
        this.pagoRepositorio = pagoRepositorio;
        this.inscripcionServicio = inscripcionServicio;
        this.cursoServicio = cursoServicio; // <—
    }
    /* =========================================================
     * ========  CRUD básico (se mantienen utilidades)  ========
     * ========================================================= */

    public Pago guardar(Pago pago) {
        if (pago.getMoneda() != null) pago.setMoneda(pago.getMoneda().trim().toUpperCase());
        if (pago.getEstado() == null) pago.setEstado(Pago.EstadoPago.PENDIENTE);
        return pagoRepositorio.save(pago);
    }

    public List<Pago> listaAll() { return pagoRepositorio.findAll(); }

    public Pago listaPago(String id) { return pagoRepositorio.findById(id).orElse(null); }

    public void eliminar(String id) { pagoRepositorio.deleteById(id); }

    public List<Pago> listarPorInscripcion(String idInscripcion) {
        return pagoRepositorio.findByIdInscripcion(idInscripcion);
    }

    public boolean existePagoAprobado(String idInscripcion) {
        return pagoRepositorio.existsByIdInscripcionAndEstado(idInscripcion, Pago.EstadoPago.APROBADO);
    }

    public Pago buscarPorReferencia(String referencia) {
        return pagoRepositorio.findByReferencia(referencia).orElse(null);
    }

    /* =========================================================
     * ===============  Flujo “borrador” del usuario  ==========
     * ========================================================= */

    /**
     * Crea un pago en estado PENDIENTE (borrador editable por el usuario).
     * No tocará pagoIds de la inscripción aún.
     */
    public Pago crearBorrador(String idInscripcion, String userId,
                              BigDecimal monto, String moneda, Pago.MetodoPago metodo,
                              String referencia, String cupon, String gateway, String idempotencyKey) {

        validarMontoYMonedaYMetodo(monto, moneda, metodo);

        Pago p = new Pago();
        p.setIdInscripcion(idInscripcion);
        p.setUserId(userId);
        p.setMonto(monto);
        p.setMoneda(moneda.trim().toUpperCase());
        p.setMetodo(metodo);
        p.setEstado(Pago.EstadoPago.PENDIENTE);
        p.setReferencia(referencia);
        p.setCupon(cupon);
        p.setGateway(gateway);
        p.setIdempotencyKey(idempotencyKey);
        return pagoRepositorio.save(p);
    }

    /**
     * Actualiza campos editables del borrador. Solo si sigue PENDIENTE.
     * Útil para que el usuario modifique monto/moneda/método antes de aceptar.
     */
    public Optional<Pago> actualizarBorrador(String idPago,
                                             BigDecimal monto, String moneda, Pago.MetodoPago metodo,
                                             String referencia, String cupon, String gateway) {

        return pagoRepositorio.findById(idPago).map(p -> {
            exigirEstado(p, Pago.EstadoPago.PENDIENTE, "Solo se puede editar un pago en estado PENDIENTE.");
            if (monto != null || moneda != null || metodo != null) {
                validarMontoYMonedaYMetodo(
                        (monto != null ? monto : p.getMonto()),
                        (moneda != null ? moneda : p.getMoneda()),
                        (metodo != null ? metodo : p.getMetodo())
                );
            }
            if (monto != null) p.setMonto(monto);
            if (moneda != null) p.setMoneda(moneda.trim().toUpperCase());
            if (metodo != null) p.setMetodo(metodo);
            if (referencia != null) p.setReferencia(referencia);
            if (cupon != null) p.setCupon(cupon);
            if (gateway != null) p.setGateway(gateway);
            return pagoRepositorio.save(p);
        });
    }

    /**
     * Aceptación del usuario (p.ej., “Confirmar y pagar”).
     * Transición: PENDIENTE -> AUTORIZADO.
     * Sella autorizadoAt.
     */
    public Optional<Pago> aceptarPorUsuario(String idPago, String expectedUserId) {
        return pagoRepositorio.findById(idPago).map(p -> {
            exigirEstado(p, Pago.EstadoPago.PENDIENTE, "Solo se puede aceptar un pago en estado PENDIENTE.");
            if (expectedUserId != null && p.getUserId() != null && !p.getUserId().equals(expectedUserId)) {
                throw new SecurityException("Este pago no pertenece al usuario autenticado.");
            }
            p.setEstado(Pago.EstadoPago.AUTORIZADO);
            p.setAutorizadoAt(Instant.now());
            return pagoRepositorio.save(p);
        });
    }

    /**
     * Elimina un pago borrador si aún está PENDIENTE.
     */
    public boolean eliminarSiPendiente(String idPago, String idInscripcion, String expectedUserId) {
        return pagoRepositorio.findByIdAndIdInscripcion(idPago, idInscripcion).map(p -> {
            exigirEstado(p, Pago.EstadoPago.PENDIENTE, "Solo se puede eliminar un pago en estado PENDIENTE.");
            if (expectedUserId != null && p.getUserId() != null && !p.getUserId().equals(expectedUserId)) {
                throw new SecurityException("Este pago no pertenece al usuario autenticado.");
            }
            pagoRepositorio.deleteById(idPago);
            return true;
        }).orElse(false);
    }

    /* =========================================================
     * ===============  Transiciones de pasarela  ===============
     *        (usualmente desde admin/instructor o webhook)
     * ========================================================= */

    /**
     * Marca como FALLIDO desde pasarela (autorización o captura falló).
     * Transiciones válidas: PENDIENTE|AUTORIZADO -> FALLIDO.
     */
    public Optional<Pago> marcarFallido(String idPago, String gatewayPaymentId) {
        return pagoRepositorio.findById(idPago).map(p -> {
            exigirEstadoEn(p,
                    new Pago.EstadoPago[]{Pago.EstadoPago.PENDIENTE, Pago.EstadoPago.AUTORIZADO},
                    "Solo se puede marcar FALLIDO desde PENDIENTE o AUTORIZADO."
            );
            if (gatewayPaymentId != null) p.setGatewayPaymentId(gatewayPaymentId);
            p.setEstado(Pago.EstadoPago.FALLIDO);
            p.setFallidoAt(Instant.now());
            return pagoRepositorio.save(p);
        });
    }

    /**
     * Marca como APROBADO (pagado) y enlaza a la inscripción (pagoIds + idPago).
     * Transiciones válidas: AUTORIZADO|PENDIENTE -> APROBADO.
     *
     * Usa este método si tu pasarela REPORTA “aprobado/pagado” sin paso de captura.
     * Si tu flujo tiene “captura” explícita, usa marcarCapturado().
     */
    public Optional<Pago> marcarAprobado(String idPago,
                                         String gatewayPaymentId,
                                         String authorizationCode,
                                         String reciboUrl,
                                         boolean principal) {
        return pagoRepositorio.findById(idPago).map(p -> {
            exigirEstadoEn(p,
                    new Pago.EstadoPago[]{Pago.EstadoPago.AUTORIZADO, Pago.EstadoPago.PENDIENTE},
                    "Solo se puede aprobar desde PENDIENTE o AUTORIZADO."
            );
            if (gatewayPaymentId != null) p.setGatewayPaymentId(gatewayPaymentId);
            if (authorizationCode != null) p.setAuthorizationCode(authorizationCode);
            if (reciboUrl != null) p.setReciboUrl(reciboUrl);

            p.setEstado(Pago.EstadoPago.APROBADO);
            p.setPagadoAt(Instant.now());
            Pago guardado = pagoRepositorio.save(p);

            // Enlazar a inscripción
            inscripcionServicio.anexarPagoAInscripcion(p.getIdInscripcion(), p.getId(), principal);

            // Activar si estaba pendiente y refrescar contador del curso
            String idCurso = inscripcionServicio.activarSiPendientePago(p.getIdInscripcion());
            if (idCurso != null) {
                cursoServicio.reconstruirInscritosCount(idCurso);
            }

            return guardado;
        });
    }

    public Optional<Pago> marcarCapturado(String idPago,
                                          String gatewayPaymentId,
                                          String authorizationCode,
                                          String reciboUrl,
                                          boolean principal) {
        return pagoRepositorio.findById(idPago).map(p -> {
            exigirEstadoEn(p,
                    new Pago.EstadoPago[]{Pago.EstadoPago.AUTORIZADO, Pago.EstadoPago.PENDIENTE},
                    "Solo se puede capturar desde PENDIENTE o AUTORIZADO."
            );
            if (gatewayPaymentId != null) p.setGatewayPaymentId(gatewayPaymentId);
            if (authorizationCode != null) p.setAuthorizationCode(authorizationCode);
            if (reciboUrl != null) p.setReciboUrl(reciboUrl);

            p.setEstado(Pago.EstadoPago.CAPTURADO);
            p.setPagadoAt(Instant.now());
            Pago guardado = pagoRepositorio.save(p);

            inscripcionServicio.anexarPagoAInscripcion(p.getIdInscripcion(), p.getId(), principal);

            // Activar si estaba pendiente y refrescar contador del curso
            String idCurso = inscripcionServicio.activarSiPendientePago(p.getIdInscripcion());
            if (idCurso != null) {
                cursoServicio.reconstruirInscritosCount(idCurso);
            }

            return guardado;
        });
    }

    /**
     * Marca como CANCELADO (antes de que haya dinero efectivo).
     * Transiciones válidas:
     *   - PENDIENTE -> CANCELADO (usuario se arrepiente antes de pagar)
     *   - AUTORIZADO -> CANCELADO (anular autorización si tu pasarela lo permite)
     */
    public Optional<Pago> marcarCancelado(String idPago) {
        return pagoRepositorio.findById(idPago).map(p -> {
            exigirEstadoEn(p,
                    new Pago.EstadoPago[]{Pago.EstadoPago.PENDIENTE, Pago.EstadoPago.AUTORIZADO},
                    "Solo se puede cancelar un pago PENDIENTE o AUTORIZADO."
            );
            p.setEstado(Pago.EstadoPago.CANCELADO);
            return pagoRepositorio.save(p);
        });
    }

    /**
     * Marca como REEMBOLSADO (deshacer un APROBADO/CAPTURADO).
     * Transiciones válidas: APROBADO|CAPTURADO -> REEMBOLSADO.
     *
     * Política: NO removemos el id del pago de pagoIds; así mantienes trazabilidad.
     * Si deseas “cerrar” el acceso del curso, hazlo en el controlador/servicio de Inscripción.
     */
    public Optional<Pago> marcarReembolsado(String idPago, String gatewayPaymentId) {
        return pagoRepositorio.findById(idPago).map(p -> {
            exigirEstadoEn(p,
                    new Pago.EstadoPago[]{Pago.EstadoPago.APROBADO, Pago.EstadoPago.CAPTURADO},
                    "Solo se puede reembolsar un pago APROBADO o CAPTURADO."
            );
            if (gatewayPaymentId != null) p.setGatewayPaymentId(gatewayPaymentId);
            p.setEstado(Pago.EstadoPago.REEMBOLSADO);
            p.setReembolsadoAt(Instant.now());
            return pagoRepositorio.save(p);
        });
    }

    /* =========================================================
     * =====================  Validaciones  =====================
     * ========================================================= */

    private void validarMontoYMonedaYMetodo(BigDecimal monto, String moneda, Pago.MetodoPago metodo) {
        if (monto == null || monto.compareTo(BigDecimal.ZERO) <= 0)
            throw new IllegalArgumentException("El monto debe ser mayor a 0.");
        if (moneda == null || moneda.isBlank())
            throw new IllegalArgumentException("La moneda es obligatoria.");
        if (metodo == null)
            throw new IllegalArgumentException("El método de pago es obligatorio.");
    }

    private void exigirEstado(Pago p, Pago.EstadoPago esperado, String msg) {
        if (p.getEstado() != esperado) throw new IllegalStateException(msg);
    }

    private void exigirEstadoEn(Pago p, Pago.EstadoPago[] permitidos, String msg) {
        for (Pago.EstadoPago ok : permitidos) {
            if (p.getEstado() == ok) return;
        }
        throw new IllegalStateException(msg);
    }
}

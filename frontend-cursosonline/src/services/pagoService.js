// src/services/pagoService.js
// Endpoints para /api/v1/inscripciones/{idInscripcion}/pagos

import api from "./api";

// -------- LISTAR --------
export const listarPagosPorInscripcion = async (idInscripcion) => {
  try {
    const res = await api.get(`/v1/inscripciones/${idInscripcion}/pagos`);
    return res.data;
  } catch (err) {
    console.error(
      "Error al listar pagos:",
      err.response?.data || err.message
    );
    throw err;
  }
};

// -------- OBTENER UNO --------
export const obtenerPago = async (idInscripcion, idPago) => {
  try {
    const res = await api.get(
      `/v1/inscripciones/${idInscripcion}/pagos/${idPago}`
    );
    return res.data;
  } catch (err) {
    console.error(
      "Error al obtener pago:",
      err.response?.data || err.message
    );
    throw err;
  }
};

// -------- CREAR BORRADOR --------
/**
 * body: {
 *   monto: number,
 *   moneda: "USD" | "EUR" | ... (ISO-4217),
 *   metodo: "TARJETA" | "TRANSFERENCIA" | "PAYPAL" | "STRIPE" | "EFECTIVO" | "MERCADOPAGO",
 *   referencia?: string,
 *   cupon?: string,
 *   gateway?: string,
 *   idempotencyKey?: string
 * }
 */
export const crearPagoBorrador = async (idInscripcion, body) => {
  try {
    const res = await api.post(
      `/v1/inscripciones/${idInscripcion}/pagos/borrador`,
      body
    );
    return res.data;
  } catch (err) {
    console.error(
      "Error al crear borrador de pago:",
      err.response?.data || err.message
    );
    throw err;
  }
};

// -------- EDITAR BORRADOR (PATCH) --------
export const editarPagoBorrador = async (idInscripcion, idPago, body) => {
  try {
    const res = await api.patch(
      `/v1/inscripciones/${idInscripcion}/pagos/${idPago}`,
      body
    );
    return res.data;
  } catch (err) {
    console.error(
      "Error al editar borrador de pago:",
      err.response?.data || err.message
    );
    throw err;
  }
};

// -------- ELIMINAR BORRADOR --------
export const eliminarPagoBorrador = async (idInscripcion, idPago) => {
  try {
    await api.delete(`/v1/inscripciones/${idInscripcion}/pagos/${idPago}`);
    return true;
  } catch (err) {
    console.error(
      "Error al eliminar borrador de pago:",
      err.response?.data || err.message
    );
    return false;
  }
};

// -------- CHECKOUT (aceptar por el usuario) --------
export const checkoutPago = async (idInscripcion, idPago) => {
  try {
    const res = await api.post(
      `/v1/inscripciones/${idInscripcion}/pagos/${idPago}/checkout`
    );
    return res.data;
  } catch (err) {
    console.error(
      "Error al enviar pago a revisión (checkout):",
      err.response?.data || err.message
    );
    throw err;
  }
};

// -------- APROBAR (ADMIN / INSTRUCTOR) --------
// (por si luego quieres una pantallita de revisión de pagos)
export const aprobarPago = async (
  idInscripcion,
  idPago,
  { gatewayPaymentId, authorizationCode, reciboUrl } = {}
) => {
  try {
    const body = {
      gatewayPaymentId: gatewayPaymentId || null,
      authorizationCode: authorizationCode || null,
      reciboUrl: reciboUrl || null,
    };

    const res = await api.post(
      `/v1/inscripciones/${idInscripcion}/pagos/${idPago}/aprobar`,
      body
    );
    return res.data;
  } catch (err) {
    console.error(
      "Error al aprobar pago:",
      err.response?.data || err.message
    );
    throw err;
  }
};

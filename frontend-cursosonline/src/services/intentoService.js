// src/services/intentoService.js
// Endpoints para /api/v1/evaluaciones/{idEvaluacion}/intentos
// OJO: api.js ya tiene baseURL = "http://localhost:8080/api"
// así que aquí usamos rutas que empiezan en /v1/...

import api from "./api";

/**
 * Servicio para gestionar intentos de evaluación.
 *
 * Backend esperado:
 *  - (ALUMNO)  GET  /api/v1/evaluaciones/{idEvaluacion}/intentos
 *  - (INSTR.)  GET  /api/v1/evaluaciones/{idEvaluacion}/intentos/todos
 *  - POST      /api/v1/evaluaciones/{idEvaluacion}/intentos
 *  - POST      /api/v1/evaluaciones/{idEvaluacion}/intentos/{idIntento}/entregar
 *  - GET       /api/v1/evaluaciones/{idEvaluacion}/intentos/{idIntento}
 *  - PUT       /api/v1/evaluaciones/{idEvaluacion}/intentos/{idIntento}
 *  - PATCH     /api/v1/evaluaciones/{idEvaluacion}/intentos/{idIntento}
 *  - DELETE    /api/v1/evaluaciones/{idEvaluacion}/intentos/{idIntento}
 */

// ======================= ALUMNO =======================

// Listar intentos del estudiante actual en una evaluación
export const listarMisIntentos = async (idEvaluacion) => {
  try {
    const res = await api.get(`/v1/evaluaciones/${idEvaluacion}/intentos`);
    return res.data;
  } catch (err) {
    console.error(
      "Error al listar intentos:",
      err.response?.data || err.message
    );
    throw err;
  }
};

// Iniciar intento (POST /intentos)
export const iniciarIntento = async (idEvaluacion, body) => {
  try {
    // body es opcional: { timeLimitSeconds, puntajeMaximo } o {}
    const payload = body ?? {};
    const res = await api.post(
      `/v1/evaluaciones/${idEvaluacion}/intentos`,
      payload
    );
    return res.data;
  } catch (err) {
    console.error(
      "Error al iniciar intento:",
      err.response?.data || err.message
    );
    throw err;
  }
};

// Entregar intento (POST /{idIntento}/entregar)
export const entregarIntento = async (idEvaluacion, idIntento, body) => {
  try {
    const res = await api.post(
      `/v1/evaluaciones/${idEvaluacion}/intentos/${idIntento}/entregar`,
      body
    );
    return res.data;
  } catch (err) {
    console.error(
      "Error al entregar intento:",
      err.response?.data || err.message
    );
    throw err;
  }
};

// ======================= INSTRUCTOR / ADMIN =======================

// Listar TODOS los intentos de una evaluación (para revisar y calificar)
// Ajusta la ruta si en tu backend usas otra distinta.
export const listarIntentosEvaluacionInstructor = async (idEvaluacion) => {
  try {
    const res = await api.get(
      `/v1/evaluaciones/${idEvaluacion}/intentos/todos`
    );
    return res.data;
  } catch (err) {
    console.error(
      "Error al listar intentos (instructor):",
      err.response?.data || err.message
    );
    throw err;
  }
};

// ======================= COMUNES / OPCIONALES =======================

// Obtener intento concreto
export const obtenerIntento = async (idEvaluacion, idIntento) => {
  try {
    const res = await api.get(
      `/v1/evaluaciones/${idEvaluacion}/intentos/${idIntento}`
    );
    return res.data;
  } catch (err) {
    console.error(
      "Error al obtener intento:",
      err.response?.data || err.message
    );
    throw err;
  }
};

// Actualizar completo (PUT) – opcional
export const actualizarIntento = async (idEvaluacion, idIntento, body) => {
  try {
    const res = await api.put(
      `/v1/evaluaciones/${idEvaluacion}/intentos/${idIntento}`,
      body
    );
    return res.data;
  } catch (err) {
    console.error(
      "Error al actualizar intento:",
      err.response?.data || err.message
    );
    throw err;
  }
};

// Patch parcial (PATCH) – opcional
export const patchIntento = async (idEvaluacion, idIntento, body) => {
  try {
    const res = await api.patch(
      `/v1/evaluaciones/${idEvaluacion}/intentos/${idIntento}`,
      body
    );
    return res.data;
  } catch (err) {
    console.error(
      "Error al hacer patch de intento:",
      err.response?.data || err.message
    );
    throw err;
  }
};

// Eliminar intento (DELETE) – sólo si el backend lo permite
export const eliminarIntento = async (idEvaluacion, idIntento) => {
  try {
    await api.delete(`/v1/evaluaciones/${idEvaluacion}/intentos/${idIntento}`);
    return true;
  } catch (err) {
    console.error(
      "Error al eliminar intento:",
      err.response?.data || err.message
    );
    return false;
  }
};

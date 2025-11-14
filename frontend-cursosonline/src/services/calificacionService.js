// src/services/calificacionService.js
import api from "./api";

/**
 * Servicio para gestionar calificaciones de intentos de evaluación.
 *
 * Backend:
 *  - POST   /api/v1/intentos/{idIntento}/calificacion
 *  - GET    /api/v1/intentos/{idIntento}/calificacion
 *  - GET    /api/v1/calificaciones/{id}
 *  - GET    /api/v1/evaluaciones/{idEvaluacion}/calificaciones
 *  - PATCH  /api/v1/calificaciones/{id}
 *  - PATCH  /api/v1/calificaciones/{id}/publicar
 *  - DELETE /api/v1/calificaciones/{id}
 *
 * OJO: api.js ya tiene baseURL = "http://localhost:8080/api"
 * así que aquí usamos rutas que empiezan en /v1/...
 */

// INSTRUCTOR: crear calificación de un intento
export const calificarIntento = async (idIntento, { puntaje, feedback }) => {
  const payload = {
    puntaje: Number(puntaje), // Integer @Min(0)
    feedback: feedback?.trim() || null,
  };
  const res = await api.post(`/v1/intentos/${idIntento}/calificacion`, payload);
  return res.data;
};

// ALUMNO / INSTRUCTOR: obtener calificación por intento
export const obtenerCalificacionPorIntento = async (idIntento) => {
  try {
    const res = await api.get(`/v1/intentos/${idIntento}/calificacion`);
    return res.data;
  } catch (err) {
    if (err.response?.status === 404) return null; // todavía no hay calificación
    throw err;
  }
};

// ALUMNO / INSTRUCTOR: obtener calificación por ID
export const obtenerCalificacion = async (idCalificacion) => {
  try {
    const res = await api.get(`/v1/calificaciones/${idCalificacion}`);
    return res.data;
  } catch (err) {
    if (err.response?.status === 404) return null;
    throw err;
  }
};

// INSTRUCTOR / ADMIN: listar calificaciones de una evaluación
export const listarCalificacionesPorEvaluacion = async (idEvaluacion) => {
  try {
    const res = await api.get(`/v1/evaluaciones/${idEvaluacion}/calificaciones`);
    return Array.isArray(res.data) ? res.data : [];
  } catch (err) {
    if (err.response?.status === 204) return [];
    throw err;
  }
};

// INSTRUCTOR / ADMIN: actualizar puntaje/feedback
export const actualizarCalificacion = async (idCalificacion, { puntaje, feedback }) => {
  const payload = {
    puntaje:
      puntaje === null || puntaje === undefined
        ? null
        : Number(puntaje),
    feedback: feedback?.trim() || null,
  };
  const res = await api.patch(`/v1/calificaciones/${idCalificacion}`, payload);
  return res.data;
};

// INSTRUCTOR / ADMIN: publicar calificación (estado PUBLICADA)
export const publicarCalificacion = async (idCalificacion) => {
  const res = await api.patch(`/v1/calificaciones/${idCalificacion}/publicar`);
  return res.data;
};

// INSTRUCTOR / ADMIN: eliminar calificación
export const eliminarCalificacion = async (idCalificacion) => {
  try {
    await api.delete(`/v1/calificaciones/${idCalificacion}`);
    return true;
  } catch (err) {
    if (err.response?.status === 404) return false;
    throw err;
  }
};

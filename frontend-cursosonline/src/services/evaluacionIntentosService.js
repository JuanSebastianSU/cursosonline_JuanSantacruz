// src/services/evaluacionIntentosService.js
import api from "./api";

/**
 * Devuelve los intentos / calificaciones visibles para el instructor.
 *
 * IMPORTANTE:
 * Ajusta la URL "/v1/instructor/evaluaciones-intentos"
 * a la ruta real de tu backend si es distinta.
 */
export const listarIntentosEvaluaciones = async (params = {}) => {
  try {
    const res = await api.get("/v1/instructor/evaluaciones-intentos", {
      params,
    });

    // Si tu backend devuelve { content: [...] } tipo Spring Pageable:
    if (Array.isArray(res.data)) return res.data;
    if (Array.isArray(res.data.content)) return res.data.content;

    return [];
  } catch (err) {
    console.error(
      "Error al listar intentos de evaluaciones:",
      err.response?.data || err.message
    );
    throw err;
  }
};

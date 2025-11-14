// src/services/evaluacionService.js
import api from "./api";

/**
 * evaluacionService.js
 * Endpoints para /api/v1/lecciones/{idLeccion}/evaluaciones
 *
 * OJO: api.js ya tiene baseURL = "http://localhost:8080/api",
 * así que aquí usamos rutas que empiezan en /v1/...
 */

// ============ LISTAR ============

export const listarEvaluacionesPorLeccion = async (idLeccion) => {
  try {
    const res = await api.get(`/v1/lecciones/${idLeccion}/evaluaciones`);
    return res.data;
  } catch (err) {
    console.error(
      "Error al listar evaluaciones:",
      err.response?.data || err.message
    );
    throw err;
  }
};

// ============ OBTENER UNA ============

export const obtenerEvaluacion = async (idLeccion, idEval) => {
  try {
    const res = await api.get(
      `/v1/lecciones/${idLeccion}/evaluaciones/${idEval}`
    );
    return res.data;
  } catch (err) {
    console.error(
      "Error al obtener evaluación:",
      err.response?.data || err.message
    );
    throw err;
  }
};

// ============ CREAR ============

/**
 * body: { titulo, tipo, puntajeMaximo }
 * tipo: "quiz" | "tarea"
 */
export const crearEvaluacion = async (idLeccion, body) => {
  try {
    const payload = {
      titulo: body.titulo,
      tipo: body.tipo, // "quiz" | "tarea"
      puntajeMaximo: body.puntajeMaximo,
    };
    const res = await api.post(
      `/v1/lecciones/${idLeccion}/evaluaciones`,
      payload
    );
    return res.data;
  } catch (err) {
    console.error(
      "Error al crear evaluación:",
      err.response?.data || err.message
    );
    throw err;
  }
};

// ============ ACTUALIZAR COMPLETO (PUT) ============

export const actualizarEvaluacion = async (idLeccion, idEval, body) => {
  try {
    const payload = {
      titulo: body.titulo,
      tipo: body.tipo,
      puntajeMaximo: body.puntajeMaximo,
    };
    const res = await api.put(
      `/v1/lecciones/${idLeccion}/evaluaciones/${idEval}`,
      payload
    );
    return res.data;
  } catch (err) {
    console.error(
      "Error al actualizar evaluación:",
      err.response?.data || err.message
    );
    throw err;
  }
};

// ============ PATCH PARCIAL ============

export const patchEvaluacion = async (idLeccion, idEval, body) => {
  try {
    const res = await api.patch(
      `/v1/lecciones/${idLeccion}/evaluaciones/${idEval}`,
      body
    );
    return res.data;
  } catch (err) {
    console.error(
      "Error al hacer patch de evaluación:",
      err.response?.data || err.message
    );
    throw err;
  }
};

// ============ PUBLICAR / ARCHIVAR ============

export const publicarEvaluacion = async (idLeccion, idEval) => {
  try {
    const res = await api.patch(
      `/v1/lecciones/${idLeccion}/evaluaciones/${idEval}/publicar`
    );
    return res.data;
  } catch (err) {
    console.error(
      "Error al publicar evaluación:",
      err.response?.data || err.message
    );
    throw err;
  }
};

export const archivarEvaluacion = async (idLeccion, idEval) => {
  try {
    const res = await api.patch(
      `/v1/lecciones/${idLeccion}/evaluaciones/${idEval}/archivar`
    );
    return res.data;
  } catch (err) {
    console.error(
      "Error al archivar evaluación:",
      err.response?.data || err.message
    );
    throw err;
  }
};

// ============ ELIMINAR ============

export const eliminarEvaluacion = async (idLeccion, idEval) => {
  try {
    await api.delete(`/v1/lecciones/${idLeccion}/evaluaciones/${idEval}`);
    return true;
  } catch (err) {
    console.error(
      "Error al eliminar evaluación:",
      err.response?.data || err.message
    );
    return false;
  }
};

// ============ INTENTOS / CALIFICACIONES (INSTRUCTOR) ============

/**
 * Lista los intentos de una evaluación concreta.
 * Espera un endpoint tipo:
 *   GET /api/v1/evaluaciones/{idEvaluacion}/intentos
 *
 * El controlador de intentos ya se encarga de meter la info
 * de alumno, evaluación y lección.
 */
export const listarIntentosPorEvaluacion = async (idEvaluacion) => {
  try {
    const res = await api.get(`/v1/evaluaciones/${idEvaluacion}/intentos`);
    return res.data;
  } catch (err) {
    console.error(
      "Error al listar intentos de la evaluación:",
      err.response?.data || err.message
    );
    throw err;
  }
};

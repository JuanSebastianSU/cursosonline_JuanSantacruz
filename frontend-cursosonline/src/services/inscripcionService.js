// src/services/inscripcionService.js
import api from "./api";

/**
 * inscripcionService.js
 * Endpoints:
 *  - POST   /v1/cursos/{idCurso}/inscripciones
 *  - GET    /v1/mi/inscripciones?estado=
 *  - GET    /v1/mi/inscripciones/curso/{idCurso}
 */

// =============== INSCRIBIRME EN UN CURSO ===============
export const inscribirmeEnCurso = async (idCurso) => {
  try {
    const res = await api.post(`/v1/cursos/${idCurso}/inscripciones`);
    return res.data;
  } catch (err) {
    console.error(
      "Error al inscribirme en el curso:",
      err.response?.data || err.message
    );
    throw err;
  }
};

// ✅ Alias con el nombre que usa CursoDetalle.jsx
export const inscribirseEnCurso = inscribirmeEnCurso;

// =============== MIS INSCRIPCIONES (LISTA) ===============
export const listarMisInscripciones = async (estado) => {
  try {
    const params = {};
    if (estado) params.estado = estado;
    const res = await api.get("/v1/mi/inscripciones", { params });
    return res.data || [];
  } catch (err) {
    console.error(
      "Error al listar mis inscripciones:",
      err.response?.data || err.message
    );
    throw err;
  }
};

// =============== MI INSCRIPCIÓN EN UN CURSO CONCRETO ===============
export const obtenerMiInscripcionEnCurso = async (idCurso) => {
  try {
    const res = await api.get(`/v1/mi/inscripciones/curso/${idCurso}`);
    return res.data;
  } catch (err) {
    console.error(
      "Error al obtener mi inscripción en el curso:",
      err.response?.data || err.message
    );
    throw err;
  }
};

export const listarInscripcionesPorCurso = async (idCurso, estado) => {
  try {
    const params = {};
    if (estado) params.estado = estado; // opcional, por si luego filtras

    const res = await api.get(`/v1/cursos/${idCurso}/inscripciones`, {
      params,
    });
    return res.data;
  } catch (err) {
    console.error(
      "Error al listar inscripciones del curso:",
      err.response?.data || err.message
    );
    throw err;
  }
};

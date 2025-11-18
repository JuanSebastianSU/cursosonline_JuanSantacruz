// src/services/progresoService.js
import api from "./api";

/**
 * Progreso del alumno logueado en un curso
 * Backend: GET /api/v1/cursos/{idCurso}/mi-progreso
 */
export const obtenerMiProgreso = async (idCurso) => {
  const url = `/v1/cursos/${idCurso}/mi-progreso`;  // 👈 importante el /v1
  // console.log("[PROGRESO] GET", url);
  const resp = await api.get(url);
  return resp.data; // solo el DTO
};

/**
 * Progreso de un estudiante específico (vista instructor/admin)
 * Backend: GET /api/v1/cursos/{idCurso}/estudiantes/{idEstudiante}/progreso
 */
export const obtenerProgresoDeEstudiante = async (idCurso, idEstudiante) => {
  const url = `/v1/cursos/${idCurso}/estudiantes/${idEstudiante}/progreso`; // 👈 /v1
  // console.log("[PROGRESO] GET", url);
  const resp = await api.get(url);
  return resp.data;
};

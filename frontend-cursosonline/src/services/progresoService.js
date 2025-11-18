// src/services/progresoService.js
import api from "./api";

/**
 * Progreso del alumno logueado en un curso
 * Backend: GET /api/v1/cursos/{idCurso}/mi-progreso
 */
export const obtenerMiProgreso = async (idCurso) => {
  const resp = await api.get(`/cursos/${idCurso}/mi-progreso`);
  return resp.data;              // 👈 devolvemos SOLO el DTO
};

/**
 * Progreso de un estudiante específico (vista instructor/admin)
 * Backend: GET /api/v1/cursos/{idCurso}/estudiantes/{idEstudiante}/progreso
 */
export const obtenerProgresoDeEstudiante = async (idCurso, idEstudiante) => {
  const resp = await api.get(
    `/cursos/${idCurso}/estudiantes/${idEstudiante}/progreso`
  );
  return resp.data;              // 👈 igual, solo data
};

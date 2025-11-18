// src/services/progresoService.js
import api from "./api";

// Progreso del alumno logueado en un curso
export const obtenerMiProgreso = (idCurso) => {
  return api.get(`/v1/cursos/${idCurso}/mi-progreso`, {
    withCredentials: true,
  });
};

// Progreso de un estudiante específico (vista instructor/admin)
export const obtenerProgresoDeEstudiante = (idCurso, idEstudiante) => {
  return api.get(
    `/v1/cursos/${idCurso}/estudiantes/${idEstudiante}/progreso`,
    { withCredentials: true }
  );
};

import api from "./api";

/**
 * ALUMNO: solicita emitir su propio certificado del curso.
 * Backend: POST /api/v1/cursos/{idCurso}/mi-certificado
 */
export const solicitarMiCertificado = async (idCurso) => {
  const resp = await api.post(`/v1/cursos/${idCurso}/mi-certificado`, {});
  return resp.data; // objeto Certificado
};

/**
 * ADMIN / INSTRUCTOR: emisión normal (con reglas de elegibilidad).
 * Backend: POST /api/v1/cursos/{idCurso}/certificados
 */
export const emitirCertificado = async (idCurso, idEstudiante) => {
  const resp = await api.post(`/v1/cursos/${idCurso}/certificados`, {
    idEstudiante,
  });
  return resp.data;
};

/**
 * ADMIN / INSTRUCTOR: emisión manual (sin validar elegibilidad).
 * Backend: POST /api/v1/cursos/{idCurso}/certificados/manual
 */
export const emitirCertificadoManual = async (idCurso, idEstudiante) => {
  const resp = await api.post(`/v1/cursos/${idCurso}/certificados/manual`, {
    idEstudiante,
  });
  return resp.data;
};

/**
 * Obtener un certificado por su ID (para abrir/ver).
 * Backend: GET /api/v1/certificados/{id}
 */
export const obtenerCertificado = async (idCertificado) => {
  const resp = await api.get(`/v1/certificados/${idCertificado}`);
  return resp.data;
};

// src/services/reporteService.js
import axios from "axios";

// Puedes sobreescribir con REACT_APP_REPORTES_API_URL en producción si quieres
const REPORTES_API_BASE_URL =
  process.env.REACT_APP_REPORTES_API_URL || "http://localhost:8090/api/reportes";

export async function obtenerResumenPlataforma() {
  const resp = await axios.get(`${REPORTES_API_BASE_URL}/resumen`);
  return resp.data; // { totalUsuarios, totalCursos, totalInscripciones, totalCertificados }
}

import axios from "axios";

/**
 * Configuración central de Axios para comunicar el frontend React
 * con el backend Spring Boot (API REST con JWT).
 */

// 🚀 PRODUCCIÓN (Vercel → Railway)
const API_BASE_URL = process.env.REACT_APP_API_URL;

// 🖥️ DESARROLLO LOCAL (cuando estés probando localmente)
// Si REACT_APP_API_URL no existe, usa localhost automáticamente
const BASE_URL =
  API_BASE_URL && API_BASE_URL.trim() !== ""
    ? API_BASE_URL
    : "http://localhost:8080";

const api = axios.create({
  baseURL: BASE_URL,
  withCredentials: true,
  headers: {
    "Content-Type": "application/json",
  },
});

/**
 * Interceptor: agrega el token JWT a todas las peticiones.
 */
api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem("token");
    if (token) config.headers.Authorization = `Bearer ${token}`;
    return config;
  },
  (error) => Promise.reject(error)
);

/**
 * Interceptor: maneja errores globales sin romper la navegación.
 */
api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response && [401, 403].includes(error.response.status)) {
      const currentPath = window.location.pathname;
      const token = localStorage.getItem("token");

      if (!token && currentPath !== "/login") {
        localStorage.removeItem("token");
        localStorage.removeItem("user");
        console.warn("Sesión inválida o expirada.");
      }
    }

    return Promise.reject(error);
  }
);

export default api;

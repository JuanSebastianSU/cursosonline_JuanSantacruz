import axios from "axios";

/**
 * Configuración central de Axios para comunicar el frontend React
 * con el backend Spring Boot (API REST con JWT).
 */

const API_BASE_URL = "http://localhost:8080/api"; // ✅ NECESARIO para el login

// Instancia principal de Axios
const api = axios.create({
  baseURL: API_BASE_URL,
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
 * Interceptor: maneja errores globales (401 o 403)
 * ⚠️ NO recarga la página. Deja que React maneje los errores.
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
        // 🚫 NO hacer window.location.href aquí
      }
    }

    return Promise.reject(error);
  }
);

export default api;

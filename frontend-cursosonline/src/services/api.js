// src/services/api.js
import axios from "axios";

const RAW_API_BASE_URL = process.env.REACT_APP_API_URL || "";
const API_BASE_URL = RAW_API_BASE_URL.trim();

const BASE_URL =
  API_BASE_URL !== ""
    ? API_BASE_URL
    : "https://cursosonlinejuansantacruz-production.up.railway.app/api";
//                                 ^^^^^ aquí también /api

console.log("[API] BASE_URL =", BASE_URL); // 👈 deja este log para ver en la consola qué está usando

const api = axios.create({
  baseURL: BASE_URL,
  withCredentials: false,
  headers: {
    "Content-Type": "application/json",
  },
});

api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem("token");
    if (token) config.headers.Authorization = `Bearer ${token}`;
    return config;
  },
  (error) => Promise.reject(error)
);

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

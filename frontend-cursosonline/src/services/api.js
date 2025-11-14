// src/services/api.js
import axios from "axios";

const API_BASE_URL = process.env.REACT_APP_API_URL;

const BASE_URL =
  API_BASE_URL && API_BASE_URL.trim() !== ""
    ? API_BASE_URL
    : "https://cursosonlinejuansantacruz-production.up.railway.app";

const api = axios.create({
  baseURL: BASE_URL,
  // ❌ ya no necesitamos cookies, solo Authorization header
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

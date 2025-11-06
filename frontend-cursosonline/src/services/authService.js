import api from "./api";

/**
 * authService.js
 * Servicio central para autenticación con el backend Spring Boot.
 * Maneja login, registro y logout usando JWT.
 */

// ====================== LOGIN ======================
export const login = async (email, password) => {
  try {
    const res = await api.post("/auth/login", { email, password });
    const data = res.data;

    // Guardar datos en localStorage
    localStorage.setItem("token", data.token);
    localStorage.setItem("user", JSON.stringify(data));

    return { success: true, user: data };
  } catch (err) {
    console.error("Error en login:", err.response?.data || err.message);
    return {
      success: false,
      message:
        err.response?.data?.message || "Error al iniciar sesión. Verifica tus credenciales.",
    };
  }
};

// ====================== REGISTRO ======================
export const register = async (nombre, email, password) => {
  try {
    const res = await api.post("/auth/register", { nombre, email, password });
    const data = res.data;

    // Guardar datos en localStorage
    localStorage.setItem("token", data.token);
    localStorage.setItem("user", JSON.stringify(data));

    return { success: true, user: data };
  } catch (err) {
    console.error("Error en registro:", err.response?.data || err.message);
    return {
      success: false,
      message:
        err.response?.data?.message || "Error al registrar usuario. Intenta nuevamente.",
    };
  }
};

// ====================== LOGOUT ======================
export const logout = () => {
  localStorage.removeItem("token");
  localStorage.removeItem("user");
  window.location.href = "/login";
};

// src/context/AuthContext.jsx
import React, { createContext, useState } from "react";
import { useNavigate } from "react-router-dom";
import api from "../services/api";

export const AuthContext = createContext();

/**
 * Contexto global de autenticación JWT.
 * SIN restaurar sesión desde localStorage.
 */
export const AuthProvider = ({ children }) => {
  const navigate = useNavigate();

  // user = null al iniciar SIEMPRE
  const [user, setUser] = useState(null);
  const [loading] = useState(false); // ya no necesitamos carga inicial

  /**
   * Iniciar sesión contra el backend
   */
  const login = async (email, password) => {
    try {
      const res = await api.post("/auth/login", { email, password });
      const data = res.data;
      const userData = data.user || data;

      // 🔹 YA NO guardamos en localStorage
      // localStorage.setItem("token", data.token);
      // localStorage.setItem("user", JSON.stringify(userData));

      api.defaults.headers.common["Authorization"] = `Bearer ${data.token}`;
      setUser(userData);

      return { success: true };
    } catch (err) {
      console.error("Error en login:", err.response?.data || err.message);
      return {
        success: false,
        message: err.response?.data?.message || "Credenciales incorrectas",
      };
    }
  };

  /**
   * Registrar nuevo usuario
   */
  const register = async (nombre, email, password) => {
    try {
      const res = await api.post("/auth/register", {
        nombre,
        email,
        password,
      });
      const data = res.data;
      const userData = data.user || data;

      // 🔹 Tampoco guardamos en localStorage
      // localStorage.setItem("token", data.token);
      // localStorage.setItem("user", JSON.stringify(userData));

      api.defaults.headers.common["Authorization"] = `Bearer ${data.token}`;
      setUser(userData);

      return { success: true };
    } catch (err) {
      console.error("Error en registro:", err.response?.data || err.message);
      return {
        success: false,
        message:
          err.response?.data?.message || "No se pudo completar el registro",
      };
    }
  };

  /**
   * Cerrar sesión y redirigir al login
   */
  const logout = () => {
    // Puedes limpiar por si hubiera quedado algo viejo
    localStorage.removeItem("token");
    localStorage.removeItem("user");

    delete api.defaults.headers.common["Authorization"];
    setUser(null);
    navigate("/login");
  };

  /**
   * Actualizar usuario (por ejemplo, al pasar a instructor)
   */
  const actualizarUsuario = (nuevoUsuario) => {
    setUser(nuevoUsuario);
    // ya no lo persistimos
    // localStorage.setItem("user", JSON.stringify(nuevoUsuario));
  };

  // Alias por compatibilidad
  const updateUser = (newData) => {
    const updated = { ...user, ...newData };
    setUser(updated);
    // ya no lo persistimos
    // localStorage.setItem("user", JSON.stringify(updated));
  };

  const value = {
    user,
    loading,
    login,
    register,
    logout,
    setUser,
    actualizarUsuario,
    updateUser,
    isAuthenticated: !!user,
  };

  return (
    <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
  );
};

import React, { createContext, useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import api from "../services/api";

export const AuthContext = createContext();

/**
 * Contexto global de autenticación JWT.
 * Administra login, registro, logout y datos del usuario autenticado.
 */
export const AuthProvider = ({ children }) => {
  const navigate = useNavigate();
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  // ✅ Restaurar usuario y token al iniciar la app
  useEffect(() => {
    const storedUser = localStorage.getItem("user");
    const storedToken = localStorage.getItem("token");

    if (storedUser && storedToken) {
      const parsedUser = JSON.parse(storedUser);
      setUser(parsedUser);
      api.defaults.headers.common["Authorization"] = `Bearer ${storedToken}`;
    }
    setLoading(false);
  }, []);

  /**
   * ✅ Iniciar sesión contra el backend
   */
  const login = async (email, password) => {
    try {
      const res = await api.post("/auth/login", { email, password });
      const data = res.data;
      const userData = data.user || data;

      localStorage.setItem("token", data.token);
      localStorage.setItem("user", JSON.stringify(userData));

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
   * ✅ Registrar nuevo usuario
   */
  const register = async (nombre, email, password) => {
    try {
      const res = await api.post("/auth/register", { nombre, email, password });
      const data = res.data;
      const userData = data.user || data;

      localStorage.setItem("token", data.token);
      localStorage.setItem("user", JSON.stringify(userData));

      api.defaults.headers.common["Authorization"] = `Bearer ${data.token}`;
      setUser(userData);

      return { success: true };
    } catch (err) {
      console.error("Error en registro:", err.response?.data || err.message);
      return {
        success: false,
        message: err.response?.data?.message || "No se pudo completar el registro",
      };
    }
  };

  /**
   * ✅ Cerrar sesión y redirigir al login
   */
  const logout = () => {
    localStorage.removeItem("token");
    localStorage.removeItem("user");
    delete api.defaults.headers.common["Authorization"];
    setUser(null);
    navigate("/login");
  };

  /**
   * ✅ Actualizar usuario (por ejemplo, al pasar a instructor)
   */
  const actualizarUsuario = (nuevoUsuario) => {
    setUser(nuevoUsuario);
    localStorage.setItem("user", JSON.stringify(nuevoUsuario));
  };

  // ✅ Alias por compatibilidad con otros componentes
  const updateUser = (newData) => {
    const updated = { ...user, ...newData };
    setUser(updated);
    localStorage.setItem("user", JSON.stringify(updated));
  };

  const value = {
    user,
    loading,
    login,
    register,
    logout,
    setUser,
    actualizarUsuario,
    updateUser, // alias compatible
    isAuthenticated: !!user,
  };

  return (
    <AuthContext.Provider value={value}>
      {!loading && children}
    </AuthContext.Provider>
  );
};

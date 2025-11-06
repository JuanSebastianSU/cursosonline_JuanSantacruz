import React, { useContext } from "react";
import { Navigate, Outlet } from "react-router-dom";
import { AuthContext } from "../context/AuthContext";

/**
 * ProtectedRoute
 * Protege rutas que requieren autenticación y, opcionalmente, roles específicos.
 */
const ProtectedRoute = ({ roles }) => {
  const { user, isAuthenticated } = useContext(AuthContext);

  // 🔹 Si no está autenticado → login
  if (!isAuthenticated) {
    return <Navigate to="/login" replace />;
  }

  // 🔹 Si la ruta requiere roles específicos
  if (roles && roles.length > 0) {
    const userRoles = user?.roles?.map((r) =>
      typeof r === "string" ? r : r.nombre
    ) || [];

    const hasRole = userRoles.some((rol) => roles.includes(rol));

    // ❌ No cumple los roles requeridos → acceso denegado
    if (!hasRole) {
      console.warn("Acceso denegado: roles insuficientes");
      return <Navigate to="/" replace />;
    }
  }

  // ✅ Autorizado → renderiza la ruta
  return <Outlet />;
};

export default ProtectedRoute;

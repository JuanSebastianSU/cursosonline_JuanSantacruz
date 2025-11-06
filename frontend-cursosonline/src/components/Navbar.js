import React, { useContext } from "react";
import { Link, useNavigate } from "react-router-dom";
import { AuthContext } from "../context/AuthContext";
import "../assets/css/navbar.css";

/**
 * Navbar.js
 * Muestra enlaces según el estado de autenticación del usuario.
 */
const Navbar = () => {
  const { user, isAuthenticated, logout } = useContext(AuthContext);
  const navigate = useNavigate();

  const handleLogout = () => {
    logout();
    navigate("/login");
  };

  // ✅ Detectar roles sin importar formato
  const tieneRol = (rol) => {
    if (!user?.roles) return false;
    return user.roles.some((r) =>
      typeof r === "string" ? r === rol : r.nombre === rol
    );
  };

  return (
    <nav className="navbar">
      <ul className="nav-list">
        <li><Link to="/">Inicio</Link></li>
        <li><Link to="/cursos">Cursos</Link></li>
        <li><Link to="/contacto">Contacto</Link></li>

        {isAuthenticated ? (
          <>
            <li><Link to="/mi-perfil">Mi perfil</Link></li>

            {/* Si es instructor, muestra su panel de gestión */}
            {tieneRol("ROLE_INSTRUCTOR") && (
              <li><Link to="/instructor/cursos">Mis Cursos</Link></li>
            )}

            {/* Si es administrador, muestra el panel global */}
            {tieneRol("ROLE_ADMIN") && (
              <li><Link to="/admin/cursos">Administrar</Link></li>
            )}

            <li>
              <button className="logout-btn" onClick={handleLogout}>
                Cerrar sesión
              </button>
            </li>
          </>
        ) : (
          <>
            <li><Link to="/login">Iniciar sesión</Link></li>
            <li><Link to="/register">Registrarse</Link></li>
          </>
        )}
      </ul>
    </nav>
  );
};

export default Navbar;

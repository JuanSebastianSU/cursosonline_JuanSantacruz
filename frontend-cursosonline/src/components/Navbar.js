import React, { useContext } from "react";
import { Link, useNavigate } from "react-router-dom";
import { AuthContext } from "../context/AuthContext";
import "../assets/css/navbar.css";

const Navbar = () => {
  const { user, isAuthenticated, logout } = useContext(AuthContext);
  const navigate = useNavigate();

  const handleLogout = () => {
    logout();
    navigate("/login");
  };

  const tieneRol = (rolBuscado) => {
    const norm = (s) => (s || "").toUpperCase();
    const buscado = norm(rolBuscado).startsWith("ROLE_")
      ? norm(rolBuscado)
      : `ROLE_${norm(rolBuscado)}`;

    if (Array.isArray(user?.roles) && user.roles.length) {
      return user.roles.some((r) => {
        const val = typeof r === "string" ? r : r?.nombre;
        if (!val) return false;
        const v = norm(val).startsWith("ROLE_") ? norm(val) : `ROLE_${norm(val)}`;
        return v === buscado;
      });
    }

    if (user?.rol) {
      const v = norm(user.rol).startsWith("ROLE_") ? norm(user.rol) : `ROLE_${norm(user.rol)}`;
      return v === buscado;
    }
    return false;
  };

  return (
    <nav className="navbar" role="navigation" aria-label="Barra principal">
      <ul className="nav-list">
        <li><Link to="/">Inicio</Link></li>
        <li><Link to="/cursos">Cursos</Link></li>
        <li><Link to="/contacto">Contacto</Link></li>

        {isAuthenticated ? (
          <>
            <li><Link to="/mi-perfil">Mi perfil</Link></li>
            {tieneRol("ROLE_INSTRUCTOR") && (
              <li><Link to="/instructor/cursos">Mis Cursos</Link></li>
            )}
            {tieneRol("ROLE_ADMIN") && (
              <li><Link to="/admin/cursos">Administrar</Link></li>
            )}
            <li>
              <button className="logout-btn" onClick={handleLogout} aria-label="Cerrar sesión">
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

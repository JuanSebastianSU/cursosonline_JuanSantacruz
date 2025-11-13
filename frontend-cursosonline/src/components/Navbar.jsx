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
        const v = norm(val).startsWith("ROLE_")
          ? norm(val)
          : `ROLE_${norm(val)}`;
        return v === buscado;
      });
    }

    if (user?.rol) {
      const v = norm(user.rol).startsWith("ROLE_")
        ? norm(user.rol)
        : `ROLE_${norm(user.rol)}`;
      return v === buscado;
    }
    return false;
  };

  const linkBase =
    "text-xs sm:text-sm md:text-[0.95rem] font-semibold tracking-wide hover:opacity-90 transition-opacity";

  return (
    <nav
      className="navbar w-full shadow-suave border-b border-black/10"
      role="navigation"
      aria-label="Barra principal"
    >
      <div className="max-w-6xl mx-auto px-4 py-3 flex items-center justify-between gap-4">
        {/* Puedes borrar este div si no quieres texto a la izquierda */}
        <div className="hidden sm:block text-xs sm:text-sm font-semibold uppercase tracking-[0.25em] opacity-80">
          cursosonlinejs
        </div>

        <ul className="flex items-center gap-3 sm:gap-4 md:gap-6 flex-wrap justify-end text-right">
          <li>
            <Link to="/" className={linkBase}>
              Inicio
            </Link>
          </li>
          <li>
            <Link to="/cursos" className={linkBase}>
              Cursos
            </Link>
          </li>
          <li>
            <Link to="/contacto" className={linkBase}>
              Contacto
            </Link>
          </li>

          {isAuthenticated ? (
            <>
              <li>
                <Link to="/mi-perfil" className={linkBase}>
                  Mi perfil
                </Link>
              </li>
              {tieneRol("ROLE_INSTRUCTOR") && (
                <li>
                  <Link to="/instructor/cursos" className={linkBase}>
                    Mis cursos
                  </Link>
                </li>
              )}
              {tieneRol("ROLE_ADMIN") && (
                <li>
                  <Link to="/admin/cursos" className={linkBase}>
                    Administrar
                  </Link>
                </li>
              )}
              <li>
                <button
                  className="logout-btn ml-1 inline-flex items-center rounded-full border px-3 py-1 text-xs sm:text-sm font-semibold bg-transparent hover:bg-white/10 hover:border-white transition-colors"
                  onClick={handleLogout}
                  aria-label="Cerrar sesión"
                >
                  Cerrar sesión
                </button>
              </li>
            </>
          ) : (
            <>
              <li>
                <Link to="/login" className={linkBase}>
                  Iniciar sesión
                </Link>
              </li>
              <li>
                <Link
                  to="/register"
                  className={`${linkBase} hidden sm:inline-flex rounded-full border border-white/70 px-3 py-1 bg-white/10 hover:bg-white/20`}
                >
                  Registrarse
                </Link>
              </li>
            </>
          )}
        </ul>
      </div>
    </nav>
  );
};

export default Navbar;

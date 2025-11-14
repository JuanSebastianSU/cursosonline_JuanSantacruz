// src/components/Navbar.jsx
import React, { useContext } from "react";
import { Link, useNavigate } from "react-router-dom";
import { AuthContext } from "../context/AuthContext";

/**
 * Navbar
 * Píldora negra elegante con contraste fuerte y estilo retro/expresivo.
 */
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

  const baseLink =
    "relative text-[0.7rem] sm:text-xs md:text-[0.8rem] font-semibold tracking-[0.18em] uppercase text-slate-200/85 hover:text-amber-300 transition-colors whitespace-nowrap";

  const chipBase =
    "inline-flex items-center justify-center rounded-full px-3 py-1.5 text-[0.7rem] sm:text-xs font-semibold tracking-[0.18em] uppercase";

  return (
    <nav className="w-full" role="navigation" aria-label="Barra principal">
      <div className="max-w-6xl mx-auto px-4 md:px-6 py-3 flex items-center justify-between gap-3">
        {/* Logo + marca (lado izquierdo) */}
        <div className="flex items-center gap-3">
          <div className="relative">
            {/* brillo detrás del logo */}
            <div className="absolute inset-0 rounded-xl bg-amber-500/30 blur-md opacity-80" />
            <div className="relative h-9 w-9 rounded-xl border border-amber-400/70 bg-slate-950 flex items-center justify-center shadow-[0_0_25px_rgba(250,204,21,0.65)]">
              <span className="text-[0.7rem] font-semibold tracking-[0.18em] text-amber-200">
                CO
              </span>
            </div>
          </div>

          <div className="flex flex-col leading-tight">
            <span className="text-[0.6rem] sm:text-[0.65rem] font-semibold uppercase tracking-[0.3em] text-slate-400">
              Cursos Online
            </span>
            <span className="text-xs sm:text-sm font-semibold text-slate-50">
              JS Studio
            </span>
          </div>
        </div>

        {/* Píldora de navegación (lado derecho) */}
        <div className="flex-1 flex justify-end">
          <div className="relative">
            {/* halo externo de color */}
            <div className="pointer-events-none absolute -inset-0.5 rounded-full bg-gradient-to-r from-amber-500/40 via-fuchsia-500/25 to-sky-500/40 opacity-70 blur-lg" />

            <div className="relative flex items-center gap-3 rounded-full border border-slate-600/70 bg-slate-900/95 px-3 py-1.5 shadow-[0_10px_40px_rgba(15,23,42,0.9)] backdrop-blur">
              {/* Links principales */}
              <ul className="flex items-center gap-2 sm:gap-3 md:gap-4 overflow-x-auto max-w-full scrollbar-thin scrollbar-thumb-slate-700 scrollbar-track-transparent">
                <li>
                  <Link to="/" className={baseLink}>
                    Inicio
                  </Link>
                </li>
                <li>
                  <Link to="/cursos" className={baseLink}>
                    Cursos
                  </Link>
                </li>
                <li>
                  <Link to="/contacto" className={baseLink}>
                    Contacto
                  </Link>
                </li>

                {isAuthenticated && (
                  <>
                    <li>
                      <Link to="/mi-perfil" className={baseLink}>
                        Mi perfil
                      </Link>
                    </li>
                    <li>
                      <Link to="/mis-cursos" className={baseLink}>
                        Mis cursos
                      </Link>
                    </li>

                    {/* PANEL INSTRUCTOR */}
                    {tieneRol("ROLE_INSTRUCTOR") && (
                      <li>
                        <Link
                          to="/instructor/cursos"
                          className={baseLink}
                        >
                          Instructor
                        </Link>
                      </li>
                    )}

                    {/* PANEL ADMIN */}
                    {tieneRol("ROLE_ADMIN") && (
                      <li>
                        <Link to="/admin/cursos" className={baseLink}>
                          Admin
                        </Link>
                      </li>
                    )}
                  </>
                )}
              </ul>

              {/* Zona derecha: login / usuario */}
              <div className="flex items-center gap-2 pl-2 border-l border-slate-700/70">
                {isAuthenticated ? (
                  <>
                    <span className="hidden sm:inline text-[0.6rem] font-semibold uppercase tracking-[0.18em] text-slate-400">
                      {user?.nombre || "Usuario"}
                    </span>
                    <button
                      className={`${chipBase} border border-slate-500/70 text-slate-200 hover:border-rose-500/80 hover:text-rose-200 hover:bg-rose-500/10`}
                      onClick={handleLogout}
                      aria-label="Cerrar sesión"
                    >
                      Salir
                    </button>
                  </>
                ) : (
                  <>
                    <Link
                      to="/login"
                      className={`${chipBase} border border-slate-500/70 text-slate-100 hover:border-amber-400 hover:text-amber-200 hover:bg-amber-500/10`}
                    >
                      Entrar
                    </Link>
                    <Link
                      to="/register"
                      className={`${chipBase} hidden sm:inline-flex bg-amber-400 text-slate-950 hover:bg-amber-300`}
                    >
                      Registro
                    </Link>
                  </>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>
    </nav>
  );
};

export default Navbar;

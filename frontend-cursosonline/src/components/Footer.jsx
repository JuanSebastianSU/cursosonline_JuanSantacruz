// src/components/Footer.jsx
import React from "react";
import { Link } from "react-router-dom";

const Footer = () => {
  const year = new Date().getFullYear();

  return (
    <footer className="mt-12 border-t border-slate-800 bg-slate-950 text-slate-100">
      {/* contenido principal */}
      <div className="mx-auto flex max-w-6xl flex-col gap-8 px-4 py-10 md:flex-row md:justify-between">
        {/* Sobre nosotros */}
        <div className="md:max-w-sm space-y-3">
          <h4 className="text-sm font-semibold tracking-[0.16em] uppercase text-amber-300">
            Sobre nosotros
          </h4>
          <p className="text-sm leading-relaxed text-slate-300">
            <span className="font-semibold text-slate-50">
              CursosOnlineJS
            </span>{" "}
            es una plataforma educativa desarrollada en{" "}
            <span className="font-semibold">React</span> y{" "}
            <span className="font-semibold">Spring Boot</span>, orientada al
            aprendizaje interactivo en línea.
          </p>
        </div>

        {/* Enlaces útiles */}
        <div className="space-y-3">
          <h4 className="text-sm font-semibold tracking-[0.16em] uppercase text-amber-300">
            Enlaces útiles
          </h4>
          <ul className="space-y-1 text-sm">
            <li>
              <Link
                to="/"
                className="text-slate-300 hover:text-amber-300 transition-colors"
              >
                Inicio
              </Link>
            </li>
            <li>
              <Link
                to="/cursos"
                className="text-slate-300 hover:text-amber-300 transition-colors"
              >
                Cursos
              </Link>
            </li>
            <li>
              <Link
                to="/contacto"
                className="text-slate-300 hover:text-amber-300 transition-colors"
              >
                Contacto
              </Link>
            </li>
            <li>
              <Link
                to="/login"
                className="text-slate-300 hover:text-amber-300 transition-colors"
              >
                Iniciar sesión
              </Link>
            </li>
          </ul>
        </div>

        {/* Contacto */}
        <div className="space-y-3">
          <h4 className="text-sm font-semibold tracking-[0.16em] uppercase text-amber-300">
            Contacto
          </h4>
          <div className="space-y-1 text-sm text-slate-300">
            <p>📧 info@cursosonlinejs.com</p>
            <p>📍 Quito, Ecuador</p>
            <p>📞 +593 99 999 9999</p>
          </div>
        </div>
      </div>

      {/* franja inferior retro */}
      <div className="border-t border-slate-800 bg-gradient-to-r from-slate-950 via-slate-900 to-slate-950">
        <p className="mx-auto max-w-6xl px-4 py-3 text-center text-[0.8rem] text-slate-400">
          © {year}{" "}
          <span className="font-semibold text-slate-200">
            CursosOnlineJS
          </span>
          . Todos los derechos reservados.
        </p>
      </div>
    </footer>
  );
};

export default Footer;

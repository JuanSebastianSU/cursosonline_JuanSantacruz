import React from "react";
import { Link } from "react-router-dom";

const Footer = () => {
  const year = new Date().getFullYear();

  return (
    <footer className="mt-10 border-t border-slate-900 bg-slate-950 text-slate-200">
      <div className="max-w-6xl mx-auto px-4 md:px-6 py-8 md:py-10 grid gap-8 md:grid-cols-3">
        {/* Columna 1: Marca */}
        <div className="space-y-3">
          <div className="inline-flex items-center gap-2 rounded-full border border-slate-800 bg-slate-900/80 px-3 py-1 text-xs font-semibold tracking-[0.18em] uppercase text-slate-400">
            <span className="h-1.5 w-1.5 rounded-full bg-amber-400" />
            <span>CursosOnlineJS</span>
          </div>
          <p className="text-sm text-slate-300">
            Plataforma educativa construida en{" "}
            <span className="font-semibold text-amber-300">React</span> y{" "}
            <span className="font-semibold text-amber-300">Spring Boot</span>,
            pensada para aprender de forma flexible, moderna y cuidada al
            detalle.
          </p>
        </div>

        {/* Columna 2: enlaces */}
        <div>
          <h4 className="text-sm font-semibold tracking-wide text-slate-100 mb-3">
            Navegación
          </h4>
          <ul className="space-y-2 text-sm text-slate-300">
            <li>
              <Link
                to="/"
                className="hover:text-amber-300 transition-colors"
              >
                Inicio
              </Link>
            </li>
            <li>
              <Link
                to="/cursos"
                className="hover:text-amber-300 transition-colors"
              >
                Cursos
              </Link>
            </li>
            <li>
              <Link
                to="/contacto"
                className="hover:text-amber-300 transition-colors"
              >
                Contacto
              </Link>
            </li>
            <li>
              <Link
                to="/login"
                className="hover:text-amber-300 transition-colors"
              >
                Iniciar sesión
              </Link>
            </li>
          </ul>
        </div>

        {/* Columna 3: contacto */}
        <div className="space-y-2 text-sm">
          <h4 className="text-sm font-semibold tracking-wide text-slate-100 mb-3">
            Contacto
          </h4>
          <p className="flex items-center gap-2 text-slate-300">
            <span>📧</span>
            <a
              href="mailto:info@cursosonlinejs.com"
              className="hover:text-amber-300 transition-colors"
            >
              info@cursosonlinejs.com
            </a>
          </p>
          <p className="flex items-center gap-2 text-slate-300">
            <span>📍</span>
            <span>Quito, Ecuador</span>
          </p>
          <p className="flex items-center gap-2 text-slate-300">
            <span>📞</span>
            <span>+593 99 999 9999</span>
          </p>
        </div>
      </div>

      <div className="border-t border-slate-900/80 bg-slate-950">
        <div className="max-w-6xl mx-auto px-4 md:px-6 py-4 flex flex-col sm:flex-row items-center justify-between gap-2 text-[0.75rem] md:text-xs text-slate-500">
          <p>© {year} CursosOnlineJS. Todos los derechos reservados.</p>
          <p className="flex items-center gap-1">
            <span className="text-slate-400">Hecho con</span>
            <span className="text-rose-400">♥</span>
            <span className="text-slate-400">para aprender cada día.</span>
          </p>
        </div>
      </div>
    </footer>
  );
};

export default Footer;

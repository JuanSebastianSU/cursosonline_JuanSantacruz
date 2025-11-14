import React, { useContext, useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { AuthContext } from "../context/AuthContext";
import { listarCursos } from "../services/cursoService";
import CursoCard from "../components/CursoCard";

/**
 * Cursos.js
 * Lista los cursos publicados y muestra el botón "Crear curso"
 * solo a usuarios autenticados sin rol de instructor ni admin.
 */
const Cursos = () => {
  const { user, isAuthenticated } = useContext(AuthContext);
  const navigate = useNavigate();

  const [cursos, setCursos] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [paginaActual, setPaginaActual] = useState(1);

  const cursosPorPagina = 6;

  // === utilidades roles (igual enfoque que Navbar/Dashboard) ===
  const norm = (s) => (s || "").toUpperCase();

  const userRoles = (() => {
    if (Array.isArray(user?.roles) && user.roles.length) {
      return user.roles.map((r) =>
        typeof r === "string" ? norm(r) : norm(r?.nombre)
      );
    }
    if (user?.rol) {
      return [norm(user.rol)];
    }
    return [];
  })();

  const tieneRol = (rolBuscado) => {
    const buscado = norm(rolBuscado).startsWith("ROLE_")
      ? norm(rolBuscado)
      : `ROLE_${norm(rolBuscado)}`;
    return userRoles.some((r) =>
      r.startsWith("ROLE_") ? r === buscado : `ROLE_${r}` === buscado
    );
  };

  useEffect(() => {
    const fetchCursos = async () => {
      try {
        const data = await listarCursos({ estado: "PUBLICADO" });
        setCursos(data.content || []);
      } catch (err) {
        console.error("Error cargando cursos:", err);
        setError("No se pudieron cargar los cursos.");
      } finally {
        setLoading(false);
      }
    };
    fetchCursos();
  }, []);

  const indexUltimo = paginaActual * cursosPorPagina;
  const indexPrimero = indexUltimo - cursosPorPagina;
  const cursosActuales = cursos.slice(indexPrimero, indexUltimo);
  const totalPaginas = Math.ceil(cursos.length / cursosPorPagina) || 1;

  const siguientePagina = () => {
    if (paginaActual < totalPaginas) setPaginaActual((p) => p + 1);
  };

  const anteriorPagina = () => {
    if (paginaActual > 1) setPaginaActual((p) => p - 1);
  };

  const handleCrearCurso = () => navigate("/instructor/cursos/nuevo");

  return (
    <main className="flex-1 bg-slate-950/80 text-slate-50">
      {/* Fondo artístico / halos suaves */}
      <div className="pointer-events-none fixed inset-0 -z-10">
        <div className="absolute -top-24 left-1/2 h-64 w-72 -translate-x-1/2 rounded-full bg-[radial-gradient(circle,_rgba(248,250,252,0.12),_transparent_60%)] blur-3xl opacity-80" />
        <div className="absolute -right-20 bottom-10 h-60 w-60 rounded-full bg-sky-500/16 blur-3xl" />
        <div className="absolute -left-24 top-32 h-60 w-80 -rotate-6 bg-gradient-to-r from-emerald-500/18 via-transparent to-amber-500/22 blur-2xl" />
      </div>

      <div className="max-w-6xl mx-auto px-4 md:px-6 py-8 md:py-10">
        {/* ENCABEZADO */}
        <header className="mb-7 flex flex-col sm:flex-row sm:items-end sm:justify-between gap-4 border-b border-slate-800/70 pb-4">
          <div className="space-y-1.5">
            <p className="inline-flex items-center gap-2 rounded-full border border-slate-700/70 bg-slate-950/90 px-3 py-1 text-[0.65rem] font-semibold uppercase tracking-[0.3em] text-slate-400">
              <span className="h-1.5 w-1.5 rounded-full bg-emerald-400 shadow-[0_0_12px_rgba(52,211,153,0.9)]" />
              Catálogo
            </p>
            <h2 className="text-2xl md:text-3xl font-semibold tracking-tight text-slate-50">
              Cursos disponibles
            </h2>
            <p className="text-xs md:text-sm text-slate-400 max-w-xl">
              Explora los cursos publicados en la plataforma. Avanza a tu ritmo
              y vuelve cuando quieras: este catálogo es tu biblioteca personal
              de aprendizaje.
            </p>
          </div>

          {isAuthenticated &&
            !tieneRol("ROLE_INSTRUCTOR") &&
            !tieneRol("ROLE_ADMIN") && (
              <button
                className="inline-flex items-center justify-center rounded-full border border-amber-300/70 bg-amber-300/15 px-4 py-2 text-xs md:text-sm font-semibold uppercase tracking-[0.22em] text-amber-100 shadow-[0_10px_35px_rgba(251,191,36,0.35)] hover:bg-amber-300/25 hover:border-amber-200 transition-colors"
                onClick={handleCrearCurso}
              >
                <span className="mr-1 text-base leading-none">✶</span>
                Crear mi primer curso
              </button>
            )}
        </header>

        {/* ESTADOS: loading / error / vacío */}
        {loading && (
          <p className="text-xs md:text-sm text-slate-400 mb-4">
            Cargando cursos...
          </p>
        )}

        {error && (
          <p className="text-xs md:text-sm text-red-200 bg-red-900/40 border border-red-500/60 rounded-xl px-3 py-2 mb-4">
            {error}
          </p>
        )}

        {!loading && !error && cursos.length === 0 && (
          <div className="rounded-3xl border border-slate-800 bg-slate-950/80 px-5 py-6 text-sm text-slate-300 shadow-[0_16px_40px_rgba(15,23,42,0.9)]">
            <p className="font-semibold text-slate-50">
              Por ahora no hay cursos publicados.
            </p>
            <p className="mt-1 text-xs md:text-sm text-slate-400">
              Cuando se publiquen nuevos cursos aparecerán aquí con toda su
              información. Si eres instructor, puedes comenzar a crear uno desde
              tu panel.
            </p>
          </div>
        )}

        {/* GRID DE CURSOS */}
        {!loading && cursos.length > 0 && (
          <>
            <section className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3 mb-8">
              {cursosActuales.map((curso) => (
                <CursoCard key={curso.id} curso={curso} />
              ))}
            </section>

            {/* PAGINACIÓN */}
            {totalPaginas > 1 && (
              <div className="flex flex-col sm:flex-row items-center justify-center gap-3 text-xs md:text-sm text-slate-300">
                <button
                  className="inline-flex items-center rounded-full border border-slate-700/80 bg-slate-900/80 px-3 py-1.5 font-semibold tracking-[0.18em] uppercase hover:border-slate-300 hover:text-slate-50 hover:bg-slate-800 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
                  onClick={anteriorPagina}
                  disabled={paginaActual === 1}
                >
                  ⬅ Anterior
                </button>

                <span className="inline-flex items-center gap-1 rounded-full border border-slate-700/60 bg-slate-900/80 px-3 py-1.5">
                  <span className="text-[0.7rem] uppercase tracking-[0.25em] text-slate-500">
                    Página
                  </span>
                  <span className="text-xs font-semibold text-slate-50">
                    {paginaActual}
                  </span>
                  <span className="text-[0.7rem] text-slate-500">/</span>
                  <span className="text-xs font-semibold text-slate-200">
                    {totalPaginas}
                  </span>
                </span>

                <button
                  className="inline-flex items-center rounded-full border border-slate-700/80 bg-slate-900/80 px-3 py-1.5 font-semibold tracking-[0.18em] uppercase hover:border-slate-300 hover:text-slate-50 hover:bg-slate-800 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
                  onClick={siguientePagina}
                  disabled={paginaActual === totalPaginas}
                >
                  Siguiente ➡
                </button>
              </div>
            )}
          </>
        )}
      </div>
    </main>
  );
};

export default Cursos;

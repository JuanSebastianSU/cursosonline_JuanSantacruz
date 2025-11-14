// src/pages/CursoInstructor.jsx
import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import {
  listarCursos,
  publicarCurso,
  archivarCurso,
  eliminarCurso,
} from "../services/cursoService";

/**
 * CursoInstructor.js
 * Panel del Instructor con estilo noir / elegante.
 * Lista SOLO los cursos del instructor (mis: true).
 */
const CursoInstructor = () => {
  const [cursos, setCursos] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [filtro, setFiltro] = useState("");
  const navigate = useNavigate();

  const cargarCursos = async () => {
    setLoading(true);
    setError("");
    try {
      // backend devuelve los cursos del instructor autenticado
      const data = await listarCursos({ mis: true });
      setCursos(data.content || []);
    } catch (err) {
      console.error("Error al cargar cursos del instructor:", err);
      setError("No se pudieron cargar tus cursos.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    cargarCursos();
  }, []);

  const handlePublicar = async (id) => {
    try {
      await publicarCurso(id);
      cargarCursos();
    } catch {
      alert("Error al publicar el curso.");
    }
  };

  const handleArchivar = async (id) => {
    try {
      await archivarCurso(id);
      cargarCursos();
    } catch {
      alert("Error al archivar el curso.");
    }
  };

  const handleEliminar = async (id) => {
    if (!window.confirm("¿Seguro que deseas eliminar este curso?")) return;
    try {
      await eliminarCurso(id);
      cargarCursos();
    } catch {
      alert("Error al eliminar el curso.");
    }
  };

  const estadoStyles = {
    PUBLICADO:
      "bg-emerald-400/90 text-slate-950 shadow-[0_8px_22px_rgba(52,211,153,0.7)]",
    BORRADOR: "bg-amber-300/95 text-slate-950",
    ARCHIVADO: "bg-slate-500/95 text-slate-50",
    DEFAULT: "bg-slate-700/95 text-slate-50",
  };

  const getEstadoClass = (estado) => {
    if (!estado) return estadoStyles.DEFAULT;
    const key = estado.toUpperCase();
    return estadoStyles[key] || estadoStyles.DEFAULT;
  };

  const cursosFiltrados = cursos.filter((c) => {
    if (!filtro.trim()) return true;
    const q = filtro.toLowerCase();
    return (
      c.titulo?.toLowerCase().includes(q) ||
      c.categoria?.toLowerCase().includes(q) ||
      c.estado?.toLowerCase().includes(q)
    );
  });

  return (
    <main className="flex-1 bg-slate-950/80 text-slate-50">
      {/* Halos / garabatos de fondo */}
      <div className="pointer-events-none fixed inset-0 -z-10">
        <div className="absolute -top-28 left-1/2 h-64 w-72 -translate-x-1/2 rounded-full bg-[radial-gradient(circle,_rgba(248,250,252,0.12),_transparent_60%)] blur-3xl opacity-80" />
        <div className="absolute -right-24 bottom-10 h-60 w-60 rounded-full bg-sky-500/18 blur-3xl" />
        <div className="absolute -left-24 top-32 h-60 w-80 -rotate-6 bg-gradient-to-r from-emerald-500/18 via-transparent to-amber-500/22 blur-2xl" />
      </div>

      <div className="max-w-6xl mx-auto px-4 md:px-6 py-8 md:py-10 space-y-7">
        {/* ENCABEZADO */}
        <header className="flex flex-col md:flex-row md:items-end md:justify-between gap-4 border-b border-slate-800 pb-4">
          <div className="space-y-2">
            <p className="inline-flex items-center gap-2 rounded-full border border-slate-700/80 bg-slate-950/80 px-3 py-1 text-[0.65rem] font-semibold uppercase tracking-[0.3em] text-slate-400">
              <span className="h-1.5 w-8 -skew-x-12 rounded-full bg-gradient-to-r from-amber-300/90 via-emerald-300/90 to-sky-300/90" />
              Panel instructor
            </p>
            <h1 className="text-2xl md:text-3xl font-semibold tracking-tight text-slate-50">
              Mis cursos
            </h1>
            <p className="text-xs md:text-sm text-slate-400 max-w-xl">
              Gestiona tus cursos en borrador, publicados y archivados. Aquí
              puedes editar, lanzar 🚀 o guardar en archivo tus proyectos.
            </p>
          </div>

          <div className="flex flex-col items-stretch sm:items-end gap-3">
            <button
              onClick={() => navigate("/instructor/cursos/nuevo")}
              className="inline-flex items-center justify-center rounded-full bg-slate-50 px-4 py-2 text-xs md:text-sm font-semibold tracking-[0.2em] uppercase text-slate-950 shadow-[0_14px_45px_rgba(248,250,252,0.7)] hover:bg-amber-200 hover:text-slate-950 transition-colors"
              type="button"
            >
              <span className="mr-1 text-base leading-none">＋</span>
              Nuevo curso
            </button>

            <p className="text-[0.7rem] text-slate-500">
              {cursos.length === 0 ? (
                <>Aún no has creado cursos.</>
              ) : (
                <>
                  {cursos.length} curso
                  {cursos.length !== 1 && "s"} en total
                </>
              )}
            </p>
          </div>
        </header>

        {/* FILTRO / BUSCADOR */}
        <section className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
          <div className="w-full sm:max-w-xs">
            <label className="block text-[0.7rem] font-semibold uppercase tracking-[0.24em] text-slate-500 mb-1.5">
              Buscar
            </label>
            <div className="relative">
              <span className="pointer-events-none absolute inset-y-0 left-3 flex items-center text-slate-500 text-xs">
                🔎
              </span>
              <input
                type="text"
                value={filtro}
                onChange={(e) => setFiltro(e.target.value)}
                placeholder="Título, categoría o estado..."
                className="w-full rounded-full border border-slate-700/70 bg-slate-950/70 pl-8 pr-3 py-1.5 text-xs md:text-sm text-slate-100 placeholder:text-slate-500 focus:outline-none focus:ring-2 focus:ring-slate-50/40"
              />
            </div>
          </div>

          <button
            type="button"
            onClick={cargarCursos}
            className="inline-flex items-center justify-center rounded-full border border-slate-700/80 bg-slate-950/80 px-3 py-1.5 text-[0.7rem] font-semibold uppercase tracking-[0.24em] text-slate-300 hover:border-slate-300 hover:text-slate-50 transition-colors"
          >
            ↻ Actualizar lista
          </button>
        </section>

        {/* TABLA / LISTADO */}
        <section className="mt-2">
          <div className="overflow-x-auto rounded-3xl border border-slate-800 bg-slate-950/90 shadow-[0_22px_70px_rgba(15,23,42,1)]">
            {loading ? (
              <div className="px-4 py-6 text-sm text-slate-300">
                Cargando tus cursos...
              </div>
            ) : error ? (
              <div className="px-4 py-6 text-sm text-red-200 bg-red-900/40 border-b border-red-500/50">
                {error}
              </div>
            ) : cursosFiltrados.length === 0 ? (
              <div className="px-4 py-6 text-sm text-slate-300">
                {cursos.length === 0 ? (
                  <>
                    No tienes cursos todavía. Empieza creando uno con el botón{" "}
                    <span className="font-semibold">“Nuevo curso”</span>.
                  </>
                ) : (
                  <>No se encontraron cursos que coincidan con tu búsqueda.</>
                )}
              </div>
            ) : (
              <table className="min-w-full text-xs md:text-sm">
                <thead>
                  <tr className="bg-gradient-to-r from-slate-900 via-slate-950 to-slate-900 text-slate-100 border-b border-slate-800/80">
                    <th className="px-4 py-3 text-left text-[0.65rem] md:text-[0.7rem] font-semibold tracking-[0.2em] uppercase">
                      Curso
                    </th>
                    <th className="px-4 py-3 text-left text-[0.65rem] md:text-[0.7rem] font-semibold tracking-[0.2em] uppercase">
                      Categoría
                    </th>
                    <th className="px-4 py-3 text-left text-[0.65rem] md:text-[0.7rem] font-semibold tracking-[0.2em] uppercase">
                      Nivel
                    </th>
                    <th className="px-4 py-3 text-left text-[0.65rem] md:text-[0.7rem] font-semibold tracking-[0.2em] uppercase">
                      Estado
                    </th>
                    <th className="px-4 py-3 text-left text-[0.65rem] md:text-[0.7rem] font-semibold tracking-[0.2em] uppercase">
                      Precio
                    </th>
                    <th className="px-4 py-3 text-right text-[0.65rem] md:text-[0.7rem] font-semibold tracking-[0.2em] uppercase">
                      Acciones
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {cursosFiltrados.map((curso) => (
                    <tr
                      key={curso.id}
                      className="border-t border-slate-800/70 hover:bg-slate-900/70 transition-colors"
                    >
                      <td className="px-4 py-3 align-middle">
                        <div className="flex flex-col gap-0.5">
                          <span className="text-slate-50 font-semibold line-clamp-1">
                            {curso.titulo}
                          </span>
                          <span className="text-[0.7rem] text-slate-500">
                            ID #{curso.id}
                          </span>
                        </div>
                      </td>
                      <td className="px-4 py-3 align-middle text-slate-200">
                        {curso.categoria || "—"}
                      </td>
                      <td className="px-4 py-3 align-middle text-slate-200">
                        {curso.nivel || "—"}
                      </td>
                      <td className="px-4 py-3 align-middle">
                        <span
                          className={
                            "inline-flex items-center rounded-full px-3 py-1 text-[0.65rem] font-semibold uppercase tracking-[0.18em] " +
                            getEstadoClass(curso.estado)
                          }
                        >
                          {curso.estado || "N/D"}
                        </span>
                      </td>
                      <td className="px-4 py-3 align-middle text-slate-100">
                        {curso.precio != null
                          ? `${curso.precio} USD`
                          : "Por definir"}
                      </td>
                      <td className="px-4 py-3 align-middle">
                        <div className="flex flex-wrap justify-end gap-1.5">
                          {/* Inscripciones / pagos */}
                          <button
                            type="button"
                            title="Ver inscripciones y pagos del curso"
                            onClick={() =>
                              navigate(
                                `/instructor/cursos/${curso.id}/inscripciones`
                              )
                            }
                            className="inline-flex items-center justify-center rounded-full border border-emerald-400/70 bg-slate-900 px-3 py-1.5 text-[0.65rem] md:text-xs font-semibold text-emerald-200 hover:border-emerald-300 hover:bg-slate-800 active:translate-y-px transition"
                          >
                            Inscripciones / pagos
                          </button>

                          {/* PANEL DE MÓDULOS */}
                          <button
                            type="button"
                            title="Ir al panel de módulos del curso"
                            onClick={() =>
                              navigate(`/instructor/cursos/${curso.id}/modulos`)
                            }
                            className="inline-flex items-center justify-center rounded-full border border-purple-400/80 bg-slate-900 px-3 py-1.5 text-[0.65rem] md:text-xs font-semibold text-purple-200 hover:bg-purple-500/15 hover:border-purple-300 active:translate-y-px transition"
                          >
                            Panel módulos
                          </button>

                          <button
                            type="button"
                            title="Editar curso"
                            onClick={() =>
                              navigate(`/instructor/cursos/editar/${curso.id}`)
                            }
                            className="inline-flex h-8 w-8 items-center justify-center rounded-full border border-slate-600/80 text-[0.85rem] text-slate-100 hover:border-slate-200 hover:bg-slate-50 hover:text-slate-950 transition-colors"
                          >
                            ✏️
                          </button>
                          <button
                            type="button"
                            title="Eliminar curso"
                            onClick={() => handleEliminar(curso.id)}
                            className="inline-flex h-8 w-8 items-center justify-center rounded-full border border-rose-700/80 text-[0.9rem] text-rose-300 hover:border-rose-400 hover:bg-rose-600 hover:text-rose-50 transition-colors"
                          >
                            🗑️
                          </button>
                          {curso.estado === "PUBLICADO" ? (
                            <button
                              type="button"
                              title="Archivar curso"
                              onClick={() => handleArchivar(curso.id)}
                              className="inline-flex h-8 w-8 items-center justify-center rounded-full border border-slate-600/80 text-[0.9rem] text-slate-200 hover:border-slate-300 hover:bg-slate-700 hover:text-slate-50 transition-colors"
                            >
                              📦
                            </button>
                          ) : (
                            <button
                              type="button"
                              title="Publicar curso"
                              onClick={() => handlePublicar(curso.id)}
                              className="inline-flex h-8 w-8 items-center justify-center rounded-full border border-emerald-500/70 text-[0.9rem] text-emerald-300 hover;border-emerald-300 hover:bg-emerald-500 hover:text-emerald-50 transition-colors"
                            >
                              🚀
                            </button>
                          )}
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>
        </section>

        {/* PIE DE PÁGINA DEL PANEL */}
        <section className="pt-1">
          <p className="text-[0.7rem] text-slate-500 max-w-md">
            Consejo: mantén tus cursos en{" "}
            <span className="text-emerald-300">BORRADOR</span> mientras
            experimentas, y solo pasa a{" "}
            <span className="text-emerald-300">PUBLICADO</span> cuando el
            contenido esté listo para tus estudiantes.
          </p>
        </section>
      </div>
    </main>
  );
};

export default CursoInstructor;

import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import {
  listarCursos,
  publicarCurso,
  archivarCurso,
  eliminarCurso,
} from "../services/cursoService";

/**
 * CursoAdmin
 * Panel de administración de cursos con diseño Tailwind
 * Estilo limpio, clásico y elegante.
 */
const CursoAdmin = () => {
  const [cursos, setCursos] = useState([]);
  const [recientes, setRecientes] = useState([]);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  useEffect(() => {
    cargarCursos();
  }, []);

  const cargarCursos = async () => {
    try {
      const data = await listarCursos();
      const lista = data.content || [];
      setCursos(lista);
      setRecientes(
        lista.slice(0, 5).map((c) => ({
          titulo: c.titulo,
          estado: c.estado,
          fecha: c.fechaCreacion || "N/D",
        }))
      );
    } catch (err) {
      console.error("Error al cargar cursos:", err);
      alert("Error al cargar los cursos.");
    } finally {
      setLoading(false);
    }
  };

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
    if (window.confirm("¿Seguro que deseas eliminar este curso?")) {
      try {
        await eliminarCurso(id);
        cargarCursos();
      } catch {
        alert("Error al eliminar el curso.");
      }
    }
  };

  const estadoStyles = {
    PUBLICADO: "bg-emerald-600/90 text-emerald-50",
    BORRADOR: "bg-amber-500/90 text-amber-950",
    ARCHIVADO: "bg-slate-500/90 text-slate-50",
    DEFAULT: "bg-slate-800/90 text-slate-50",
  };

  const getEstadoClass = (estado) => {
    if (!estado) return estadoStyles.DEFAULT;
    const key = estado.toUpperCase();
    return estadoStyles[key] || estadoStyles.DEFAULT;
  };

  return (
    <div className="max-w-6xl mx-auto px-4 md:px-6 py-8 md:py-10 space-y-8 bg-slate-50/60 rounded-3xl shadow-[0_20px_60px_rgba(15,23,42,0.25)]">
      {/* Encabezado */}
      <header className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 border-b border-slate-200 pb-4">
        <div className="text-center md:text-left space-y-1">
          <h1 className="text-2xl md:text-3xl font-semibold tracking-tight text-slate-900">
            Administración de cursos
          </h1>
          <p className="text-xs md:text-sm text-slate-500">
            Gestiona la creación, publicación, archivado y eliminación de los
            cursos de la plataforma.
          </p>
        </div>

        <button
          onClick={() => navigate("/admin/cursos/nuevo")}
          className="inline-flex items-center gap-2 rounded-full bg-slate-900 text-amber-100 px-4 py-2 text-xs md:text-sm font-semibold shadow-sm hover:bg-slate-800 active:translate-y-px transition"
        >
          <span className="text-base leading-none">＋</span>
          <span>Crear nuevo curso</span>
        </button>
      </header>

      {/* Tabla de cursos */}
      <section className="space-y-3">
        <div className="flex items-center justify-between text-xs md:text-sm text-slate-500">
          <span className="font-medium text-slate-700">Listado de cursos</span>
          {!loading && (
            <span>
              {cursos.length} curso{cursos.length !== 1 && "s"} registrados
            </span>
          )}
        </div>

        <div className="mt-1 overflow-x-auto rounded-2xl border border-slate-200 bg-white/95 shadow-sm">
          {loading ? (
            <div className="px-4 py-6 text-sm text-slate-500">
              Cargando cursos...
            </div>
          ) : cursos.length === 0 ? (
            <div className="px-4 py-6 text-sm text-slate-500">
              No hay cursos registrados.
            </div>
          ) : (
            <table className="min-w-full text-sm">
              <thead>
                <tr className="bg-slate-900 text-slate-50">
                  <th className="px-4 py-3 text-left text-[0.7rem] font-semibold tracking-wide uppercase">
                    Título
                  </th>
                  <th className="px-4 py-3 text-left text-[0.7rem] font-semibold tracking-wide uppercase">
                    Categoría
                  </th>
                  <th className="px-4 py-3 text-left text-[0.7rem] font-semibold tracking-wide uppercase">
                    Nivel
                  </th>
                  <th className="px-4 py-3 text-left text-[0.7rem] font-semibold tracking-wide uppercase">
                    Estado
                  </th>
                  <th className="px-4 py-3 text-left text-[0.7rem] font-semibold tracking-wide uppercase">
                    Precio
                  </th>
                  <th className="px-4 py-3 text-right text-[0.7rem] font-semibold tracking-wide uppercase">
                    Acciones
                  </th>
                </tr>
              </thead>
              <tbody>
                {cursos.map((curso) => (
                  <tr
                    key={curso.id}
                    className="border-t border-slate-100 hover:bg-slate-50/80 transition-colors"
                  >
                    <td className="px-4 py-3 align-middle text-slate-900 font-semibold">
                      <div className="max-w-xs truncate">{curso.titulo}</div>
                    </td>
                    <td className="px-4 py-3 align-middle text-slate-700">
                      {curso.categoria || "—"}
                    </td>
                    <td className="px-4 py-3 align-middle text-slate-700">
                      {curso.nivel || "—"}
                    </td>
                    <td className="px-4 py-3 align-middle">
                      <span
                        className={
                          "inline-flex items-center rounded-full px-3 py-1 text-[0.65rem] font-semibold uppercase tracking-wide " +
                          getEstadoClass(curso.estado)
                        }
                      >
                        {curso.estado || "N/D"}
                      </span>
                    </td>
                    <td className="px-4 py-3 align-middle text-slate-800">
                      {curso.precio != null ? `${curso.precio} USD` : "N/D"}
                    </td>
                    <td className="px-4 py-3 align-middle">
                      <div className="flex justify-end gap-2">
                        <button
                          title="Editar curso"
                          onClick={() =>
                            navigate(`/admin/cursos/editar/${curso.id}`)
                          }
                          className="inline-flex h-8 w-8 items-center justify-center rounded-full border border-slate-200 text-[0.85rem] text-slate-700 hover:border-slate-900 hover:bg-slate-900 hover:text-amber-100 transition"
                        >
                          ✏️
                        </button>
                        <button
                          title="Eliminar curso"
                          onClick={() => handleEliminar(curso.id)}
                          className="inline-flex h-8 w-8 items-center justify-center rounded-full border border-rose-200 text-[0.85rem] text-rose-600 hover:border-rose-700 hover:bg-rose-700 hover:text-rose-50 transition"
                        >
                          🗑️
                        </button>
                        {curso.estado === "PUBLICADO" ? (
                          <button
                            title="Archivar curso"
                            onClick={() => handleArchivar(curso.id)}
                            className="inline-flex h-8 w-8 items-center justify-center rounded-full border border-slate-200 text-[0.85rem] text-slate-700 hover:border-slate-700 hover:bg-slate-700 hover:text-slate-50 transition"
                          >
                            📦
                          </button>
                        ) : (
                          <button
                            title="Publicar curso"
                            onClick={() => handlePublicar(curso.id)}
                            className="inline-flex h-8 w-8 items-center justify-center rounded-full border border-emerald-200 text-[0.85rem] text-emerald-700 hover:border-emerald-700 hover:bg-emerald-700 hover:text-emerald-50 transition"
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

      {/* Actividad reciente */}
      <section className="rounded-2xl border border-slate-200 bg-white/90 p-5 shadow-sm space-y-3">
        <h2 className="text-sm md:text-base font-semibold text-slate-900">
          Actividad reciente
        </h2>
        {recientes.length === 0 ? (
          <p className="text-xs md:text-sm text-slate-500">
            No hay actividad reciente disponible.
          </p>
        ) : (
          <ul className="space-y-2">
            {recientes.map((act, i) => (
              <li
                key={i}
                className="flex flex-col md:flex-row md:items-center md:justify-between gap-1 border-b last:border-b-0 border-slate-100 pb-2 last:pb-0"
              >
                <div className="text-xs md:text-sm text-slate-800">
                  <strong className="font-semibold text-slate-900">
                    {act.titulo}
                  </strong>{" "}
                  — {act.estado}
                </div>
                <span className="text-[0.7rem] md:text-xs text-slate-500">
                  {act.fecha}
                </span>
              </li>
            ))}
          </ul>
        )}
      </section>
    </div>
  );
};

export default CursoAdmin;

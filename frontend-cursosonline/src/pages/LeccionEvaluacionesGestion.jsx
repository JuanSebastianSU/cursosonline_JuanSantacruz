// src/pages/LeccionEvaluacionesGestion.jsx
import React, { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import {
  listarEvaluacionesPorLeccion,
  crearEvaluacion,
  actualizarEvaluacion,
  publicarEvaluacion,
  archivarEvaluacion,
  eliminarEvaluacion,
} from "../services/evaluacionService";

/**
 * Gestión de evaluaciones para una lección (instructor / admin).
 * Usa /v1/lecciones/{idLeccion}/evaluaciones
 */
const LeccionEvaluacionesGestion = () => {
  const { idLeccion } = useParams();
  const navigate = useNavigate();

  const [evaluaciones, setEvaluaciones] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const [editando, setEditando] = useState(null); // idEval o null
  const [form, setForm] = useState({
    titulo: "",
    tipo: "quiz",
    puntajeMaximo: 10,
  });
  const [guardando, setGuardando] = useState(false);

  const cargarEvaluaciones = async () => {
    setLoading(true);
    setError("");
    try {
      const data = await listarEvaluacionesPorLeccion(idLeccion);
      setEvaluaciones(Array.isArray(data) ? data : []);
    } catch (err) {
      console.error(err);
      setError("No se pudieron cargar las evaluaciones.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (idLeccion) {
      cargarEvaluaciones();
    }
  }, [idLeccion]);

  const resetForm = () => {
    setEditando(null);
    setForm({
      titulo: "",
      tipo: "quiz",
      puntajeMaximo: 10,
    });
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    const val =
      name === "puntajeMaximo" ? (value === "" ? "" : Number(value)) : value;
    setForm((prev) => ({ ...prev, [name]: val }));
  };

  const handleEditar = (evalItem) => {
    setEditando(evalItem.id);
    setForm({
      titulo: evalItem.titulo || "",
      tipo: (evalItem.tipo || "QUIZ").toString().toLowerCase(), // QUIZ/TAREA → quiz/tarea
      puntajeMaximo: Number(evalItem.puntajeMaximo || 10),
    });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!form.titulo.trim()) {
      alert("El título es obligatorio.");
      return;
    }
    if (!form.tipo || !["quiz", "tarea"].includes(form.tipo.toLowerCase())) {
      alert("El tipo debe ser 'quiz' o 'tarea'.");
      return;
    }
    if (!form.puntajeMaximo || form.puntajeMaximo <= 0) {
      alert("El puntaje máximo debe ser mayor que 0.");
      return;
    }

    setGuardando(true);
    try {
      const payload = {
        titulo: form.titulo.trim(),
        tipo: form.tipo.toLowerCase(), // backend: "quiz" | "tarea"
        puntajeMaximo: form.puntajeMaximo,
      };

      if (editando) {
        await actualizarEvaluacion(idLeccion, editando, payload);
        alert("Evaluación actualizada correctamente.");
      } else {
        await crearEvaluacion(idLeccion, payload);
        alert("Evaluación creada correctamente.");
      }

      resetForm();
      cargarEvaluaciones();
    } catch (err) {
      console.error(err);
      alert("No se pudo guardar la evaluación.");
    } finally {
      setGuardando(false);
    }
  };

  const handlePublicar = async (idEval) => {
    try {
      await publicarEvaluacion(idLeccion, idEval);
      cargarEvaluaciones();
    } catch (err) {
      console.error(err);
      alert("No se pudo publicar la evaluación.");
    }
  };

  const handleArchivar = async (idEval) => {
    try {
      await archivarEvaluacion(idLeccion, idEval);
      cargarEvaluaciones();
    } catch (err) {
      console.error(err);
      alert("No se pudo archivar la evaluación.");
    }
  };

  const handleEliminar = async (idEval) => {
    if (!window.confirm("¿Seguro que deseas eliminar esta evaluación?")) return;
    try {
      const ok = await eliminarEvaluacion(idLeccion, idEval);
      if (ok) {
        cargarEvaluaciones();
      } else {
        alert("No se pudo eliminar la evaluación.");
      }
    } catch (err) {
      console.error(err);
      alert("Error al eliminar la evaluación.");
    }
  };

  const estadoChipClass = (estado) => {
    if (!estado) return "bg-slate-600/80 text-slate-50";
    const e = estado.toString().toUpperCase();
    if (e === "PUBLICADA")
      return "bg-emerald-400/95 text-slate-950 shadow-[0_0_18px_rgba(52,211,153,0.9)]";
    if (e === "ARCHIVADA")
      return "bg-slate-500/95 text-slate-50 shadow-[0_0_14px_rgba(148,163,184,0.9)]";
    return "bg-amber-300/95 text-slate-950 shadow-[0_0_14px_rgba(252,211,77,0.8)]"; // BORRADOR u otro
  };

  const tipoChipClass = (tipo) => {
    const t = (tipo || "").toString().toUpperCase();
    if (t === "QUIZ")
      return "bg-sky-500/25 border-sky-400/70 text-sky-100";
    if (t === "TAREA")
      return "bg-fuchsia-500/20 border-fuchsia-400/70 text-fuchsia-100";
    if (t === "EXAMEN")
      return "bg-rose-500/20 border-rose-400/70 text-rose-100";
    return "bg-slate-600/30 border-slate-400/60 text-slate-100";
  };

  return (
    <main className="flex-1 bg-slate-950/90 text-slate-50">
      {/* Garabatos de fondo */}
      <div className="pointer-events-none fixed inset-0 -z-10">
        <div className="absolute -top-24 left-1/2 h-64 w-72 -translate-x-1/2 rounded-full bg-[radial-gradient(circle,_rgba(250,204,21,0.12),_transparent_60%)] blur-3xl opacity-80" />
        <div className="absolute -right-32 bottom-10 h-60 w-60 rounded-full bg-fuchsia-500/18 blur-3xl" />
        <div className="absolute -left-28 top-40 h-60 w-80 -rotate-6 bg-gradient-to-r from-sky-500/18 via-transparent to-emerald-500/22 blur-2xl" />
      </div>

      <div className="max-w-6xl mx-auto px-4 md:px-6 py-8 md:py-10 space-y-7">
        {/* HEADER */}
        <header className="flex flex-col gap-4 border-b border-slate-800 pb-4 md:flex-row md:items-end md:justify-between">
          <div className="space-y-2">
            <p className="inline-flex items-center gap-2 rounded-full border border-slate-700/80 bg-slate-950/80 px-3 py-1 text-[0.65rem] font-semibold uppercase tracking-[0.3em] text-slate-400">
              <span className="h-1.5 w-8 -skew-x-12 rounded-full bg-gradient-to-r from-sky-300/90 via-amber-300/90 to-fuchsia-300/90" />
              Gestión de evaluaciones
            </p>
            <h1 className="text-2xl md:text-3xl font-semibold tracking-tight text-slate-50">
              Evaluaciones de la lección
            </h1>
            <p className="text-xs md:text-sm text-slate-400 max-w-xl">
              Crea y administra quizzes o tareas para esta lección. Sólo los
              estudiantes inscritos podrán acceder a estas evaluaciones, según
              las reglas de tu backend.
            </p>
          </div>

          <div className="flex flex-col items-stretch sm:items-end gap-2">
            <span className="text-[0.65rem] uppercase tracking-[0.22em] text-slate-500">
              ID Lección · {idLeccion}
            </span>
            <button
              type="button"
              onClick={() => navigate(-1)}
              className="inline-flex items-center justify-center rounded-full border border-slate-600/80 bg-slate-950/80 px-3 py-1.5 text-[0.7rem] font-semibold uppercase tracking-[0.24em] text-slate-200 hover:border-slate-300 hover:text-slate-50 transition-colors"
            >
              ← Volver
            </button>
          </div>
        </header>

        {error && (
          <div className="rounded-2xl border border-rose-500/70 bg-rose-900/40 px-4 py-3 text-xs md:text-sm text-rose-100">
            {error}
          </div>
        )}

        {/* GRID PRINCIPAL */}
        <div className="grid gap-6 md:grid-cols-[minmax(0,1.3fr)_minmax(0,1fr)] items-start">
          {/* LISTA DE EVALUACIONES */}
          <section className="rounded-3xl border border-slate-800 bg-slate-950/90 shadow-[0_22px_70px_rgba(15,23,42,1)]">
            <div className="flex items-center justify-between px-4 py-3 border-b border-slate-800/80">
              <h2 className="text-xs md:text-sm font-semibold uppercase tracking-[0.26em] text-slate-300">
                Evaluaciones
              </h2>
              <span className="text-[0.7rem] text-slate-500">
                {evaluaciones.length} registro
                {evaluaciones.length !== 1 && "s"}
              </span>
            </div>

            {loading ? (
              <div className="px-4 py-6 text-sm text-slate-300">
                Cargando evaluaciones...
              </div>
            ) : evaluaciones.length === 0 ? (
              <div className="px-4 py-6 text-sm text-slate-300">
                No hay evaluaciones creadas todavía. Empieza agregando un{" "}
                <span className="text-amber-300">quiz</span> o una{" "}
                <span className="text-fuchsia-300">tarea</span> en el panel
                derecho.
              </div>
            ) : (
              <ul className="divide-y divide-slate-800/80">
                {evaluaciones.map((ev) => (
                  <li
                    key={ev.id}
                    className="px-4 py-3 flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between hover:bg-slate-900/70 transition-colors"
                  >
                    <div className="space-y-1">
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className="text-sm font-semibold text-slate-50">
                          {ev.titulo}
                        </span>
                        <span
                          className={
                            "inline-flex items-center rounded-full border px-2.5 py-0.5 text-[0.65rem] font-semibold uppercase tracking-[0.16em] " +
                            tipoChipClass(ev.tipo)
                          }
                        >
                          {ev.tipo}
                        </span>
                        <span
                          className={
                            "inline-flex items-center rounded-full px-2.5 py-0.5 text-[0.6rem] font-semibold uppercase tracking-[0.16em] " +
                            estadoChipClass(ev.estado)
                          }
                        >
                          {ev.estado || "BORRADOR"}
                        </span>
                      </div>

                      <p className="text-[0.7rem] text-slate-400">
                        Puntaje máximo:{" "}
                        <span className="text-slate-100 font-semibold">
                          {ev.puntajeMaximo}
                        </span>
                      </p>
                    </div>

                    <div className="flex flex-wrap gap-1.5 justify-start sm:justify-end">
                      {/* 👇 NUEVO: ir al panel de intentos y calificaciones */}
                      <button
                        type="button"
                        onClick={() =>
                          navigate(`/instructor/evaluaciones/${ev.id}/intentos`)
                        }
                        className="inline-flex items-center justify-center rounded-full border border-sky-400/80 px-2.5 py-1 text-[0.65rem] font-semibold uppercase tracking-[0.16em] text-sky-200 hover:bg-sky-400 hover:text-slate-950 transition-colors"
                      >
                        Intentos / calificaciones
                      </button>

                      <button
                        type="button"
                        onClick={() => handleEditar(ev)}
                        className="inline-flex items-center justify-center rounded-full border border-slate-600/80 px-2.5 py-1 text-[0.65rem] font-semibold uppercase tracking-[0.16em] text-slate-100 hover:border-slate-200 hover:bg-slate-50 hover:text-slate-950 transition-colors"
                      >
                        Editar
                      </button>

                      {ev.estado === "PUBLICADA" ? (
                        <button
                          type="button"
                          onClick={() => handleArchivar(ev.id)}
                          className="inline-flex items-center justify-center rounded-full border border-slate-600/80 px-2.5 py-1 text-[0.65rem] font-semibold uppercase tracking-[0.16em] text-slate-200 hover:border-slate-300 hover:bg-slate-800 transition-colors"
                        >
                          Archivar
                        </button>
                      ) : (
                        <button
                          type="button"
                          onClick={() => handlePublicar(ev.id)}
                          className="inline-flex items-center justify-center rounded-full border border-emerald-400/80 px-2.5 py-1 text-[0.65rem] font-semibold uppercase tracking-[0.16em] text-emerald-200 hover:bg-emerald-400 hover:text-emerald-900 transition-colors"
                        >
                          Publicar
                        </button>
                      )}

                      <button
                        type="button"
                        onClick={() => handleEliminar(ev.id)}
                        className="inline-flex items-center justify-center rounded-full border border-rose-500/80 px-2.5 py-1 text-[0.65rem] font-semibold uppercase tracking-[0.16em] text-rose-200 hover:bg-rose-500 hover:text-rose-50 transition-colors"
                      >
                        Eliminar
                      </button>
                    </div>
                  </li>
                ))}
              </ul>
            )}
          </section>

          {/* PANEL DE CREACIÓN / EDICIÓN */}
          <section className="rounded-3xl border border-slate-200 bg-white/95 shadow-[0_18px_50px_rgba(15,23,42,0.4)] px-5 md:px-7 py-6 space-y-4">
            <div className="flex items-center justify-between gap-3">
              <div>
                <h2 className="text-sm md:text-base font-semibold text-slate-900">
                  {editando ? "Editar evaluación" : "Nueva evaluación"}
                </h2>
                <p className="text-[0.7rem] md:text-xs text-slate-500">
                  Define el título, tipo y puntaje máximo de la evaluación.
                </p>
              </div>
              {editando && (
                <button
                  type="button"
                  onClick={resetForm}
                  className="inline-flex items-center justify-center rounded-full border border-slate-300 px-3 py-1 text-[0.65rem] font-semibold uppercase tracking-[0.16em] text-slate-600 hover:bg-slate-100 active:translate-y-px transition"
                >
                  Limpiar
                </button>
              )}
            </div>

            <form className="space-y-4" onSubmit={handleSubmit}>
              {/* Título */}
              <div className="space-y-1.5">
                <label className="text-xs font-semibold uppercase tracking-wide text-slate-700">
                  Título
                </label>
                <input
                  type="text"
                  name="titulo"
                  value={form.titulo}
                  onChange={handleChange}
                  className="w-full rounded-xl border border-slate-200 bg-slate-50/80 px-3 py-2 text-sm text-slate-900 shadow-inner focus:border-slate-900 focus:outline-none focus:ring-2 focus:ring-slate-900/10"
                  placeholder="Ej: Quiz de introducción, Tarea 1..."
                />
              </div>

              {/* Tipo y puntaje */}
              <div className="grid gap-4 md:grid-cols-2">
                <div className="space-y-1.5">
                  <label className="text-xs font-semibold uppercase tracking-wide text-slate-700">
                    Tipo
                  </label>
                  <select
                    name="tipo"
                    value={form.tipo}
                    onChange={handleChange}
                    className="w-full rounded-xl border border-slate-200 bg-slate-50/80 px-3 py-2 text-sm text-slate-900 shadow-inner focus:border-slate-900 focus:outline-none focus:ring-2 focus:ring-slate-900/10"
                  >
                    <option value="quiz">Quiz</option>
                    <option value="tarea">Tarea</option>
                  </select>
                </div>

                <div className="space-y-1.5">
                  <label className="text-xs font-semibold uppercase tracking-wide text-slate-700">
                    Puntaje máximo
                  </label>
                  <input
                    type="number"
                    name="puntajeMaximo"
                    min={1}
                    value={form.puntajeMaximo}
                    onChange={handleChange}
                    className="w-full rounded-xl border border-slate-200 bg-slate-50/80 px-3 py-2 text-sm text-slate-900 shadow-inner focus:border-slate-900 focus:outline-none focus:ring-2 focus:ring-slate-900/10"
                  />
                </div>
              </div>

              {/* Botones */}
              <div className="pt-2 flex flex-col-reverse gap-3 sm:flex-row sm:justify-end">
                <button
                  type="button"
                  onClick={() => navigate(-1)}
                  className="inline-flex items-center justify-center rounded-full border border-slate-300 px-4 py-2 text-xs md:text-sm font-semibold text-slate-700 hover:bg-slate-100 active:translate-y-px transition"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  disabled={guardando}
                  className="inline-flex items-center justify-center rounded-full bg-slate-900 px-5 py-2 text-xs md:text-sm font-semibold text-amber-100 shadow-sm hover:bg-slate-800 active:translate-y-px disabled:opacity-60 disabled:cursor-not-allowed transition"
                >
                  {guardando
                    ? "Guardando..."
                    : editando
                    ? "Guardar cambios"
                    : "Crear evaluación"}
                </button>
              </div>
            </form>
          </section>
        </div>

        <section className="pt-1">
          <p className="text-[0.7rem] text-slate-500 max-w-lg">
            Recuerda: el backend ya controla que sólo estudiantes inscritos
            puedan acceder a las evaluaciones. Aquí solo defines la estructura
            (quiz/tarea, puntajes, estado publicado/archivado).
          </p>
        </section>
      </div>
    </main>
  );
};

export default LeccionEvaluacionesGestion;

// src/pages/CalificarIntentoPage.jsx
import React, { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { obtenerIntento } from "../services/intentoService";
import {
  calificarIntento,
  obtenerCalificacionPorIntento,
  actualizarCalificacion,
  publicarCalificacion,
  eliminarCalificacion,
} from "../services/calificacionService";

const CalificarIntentoPage = () => {
  const { idEvaluacion, idIntento } = useParams();
  const navigate = useNavigate();

  const [intento, setIntento] = useState(null);
  const [calificacion, setCalificacion] = useState(null);

  const [puntaje, setPuntaje] = useState("");
  const [feedback, setFeedback] = useState("");

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [publishing, setPublishing] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    const cargar = async () => {
      setLoading(true);
      setError("");
      try {
        // 1) Intento
        const it = await obtenerIntento(idEvaluacion, idIntento);
        setIntento(it);

        // 2) Calificación (si existe)
        const calif = await obtenerCalificacionPorIntento(idIntento);
        if (calif) {
          setCalificacion(calif);
          setPuntaje(calif.puntaje ?? "");
          setFeedback(calif.feedback ?? "");
        } else {
          setPuntaje(it.puntaje ?? "");
          setFeedback("");
        }
      } catch (err) {
        console.error("Error cargando intento/calificación:", err);
        const msg =
          err.response?.data?.message ||
          err.response?.data ||
          "No se pudo cargar la información del intento.";
        setError(msg);
      } finally {
        setLoading(false);
      }
    };

    cargar();
  }, [idEvaluacion, idIntento]);

  const handleGuardar = async () => {
    const num = Number(puntaje);
    if (Number.isNaN(num) || num < 0) {
      alert("Pon un puntaje numérico mayor o igual a 0.");
      return;
    }

    if (
      intento?.puntajeMaximo != null &&
      num > Number(intento.puntajeMaximo)
    ) {
      if (
        !window.confirm(
          `El puntaje supera el máximo del intento (${intento.puntajeMaximo}). ¿Continuar de todas formas?`
        )
      ) {
        return;
      }
    }

    setSaving(true);
    try {
      let nueva;
      if (!calificacion) {
        // Crear
        nueva = await calificarIntento(idIntento, {
          puntaje: num,
          feedback,
        });
      } else {
        // Actualizar
        nueva = await actualizarCalificacion(calificacion.id, {
          puntaje: num,
          feedback,
        });
      }
      setCalificacion(nueva);
      setPuntaje(nueva.puntaje ?? "");
      setFeedback(nueva.feedback ?? "");
      alert("Calificación guardada correctamente.");
    } catch (err) {
      console.error("Error guardando calificación:", err);
      const msg =
        err.response?.data?.message ||
        err.response?.data ||
        "No se pudo guardar la calificación.";
      alert(msg);
    } finally {
      setSaving(false);
    }
  };

  const handlePublicar = async () => {
    if (!calificacion) {
      alert("Primero guarda la calificación.");
      return;
    }
    setPublishing(true);
    try {
      const pub = await publicarCalificacion(calificacion.id);
      setCalificacion(pub);
      alert("Calificación publicada.");
    } catch (err) {
      console.error("Error publicando calificación:", err);
      const msg =
        err.response?.data?.message ||
        err.response?.data ||
        "No se pudo publicar la calificación.";
      alert(msg);
    } finally {
      setPublishing(false);
    }
  };

  const handleEliminar = async () => {
    if (!calificacion) {
      alert("No hay calificación para eliminar.");
      return;
    }
    if (
      !window.confirm(
        "¿Seguro que quieres eliminar la calificación de este intento?"
      )
    ) {
      return;
    }
    setDeleting(true);
    try {
      const ok = await eliminarCalificacion(calificacion.id);
      if (ok) {
        setCalificacion(null);
        setPuntaje(intento?.puntaje ?? "");
        setFeedback("");
        alert("Calificación eliminada.");
      } else {
        alert("No se pudo eliminar la calificación (no encontrada).");
      }
    } catch (err) {
      console.error("Error eliminando calificación:", err);
      const msg =
        err.response?.data?.message ||
        err.response?.data ||
        "No se pudo eliminar la calificación.";
      alert(msg);
    } finally {
      setDeleting(false);
    }
  };

  if (loading) {
    return (
      <div className="max-w-4xl mx-auto px-4 md:px-6 py-10 text-center text-sm md:text-base text-slate-300">
        Cargando intento...
      </div>
    );
  }

  if (error || !intento) {
    return (
      <div className="max-w-4xl mx-auto px-4 md:px-6 py-10 text-center text-sm md:text-base text-rose-400">
        {error || "Intento no encontrado."}
      </div>
    );
  }

  return (
    <main className="flex-1 bg-slate-950/90 text-slate-50">
      <div className="max-w-4xl mx-auto px-4 md:px-6 py-8 md:py-10 space-y-6">
        <button
          type="button"
          onClick={() => navigate(-1)}
          className="inline-flex items-center gap-2 rounded-full border border-slate-700/70 bg-slate-950/80 px-4 py-1.5 text-[0.7rem] md:text-xs font-semibold uppercase tracking-[0.22em] text-slate-200 hover:border-amber-400/80 hover:text-amber-200 hover:bg-slate-900 transition-colors"
        >
          <span className="text-sm">←</span> Volver
        </button>

        <section className="relative overflow-hidden rounded-[2rem] border border-slate-800 bg-gradient-to-r from-slate-950 via-slate-900 to-slate-950 px-5 md:px-7 py-5 md:py-6 shadow-[0_24px_90px_rgba(0,0,0,0.95)] space-y-3">
          <div className="relative space-y-2">
            <span className="inline-flex items-center rounded-full bg-emerald-400/95 px-3 py-1 text-[0.7rem] font-semibold uppercase tracking-[0.22em] text-slate-950 shadow-[0_0_25px_rgba(52,211,153,0.9)]">
              Calificar intento
            </span>
            <h1 className="text-2xl md:text-3xl font-semibold tracking-tight text-slate-50">
              Intento #{intento.nroIntento} · {intento.estado}
            </h1>
            <p className="text-xs md:text-sm text-slate-300/90">
              Alumno:{" "}
              <span className="font-mono text-slate-100">
                {intento.idEstudiante}
              </span>
            </p>
            <p className="text-xs md:text-sm text-slate-400">
              Puntaje actual intento:{" "}
              <span className="font-semibold text-emerald-300">
                {intento.puntaje != null ? intento.puntaje : "—"}
              </span>
              {intento.puntajeMaximo != null && (
                <span className="text-slate-400">
                  {" "}
                  / {intento.puntajeMaximo}
                </span>
              )}
            </p>
            {calificacion && (
              <p className="text-xs md:text-sm text-slate-400">
                Estado calificación:{" "}
                <span className="font-semibold text-amber-300">
                  {calificacion.estado}
                </span>
              </p>
            )}
          </div>
        </section>

        <section className="rounded-[2rem] border border-slate-800 bg-slate-950/95 px-5 py-5 shadow-[0_20px_70px_rgba(0,0,0,0.95)] space-y-4">
          <div className="grid gap-4 md:grid-cols-2">
            <div>
              <label className="block text-[0.7rem] font-semibold uppercase tracking-[0.22em] text-slate-400 mb-1.5">
                Puntaje
              </label>
              <input
                type="number"
                min="0"
                step="0.01"
                value={puntaje}
                onChange={(e) => setPuntaje(e.target.value)}
                className="w-full rounded-xl border border-slate-700 bg-slate-900 px-3 py-2 text-xs md:text-sm text-slate-50 focus:outline-none focus:ring-2 focus:ring-sky-400/40 focus:border-sky-300"
              />
              {intento.puntajeMaximo != null && (
                <p className="mt-1 text-[0.7rem] text-slate-500">
                  Máximo sugerido: {intento.puntajeMaximo}
                </p>
              )}
            </div>

            <div>
              <label className="block text-[0.7rem] font-semibold uppercase tracking-[0.22em] text-slate-400 mb-1.5">
                Feedback para el estudiante
              </label>
              <textarea
                rows={4}
                value={feedback}
                onChange={(e) => setFeedback(e.target.value)}
                className="w-full rounded-xl border border-slate-700 bg-slate-900 px-3 py-2 text-xs md:text-sm text-slate-50 focus:outline-none focus:ring-2 focus:ring-sky-400/40 focus:border-sky-300"
                placeholder="Comentarios, observaciones, sugerencias..."
              />
            </div>
          </div>

          <div className="flex flex-wrap justify-end gap-2 pt-2">
            {calificacion && (
              <button
                type="button"
                onClick={handleEliminar}
                disabled={deleting}
                className="inline-flex items-center justify-center rounded-full border border-rose-500/80 bg-slate-950 px-4 py-2 text-[0.7rem] md:text-xs font-semibold uppercase tracking-[0.22em] text-rose-200 hover:bg-rose-500/10 active:translate-y-px disabled:opacity-60 disabled:cursor-not-allowed transition"
              >
                {deleting ? "Eliminando..." : "Eliminar calificación"}
              </button>
            )}

            {calificacion && (
              <button
                type="button"
                onClick={handlePublicar}
                disabled={publishing}
                className="inline-flex items-center justify-center rounded-full border border-emerald-400/80 bg-slate-950 px-4 py-2 text-[0.7rem] md:text-xs font-semibold uppercase tracking-[0.22em] text-emerald-200 hover:bg-emerald-500/10 active:translate-y-px disabled:opacity-60 disabled:cursor-not-allowed transition"
              >
                {publishing ? "Publicando..." : "Publicar"}
              </button>
            )}

            <button
              type="button"
              onClick={handleGuardar}
              disabled={saving}
              className="inline-flex items-center justify-center rounded-full bg-sky-400 px-5 py-2 text-[0.7rem] md:text-xs font-semibold uppercase tracking-[0.22em] text-slate-950 shadow-[0_0_30px_rgba(56,189,248,0.9)] hover:bg-sky-300 active:translate-y-px disabled:opacity-60 disabled:cursor-not-allowed transition"
            >
              {saving
                ? "Guardando..."
                : calificacion
                ? "Actualizar calificación"
                : "Guardar calificación"}
            </button>
          </div>
        </section>
      </div>
    </main>
  );
};

export default CalificarIntentoPage;

// src/pages/EvaluacionIntentoCalificar.jsx
import React, { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import api from "../services/api";

const EvaluacionIntentoCalificar = () => {
  const { idEvaluacion, idIntento } = useParams();
  const navigate = useNavigate();

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [intento, setIntento] = useState(null);

  const [puntaje, setPuntaje] = useState("");
  const [comentario, setComentario] = useState("");

  useEffect(() => {
    const load = async () => {
      setLoading(true);
      setError("");

      try {
        // ⚠️ Ajusta la URL si tu backend usa otra ruta
        const resp = await api.get(
          `/v1/evaluaciones/${idEvaluacion}/intentos/${idIntento}`,
          { withCredentials: true }
        );

        const data = resp.data || resp; // por si viene directo
        setIntento(data);

        // inicializar campos
        if (data.puntajeObtenido != null) {
          setPuntaje(String(data.puntajeObtenido));
        } else if (data.puntaje != null) {
          setPuntaje(String(data.puntaje));
        }

        if (data.comentarioRevisor) {
          setComentario(data.comentarioRevisor);
        }
      } catch (e) {
        console.error("Error cargando intento:", e);
        setError(
          e?.response?.data?.message ||
            e?.response?.data ||
            "No se pudo cargar la información del intento."
        );
      } finally {
        setLoading(false);
      }
    };

    load();
  }, [idEvaluacion, idIntento]);

  const handleGuardar = async () => {
    if (puntaje === "") {
      alert("Ingresa un puntaje.");
      return;
    }

    const puntajeNumber = Number(puntaje);
    if (Number.isNaN(puntajeNumber)) {
      alert("El puntaje debe ser numérico.");
      return;
    }

    setSaving(true);
    setError("");

    try {
      // ⚠️ Ajusta la URL/body según tu backend
      const body = {
        puntaje: puntajeNumber,
        comentarioRevisor: comentario,
        modo: "MANUAL",
      };

      await api.patch(
        `/v1/evaluaciones/${idEvaluacion}/intentos/${idIntento}/calificacion-manual`,
        body,
        { withCredentials: true }
      );

      alert("Calificación guardada correctamente.");
      navigate(-1); // volver a la lista de intentos
    } catch (e) {
      console.error("Error guardando calificación manual:", e);
      setError(
        e?.response?.data?.message ||
          e?.response?.data ||
          "No se pudo guardar la calificación."
      );
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="max-w-5xl mx-auto px-4 md:px-6 py-10 text-center text-sm md:text-base text-slate-300">
        Cargando intento...
      </div>
    );
  }

  if (error) {
    return (
      <div className="max-w-5xl mx-auto px-4 md:px-6 py-10 text-center text-sm md:text-base text-rose-400">
        {error}
      </div>
    );
  }

  if (!intento) {
    return (
      <div className="max-w-5xl mx-auto px-4 md:px-6 py-10 text-center text-sm md:text-base text-slate-300">
        No se encontró la información del intento.
      </div>
    );
  }

  const nombreAlumno =
    intento.estudianteNombre ||
    intento.alumnoNombre ||
    intento.idEstudiante ||
    "Alumno";

  const puntajeMaximo =
    intento.puntajeMaximo ?? intento.maxPuntaje ?? intento.totalPuntos;

  return (
    <div className="max-w-5xl mx-auto px-4 md:px-6 py-8 md:py-10 space-y-6">
      {/* volver */}
      <button
        type="button"
        onClick={() =>
          navigate(
            `/instructor/evaluaciones/${idEvaluacion}/intentos`
          )
        }
        className="inline-flex items-center gap-2 rounded-full border border-slate-700/70 bg-slate-950/80 px-4 py-1.5 text-[0.7rem] md:text-xs font-semibold uppercase tracking-[0.22em] text-slate-200 hover:border-amber-400/80 hover:text-amber-200 hover:bg-slate-900 transition-colors"
      >
        <span className="text-sm">←</span> Volver a intentos
      </button>

      {/* header */}
      <section className="rounded-[2.5rem] border border-slate-800 bg-gradient-to-r from-slate-950 via-slate-900 to-slate-950 px-5 md:px-8 py-6 md:py-7 shadow-[0_24px_90px_rgba(0,0,0,0.95)] space-y-3">
        <p className="text-[0.7rem] font-semibold uppercase tracking-[0.22em] text-slate-400">
          Intento #{intento.id?.slice?.(0, 8) ?? idIntento}
        </p>
        <h1 className="text-xl md:text-2xl font-semibold tracking-tight text-slate-50">
          Ver / calificar intento
        </h1>
        <p className="text-xs md:text-sm text-slate-300/90 max-w-2xl">
          Alumno: <span className="font-semibold">{nombreAlumno}</span>
          {puntajeMaximo != null && (
            <>
              {" "}
              · Puntaje máximo:{" "}
              <span className="font-semibold">{puntajeMaximo}</span>
            </>
          )}
        </p>
      </section>

      {/* formulario calificación */}
      <section className="rounded-[2.5rem] border border-slate-800 bg-slate-950/95 px-5 md:px-8 py-6 md:py-7 shadow-[0_24px_90px_rgba(0,0,0,0.95)] space-y-5">
        <div className="flex flex-col md:flex-row gap-4 md:items-end">
          <div className="flex-1">
            <label className="block text-[0.75rem] md:text-xs font-semibold uppercase tracking-[0.22em] text-slate-400 mb-1.5">
              Puntaje del intento
            </label>
            <input
              type="number"
              step="0.01"
              value={puntaje}
              onChange={(e) => setPuntaje(e.target.value)}
              className="w-full rounded-xl border border-slate-700 bg-slate-900 px-3 py-2 text-sm text-slate-50 focus:outline-none focus:border-amber-400"
            />
            {puntajeMaximo != null && (
              <p className="mt-1 text-[0.7rem] md:text-xs text-slate-400">
                Máximo: {puntajeMaximo}
              </p>
            )}
          </div>

          <button
            type="button"
            onClick={handleGuardar}
            disabled={saving}
            className="inline-flex items-center justify-center rounded-full bg-emerald-500 px-5 py-2.5 text-xs md:text-sm font-semibold uppercase tracking-[0.22em] text-slate-950 border border-emerald-400/80 shadow-[0_0_30px_rgba(16,185,129,0.7)] hover:bg-emerald-400 active:translate-y-px disabled:opacity-60 disabled:cursor-not-allowed"
          >
            {saving ? "Guardando..." : "Guardar calificación"}
          </button>
        </div>

        <div>
          <label className="block text-[0.75rem] md:text-xs font-semibold uppercase tracking-[0.22em] text-slate-400 mb-1.5">
            Comentario / feedback para el alumno
          </label>
          <textarea
            rows={4}
            value={comentario}
            onChange={(e) => setComentario(e.target.value)}
            className="w-full rounded-xl border border-slate-700 bg-slate-900 px-3 py-2 text-sm text-slate-50 focus:outline-none focus:border-amber-400 resize-y"
            placeholder="Escribe aquí la retroalimentación para el alumno..."
          />
        </div>

        {/* Bloque muy simple para ver la info bruta del intento por si la necesitas */}
        <details className="mt-4 rounded-2xl border border-slate-800 bg-slate-900/70 px-4 py-3 text-xs text-slate-300">
          <summary className="cursor-pointer text-[0.7rem] md:text-xs font-semibold uppercase tracking-[0.22em] text-slate-400">
            Ver datos completos del intento (debug)
          </summary>
          <pre className="mt-3 whitespace-pre-wrap break-all text-[0.7rem] md:text-xs">
            {JSON.stringify(intento, null, 2)}
          </pre>
        </details>
      </section>
    </div>
  );
};

export default EvaluacionIntentoCalificar;

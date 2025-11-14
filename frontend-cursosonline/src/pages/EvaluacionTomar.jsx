// src/pages/EvaluacionTomar.jsx
import React, { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";

// Servicio de evaluación existente
import { obtenerEvaluacion } from "../services/evaluacionService";

// Servicio de intentos
import {
  listarMisIntentos,
  iniciarIntento,
  entregarIntento,
} from "../services/intentoService";

const formatearSegundos = (s) => {
  const m = Math.floor(s / 60);
  const sec = s % 60;
  return `${m.toString().padStart(2, "0")}:${sec
    .toString()
    .padStart(2, "0")} min`;
};

const EvaluacionTomar = () => {
  const { idLeccion, idEvaluacion } = useParams();
  const navigate = useNavigate();

  // Evaluación
  const [evaluacion, setEvaluacion] = useState(null);
  const [loadingEval, setLoadingEval] = useState(true);
  const [errorEval, setErrorEval] = useState("");

  // Intentos del estudiante
  const [intentos, setIntentos] = useState([]);
  const [loadingIntentos, setLoadingIntentos] = useState(true);
  const [errorIntentos, setErrorIntentos] = useState("");

  // Intento actual
  const [intentoActivo, setIntentoActivo] = useState(null);
  const [iniciando, setIniciando] = useState(false);
  const [entregando, setEntregando] = useState(false);
  const [elapsedSeconds, setElapsedSeconds] = useState(0);

  // Respuesta “simple” (texto libre) por ahora
  const [respuestaTexto, setRespuestaTexto] = useState("");

  // ───────────────────── Cargar evaluación ─────────────────────
  useEffect(() => {
    const fetchEval = async () => {
      setLoadingEval(true);
      setErrorEval("");
      try {
        const data = await obtenerEvaluacion(idLeccion, idEvaluacion);
        setEvaluacion(data);
      } catch (err) {
        console.error("Error cargando evaluación:", err);
        const msg =
          err.response?.data?.message ||
          err.response?.data ||
          "No se pudo cargar la evaluación.";
        setErrorEval(msg);
      } finally {
        setLoadingEval(false);
      }
    };

    fetchEval();
  }, [idLeccion, idEvaluacion]);

  // ───────────────────── Cargar intentos ─────────────────────
  const fetchIntentos = async () => {
    setLoadingIntentos(true);
    setErrorIntentos("");
    try {
      const data = await listarMisIntentos(idEvaluacion);
      const lista = Array.isArray(data) ? data : [];
      setIntentos(lista);

      const activo =
        lista.find(
          (i) => (i.estado || "").toUpperCase() === "EN_PROGRESO"
        ) || null;
      setIntentoActivo(activo);
      setElapsedSeconds(0);
      if (activo) {
        setRespuestaTexto(""); // podrías hidratar desde respuestas si quisieras
      }
    } catch (err) {
      console.error("Error cargando intentos:", err);
      const msg =
        err.response?.data?.message ||
        err.response?.data ||
        "No se pudieron cargar tus intentos.";
      setErrorIntentos(msg);
    } finally {
      setLoadingIntentos(false);
    }
  };

  useEffect(() => {
    fetchIntentos();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [idEvaluacion]);

  // ───────────────────── Timer sencillo (cuenta hacia arriba) ─────────────────────
  useEffect(() => {
    if (!intentoActivo) return;

    setElapsedSeconds(0);
    const interval = setInterval(() => {
      setElapsedSeconds((prev) => prev + 1);
    }, 1000);

    return () => clearInterval(interval);
  }, [intentoActivo?.id]);

  // ───────────────────── Acciones ─────────────────────
  const handleIniciar = async () => {
    setIniciando(true);
    try {
      const nuevo = await iniciarIntento(idEvaluacion);
      setIntentoActivo(nuevo);
      setIntentos((prev) => [...prev, nuevo]);
      setRespuestaTexto("");
      setElapsedSeconds(0);
    } catch (err) {
      console.error("Error iniciando intento:", err);
      const msg =
        err.response?.data?.message ||
        err.response?.data ||
        "No se pudo iniciar el intento.";
      alert(msg);
    } finally {
      setIniciando(false);
    }
  };

  const handleEntregar = async () => {
    if (!intentoActivo) return;

    if (!respuestaTexto.trim()) {
      if (
        !window.confirm(
          "No has escrito ninguna respuesta. ¿Seguro que quieres entregar?"
        )
      ) {
        return;
      }
    }

    setEntregando(true);
    try {
      const body = {
        tiempoSegundos: elapsedSeconds,
        respuestas: [
          {
            idPregunta: "P1", // placeholder; luego se reemplaza por las preguntas reales
            opciones: [],
            textoLibre: respuestaTexto.trim(),
            puntaje: null,
            tiempoSegundos: elapsedSeconds,
          },
        ],
      };

      const res = await entregarIntento(
        idEvaluacion,
        intentoActivo.id,
        body
      );
      setIntentoActivo(res);
      setRespuestaTexto("");
      await fetchIntentos();
      alert("Intento entregado correctamente.");
    } catch (err) {
      console.error("Error entregando intento:", err);
      const msg =
        err.response?.data?.message ||
        err.response?.data ||
        "No se pudo entregar el intento.";
      alert(msg);
    } finally {
      setEntregando(false);
    }
  };

  // ───────────────────── Derivados ─────────────────────

  if (loadingEval) {
    return (
      <div className="max-w-5xl mx-auto px-4 md:px-6 py-10 text-center text-sm md:text-base text-slate-300">
        Cargando evaluación...
      </div>
    );
  }

  if (errorEval || !evaluacion) {
    return (
      <div className="max-w-5xl mx-auto px-4 md:px-6 py-10 text-center text-sm md:text-base text-rose-400">
        {errorEval || "Evaluación no encontrada."}
      </div>
    );
  }

  const tipo = (evaluacion.tipo || "").toUpperCase();
  const esQuiz = tipo === "QUIZ";
  const esTarea = tipo === "TAREA";
  const limiteSeg = evaluacion.timeLimitSeconds || 0;

  // Último intento no en progreso (entregado o finalizado)
  const ultimoIntentoEntregado =
    intentos
      .slice()
      .reverse()
      .find(
        (it) => (it.estado || "").toUpperCase() !== "EN_PROGRESO"
      ) || null;

  // ───────────────────── Render ─────────────────────

  return (
    <div className="max-w-5xl mx-auto px-4 md:px-6 py-8 md:py-10 space-y-7">
      {/* Volver */}
      <button
        type="button"
        onClick={() => navigate(-1)}
        className="inline-flex items-center gap-2 rounded-full border border-slate-700/70 bg-slate-950/80 px-4 py-1.5 text-[0.7rem] md:text-xs font-semibold uppercase tracking-[0.22em] text-slate-200 hover:border-amber-400/80 hover:text-amber-200 hover:bg-slate-900 transition-colors"
      >
        <span className="text-sm">←</span> Volver
      </button>

      {/* Header de evaluación */}
      <section className="relative overflow-hidden rounded-[2.5rem] border border-slate-800 bg-gradient-to-r from-slate-950 via-slate-900 to-slate-950 px-5 md:px-8 py-6 md:py-7 shadow-[0_24px_90px_rgba(0,0,0,0.95)]">
        <div className="pointer-events-none absolute -left-24 -top-24 h-64 w-64 rounded-full border border-slate-700/60" />
        <div className="pointer-events-none absolute -right-16 -bottom-28 h-72 w-72 rounded-[40%] border border-slate-800/70" />

        <div className="relative space-y-3">
          <span className="inline-flex items-center rounded-full bg-sky-400/95 px-3 py-1 text-[0.7rem] font-semibold uppercase tracking-[0.22em] text-slate-950 shadow-[0_0_25px_rgba(56,189,248,0.9)]">
            Evaluación
          </span>
          <h1 className="text-2xl md:text-3xl font-semibold tracking-tight text-slate-50">
            {evaluacion.titulo}
          </h1>

          <div className="flex flex-wrap gap-3 text-[0.75rem] md:text-xs text-slate-300/90">
            <span className="inline-flex items-center gap-1 rounded-full bg-slate-900/80 px-3 py-1 border border-slate-700/80">
              Tipo:
              <strong className="ml-1 text-amber-300">
                {esQuiz ? "Quiz" : esTarea ? "Tarea" : evaluacion.tipo}
              </strong>
            </span>
            {evaluacion.puntajeMaximo && (
              <span className="inline-flex items-center gap-1 rounded-full bg-slate-900/80 px-3 py-1 border border-slate-700/80">
                Puntaje máximo:
                <strong className="ml-1 text-emerald-300">
                  {evaluacion.puntajeMaximo}
                </strong>
              </span>
            )}
            {limiteSeg > 0 && (
              <span className="inline-flex items-center gap-1 rounded-full bg-slate-900/80 px-3 py-1 border border-slate-700/80">
                Tiempo límite:
                <strong className="ml-1 text-sky-300">
                  {formatearSegundos(limiteSeg)}
                </strong>
              </span>
            )}
          </div>

          {evaluacion.descripcion && (
            <p className="max-w-2xl text-xs md:text-sm text-slate-300/90">
              {evaluacion.descripcion}
            </p>
          )}
        </div>
      </section>

      {/* Grid principal: info + intento actual */}
      <section className="grid gap-5 md:grid-cols-[minmax(0,1.4fr)_minmax(0,2fr)]">
        {/* Panel de info e intentos previos */}
        <div className="rounded-[2rem] border border-slate-800 bg-slate-950/95 px-5 py-5 shadow-[0_20px_70px_rgba(0,0,0,0.95)] space-y-4">
          <h2 className="text-sm md:text-base font-semibold tracking-tight text-slate-50">
            Estado e intentos
          </h2>

          {/* Botón iniciar intento */}
          <div className="space-y-2">
            <p className="text-[0.75rem] md:text-xs text-slate-400">
              Cuando estés listo, inicia un intento. Tendrás tu propio registro
              de tiempo y respuestas.
            </p>

            <button
              type="button"
              onClick={handleIniciar}
              disabled={iniciando || !!intentoActivo}
              className="inline-flex items-center justify-center rounded-full bg-emerald-400 px-4 py-2 text-xs md:text-sm font-semibold uppercase tracking-[0.22em] text-slate-950 shadow-[0_0_30px_rgba(52,211,153,0.9)] hover:bg-emerald-300 active:translate-y-px disabled:opacity-60 disabled:cursor-not-allowed transition"
            >
              {intentoActivo
                ? "Intento en curso"
                : iniciando
                ? "Creando intento..."
                : "Iniciar intento"}
            </button>

            {intentoActivo && (
              <p className="text-[0.75rem] md:text-xs text-emerald-300">
                Tienes un intento en progreso (#{intentoActivo.nroIntento}). No
                cierres la pestaña hasta entregar.
              </p>
            )}
          </div>

          {/* Historial de intentos */}
          <div className="pt-3 border-t border-slate-800/70 space-y-2">
            <h3 className="text-[0.8rem] font-semibold uppercase tracking-[0.22em] text-slate-400">
              Historial
            </h3>

            {loadingIntentos ? (
              <p className="text-[0.75rem] md:text-xs text-slate-300">
                Cargando intentos...
              </p>
            ) : errorIntentos ? (
              <p className="text-[0.75rem] md:text-xs text-rose-400">
                {errorIntentos}
              </p>
            ) : intentos.length === 0 ? (
              <p className="text-[0.75rem] md:text-xs text-slate-400">
                Aún no has realizado intentos en esta evaluación.
              </p>
            ) : (
              <ul className="space-y-1.5 text-[0.75rem] md:text-xs text-slate-200">
                {intentos
                  .slice()
                  .sort(
                    (a, b) => (a.nroIntento || 0) - (b.nroIntento || 0)
                  )
                  .map((it) => (
                    <li
                      key={it.id}
                      className="flex items-center justify-between gap-2 rounded-xl bg-slate-900/80 px-3 py-2 border border-slate-800/80"
                    >
                      <div className="flex flex-col">
                        <span className="font-semibold">
                          Intento #{it.nroIntento}
                        </span>
                        <span className="text-[0.7rem] text-slate-400">
                          Estado: {it.estado}
                          {it.puntaje != null && (
                            <>
                              {" "}
                              · Puntaje: {it.puntaje} / {it.puntajeMaximo}
                            </>
                          )}
                        </span>
                      </div>
                      {it.usedTimeSeconds != null && (
                        <span className="text-[0.7rem] text-slate-400">
                          Tiempo: {formatearSegundos(it.usedTimeSeconds)}
                        </span>
                      )}
                    </li>
                  ))}
              </ul>
            )}
          </div>

          {/* Aquí ANTES estaba CalificacionAlumnoPanel: lo quitamos */}
          {/* Ya no mostramos calificaciones en esta vista */}
        </div>

        {/* Panel de intento actual (respuestas) */}
        <div className="rounded-[2rem] border border-slate-800 bg-slate-950/95 px-5 py-5 shadow-[0_20px_70px_rgba(0,0,0,0.95)] space-y-4">
          <div className="flex items-center justify-between gap-3">
            <h2 className="text-sm md:text-base font-semibold tracking-tight text-slate-50">
              Intento actual
            </h2>
            <span className="text-[0.75rem] md:text-xs text-slate-400">
              Tiempo transcurrido:{" "}
              <span className="text-sky-300 font-mono">
                {formatearSegundos(elapsedSeconds)}
              </span>
            </span>
          </div>

          {!intentoActivo ? (
            <p className="text-[0.8rem] md:text-sm text-slate-400">
              Todavía no has iniciado un intento. Haz clic en{" "}
              <span className="text-emerald-300 font-semibold">
                “Iniciar intento”
              </span>{" "}
              en el panel izquierdo para comenzar.
            </p>
          ) : (intentoActivo.estado || "").toUpperCase() !==
            "EN_PROGRESO" ? (
            <p className="text-[0.8rem] md:text-sm text-slate-300">
              Tu último intento (#{intentoActivo.nroIntento}) ya está en estado{" "}
              <span className="font-semibold text-emerald-300">
                {intentoActivo.estado}
              </span>
              . Si el instructor lo permite, podrás iniciar otro intento desde el
              panel izquierdo.
            </p>
          ) : (
            <>
              <p className="text-[0.75rem] md:text-xs text-slate-400">
                Por ahora usamos una respuesta de texto libre general (cuando
                tengas bancos de preguntas, aquí podrás renderizar cada
                pregunta).
              </p>

              <div className="space-y-2">
                <label className="text-[0.7rem] font-semibold uppercase tracking-[0.22em] text-slate-400">
                  Tu respuesta
                </label>
                <textarea
                  rows={8}
                  value={respuestaTexto}
                  onChange={(e) => setRespuestaTexto(e.target.value)}
                  className="w-full rounded-xl border border-slate-700 bg-slate-900 px-3 py-2 text-xs md:text-sm text-slate-50 shadow-inner focus:outline-none focus:ring-2 focus:ring-sky-400/40 focus:border-sky-300"
                  placeholder={
                    esQuiz
                      ? "Escribe aquí tus respuestas, notas o explicación…"
                      : "Escribe tu desarrollo / entrega para esta tarea…"
                  }
                />
              </div>

              <div className="flex flex-wrap items-center justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={handleEntregar}
                  disabled={entregando}
                  className="inline-flex items-center justify-center rounded-full bg-sky-400 px-5 py-2 text-xs md:text-sm font-semibold uppercase tracking-[0.22em] text-slate-950 shadow-[0_0_30px_rgba(56,189,248,0.9)] hover:bg-sky-300 active:translate-y-px disabled:opacity-60 disabled:cursor-not-allowed transition"
                >
                  {entregando ? "Enviando..." : "Entregar intento"}
                </button>
              </div>
            </>
          )}
        </div>
      </section>
    </div>
  );
};

export default EvaluacionTomar;

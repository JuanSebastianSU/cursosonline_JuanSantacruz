// src/pages/EvaluacionTomar.jsx
import React, { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";

import { obtenerEvaluacion } from "../services/evaluacionService";
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

const buildInitialAnswers = (preguntas) => {
  const initial = {};
  (preguntas || []).forEach((p) => {
    const t = (p.tipo || "").toUpperCase();
    if (t === "OPCION_MULTIPLE") {
      initial[p.id] = [];
    } else {
      initial[p.id] = "";
    }
  });
  return initial;
};

const labelTipoPregunta = (tipoRaw) => {
  const t = (tipoRaw || "").toUpperCase();
  switch (t) {
    case "OPCION_UNICA":
      return "Opción única";
    case "OPCION_MULTIPLE":
      return "Selección múltiple";
    case "VERDADERO_FALSO":
      return "Verdadero / Falso";
    case "NUMERICA":
      return "Numérica";
    case "ABIERTA":
      return "Abierta";
    default:
      return t || "Pregunta";
  }
};

const EvaluacionTomar = () => {
  const { idLeccion, idEvaluacion } = useParams();
  const navigate = useNavigate();

  // Evaluación y preguntas
  const [evaluacion, setEvaluacion] = useState(null);
  const [preguntas, setPreguntas] = useState([]);
  const [respuestas, setRespuestas] = useState({});

  // Estado de carga / error evaluación
  const [loadingEval, setLoadingEval] = useState(true);
  const [errorEval, setErrorEval] = useState("");

  // Intentos del estudiante
  const [intentos, setIntentos] = useState([]);
  const [loadingIntentos, setLoadingIntentos] = useState(true);
  const [errorIntentos, setErrorIntentos] = useState("");

  const [intentoActivo, setIntentoActivo] = useState(null);
  const [iniciando, setIniciando] = useState(false);
  const [entregando, setEntregando] = useState(false);
  const [elapsedSeconds, setElapsedSeconds] = useState(0);

  // ───────────────────── Cargar evaluación + preguntas ─────────────────────
  useEffect(() => {
    const fetchEval = async () => {
      setLoadingEval(true);
      setErrorEval("");
      try {
        const data = await obtenerEvaluacion(idLeccion, idEvaluacion);
        setEvaluacion(data);

        const lista = Array.isArray(data.preguntas) ? data.preguntas : [];
        setPreguntas(lista);
        setRespuestas(buildInitialAnswers(lista));
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

  // ───────────────────── Timer ─────────────────────
  useEffect(() => {
    if (
      !intentoActivo ||
      (intentoActivo.estado || "").toUpperCase() !== "EN_PROGRESO"
    ) {
      return;
    }

    setElapsedSeconds(0);
    const interval = setInterval(() => {
      setElapsedSeconds((prev) => prev + 1);
    }, 1000);

    return () => clearInterval(interval);
  }, [intentoActivo?.id, intentoActivo?.estado]);

  // ───────────────────── Handlers de respuestas ─────────────────────
  const handleRespuestaOpcionUnica = (idPregunta, valor) => {
    setRespuestas((prev) => ({
      ...prev,
      [idPregunta]: valor,
    }));
  };

  const handleRespuestaMultiple = (idPregunta, valor) => {
    setRespuestas((prev) => {
      const actual = Array.isArray(prev[idPregunta]) ? prev[idPregunta] : [];
      const existe = actual.includes(valor);
      const nuevo = existe
        ? actual.filter((v) => v !== valor)
        : [...actual, valor];
      return { ...prev, [idPregunta]: nuevo };
    });
  };

  const handleRespuestaTexto = (idPregunta, valor) => {
    setRespuestas((prev) => ({
      ...prev,
      [idPregunta]: valor,
    }));
  };

  // ───────────────────── Acciones de intento ─────────────────────
  const handleIniciar = async () => {
    setIniciando(true);
    try {
      const nuevo = await iniciarIntento(idEvaluacion);
      setIntentoActivo(nuevo);
      setIntentos((prev) => [...prev, nuevo]);
      setElapsedSeconds(0);
      setRespuestas(buildInitialAnswers(preguntas));
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

  const construirRespuestasPayload = () => {
    return (preguntas || []).map((p) => {
      const t = (p.tipo || "").toUpperCase();
      const ans = respuestas[p.id];

      let opciones = [];
      let textoLibre = null;

      if (t === "OPCION_UNICA" || t === "VERDADERO_FALSO") {
        if (ans) opciones = [ans];
      } else if (t === "OPCION_MULTIPLE") {
        opciones = Array.isArray(ans) ? ans : [];
      } else if (t === "NUMERICA" || t === "ABIERTA") {
        textoLibre = ans != null ? String(ans) : "";
      }

      return {
        idPregunta: p.id,
        opciones,
        textoLibre,
        tiempoSegundos: elapsedSeconds,
        puntaje: null,
      };
    });
  };

  const handleEntregar = async () => {
    if (!intentoActivo) return;

    const respuestasPayload = construirRespuestasPayload();
    const hayAlgoRespondido = respuestasPayload.some((r) => {
      return (
        (Array.isArray(r.opciones) && r.opciones.length > 0) ||
        (r.textoLibre && r.textoLibre.trim() !== "")
      );
    });

    if (!hayAlgoRespondido) {
      const confirmar = window.confirm(
        "No has respondido ninguna pregunta. ¿Seguro que quieres entregar el intento?"
      );
      if (!confirmar) return;
    }

    setEntregando(true);
    try {
      const body = {
        tiempoSegundos: elapsedSeconds,
        respuestas: respuestasPayload,
      };

      const res = await entregarIntento(
        idEvaluacion,
        intentoActivo.id,
        body
      );
      setIntentoActivo(res);
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

  const tipoEval = (evaluacion.tipo || "").toUpperCase();
  const esQuiz = tipoEval === "QUIZ";
  const esTarea = tipoEval === "TAREA";
  const limiteSeg = evaluacion.timeLimitSeconds || 0;

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

      {/* Grid principal */}
      <section className="grid gap-5 md:grid-cols-[minmax(0,1.4fr)_minmax(0,2fr)]">
        {/* Panel de estado e intentos */}
        <div className="rounded-[2rem] border border-slate-800 bg-slate-950/95 px-5 py-5 shadow-[0_20px_70px_rgba(0,0,0,0.95)] space-y-4">
          <h2 className="text-sm md:text-base font-semibold tracking-tight text-slate-50">
            Estado e intentos
          </h2>

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

            {ultimoIntentoEntregado && !intentoActivo && (
              <p className="text-[0.7rem] md:text-xs text-slate-400">
                Último intento registrado: #{ultimoIntentoEntregado.nroIntento}{" "}
                · Estado: {ultimoIntentoEntregado.estado}
                {ultimoIntentoEntregado.puntaje != null && (
                  <>
                    {" "}
                    · Puntaje: {ultimoIntentoEntregado.puntaje} /{" "}
                    {ultimoIntentoEntregado.puntajeMaximo}
                  </>
                )}
              </p>
            )}
          </div>

          {/* Historial */}
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
        </div>

        {/* Panel de intento actual (preguntas) */}
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
          ) : (intentoActivo.estado || "").toUpperCase() !== "EN_PROGRESO" ? (
            <p className="text-[0.8rem] md:text-sm text-slate-300">
              Tu último intento (#{intentoActivo.nroIntento}) está en estado{" "}
              <span className="font-semibold text-emerald-300">
                {intentoActivo.estado}
              </span>
              . Si el instructor lo permite, podrás iniciar otro intento desde el
              panel izquierdo.
            </p>
          ) : preguntas.length === 0 ? (
            <p className="text-[0.8rem] md:text-sm text-slate-300">
              Esta evaluación todavía no tiene preguntas definidas. Consulta con
              tu instructor.
            </p>
          ) : (
            <>
              <p className="text-[0.75rem] md:text-xs text-slate-400">
                Responde las preguntas siguientes. Tus respuestas se enviarán al
                hacer clic en{" "}
                <span className="text-sky-300 font-semibold">
                  “Entregar intento”.
                </span>
              </p>

              <div className="space-y-4 max-h-[480px] overflow-y-auto pr-1">
                {preguntas.map((p, idx) => {
                  const tipo = (p.tipo || "").toUpperCase();
                  const resp = respuestas[p.id];
                  const opciones = Array.isArray(p.opciones) ? p.opciones : [];

                  return (
                    <article
                      key={p.id || idx}
                      className="rounded-2xl border border-slate-800 bg-slate-900/80 px-4 py-3 space-y-3"
                    >
                      <header className="flex items-start justify-between gap-3">
                        <div className="space-y-1">
                          <span className="inline-flex items-center rounded-full bg-slate-800/90 px-2.5 py-0.5 text-[0.65rem] font-semibold uppercase tracking-[0.18em] text-slate-300">
                            Pregunta {idx + 1}
                          </span>
                          <p className="text-sm md:text-base text-slate-50">
                            {p.enunciado}
                          </p>
                        </div>
                        <div className="flex flex-col items-end gap-1">
                          <span className="inline-flex items-center rounded-full bg-slate-900 px-2 py-0.5 text-[0.65rem] uppercase tracking-[0.18em] text-slate-400 border border-slate-700/80">
                            {labelTipoPregunta(tipo)}
                          </span>
                          {p.puntaje != null && (
                            <span className="text-[0.7rem] text-emerald-300">
                              Puntaje: {p.puntaje}
                            </span>
                          )}
                        </div>
                      </header>

                      {/* Controles según tipo */}
                      {tipo === "OPCION_UNICA" || tipo === "VERDADERO_FALSO" ? (
                        <div className="space-y-2">
                          {opciones.length === 0 ? (
                            <p className="text-[0.7rem] text-slate-500">
                              Esta pregunta no tiene opciones configuradas.
                            </p>
                          ) : (
                            <div className="space-y-1.5">
                              {opciones.map((op, idxOp) => {
                                const valor = op.id || String(idxOp);
                                const checked = resp === valor;
                                return (
                                  <label
                                    key={valor}
                                    className="flex items-start gap-2 rounded-xl bg-slate-950/60 px-3 py-2 cursor-pointer hover:bg-slate-800/80"
                                  >
                                    <input
                                      type="radio"
                                      name={`preg-${p.id}`}
                                      className="mt-1"
                                      checked={checked}
                                      onChange={() =>
                                        handleRespuestaOpcionUnica(p.id, valor)
                                      }
                                    />
                                    <span className="text-xs md:text-sm text-slate-100">
                                      {op.texto}
                                    </span>
                                  </label>
                                );
                              })}
                            </div>
                          )}
                        </div>
                      ) : tipo === "OPCION_MULTIPLE" ? (
                        <div className="space-y-2">
                          {opciones.length === 0 ? (
                            <p className="text-[0.7rem] text-slate-500">
                              Esta pregunta no tiene opciones configuradas.
                            </p>
                          ) : (
                            <div className="space-y-1.5">
                              {opciones.map((op, idxOp) => {
                                const valor = op.id || String(idxOp);
                                const marcadas = Array.isArray(resp)
                                  ? resp
                                  : [];
                                const checked = marcadas.includes(valor);
                                return (
                                  <label
                                    key={valor}
                                    className="flex items-start gap-2 rounded-xl bg-slate-950/60 px-3 py-2 cursor-pointer hover:bg-slate-800/80"
                                  >
                                    <input
                                      type="checkbox"
                                      className="mt-1"
                                      checked={checked}
                                      onChange={() =>
                                        handleRespuestaMultiple(p.id, valor)
                                      }
                                    />
                                    <span className="text-xs md:text-sm text-slate-100">
                                      {op.texto}
                                    </span>
                                  </label>
                                );
                              })}
                            </div>
                          )}
                        </div>
                      ) : tipo === "NUMERICA" ? (
                        <div className="space-y-1.5">
                          <label className="text-[0.7rem] font-semibold uppercase tracking-[0.18em] text-slate-400">
                            Respuesta numérica
                          </label>
                          <input
                            type="number"
                            value={resp ?? ""}
                            onChange={(e) =>
                              handleRespuestaTexto(p.id, e.target.value)
                            }
                            className="w-full rounded-xl border border-slate-700 bg-slate-950 px-3 py-2 text-xs md:text-sm text-slate-50 shadow-inner focus:outline-none focus:ring-2 focus:ring-sky-400/40 focus:border-sky-300"
                          />
                        </div>
                      ) : (
                        <div className="space-y-1.5">
                          <label className="text-[0.7rem] font-semibold uppercase tracking-[0.18em] text-slate-400">
                            Tu respuesta
                          </label>
                          <textarea
                            rows={4}
                            value={resp ?? ""}
                            onChange={(e) =>
                              handleRespuestaTexto(p.id, e.target.value)
                            }
                            className="w-full rounded-xl border border-slate-700 bg-slate-950 px-3 py-2 text-xs md:text-sm text-slate-50 shadow-inner focus:outline-none focus:ring-2 focus:ring-sky-400/40 focus:border-sky-300"
                            placeholder={
                              esQuiz
                                ? "Escribe aquí tu respuesta…"
                                : "Desarrolla tu respuesta…"
                            }
                          />
                        </div>
                      )}
                    </article>
                  );
                })}
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

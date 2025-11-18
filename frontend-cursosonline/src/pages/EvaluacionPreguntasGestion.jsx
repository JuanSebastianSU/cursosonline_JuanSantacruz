// src/pages/EvaluacionPreguntasGestion.jsx
import React, { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import {
  obtenerEvaluacion,
  listarPreguntasEvaluacion,
  crearPregunta,
  actualizarPregunta,
  eliminarPregunta,
} from "../services/evaluacionService";

// Mapea el enum del backend a los string del DTO
const mapTipoDesdeBackend = (tipoEnum) => {
  if (!tipoEnum) return "opcion_unica";
  const t = tipoEnum.toString().toUpperCase();
  switch (t) {
    case "OPCION_UNICA":
      return "opcion_unica";
    case "OPCION_MULTIPLE":
      return "multiple";
    case "VERDADERO_FALSO":
      return "vf";
    case "NUMERICA":
      return "numerica";
    case "ABIERTA":
    case "ABIERTA_TEXTO":
      return "abierta";
    default:
      return "opcion_unica";
  }
};

// Etiquetas amigables
const labelTipoPregunta = (tipo) => {
  switch ((tipo || "").toLowerCase()) {
    case "opcion_unica":
      return "Opción única";
    case "multiple":
      return "Selección múltiple";
    case "vf":
      return "Verdadero / Falso";
    case "numerica":
      return "Numérica";
    case "abierta":
      return "Abierta (texto)";
    default:
      return tipo;
  }
};

const EvaluacionPreguntasGestion = () => {
  const { idLeccion, idEvaluacion } = useParams();
  const navigate = useNavigate();

  const [evaluacion, setEvaluacion] = useState(null);
  const [loadingEval, setLoadingEval] = useState(true);
  const [errorEval, setErrorEval] = useState("");

  const [preguntas, setPreguntas] = useState([]);
  const [loadingPreguntas, setLoadingPreguntas] = useState(true);
  const [errorPreguntas, setErrorPreguntas] = useState("");

  const [editandoId, setEditandoId] = useState(null);
  const [guardando, setGuardando] = useState(false);

  const emptyForm = {
    enunciado: "",
    tipo: "opcion_unica", // "opcion_unica" | "multiple" | "vf" | "numerica" | "abierta"
    puntaje: 1,
    autoCalificable: true,
    opciones: [
      { texto: "", correcta: false, retroalimentacion: "" },
      { texto: "", correcta: false, retroalimentacion: "" },
    ],
    respuestaNumericaCorrecta: "",
    respuestaTextoGuia: "",
  };

  const [form, setForm] = useState(emptyForm);

  // ───────────────────── Cargar evaluación ─────────────────────
  useEffect(() => {
    const cargar = async () => {
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
    if (idLeccion && idEvaluacion) {
      cargar();
    }
  }, [idLeccion, idEvaluacion]);

  // ───────────────────── Cargar preguntas ─────────────────────
  const cargarPreguntas = async () => {
    setLoadingPreguntas(true);
    setErrorPreguntas("");
    try {
      const data = await listarPreguntasEvaluacion(idLeccion, idEvaluacion);
      setPreguntas(Array.isArray(data) ? data : []);
    } catch (err) {
      console.error("Error cargando preguntas:", err);
      const msg =
        err.response?.data?.message ||
        err.response?.data ||
        "No se pudieron cargar las preguntas.";
      setErrorPreguntas(msg);
    } finally {
      setLoadingPreguntas(false);
    }
  };

  useEffect(() => {
    if (idLeccion && idEvaluacion) {
      cargarPreguntas();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [idLeccion, idEvaluacion]);

  // ───────────────────── Helpers de formulario ─────────────────────

  const resetForm = () => {
    setEditandoId(null);
    setForm(emptyForm);
  };

  const handleChangeCampo = (e) => {
    const { name, value, type, checked } = e.target;

    if (name === "autoCalificable") {
      setForm((prev) => ({ ...prev, autoCalificable: checked }));
      return;
    }

    if (name === "puntaje") {
      const num = value === "" ? "" : Number(value);
      setForm((prev) => ({ ...prev, puntaje: num }));
      return;
    }

    if (name === "respuestaNumericaCorrecta") {
      setForm((prev) => ({
        ...prev,
        respuestaNumericaCorrecta: value,
      }));
      return;
    }

    if (name === "respuestaTextoGuia") {
      setForm((prev) => ({
        ...prev,
        respuestaTextoGuia: value,
      }));
      return;
    }

    if (name === "tipo") {
      const nuevoTipo = value;
      setForm((prev) => {
        let next = { ...prev, tipo: nuevoTipo };

        if (nuevoTipo === "abierta") {
          next.autoCalificable = false;
          next.opciones = [];
          next.respuestaNumericaCorrecta = "";
        } else if (nuevoTipo === "numerica") {
          next.autoCalificable = true;
          next.opciones = [];
          next.respuestaTextoGuia = "";
        } else if (nuevoTipo === "vf") {
          next.opciones = [];
          next.autoCalificable = true;
          next.respuestaNumericaCorrecta = "";
          next.respuestaTextoGuia = "";
        } else if (nuevoTipo === "opcion_unica" || nuevoTipo === "multiple") {
          if (!prev.opciones || prev.opciones.length === 0) {
            next.opciones = [
              { texto: "", correcta: false, retroalimentacion: "" },
              { texto: "", correcta: false, retroalimentacion: "" },
            ];
          }
        }

        return next;
      });
      return;
    }

    // enunciado u otros
    setForm((prev) => ({ ...prev, [name]: value }));
  };

  const handleChangeOpcion = (index, field, value) => {
    setForm((prev) => {
      const opciones = [...(prev.opciones || [])];
      const op = { ...opciones[index] };
      if (field === "correcta") {
        const checked = value;
        if (prev.tipo === "opcion_unica") {
          // solo una correcta
          const nuevas = opciones.map((o, i) => ({
            ...o,
            correcta: i === index ? checked : false,
          }));
          return { ...prev, opciones: nuevas };
        } else {
          op.correcta = checked;
          opciones[index] = op;
          return { ...prev, opciones };
        }
      } else {
        op[field] = value;
        opciones[index] = op;
        return { ...prev, opciones };
      }
    });
  };

  const handleAgregarOpcion = () => {
    setForm((prev) => ({
      ...prev,
      opciones: [
        ...(prev.opciones || []),
        { texto: "", correcta: false, retroalimentacion: "" },
      ],
    }));
  };

  const handleEliminarOpcion = (index) => {
    setForm((prev) => {
      const opciones = [...(prev.opciones || [])];
      opciones.splice(index, 1);
      return { ...prev, opciones };
    });
  };

  // ───────────────────── Editar pregunta existente ─────────────────────
  const handleEditarPregunta = (p) => {
    setEditandoId(p.id || null);
    const tipo = mapTipoDesdeBackend(p.tipo);

    const opciones =
      p.opciones && Array.isArray(p.opciones)
        ? p.opciones.map((o) => ({
            texto: o.texto || "",
            correcta: !!o.correcta,
            // si el backend no tiene retroalimentacion, queda vacío
            retroalimentacion: o.retroalimentacion || "",
          }))
        : [];

    setForm({
      enunciado: p.enunciado || "",
      tipo,
      puntaje:
        p.puntaje != null && !Number.isNaN(Number(p.puntaje))
          ? Number(p.puntaje)
          : 1,
      autoCalificable:
        p.autoCalificable != null
          ? p.autoCalificable
          : tipo === "abierta"
          ? false
          : true,
      opciones,
      respuestaNumericaCorrecta:
        p.respuestaNumericaCorrecta != null
          ? String(p.respuestaNumericaCorrecta)
          : "",
      respuestaTextoGuia: p.respuestaTextoGuia || "",
    });
  };

  // ───────────────────── Guardar (crear / actualizar) ─────────────────────
  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!form.enunciado.trim()) {
      alert("El enunciado es obligatorio.");
      return;
    }

    const puntajeNum =
      form.puntaje === "" || form.puntaje == null
        ? 0
        : Number(form.puntaje);

    if (Number.isNaN(puntajeNum) || puntajeNum < 0) {
      alert("El puntaje debe ser un número mayor o igual a 0.");
      return;
    }

    if (
      (form.tipo === "opcion_unica" || form.tipo === "multiple") &&
      (!form.opciones || form.opciones.length === 0)
    ) {
      alert(
        "Las preguntas de opción única o múltiple necesitan al menos una opción."
      );
      return;
    }

    if (form.tipo === "numerica" && form.respuestaNumericaCorrecta === "") {
      alert("La pregunta numérica requiere una respuesta correcta.");
      return;
    }

    setGuardando(true);
    try {
      const body = {
        enunciado: form.enunciado.trim(),
        tipo: form.tipo,
        puntaje: puntajeNum,
        autoCalificable: form.tipo === "abierta" ? false : form.autoCalificable,
        opciones:
          form.tipo === "opcion_unica" || form.tipo === "multiple"
            ? (form.opciones || [])
                .filter((o) => o.texto && o.texto.trim() !== "")
                .map((o) => ({
                  texto: o.texto.trim(),
                  correcta: !!o.correcta,
                  retroalimentacion:
                    o.retroalimentacion &&
                    o.retroalimentacion.trim().length > 0
                      ? o.retroalimentacion.trim()
                      : null,
                }))
            : [],
        respuestaNumericaCorrecta:
          form.tipo === "numerica"
            ? Number(form.respuestaNumericaCorrecta)
            : null,
        respuestaTextoGuia:
          form.tipo === "abierta" && form.respuestaTextoGuia
            ? form.respuestaTextoGuia
            : null,
      };

      if (editandoId) {
        await actualizarPregunta(idLeccion, idEvaluacion, editandoId, body);
        alert("Pregunta actualizada correctamente.");
      } else {
        await crearPregunta(idLeccion, idEvaluacion, body);
        alert("Pregunta creada correctamente.");
      }

      resetForm();
      cargarPreguntas();
    } catch (err) {
      console.error("Error guardando pregunta:", err);
      const msg =
        err.response?.data?.message ||
        err.response?.data ||
        "No se pudo guardar la pregunta.";
      alert(msg);
    } finally {
      setGuardando(false);
    }
  };

  // ───────────────────── Eliminar pregunta ─────────────────────
  const handleEliminarPregunta = async (idPregunta) => {
    if (
      !window.confirm(
        "¿Seguro que deseas eliminar esta pregunta? Esta acción no se puede deshacer."
      )
    ) {
      return;
    }
    try {
      const ok = await eliminarPregunta(idLeccion, idEvaluacion, idPregunta);
      if (ok) {
        cargarPreguntas();
      } else {
        alert("No se pudo eliminar la pregunta.");
      }
    } catch (err) {
      console.error("Error al eliminar pregunta:", err);
      const msg =
        err.response?.data?.message ||
        err.response?.data ||
        "Error al eliminar la pregunta.";
      alert(msg);
    }
  };

  // ───────────────────── Render condicional ─────────────────────
  if (loadingEval) {
    return (
      <div className="max-w-6xl mx-auto px-4 md:px-6 py-8 text-sm text-slate-200">
        Cargando evaluación...
      </div>
    );
  }

  if (errorEval || !evaluacion) {
    return (
      <div className="max-w-6xl mx-auto px-4 md:px-6 py-8 text-sm text-rose-400">
        {errorEval || "Evaluación no encontrada."}
      </div>
    );
  }

  const tipoEval = (evaluacion.tipo || "").toUpperCase();

  return (
    <main className="flex-1 bg-slate-950/90 text-slate-50">
      {/* FONDO */}
      <div className="pointer-events-none fixed inset-0 -z-10">
        <div className="absolute -top-24 left-1/2 h-64 w-72 -translate-x-1/2 rounded-full bg-[radial-gradient(circle,_rgba(56,189,248,0.15),_transparent_60%)] blur-3xl opacity-80" />
        <div className="absolute -right-32 bottom-10 h-60 w-60 rounded-full bg-emerald-500/18 blur-3xl" />
        <div className="absolute -left-28 top-40 h-60 w-80 -rotate-6 bg-gradient-to-r from-amber-500/18 via-transparent to-fuchsia-500/22 blur-2xl" />
      </div>

      <div className="max-w-6xl mx-auto px-4 md:px-6 py-8 md:py-10 space-y-7">
        {/* HEADER */}
        <header className="flex flex-col gap-4 md:flex-row md:items-end md:justify-between border-b border-slate-800 pb-4">
          <div className="space-y-2">
            <button
              type="button"
              onClick={() => navigate(-1)}
              className="inline-flex items-center gap-2 rounded-full border border-slate-700/80 bg-slate-950/80 px-3 py-1.5 text-[0.7rem] font-semibold uppercase tracking-[0.22em] text-slate-200 hover:border-amber-400/80 hover:text-amber-200 hover:bg-slate-900 transition-colors"
            >
              <span className="text-sm">←</span>
              Volver
            </button>

            <p className="inline-flex items-center gap-2 rounded-full border border-slate-700/80 bg-slate-950/80 px-3 py-1 text-[0.65rem] font-semibold uppercase tracking-[0.3em] text-slate-400">
              <span className="h-1.5 w-8 -skew-x-12 rounded-full bg-gradient-to-r from-sky-300/90 via-emerald-300/90 to-amber-300/90" />
              Preguntas de la evaluación
            </p>

            <h1 className="text-2xl md:text-3xl font-semibold tracking-tight text-slate-50">
              {evaluacion.titulo}
            </h1>

            <div className="flex flex-wrap gap-2 text-[0.7rem] md:text-xs text-slate-300">
              <span className="inline-flex items-center gap-1 rounded-full bg-slate-900/80 px-3 py-1 border border-slate-700/80">
                Tipo:
                <strong className="ml-1 text-amber-300">
                  {tipoEval === "QUIZ"
                    ? "Quiz"
                    : tipoEval === "TAREA"
                    ? "Tarea"
                    : tipoEval === "EXAMEN"
                    ? "Examen"
                    : evaluacion.tipo}
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
              <span className="inline-flex items-center gap-1 rounded-full bg-slate-900/80 px-3 py-1 border border-slate-700/80">
                Preguntas:
                <strong className="ml-1 text-sky-300">
                  {preguntas.length}
                </strong>
              </span>
            </div>
          </div>

          <div className="flex flex-col items-stretch sm:items-end gap-1 text-[0.7rem] text-slate-400">
            <span>ID Lección · {idLeccion}</span>
            <span>ID Evaluación · {idEvaluacion}</span>
          </div>
        </header>

        {errorPreguntas && (
          <div className="rounded-2xl border border-rose-500/70 bg-rose-900/40 px-4 py-3 text-xs md:text-sm text-rose-100">
            {errorPreguntas}
          </div>
        )}

        {/* GRID PRINCIPAL */}
        <div className="grid gap-6 md:grid-cols-[minmax(0,1.2fr)_minmax(0,1.4fr)] items-start">
          {/* LISTA DE PREGUNTAS */}
          <section className="rounded-3xl border border-slate-800 bg-slate-950/95 shadow-[0_22px_70px_rgba(15,23,42,1)]">
            <div className="flex items-center justify-between px-4 py-3 border-b border-slate-800/80">
              <h2 className="text-xs md:text-sm font-semibold uppercase tracking-[0.26em] text-slate-300">
                Preguntas
              </h2>
              <span className="text-[0.7rem] text-slate-500">
                {preguntas.length} registro
                {preguntas.length !== 1 && "s"}
              </span>
            </div>

            {loadingPreguntas ? (
              <div className="px-4 py-6 text-sm text-slate-300">
                Cargando preguntas...
              </div>
            ) : preguntas.length === 0 ? (
              <div className="px-4 py-6 text-sm text-slate-300">
                Aún no has definido preguntas para esta evaluación. Crea la
                primera pregunta desde el panel derecho.
              </div>
            ) : (
              <ul className="divide-y divide-slate-800/80">
                {preguntas.map((p, idx) => (
                  <li
                    key={p.id || idx}
                    className="px-4 py-3 flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between hover:bg-slate-900/70 transition-colors"
                  >
                    <div className="space-y-1">
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className="text-sm font-semibold text-slate-50">
                          {p.enunciado}
                        </span>
                        <span className="text-[0.65rem] px-2 py-0.5 rounded-full bg-sky-500/15 border border-sky-400/60 text-sky-100 uppercase tracking-[0.18em]">
                          {labelTipoPregunta(mapTipoDesdeBackend(p.tipo))}
                        </span>
                        {p.autoCalificable ? (
                          <span className="text-[0.6rem] px-2 py-0.5 rounded-full bg-emerald-500/20 border border-emerald-400/70 text-emerald-200 uppercase tracking-[0.18em]">
                            Auto-calificable
                          </span>
                        ) : (
                          <span className="text-[0.6rem] px-2 py-0.5 rounded-full bg-amber-500/20 border border-amber-400/70 text-amber-100 uppercase tracking-[0.18em]">
                            Revisión manual
                          </span>
                        )}
                      </div>
                      <p className="text-[0.7rem] text-slate-400">
                        Puntaje:{" "}
                        <span className="text-slate-100 font-semibold">
                          {p.puntaje ?? 1}
                        </span>
                        {p.opciones && p.opciones.length > 0 && (
                          <>
                            {" "}
                            · Opciones: {p.opciones.length}
                          </>
                        )}
                      </p>
                    </div>
                    <div className="flex flex-wrap gap-1.5 justify-start sm:justify-end">
                      <button
                        type="button"
                        onClick={() => handleEditarPregunta(p)}
                        className="inline-flex items-center justify-center rounded-full border border-slate-600/80 px-2.5 py-1 text-[0.65rem] font-semibold uppercase tracking-[0.16em] text-slate-100 hover:border-slate-200 hover:bg-slate-50 hover:text-slate-950 transition-colors"
                      >
                        Editar
                      </button>
                      <button
                        type="button"
                        onClick={() => handleEliminarPregunta(p.id)}
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

          {/* FORMULARIO PREGUNTA */}
          <section className="rounded-3xl border border-slate-200 bg-white/95 shadow-[0_18px_50px_rgba(15,23,42,0.4)] px-5 md:px-7 py-6 space-y-4">
            <div className="flex items-center justify-between gap-3">
              <div>
                <h2 className="text-sm md:text-base font-semibold text-slate-900">
                  {editandoId ? "Editar pregunta" : "Nueva pregunta"}
                </h2>
                <p className="text-[0.7rem] md:text-xs text-slate-500">
                  Define el enunciado, tipo, opciones (si aplica) y puntaje de
                  cada ítem.
                </p>
              </div>
              {editandoId && (
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
              {/* Enunciado */}
              <div className="space-y-1.5">
                <label className="text-xs font-semibold uppercase tracking-wide text-slate-700">
                  Enunciado
                </label>
                <textarea
                  name="enunciado"
                  rows={3}
                  value={form.enunciado}
                  onChange={handleChangeCampo}
                  className="w-full rounded-xl border border-slate-200 bg-slate-50/80 px-3 py-2 text-sm text-slate-900 shadow-inner focus:border-slate-900 focus:outline-none focus:ring-2 focus:ring-slate-900/10"
                  placeholder="Ej: ¿Cuál de las siguientes opciones es correcta?"
                />
              </div>

              {/* Tipo, puntaje, autoCalificable */}
              <div className="grid gap-4 md:grid-cols-3">
                <div className="space-y-1.5">
                  <label className="text-xs font-semibold uppercase tracking-wide text-slate-700">
                    Tipo de pregunta
                  </label>
                  <select
                    name="tipo"
                    value={form.tipo}
                    onChange={handleChangeCampo}
                    className="w-full rounded-xl border border-slate-200 bg-slate-50/80 px-3 py-2 text-sm text-slate-900 shadow-inner focus:border-slate-900 focus:outline-none focus:ring-2 focus:ring-slate-900/10"
                  >
                    <option value="opcion_unica">Opción única</option>
                    <option value="multiple">Selección múltiple</option>
                    <option value="vf">Verdadero / Falso</option>
                    <option value="numerica">Numérica</option>
                    <option value="abierta">Abierta (texto)</option>
                  </select>
                </div>

                <div className="space-y-1.5">
                  <label className="text-xs font-semibold uppercase tracking-wide text-slate-700">
                    Puntaje
                  </label>
                  <input
                    type="number"
                    name="puntaje"
                    min={0}
                    value={form.puntaje}
                    onChange={handleChangeCampo}
                    className="w-full rounded-xl border border-slate-200 bg-slate-50/80 px-3 py-2 text-sm text-slate-900 shadow-inner focus:border-slate-900 focus:outline-none focus:ring-2 focus:ring-slate-900/10"
                  />
                </div>

                <div className="flex items-end">
                  <label className="inline-flex items-center gap-2 text-[0.75rem] font-semibold text-slate-700">
                    <input
                      type="checkbox"
                      name="autoCalificable"
                      checked={form.autoCalificable}
                      onChange={handleChangeCampo}
                      disabled={form.tipo === "abierta"}
                      className="h-4 w-4 rounded border-slate-300 text-slate-900"
                    />
                    Auto-calificable
                    {form.tipo === "abierta" && (
                      <span className="text-[0.65rem] text-slate-400">
                        (las abiertas siempre requieren revisión manual)
                      </span>
                    )}
                  </label>
                </div>
              </div>

              {/* Opciones / respuesta numérica / guía abierta */}
              {(form.tipo === "opcion_unica" || form.tipo === "multiple") && (
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <label className="text-xs font-semibold uppercase tracking-wide text-slate-700">
                      Opciones de respuesta
                    </label>
                    <button
                      type="button"
                      onClick={handleAgregarOpcion}
                      className="inline-flex items-center justify-center rounded-full border border-slate-300 px-3 py-1 text-[0.7rem] font-semibold uppercase tracking-[0.16em] text-slate-700 hover:bg-slate-100 active:translate-y-px transition"
                    >
                      + Añadir opción
                    </button>
                  </div>

                  {(!form.opciones || form.opciones.length === 0) && (
                    <p className="text-[0.7rem] text-slate-500">
                      No hay opciones aún. Agrega al menos una.
                    </p>
                  )}

                  <div className="space-y-2">
                    {form.opciones?.map((op, index) => (
                      <div
                        key={index}
                        className="flex flex-col gap-2 rounded-xl border border-slate-200 bg-slate-50/80 px-3 py-2"
                      >
                        <div className="flex items-center gap-2">
                          <span className="text-[0.7rem] text-slate-500">
                            Opción {index + 1}
                          </span>
                          <label className="inline-flex items-center gap-1 text-[0.7rem] text-slate-700">
                            <input
                              type={
                                form.tipo === "opcion_unica"
                                  ? "radio"
                                  : "checkbox"
                              }
                              name={
                                form.tipo === "opcion_unica"
                                  ? "opcionCorrecta"
                                  : undefined
                              }
                              checked={!!op.correcta}
                              onChange={(e) =>
                                handleChangeOpcion(
                                  index,
                                  "correcta",
                                  e.target.checked
                                )
                              }
                            />
                            Correcta
                          </label>
                          {form.opciones.length > 1 && (
                            <button
                              type="button"
                              onClick={() => handleEliminarOpcion(index)}
                              className="ml-auto text-[0.7rem] text-rose-500 hover:text-rose-600"
                            >
                              Quitar
                            </button>
                          )}
                        </div>
                        <input
                          type="text"
                          value={op.texto}
                          onChange={(e) =>
                            handleChangeOpcion(index, "texto", e.target.value)
                          }
                          className="w-full rounded-lg border border-slate-200 bg-white px-2 py-1.5 text-sm text-slate-900 shadow-inner focus:border-slate-900 focus:outline-none focus:ring-1 focus:ring-slate-900/15"
                          placeholder="Texto de la opción"
                        />
                        <textarea
                          rows={2}
                          value={op.retroalimentacion || ""}
                          onChange={(e) =>
                            handleChangeOpcion(
                              index,
                              "retroalimentacion",
                              e.target.value
                            )
                          }
                          className="w-full rounded-lg border border-slate-200 bg-white px-2 py-1.5 text-xs text-slate-900 shadow-inner focus:border-slate-900 focus:outline-none focus:ring-1 focus:ring-slate-900/15"
                          placeholder="Retroalimentación opcional para esta opción (se puede mostrar al alumno al revisar la evaluación)"
                        />
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {form.tipo === "numerica" && (
                <div className="space-y-1.5">
                  <label className="text-xs font-semibold uppercase tracking-wide text-slate-700">
                    Respuesta numérica correcta
                  </label>
                  <input
                    type="number"
                    name="respuestaNumericaCorrecta"
                    value={form.respuestaNumericaCorrecta}
                    onChange={handleChangeCampo}
                    className="w-full rounded-xl border border-slate-200 bg-slate-50/80 px-3 py-2 text-sm text-slate-900 shadow-inner focus:border-slate-900 focus:outline-none focus:ring-2 focus:ring-slate-900/10"
                    placeholder="Ej: 3.14"
                  />
                </div>
              )}

              {form.tipo === "abierta" && (
                <div className="space-y-1.5">
                  <label className="text-xs font-semibold uppercase tracking-wide text-slate-700">
                    Guía de corrección (opcional)
                  </label>
                  <textarea
                    name="respuestaTextoGuia"
                    rows={3}
                    value={form.respuestaTextoGuia}
                    onChange={handleChangeCampo}
                    className="w-full rounded-xl border border-slate-200 bg-slate-50/80 px-3 py-2 text-sm text-slate-900 shadow-inner focus:border-slate-900 focus:outline-none focus:ring-2 focus:ring-slate-900/10"
                    placeholder="Describe la respuesta esperada, criterios de corrección, etc."
                  />
                </div>
              )}

              {/* Botones */}
              <div className="pt-2 flex flex-col-reverse gap-3 sm:flex-row sm:justify-end">
                <button
                  type="button"
                  onClick={() => navigate(-1)}
                  className="inline-flex items-center justify-center rounded-full border border-slate-300 px-4 py-2 text-xs md:text-sm font-semibold text-slate-700 hover:bg-slate-100 active:translate-y-px transition"
                >
                  Volver
                </button>
                <button
                  type="submit"
                  disabled={guardando}
                  className="inline-flex items-center justify-center rounded-full bg-slate-900 px-5 py-2 text-xs md:text-sm font-semibold text-amber-100 shadow-sm hover:bg-slate-800 active:translate-y-px disabled:opacity-60 disabled:cursor-not-allowed transition"
                >
                  {guardando
                    ? "Guardando..."
                    : editandoId
                    ? "Guardar cambios"
                    : "Crear pregunta"}
                </button>
              </div>
            </form>
          </section>
        </div>

        <section className="pt-1">
          <p className="text-[0.7rem] text-slate-500 max-w-lg">
            Las preguntas que definas aquí se utilizarán cuando el estudiante
            realice la evaluación. Más adelante puedes usar este modelo para
            renderizar cada ítem en la pantalla de intento y aplicar
            autocorrección.
          </p>
        </section>
      </div>
    </main>
  );
};

export default EvaluacionPreguntasGestion;

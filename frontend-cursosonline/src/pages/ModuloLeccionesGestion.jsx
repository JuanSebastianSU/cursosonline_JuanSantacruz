// src/pages/ModuloLeccionesGestion.jsx
import React, { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { obtenerCurso } from "../services/cursoService";
import {
  listarLecciones,
  crearLeccion,
  actualizarLeccion,
  eliminarLeccion,
  moverLeccion,
  publicarLeccion,
  archivarLeccion,
} from "../services/leccionService";

/**
 * Panel para gestionar las lecciones de un módulo concreto.
 * Ruta: /instructor/modulos/:idModulo/lecciones
 */
const ModuloLeccionesGestion = () => {
  const { idModulo } = useParams(); // ojo con el nombre en AppRoutes
  const navigate = useNavigate();

  const [curso, setCurso] = useState(null);
  const [moduloInfo, setModuloInfo] = useState(null); // opcional si lo cargas desde otro endpoint
  const [loadingCabecera, setLoadingCabecera] = useState(true);
  const [errorCabecera, setErrorCabecera] = useState("");

  const [lecciones, setLecciones] = useState([]);
  const [loadingLecciones, setLoadingLecciones] = useState(true);
  const [errorLecciones, setErrorLecciones] = useState("");

  // formulario nueva lección
  const [formNueva, setFormNueva] = useState({
    titulo: "",
    tipo: "VIDEO",
    duracion: "",
    urlContenido: "",
    orden: "",
  });
  const [creando, setCreando] = useState(false);

  // edición inline
  const [editandoId, setEditandoId] = useState(null);
  const [formEdicion, setFormEdicion] = useState({
    titulo: "",
    tipo: "VIDEO",
    duracion: "",
    urlContenido: "",
    orden: "",
  });
  const [guardandoEdicion, setGuardandoEdicion] = useState(false);

  // ---------- helpers ----------
  const estadoChip = (estado) => {
    const e = (estado || "").toUpperCase();
    if (e === "PUBLICADO") return "bg-emerald-500/90 text-emerald-950";
    if (e === "ARCHIVADO") return "bg-slate-600 text-slate-50";
    return "bg-slate-500/90 text-slate-50"; // BORRADOR u otro
  };

  const tipoLabel = (t) => {
    const v = (t || "").toUpperCase();
    if (v === "VIDEO") return "Video";
    if (v === "ARTICULO") return "Artículo";
    if (v === "QUIZ") return "Quiz";
    return v || "N/D";
  };

  const ordenarLecciones = (lista) =>
    lista
      .slice()
      .sort((a, b) => (a.orden || 0) - (b.orden || 0) || a.titulo.localeCompare(b.titulo));

  // ---------- cargar cabecera (curso + info módulo mínima) ----------
  useEffect(() => {
    const fetchCabecera = async () => {
      setLoadingCabecera(true);
      setErrorCabecera("");

      try {
        // Truco rápido:
        // como Leccion tiene idCurso en la entidad, podrías tener endpoint,
        // pero para no liarla asumimos que ya sabes el curso en otro lado
        // o lo dejamos sin título de curso si no está.
        // Aquí solo dejamos el módulo ID visible.
        setModuloInfo({ id: idModulo });
      } catch (err) {
        console.error(err);
        setErrorCabecera("No se pudo cargar la información del módulo.");
      } finally {
        setLoadingCabecera(false);
      }
    };

    fetchCabecera();
  }, [idModulo]);

  // ---------- cargar lecciones ----------
  const fetchLecciones = async () => {
    setLoadingLecciones(true);
    setErrorLecciones("");
    try {
      const data = await listarLecciones(idModulo);
      setLecciones(data || []);
    } catch (err) {
      console.error(err);
      if (err.response?.status === 403) {
        setErrorLecciones(
          "No tienes permisos para gestionar las lecciones de este módulo."
        );
      } else {
        setErrorLecciones("No se pudo cargar la lista de lecciones.");
      }
    } finally {
      setLoadingLecciones(false);
    }
  };

  useEffect(() => {
    fetchLecciones();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [idModulo]);

  // ---------- crear lección ----------
  const handleCrearLeccion = async (e) => {
    e.preventDefault();

    if (!formNueva.titulo.trim()) {
      alert("El título de la lección es obligatorio.");
      return;
    }
    if (!formNueva.tipo) {
      alert("El tipo de lección es obligatorio.");
      return;
    }

    // Para VIDEO / ARTICULO, urlContenido obligatorio (igual que en el backend)
    const tipoUpper = formNueva.tipo.toUpperCase();
    if (tipoUpper !== "QUIZ") {
      if (!formNueva.urlContenido.trim()) {
        alert("La URL de contenido es obligatoria para VIDEO / ARTÍCULO.");
        return;
      }
    }

    setCreando(true);
    try {
      const payload = {
        titulo: formNueva.titulo,
        tipo: tipoUpper,
        duracion: formNueva.duracion,
        urlContenido:
          tipoUpper === "QUIZ" ? null : formNueva.urlContenido, // el backend lo permite nulo en QUIZ
        orden: formNueva.orden ? Number(formNueva.orden) : undefined,
      };

      await crearLeccion(idModulo, payload);
      setFormNueva({
        titulo: "",
        tipo: "VIDEO",
        duracion: "",
        urlContenido: "",
        orden: "",
      });
      await fetchLecciones();
    } catch (err) {
      console.error(err);
      const msg =
        err.response?.data?.message || err.response?.data || "No se pudo guardar la lección.";
      alert(msg);
    } finally {
      setCreando(false);
    }
  };

  // ---------- preparar edición ----------
  const startEditar = (lec) => {
    setEditandoId(lec.id);
    setFormEdicion({
      titulo: lec.titulo || "",
      tipo: (lec.tipo || "VIDEO").toUpperCase(),
      duracion: lec.duracion ?? "",
      urlContenido: lec.urlContenido || "",
      orden: lec.orden ?? "",
    });
  };

  const cancelarEdicion = () => {
    setEditandoId(null);
    setFormEdicion({
      titulo: "",
      tipo: "VIDEO",
      duracion: "",
      urlContenido: "",
      orden: "",
    });
  };

  const handleGuardarEdicion = async (idLeccion) => {
    if (!formEdicion.titulo.trim()) {
      alert("El título no puede estar vacío.");
      return;
    }
    const tipoUpper = formEdicion.tipo.toUpperCase();

    if (tipoUpper !== "QUIZ") {
      const url = formEdicion.urlContenido || "";
      if (!url.trim()) {
        alert("La URL de contenido es obligatoria para VIDEO / ARTÍCULO.");
        return;
      }
    }

    setGuardandoEdicion(true);
    try {
      const payload = {
        titulo: formEdicion.titulo,
        tipo: tipoUpper,
        duracion: formEdicion.duracion,
        urlContenido: tipoUpper === "QUIZ" ? null : formEdicion.urlContenido,
        orden: formEdicion.orden ? Number(formEdicion.orden) : undefined,
      };

      await actualizarLeccion(idModulo, idLeccion, payload);
      cancelarEdicion();
      await fetchLecciones();
    } catch (err) {
      console.error(err);
      const msg =
        err.response?.data?.message ||
        err.response?.data ||
        "No se pudo actualizar la lección.";
      alert(msg);
    } finally {
      setGuardandoEdicion(false);
    }
  };

  // ---------- publicar / archivar ----------
  const handleToggleEstado = async (lec) => {
    try {
      if ((lec.estado || "").toUpperCase() === "PUBLICADO") {
        await archivarLeccion(idModulo, lec.id);
      } else {
        await publicarLeccion(idModulo, lec.id);
      }
      await fetchLecciones();
    } catch (err) {
      console.error(err);
      const msg =
        err.response?.data?.message ||
        err.response?.data ||
        "No se pudo cambiar el estado de la lección.";
      alert(msg);
    }
  };

  // ---------- eliminar ----------
  const handleEliminar = async (lec) => {
    if (
      !window.confirm(
        `¿Seguro que deseas eliminar la lección "${lec.titulo}"? Esta acción no se puede deshacer.`
      )
    ) {
      return;
    }
    try {
      await eliminarLeccion(idModulo, lec.id);
      await fetchLecciones();
    } catch (err) {
      console.error(err);
      const msg =
        err.response?.data?.message ||
        err.response?.data ||
        "No se pudo eliminar la lección.";
      alert(msg);
    }
  };

  // ---------- mover ----------
  const handleMover = async (lec, delta) => {
    try {
      await moverLeccion(idModulo, lec.id, { delta });
      await fetchLecciones();
    } catch (err) {
      console.error(err);
      const msg =
        err.response?.data?.message ||
        err.response?.data ||
        "No se pudo mover la lección.";
      alert(msg);
    }
  };

  // ---------- render ----------

  if (loadingCabecera) {
    return (
      <div className="max-w-5xl mx-auto px-4 md:px-6 py-10 text-center text-sm md:text-base text-slate-300">
        Cargando módulo...
      </div>
    );
  }

  if (errorCabecera) {
    return (
      <div className="max-w-5xl mx-auto px-4 md:px-6 py-10 text-center text-sm md:text-base text-rose-400">
        {errorCabecera}
      </div>
    );
  }

  const listaOrdenada = ordenarLecciones(lecciones);

  return (
    <main className="flex-1 bg-slate-950/90 text-slate-50">
      <div className="max-w-6xl mx-auto px-4 md:px-6 py-8 md:py-10 space-y-7">
        {/* Volver */}
        <button
          type="button"
          onClick={() => navigate(-1)}
          className="inline-flex items-center gap-2 rounded-full border border-slate-700/70 bg-slate-950/80 px-4 py-1.5 text-[0.7rem] md:text-xs font-semibold uppercase tracking-[0.22em] text-slate-200 hover:border-amber-400/80 hover:text-amber-200 hover:bg-slate-900 transition-colors"
        >
          <span className="text-sm">←</span> Volver
        </button>

        {/* Header */}
        <section className="relative overflow-hidden rounded-[2.5rem] border border-slate-800 bg-gradient-to-r from-slate-950 via-slate-900 to-slate-950 px-5 md:px-8 py-6 md:py-7 shadow-[0_24px_90px_rgba(0,0,0,0.95)]">
          <div className="pointer-events-none absolute -left-24 -top-24 h-64 w-64 rounded-full border border-slate-700/60" />
          <div className="pointer-events-none absolute -right-16 -bottom-28 h-72 w-72 rounded-[40%] border border-slate-800/70" />

          <div className="relative space-y-3">
            <span className="inline-flex items-center rounded-full bg-sky-400/95 px-3 py-1 text-[0.7rem] font-semibold uppercase tracking-[0.22em] text-slate-950 shadow-[0_0_25px_rgba(56,189,248,0.9)]">
              Gestión de lecciones
            </span>
            <h1 className="text-2xl md:text-3xl font-semibold tracking-tight text-slate-50">
              Lecciones del módulo
            </h1>
            <p className="max-w-2xl text-xs md:text-sm text-slate-300/90">
              Crea y organiza las lecciones de este módulo. Desde aquí también
              podrás controlar qué lecciones están publicadas y el orden en el que
              tus estudiantes las verán.
            </p>
            <p className="text-[0.7rem] text-slate-500 mt-1">
              ID módulo: <span className="font-mono">{idModulo}</span>
            </p>
          </div>
        </section>

        {/* Layout principal: lista izquierda, formulario derecha */}
        <section className="grid gap-6 md:grid-cols-[minmax(0,3fr)_minmax(0,2.8fr)]">
          {/* Lista de lecciones */}
          <div className="rounded-[2.5rem] border border-slate-800 bg-slate-950/95 px-5 md:px-6 py-5 md:py-6 shadow-[0_24px_90px_rgba(0,0,0,0.95)] space-y-4">
            <div className="flex items-center justify-between gap-3 flex-wrap">
              <h2 className="text-lg md:text-xl font-semibold text-slate-50 tracking-tight">
                Lecciones
              </h2>
              {listaOrdenada.length > 0 && (
                <p className="text-[0.7rem] md:text-xs uppercase tracking-[0.22em] text-slate-400">
                  {listaOrdenada.length} lección
                  {listaOrdenada.length > 1 ? "es" : ""} en total
                </p>
              )}
            </div>

            {loadingLecciones ? (
              <p className="text-xs md:text-sm text-slate-300">
                Cargando lecciones...
              </p>
            ) : errorLecciones ? (
              <p className="text-xs md:text-sm text-rose-400">{errorLecciones}</p>
            ) : listaOrdenada.length === 0 ? (
              <p className="text-xs md:text-sm text-slate-400">
                No hay lecciones creadas todavía. Empieza creando una en el panel
                derecho.
              </p>
            ) : (
              <div className="space-y-3 md:space-y-4">
                {listaOrdenada.map((lec, index) => {
                  const esEditando = editandoId === lec.id;
                  const esPrimero = index === 0;
                  const esUltimo = index === listaOrdenada.length - 1;

                  return (
                    <div
                      key={lec.id}
                      className="group relative rounded-2xl border border-slate-800/80 bg-slate-900/80 px-4 py-3 md:px-5 md:py-4 shadow-[0_18px_50px_rgba(15,23,42,0.9)]"
                    >
                      <div className="flex items-start justify-between gap-3 flex-wrap">
                        <div className="flex items-center gap-3">
                          <div className="h-7 w-7 rounded-full border border-sky-300/80 bg-slate-950 flex items-center justify-center text-[0.7rem] font-semibold text-sky-200 shadow-[0_0_18px_rgba(56,189,248,0.7)]">
                            {lec.orden || index + 1}
                          </div>
                          <div className="space-y-1">
                            <h3 className="text-sm md:text-base font-semibold text-slate-50">
                              {lec.titulo || `Lección ${lec.orden || index + 1}`}
                            </h3>
                            <p className="text-[0.7rem] md:text-xs text-slate-400 flex items-center gap-2">
                              <span className="inline-flex items-center rounded-full border border-slate-600/70 px-2 py-0.5">
                                <span className="mr-1 text-[0.8rem]">🎬</span>
                                {tipoLabel(lec.tipo)}
                              </span>
                              {lec.duracion != null && (
                                <span className="text-slate-400">
                                  · {lec.duracion} min
                                </span>
                              )}
                            </p>
                            {lec.urlContenido && !esEditando && (
                              <p className="text-[0.7rem] md:text-xs text-slate-500 line-clamp-1">
                                {lec.urlContenido}
                              </p>
                            )}
                          </div>
                        </div>

                        <div className="flex flex-col items-end gap-2">
                          <span
                            className={`inline-flex items-center rounded-full px-2.5 py-1 text-[0.65rem] font-semibold uppercase tracking-[0.22em] ${estadoChip(
                              lec.estado
                            )}`}
                          >
                            {lec.estado || "BORRADOR"}
                          </span>
                          <div className="flex flex-wrap justify-end gap-1.5">
                            <button
                              type="button"
                              disabled={esPrimero}
                              onClick={() => handleMover(lec, -1)}
                              className="rounded-full border border-slate-600/80 px-2 py-1 text-[0.65rem] font-semibold uppercase tracking-[0.18em] text-slate-200 hover:border-amber-300 hover:text-amber-200 disabled:opacity-40 disabled:cursor-not-allowed"
                            >
                              ↑
                            </button>
                            <button
                              type="button"
                              disabled={esUltimo}
                              onClick={() => handleMover(lec, +1)}
                              className="rounded-full border border-slate-600/80 px-2 py-1 text-[0.65rem] font-semibold uppercase tracking-[0.18em] text-slate-200 hover:border-amber-300 hover:text-amber-200 disabled:opacity-40 disabled:cursor-not-allowed"
                            >
                              ↓
                            
                            </button>
                            <button
                              type="button"
                              onClick={() => handleToggleEstado(lec)}
                              className="rounded-full border border-slate-600/80 px-3 py-1 text-[0.65rem] font-semibold uppercase tracking-[0.18em] text-slate-200 hover:border-emerald-400 hover:text-emerald-200"
                            >
                              {(lec.estado || "").toUpperCase() === "PUBLICADO"
                                ? "Archivar"
                                : "Publicar"}
                            </button>

                            <button
                                type="button"
                                onClick={() =>
                                navigate(`/instructor/lecciones/${lec.id}/evaluaciones`)
                                }
                                className="rounded-full border border-purple-400/80 px-3 py-1 text-[0.65rem] font-semibold uppercase tracking-[0.18em] text-purple-200 hover:bg-purple-400/15 hover:border-purple-300 transition-colors"
                            >
                                Evaluaciones
                            </button>
                            <button
                              type="button"
                              onClick={() =>
                                esEditando ? cancelarEdicion() : startEditar(lec)
                              }
                              className="rounded-full border border-slate-600/80 px-3 py-1 text-[0.65rem] font-semibold uppercase tracking-[0.18em] text-slate-200 hover:border-amber-300 hover:text-amber-200"
                            >
                              {esEditando ? "Cancelar" : "Editar"}
                            </button>
                            <button
                              type="button"
                              onClick={() => handleEliminar(lec)}
                              className="rounded-full border border-rose-500/70 px-3 py-1 text-[0.65rem] font-semibold uppercase tracking-[0.18em] text-rose-200 hover:bg-rose-500/10"
                            >
                              Eliminar
                            </button>
                          </div>
                        </div>
                      </div>

                      {/* edición inline */}
                      {esEditando && (
                        <div className="mt-4 grid gap-3 md:grid-cols-[minmax(0,2.4fr)_minmax(0,2.2fr)_minmax(0,1.6fr)] items-start">
                          <div className="space-y-1.5">
                            <label className="text-[0.7rem] font-semibold uppercase tracking-[0.22em] text-slate-400">
                              Título
                            </label>
                            <input
                              type="text"
                              value={formEdicion.titulo}
                              onChange={(e) =>
                                setFormEdicion((prev) => ({
                                  ...prev,
                                  titulo: e.target.value,
                                }))
                              }
                              className="w-full rounded-xl border border-slate-700 bg-slate-950 px-3 py-2 text-xs md:text-sm text-slate-50 shadow-inner focus:outline-none focus:ring-2 focus:ring-sky-400/40 focus:border-sky-300"
                            />
                          </div>

                          <div className="space-y-1.5">
                            <label className="text-[0.7rem] font-semibold uppercase tracking-[0.22em] text-slate-400">
                              Tipo y duración
                            </label>
                            <div className="flex gap-2">
                              <select
                                value={formEdicion.tipo}
                                onChange={(e) =>
                                  setFormEdicion((prev) => ({
                                    ...prev,
                                    tipo: e.target.value,
                                  }))
                                }
                                className="w-1/2 rounded-xl border border-slate-700 bg-slate-950 px-3 py-2 text-xs md:text-sm text-slate-50 focus:outline-none focus:ring-2 focus:ring-sky-400/40 focus:border-sky-300"
                              >
                                <option value="VIDEO">Video</option>
                                <option value="ARTICULO">Artículo</option>
                                <option value="QUIZ">Quiz</option>
                              </select>
                              <input
                                type="number"
                                min={0}
                                placeholder="Duración (min)"
                                value={formEdicion.duracion}
                                onChange={(e) =>
                                  setFormEdicion((prev) => ({
                                    ...prev,
                                    duracion: e.target.value,
                                  }))
                                }
                                className="w-1/2 rounded-xl border border-slate-700 bg-slate-950 px-3 py-2 text-xs md:text-sm text-slate-50 focus:outline-none focus:ring-2 focus:ring-sky-400/40 focus:border-sky-300"
                              />
                            </div>
                            {formEdicion.tipo !== "QUIZ" && (
                              <input
                                type="text"
                                placeholder="URL de contenido"
                                value={formEdicion.urlContenido}
                                onChange={(e) =>
                                  setFormEdicion((prev) => ({
                                    ...prev,
                                    urlContenido: e.target.value,
                                  }))
                                }
                                className="mt-2 w-full rounded-xl border border-slate-700 bg-slate-950 px-3 py-2 text-xs md:text-sm text-slate-50 focus:outline-none focus:ring-2 focus:ring-sky-400/40 focus:border-sky-300"
                              />
                            )}
                          </div>

                          <div className="space-y-2">
                            <div className="space-y-1.5">
                              <label className="text-[0.7rem] font-semibold uppercase tracking-[0.22em] text-slate-400">
                                Orden
                              </label>
                              <input
                                type="number"
                                min={1}
                                value={formEdicion.orden}
                                onChange={(e) =>
                                  setFormEdicion((prev) => ({
                                    ...prev,
                                    orden: e.target.value,
                                  }))
                                }
                                className="w-full rounded-xl border border-slate-700 bg-slate-950 px-3 py-2 text-xs md:text-sm text-slate-50 focus:outline-none focus:ring-2 focus:ring-sky-400/40 focus:border-sky-300"
                              />
                            </div>
                            <button
                              type="button"
                              disabled={guardandoEdicion}
                              onClick={() => handleGuardarEdicion(lec.id)}
                              className="mt-1 inline-flex w-full items-center justify-center rounded-full bg-slate-50 px-4 py-2 text-xs md:text-sm font-semibold uppercase tracking-[0.22em] text-slate-950 shadow-[0_0_25px_rgba(248,250,252,0.9)] hover:bg-sky-200 hover:text-slate-950 active:translate-y-px disabled:opacity-60 disabled:cursor-not-allowed transition"
                            >
                              {guardandoEdicion ? "Guardando..." : "Guardar cambios"}
                            </button>
                          </div>
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            )}
          </div>

          {/* Nueva lección */}
          <div className="rounded-[2.5rem] border border-slate-800 bg-slate-950/95 px-5 md:px-7 py-6 md:py-7 shadow-[0_24px_90px_rgba(0,0,0,0.95)]">
            <h2 className="text-lg md:text-xl font-semibold text-slate-50 tracking-tight mb-4">
              Nueva lección
            </h2>

            <form onSubmit={handleCrearLeccion} className="space-y-4">
              <div className="space-y-1.5">
                <label className="text-[0.7rem] font-semibold uppercase tracking-[0.22em] text-slate-400">
                  Título *
                </label>
                <input
                  type="text"
                  value={formNueva.titulo}
                  onChange={(e) =>
                    setFormNueva((prev) => ({ ...prev, titulo: e.target.value }))
                  }
                  className="w-full rounded-xl border border-slate-700 bg-slate-900 px-3 py-2 text-xs md:text-sm text-slate-50 shadow-inner focus:outline-none focus:ring-2 focus:ring-sky-400/40 focus:border-sky-300"
                />
              </div>

              <div className="grid gap-3 md:grid-cols-2">
                <div className="space-y-1.5">
                  <label className="text-[0.7rem] font-semibold uppercase tracking-[0.22em] text-slate-400">
                    Tipo *
                  </label>
                  <select
                    value={formNueva.tipo}
                    onChange={(e) =>
                      setFormNueva((prev) => ({
                        ...prev,
                        tipo: e.target.value,
                      }))
                    }
                    className="w-full rounded-xl border border-slate-700 bg-slate-900 px-3 py-2 text-xs md:text-sm text-slate-50 focus:outline-none focus:ring-2 focus:ring-sky-400/40 focus:border-sky-300"
                  >
                    <option value="VIDEO">Video</option>
                    <option value="ARTICULO">Artículo</option>
                    <option value="QUIZ">Quiz</option>
                  </select>
                </div>

                <div className="space-y-1.5">
                  <label className="text-[0.7rem] font-semibold uppercase tracking-[0.22em] text-slate-400">
                    Duración (minutos)
                  </label>
                  <input
                    type="number"
                    min={0}
                    value={formNueva.duracion}
                    onChange={(e) =>
                      setFormNueva((prev) => ({
                        ...prev,
                        duracion: e.target.value,
                      }))
                    }
                    className="w-full rounded-xl border border-slate-700 bg-slate-900 px-3 py-2 text-xs md:text-sm text-slate-50 focus:outline-none focus:ring-2 focus:ring-sky-400/40 focus:border-sky-300"
                  />
                </div>
              </div>

              {formNueva.tipo !== "QUIZ" && (
                <div className="space-y-1.5">
                  <label className="text-[0.7rem] font-semibold uppercase tracking-[0.22em] text-slate-400">
                    URL de contenido *
                  </label>
                  <input
                    type="text"
                    placeholder="https://..."
                    value={formNueva.urlContenido}
                    onChange={(e) =>
                      setFormNueva((prev) => ({
                        ...prev,
                        urlContenido: e.target.value,
                      }))
                    }
                    className="w-full rounded-xl border border-slate-700 bg-slate-900 px-3 py-2 text-xs md:text-sm text-slate-50 focus:outline-none focus:ring-2 focus:ring-sky-400/40 focus:border-sky-300"
                  />
                  <p className="text-[0.65rem] text-slate-500">
                    Para VIDEO / ARTÍCULO es obligatorio. Para QUIZ puedes dejarlo
                    vacío (las preguntas se gestionan aparte).
                  </p>
                </div>
              )}

              <div className="space-y-1.5">
                <label className="text-[0.7rem] font-semibold uppercase tracking-[0.22em] text-slate-400">
                  Orden (opcional)
                </label>
                <input
                  type="number"
                  min={1}
                  value={formNueva.orden}
                  onChange={(e) =>
                    setFormNueva((prev) => ({
                      ...prev,
                      orden: e.target.value,
                    }))
                  }
                  className="w-full rounded-xl border border-slate-700 bg-slate-900 px-3 py-2 text-xs md:text-sm text-slate-50 focus:outline-none focus:ring-2 focus:ring-sky-400/40 focus:border-sky-300"
                />
              </div>

              <div className="pt-2 flex flex-col gap-2">
                <button
                  type="submit"
                  disabled={creando}
                  className="inline-flex items-center justify-center rounded-full bg-sky-400 px-4 py-2 text-xs md:text-sm font-semibold uppercase tracking-[0.22em] text-slate-950 shadow-[0_0_30px_rgba(56,189,248,0.9)] hover:bg-sky-300 active:translate-y-px disabled:opacity-60 disabled:cursor-not-allowed transition"
                >
                  {creando ? "Guardando..." : "Guardar lección"}
                </button>
                <p className="text-[0.65rem] text-slate-500">
                  Consejo: mantén la lección en{" "}
                  <span className="text-emerald-300">BORRADOR</span> mientras preparas
                  el contenido, y publícala cuando esté lista para tus estudiantes.
                </p>
              </div>
            </form>
          </div>
        </section>
      </div>
    </main>
  );
};

export default ModuloLeccionesGestion;

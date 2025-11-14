// src/pages/CursoModulosGestion.jsx
import React, { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { obtenerCurso } from "../services/cursoService";
import {
  listarModulos,
  crearModulo,
  actualizarModulo,
  eliminarModulo,
  moverModulo,
  publicarModulo,
  archivarModulo,
} from "../services/moduloService";

const CursoModulosGestion = () => {
  const { id } = useParams(); // id del curso
  const navigate = useNavigate();

  const [curso, setCurso] = useState(null);
  const [loadingCurso, setLoadingCurso] = useState(true);
  const [errorCurso, setErrorCurso] = useState("");

  const [modulos, setModulos] = useState([]);
  const [loadingModulos, setLoadingModulos] = useState(true);
  const [errorModulos, setErrorModulos] = useState("");

  // Nuevo módulo
  const [nuevo, setNuevo] = useState({
    titulo: "",
    descripcion: "",
    orden: "",
  });
  const [creando, setCreando] = useState(false);

  // Edición
  const [editandoId, setEditandoId] = useState(null);
  const [formEdicion, setFormEdicion] = useState({
    titulo: "",
    descripcion: "",
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

  const ordenarModulos = (lista) =>
    lista
      .slice()
      .sort(
        (a, b) =>
          (a.orden || 0) - (b.orden || 0) || a.titulo.localeCompare(b.titulo)
      );

  // ---------- cargar curso ----------
  useEffect(() => {
    const fetchCurso = async () => {
      setLoadingCurso(true);
      setErrorCurso("");
      try {
        const data = await obtenerCurso(id);
        setCurso(data);
      } catch (err) {
        console.error(err);
        setErrorCurso("No se pudo cargar la información del curso.");
      } finally {
        setLoadingCurso(false);
      }
    };
    fetchCurso();
  }, [id]);

  // ---------- cargar módulos ----------
  const fetchModulos = async () => {
    setLoadingModulos(true);
    setErrorModulos("");
    try {
      const data = await listarModulos(id);
      setModulos(data || []);
    } catch (err) {
      console.error(err);
      if (err.response?.status === 403) {
        setErrorModulos(
          "No tienes permisos para gestionar los módulos de este curso."
        );
      } else {
        setErrorModulos("No se pudo cargar la lista de módulos.");
      }
    } finally {
      setLoadingModulos(false);
    }
  };

  useEffect(() => {
    fetchModulos();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [id]);

  // ---------- crear módulo ----------
  const handleCrearModulo = async (e) => {
    e.preventDefault();
    if (!nuevo.titulo.trim()) {
      alert("El título del módulo es obligatorio.");
      return;
    }

    setCreando(true);
    try {
      const payload = {
        titulo: nuevo.titulo.trim(),
        descripcion: nuevo.descripcion?.trim() || "",
      };

      if (nuevo.orden) {
        payload.orden = Number(nuevo.orden);
      }

      await crearModulo(id, payload);
      setNuevo({ titulo: "", descripcion: "", orden: "" });
      await fetchModulos();
    } catch (err) {
      console.error(err);
      const msg =
        err.response?.data?.message ||
        err.response?.data ||
        "No se pudo crear el módulo.";
      alert(msg);
    } finally {
      setCreando(false);
    }
  };

  // ---------- preparar edición ----------
  const startEditar = (mod) => {
    setEditandoId(mod.id);
    setFormEdicion({
      titulo: mod.titulo || "",
      descripcion: mod.descripcion || "",
      orden: mod.orden || "",
    });
  };

  const cancelarEdicion = () => {
    setEditandoId(null);
    setFormEdicion({ titulo: "", descripcion: "", orden: "" });
  };

  const handleGuardarEdicion = async (idModulo) => {
    if (!formEdicion.titulo.trim()) {
      alert("El título no puede estar vacío.");
      return;
    }
    setGuardandoEdicion(true);
    try {
      const payload = {
        titulo: formEdicion.titulo.trim(),
        descripcion: formEdicion.descripcion?.trim() || "",
      };
      if (formEdicion.orden) {
        payload.orden = Number(formEdicion.orden);
      }
      await actualizarModulo(id, idModulo, payload);
      cancelarEdicion();
      await fetchModulos();
    } catch (err) {
      console.error(err);
      const msg =
        err.response?.data?.message ||
        err.response?.data ||
        "No se pudo actualizar el módulo.";
      alert(msg);
    } finally {
      setGuardandoEdicion(false);
    }
  };

  // ---------- publicar / archivar ----------
  const handleToggleEstado = async (mod) => {
    try {
      if ((mod.estado || "").toUpperCase() === "PUBLICADO") {
        await archivarModulo(id, mod.id);
      } else {
        await publicarModulo(id, mod.id);
      }
      await fetchModulos();
    } catch (err) {
      console.error(err);
      const msg =
        err.response?.data?.message ||
        err.response?.data ||
        "No se pudo cambiar el estado del módulo.";
      alert(msg);
    }
  };

  // ---------- eliminar ----------
  const handleEliminar = async (mod) => {
    if (
      !window.confirm(
        `¿Seguro que deseas eliminar el módulo "${mod.titulo}"? Esta acción no se puede deshacer.`
      )
    ) {
      return;
    }
    try {
      await eliminarModulo(id, mod.id);
      await fetchModulos();
    } catch (err) {
      console.error(err);
      const msg =
        err.response?.data?.message ||
        err.response?.data ||
        "No se pudo eliminar el módulo.";
      alert(msg);
    }
  };

  // ---------- mover ----------
  const handleMover = async (mod, delta) => {
    try {
      await moverModulo(id, mod.id, { delta });
      await fetchModulos();
    } catch (err) {
      console.error(err);
      const msg =
        err.response?.data?.message ||
        err.response?.data ||
        "No se pudo mover el módulo.";
      alert(msg);
    }
  };

  // ---------- render ----------

  if (loadingCurso) {
    return (
      <div className="max-w-5xl mx-auto px-4 md:px-6 py-10 text-center text-sm md:text-base text-slate-300">
        Cargando curso...
      </div>
    );
  }

  if (errorCurso || !curso) {
    return (
      <div className="max-w-5xl mx-auto px-4 md:px-6 py-10 text-center text-sm md:text-base text-rose-400">
        {errorCurso || "Curso no encontrado."}
      </div>
    );
  }

  const listaOrdenada = ordenarModulos(modulos);

  return (
    <div className="max-w-6xl mx-auto px-4 md:px-6 py-8 md:py-10 space-y-7">
      {/* Volver */}
      <button
        type="button"
        onClick={() => navigate("/instructor/cursos")}
        className="inline-flex items-center gap-2 rounded-full border border-slate-700/70 bg-slate-950/80 px-4 py-1.5 text-[0.7rem] md:text-xs font-semibold uppercase tracking-[0.22em] text-slate-200 hover:border-amber-400/80 hover:text-amber-200 hover:bg-slate-900 transition-colors"
      >
        <span className="text-sm">←</span> Volver a mis cursos
      </button>

      {/* Header */}
      <section className="relative overflow-hidden rounded-[2.5rem] border border-slate-800 bg-gradient-to-r from-slate-950 via-slate-900 to-slate-950 px-5 md:px-8 py-6 md:py-7 shadow-[0_24px_90px_rgba(0,0,0,0.95)]">
        <div className="pointer-events-none absolute -left-24 -top-24 h-64 w-64 rounded-full border border-slate-700/60" />
        <div className="pointer-events-none absolute -right-16 -bottom-28 h-72 w-72 rounded-[40%] border border-slate-800/70" />

        <div className="relative space-y-3">
          <span className="inline-flex items-center rounded-full bg-amber-400/95 px-3 py-1 text-[0.7rem] font-semibold uppercase tracking-[0.22em] text-slate-950 shadow-[0_0_25px_rgba(251,191,36,0.9)]">
            Gestión de módulos
          </span>
          <h1 className="text-2xl md:text-3xl font-semibold tracking-tight text-slate-50">
            {curso.titulo}
          </h1>
          <p className="max-w-2xl text-xs md:text-sm text-slate-300/90">
            Crea, ordena y publica los módulos de este curso. Solo el
            administrador y el instructor dueño del curso pueden ver esta sección
            (el backend ya valida los permisos).
          </p>
        </div>
      </section>

      {/* Form nuevo módulo */}
      <section className="rounded-[2.5rem] border border-slate-800 bg-slate-950/95 px-5 md:px-8 py-6 md:py-7 shadow-[0_24px_90px_rgba(0,0,0,0.95)]">
        <h2 className="text-lg md:text-xl font-semibold text-slate-50 tracking-tight mb-3">
          Nuevo módulo
        </h2>

        <form
          onSubmit={handleCrearModulo}
          className="grid gap-4 md:grid-cols-[minmax(0,2fr)_minmax(0,3fr)_minmax(0,1fr)] items-start"
        >
          <div className="space-y-1.5">
            <label className="text-[0.7rem] font-semibold uppercase tracking-[0.22em] text-slate-400">
              Título *
            </label>
            <input
              type="text"
              value={nuevo.titulo}
              onChange={(e) =>
                setNuevo((prev) => ({ ...prev, titulo: e.target.value }))
              }
              className="w-full rounded-xl border border-slate-700 bg-slate-900 px-3 py-2 text-xs md:text-sm text-slate-50 shadow-inner focus:outline-none focus:ring-2 focus:ring-amber-400/40 focus:border-amber-300"
            />
          </div>

          <div className="space-y-1.5">
            <label className="text-[0.7rem] font-semibold uppercase tracking-[0.22em] text-slate-400">
              Descripción
            </label>
            <textarea
              rows={2}
              value={nuevo.descripcion}
              onChange={(e) =>
                setNuevo((prev) => ({ ...prev, descripcion: e.target.value }))
              }
              className="w-full rounded-xl border border-slate-700 bg-slate-900 px-3 py-2 text-xs md:text-sm text-slate-50 shadow-inner focus:outline-none focus:ring-2 focus:ring-amber-400/40 focus:border-amber-300"
            />
          </div>

          <div className="space-y-2">
            <div className="space-y-1.5">
              <label className="text-[0.7rem] font-semibold uppercase tracking-[0.22em] text-slate-400">
                Orden (opcional)
              </label>
              <input
                type="number"
                min={1}
                value={nuevo.orden}
                onChange={(e) =>
                  setNuevo((prev) => ({ ...prev, orden: e.target.value }))
                }
                className="w-full rounded-xl border border-slate-700 bg-slate-900 px-3 py-2 text-xs md:text-sm text-slate-50 shadow-inner focus:outline-none focus:ring-2 focus:ring-amber-400/40 focus:border-amber-300"
              />
            </div>

            <button
              type="submit"
              disabled={creando}
              className="mt-1 inline-flex w-full items-center justify-center rounded-full bg-amber-400 px-4 py-2 text-xs md:text-sm font-semibold uppercase tracking-[0.22em] text-slate-950 shadow-[0_0_30px_rgba(251,191,36,0.9)] hover:bg-amber-300 active:translate-y-px disabled:opacity-60 disabled:cursor-not-allowed transition"
            >
              {creando ? "Creando..." : "Crear módulo"}
            </button>
          </div>
        </form>
      </section>

      {/* Lista de módulos */}
      <section className="rounded-[2.5rem] border border-slate-800 bg-slate-950/95 px-5 md:px-8 py-6 md:py-7 shadow-[0_24px_90px_rgba(0,0,0,0.95)] space-y-4">
        <div className="flex items-center justify-between gap-3 flex-wrap">
          <h2 className="text-lg md:text-xl font-semibold text-slate-50 tracking-tight">
            Módulos del curso
          </h2>
          {listaOrdenada.length > 0 && (
            <p className="text-[0.7rem] md:text-xs uppercase tracking-[0.22em] text-slate-400">
              {listaOrdenada.length} módulo
              {listaOrdenada.length > 1 ? "s" : ""} en total
            </p>
          )}
        </div>

        {loadingModulos ? (
          <p className="text-xs md:text-sm text-slate-300">
            Cargando módulos...
          </p>
        ) : errorModulos ? (
          <p className="text-xs md:text-sm text-rose-400">{errorModulos}</p>
        ) : listaOrdenada.length === 0 ? (
          <p className="text-xs md:text-sm text-slate-400">
            Aún no has creado módulos para este curso.
          </p>
        ) : (
          <div className="space-y-3 md:space-y-4">
            {listaOrdenada.map((mod, index) => {
              const esEditando = editandoId === mod.id;
              const esPrimero = index === 0;
              const esUltimo = index === listaOrdenada.length - 1;

              return (
                <div
                  key={mod.id}
                  className="group relative rounded-2xl border border-slate-800/80 bg-slate-900/80 px-4 py-3 md:px-5 md:py-4 shadow-[0_18px_50px_rgba(15,23,42,0.9)]"
                >
                  {/* Orden y estado */}
                  <div className="flex items-start justify-between gap-3 flex-wrap">
                    <div className="flex items-center gap-3">
                      <div className="h-7 w-7 rounded-full border border-amber-300/80 bg-slate-950 flex items-center justify-center text-[0.7rem] font-semibold text-amber-200 shadow-[0_0_18px_rgba(252,211,77,0.7)]">
                        {mod.orden || index + 1}
                      </div>
                      <div className="space-y-1">
                        <h3 className="text-sm md:text-base font-semibold text-slate-50">
                          {mod.titulo || `Módulo ${mod.orden || index + 1}`}
                        </h3>
                        {mod.descripcion && !esEditando && (
                          <p className="text-[0.75rem] md:text-xs text-slate-300/90 line-clamp-2">
                            {mod.descripcion}
                          </p>
                        )}
                      </div>
                    </div>

                    <div className="flex flex-col items-end gap-2">
                      <span
                        className={`inline-flex items-center rounded-full px-2.5 py-1 text-[0.65rem] font-semibold uppercase tracking-[0.22em] ${estadoChip(
                          mod.estado
                        )}`}
                      >
                        {mod.estado || "BORRADOR"}
                      </span>
                      <div className="flex flex-wrap justify-end gap-1.5">
                        {/* Botón para ir a Lecciones del módulo */}
                        <button
                          type="button"
                          onClick={() =>
                            navigate(`/instructor/modulos/${mod.id}/lecciones`)
                          }
                          className="rounded-full border border-sky-400/80 px-3 py-1 text-[0.65rem] font-semibold uppercase tracking-[0.18em] text-sky-100 hover:bg-sky-400 hover:text-slate-950 transition-colors"
                        >
                          Lecciones
                        </button>

                        <button
                          type="button"
                          disabled={esPrimero}
                          onClick={() => handleMover(mod, -1)}
                          className="rounded-full border border-slate-600/80 px-2 py-1 text-[0.65rem] font-semibold uppercase tracking-[0.18em] text-slate-200 hover:border-amber-300 hover:text-amber-200 disabled:opacity-40 disabled:cursor-not-allowed"
                        >
                          ↑
                        </button>
                        <button
                          type="button"
                          disabled={esUltimo}
                          onClick={() => handleMover(mod, +1)}
                          className="rounded-full border border-slate-600/80 px-2 py-1 text-[0.65rem] font-semibold uppercase tracking-[0.18em] text-slate-200 hover:border-amber-300 hover:text-amber-200 disabled:opacity-40 disabled:cursor-not-allowed"
                        >
                          ↓
                        </button>
                        <button
                          type="button"
                          onClick={() => handleToggleEstado(mod)}
                          className="rounded-full border border-slate-600/80 px-3 py-1 text-[0.65rem] font-semibold uppercase tracking-[0.18em] text-slate-200 hover:border-emerald-400 hover:text-emerald-200"
                        >
                          {(mod.estado || "").toUpperCase() === "PUBLICADO"
                            ? "Archivar"
                            : "Publicar"}
                        </button>
                        <button
                          type="button"
                          onClick={() =>
                            esEditando ? cancelarEdicion() : startEditar(mod)
                          }
                          className="rounded-full border border-slate-600/80 px-3 py-1 text-[0.65rem] font-semibold uppercase tracking-[0.18em] text-slate-200 hover:border-amber-300 hover:text-amber-200"
                        >
                          {esEditando ? "Cancelar" : "Editar"}
                        </button>
                        <button
                          type="button"
                          onClick={() => handleEliminar(mod)}
                          className="rounded-full border border-rose-500/70 px-3 py-1 text-[0.65rem] font-semibold uppercase tracking-[0.18em] text-rose-200 hover:bg-rose-500/10"
                        >
                          Eliminar
                        </button>
                      </div>
                    </div>
                  </div>

                  {/* Zona de edición inline */}
                  {esEditando && (
                    <div className="mt-4 grid gap-3 md:grid-cols-[minmax(0,2fr)_minmax(0,3fr)_minmax(0,1.2fr)] items-start">
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
                          className="w-full rounded-xl border border-slate-700 bg-slate-950 px-3 py-2 text-xs md:text-sm text-slate-50 shadow-inner focus:outline-none focus:ring-2 focus:ring-amber-400/40 focus:border-amber-300"
                        />
                      </div>

                      <div className="space-y-1.5">
                        <label className="text-[0.7rem] font-semibold uppercase tracking-[0.22em] text-slate-400">
                          Descripción
                        </label>
                        <textarea
                          rows={2}
                          value={formEdicion.descripcion}
                          onChange={(e) =>
                            setFormEdicion((prev) => ({
                              ...prev,
                              descripcion: e.target.value,
                            }))
                          }
                          className="w-full rounded-xl border border-slate-700 bg-slate-950 px-3 py-2 text-xs md:text-sm text-slate-50 shadow-inner focus:outline-none focus:ring-2 focus:ring-amber-400/40 focus:border-amber-300"
                        />
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
                            className="w-full rounded-xl border border-slate-700 bg-slate-950 px-3 py-2 text-xs md:text-sm text-slate-50 shadow-inner focus:outline-none focus:ring-2 focus:ring-amber-400/40 focus:border-amber-300"
                          />
                        </div>
                        <button
                          type="button"
                          disabled={guardandoEdicion}
                          onClick={() => handleGuardarEdicion(mod.id)}
                          className="mt-1 inline-flex w-full items-center justify-center rounded-full bg-slate-50 px-4 py-2 text-xs md:text-sm font-semibold uppercase tracking-[0.22em] text-slate-950 shadow-[0_0_25px_rgba(248,250,252,0.9)] hover:bg-amber-200 hover:text-slate-950 active:translate-y-px disabled:opacity-60 disabled:cursor-not-allowed transition"
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
      </section>
    </div>
  );
};

export default CursoModulosGestion;

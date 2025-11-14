// src/pages/MisCursos.jsx
import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { listarMisInscripciones } from "../services/inscripcionService";
import { obtenerCurso } from "../services/cursoService";

const MisCursos = () => {
  const navigate = useNavigate();

  const [filtro, setFiltro] = useState("todos");
  const [items, setItems] = useState([]); // [{ inscripcion, curso, cursoId }]
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  // ---------- helpers ----------
  const mapFiltroAEstado = (f) => {
    switch (f) {
      case "en_progreso":
        return "activa";
      case "completados":
        return "completada";
      case "cancelados":
        return "cancelada";
      default:
        return undefined; // todos
    }
  };

  const formatEstadoChip = (estadoRaw) => {
    if (!estadoRaw) return "SIN ESTADO";
    const e = estadoRaw.toLowerCase();
    if (e === "activa") return "EN PROGRESO";
    if (e === "completada") return "COMPLETADO";
    if (e === "cancelada") return "CANCELADO";
    if (e === "pendiente_pago") return "PENDIENTE_PAGO";
    if (e === "suspendida") return "SUSPENDIDO";
    if (e === "expirada") return "EXPIRADA";
    return estadoRaw.toUpperCase();
  };

  const getChipColors = (estadoRaw) => {
    const e = (estadoRaw || "").toLowerCase();
    if (e === "activa") return "bg-emerald-500 text-emerald-950";
    if (e === "completada") return "bg-sky-400 text-sky-950";
    if (e === "cancelada" || e === "expirada")
      return "bg-rose-500 text-rose-50";
    if (e === "pendiente_pago") return "bg-amber-400 text-amber-950";
    if (e === "suspendida") return "bg-fuchsia-400 text-fuchsia-950";
    return "bg-slate-500 text-slate-50";
  };

  const formatFecha = (raw) => {
    if (!raw) return "Fecha no disponible";
    const d = new Date(raw);
    if (Number.isNaN(d.getTime())) return "Fecha no disponible";
    return d.toLocaleDateString("es-EC", {
      day: "2-digit",
      month: "2-digit",
      year: "numeric",
    });
  };

  // pequeño helper para obtener el id del curso desde la inscripción
  const getCursoIdFromInscripcion = (ins) =>
    ins.idCurso || ins.cursoId || ins.curso?.id || null;

  // ---------- carga de datos ----------
  useEffect(() => {
    const fetchMisCursos = async () => {
      setLoading(true);
      setError("");

      try {
        const estado = mapFiltroAEstado(filtro);
        const inscripciones = await listarMisInscripciones(estado);

        if (!inscripciones || inscripciones.length === 0) {
          setItems([]);
          return;
        }

        // ids de curso únicos
        const cursoIds = [
          ...new Set(
            inscripciones
              .map((i) => getCursoIdFromInscripcion(i))
              .filter((id) => Boolean(id))
          ),
        ];

        const cursosMap = {};
        await Promise.all(
          cursoIds.map(async (idCurso) => {
            try {
              const curso = await obtenerCurso(idCurso);
              cursosMap[idCurso] = curso;
            } catch (err) {
              console.error("Error cargando curso", idCurso, err);
            }
          })
        );

        const combinado = inscripciones.map((ins) => {
          const cursoId = getCursoIdFromInscripcion(ins);
          return {
            inscripcion: ins,
            cursoId,
            curso: cursoId ? cursosMap[cursoId] || null : null,
          };
        });

        setItems(combinado);
      } catch (err) {
        console.error("Error al cargar mis cursos:", err);
        setError("No se pudieron cargar tus cursos.");
      } finally {
        setLoading(false);
      }
    };

    fetchMisCursos();
  }, [filtro]);

  // ---------- UI filtros ----------
  const pillBase =
    "rounded-full border px-4 py-1.5 text-[0.7rem] md:text-xs font-semibold uppercase tracking-[0.22em] transition-colors";
  const pillActive = "bg-amber-400 text-slate-950 border-amber-300";
  const pillInactive =
    "border-slate-600/80 text-slate-200 hover:border-amber-300/80 hover:text-amber-200";

  // ---------- render ----------
  return (
    <div className="max-w-6xl mx-auto px-4 md:px-6 py-8 md:py-10 space-y-7">
      {/* Header */}
      <section className="rounded-3xl bg-gradient-to-r from-slate-950 via-slate-900 to-slate-950 px-5 md:px-8 py-6 md:py-7 border border-slate-800/80 shadow-[0_22px_80px_rgba(15,23,42,0.95)]">
        <h1 className="text-2xl md:text-3xl font-semibold text-amber-300 tracking-tight">
          Mis cursos
        </h1>
        <p className="mt-2 text-xs md:text-sm text-slate-300/90 max-w-2xl">
          Aquí encuentras los cursos en los que estás inscrito, filtrados por
          estado. Retoma tus clases o revisa lo que ya completaste.
        </p>

        <div className="mt-4 flex flex-wrap gap-2 md:gap-3">
          <button
            type="button"
            className={`${pillBase} ${
              filtro === "todos" ? pillActive : pillInactive
            }`}
            onClick={() => setFiltro("todos")}
          >
            TODOS
          </button>
          <button
            type="button"
            className={`${pillBase} ${
              filtro === "en_progreso" ? pillActive : pillInactive
            }`}
            onClick={() => setFiltro("en_progreso")}
          >
            EN PROGRESO
          </button>
          <button
            type="button"
            className={`${pillBase} ${
              filtro === "completados" ? pillActive : pillInactive
            }`}
            onClick={() => setFiltro("completados")}
          >
            COMPLETADOS
          </button>
          <button
            type="button"
            className={`${pillBase} ${
              filtro === "cancelados" ? pillActive : pillInactive
            }`}
            onClick={() => setFiltro("cancelados")}
          >
            CANCELADOS
          </button>
        </div>
      </section>

      {/* Contenido */}
      <section className="rounded-[2.2rem] border border-slate-800/80 bg-slate-950/80 px-4 md:px-6 py-6 md:py-7 shadow-[0_22px_80px_rgba(15,23,42,0.95)]">
        {loading ? (
          <div className="h-40 flex items-center justify-center text-sm md:text-base text-slate-300">
            Cargando tus cursos...
          </div>
        ) : error ? (
          <div className="h-40 flex items-center justify-center text-sm md:text-base text-rose-400">
            {error}
          </div>
        ) : items.length === 0 ? (
          <div className="flex flex-col items-center justify-center gap-4 py-12 text-center">
            <p className="text-sm md:text-base text-slate-300/90">
              Aún no estás inscrito en ningún curso con este filtro.
            </p>
            <button
              type="button"
              onClick={() => navigate("/cursos")}
              className="inline-flex items-center justify-center rounded-full bg-slate-900 px-5 py-2.5 text-xs md:text-sm font-semibold text-amber-300 border border-slate-600/80 hover:bg-slate-800 active:translate-y-px transition"
            >
              Explorar cursos disponibles
            </button>
          </div>
        ) : (
          <div className="grid gap-5 md:gap-6 lg:grid-cols-2">
            {items.map(({ inscripcion, curso, cursoId }) => {
              const estado = inscripcion.estado;
              const chipColors = getChipColors(estado);
              const fechaBase =
                inscripcion.accessStartAt ||
                inscripcion.createdAt ||
                inscripcion.updatedAt;
              const esPendientePago =
                (inscripcion.estado || "").toLowerCase() === "pendiente_pago";

              return (
                <article
                  key={inscripcion.id}
                  className="group relative overflow-hidden rounded-[2rem] border border-slate-800 bg-gradient-to-b from-slate-900/90 via-slate-950 to-slate-950/95 shadow-[0_20px_70px_rgba(0,0,0,0.9)]"
                >
                  {/* halo */}
                  <div className="pointer-events-none absolute inset-0 bg-gradient-to-b from-slate-50/0 via-amber-500/2 to-slate-900/40 opacity-80" />

                  <div className="relative flex flex-col h-full">
                    {/* Imagen / portada */}
                    <div className="relative h-40 md:h-44 overflow-hidden rounded-[2rem_2rem_0_0] bg-gradient-to-b from-slate-200 via-slate-400 to-slate-700">
                      {curso?.imagenPortadaUrl && (
                        <img
                          src={curso.imagenPortadaUrl}
                          alt={curso.titulo}
                          onError={(e) => (e.target.style.display = "none")}
                          className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-[1.03]"
                        />
                      )}

                      {/* Chip de estado */}
                      <div className="absolute left-4 top-4">
                        <span
                          className={`inline-flex items-center rounded-full px-3 py-1 text-[0.7rem] font-semibold uppercase tracking-[0.22em] ${chipColors} shadow-[0_0_25px_rgba(15,23,42,0.9)]`}
                        >
                          {formatEstadoChip(estado)}
                        </span>
                      </div>
                    </div>

                    {/* Info */}
                    <div className="flex-1 px-4 md:px-5 py-4 md:py-5 flex flex-col gap-3">
                      <div>
                        <h2 className="text-base md:text-lg font-semibold text-slate-50 tracking-tight line-clamp-2">
                          {curso?.titulo || "Curso sin título"}
                        </h2>
                        <p className="mt-1 text-xs md:text-sm text-slate-400">
                          {curso?.categoria || "Sin categoría"} ·{" "}
                          {curso?.nivel || "Nivel no especificado"}
                        </p>
                      </div>

                      <p className="text-[0.75rem] md:text-xs text-slate-400">
                        Inscrito el {formatFecha(fechaBase)}
                      </p>

                      <div className="mt-2 flex items-center justify-between gap-3">
                        <div className="text-xs md:text-sm text-amber-300 font-semibold">
                          {curso?.precio != null ? `${curso.precio} USD` : ""}
                        </div>

                        <div className="flex gap-2">
                          {esPendientePago && (
                            <button
                              type="button"
                              onClick={() =>
                                navigate(
                                  `/inscripciones/${inscripcion.id}/pago`,
                                  {
                                    state: { idCurso: cursoId },
                                  }
                                )
                              }
                              className="inline-flex items-center justify-center rounded-full bg-emerald-500/10 px-4 py-2 text-xs md:text-sm font-semibold text-emerald-200 border border-emerald-400/80 hover:bg-emerald-500/20 active:translate-y-px transition"
                            >
                              Pagar curso
                            </button>
                          )}

                          <button
                            type="button"
                            disabled={!cursoId}
                            onClick={() =>
                              cursoId && navigate(`/cursos/${cursoId}`)
                            }
                            className="inline-flex items-center justify-center rounded-full bg-slate-900 px-4 py-2 text-xs md:text-sm font-semibold text-amber-200 border border-slate-600/80 hover:bg-slate-800 active:translate-y-px disabled:opacity-60 disabled:cursor-not-allowed transition"
                          >
                            Ir al curso
                          </button>
                        </div>
                      </div>
                    </div>
                  </div>
                </article>
              );
            })}
          </div>
        )}
      </section>
    </div>
  );
};

export default MisCursos;

// src/pages/ModuloContenidoAlumno.jsx
import React, { useEffect, useMemo, useState } from "react";
import { useNavigate, useParams, useLocation } from "react-router-dom";
import { obtenerCurso } from "../services/cursoService";
import { listarModulos } from "../services/moduloService";
import { listarLecciones } from "../services/leccionService";
import { listarEvaluacionesPorLeccion } from "../services/evaluacionService";
import { obtenerMiInscripcionEnCurso } from "../services/inscripcionService";
import { obtenerMiProgreso } from "../services/progresoService";
import { solicitarMiCertificado } from "../services/certificadoService";

const ModuloContenidoAlumno = () => {
  const { idCurso, idModulo } = useParams();
  const navigate = useNavigate();
  const location = useLocation();

  const [curso, setCurso] = useState(null);
  const [modulo, setModulo] = useState(null);
  const [lecciones, setLecciones] = useState([]);
  const [evalPorLeccion, setEvalPorLeccion] = useState({});
  const [inscripcion, setInscripcion] = useState(null);

  const [leccionActivaId, setLeccionActivaId] = useState(null);

  const [progreso, setProgreso] = useState(null);
  const [certLoading, setCertLoading] = useState(false);

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  // -------- helpers de lecciones / contenido --------
  const getTipoLeccion = (lec) =>
    (lec?.tipo || lec?.tipoContenido || "").toUpperCase();

  const getUrlLeccion = (lec) =>
    lec?.urlContenido ||
    lec?.contenidoUrl ||
    lec?.url ||
    lec?.recursoUrl ||
    "";

  const normalizarYoutube = (url) => {
    if (!url) return "";
    try {
      const u = new URL(url);
      if (u.hostname.includes("youtube.com") || u.hostname.includes("youtu.be")) {
        if (u.hostname === "youtu.be") {
          return `https://www.youtube.com/embed${u.pathname}`;
        }
        const v = u.searchParams.get("v");
        if (v) return `https://www.youtube.com/embed/${v}`;
      }
      return url;
    } catch {
      return url;
    }
  };

  // -------- carga datos --------
  useEffect(() => {
    const load = async () => {
      setLoading(true);
      setError("");

      try {
        const [cursoData, insc, modulos] = await Promise.all([
          obtenerCurso(idCurso),
          obtenerMiInscripcionEnCurso(idCurso).catch(() => null),
          listarModulos(idCurso),
        ]);

        setCurso(cursoData);
        setInscripcion(insc || null);

        const mod = (modulos || []).find((m) => m.id === idModulo) || null;
        setModulo(mod);

        if (!mod) {
          setError("No se encontró el módulo solicitado.");
          setLecciones([]);
          return;
        }

        const lecs = await listarLecciones(idModulo);
        setLecciones(lecs || []);

        if (lecs && lecs.length > 0) {
          setLeccionActivaId(lecs[0].id);
        }

        const mapa = {};
        await Promise.all(
          (lecs || []).map(async (lec) => {
            try {
              const evals = await listarEvaluacionesPorLeccion(lec.id);
              if (Array.isArray(evals) && evals.length > 0) {
                mapa[lec.id] = evals;
              }
            } catch (e) {
              console.error(
                "Error cargando evaluaciones de la lección",
                lec.id,
                e
              );
            }
          })
        );
        setEvalPorLeccion(mapa);

        // Progreso del curso (ahora obtenerMiProgreso YA devuelve resp.data)
        try {
          const progDto = await obtenerMiProgreso(idCurso);
          setProgreso(progDto);
        } catch (e) {
          console.warn("No se pudo cargar el progreso del curso:", e);
          setProgreso(null);
        }
      } catch (err) {
        console.error("Error cargando contenido del módulo:", err);
        setError("No se pudo cargar el contenido del módulo.");
      } finally {
        setLoading(false);
      }
    };

    load();
  }, [idCurso, idModulo, location.key]);

  // Debug
  console.log("DEBUG progreso curso DTO:", progreso);
  console.log("DEBUG inscripcion curso:", inscripcion);

  const estadoIns = (inscripcion?.estado || "").toLowerCase();
  const tieneAcceso = estadoIns === "activa" || estadoIns === "completada";

  const leccionesOrdenadas = lecciones
    .slice()
    .sort((a, b) => (a.orden || 0) - (b.orden || 0));

  // progreso del módulo actual y map rápido de lecciones -> info
  const progresoModuloActual = useMemo(() => {
    if (!progreso?.modulos || !Array.isArray(progreso.modulos)) return null;

    // Intentamos varias claves posibles
    return (
      progreso.modulos.find((m) => m.idModulo === idModulo) ||
      progreso.modulos.find((m) => m.moduloId === idModulo) ||
      null
    );
  }, [progreso, idModulo]);

  const mapLeccionProgreso = useMemo(() => {
    const map = {};
    if (progresoModuloActual?.lecciones) {
      progresoModuloActual.lecciones.forEach((lp) => {
        map[lp.idLeccion] = lp;
      });
    }
    return map;
  }, [progresoModuloActual]);

  // -------- estados de carga / error / acceso --------
  if (loading) {
    return (
      <div className="max-w-5xl mx-auto px-4 md:px-6 py-10 text-center text-sm md:text-base text-slate-300">
        Cargando contenido del módulo...
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

  if (!tieneAcceso) {
    return (
      <div className="max-w-5xl mx-auto px-4 md:px-6 py-10 text-center text-sm md:text-base text-slate-300">
        Tu inscripción aún no está activa para este curso. Completa el pago o
        espera la aprobación del instructor.
      </div>
    );
  }

  // Nota final del curso (buscamos en varios campos posibles)
  const notaFinalCurso =
    progreso?.notaFinal ??
    progreso?.notaFinalCurso ??
    inscripcion?.notaFinal ??
    inscripcion?.notaFinalCurso ??
    null;

  const cursoAprobado =
    progreso?.aprobadoFinal === true ||
    progreso?.aprobado === true ||
    inscripcion?.aprobadoFinal === true ||
    inscripcion?.aprobado === true;

  const notaModuloActual = progresoModuloActual?.nota;
  const moduloAprobado = progresoModuloActual?.aprobado === true;

  const notaMinModulo = modulo?.notaMinimaAprobacion ?? null;

  // 👇 módulo reprobado según nota mínima configurada
  const moduloReprobadoPorNota =
    notaMinModulo != null &&
    typeof notaModuloActual === "number" &&
    !Number.isNaN(notaModuloActual) &&
    !moduloAprobado &&
    notaModuloActual < Number(notaMinModulo);

  // -------- lógica certificado --------
  const estadoInsUpper = (inscripcion?.estado || "").toUpperCase();
  const puedeSolicitarCertificado =
    cursoAprobado ||
    progreso?.aprobadoFinal === true ||
    inscripcion?.aprobadoFinal === true ||
    estadoInsUpper === "COMPLETADA";

  const handleSolicitarCertificado = async () => {
    if (!idCurso) return;
    try {
      setCertLoading(true);
      const cert = await solicitarMiCertificado(idCurso);
      alert(
        `Certificado emitido correctamente.\nCódigo de verificación: ${
          cert?.codigoVerificacion || "—"
        }`
      );
    } catch (err) {
      console.error("Error al solicitar certificado:", err);
      const msg =
        err?.response?.data?.message ||
        err?.response?.data ||
        err?.message ||
        "No se pudo emitir el certificado.";
      alert(msg);
    } finally {
      setCertLoading(false);
    }
  };

  const handleSolicitarNuevoIntento = () => {
    // Aquí luego puedes llamar a un endpoint real.
    alert(
      "Solicitud de nuevo intento registrada (pendiente de implementar en el backend)."
    );
  };

  // -------- render principal --------
  return (
    <div className="max-w-5xl mx-auto px-4 md:px-6 py-8 md:py-10 space-y-6">
      {/* volver */}
      <button
        type="button"
        onClick={() => navigate(`/cursos/${idCurso}`)}
        className="inline-flex items-center gap-2 rounded-full border border-slate-700/70 bg-slate-950/80 px-4 py-1.5 text-[0.7rem] md:text-xs font-semibold uppercase tracking-[0.22em] text-slate-200 hover:border-amber-400/80 hover:text-amber-200 hover:bg-slate-900 transition-colors"
      >
        <span className="text-sm">←</span> Volver al curso
      </button>

      {/* header módulo */}
      <section className="rounded-[2.5rem] border border-slate-800 bg-gradient-to-r from-slate-950 via-slate-900 to-slate-950 px-5 md:px-8 py-6 md:py-7 shadow-[0_24px_90px_rgba(0,0,0,0.95)] space-y-3">
        <p className="text-[0.7rem] font-semibold uppercase tracking-[0.22em] text-slate-400">
          Curso {curso?.titulo ? `· ${curso.titulo}` : ""}
        </p>
        <h1 className="text-xl md:text-2xl font-semibold tracking-tight text-slate-50">
          Contenido de {modulo?.titulo || "este módulo"}
        </h1>
        {modulo?.descripcion && (
          <p className="text-xs md:text-sm text-slate-300/90 max-w-2xl">
            {modulo.descripcion}
          </p>
        )}

        {/* resumen de progreso del curso y del módulo actual */}
        <div className="mt-2 flex flex-col md:flex-row gap-2 text-[0.7rem] md:text-xs text-slate-300">
          <div className="flex items-center gap-2">
            <span className="inline-flex h-2 w-2 rounded-full bg-emerald-400/80" />
            <span>
              Nota final del curso:{" "}
              {notaFinalCurso !== null && notaFinalCurso !== undefined
                ? typeof notaFinalCurso === "number"
                  ? `${notaFinalCurso.toFixed(1)}%`
                  : notaFinalCurso
                : "—"}
              {cursoAprobado && (
                <span className="ml-2 rounded-full border border-emerald-500/70 bg-emerald-500/10 px-2 py-[2px] text-[0.65rem] font-semibold text-emerald-200 uppercase tracking-wide">
                  Aprobado
                </span>
              )}
            </span>
          </div>

          {progresoModuloActual && (
            <div className="flex items-center gap-2">
              <span className="inline-flex h-2 w-2 rounded-full bg-sky-400/80" />
              <span>
                Módulo:{" "}
                {typeof notaModuloActual === "number"
                  ? `${notaModuloActual.toFixed(1)}%`
                  : "—"}
                {moduloAprobado && (
                  <span className="ml-2 rounded-full border border-sky-500/70 bg-sky-500/10 px-2 py-[2px] text-[0.65rem] font-semibold text-sky-200 uppercase tracking-wide">
                    Aprobado
                  </span>
                )}
              </span>
            </div>
          )}
        </div>

        {/* nota mínima del módulo */}
        {notaMinModulo != null && (
          <p className="mt-1 text-[0.7rem] md:text-xs text-slate-300/90">
            Nota mínima de aprobación de este módulo:{" "}
            <span className="font-semibold text-amber-300">
              {Number(notaMinModulo).toFixed(0)}%
            </span>
          </p>
        )}

        {/* botón certificado (curso aprobado) */}
        {puedeSolicitarCertificado && (
          <div className="mt-3 flex flex-col md:flex-row items-start md:items-center gap-2">
            <button
              type="button"
              onClick={handleSolicitarCertificado}
              disabled={certLoading}
              className="inline-flex items-center justify-center rounded-full border border-amber-400/90 bg-amber-400 px-4 py-2 text-[0.7rem] md:text-xs font-semibold uppercase tracking-[0.22em] text-slate-950 shadow-[0_0_30px_rgba(251,191,36,0.9)] hover:bg-amber-300 active:translate-y-px disabled:opacity-60 disabled:cursor-not-allowed"
            >
              {certLoading
                ? "Generando certificado..."
                : "🎓 Solicitar certificado"}
            </button>
            <p className="text-[0.7rem] md:text-xs text-slate-400 max-w-sm">
              Podrás descargar o consultar tu certificado digital una vez
              emitido. Si ya tienes uno, el sistema te avisará.
            </p>
          </div>
        )}

        {/* botón para solicitar nuevo intento si el módulo está reprobado */}
        {moduloReprobadoPorNota && (
          <div className="mt-4 flex flex-col md:flex-row items-start md:items-center gap-2 border-t border-slate-800 pt-3">
            <p className="text-[0.7rem] md:text-xs text-rose-300/90 max-w-sm">
              Has reprobado este módulo (tu nota está por debajo de la mínima
              requerida). Puedes solicitar un nuevo intento al instructor.
            </p>
            <button
              type="button"
              onClick={handleSolicitarNuevoIntento}
              className="inline-flex items-center justify-center rounded-full border border-rose-400/90 bg-rose-500 px-4 py-2 text-[0.7rem] md:text-xs font-semibold uppercase tracking-[0.22em] text-slate-950 shadow-[0_0_30px_rgba(248,113,113,0.9)] hover:bg-rose-400 active:translate-y-px"
            >
              🔁 Solicitar nuevo intento
            </button>
          </div>
        )}
      </section>

      {/* listado de lecciones */}
      <section className="rounded-[2.5rem] border border-slate-800 bg-slate-950/95 px-5 md:px-8 py-6 md:py-7 shadow-[0_24px_90px_rgba(0,0,0,0.95)] space-y-4">
        {leccionesOrdenadas.length === 0 ? (
          <p className="text-xs md:text-sm text-slate-400">
            Aún no hay lecciones publicadas en este módulo.
          </p>
        ) : (
          <ul className="space-y-3">
            {leccionesOrdenadas.map((lec, index) => {
              const evaluaciones = evalPorLeccion[lec.id] || [];
              const tipoLower = (lec.tipo || "").toLowerCase();
              const tipoLabel =
                tipoLower === "video"
                  ? "Video"
                  : tipoLower === "articulo"
                  ? "Artículo"
                  : tipoLower === "quiz"
                  ? "Quiz"
                  : "Lección";

              const esActiva = leccionActivaId === lec.id;
              const duracionMin = lec.duracion ?? lec.duracionMinutos;

              const infoProg = mapLeccionProgreso[lec.id];
              const notaLeccion = infoProg?.nota;
              const leccionAprobada = infoProg?.aprobada === true;

              return (
                <li key={lec.id}>
                  <div
                    className={
                      "flex flex-col md:flex-row md:items-center md:justify-between gap-3 rounded-2xl border px-4 py-3 md:px-5 md:py-4 transition-colors cursor-pointer " +
                      (esActiva
                        ? "border-amber-300/80 bg-slate-900/90"
                        : "border-slate-800/80 bg-slate-900/70 hover:border-amber-300/80 hover:bg-slate-900/90")
                    }
                    onClick={() => setLeccionActivaId(lec.id)}
                  >
                    <div className="flex items-start gap-3">
                      <div className="mt-1 h-7 w-7 rounded-full border border-amber-300/70 bg-slate-950 flex items-center justify-center text-[0.7rem] font-semibold text-amber-200 shadow-[0_0_18px_rgba(252,211,77,0.7)]">
                        {lec.orden || index + 1}
                      </div>
                      <div>
                        <p className="text-sm md:text-base font-semibold text-slate-50">
                          {lec.titulo || `Lección ${lec.orden || index + 1}`}
                        </p>
                        <p className="text-[0.7rem] md:text-xs text-slate-400 mt-0.5">
                          {tipoLabel}
                          {duracionMin ? ` · ${duracionMin} min` : ""}
                        </p>

                        {(typeof notaLeccion === "number" ||
                          notaLeccion !== undefined) && (
                          <p className="mt-1 text-[0.7rem] md:text-xs text-slate-300">
                            Nota lección:{" "}
                            {typeof notaLeccion === "number"
                              ? `${notaLeccion.toFixed(1)}%`
                              : "—"}
                            {leccionAprobada && (
                              <span className="ml-2 rounded-full border border-emerald-400/70 bg-emerald-500/10 px-2 py-[2px] text-[0.65rem] font-semibold text-emerald-200 uppercase tracking-wide">
                                Aprobada
                              </span>
                            )}
                          </p>
                        )}
                      </div>
                    </div>

                    <div className="flex flex-col md:flex-row gap-2 md:justify-end">
                      {evaluaciones.length > 0 &&
                        evaluaciones.map((ev) => (
                          <button
                            key={ev.id}
                            type="button"
                            onClick={(e) => {
                              e.stopPropagation();
                              navigate(
                                `/lecciones/${lec.id}/evaluaciones/${ev.id}/tomar`
                              );
                            }}
                            className="inline-flex items-center justify-center rounded-full bg-emerald-500/10 px-4 py-2 text-[0.7rem] md:text-xs font-semibold uppercase tracking-[0.18em] text-emerald-200 border border-emerald-400/80 hover:bg-emerald-500/20 active:translate-y-px transition"
                          >
                            {evaluaciones.length > 1
                              ? `Tomar: ${ev.titulo}`
                              : "Tomar evaluación"}
                          </button>
                        ))}
                    </div>
                  </div>
                </li>
              );
            })}
          </ul>
        )}

        {/* PANEL DE CONTENIDO DE LA LECCIÓN */}
        {leccionesOrdenadas.length > 0 && (
          <div className="mt-6 rounded-3xl border border-slate-800 bg-slate-950/90 px-4 md:px-6 py-5 md:py-6 shadow-[0_18px_60px_rgba(0,0,0,0.85)]">
            {(() => {
              const activa =
                leccionesOrdenadas.find((l) => l.id === leccionActivaId) ||
                leccionesOrdenadas[0];

              if (!activa) {
                return (
                  <p className="text-xs md:text-sm text-slate-400">
                    No hay lecciones disponibles en este módulo.
                  </p>
                );
              }

              const tipo = getTipoLeccion(activa);
              const url = getUrlLeccion(activa);
              const embedUrl = normalizarYoutube(url);

              return (
                <div className="space-y-4">
                  <div>
                    <p className="text-[0.7rem] font-semibold uppercase tracking-[0.22em] text-slate-400 mb-1.5">
                      Lección seleccionada
                    </p>
                    <h3 className="text-lg md:text-xl font-semibold text-slate-50">
                      {activa.titulo}
                    </h3>
                    {activa.descripcion && (
                      <p className="mt-1 text-xs md:text-sm text-slate-300/90">
                        {activa.descripcion}
                      </p>
                    )}
                  </div>

                  {tipo === "VIDEO" && url ? (
                    <div className="aspect-video w-full rounded-2xl overflow-hidden border border-slate-700/70 bg-black">
                      <iframe
                        src={embedUrl}
                        title={activa.titulo}
                        className="h-full w-full"
                        allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
                        allowFullScreen
                      />
                    </div>
                  ) : url ? (
                    <div className="rounded-2xl border border-slate-700/70 bg-slate-900/80 px-4 py-3 text-xs md:text-sm text-slate-200">
                      <p className="mb-2 text-slate-300">
                        Recurso de la lección ({tipo || "RECURSO"}):
                      </p>
                      <a
                        href={url}
                        target="_blank"
                        rel="noreferrer"
                        className="break-all text-amber-300 hover:text-amber-200 underline"
                      >
                        {url}
                      </a>
                    </div>
                  ) : (
                    <p className="text-xs md:text-sm text-slate-400">
                      Esta lección aún no tiene un recurso asociado.
                    </p>
                  )}
                </div>
              );
            })()}
          </div>
        )}
      </section>
    </div>
  );
};

export default ModuloContenidoAlumno;

// src/pages/CalificacionesInstructor.jsx
import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";

import { listarCursos } from "../services/cursoService";
import { listarModulos } from "../services/moduloService";
import { listarLecciones } from "../services/leccionService";
import { listarEvaluacionesPorLeccion } from "../services/evaluacionService";
import { listarIntentosEvaluacionInstructor } from "../services/intentoService";
import { listarCalificacionesPorEvaluacion } from "../services/calificacionService";
import {
  emitirCertificado,
  emitirCertificadoManual,
} from "../services/certificadoService"; // 👈 NUEVO

const CalificacionesInstructor = () => {
  const navigate = useNavigate();

  const [rows, setRows] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filtroTexto, setFiltroTexto] = useState("");
  const [estadoFiltro, setEstadoFiltro] = useState("TODOS");

  const [certLoading, setCertLoading] = useState(null); // idIntento que está procesando

  // helper seguro: SIEMPRE atrapa error y no rompe el panel
  const safe = async (fn, label) => {
    try {
      return await fn();
    } catch (err) {
      console.error(
        `Error ${label}:`,
        err?.response?.data || err?.message || err
      );
      return null;
    }
  };

  const cargarPanel = async () => {
    setLoading(true);
    setRows([]);

    const panel = [];

    // 1) cursos del instructor
    const respCursos = await safe(
      () => listarCursos({ mis: true }),
      "al listar cursos"
    );
    const cursos = respCursos?.content || respCursos || [];
    if (!Array.isArray(cursos) || cursos.length === 0) {
      setRows([]);
      setLoading(false);
      return;
    }

    for (const curso of cursos) {
      // 2) módulos
      const modulos =
        (await safe(
          () => listarModulos(curso.id),
          `al listar módulos del curso ${curso.id}`
        )) || [];

      for (const modulo of modulos) {
        // 3) lecciones
        const lecciones =
          (await safe(
            () => listarLecciones(modulo.id),
            `al listar lecciones del módulo ${modulo.id}`
          )) || [];

        for (const leccion of lecciones) {
          // 4) evaluaciones
          const evaluaciones =
            (await safe(
              () => listarEvaluacionesPorLeccion(leccion.id),
              `al listar evaluaciones de la lección ${leccion.id}`
            )) || [];

          for (const evalua of evaluaciones) {
            // 5) intentos de esa evaluación
            const intentosRaw =
              (await safe(
                () => listarIntentosEvaluacionInstructor(evalua.id),
                `al listar intentos de la evaluación ${evalua.id}`
              )) || [];
            const intentos = Array.isArray(intentosRaw) ? intentosRaw : [];

            // 6) calificaciones de esa evaluación
            const califsRaw =
              (await safe(
                () => listarCalificacionesPorEvaluacion(evalua.id),
                `al listar calificaciones de la evaluación ${evalua.id}`
              )) || [];
            const califs = Array.isArray(califsRaw) ? califsRaw : [];

            const mapaCalifPorIntento = new Map();
            califs.forEach((c) => {
              if (c && c.idIntento) {
                mapaCalifPorIntento.set(c.idIntento, c);
              }
            });

            // 7) combinar intento + calificación
            intentos.forEach((it) => {
              const calif = mapaCalifPorIntento.get(it.id) || null;

              panel.push({
                idIntento: it.id,
                idEvaluacion: evalua.id,

                estadoIntento: it.estado,
                puntaje: calif?.puntaje ?? it.puntaje ?? null,
                puntajeMaximo:
                  calif?.puntajeMaximo ??
                  it.puntajeMaximo ??
                  evalua.puntajeMaximo ??
                  null,
                porcentaje: calif?.porcentaje ?? null,
                estadoCalificacion: calif?.estado ?? null,
                aprobado: calif?.aprobado ?? null,

                idEstudiante: it.idEstudiante,
                nombreEstudiante:
                  it.estudianteNombre || it.nombreEstudiante || null,

                idLeccion: leccion.id,
                tituloLeccion: leccion.titulo,
                idCurso: curso.id,
                tituloCurso: curso.titulo,

                fechaIntento: it.createdAt || it.enviadoEn || null,
              });
            });
          }
        }
      }
    }

    setRows(panel);
    setLoading(false);
  };

  useEffect(() => {
    cargarPanel();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const rowsFiltradas = rows.filter((r) => {
    if (filtroTexto.trim()) {
      const q = filtroTexto.toLowerCase();
      const campos = [
        r.nombreEstudiante,
        r.idEstudiante,
        r.tituloCurso,
        r.tituloLeccion,
        r.idCurso,
        r.idLeccion,
      ]
        .filter(Boolean)
        .map(String);

      const coincide = campos.some((c) => c.toLowerCase().includes(q));
      if (!coincide) return false;
    }

    if (estadoFiltro !== "TODOS") {
      if (!r.estadoIntento || r.estadoIntento !== estadoFiltro) return false;
    }

    return true;
  });

  // -------- handlers certificados (instructor/admin) --------
  const handleEmitirCertificado = async (row, manual = false) => {
    if (!row.idCurso || !row.idEstudiante) {
      alert("No se puede emitir certificado: falta idCurso o idEstudiante.");
      return;
    }

    try {
      setCertLoading(`${row.idIntento}-${manual ? "M" : "N"}`);

      if (manual) {
        await emitirCertificadoManual(row.idCurso, row.idEstudiante);
        alert("Certificado emitido MANUALMENTE para este estudiante.");
      } else {
        await emitirCertificado(row.idCurso, row.idEstudiante);
        alert("Certificado emitido correctamente (validando elegibilidad).");
      }
    } catch (err) {
      console.error("Error al emitir certificado:", err);
      const msg =
        err?.response?.data?.message ||
        err?.response?.data ||
        err?.message ||
        "No se pudo emitir el certificado.";
      alert(msg);
    } finally {
      setCertLoading(null);
    }
  };

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

        {/* Encabezado */}
        <section className="relative overflow-hidden rounded-[2.5rem] border border-slate-800 bg-gradient-to-r from-slate-950 via-slate-900 to-slate-950 px-5 md:px-8 py-6 md:py-7 shadow-[0_24px_90px_rgba(0,0,0,0.95)]">
          <div className="pointer-events-none absolute -left-24 -top-24 h-64 w-64 rounded-full border border-slate-700/60" />
          <div className="pointer-events-none absolute -right-16 -bottom-28 h-72 w-72 rounded-[40%] border border-slate-800/70" />

          <div className="relative space-y-3">
            <span className="inline-flex items-center rounded-full bg-emerald-400/95 px-3 py-1 text-[0.7rem] font-semibold uppercase tracking-[0.22em] text-slate-950 shadow-[0_0_25px_rgba(52,211,153,0.9)]">
              Panel de calificaciones
            </span>
            <h1 className="text-2xl md:text-3xl font-semibold tracking-tight text-slate-50">
              Calificaciones de mis evaluaciones
            </h1>
            <p className="max-w-2xl text-xs md:text-sm text-slate-300/90">
              Aquí ves los intentos de tus estudiantes y puedes emitir
              certificados cuando corresponda.
            </p>
          </div>
        </section>

        {/* Filtros */}
        <section className="flex flex-col md:flex-row md:items-center md:justify-between gap-3">
          <div className="w-full md:max-w-sm">
            <label className="block text-[0.7rem] font-semibold uppercase tracking-[0.24em] text-slate-500 mb-1.5">
              Buscar
            </label>
            <div className="relative">
              <span className="pointer-events-none absolute inset-y-0 left-3 flex items-center text-slate-500 text-xs">
                🔎
              </span>
              <input
                type="text"
                value={filtroTexto}
                onChange={(e) => setFiltroTexto(e.target.value)}
                placeholder="Alumno, curso, lección o evaluación..."
                className="w-full rounded-full border border-slate-700/70 bg-slate-950/70 pl-8 pr-3 py-1.5 text-xs md:text-sm text-slate-100 placeholder:text-slate-500 focus:outline-none focus:ring-2 focus:ring-slate-50/40"
              />
            </div>
          </div>

          <div className="flex items-center gap-3">
            <div>
              <label className="block text-[0.7rem] font-semibold uppercase tracking-[0.24em] text-slate-500 mb-1.5">
                Estado intento
              </label>
              <select
                value={estadoFiltro}
                onChange={(e) => setEstadoFiltro(e.target.value)}
                className="rounded-full border border-slate-700 bg-slate-950 px-3 py-1.5 text-[0.75rem] text-slate-100 focus:outline-none focus:ring-2 focus:ring-slate-50/40"
              >
                <option value="TODOS">Todos</option>
                <option value="EN_PROGRESO">En progreso</option>
                <option value="ENVIADO">Enviado</option>
                <option value="CALIFICADO">Calificado</option>
                <option value="EXPIRADO">Expirado</option>
                <option value="ANULADO">Anulado</option>
              </select>
            </div>

            <button
              type="button"
              onClick={cargarPanel}
              className="inline-flex items-center justify-center rounded-full border border-slate-700/80 bg-slate-950/80 px-3 py-1.5 text-[0.7rem] font-semibold uppercase tracking-[0.24em] text-slate-300 hover:border-slate-300 hover:text-slate-50 transition-colors"
            >
              ↻ Actualizar
            </button>
          </div>
        </section>

        {/* Tabla */}
        <section className="mt-2">
          <div className="overflow-x-auto rounded-3xl border border-slate-800 bg-slate-950/90 shadow-[0_22px_70px_rgba(15,23,42,1)]">
            {loading ? (
              <div className="px-4 py-6 text-sm text-slate-300">
                Cargando calificaciones / intentos...
              </div>
            ) : rowsFiltradas.length === 0 ? (
              <div className="px-4 py-6 text-sm text-slate-300">
                No hay intentos ni calificaciones para tus evaluaciones (o no
                coinciden con el filtro).
              </div>
            ) : (
              <table className="min-w-full text-xs md:text-sm">
                <thead>
                  <tr className="bg-gradient-to-r from-slate-900 via-slate-950 to-slate-900 text-slate-100 border-b border-slate-800/80">
                    <th className="px-4 py-3 text-left text-[0.65rem] md:text-[0.7rem] font-semibold tracking-[0.2em] uppercase">
                      Alumno
                    </th>
                    <th className="px-4 py-3 text-left text-[0.65rem] md:text-[0.7rem] font-semibold tracking-[0.2em] uppercase">
                      Curso / Lección / Evaluación
                    </th>
                    <th className="px-4 py-3 text-left text-[0.65rem] md:text-[0.7rem] font-semibold tracking-[0.2em] uppercase">
                      Estado intento
                    </th>
                    <th className="px-4 py-3 text-left text-[0.65rem] md:text-[0.7rem] font-semibold tracking-[0.2em] uppercase">
                      Estado calificación
                    </th>
                    <th className="px-4 py-3 text-right text-[0.65rem] md:text-[0.7rem] font-semibold tracking-[0.2em] uppercase">
                      Puntaje
                    </th>
                    <th className="px-4 py-3 text-right text-[0.65rem] md:text-[0.7rem] font-semibold tracking-[0.2em] uppercase">
                      Acciones
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {rowsFiltradas.map((r) => {
                    const loadingNormal =
                      certLoading === `${r.idIntento}-N`;
                    const loadingManual =
                      certLoading === `${r.idIntento}-M`;

                    return (
                      <tr
                        key={r.idIntento}
                        className="border-t border-slate-800/70 hover:bg-slate-900/70 transition-colors"
                      >
                        {/* Alumno */}
                        <td className="px-4 py-3 align-middle">
                          <div className="flex flex-col gap-0.5">
                            <span className="text-slate-50 font-semibold line-clamp-1">
                              {r.nombreEstudiante || r.idEstudiante || "—"}
                            </span>
                            {r.idEstudiante && (
                              <span className="text-[0.7rem] text-slate-500">
                                ID alumno: {r.idEstudiante}
                              </span>
                            )}
                          </div>
                        </td>

                        {/* Curso / Lección / Evaluación */}
                        <td className="px-4 py-3 align-middle text-slate-200">
                          <div className="flex flex-col gap-0.5">
                            <span className="text-[0.75rem] text-slate-100">
                              {r.tituloCurso || "Curso sin título"}
                            </span>
                            <span className="text-[0.7rem] text-slate-400">
                              {r.tituloLeccion || "Lección"} · Intento #
                              {r.idIntento?.toString().slice(0, 6)}…
                            </span>
                          </div>
                        </td>

                        {/* Estado intento */}
                        <td className="px-4 py-3 align-middle text-slate-200">
                          {r.estadoIntento || "N/D"}
                        </td>

                        {/* Estado calificación */}
                        <td className="px-4 py-3 align-middle text-slate-200">
                          {r.estadoCalificacion || "—"}
                          {r.aprobado != null && (
                            <span className="ml-1 text-[0.7rem]">
                              {r.aprobado ? "✅" : "❌"}
                            </span>
                          )}
                        </td>

                        {/* Puntaje */}
                        <td className="px-4 py-3 align-middle text-right text-slate-100">
                          {r.puntaje != null ? (
                            <>
                              {Number(r.puntaje)}{" "}
                              {r.puntajeMaximo != null && (
                                <span className="text-[0.75rem] text-slate-400">
                                  / {Number(r.puntajeMaximo)}
                                </span>
                              )}
                            </>
                          ) : (
                            "—"
                          )}
                        </td>

                        {/* Acciones */}
                        <td className="px-4 py-3 align-middle text-right">
                          <div className="flex flex-col items-end gap-1">
                            {r.estadoIntento === "EN_PROGRESO" ? (
                              <span className="text-[0.7rem] text-slate-500">
                                Intento en progreso
                              </span>
                            ) : (
                              <button
                                type="button"
                                onClick={() =>
                                  navigate(
                                    `/instructor/evaluaciones/${r.idEvaluacion}/intentos/${r.idIntento}/calificar`
                                  )
                                }
                                className="inline-flex items-center justify-center rounded-full border border-sky-400/80 bg-slate-900 px-3 py-1.5 text-[0.65rem] md:text-xs font-semibold text-sky-200 hover:bg-sky-500/15 hover:border-sky-300 active:translate-y-px transition"
                              >
                                Ver / calificar
                              </button>
                            )}

                            {/* Botones de certificado (si hay alumno & curso) */}
                            {r.idEstudiante && r.idCurso && (
                              <div className="flex flex-wrap gap-1 justify-end">
                                <button
                                  type="button"
                                  disabled={loadingNormal}
                                  onClick={() =>
                                    handleEmitirCertificado(r, false)
                                  }
                                  className="inline-flex items-center justify-center rounded-full border border-emerald-400/80 bg-emerald-500/10 px-3 py-1.5 text-[0.65rem] md:text-xs font-semibold text-emerald-200 hover:bg-emerald-500/20 disabled:opacity-60 disabled:cursor-not-allowed"
                                >
                                  {loadingNormal
                                    ? "Emitiendo..."
                                    : "🎓 Emitir cert."}
                                </button>
                                <button
                                  type="button"
                                  disabled={loadingManual}
                                  onClick={() =>
                                    handleEmitirCertificado(r, true)
                                  }
                                  className="inline-flex items-center justify-center rounded-full border border-amber-400/80 bg-amber-500/10 px-3 py-1.5 text-[0.65rem] md:text-xs font-semibold text-amber-200 hover:bg-amber-500/20 disabled:opacity-60 disabled:cursor-not-allowed"
                                >
                                  {loadingManual
                                    ? "Manual..."
                                    : "⚠ Manual"}
                                </button>
                              </div>
                            )}
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            )}
          </div>
        </section>

        <section className="pt-1">
          <p className="text-[0.7rem] text-slate-500 max-w-md">
            Tip: usa el buscador para filtrar por nombre de alumno, curso,
            lección o evaluación. Desde aquí también puedes emitir certificados
            normales o manuales.
          </p>
        </section>
      </div>
    </main>
  );
};

export default CalificacionesInstructor;

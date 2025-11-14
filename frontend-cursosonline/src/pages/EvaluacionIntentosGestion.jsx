// src/pages/EvaluacionIntentosGestion.jsx
import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";

import { listarCursos } from "../services/cursoService";
import { listarModulos } from "../services/moduloService";
import { listarLecciones } from "../services/leccionService";
import { listarEvaluacionesPorLeccion } from "../services/evaluacionService";
import { listarIntentosEvaluacionInstructor } from "../services/intentoService";

const EvaluacionIntentosGestion = () => {
  const navigate = useNavigate();

  const [rows, setRows] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filtroTexto, setFiltroTexto] = useState("");
  const [estadoFiltro, setEstadoFiltro] = useState("TODOS");

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
      const modulos =
        (await safe(
          () => listarModulos(curso.id),
          `al listar módulos del curso ${curso.id}`
        )) || [];

      for (const modulo of modulos) {
        const lecciones =
          (await safe(
            () => listarLecciones(modulo.id),
            `al listar lecciones del módulo ${modulo.id}`
          )) || [];

        for (const leccion of lecciones) {
          const evaluaciones =
            (await safe(
              () => listarEvaluacionesPorLeccion(leccion.id),
              `al listar evaluaciones de la lección ${leccion.id}`
            )) || [];

          for (const evalua of evaluaciones) {
            const intentosRaw =
              (await safe(
                () => listarIntentosEvaluacionInstructor(evalua.id),
                `al listar intentos de la evaluación ${evalua.id}`
              )) || [];
            const intentos = Array.isArray(intentosRaw) ? intentosRaw : [];

            intentos.forEach((it) => {
              panel.push({
                idIntento: it.id,
                estadoIntento: it.estado,
                puntaje: it.puntaje ?? null,
                puntajeMaximo:
                  it.puntajeMaximo ?? evalua.puntajeMaximo ?? null,
                // ya no usamos entidad Calificacion:
                porcentaje: null,
                estadoCalificacion: null,
                aprobado: null,

                idEstudiante: it.idEstudiante,
                nombreEstudiante:
                  it.estudianteNombre || it.nombreEstudiante || null,

                idEvaluacion: evalua.id,
                tituloEvaluacion: evalua.titulo,
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
        r.tituloEvaluacion,
        r.idCurso,
        r.idLeccion,
        r.idEvaluacion,
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

  return (
    <main className="flex-1 bg-slate-950/90 text-slate-50">
      <div className="max-w-6xl mx-auto px-4 md:px-6 py-8 md:py-10 space-y-7">
        <button
          type="button"
          onClick={() => navigate(-1)}
          className="inline-flex items-center gap-2 rounded-full border border-slate-700/70 bg-slate-950/80 px-4 py-1.5 text-[0.7rem] md:text-xs font-semibold uppercase tracking-[0.22em] text-slate-200 hover:border-amber-400/80 hover:text-amber-200 hover:bg-slate-900 transition-colors"
        >
          <span className="text-sm">←</span> Volver
        </button>

        <section className="relative overflow-hidden rounded-[2.5rem] border border-slate-800 bg-gradient-to-r from-slate-950 via-slate-900 to-slate-950 px-5 md:px-8 py-6 md:py-7 shadow-[0_24px_90px_rgba(0,0,0,0.95)]">
          <div className="pointer-events-none absolute -left-24 -top-24 h-64 w-64 rounded-full border border-slate-700/60" />
          <div className="pointer-events-none absolute -right-16 -bottom-28 h-72 w-72 rounded-[40%] border border-slate-800/70" />

          <div className="relative space-y-3">
            <span className="inline-flex items-center rounded-full bg-emerald-400/95 px-3 py-1 text-[0.7rem] font-semibold uppercase tracking-[0.22em] text-slate-950 shadow-[0_0_25px_rgba(52,211,153,0.9)]">
              Panel de intentos
            </span>
            <h1 className="text-2xl md:text-3xl font-semibold tracking-tight text-slate-50">
              Intentos de evaluaciones
            </h1>
            <p className="max-w-2xl text-xs md:text-sm text-slate-300/90">
              Aquí ves los intentos de tus estudiantes: quién rindió cada
              evaluación y en qué curso/lección. El puntaje mostrado es el del
              intento en sí.
            </p>
          </div>
        </section>

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

        <section className="mt-2">
          <div className="overflow-x-auto rounded-3xl border border-slate-800 bg-slate-950/90 shadow-[0_22px_70px_rgba(15,23,42,1)]">
            {loading ? (
              <div className="px-4 py-6 text-sm text-slate-300">
                Cargando intentos...
              </div>
            ) : rowsFiltradas.length === 0 ? (
              <div className="px-4 py-6 text-sm text-slate-300">
                No hay intentos registrados para tus cursos (o no coinciden con
                el filtro).
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
                    <th className="px-4 py-3 text-right text-[0.65rem] md:text-[0.7rem] font-semibold tracking-[0.2em] uppercase">
                      Puntaje
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {rowsFiltradas.map((r) => (
                    <tr
                      key={r.idIntento}
                      className="border-t border-slate-800/70 hover:bg-slate-900/70 transition-colors"
                    >
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

                      <td className="px-4 py-3 align-middle text-slate-200">
                        <div className="flex flex-col gap-0.5">
                          <span className="text-[0.75rem] text-slate-100">
                            {r.tituloCurso || "Curso sin título"}
                          </span>
                          <span className="text-[0.7rem] text-slate-400">
                            {r.tituloLeccion || "Lección"} ·{" "}
                            {r.tituloEvaluacion || "Evaluación"}
                          </span>
                        </div>
                      </td>

                      <td className="px-4 py-3 align-middle text-slate-200">
                        {r.estadoIntento || "N/D"}
                      </td>

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
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>
        </section>

        <section className="pt-1">
          <p className="text-[0.7rem] text-slate-500 max-w-md">
            Tip: usa el buscador para filtrar por nombre de alumno, curso,
            lección o evaluación. Más adelante puedes extender la tabla sin
            tocar la lógica principal.
          </p>
        </section>
      </div>
    </main>
  );
};

export default EvaluacionIntentosGestion;

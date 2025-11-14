// src/pages/InscripcionesCursoGestion.jsx
import React, { useEffect, useState } from "react";
import { useLocation, useNavigate, useParams } from "react-router-dom";
import { obtenerCurso } from "../services/cursoService";
import { listarInscripcionesPorCurso } from "../services/inscripcionService";

const InscripcionesCursoGestion = () => {
  const { id } = useParams(); // id del curso
  const navigate = useNavigate();
  const location = useLocation();

  const esAdmin = location.pathname.startsWith("/admin/");
  const basePath = esAdmin ? "/admin" : "/instructor";

  const [curso, setCurso] = useState(null);
  const [inscripciones, setInscripciones] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

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

  const formatEstado = (estado) => {
    if (!estado) return "SIN ESTADO";
    const e = estado.toLowerCase();
    if (e === "activa") return "ACTIVA";
    if (e === "completada") return "COMPLETADA";
    if (e === "cancelada") return "CANCELADA";
    if (e === "pendiente_pago") return "PENDIENTE_PAGO";
    if (e === "suspendida") return "SUSPENDIDA";
    if (e === "expirada") return "EXPIRADA";
    return estado.toUpperCase();
  };

  const chipColors = (estadoRaw) => {
    const e = (estadoRaw || "").toLowerCase();
    if (e === "activa") return "bg-emerald-500/90 text-emerald-950";
    if (e === "completada") return "bg-sky-400/90 text-sky-950";
    if (e === "cancelada" || e === "expirada")
      return "bg-rose-500/90 text-rose-50";
    if (e === "pendiente_pago") return "bg-amber-400/90 text-amber-950";
    if (e === "suspendida") return "bg-fuchsia-400/90 text-fuchsia-950";
    return "bg-slate-500 text-slate-50";
  };

  useEffect(() => {
    const fetchData = async () => {
      setLoading(true);
      setError("");
      try {
        const [cursoData, inscs] = await Promise.all([
          obtenerCurso(id),
          listarInscripcionesPorCurso(id),
        ]);
        setCurso(cursoData);
        setInscripciones(inscs || []);
      } catch (err) {
        console.error("Error cargando inscripciones:", err);
        setError("No se pudieron cargar las inscripciones de este curso.");
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [id]);

  if (loading) {
    return (
      <div className="max-w-5xl mx-auto px-4 md:px-6 py-10 text-center text-slate-300">
        Cargando inscripciones...
      </div>
    );
  }

  if (error) {
    return (
      <div className="max-w-5xl mx-auto px-4 md:px-6 py-10 text-center text-rose-400">
        {error}
      </div>
    );
  }

  return (
    <div className="max-w-6xl mx-auto px-4 md:px-6 py-8 md:py-10 space-y-6">
      {/* Volver */}
      <button
        type="button"
        onClick={() => navigate(-1)}
        className="inline-flex items-center gap-2 rounded-full border border-slate-700/70 bg-slate-950/80 px-4 py-1.5 text-[0.7rem] md:text-xs font-semibold uppercase tracking-[0.22em] text-slate-200 hover:border-amber-400/80 hover:text-amber-200 hover:bg-slate-900 transition-colors"
      >
        <span className="text-sm">←</span> Volver
      </button>

      {/* Header */}
      <section className="rounded-[2.5rem] border border-slate-800 bg-gradient-to-r from-slate-950 via-slate-900 to-slate-950 px-5 md:px-8 py-6 md:py-7 shadow-[0_24px_90px_rgba(0,0,0,0.95)] space-y-3">
        <span className="inline-flex items-center rounded-full bg-amber-400/95 px-3 py-1 text-[0.7rem] font-semibold uppercase tracking-[0.22em] text-amber-950 shadow-[0_0_25px_rgba(251,191,36,0.8)]">
          {esAdmin ? "Admin · Inscripciones" : "Instructor · Inscripciones"}
        </span>
        <h1 className="text-2xl md:text-3xl font-semibold tracking-tight text-slate-50">
          Inscripciones del curso
        </h1>
        <p className="text-xs md:text-sm text-slate-300/90">
          Curso:{" "}
          <span className="font-semibold text-amber-200">
            {curso?.titulo || id}
          </span>
        </p>
      </section>

      {/* Lista de inscripciones */}
      <section className="rounded-[2.5rem] border border-slate-800 bg-slate-950/95 px-5 md:px-8 py-6 md:py-7 shadow-[0_24px_90px_rgba(0,0,0,0.95)] space-y-4">
        {inscripciones.length === 0 ? (
          <p className="text-xs md:text-sm text-slate-400">
            Aún no hay inscripciones para este curso.
          </p>
        ) : (
          <div className="overflow-x-auto">
            <table className="min-w-full text-xs md:text-sm text-left text-slate-200">
              <thead className="border-b border-slate-800 text-[0.7rem] md:text-xs uppercase tracking-[0.2em] text-slate-400">
                <tr>
                  <th className="py-2 pr-4">Estudiante</th>
                  <th className="py-2 pr-4">Estado</th>
                  <th className="py-2 pr-4">Inscrito</th>
                  <th className="py-2 pr-4">Acceso desde</th>
                  <th className="py-2 pr-4">Acciones</th>
                </tr>
              </thead>
              <tbody>
                {inscripciones.map((ins) => {
                  const fechaBase = ins.createdAt || ins.accessStartAt;
                  const estudiante =
                    ins.estudianteNombre ||
                    ins.estudianteEmail ||
                    ins.userEmail ||
                    ins.userName ||
                    ins.userId ||
                    "(sin datos)";

                  return (
                    <tr
                      key={ins.id}
                      className="border-b border-slate-800/70 last:border-0"
                    >
                      <td className="py-2 pr-4 whitespace-nowrap">
                        {estudiante}
                      </td>
                      <td className="py-2 pr-4">
                        <span
                          className={`inline-flex items-center rounded-full px-2.5 py-1 text-[0.65rem] font-semibold uppercase tracking-[0.18em] ${chipColors(
                            ins.estado
                          )}`}
                        >
                          {formatEstado(ins.estado)}
                        </span>
                      </td>
                      <td className="py-2 pr-4 whitespace-nowrap">
                        {formatFecha(fechaBase)}
                      </td>
                      <td className="py-2 pr-4 whitespace-nowrap">
                        {ins.accessStartAt
                          ? formatFecha(ins.accessStartAt)
                          : "-"}
                      </td>
                      <td className="py-2 pr-4">
                        <button
                          type="button"
                          onClick={() =>
                            navigate(
                              `${basePath}/inscripciones/${ins.id}/pagos`
                            )
                          }
                          className="inline-flex items-center justify-center rounded-full bg-slate-900 px-3 py-1.5 text-[0.7rem] md:text-xs font-semibold text-amber-200 border border-slate-600/80 hover:bg-slate-800 active:translate-y-px transition"
                        >
                          Ver pagos
                        </button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </section>
    </div>
  );
};

export default InscripcionesCursoGestion;

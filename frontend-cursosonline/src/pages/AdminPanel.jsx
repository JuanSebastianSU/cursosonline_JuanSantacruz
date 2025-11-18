// src/pages/AdminPanel.jsx
import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { obtenerResumenPlataforma } from "../services/reporteService";

const AdminPanel = () => {
  const navigate = useNavigate();

  const [resumen, setResumen] = useState(null);
  const [loadingResumen, setLoadingResumen] = useState(true);
  const [errorResumen, setErrorResumen] = useState("");

  useEffect(() => {
    const cargarResumen = async () => {
      setLoadingResumen(true);
      setErrorResumen("");
      try {
        const data = await obtenerResumenPlataforma();
        setResumen(data);
      } catch (err) {
        console.error("Error obteniendo resumen plataforma:", err);
        const msg =
          err?.response?.data?.message ||
          err?.response?.data ||
          err?.message ||
          "No se pudo cargar el resumen de la plataforma.";
        setErrorResumen(msg);
      } finally {
        setLoadingResumen(false);
      }
    };

    cargarResumen();
  }, []);

  return (
    <main className="flex-1 bg-slate-950/90 text-slate-50">
      <div className="max-w-6xl mx-auto px-4 md:px-6 py-8 md:py-10 space-y-7">
        {/* ENCABEZADO */}
        <header className="space-y-3 border-b border-slate-800 pb-5">
          <p className="inline-flex items-center gap-2 rounded-full border border-slate-700/80 bg-slate-950/80 px-3 py-1 text-[0.65rem] font-semibold uppercase tracking-[0.3em] text-slate-400">
            <span className="h-1.5 w-8 -skew-x-12 rounded-full bg-gradient-to-r from-amber-300/90 via-emerald-300/90 to-sky-300/90" />
            Panel admin
          </p>
          <h1 className="text-2xl md:text-3xl font-semibold tracking-tight text-slate-50">
            Centro de administración
          </h1>
          <p className="text-xs md:text-sm text-slate-400 max-w-xl">
            Desde aquí puedes gestionar cursos, usuarios y calificaciones de
            toda la plataforma.
          </p>
        </header>

        {/* RESUMEN DE LA PLATAFORMA (MICROSERVICIO) */}
        <section className="space-y-3">
          <h2 className="text-sm md:text-base font-semibold text-slate-200">
            Resumen general de la plataforma
          </h2>

          {loadingResumen ? (
            <p className="text-xs md:text-sm text-slate-400">
              Cargando resumen...
            </p>
          ) : errorResumen ? (
            <p className="text-xs md:text-sm text-rose-300 bg-rose-900/40 border border-rose-700/70 rounded-2xl px-3 py-2 inline-block">
              {errorResumen}
            </p>
          ) : resumen ? (
            <div className="grid gap-3 md:grid-cols-4">
              {/* Usuarios */}
              <div className="rounded-3xl border border-slate-800 bg-slate-950/90 px-4 py-4 shadow-[0_18px_55px_rgba(15,23,42,0.95)]">
                <p className="text-[0.7rem] uppercase tracking-[0.22em] text-slate-400 mb-1">
                  Usuarios
                </p>
                <p className="text-2xl font-semibold text-emerald-300">
                  {resumen.totalUsuarios ?? 0}
                </p>
                <p className="text-[0.7rem] text-slate-500 mt-1">
                  Cuentas registradas en la plataforma.
                </p>
              </div>

              {/* Cursos */}
              <div className="rounded-3xl border border-slate-800 bg-slate-950/90 px-4 py-4 shadow-[0_18px_55px_rgba(15,23,42,0.95)]">
                <p className="text-[0.7rem] uppercase tracking-[0.22em] text-slate-400 mb-1">
                  Cursos
                </p>
                <p className="text-2xl font-semibold text-sky-300">
                  {resumen.totalCursos ?? 0}
                </p>
                <p className="text-[0.7rem] text-slate-500 mt-1">
                  Cursos creados por instructores.
                </p>
              </div>

              {/* Inscripciones */}
              <div className="rounded-3xl border border-slate-800 bg-slate-950/90 px-4 py-4 shadow-[0_18px_55px_rgba(15,23,42,0.95)]">
                <p className="text-[0.7rem] uppercase tracking-[0.22em] text-slate-400 mb-1">
                  Inscripciones
                </p>
                <p className="text-2xl font-semibold text-amber-300">
                  {resumen.totalInscripciones ?? 0}
                </p>
                <p className="text-[0.7rem] text-slate-500 mt-1">
                  Inscripciones a cursos realizadas.
                </p>
              </div>

              {/* Certificados */}
              <div className="rounded-3xl border border-slate-800 bg-slate-950/90 px-4 py-4 shadow-[0_18px_55px_rgba(15,23,42,0.95)]">
                <p className="text-[0.7rem] uppercase tracking-[0.22em] text-slate-400 mb-1">
                  Certificados
                </p>
                <p className="text-2xl font-semibold text-purple-300">
                  {resumen.totalCertificados ?? 0}
                </p>
                <p className="text-[0.7rem] text-slate-500 mt-1">
                  Certificados emitidos por la plataforma.
                </p>
              </div>
            </div>
          ) : (
            <p className="text-xs md:text-sm text-slate-400">
              No se pudo obtener el resumen.
            </p>
          )}
        </section>

        {/* TARJETAS DE NAVEGACIÓN */}
        <section className="grid gap-4 md:grid-cols-3">
          {/* Cursos */}
          <button
            type="button"
            onClick={() => navigate("/admin/cursos")}
            className="group rounded-3xl border border-slate-800 bg-slate-950/90 px-5 py-5 text-left shadow-[0_18px_55px_rgba(15,23,42,0.95)] hover:border-emerald-400/70 hover:bg-slate-900 transition-colors"
          >
            <div className="mb-3 text-emerald-300 text-lg">📚</div>
            <h2 className="text-sm md:text-base font-semibold text-slate-50 mb-1">
              Gestión de cursos
            </h2>
            <p className="text-xs md:text-sm text-slate-400">
              Ver, publicar, archivar y eliminar cursos de toda la plataforma.
            </p>
          </button>

          {/* Usuarios */}
          <button
            type="button"
            onClick={() => navigate("/admin/usuarios")}
            className="group rounded-3xl border border-slate-800 bg-slate-950/90 px-5 py-5 text-left shadow-[0_18px_55px_rgba(15,23,42,0.95)] hover:border-sky-400/70 hover:bg-slate-900 transition-colors"
          >
            <div className="mb-3 text-sky-300 text-lg">👥</div>
            <h2 className="text-sm md:text-base font-semibold text-slate-50 mb-1">
              Gestión de usuarios
            </h2>
            <p className="text-xs md:text-sm text-slate-400">
              Listar todos los usuarios, cambiar estado, rol, contraseña o
              eliminar cuentas.
            </p>
          </button>

          {/* Calificaciones */}
          <button
            type="button"
            onClick={() => navigate("/admin/calificaciones")}
            className="group rounded-3xl border border-slate-800 bg-slate-950/90 px-5 py-5 text-left shadow-[0_18px_55px_rgba(15,23,42,0.95)] hover:border-purple-400/70 hover:bg-slate-900 transition-colors"
          >
            <div className="mb-3 text-purple-300 text-lg">📊</div>
            <h2 className="text-sm md:text-base font-semibold text-slate-50 mb-1">
              Calificaciones globales
            </h2>
            <p className="text-xs md:text-sm text-slate-400">
              Revisar intentos y calificaciones de todas las evaluaciones.
            </p>
          </button>
        </section>

        <section className="pt-1">
          <p className="text-[0.7rem] text-slate-500 max-w-md">
            Consejo: usa este panel como “hub” y desde aquí entra a cada sección
            específica. Así el navbar se mantiene limpio.
          </p>
        </section>
      </div>
    </main>
  );
};

export default AdminPanel;

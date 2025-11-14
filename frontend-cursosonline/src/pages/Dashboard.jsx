import React, { useContext } from "react";
import { Link } from "react-router-dom";
import { AuthContext } from "../context/AuthContext";

/**
 * Dashboard
 * Vista central después de iniciar sesión.
 * Muestra atajos según el rol: estudiante, instructor, admin.
 */
const Dashboard = () => {
  const { user } = useContext(AuthContext);

  const nombre =
    user?.nombre || user?.email || user?.username || "Usuario";

  // Normalización de roles (igual espíritu que en Navbar)
  const norm = (s) => (s || "").toUpperCase();
  const userRoles = (() => {
    if (Array.isArray(user?.roles) && user.roles.length) {
      return user.roles.map((r) =>
        typeof r === "string" ? norm(r) : norm(r?.nombre)
      );
    }
    if (user?.rol) {
      return [norm(user.rol)];
    }
    return [];
  })();

  const tieneRol = (rolBuscado) => {
    const buscado = norm(rolBuscado).startsWith("ROLE_")
      ? norm(rolBuscado)
      : `ROLE_${norm(rolBuscado)}`;
    return userRoles.some((r) =>
      r.startsWith("ROLE_") ? r === buscado : `ROLE_${r}` === buscado
    );
  };

  const esInstructor = tieneRol("ROLE_INSTRUCTOR");
  const esAdmin = tieneRol("ROLE_ADMIN");
  const esSoloEstudiante = !esInstructor && !esAdmin;

  return (
    <main className="flex-1 bg-slate-950/70 text-slate-50">
      {/* Fondo artístico suave */}
      <div className="pointer-events-none fixed inset-0 -z-10">
        <div className="absolute -top-32 left-1/2 h-72 w-96 -translate-x-1/2 rounded-full bg-[radial-gradient(circle,_rgba(248,250,252,0.12),_transparent_60%)] blur-3xl opacity-80" />
        <div className="absolute -right-24 bottom-10 h-64 w-64 rounded-full bg-fuchsia-500/18 blur-3xl" />
        <div className="absolute -left-24 top-40 h-64 w-80 -rotate-6 bg-gradient-to-r from-amber-500/18 via-transparent to-sky-500/18 blur-2xl" />
      </div>

      <div className="max-w-6xl mx-auto px-4 md:px-6 py-8 md:py-10 space-y-8">
        {/* ENCABEZADO */}
        <section className="space-y-2">
          <p className="inline-flex items-center gap-2 rounded-full border border-slate-700/70 bg-slate-950/90 px-3 py-1 text-[0.65rem] font-semibold uppercase tracking-[0.3em] text-slate-400">
            <span className="h-1.5 w-1.5 rounded-full bg-emerald-400 shadow-[0_0_14px_rgba(52,211,153,0.9)]" />
            Panel principal
          </p>
          <div className="flex flex-col md:flex-row md:items-end md:justify-between gap-3">
            <div>
              <h1 className="text-2xl md:text-3xl font-semibold tracking-tight text-slate-50">
                Bienvenido,{" "}
                <span className="text-amber-300">{nombre}</span>
              </h1>
              <p className="text-xs md:text-sm text-slate-400 max-w-xl mt-1">
                Este es tu punto de partida. Desde aquí puedes continuar tu
                aprendizaje, gestionar tus cursos o administrar la plataforma,
                según tus permisos.
              </p>
            </div>

            {/* Badge de rol */}
            <div className="flex flex-wrap gap-2 text-[0.65rem] md:text-xs">
              {esAdmin && (
                <span className="inline-flex items-center rounded-full border border-fuchsia-400/70 bg-fuchsia-500/15 px-3 py-1 font-semibold uppercase tracking-[0.25em] text-fuchsia-100">
                  Admin
                </span>
              )}
              {esInstructor && (
                <span className="inline-flex items-center rounded-full border border-sky-400/70 bg-sky-500/15 px-3 py-1 font-semibold uppercase tracking-[0.25em] text-sky-100">
                  Instructor
                </span>
              )}
              {esSoloEstudiante && (
                <span className="inline-flex items-center rounded-full border border-emerald-400/70 bg-emerald-500/15 px-3 py-1 font-semibold uppercase tracking-[0.25em] text-emerald-100">
                  Estudiante
                </span>
              )}
            </div>
          </div>
        </section>

        {/* BLOQUES PRINCIPALES */}
        <section className="grid gap-5 md:gap-6 md:grid-cols-3">
          {/* Bloque estudiante / general */}
          <article className="relative overflow-hidden rounded-3xl border border-slate-800 bg-slate-950/90 px-5 py-5 shadow-[0_16px_50px_rgba(15,23,42,0.9)]">
            <div className="pointer-events-none absolute -right-10 -top-10 h-32 w-32 rounded-full bg-emerald-400/15 blur-2xl" />
            <header className="mb-3">
              <p className="text-[0.65rem] uppercase tracking-[0.28em] text-emerald-300/80">
                Ruta de aprendizaje
              </p>
              <h2 className="text-sm md:text-base font-semibold text-slate-50 mt-1">
                Explora y retoma tus cursos
              </h2>
            </header>
            <p className="text-xs md:text-sm text-slate-300/95 leading-relaxed mb-4">
              Accede al catálogo completo de cursos o vuelve a revisar el
              contenido que ya estás cursando.
            </p>
            <div className="flex flex-wrap gap-2 text-[0.7rem] md:text-xs">
              <Link
                to="/cursos"
                className="inline-flex items-center justify-center rounded-full bg-emerald-300 px-4 py-1.5 font-semibold uppercase tracking-[0.22em] text-slate-950 shadow-[0_12px_35px_rgba(52,211,153,0.75)] hover:bg-emerald-200 transition-colors"
              >
                Ver cursos
              </Link>
              <Link
                to="/mi-perfil"
                className="inline-flex items-center justify-center rounded-full border border-slate-600 px-3 py-1.5 font-semibold uppercase tracking-[0.22em] text-slate-200 hover:border-emerald-300 hover:text-emerald-200 hover:bg-emerald-500/10 transition-colors"
              >
                Mi perfil
              </Link>
            </div>
          </article>

          {/* Bloque instructor */}
          {esInstructor && (
            <article className="relative overflow-hidden rounded-3xl border border-slate-800 bg-slate-950/90 px-5 py-5 shadow-[0_16px_50px_rgba(15,23,42,0.9)]">
              <div className="pointer-events-none absolute -left-10 -top-10 h-32 w-40 -rotate-6 bg-sky-500/18 blur-2xl" />
              <header className="mb-3">
                <p className="text-[0.65rem] uppercase tracking-[0.28em] text-sky-300/80">
                  Panel de instructor
                </p>
                <h2 className="text-sm md:text-base font-semibold text-slate-50 mt-1">
                  Diseña, publica y gestiona tus cursos
                </h2>
              </header>
              <p className="text-xs md:text-sm text-slate-300/95 leading-relaxed mb-4">
                Accede a tus cursos, revisa su estado (borrador, publicado,
                archivado) y crea nuevo contenido en cuestión de minutos.
              </p>
              <div className="flex flex-wrap gap-2 text-[0.7rem] md:text-xs">
                <Link
                  to="/instructor/cursos"
                  className="inline-flex items-center justify-center rounded-full bg-sky-300 px-4 py-1.5 font-semibold uppercase tracking-[0.22em] text-slate-950 shadow-[0_12px_35px_rgba(56,189,248,0.75)] hover:bg-sky-200 transition-colors"
                >
                  Mis cursos
                </Link>
                <Link
                  to="/instructor/cursos/nuevo"
                  className="inline-flex items-center justify-center rounded-full border border-sky-400/80 px-3 py-1.5 font-semibold uppercase tracking-[0.22em] text-sky-100 hover:bg-sky-500/10 transition-colors"
                >
                  Nuevo curso
                </Link>
              </div>
            </article>
          )}

          {/* Bloque administración */}
          {esAdmin && (
            <article className="relative overflow-hidden rounded-3xl border border-slate-800 bg-slate-950/90 px-5 py-5 shadow-[0_16px_50px_rgba(15,23,42,0.9)]">
              <div className="pointer-events-none absolute -right-14 top-1/2 h-40 w-40 -translate-y-1/2 rotate-12 bg-fuchsia-500/22 blur-3xl" />
              <header className="mb-3">
                <p className="text-[0.65rem] uppercase tracking-[0.28em] text-fuchsia-300/80">
                  Administración
                </p>
                <h2 className="text-sm md:text-base font-semibold text-slate-50 mt-1">
                  Control de cursos y usuarios
                </h2>
              </header>
              <p className="text-xs md:text-sm text-slate-300/95 leading-relaxed mb-4">
                Gestiona la oferta de cursos, revisa estados y administra los
                usuarios registrados en la plataforma.
              </p>
              <div className="flex flex-wrap gap-2 text-[0.7rem] md:text-xs">
                <Link
                  to="/admin/cursos"
                  className="inline-flex items-center justify-center rounded-full bg-fuchsia-300 px-4 py-1.5 font-semibold uppercase tracking-[0.22em] text-slate-950 shadow-[0_12px_35px_rgba(244,114,182,0.8)] hover:bg-fuchsia-200 transition-colors"
                >
                  Admin cursos
                </Link>
                <Link
                  to="/admin/usuarios"
                  className="inline-flex items-center justify-center rounded-full border border-fuchsia-400/80 px-3 py-1.5 font-semibold uppercase tracking-[0.22em] text-fuchsia-100 hover:bg-fuchsia-500/10 transition-colors"
                >
                  Admin usuarios
                </Link>
              </div>
            </article>
          )}

          {/* Si no es instructor ni admin, rellenamos el grid con un bloque extra descriptivo */}
          {esSoloEstudiante && (
            <article className="relative overflow-hidden rounded-3xl border border-slate-800 bg-slate-950/85 px-5 py-5 shadow-[0_16px_50px_rgba(15,23,42,0.9)] md:col-span-2">
              <div className="pointer-events-none absolute -left-12 bottom-0 h-40 w-52 bg-gradient-to-tr from-amber-400/25 via-transparent to-sky-400/20 blur-2xl" />
              <header className="mb-3">
                <p className="text-[0.65rem] uppercase tracking-[0.28em] text-amber-300/80">
                  Tu espacio
                </p>
                <h2 className="text-sm md:text-base font-semibold text-slate-50 mt-1">
                  Guarda lo importante, vuelve cuando quieras
                </h2>
              </header>
              <p className="text-xs md:text-sm text-slate-300/95 leading-relaxed">
                Conforme el proyecto crezca, aquí podrás ver tu progreso,
                cursos favoritos y recomendaciones personalizadas. Por ahora,
                este panel ya refleja el lenguaje visual del sistema y sirve
                como base para futuras métricas.
              </p>
            </article>
          )}
        </section>

        {/* BLOQUE FINAL / NOTA DE ESTADO */}
        <section>
          <div className="rounded-3xl border border-slate-800 bg-slate-950/90 px-5 md:px-6 py-5 md:py-6 shadow-[0_16px_45px_rgba(15,23,42,0.95)] flex flex-col md:flex-row md:items-center md:justify-between gap-3">
            <div>
              <p className="text-[0.65rem] uppercase tracking-[0.28em] text-slate-500">
                cursosonlinejs · estado del prototipo
              </p>
              <p className="mt-2 text-xs md:text-sm text-slate-300 leading-relaxed max-w-xl">
                El panel de control está diseñado como un{" "}
                <span className="font-semibold text-slate-50">
                  “lienzo” estable
                </span>{" "}
                donde después podrás incrustar estadísticas reales: número de
                cursos, alumnos, ingresos, etc. La estética ya está alineada
                con el resto de la plataforma.
              </p>
            </div>
            <div className="flex flex-col md:items-end gap-1 text-[0.7rem] md:text-xs text-slate-400">
              <span>
                Stack: <span className="text-slate-200">React · Tailwind · JWT</span>
              </span>
              <span>
                Backend:{" "}
                <span className="text-slate-200">Spring Boot · REST API</span>
              </span>
            </div>
          </div>
        </section>
      </div>
    </main>
  );
};

export default Dashboard;

import React, { useContext } from "react";
import { Link } from "react-router-dom";
import { AuthContext } from "../context/AuthContext";

const Home = () => {
  const { user, isAuthenticated } = useContext(AuthContext);

  return (
    <main className="flex-1">
      {/* HERO PRINCIPAL */}
      <section className="relative overflow-hidden border-b border-slate-800/70">
        {/* halos / garabatos de fondo */}
        <div className="pointer-events-none absolute -top-24 left-1/2 h-64 w-96 -translate-x-1/2 rounded-full bg-[radial-gradient(circle,_rgba(250,204,21,0.18),_transparent_60%)] blur-2xl" />
        <div className="pointer-events-none absolute -right-24 bottom-0 h-60 w-60 rounded-full bg-fuchsia-500/20 blur-3xl" />
        <div className="pointer-events-none absolute -left-32 top-24 h-52 w-80 -rotate-6 bg-gradient-to-r from-sky-500/25 via-transparent to-transparent blur-2xl" />

        <div className="relative max-w-6xl mx-auto px-4 md:px-6 py-10 md:py-16 lg:py-20">
          <div className="grid gap-10 lg:grid-cols-[1.1fr,0.9fr] items-center">
            {/* LADO IZQUIERDO: copy + CTA */}
            <div className="space-y-6">
              <p className="inline-flex items-center gap-2 rounded-full border border-amber-400/40 bg-amber-400/10 px-3 py-1 text-[0.7rem] font-semibold uppercase tracking-[0.25em] text-amber-200">
                <span className="h-1.5 w-1.5 rounded-full bg-emerald-400 shadow-[0_0_12px_rgba(52,211,153,0.9)]" />
                Plataforma · CursosOnlineJS
              </p>

              <h1 className="text-3xl md:text-4xl lg:text-5xl font-semibold tracking-tight text-slate-50">
                Aprende con ritmo,{" "}
                <span className="text-amber-300">
                  enseña con estilo.
                </span>
              </h1>

              <p className="max-w-xl text-sm md:text-base text-slate-300/90 leading-relaxed">
                Una plataforma de cursos construida con{" "}
                <span className="font-semibold text-slate-50">
                  React + Spring Boot
                </span>
                , pensada para que el código, el diseño y el aprendizaje
                tengan la misma importancia.
              </p>

              <div className="grid gap-3 text-xs md:text-sm text-slate-300">
                <div className="flex items-start gap-3">
                  <span className="mt-0.5 inline-flex h-6 w-6 items-center justify-center rounded-full border border-amber-400/60 bg-slate-950 text-[0.7rem] font-semibold text-amber-200">
                    01
                  </span>
                  <p>
                    Crea y publica cursos con un{" "}
                    <span className="font-semibold text-slate-50">
                      panel de instructor
                    </span>{" "}
                    claro y elegante.
                  </p>
                </div>
                <div className="flex items-start gap-3">
                  <span className="mt-0.5 inline-flex h-6 w-6 items-center justify-center rounded-full border border-sky-400/60 bg-slate-950 text-[0.7rem] font-semibold text-sky-200">
                    02
                  </span>
                  <p>
                    Explora contenido en un catálogo{" "}
                    <span className="font-semibold text-slate-50">
                      minimalista pero expresivo
                    </span>
                    , sin ruido visual.
                  </p>
                </div>
                <div className="flex items-start gap-3">
                  <span className="mt-0.5 inline-flex h-6 w-6 items-center justify-center rounded-full border border-fuchsia-400/60 bg-slate-950 text-[0.7rem] font-semibold text-fuchsia-200">
                    03
                  </span>
                  <p>
                    Disfruta de una interfaz con{" "}
                    <span className="font-semibold text-slate-50">
                      toques retro, contrastes fuertes
                    </span>{" "}
                    y detalles accesibles.
                  </p>
                </div>
              </div>

              {/* CTAs */}
              <div className="flex flex-wrap items-center gap-3 pt-2">
                <Link
                  to="/cursos"
                  className="inline-flex items-center justify-center rounded-full bg-amber-300 px-5 py-2.5 text-xs md:text-sm font-semibold tracking-[0.2em] uppercase text-slate-950 shadow-[0_14px_40px_rgba(250,204,21,0.55)] hover:bg-amber-200 transition-colors"
                >
                  Ver cursos
                </Link>

                {isAuthenticated ? (
                  <Link
                    to="/mi-perfil"
                    className="inline-flex items-center justify-center rounded-full border border-slate-500 px-4 py-2 text-[0.7rem] md:text-xs font-semibold tracking-[0.2em] uppercase text-slate-200 hover:border-sky-400 hover:text-sky-200 hover:bg-sky-500/10 transition-colors"
                  >
                    Ir a mi espacio
                  </Link>
                ) : (
                  <Link
                    to="/register"
                    className="inline-flex items-center justify-center rounded-full border border-slate-500 px-4 py-2 text-[0.7rem] md:text-xs font-semibold tracking-[0.2em] uppercase text-slate-200 hover:border-fuchsia-400 hover:text-fuchsia-200 hover:bg-fuchsia-500/10 transition-colors"
                  >
                    Empezar gratis
                  </Link>
                )}
              </div>

              {isAuthenticated && (
                <p className="text-[0.7rem] md:text-xs text-slate-400/90">
                  Sesión iniciada como{" "}
                  <span className="font-semibold text-slate-100">
                    {user?.nombre || user?.email || "usuario"}
                  </span>
                  . Sigue explorando o continúa donde lo dejaste.
                </p>
              )}
            </div>

            {/* LADO DERECHO: tarjetas / “panel” artístico */}
            <div className="relative">
              {/* brillo de fondo */}
              <div className="pointer-events-none absolute -inset-6 rounded-[2rem] bg-[radial-gradient(circle_at_top,_rgba(248,250,252,0.12),_transparent_60%)] opacity-80 blur-2xl" />

              <div className="relative space-y-4">
                {/* tarjeta principal */}
                <div className="rounded-3xl border border-slate-700/70 bg-slate-900/80 px-5 py-4 shadow-[0_18px_60px_rgba(15,23,42,0.95)] backdrop-blur">
                  <div className="flex items-center justify-between gap-3">
                    <div className="flex flex-col gap-1">
                      <span className="text-[0.65rem] font-semibold uppercase tracking-[0.25em] text-slate-400">
                        Panel instructor
                      </span>
                      <span className="text-sm md:text-base font-semibold text-slate-50">
                        Crea un curso en minutos
                      </span>
                    </div>
                    <div className="flex h-10 w-10 items-center justify-center rounded-2xl border border-amber-400/70 bg-slate-950 text-amber-200 text-lg shadow-[0_0_20px_rgba(250,204,21,0.7)]">
                      ⚙
                    </div>
                  </div>

                  <div className="mt-3 grid grid-cols-3 gap-2 text-[0.65rem] text-slate-300">
                    <div className="rounded-2xl border border-slate-700/60 bg-slate-900/80 px-3 py-2">
                      <p className="text-[0.6rem] uppercase tracking-[0.18em] text-slate-400">
                        Cursos
                      </p>
                      <p className="mt-1 text-sm font-semibold text-emerald-300">
                        +24
                      </p>
                    </div>
                    <div className="rounded-2xl border border-slate-700/60 bg-slate-900/80 px-3 py-2">
                      <p className="text-[0.6rem] uppercase tracking-[0.18em] text-slate-400">
                        Estudiantes
                      </p>
                      <p className="mt-1 text-sm font-semibold text-sky-300">
                        +120
                      </p>
                    </div>
                    <div className="rounded-2xl border border-slate-700/60 bg-slate-900/80 px-3 py-2">
                      <p className="text-[0.6rem] uppercase tracking-[0.18em] text-slate-400">
                        Valoración
                      </p>
                      <p className="mt-1 text-sm font-semibold text-amber-300">
                        4.9★
                      </p>
                    </div>
                  </div>
                </div>

                {/* tarjeta inclinada “retro” */}
                <div className="relative">
                  <div className="pointer-events-none absolute inset-0 -z-10 rotate-[-4deg] rounded-3xl bg-gradient-to-r from-amber-500/20 via-fuchsia-500/15 to-sky-500/20 blur-md" />
                  <div className="relative -ml-2 max-w-xs rotate-[-3deg] rounded-3xl border border-slate-700/70 bg-slate-950/90 px-4 py-3 text-xs text-slate-200 shadow-[0_14px_45px_rgba(15,23,42,0.9)]">
                    <p className="text-[0.6rem] uppercase tracking-[0.22em] text-slate-400 mb-1">
                      Estilo visual
                    </p>
                    <p className="leading-relaxed">
                      Contrastes fuertes, formas suaves y pequeños “garabatos”
                      luminosos que inspiran sin distraer.
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* SECCIÓN DE BLOQUES / FEATURES */}
      <section className="border-b border-slate-800/70 bg-slate-950/40">
        <div className="max-w-6xl mx-auto px-4 md:px-6 py-10 md:py-14">
          <div className="mb-6 flex flex-col md:flex-row md:items-end md:justify-between gap-4">
            <div>
              <h2 className="text-lg md:text-2xl font-semibold text-slate-50">
                Pensado para crear, enseñar y aprender.
              </h2>
              <p className="mt-1 text-xs md:text-sm text-slate-400">
                Diseño consistente para instructores, estudiantes y
                administradores, en un único lenguaje visual.
              </p>
            </div>
          </div>

          <div className="grid gap-4 md:gap-6 md:grid-cols-3">
            <div className="rounded-2xl border border-slate-800 bg-slate-950/60 px-4 py-4 shadow-[0_12px_30px_rgba(15,23,42,0.9)]">
              <p className="text-[0.65rem] uppercase tracking-[0.22em] text-amber-300 mb-2">
                Estudiantes
              </p>
              <h3 className="text-sm md:text-base font-semibold text-slate-50 mb-2">
                Catálogo claro, sin ruido
              </h3>
              <p className="text-xs md:text-sm text-slate-300/90 leading-relaxed">
                Tarjetas limpias, tipografía legible y un esquema de colores
                que resalta lo importante: contenido y progreso.
              </p>
            </div>

            <div className="rounded-2xl border border-slate-800 bg-slate-950/60 px-4 py-4 shadow-[0_12px_30px_rgba(15,23,42,0.9)]">
              <p className="text-[0.65rem] uppercase tracking-[0.22em] text-sky-300 mb-2">
                Instructores
              </p>
              <h3 className="text-sm md:text-base font-semibold text-slate-50 mb-2">
                Panel con jerarquía visual
              </h3>
              <p className="text-xs md:text-sm text-slate-300/90 leading-relaxed">
                Estados de curso (borrador, publicado, archivado) distinguidos
                por color, con acciones siempre al alcance.
              </p>
            </div>

            <div className="rounded-2xl border border-slate-800 bg-slate-950/60 px-4 py-4 shadow-[0_12px_30px_rgba(15,23,42,0.9)]">
              <p className="text-[0.65rem] uppercase tracking-[0.22em] text-fuchsia-300 mb-2">
                Accesibilidad
              </p>
              <h3 className="text-sm md:text-base font-semibold text-slate-50 mb-2">
                Pensado para más personas
              </h3>
              <p className="text-xs md:text-sm text-slate-300/90 leading-relaxed">
                Panel de accesibilidad, contraste cuidado y animaciones
                moderadas para no cansar la vista.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* FRASE FINAL / CTA SUAVE */}
      <section className="bg-slate-950/60">
        <div className="max-w-6xl mx-auto px-4 md:px-6 py-10 md:py-12">
          <div className="rounded-3xl border border-slate-800 bg-slate-950/80 px-5 md:px-7 py-6 md:py-8 shadow-[0_18px_55px_rgba(15,23,42,0.95)] flex flex-col md:flex-row md:items-center md:justify-between gap-4">
            <div className="space-y-1">
              <p className="text-[0.65rem] uppercase tracking-[0.26em] text-slate-500">
                cursosonlinejs · laboratorio visual
              </p>
              <p className="text-sm md:text-base text-slate-200">
                Un proyecto donde{" "}
                <span className="font-semibold text-amber-300">
                  backend, frontend y diseño
                </span>{" "}
                conversan en el mismo idioma.
              </p>
            </div>

            <div className="flex flex-wrap gap-2">
              <Link
                to="/cursos"
                className="inline-flex items-center justify-center rounded-full border border-slate-600 px-4 py-2 text-[0.7rem] md:text-xs font-semibold tracking-[0.2em] uppercase text-slate-200 hover:border-amber-300 hover:text-amber-200 hover:bg-amber-500/10 transition-colors"
              >
                Explorar catálogo
              </Link>
              {!isAuthenticated && (
                <Link
                  to="/login"
                  className="inline-flex items-center justify-center rounded-full bg-slate-50 px-4 py-2 text-[0.7rem] md:text-xs font-semibold tracking-[0.2em] uppercase text-slate-950 hover:bg-amber-200 transition-colors"
                >
                  Iniciar sesión
                </Link>
              )}
            </div>
          </div>
        </div>
      </section>
    </main>
  );
};

export default Home;

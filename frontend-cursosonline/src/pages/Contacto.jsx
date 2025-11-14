import React from "react";

const Contacto = () => {
  return (
    <div className="max-w-5xl mx-auto px-4 md:px-6 py-10 md:py-14">
      <div className="relative overflow-hidden rounded-3xl border border-slate-200/80 bg-white/95 shadow-[0_20px_60px_rgba(15,23,42,0.18)]">
        {/* Doodles / manchas de fondo */}
        <div className="pointer-events-none absolute -left-24 -top-24 h-40 w-40 rounded-full bg-gradient-to-br from-slate-900 via-slate-800 to-amber-400 opacity-20 blur-3xl" />
        <div className="pointer-events-none absolute -bottom-24 -right-16 h-44 w-44 rounded-full bg-gradient-to-tr from-amber-500 via-amber-400 to-slate-900 opacity-20 blur-3xl" />
        <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_top,_rgba(15,23,42,0.06),_transparent_60%)]" />

        <div className="relative grid gap-8 md:grid-cols-[minmax(0,1.4fr)_minmax(0,1fr)] px-5 md:px-8 py-7 md:py-9">
          {/* Columna izquierda: texto principal */}
          <div className="space-y-4">
            <h1 className="text-2xl md:text-3xl font-semibold text-slate-900 tracking-tight">
              ¿Hablamos?
            </h1>
            <p className="text-sm md:text-base text-slate-600 max-w-xl">
              Si tienes dudas sobre la plataforma, sugerencias de mejora o
              necesitas ayuda con algún curso, estamos aquí para escucharte.
            </p>

            <div className="mt-4 space-y-3 text-sm md:text-[0.95rem]">
              <div className="flex items-start gap-3">
                <div className="mt-0.5 flex h-8 w-8 items-center justify-center rounded-2xl bg-slate-900 text-amber-200 text-sm shadow-sm">
                  ✉️
                </div>
                <div>
                  <p className="text-[0.7rem] font-semibold uppercase tracking-[0.16em] text-slate-500">
                    Correo principal
                  </p>
                  <a
                    href="mailto:contacto@cursosonlinejs.com"
                    className="text-sm md:text-[0.95rem] font-semibold text-slate-900 hover:text-slate-700"
                  >
                    contacto@cursosonlinejs.com
                  </a>
                  <p className="text-xs text-slate-500 mt-1">
                    Respuesta habitual en menos de 24 horas.
                  </p>
                </div>
              </div>

              <div className="flex items-start gap-3">
                <div className="mt-0.5 flex h-8 w-8 items-center justify-center rounded-2xl bg-amber-500 text-slate-900 text-sm shadow-sm">
                  🛠️
                </div>
                <div>
                  <p className="text-[0.7rem] font-semibold uppercase tracking-[0.16em] text-slate-500">
                    Soporte técnico
                  </p>
                  <p className="text-xs md:text-sm text-slate-600">
                    Problemas de acceso, errores en cursos o incidencias con tu
                    cuenta: envíanos el detalle, capturas de pantalla si es
                    posible, y el correo con el que te registraste.
                  </p>
                </div>
              </div>

              <div className="flex items-start gap-3">
                <div className="mt-0.5 flex h-8 w-8 items-center justify-center rounded-2xl bg-slate-100 text-slate-700 text-sm border border-dashed border-slate-300">
                  💡
                </div>
                <div>
                  <p className="text-[0.7rem] font-semibold uppercase tracking-[0.16em] text-slate-500">
                    Sugerencias y mejoras
                  </p>
                  <p className="text-xs md:text-sm text-slate-600">
                    ¿Tienes ideas para nuevos cursos, funcionalidades o mejoras
                    de diseño? Tu feedback ayuda a que la plataforma crezca.
                  </p>
                </div>
              </div>
            </div>

            <p className="pt-3 border-t border-dashed border-slate-200 text-[0.7rem] md:text-xs text-slate-500">
              CursosOnlineJS · Plataforma educativa en línea construida con
              React & Spring Boot.
            </p>
          </div>

          {/* Columna derecha: “tarjeta” de contacto rápida */}
          <div className="relative">
            <div className="h-full rounded-3xl border border-slate-200/80 bg-slate-900 text-amber-50 px-4 py-5 md:px-5 md:py-6 shadow-[0_16px_40px_rgba(15,23,42,0.55)] flex flex-col justify-between">
              <div className="space-y-3">
                <p className="text-[0.7rem] font-semibold uppercase tracking-[0.22em] text-slate-300">
                  Soporte & comunidad
                </p>
                <h2 className="text-lg md:text-xl font-semibold tracking-tight">
                  Antes de escribirnos, revisa:
                </h2>
                <ul className="mt-3 space-y-2.5 text-xs md:text-sm text-slate-100/90">
                  <li className="flex gap-2">
                    <span className="mt-0.5 text-amber-300">•</span>
                    <span>
                      Que tu conexión a internet sea estable y hayas probado a
                      recargar la página.
                    </span>
                  </li>
                  <li className="flex gap-2">
                    <span className="mt-0.5 text-amber-300">•</span>
                    <span>
                      Si el problema es con un curso concreto, indica el{" "}
                      <span className="font-semibold text-amber-200">
                        título del curso
                      </span>{" "}
                      y la lección donde ocurre.
                    </span>
                  </li>
                  <li className="flex gap-2">
                    <span className="mt-0.5 text-amber-300">•</span>
                    <span>
                      Si ves un error técnico, incluye el mensaje que aparece en
                      pantalla y el navegador que estás usando.
                    </span>
                  </li>
                </ul>
              </div>

              <div className="mt-5 rounded-2xl border border-slate-700/70 bg-slate-900/60 px-3 py-3 text-xs md:text-[0.8rem] text-slate-200 flex items-start gap-2">
                <span className="mt-0.5 text-amber-300">✦</span>
                <p>
                  Toda la información que compartas será usada solo para darte
                  soporte sobre la plataforma. No compartimos tus datos con
                  terceros.
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Contacto;

import React from "react";

const Contacto = () => {
  return (
    <div className="max-w-3xl mx-auto px-4 md:px-6 py-8 md:py-12">
      <div className="bg-white/95 rounded-3xl border border-slate-200 shadow-[0_18px_50px_rgba(15,23,42,0.18)] px-6 md:px-8 py-7 md:py-9 space-y-4">
        <h1 className="text-2xl md:text-3xl font-semibold text-slate-900 tracking-tight text-center md:text-left">
          Contacto
        </h1>

        <p className="text-sm md:text-base text-slate-600">
          Si tienes dudas, sugerencias o necesitas soporte, puedes escribirnos a{" "}
          <span className="font-semibold text-slate-900">
            contacto@cursosonline.com
          </span>
          .
        </p>

        <p className="text-sm md:text-base text-slate-600">
          Nuestro equipo técnico estará encantado de ayudarte con cualquier
          inconveniente relacionado con la plataforma o los cursos.
        </p>

        <div className="pt-3 border-t border-slate-100 text-xs md:text-sm text-slate-500">
          <p>CursosOnlineJS · Plataforma educativa en línea</p>
        </div>
      </div>
    </div>
  );
};

export default Contacto;

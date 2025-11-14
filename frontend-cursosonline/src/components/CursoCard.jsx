// src/components/CursoCard.jsx
import React from "react";
import { Link } from "react-router-dom";

const CursoCard = ({ curso }) => {
  if (!curso) return null;

  const {
    id,
    titulo,
    descripcion,
    categoria,
    nivel,
    precio,
    imagenPortadaUrl,
    estado,
  } = curso;

  const estadoUpper = (estado || "").toUpperCase();
  const esPublicado = estadoUpper === "PUBLICADO";

  return (
    <article
      className="
        group relative h-full 
        rounded-[28px] border border-slate-800/80 
        bg-slate-950/95 
        shadow-[0_20px_60px_rgba(15,23,42,0.9)] 
        overflow-hidden flex flex-col
        transition-transform duration-300 ease-out
        hover:-translate-y-1.5 hover:shadow-[0_28px_80px_rgba(15,23,42,1)]
      "
    >
      {/* Fondo decorativo suave */}
      <div
        className="
          pointer-events-none absolute inset-0
          bg-[radial-gradient(circle_at_top,_rgba(251,191,36,0.10),transparent_55%),radial-gradient(circle_at_bottom,_rgba(59,130,246,0.08),transparent_55%)]
          opacity-0 group-hover:opacity-100
          transition-opacity duration-300
        "
      />

      <div className="relative z-10 flex flex-col h-full">
        {/* Portada */}
        <div className="relative h-40 md:h-44 overflow-hidden">
          <img
            src={imagenPortadaUrl || "/no-image.png"}
            alt={titulo}
            onError={(e) => (e.target.src = "/no-image.png")}
            className="
              h-full w-full object-cover 
              transform transition-transform duration-500 
              group-hover:scale-[1.03]
            "
          />

          {esPublicado && (
            <div
              className="
                absolute top-3 left-3 
                rounded-full bg-emerald-500 
                text-emerald-50 px-3.5 py-1 
                text-[0.7rem] font-semibold uppercase tracking-[0.18em]
                flex items-center gap-1.5
                shadow-[0_8px_20px_rgba(16,185,129,0.55)]
              "
            >
              <span className="text-xs">●</span>
              <span>Publicado</span>
            </div>
          )}
        </div>

        {/* Texto */}
        <div className="flex-1 px-5 md:px-6 py-4 space-y-2">
          <h2 className="text-base md:text-lg font-semibold text-amber-50 tracking-tight line-clamp-2">
            {titulo}
          </h2>

          {descripcion && (
            <p className="text-xs md:text-sm text-slate-300/85 line-clamp-2">
              {descripcion}
            </p>
          )}

          <div className="mt-2 grid grid-cols-2 gap-2 text-[0.7rem] md:text-xs text-slate-300">
            <div className="space-y-0.5">
              <p className="font-semibold uppercase tracking-[0.16em] text-slate-500">
                Categoría
              </p>
              <p className="text-amber-100/95">
                {categoria || "Sin categoría"}
              </p>
            </div>
            <div className="space-y-0.5 text-right">
              <p className="font-semibold uppercase tracking-[0.16em] text-slate-500">
                Nivel
              </p>
              <p className="text-amber-100/95">
                {(nivel || "").toUpperCase() || "N/D"}
              </p>
            </div>

            <div className="space-y-0.5 col-span-2 flex items-center justify-between pt-1 border-t border-slate-800/70 mt-1">
              <span className="text-[0.65rem] uppercase tracking-[0.2em] text-slate-500">
                Precio
              </span>
              <span className="text-sm md:text-base font-semibold text-amber-300">
                {precio != null ? `${precio} USD` : "N/D"}
              </span>
            </div>
          </div>
        </div>

        {/* Botón */}
        <div className="px-5 md:px-6 pb-4">
          <Link
            to={`/cursos/${id}`}
            className="
              inline-flex w-full items-center justify-center 
              rounded-full bg-amber-400 text-slate-950 
              text-sm md:text-base font-semibold py-2.5
              shadow-[0_14px_40px_rgba(251,191,36,0.65)]
              hover:bg-amber-300 active:translate-y-px transition
            "
          >
            Ver detalles
          </Link>
        </div>
      </div>
    </article>
  );
};

export default CursoCard;

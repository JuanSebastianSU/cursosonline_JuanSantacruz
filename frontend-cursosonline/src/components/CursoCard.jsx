import React from "react";
import { Link } from "react-router-dom";
import "../assets/css/cursoCard.css";

/**
 * Componente que muestra una tarjeta con la información básica del curso
 */
const CursoCard = ({ curso }) => {
  const portada =
    curso.imagenPortadaUrl && curso.imagenPortadaUrl.trim() !== ""
      ? curso.imagenPortadaUrl
      : "/default-course.jpg";

  const getBadgeClass = (estado) => {
    const base =
      "inline-flex items-center rounded-full px-3 py-1 text-[0.7rem] font-semibold uppercase tracking-wide";
    if (!estado) return `${base} bg-sky-600/90 text-white`;

    switch (estado.toUpperCase()) {
      case "PUBLICADO":
        return `${base} bg-emerald-500/90 text-white`;
      case "BORRADOR":
        return `${base} bg-amber-400/90 text-slate-900`;
      case "ARCHIVADO":
        return `${base} bg-slate-500/95 text-white`;
      default:
        return `${base} bg-sky-600/90 text-white`;
    }
  };

  return (
    <article className="curso-card w-full max-w-xs bg-white rounded-2xl shadow-md border border-slate-100 overflow-hidden flex flex-col group hover:shadow-xl hover:-translate-y-1 transition-transform transition-shadow">
      <div className="relative w-full h-40 overflow-hidden">
        <img
          src={portada}
          alt={`Imagen del curso ${curso.titulo}`}
          className="curso-card-img w-full h-full object-cover group-hover:scale-[1.03] transition-transform"
        />
        {curso.estado && (
          <span className={`${getBadgeClass(curso.estado)} absolute top-3 left-3`}>
            {curso.estado}
          </span>
        )}
      </div>

      <div className="flex-1 flex flex-col px-4 py-4 gap-2">
        <h3 className="text-sm md:text-base font-semibold text-slate-900 line-clamp-2 min-h-[2.5em]">
          {curso.titulo}
        </h3>
        <p className="text-xs text-slate-600 line-clamp-3 min-h-[3.5em]">
          {curso.descripcion || "Sin descripción disponible."}
        </p>

        <div className="mt-1 flex flex-col gap-1 text-[0.75rem] text-slate-500">
          <p>
            <span className="font-semibold text-slate-700">Categoría:</span>{" "}
            {curso.categoria || "General"}
          </p>
          <p>
            <span className="font-semibold text-slate-700">Nivel:</span>{" "}
            {curso.nivel || "No especificado"}
          </p>
        </div>
      </div>

      <div className="px-4 pb-4 pt-1">
        <Link
          to={`/curso/${curso.id}`}
          className="btn-ver inline-flex items-center justify-center w-full rounded-full bg-primario-strong text-white text-xs md:text-sm font-semibold py-2.5 hover:bg-primario transition-colors"
        >
          Ver detalles
        </Link>
      </div>
    </article>
  );
};

export default CursoCard;

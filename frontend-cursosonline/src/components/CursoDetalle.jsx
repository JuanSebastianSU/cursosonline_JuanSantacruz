import React, { useEffect, useState } from "react";
import { useParams, Link } from "react-router-dom";
import { obtenerCurso } from "../services/cursoService";

/**
 * CursoDetalle.js
 * Muestra la información completa de un curso seleccionado.
 * Usa el endpoint /api/v1/cursos/{id}.
 */
const CursoDetalle = () => {
  const { id } = useParams();
  const [curso, setCurso] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    const fetchCurso = async () => {
      try {
        const data = await obtenerCurso(id);
        setCurso(data);
      } catch (err) {
        console.error("Error al cargar curso:", err);
        setError("No se pudo cargar el curso.");
      } finally {
        setLoading(false);
      }
    };
    fetchCurso();
  }, [id]);

  if (loading) {
    return (
      <div className="max-w-3xl mx-auto px-4 md:px-6 py-10 text-center text-sm md:text-base text-slate-500">
        Cargando curso...
      </div>
    );
  }

  if (error) {
    return (
      <div className="max-w-3xl mx-auto px-4 md:px-6 py-10">
        <p className="text-sm md:text-base text-rose-700 bg-rose-50 border border-rose-200 rounded-xl px-4 py-3 text-left">
          {error}
        </p>
      </div>
    );
  }

  if (!curso) {
    return (
      <div className="max-w-3xl mx-auto px-4 md:px-6 py-10 text-center text-sm md:text-base text-slate-600">
        No se encontró el curso solicitado.
      </div>
    );
  }

  const portada =
    curso.imagenPortadaUrl && curso.imagenPortadaUrl.trim() !== ""
      ? curso.imagenPortadaUrl
      : "/default-course.jpg";

  const precioTexto = curso.gratuito
    ? "Gratis"
    : `${curso.precio} ${curso.moneda || "USD"}`;

  return (
    <div className="max-w-5xl mx-auto px-4 md:px-6 py-8 md:py-12 space-y-6">
      {/* Tarjeta principal: imagen + info */}
      <section className="grid gap-6 lg:grid-cols-[minmax(0,2fr)_minmax(0,3fr)] bg-white/95 rounded-3xl border border-slate-100 shadow-[0_20px_60px_rgba(15,23,42,0.18)] overflow-hidden">
        {/* Imagen */}
        <div className="relative bg-slate-900/80">
          <div className="absolute inset-0 bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 opacity-80" />
          <div className="relative h-full flex items-stretch">
            <img
              src={portada}
              alt={`Imagen del curso ${curso.titulo}`}
              className="w-full h-full object-cover lg:rounded-l-3xl"
            />
          </div>
        </div>

        {/* Info */}
        <div className="flex flex-col gap-4 px-5 md:px-7 py-6 md:py-8">
          <div className="space-y-2">
            <p className="text-[0.7rem] md:text-xs uppercase tracking-[0.2em] text-slate-500">
              Curso online
            </p>
            <h1 className="text-2xl md:text-3xl font-semibold tracking-tight text-slate-900">
              {curso.titulo}
            </h1>
          </div>

          <p className="text-xs md:text-sm text-slate-600 leading-relaxed line-clamp-4">
            {curso.descripcion || "No hay descripción disponible."}
          </p>

          <dl className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs md:text-sm mt-1">
            <div>
              <dt className="font-semibold text-slate-700">Categoría</dt>
              <dd className="text-slate-600">
                {curso.categoria || "Sin categoría"}
              </dd>
            </div>
            <div>
              <dt className="font-semibold text-slate-700">Nivel</dt>
              <dd className="text-slate-600">
                {curso.nivel || "No especificado"}
              </dd>
            </div>
            <div>
              <dt className="font-semibold text-slate-700">Idioma</dt>
              <dd className="text-slate-600">
                {curso.idioma || "No especificado"}
              </dd>
            </div>
            <div>
              <dt className="font-semibold text-slate-700">Precio</dt>
              <dd className="text-slate-900 font-semibold">{precioTexto}</dd>
            </div>
          </dl>

          {/* Etiquetas */}
          {curso.etiquetas && curso.etiquetas.length > 0 && (
            <div className="mt-2">
              <h3 className="text-xs font-semibold uppercase tracking-wide text-slate-700 mb-1.5">
                Etiquetas
              </h3>
              <ul className="flex flex-wrap gap-2">
                {curso.etiquetas.map((tag, i) => (
                  <li
                    key={i}
                    className="inline-flex items-center rounded-full border border-slate-200 bg-slate-50 px-3 py-1 text-[0.7rem] font-medium text-slate-700"
                  >
                    {tag}
                  </li>
                ))}
              </ul>
            </div>
          )}

          {/* Botones acción */}
          <div className="mt-4 flex flex-col-reverse sm:flex-row sm:items-center sm:justify-between gap-3">
            <Link
              to="/cursos"
              className="inline-flex items-center justify-center rounded-full border border-slate-300 px-4 py-2 text-xs md:text-sm font-semibold text-slate-700 hover:bg-slate-100 active:translate-y-px transition"
            >
              <span className="mr-1.5">←</span>
              Volver al listado
            </Link>

            <button className="inline-flex items-center justify-center rounded-full bg-slate-900 px-6 py-2.5 text-xs md:text-sm font-semibold text-amber-100 shadow-sm hover:bg-slate-800 active:translate-y-px transition">
              Inscribirme
            </button>
          </div>
        </div>
      </section>

      {/* Bloque descripción larga (por si en el futuro hay más contenido) */}
      <section className="bg-white/95 rounded-3xl border border-slate-100 shadow-sm px-5 md:px-7 py-5 md:py-7">
        <h2 className="text-sm md:text-base font-semibold text-slate-900 mb-2.5">
          Descripción del curso
        </h2>
        <p className="text-xs md:text-sm text-slate-700 leading-relaxed">
          {curso.descripcion || "No hay descripción disponible."}
        </p>
      </section>
    </div>
  );
};

export default CursoDetalle;

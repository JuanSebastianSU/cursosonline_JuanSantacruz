// src/components/CursoForm.jsx
import React, { useEffect, useState } from "react";

const emptyCourse = {
  titulo: "",
  descripcion: "",
  categoria: "",
  nivel: "PRINCIPIANTE",
  idioma: "es",
  precio: 0,
  imagenPortadaUrl: "",
};

const CursoForm = ({
  mode = "crear",              // "crear" | "editar"
  initialValues = null,        // datos del curso si es edición
  onSubmit,                    // (values, portadaFile) => Promise | void
  isSubmitting = false,
}) => {
  const [form, setForm] = useState(() => ({
    ...emptyCourse,
    ...(initialValues || {}),
  }));

  const [portadaFile, setPortadaFile] = useState(null);
  const [errors, setErrors] = useState({});

  // Si cambian los initialValues (por ejemplo al cargar un curso a editar)
  useEffect(() => {
    if (initialValues) {
      setForm((prev) => ({
        ...prev,
        ...initialValues,
      }));
    }
  }, [initialValues]);

  const handleChange = (e) => {
    const { name, value } = e.target;

    setForm((prev) => ({
      ...prev,
      [name]:
        name === "precio"
          ? value === ""
            ? ""
            : Number(value)
          : value,
    }));
  };

  const handleFileChange = (e) => {
    const file = e.target.files?.[0] || null;
    setPortadaFile(file);
  };

  const validate = () => {
    const newErrors = {};
    if (!form.titulo?.trim()) newErrors.titulo = "El título es obligatorio.";
    if (!form.categoria?.trim())
      newErrors.categoria = "La categoría es obligatoria.";
    if (!form.idioma?.trim()) newErrors.idioma = "El idioma es obligatorio.";
    if (form.precio < 0) newErrors.precio = "El precio no puede ser negativo.";

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!onSubmit) return;

    if (!validate()) return;

    await onSubmit(form, portadaFile);
  };

  const tituloPagina =
    mode === "editar" ? "Editar curso" : "Crear un nuevo curso";

  const subtituloPagina =
    mode === "editar"
      ? "Ajusta la información de tu curso para mantenerla siempre actualizada."
      : "Define los detalles principales de tu curso antes de publicarlo.";

  return (
    <div className="max-w-6xl mx-auto px-4 md:px-6 py-8 md:py-10 space-y-6">
      {/* Encabezado artístico */}
      <section className="relative overflow-hidden rounded-3xl bg-gradient-to-r from-slate-900 via-slate-800 to-slate-900 px-5 md:px-8 py-7 md:py-8 text-amber-50 shadow-[0_18px_45px_rgba(15,23,42,0.65)]">
        {/* Garabatos decorativos */}
        <div className="pointer-events-none absolute -top-10 -left-10 h-32 w-32 rounded-full border border-amber-400/40" />
        <div className="pointer-events-none absolute -bottom-16 right-10 h-36 w-36 rotate-3 rounded-[2.5rem] border border-slate-500/40" />
        <div className="pointer-events-none absolute inset-y-0 right-0 w-40 bg-gradient-to-l from-amber-500/10 to-transparent" />

        <div className="relative flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
          <div className="space-y-1">
            <h1 className="text-2xl md:text-3xl font-semibold tracking-tight">
              {tituloPagina}
            </h1>
            <p className="max-w-2xl text-xs md:text-sm text-slate-200/85">
              {subtituloPagina}
            </p>
          </div>
          <div className="flex flex-col items-end text-right gap-1 text-[0.7rem] md:text-xs text-slate-300">
            <span className="uppercase tracking-[0.25em] text-amber-200/80">
              cursosonlinejs
            </span>
            <span className="inline-flex items-center gap-1 rounded-full bg-slate-900/60 px-3 py-1">
              <span className="h-1.5 w-1.5 rounded-full bg-emerald-400 animate-pulse" />
              <span className="font-medium">
                {mode === "editar" ? "Modo edición" : "Borrador"}
              </span>
            </span>
          </div>
        </div>
      </section>

      {/* Formulario principal */}
      <form
        onSubmit={handleSubmit}
        className="grid gap-6 lg:grid-cols-[minmax(0,2fr)_minmax(0,1.2fr)]"
      >
        {/* Columna izquierda: datos del curso */}
        <div className="space-y-4">
          <section className="rounded-3xl border border-slate-100 bg-white/95 px-4 py-5 md:px-6 md:py-6 shadow-[0_14px_40px_rgba(15,23,42,0.18)]">
            <h2 className="text-sm md:text-base font-semibold text-slate-900 mb-3">
              Información básica
            </h2>

            <div className="space-y-4 text-xs md:text-sm">
              {/* Título */}
              <div className="space-y-1">
                <label className="block text-[0.7rem] font-semibold uppercase tracking-wide text-slate-600">
                  Título del curso
                </label>
                <input
                  type="text"
                  name="titulo"
                  value={form.titulo}
                  onChange={handleChange}
                  required
                  className="w-full rounded-2xl border border-slate-300 bg-slate-50/60 px-3 py-2 text-xs md:text-sm text-slate-900 shadow-inner focus:border-slate-900 focus:outline-none focus:ring-2 focus:ring-slate-900/10"
                  placeholder="Ej: Introducción a la Programación con JavaScript"
                />
                {errors.titulo && (
                  <p className="text-[0.7rem] text-rose-600 mt-0.5">
                    {errors.titulo}
                  </p>
                )}
              </div>

              {/* Descripción */}
              <div className="space-y-1">
                <label className="block text-[0.7rem] font-semibold uppercase tracking-wide text-slate-600">
                  Descripción
                </label>
                <textarea
                  name="descripcion"
                  value={form.descripcion}
                  onChange={handleChange}
                  rows={4}
                  className="w-full rounded-2xl border border-slate-300 bg-slate-50/60 px-3 py-2 text-xs md:text-sm text-slate-900 shadow-inner focus:border-slate-900 focus:outline-none focus:ring-2 focus:ring-slate-900/10"
                  placeholder="Resume el objetivo, contenido y resultados de aprendizaje del curso."
                />
              </div>

              {/* Categoría + Nivel */}
              <div className="grid gap-4 md:grid-cols-2">
                <div className="space-y-1">
                  <label className="block text-[0.7rem] font-semibold uppercase tracking-wide text-slate-600">
                    Categoría
                  </label>
                  <input
                    type="text"
                    name="categoria"
                    value={form.categoria}
                    onChange={handleChange}
                    required
                    className="w-full rounded-2xl border border-slate-300 bg-slate-50/60 px-3 py-2 text-xs md:text-sm text-slate-900 shadow-inner focus:border-slate-900 focus:outline-none focus:ring-2 focus:ring-slate-900/10"
                    placeholder="Programación, Diseño, Matemáticas, etc."
                  />
                  {errors.categoria && (
                    <p className="text-[0.7rem] text-rose-600 mt-0.5">
                      {errors.categoria}
                    </p>
                  )}
                </div>

                <div className="space-y-1">
                  <label className="block text-[0.7rem] font-semibold uppercase tracking-wide text-slate-600">
                    Nivel
                  </label>
                  <select
                    name="nivel"
                    value={form.nivel}
                    onChange={handleChange}
                    className="w-full rounded-2xl border border-slate-300 bg-slate-50/60 px-3 py-2 text-xs md:text-sm text-slate-900 shadow-inner focus:border-slate-900 focus:outline-none focus:ring-2 focus:ring-slate-900/10"
                    required
                  >
                    <option value="PRINCIPIANTE">Principiante</option>
                    <option value="INTERMEDIO">Intermedio</option>
                    <option value="AVANZADO">Avanzado</option>
                  </select>
                </div>
              </div>

              {/* Idioma + Precio */}
              <div className="grid gap-4 md:grid-cols-2">
                <div className="space-y-1">
                  <label className="block text-[0.7rem] font-semibold uppercase tracking-wide text-slate-600">
                    Idioma (código ISO)
                  </label>
                  <input
                    type="text"
                    name="idioma"
                    value={form.idioma}
                    onChange={handleChange}
                    required
                    className="w-full rounded-2xl border border-slate-300 bg-slate-50/60 px-3 py-2 text-xs md:text-sm text-slate-900 shadow-inner focus:border-slate-900 focus:outline-none focus:ring-2 focus:ring-slate-900/10"
                    placeholder="es, en, fr..."
                  />
                  {errors.idioma && (
                    <p className="text-[0.7rem] text-rose-600 mt-0.5">
                      {errors.idioma}
                    </p>
                  )}
                </div>

                <div className="space-y-1">
                  <label className="block text-[0.7rem] font-semibold uppercase tracking-wide text-slate-600">
                    Precio (USD)
                  </label>
                  <input
                    type="number"
                    name="precio"
                    min="0"
                    step="0.01"
                    value={form.precio}
                    onChange={handleChange}
                    className="w-full rounded-2xl border border-slate-300 bg-slate-50/60 px-3 py-2 text-xs md:text-sm text-slate-900 shadow-inner focus:border-slate-900 focus:outline-none focus:ring-2 focus:ring-slate-900/10"
                  />
                  {errors.precio && (
                    <p className="text-[0.7rem] text-rose-600 mt-0.5">
                      {errors.precio}
                    </p>
                  )}
                </div>
              </div>
            </div>
          </section>

          {/* Botón enviar */}
          <div className="flex justify-end">
            <button
              type="submit"
              disabled={isSubmitting}
              className="inline-flex items-center justify-center rounded-full bg-slate-900 px-6 py-2.5 text-xs md:text-sm font-semibold text-amber-100 shadow-[0_10px_30px_rgba(15,23,42,0.45)] hover:bg-slate-800 active:translate-y-px disabled:opacity-60 disabled:cursor-not-allowed transition"
            >
              {isSubmitting
                ? "Guardando..."
                : mode === "editar"
                ? "Guardar cambios"
                : "Crear curso"}
            </button>
          </div>
        </div>

        {/* Columna derecha: portada y notas */}
        <div className="space-y-4">
          {/* Portada */}
          <section className="relative overflow-hidden rounded-3xl border border-slate-100 bg-slate-950 text-slate-50 px-4 py-5 md:px-5 md:py-6 shadow-[0_16px_40px_rgba(15,23,42,0.7)]">
            {/* trazos decorativos */}
            <div className="pointer-events-none absolute -top-6 -right-6 h-24 w-24 rounded-full border border-amber-400/30" />
            <div className="pointer-events-none absolute -bottom-10 left-4 h-28 w-28 rotate-6 border border-slate-700/50 rounded-[2rem]" />

            <div className="relative space-y-3 text-xs md:text-sm">
              <h2 className="text-sm md:text-base font-semibold text-amber-100">
                Portada del curso
              </h2>
              <p className="text-[0.75rem] text-slate-300">
                Sube una imagen representativa. Esto ayudará a los estudiantes a
                identificar tu curso rápidamente.
              </p>

              <div className="space-y-2">
                <input
                  type="file"
                  accept="image/*"
                  onChange={handleFileChange}
                  className="block w-full text-[0.7rem] text-slate-200 file:mr-3 file:rounded-full file:border-0 file:bg-amber-400 file:px-4 file:py-1.5 file:text-[0.7rem] file:font-semibold file:text-slate-900 hover:file:bg-amber-300"
                />
                {(form.imagenPortadaUrl || portadaFile) && (
                  <div className="mt-3 rounded-2xl border border-slate-800 bg-slate-900/70 p-2">
                    <p className="mb-2 text-[0.7rem] text-slate-400">
                      Vista previa:
                    </p>
                    <div className="aspect-[16/9] overflow-hidden rounded-xl border border-slate-800 bg-slate-950">
                      <img
                        src={
                          portadaFile
                            ? URL.createObjectURL(portadaFile)
                            : form.imagenPortadaUrl
                        }
                        alt="Portada del curso"
                        className="h-full w-full object-cover"
                        onError={(e) => {
                          e.target.src = "/default-course.jpg";
                        }}
                      />
                    </div>
                  </div>
                )}
              </div>
            </div>
          </section>

          {/* Notas / sugerencias */}
          <section className="rounded-3xl border border-dashed border-slate-300/80 bg-slate-50/80 px-4 py-4 md:px-5 md:py-5 text-xs md:text-[0.8rem] text-slate-700 shadow-sm">
            <h3 className="mb-1 text-[0.75rem] font-semibold uppercase tracking-wide text-slate-600">
              Consejos para un curso atractivo
            </h3>
            <ul className="list-disc pl-4 space-y-1">
              <li>Usa un título claro y directo.</li>
              <li>
                Explica en la descripción qué aprenderá el estudiante y qué
                requisitos previos existen.
              </li>
              <li>
                Elige una portada legible incluso en tamaño pequeño (miniatura).
              </li>
              <li>
                Ajusta el nivel para que los alumnos sepan si es para
                principiantes o avanzados.
              </li>
            </ul>
          </section>
        </div>
      </form>
    </div>
  );
};

export default CursoForm;

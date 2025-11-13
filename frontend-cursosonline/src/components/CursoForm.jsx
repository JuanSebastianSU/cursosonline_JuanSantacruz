import React, { useState, useEffect } from "react";
import {
  crearCurso,
  actualizarCurso,
  obtenerCurso,
  subirPortada,
} from "../services/cursoService";

/**
 * CursoForm.js
 * Formulario para crear o editar cursos.
 * Si recibe un `idCurso` (prop), carga el curso existente y permite editarlo.
 */

const CursoForm = ({ idCurso, onSave }) => {
  const [formData, setFormData] = useState({
    titulo: "",
    descripcion: "",
    categoria: "",
    nivel: "PRINCIPIANTE",
    idioma: "es",
    precio: 0,
    imagenPortadaUrl: "",
  });

  const [portadaFile, setPortadaFile] = useState(null);
  const [loading, setLoading] = useState(false);
  const [mensaje, setMensaje] = useState("");
  const [error, setError] = useState("");

  // Si hay idCurso => modo edición
  useEffect(() => {
    const cargarCurso = async () => {
      if (!idCurso) return;
      try {
        const data = await obtenerCurso(idCurso);
        setFormData({
          titulo: data.titulo || "",
          descripcion: data.descripcion || "",
          categoria: data.categoria || "",
          nivel: data.nivel || "PRINCIPIANTE",
          idioma: data.idioma || "es",
          precio: data.precio || 0,
          imagenPortadaUrl: data.imagenPortadaUrl || "",
        });
      } catch (err) {
        setError("No se pudo cargar el curso.");
      }
    };
    cargarCurso();
  }, [idCurso]);

  // Manejador genérico de inputs
  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  // Subir imagen
  const handleFileChange = (e) => {
    setPortadaFile(e.target.files[0]);
  };

  // Envío del formulario
  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError("");
    setMensaje("");

    try {
      let data;
      if (idCurso) {
        data = await actualizarCurso(idCurso, formData);
        setMensaje("Curso actualizado correctamente.");
      } else {
        data = await crearCurso(formData);
        setMensaje("Curso creado correctamente.");
      }

      // Subir portada si se eligió archivo
      if (portadaFile) {
        await subirPortada(data.id || idCurso, portadaFile);
        setMensaje((m) => m + " Portada subida con éxito.");
      }

      if (onSave) onSave();
    } catch (err) {
      console.error("Error al guardar curso:", err);
      setError("No se pudo guardar el curso.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-2xl md:max-w-3xl mx-auto px-4 md:px-6 py-6 md:py-8">
      <div className="bg-white/95 rounded-3xl border border-slate-100 shadow-[0_18px_55px_rgba(15,23,42,0.18)] px-5 md:px-8 py-6 md:py-8">
        <h2 className="text-xl md:text-2xl font-semibold text-slate-900 text-center md:text-left mb-4 md:mb-6 tracking-tight">
          {idCurso ? "Editar curso" : "Crear nuevo curso"}
        </h2>

        {mensaje && (
          <p className="mb-3 text-xs md:text-sm text-emerald-700 bg-emerald-50 border border-emerald-200 rounded-xl px-3 py-2">
            {mensaje}
          </p>
        )}

        {error && (
          <p className="mb-3 text-xs md:text-sm text-rose-700 bg-rose-50 border border-rose-200 rounded-xl px-3 py-2">
            {error}
          </p>
        )}

        <form onSubmit={handleSubmit} className="space-y-5 md:space-y-6">
          {/* Título */}
          <div className="space-y-1.5">
            <label className="text-xs font-semibold uppercase tracking-wide text-slate-700">
              Título
            </label>
            <input
              type="text"
              name="titulo"
              value={formData.titulo}
              onChange={handleChange}
              required
              className="w-full rounded-xl border border-slate-200 bg-slate-50/70 px-3 py-2 text-sm text-slate-900 shadow-inner focus:border-slate-900 focus:outline-none focus:ring-2 focus:ring-slate-900/10"
            />
          </div>

          {/* Descripción */}
          <div className="space-y-1.5">
            <label className="text-xs font-semibold uppercase tracking-wide text-slate-700">
              Descripción
            </label>
            <textarea
              name="descripcion"
              value={formData.descripcion}
              onChange={handleChange}
              rows={4}
              className="w-full rounded-xl border border-slate-200 bg-slate-50/70 px-3 py-2 text-sm text-slate-900 shadow-inner focus:border-slate-900 focus:outline-none focus:ring-2 focus:ring-slate-900/10"
            />
          </div>

          {/* Grid de campos básicos */}
          <div className="grid gap-4 md:gap-6 md:grid-cols-2">
            <div className="space-y-1.5">
              <label className="text-xs font-semibold uppercase tracking-wide text-slate-700">
                Categoría
              </label>
              <input
                type="text"
                name="categoria"
                value={formData.categoria}
                onChange={handleChange}
                required
                className="w-full rounded-xl border border-slate-200 bg-slate-50/70 px-3 py-2 text-sm text-slate-900 shadow-inner focus:border-slate-900 focus:outline-none focus:ring-2 focus:ring-slate-900/10"
              />
            </div>

            <div className="space-y-1.5">
              <label className="text-xs font-semibold uppercase tracking-wide text-slate-700">
                Nivel
              </label>
              <select
                name="nivel"
                value={formData.nivel}
                onChange={handleChange}
                required
                className="w-full rounded-xl border border-slate-200 bg-slate-50/70 px-3 py-2 text-sm text-slate-900 shadow-inner focus:border-slate-900 focus:outline-none focus:ring-2 focus:ring-slate-900/10"
              >
                <option value="PRINCIPIANTE">Principiante</option>
                <option value="INTERMEDIO">Intermedio</option>
                <option value="AVANZADO">Avanzado</option>
              </select>
            </div>

            <div className="space-y-1.5">
              <label className="text-xs font-semibold uppercase tracking-wide text-slate-700">
                Idioma (código ISO)
              </label>
              <input
                type="text"
                name="idioma"
                value={formData.idioma}
                onChange={handleChange}
                required
                className="w-full rounded-xl border border-slate-200 bg-slate-50/70 px-3 py-2 text-sm text-slate-900 shadow-inner focus:border-slate-900 focus:outline-none focus:ring-2 focus:ring-slate-900/10"
              />
            </div>

            <div className="space-y-1.5">
              <label className="text-xs font-semibold uppercase tracking-wide text-slate-700">
                Precio (USD)
              </label>
              <input
                type="number"
                name="precio"
                value={formData.precio}
                onChange={handleChange}
                min="0"
                step="0.01"
                className="w-full rounded-xl border border-slate-200 bg-slate-50/70 px-3 py-2 text-sm text-slate-900 shadow-inner focus:border-slate-900 focus:outline-none focus:ring-2 focus:ring-slate-900/10"
              />
            </div>
          </div>

          {/* Portada */}
          <div className="space-y-2">
            <label className="text-xs font-semibold uppercase tracking-wide text-slate-700">
              Portada (archivo)
            </label>
            <input
              type="file"
              accept="image/*"
              onChange={handleFileChange}
              className="block w-full text-xs md:text-sm text-slate-700 file:mr-3 file:rounded-full file:border-0 file:bg-slate-900 file:px-4 file:py-2 file:text-xs file:font-semibold file:text-amber-100 hover:file:bg-slate-800 cursor-pointer"
            />

            {formData.imagenPortadaUrl && (
              <div className="mt-3 text-center">
                <p className="text-xs text-slate-500 mb-1">Portada actual:</p>
                <img
                  src={formData.imagenPortadaUrl}
                  alt="Portada actual"
                  className="mx-auto max-h-52 w-full max-w-xs rounded-2xl border border-slate-200 object-cover shadow-md"
                />
              </div>
            )}
          </div>

          {/* Botón */}
          <div className="pt-2 flex justify-center md:justify-end">
            <button
              type="submit"
              disabled={loading}
              className="inline-flex items-center justify-center rounded-full bg-slate-900 px-6 py-2.5 text-xs md:text-sm font-semibold text-amber-100 shadow-sm hover:bg-slate-800 active:translate-y-px disabled:opacity-60 disabled:cursor-not-allowed transition"
            >
              {loading
                ? "Guardando..."
                : idCurso
                ? "Actualizar curso"
                : "Crear curso"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default CursoForm;

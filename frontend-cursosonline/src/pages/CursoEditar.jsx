import React, { useContext, useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { AuthContext } from "../context/AuthContext";
import api from "../services/api";

const CursoEditar = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { user } = useContext(AuthContext); // por si luego quieres usarlo

  const [curso, setCurso] = useState(null);
  const [guardando, setGuardando] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    const fetchCurso = async () => {
      try {
        const res = await api.get(`/v1/cursos/${id}`);
        setCurso(res.data);
      } catch (err) {
        console.error("Error al cargar curso:", err);
        setError("No se pudo cargar la información del curso.");
      }
    };
    fetchCurso();
  }, [id]);

  const esPublicado =
    curso &&
    (curso.estado?.toUpperCase() === "PUBLICADO" ||
      curso.estado?.toLowerCase() === "publicado");

  const handleChange = (e) => {
    if (esPublicado) return;
    const { name, value } = e.target;
    setCurso((prev) => ({ ...prev, [name]: value }));
  };

  const handleGuardar = async () => {
    if (!curso) return;

    if (esPublicado) {
      alert(
        "No se puede editar un curso publicado. Archívalo para poder modificarlo."
      );
      return;
    }

    setGuardando(true);
    setError("");

    try {
      await api.put(`/v1/cursos/${id}`, curso);
      alert("Curso actualizado correctamente.");
      navigate("/instructor/cursos");
    } catch (err) {
      console.error("Error al actualizar:", err);
      setError("No se pudo guardar los cambios.");
    } finally {
      setGuardando(false);
    }
  };

  const handleCancelar = () => {
    navigate("/instructor/cursos");
  };

  if (error && !curso) {
    return (
      <div className="max-w-xl mx-auto px-4 py-10 text-center text-sm text-rose-600">
        {error}
      </div>
    );
  }

  if (!curso) {
    return (
      <div className="max-w-xl mx-auto px-4 py-10 text-center text-sm text-slate-500">
        Cargando curso...
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto px-4 md:px-6 py-8 md:py-10">
      <h1 className="text-2xl md:text-3xl font-semibold text-slate-900 mb-6 text-center md:text-left tracking-tight">
        Editar curso
      </h1>

      <div className="bg-white/95 rounded-3xl border border-slate-100 shadow-[0_20px_60px_rgba(15,23,42,0.15)] px-5 md:px-8 py-6 md:py-8 space-y-6">
        {/* Alerta si está publicado */}
        {esPublicado && (
          <div className="flex items-start gap-3 rounded-2xl border border-amber-300 bg-amber-50 px-4 py-3 text-xs md:text-sm text-amber-900">
            <span className="text-lg leading-none">⚠️</span>
            <p>
              Este curso está <strong>PUBLICADO</strong> y no puede ser
              modificado. Archívalo para poder editarlo.
            </p>
          </div>
        )}

        {error && !esPublicado && (
          <p className="text-sm text-rose-600">{error}</p>
        )}

        <form
          className="space-y-6"
          onSubmit={(e) => {
            e.preventDefault();
            handleGuardar();
          }}
        >
          {/* Título */}
          <div className="space-y-1.5">
            <label className="text-xs font-semibold uppercase tracking-wide text-slate-700">
              Título
            </label>
            <input
              type="text"
              name="titulo"
              value={curso.titulo || ""}
              onChange={handleChange}
              disabled={esPublicado}
              className="w-full rounded-xl border border-slate-200 bg-slate-50/60 px-3 py-2 text-sm text-slate-900 shadow-inner focus:border-slate-900 focus:outline-none focus:ring-2 focus:ring-slate-900/10 disabled:opacity-60 disabled:cursor-not-allowed"
            />
          </div>

          {/* Descripción */}
          <div className="space-y-1.5">
            <label className="text-xs font-semibold uppercase tracking-wide text-slate-700">
              Descripción
            </label>
            <textarea
              name="descripcion"
              rows={4}
              value={curso.descripcion || ""}
              onChange={handleChange}
              disabled={esPublicado}
              className="w-full rounded-xl border border-slate-200 bg-slate-50/60 px-3 py-2 text-sm text-slate-900 shadow-inner focus:border-slate-900 focus:outline-none focus:ring-2 focus:ring-slate-900/10 disabled:opacity-60 disabled:cursor-not-allowed"
            />
          </div>

          {/* Grid de datos básicos */}
          <div className="grid gap-4 md:gap-6 md:grid-cols-2">
            <div className="space-y-1.5">
              <label className="text-xs font-semibold uppercase tracking-wide text-slate-700">
                Categoría
              </label>
              <input
                type="text"
                name="categoria"
                value={curso.categoria || ""}
                onChange={handleChange}
                disabled={esPublicado}
                className="w-full rounded-xl border border-slate-200 bg-slate-50/60 px-3 py-2 text-sm text-slate-900 shadow-inner focus:border-slate-900 focus:outline-none focus:ring-2 focus:ring-slate-900/10 disabled:opacity-60 disabled:cursor-not-allowed"
              />
            </div>

            <div className="space-y-1.5">
              <label className="text-xs font-semibold uppercase tracking-wide text-slate-700">
                Nivel
              </label>
              <select
                name="nivel"
                value={curso.nivel || ""}
                onChange={handleChange}
                disabled={esPublicado}
                className="w-full rounded-xl border border-slate-200 bg-slate-50/60 px-3 py-2 text-sm text-slate-900 shadow-inner focus:border-slate-900 focus:outline-none focus:ring-2 focus:ring-slate-900/10 disabled:opacity-60 disabled:cursor-not-allowed"
              >
                <option value="PRINCIPIANTE">Principiante</option>
                <option value="INTERMEDIO">Intermedio</option>
                <option value="AVANZADO">Avanzado</option>
              </select>
            </div>

            <div className="space-y-1.5">
              <label className="text-xs font-semibold uppercase tracking-wide text-slate-700">
                Idioma
              </label>
              <input
                type="text"
                name="idioma"
                value={curso.idioma || ""}
                onChange={handleChange}
                disabled={esPublicado}
                className="w-full rounded-xl border border-slate-200 bg-slate-50/60 px-3 py-2 text-sm text-slate-900 shadow-inner focus:border-slate-900 focus:outline-none focus:ring-2 focus:ring-slate-900/10 disabled:opacity-60 disabled:cursor-not-allowed"
              />
            </div>

            <div className="space-y-1.5">
              <label className="text-xs font-semibold uppercase tracking-wide text-slate-700">
                Precio (USD)
              </label>
              <input
                type="number"
                name="precio"
                step="0.01"
                value={curso.precio ?? 0}
                onChange={handleChange}
                disabled={esPublicado}
                className="w-full rounded-xl border border-slate-200 bg-slate-50/60 px-3 py-2 text-sm text-slate-900 shadow-inner focus:border-slate-900 focus:outline-none focus:ring-2 focus:ring-slate-900/10 disabled:opacity-60 disabled:cursor-not-allowed"
              />
            </div>
          </div>

          {/* Imagen de portada */}
          <div className="space-y-2">
            <label className="text-xs font-semibold uppercase tracking-wide text-slate-700">
              Imagen de portada (URL)
            </label>
            <input
              type="text"
              name="imagenPortadaUrl"
              value={curso.imagenPortadaUrl || ""}
              onChange={handleChange}
              disabled={esPublicado}
              className="w-full rounded-xl border border-slate-200 bg-slate-50/60 px-3 py-2 text-sm text-slate-900 shadow-inner focus:border-slate-900 focus:outline-none focus:ring-2 focus:ring-slate-900/10 disabled:opacity-60 disabled:cursor-not-allowed"
            />

            {curso.imagenPortadaUrl && (
              <div className="mt-3">
                <img
                  src={curso.imagenPortadaUrl}
                  alt="Portada del curso"
                  className="max-h-56 w-full max-w-md rounded-2xl border border-slate-200 object-cover shadow-md"
                />
              </div>
            )}
          </div>

          {/* Botones */}
          <div className="mt-6 flex flex-col-reverse gap-3 sm:flex-row sm:justify-end">
            <button
              type="button"
              onClick={handleCancelar}
              className="inline-flex items-center justify-center rounded-full border border-slate-300 px-4 py-2 text-xs md:text-sm font-semibold text-slate-700 hover:bg-slate-100 active:translate-y-px transition"
            >
              Cancelar
            </button>

            <button
              type="submit"
              disabled={guardando || esPublicado}
              className="inline-flex items-center justify-center rounded-full bg-slate-900 px-5 py-2 text-xs md:text-sm font-semibold text-amber-100 shadow-sm hover:bg-slate-800 active:translate-y-px disabled:opacity-60 disabled:cursor-not-allowed transition"
            >
              {guardando ? "Guardando..." : "Guardar cambios"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default CursoEditar;

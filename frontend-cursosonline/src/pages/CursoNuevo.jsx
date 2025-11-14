import React, { useState, useRef, useContext } from "react";
import { useNavigate } from "react-router-dom";
import { crearCurso } from "../services/cursoService";
import { AuthContext } from "../context/AuthContext";
import api from "../services/api";

const CursoNuevo = () => {
  const navigate = useNavigate();
  const { user, updateUser } = useContext(AuthContext);

  const [curso, setCurso] = useState({
    titulo: "",
    descripcion: "",
    categoria: "",
    nivel: "PRINCIPIANTE",
    idioma: "Español",
    precio: "",
    imagenPortadaUrl: "",
  });

  const [errores, setErrores] = useState({});
  const [guardando, setGuardando] = useState(false);

  const refs = {
    titulo: useRef(null),
    categoria: useRef(null),
    nivel: useRef(null),
    idioma: useRef(null),
    precio: useRef(null),
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    setCurso((prev) => ({ ...prev, [name]: value }));
    setErrores((prev) => ({ ...prev, [name]: "" }));
  };

  const validarCampos = () => {
    const nuevosErrores = {};

    if (!curso.titulo.trim()) nuevosErrores.titulo = "El título es obligatorio";
    if (!curso.categoria.trim())
      nuevosErrores.categoria = "La categoría es obligatoria";
    if (!curso.nivel.trim()) nuevosErrores.nivel = "Selecciona un nivel";
    if (!curso.idioma.trim())
      nuevosErrores.idioma = "El idioma es obligatorio";

    if (curso.precio === "" || isNaN(parseFloat(curso.precio))) {
      nuevosErrores.precio = "Ingresa un precio válido";
    }

    const primerError = Object.keys(nuevosErrores)[0];
    if (primerError && refs[primerError]?.current) {
      refs[primerError].current.focus();
    }

    setErrores(nuevosErrores);
    return Object.keys(nuevosErrores).length === 0;
  };

  const handleGuardar = async () => {
    if (!validarCampos()) return;

    setGuardando(true);
    try {
      const res = await crearCurso({
        ...curso,
        precio: parseFloat(curso.precio.toString().replace(",", ".")),
      });

      const { token, rol } = res || {};

      if (token) {
        localStorage.setItem("token", token);
        api.defaults.headers.common["Authorization"] = `Bearer ${token}`;
      }

      if (rol) {
        const roleNorm = rol.toUpperCase().startsWith("ROLE_")
          ? rol.toUpperCase()
          : `ROLE_${rol.toUpperCase()}`;

        const actuales = Array.isArray(user?.roles)
          ? user.roles
              .map((r) => (typeof r === "string" ? r : r?.nombre))
              .filter(Boolean)
          : [];

        const set = new Set([...actuales, roleNorm]);

        updateUser({
          rol: rol,
          roles: Array.from(set),
        });
      }

      alert("Curso creado correctamente.");
      navigate("/instructor/cursos");
    } catch (err) {
      console.error("Error al crear curso:", err);
      alert("No se pudo crear el curso.");
    } finally {
      setGuardando(false);
    }
  };

  const handleCancelar = () => navigate("/instructor/cursos");

  return (
    <div className="max-w-5xl mx-auto px-4 md:px-6 py-8 md:py-10 space-y-7">
      {/* HEADER ARTÍSTICO */}
      <section className="relative overflow-hidden rounded-3xl border border-slate-800/60 bg-slate-950 text-amber-50 shadow-[0_22px_60px_rgba(15,23,42,0.85)] px-5 md:px-8 py-7 md:py-8">
        {/* manchas / garabatos */}
        <div className="pointer-events-none absolute -top-10 -left-10 h-32 w-32 rounded-full bg-amber-400/15 blur-2xl" />
        <div className="pointer-events-none absolute -bottom-14 -right-10 h-40 w-40 rounded-[40%] bg-cyan-400/10 blur-3xl" />
        <div className="pointer-events-none absolute inset-x-10 bottom-0 h-px bg-gradient-to-r from-transparent via-amber-400/40 to-transparent opacity-70" />

        <div className="relative flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
          <div>
            <p className="text-[0.7rem] uppercase tracking-[0.3em] text-amber-200/80">
              Panel del instructor
            </p>
            <h1 className="mt-1 text-2xl md:text-3xl font-semibold tracking-tight">
              Crear nuevo curso
            </h1>
            <p className="mt-2 text-xs md:text-sm text-slate-200/85 max-w-xl">
              Define el título, la descripción, el nivel, el idioma y el precio
              de tu curso. Podrás editarlo luego desde “Mis cursos”.
            </p>
          </div>

          <div className="mt-2 flex flex-col items-end gap-2 text-right">
            <span className="inline-flex items-center rounded-full border border-amber-300/60 bg-amber-100/5 px-3 py-1 text-[0.7rem] font-semibold uppercase tracking-[0.2em] text-amber-200">
              Nuevo · Borrador
            </span>
            <p className="text-[0.7rem] text-slate-300/80 max-w-[14rem]">
              La imagen de portada es opcional, pero ayuda a destacar tu curso.
            </p>
          </div>
        </div>
      </section>

      {/* TARJETA DEL FORMULARIO */}
      <section className="bg-white/95 rounded-3xl border border-slate-100 shadow-[0_20px_60px_rgba(15,23,42,0.15)] px-5 md:px-8 py-6 md:py-8">
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
              ref={refs.titulo}
              type="text"
              name="titulo"
              value={curso.titulo}
              onChange={handleChange}
              className={
                "w-full rounded-xl border px-3 py-2 text-sm shadow-inner bg-slate-50/60 text-slate-900 focus:outline-none focus:ring-2 focus:ring-slate-900/10 focus:border-slate-900 " +
                (errores.titulo
                  ? "border-rose-400 bg-rose-50/60"
                  : "border-slate-200")
              }
            />
            {errores.titulo && (
              <p className="text-xs text-rose-600">{errores.titulo}</p>
            )}
          </div>

          {/* Descripción */}
          <div className="space-y-1.5">
            <label className="text-xs font-semibold uppercase tracking-wide text-slate-700">
              Descripción
            </label>
            <textarea
              name="descripcion"
              rows={4}
              value={curso.descripcion}
              onChange={handleChange}
              className="w-full rounded-xl border border-slate-200 bg-slate-50/60 px-3 py-2 text-sm text-slate-900 shadow-inner focus:border-slate-900 focus:outline-none focus:ring-2 focus:ring-slate-900/10"
            />
          </div>

          {/* Grid de datos básicos */}
          <div className="grid gap-4 md:gap-6 md:grid-cols-2">
            {/* Categoría */}
            <div className="space-y-1.5">
              <label className="text-xs font-semibold uppercase tracking-wide text-slate-700">
                Categoría
              </label>
              <input
                ref={refs.categoria}
                type="text"
                name="categoria"
                value={curso.categoria}
                onChange={handleChange}
                className={
                  "w-full rounded-xl border px-3 py-2 text-sm shadow-inner bg-slate-50/60 text-slate-900 focus:outline-none focus:ring-2 focus:ring-slate-900/10 focus:border-slate-900 " +
                  (errores.categoria
                    ? "border-rose-400 bg-rose-50/60"
                    : "border-slate-200")
                }
              />
              {errores.categoria && (
                <p className="text-xs text-rose-600">{errores.categoria}</p>
              )}
            </div>

            {/* Nivel */}
            <div className="space-y-1.5">
              <label className="text-xs font-semibold uppercase tracking-wide text-slate-700">
                Nivel
              </label>
              <select
                ref={refs.nivel}
                name="nivel"
                value={curso.nivel}
                onChange={handleChange}
                className={
                  "w-full rounded-xl border px-3 py-2 text-sm shadow-inner bg-slate-50/60 text-slate-900 focus:outline-none focus:ring-2 focus:ring-slate-900/10 focus:border-slate-900 " +
                  (errores.nivel
                    ? "border-rose-400 bg-rose-50/60"
                    : "border-slate-200")
                }
              >
                <option value="PRINCIPIANTE">Principiante</option>
                <option value="INTERMEDIO">Intermedio</option>
                <option value="AVANZADO">Avanzado</option>
              </select>
              {errores.nivel && (
                <p className="text-xs text-rose-600">{errores.nivel}</p>
              )}
            </div>

            {/* Idioma */}
            <div className="space-y-1.5">
              <label className="text-xs font-semibold uppercase tracking-wide text-slate-700">
                Idioma
              </label>
              <input
                ref={refs.idioma}
                type="text"
                name="idioma"
                value={curso.idioma}
                onChange={handleChange}
                className={
                  "w-full rounded-xl border px-3 py-2 text-sm shadow-inner bg-slate-50/60 text-slate-900 focus:outline-none focus:ring-2 focus:ring-slate-900/10 focus:border-slate-900 " +
                  (errores.idioma
                    ? "border-rose-400 bg-rose-50/60"
                    : "border-slate-200")
                }
              />
              {errores.idioma && (
                <p className="text-xs text-rose-600">{errores.idioma}</p>
              )}
            </div>

            {/* Precio */}
            <div className="space-y-1.5">
              <label className="text-xs font-semibold uppercase tracking-wide text-slate-700">
                Precio (USD)
              </label>
              <input
                ref={refs.precio}
                type="text"
                name="precio"
                value={curso.precio}
                onChange={handleChange}
                className={
                  "w-full rounded-xl border px-3 py-2 text-sm shadow-inner bg-slate-50/60 text-slate-900 focus:outline-none focus:ring-2 focus:ring-slate-900/10 focus:border-slate-900 " +
                  (errores.precio
                    ? "border-rose-400 bg-rose-50/60"
                    : "border-slate-200")
                }
              />
              {errores.precio && (
                <p className="text-xs text-rose-600">{errores.precio}</p>
              )}
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
              value={curso.imagenPortadaUrl}
              onChange={handleChange}
              className="w-full rounded-xl border border-slate-200 bg-slate-50/60 px-3 py-2 text-sm text-slate-900 shadow-inner focus:border-slate-900 focus:outline-none focus:ring-2 focus:ring-slate-900/10"
            />

            {curso.imagenPortadaUrl && (
              <div className="mt-3 text-center">
                <img
                  src={curso.imagenPortadaUrl}
                  alt="Vista previa"
                  onError={(e) => (e.target.style.display = "none")}
                  className="mx-auto max-h-56 w-full max-w-md rounded-2xl border border-slate-200 object-cover shadow-md"
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
              disabled={guardando}
              className="inline-flex items-center justify-center rounded-full bg-slate-900 px-5 py-2 text-xs md:text-sm font-semibold text-amber-100 shadow-sm hover:bg-slate-800 active:translate-y-px disabled:opacity-60 disabled:cursor-not-allowed transition"
            >
              {guardando ? "Guardando..." : "Crear curso"}
            </button>
          </div>
        </form>
      </section>
    </div>
  );
};

export default CursoNuevo;

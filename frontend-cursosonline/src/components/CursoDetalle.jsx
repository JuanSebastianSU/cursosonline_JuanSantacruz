// src/pages/CursoDetalle.jsx
import React, { useContext, useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { AuthContext } from "../context/AuthContext";
import { obtenerCurso } from "../services/cursoService";
import { listarModulos } from "../services/moduloService";
import {
  inscribirseEnCurso,
  obtenerMiInscripcionEnCurso,
} from "../services/inscripcionService";

const CursoDetalle = () => {
  const { id } = useParams(); // id del curso
  const navigate = useNavigate();
  const { isAuthenticated } = useContext(AuthContext);

  const [curso, setCurso] = useState(null);
  const [loadingCurso, setLoadingCurso] = useState(true);
  const [errorCurso, setErrorCurso] = useState("");

  const [modulos, setModulos] = useState([]);
  const [loadingModulos, setLoadingModulos] = useState(true);
  const [errorModulos, setErrorModulos] = useState("");

  const [inscripcion, setInscripcion] = useState(null);
  const [procesandoInscripcion, setProcesandoInscripcion] = useState(false);

  // ------------ helpers ------------
  const estadoChip = (estado) => {
    const e = (estado || "").toUpperCase();
    if (e === "PUBLICADO") return "bg-emerald-500 text-emerald-950";
    if (e === "BORRADOR") return "bg-slate-500 text-slate-50";
    if (e === "ARCHIVADO") return "bg-slate-700 text-slate-200";
    return "bg-slate-500 text-slate-50";
  };

  const formatNivel = (nivel) => {
    if (!nivel) return "Sin nivel";
    const map = {
      PRINCIPIANTE: "Principiante",
      INTERMEDIO: "Intermedio",
      AVANZADO: "Avanzado",
    };
    return map[nivel] || nivel;
  };

  // ------------ cargar curso ------------
  useEffect(() => {
    const fetchCurso = async () => {
      setLoadingCurso(true);
      setErrorCurso("");
      try {
        const data = await obtenerCurso(id);
        setCurso(data);
      } catch (err) {
        console.error(err);
        setErrorCurso("No se pudo cargar la información del curso.");
      } finally {
        setLoadingCurso(false);
      }
    };

    fetchCurso();
  }, [id]);

  // ------------ cargar módulos ------------
  useEffect(() => {
    const fetchModulos = async () => {
      setLoadingModulos(true);
      setErrorModulos("");
      try {
        const data = await listarModulos(id);
        setModulos(data || []);
      } catch (err) {
        console.error(err);
        setErrorModulos("No se pudo cargar el contenido del curso.");
      } finally {
        setLoadingModulos(false);
      }
    };

    fetchModulos();
  }, [id]);

  // ------------ cargar mi inscripción ------------
  useEffect(() => {
    if (!isAuthenticated) {
      setInscripcion(null);
      return;
    }

    const fetchMiInscripcion = async () => {
      try {
        const data = await obtenerMiInscripcionEnCurso(id);
        setInscripcion(data || null);
      } catch (err) {
        // 404 => no inscrito; otros errores se loguean
        if (err.response?.status === 404) {
          setInscripcion(null);
        } else {
          console.error("Error al cargar inscripción:", err);
        }
      }
    };

    fetchMiInscripcion();
  }, [id, isAuthenticated]);

  // ------------ inscribirse ------------
  const handleInscribirme = async () => {
    if (!isAuthenticated) {
      navigate("/login", { state: { from: `/cursos/${id}` } });
      return;
    }

    setProcesandoInscripcion(true);
    try {
      const nueva = await inscribirseEnCurso(id);
      setInscripcion(nueva);
      alert("Inscripción creada. Estado: " + (nueva.estado || "PENDIENTE"));
    } catch (err) {
      console.error(err);
      const msg =
        err.response?.data?.message ||
        "No se pudo completar la inscripción a este curso.";
      alert(msg);
    } finally {
      setProcesandoInscripcion(false);
    }
  };

  // ------------ render ------------

  if (loadingCurso) {
    return (
      <div className="max-w-5xl mx-auto px-4 md:px-6 py-10 text-center text-sm md:text-base text-slate-300">
        Cargando curso...
      </div>
    );
  }

  if (errorCurso || !curso) {
    return (
      <div className="max-w-5xl mx-auto px-4 md:px-6 py-10 text-center text-sm md:text-base text-rose-400">
        {errorCurso || "Curso no encontrado."}
      </div>
    );
  }
const estadoIns = (inscripcion?.estado || "").toLowerCase();
const tieneAccesoCurso =
  estadoIns === "activa" || estadoIns === "completada";

  const estaPublicado = curso.estado?.toUpperCase() === "PUBLICADO";

  return (
    <div className="max-w-6xl mx-auto px-4 md:px-6 py-8 md:py-10 space-y-7">
      {/* Volver */}
      <button
        type="button"
        onClick={() => navigate("/cursos")}
        className="inline-flex items-center gap-2 rounded-full border border-slate-700/70 bg-slate-950/80 px-4 py-1.5 text-[0.7rem] md:text-xs font-semibold uppercase tracking-[0.22em] text-slate-200 hover:border-amber-400/80 hover:text-amber-200 hover:bg-slate-900 transition-colors"
      >
        <span className="text-sm">←</span> Volver al catálogo
      </button>

      {/* Header del curso */}
      <section className="relative overflow-hidden rounded-[2.5rem] border border-slate-800 bg-gradient-to-r from-slate-950 via-slate-900 to-slate-950 px-5 md:px-8 py-6 md:py-7 shadow-[0_24px_90px_rgba(0,0,0,0.95)]">
        {/* garabatos de fondo */}
        <div className="pointer-events-none absolute -left-24 -top-24 h-64 w-64 rounded-full border border-slate-700/60" />
        <div className="pointer-events-none absolute -right-16 -bottom-28 h-72 w-72 rounded-[40%] border border-slate-800/70" />

        <div className="relative flex flex-col gap-3">
          <div className="flex items-center gap-3 flex-wrap">
            <span className="inline-flex items-center rounded-full bg-emerald-400/90 px-3 py-1 text-[0.7rem] font-semibold uppercase tracking-[0.22em] text-emerald-950 shadow-[0_0_25px_rgba(16,185,129,0.8)]">
              Curso
            </span>
            {curso.estado && (
              <span
                className={`inline-flex items-center rounded-full px-3 py-1 text-[0.7rem] font-semibold uppercase tracking-[0.22em] ${estadoChip(
                  curso.estado
                )}`}
              >
                {curso.estado}
              </span>
            )}
          </div>

          <h1 className="text-2xl md:text-3xl lg:text-4xl font-semibold tracking-tight text-slate-50">
            {curso.titulo}
          </h1>
          {curso.descripcion && (
            <p className="max-w-2xl text-xs md:text-sm text-slate-300/90">
              {curso.descripcion}
            </p>
          )}
        </div>
      </section>

      {/* Bloque principal: imagen + info + botón */}
      <section className="relative overflow-hidden rounded-[2.5rem] border border-slate-800 bg-slate-950/95 shadow-[0_24px_90px_rgba(0,0,0,0.95)]">
        <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_top_left,rgba(250,204,21,0.12),transparent_55%),radial-gradient(circle_at_bottom_right,rgba(56,189,248,0.14),transparent_60%)]" />

        <div className="relative grid gap-6 lg:grid-cols-[minmax(0,1.4fr)_minmax(0,1fr)] items-stretch px-5 md:px-8 py-6 md:py-8">
          {/* Imagen */}
          <div className="flex items-center justify-center">
            <div className="relative w-full max-w-md overflow-hidden rounded-[2rem] bg-slate-900/80 border border-slate-700/70 shadow-[0_20px_70px_rgba(15,23,42,0.9)]">
              <div className="absolute inset-0 bg-gradient-to-b from-slate-100/80 via-slate-300/60 to-slate-700/90 mix-blend-screen" />
              {curso.imagenPortadaUrl && (
                <img
                  src={curso.imagenPortadaUrl}
                  alt={curso.titulo}
                  className="relative h-full w-full object-cover"
                  onError={(e) => (e.target.style.display = "none")}
                />
              )}
            </div>
          </div>

          {/* Info lateral */}
          <div className="flex flex-col justify-between gap-4">
            <div className="space-y-3">
              <div className="grid grid-cols-2 gap-3 text-xs md:text-sm">
                <div>
                  <p className="text-[0.7rem] font-semibold uppercase tracking-[0.2em] text-slate-400">
                    Categoría
                  </p>
                  <p className="text-slate-50">
                    {curso.categoria || "Sin categoría"}
                  </p>
                </div>
                <div>
                  <p className="text-[0.7rem] font-semibold uppercase tracking-[0.2em] text-slate-400">
                    Nivel
                  </p>
                  <p className="text-slate-50">{formatNivel(curso.nivel)}</p>
                </div>
                <div>
                  <p className="text-[0.7rem] font-semibold uppercase tracking-[0.2em] text-slate-400">
                    Idioma
                  </p>
                  <p className="text-slate-50">{curso.idioma || "Español"}</p>
                </div>
                <div>
                  <p className="text-[0.7rem] font-semibold uppercase tracking-[0.2em] text-slate-400">
                    Precio
                  </p>
                  <p className="text-amber-300 font-semibold">
                    {curso.precio != null ? `${curso.precio} USD` : "Gratis"}
                  </p>
                </div>
              </div>

              <p className="text-xs md:text-sm text-slate-300/90">
                Una vez inscrito, podrás acceder al contenido completo del curso
                desde tu panel.
              </p>
            </div>

            {/* Botón de inscribirse */}
            <div className="flex justify-end">
              <button
                type="button"
                disabled={!estaPublicado || procesandoInscripcion}
                onClick={handleInscribirme}
                className="inline-flex items-center justify-center rounded-full bg-slate-50 px-6 py-2.5 text-xs md:text-sm font-semibold tracking-[0.22em] uppercase text-slate-950 shadow-[0_0_40px_rgba(248,250,252,0.9)] hover:bg-amber-200 hover:text-slate-950 active:translate-y-px disabled:opacity-60 disabled:cursor-not-allowed transition"
              >
                {inscripcion
                  ? "Ya estás inscrito"
                  : procesandoInscripcion
                  ? "Procesando..."
                  : "Inscribirme"}
              </button>
            </div>
          </div>
        </div>
      </section>

      {/* Sobre este curso */}
      <section className="rounded-[2.5rem] border border-slate-800 bg-slate-950/95 px-5 md:px-8 py-6 md:py-7 shadow-[0_24px_90px_rgba(0,0,0,0.95)] space-y-4">
        <h2 className="text-lg md:text-xl font-semibold text-slate-50 tracking-tight">
          Sobre este curso
        </h2>
        <p className="text-xs md:text-sm text-slate-300/90 whitespace-pre-line">
          {curso.descripcion || "El instructor aún no ha agregado una descripción detallada."}
        </p>
      </section>

      {/* CONTENIDO: MÓDULOS */}
      <section className="rounded-[2.5rem] border border-slate-800 bg-slate-950/95 px-5 md:px-8 py-6 md:py-7 shadow-[0_24px_90px_rgba(0,0,0,0.95)] space-y-4">
        <div className="flex items-center justify-between gap-3 flex-wrap">
          <h2 className="text-lg md:text-xl font-semibold text-slate-50 tracking-tight">
            Contenido del curso
          </h2>
          {modulos.length > 0 && (
            <p className="text-[0.7rem] md:text-xs uppercase tracking-[0.22em] text-slate-400">
              {modulos.length} módulo{modulos.length > 1 ? "s" : ""} publicados
            </p>
          )}
        </div>

        {loadingModulos ? (
          <p className="text-xs md:text-sm text-slate-300">Cargando módulos...</p>
        ) : errorModulos ? (
          <p className="text-xs md:text-sm text-rose-400">{errorModulos}</p>
        ) : modulos.length === 0 ? (
          <p className="text-xs md:text-sm text-slate-400">
            El contenido del curso aún no está disponible.
          </p>
        ) : (
          <div className="space-y-3 md:space-y-4">
            {modulos
              .slice()
              .sort((a, b) => (a.orden || 0) - (b.orden || 0))
              .map((mod, index) => (
                <div
                  key={mod.id}
                  className="group relative flex gap-4 rounded-2xl border border-slate-800/80 bg-slate-900/70 px-4 py-3 md:px-5 md:py-4 hover:border-amber-300/80 hover:bg-slate-900/90 transition-colors"
                >
                  {/* “timeline” círculo a la izquierda */}
                  <div className="flex flex-col items-center pt-1">
                    <div className="h-7 w-7 rounded-full border border-amber-300/70 bg-slate-950 flex items-center justify-center text-[0.7rem] font-semibold text-amber-200 shadow-[0_0_18px_rgba(252,211,77,0.7)]">
                      {mod.orden || index + 1}
                    </div>
                    {index < modulos.length - 1 && (
                      <div className="mt-1 h-full w-px bg-slate-700/70" />
                    )}
                  </div>

                  {/* Info del módulo */}
                  <div className="flex-1 space-y-1">
                    <div className="flex items-start justify-between gap-3 flex-wrap">
                      <h3 className="text-sm md:text-base font-semibold text-slate-50">
                        {mod.titulo || `Módulo ${mod.orden || index + 1}`}
                      </h3>
                      <span className="inline-flex items-center rounded-full border border-slate-700/80 bg-slate-950/70 px-2.5 py-1 text-[0.65rem] font-semibold uppercase tracking-[0.22em] text-slate-300 group-hover:border-amber-300/80 group-hover:text-amber-200">
                        {mod.estado || "PUBLICADO"}
                      </span>
                    </div>

                    {mod.descripcion && (
                      <p className="text-[0.75rem] md:text-xs text-slate-300/90 line-clamp-2">
                        {mod.descripcion}
                      </p>
                    )}

                    {tieneAccesoCurso && (
                      <div className="mt-2 flex justify-end">
                        <button
                          type="button"
                          onClick={() => navigate(`/cursos/${id}/modulos/${mod.id}`)}
                          className="inline-flex items-center justify-center rounded-full bg-slate-900 px-3 py-1.5 text-[0.7rem] md:text-xs font-semibold uppercase tracking-[0.18em] text-amber-200 border border-slate-600/80 hover:bg-slate-800 active:translate-y-px transition"
                        >
                          Ver contenido
                        </button>
                      </div>
                    )}
                  </div>

                </div>
              ))}
          </div>
        )}
      </section>
    </div>
  );
};

export default CursoDetalle;

import React, { useEffect, useState, useContext } from "react";
import { useNavigate } from "react-router-dom";
import { listarCursos } from "../services/cursoService";
import CursoCard from "../components/CursoCard";
import { AuthContext } from "../context/AuthContext";
import "../assets/css/cursos.css";

/**
 * Cursos.js
 * Lista los cursos publicados y muestra el botón "Crear curso"
 * solo a usuarios autenticados sin rol de instructor ni admin.
 */
const Cursos = () => {
  const { user, isAuthenticated } = useContext(AuthContext);
  const navigate = useNavigate();

  const [cursos, setCursos] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [paginaActual, setPaginaActual] = useState(1);

  const cursosPorPagina = 6;

  useEffect(() => {
    const fetchCursos = async () => {
      try {
        const data = await listarCursos({ estado: "PUBLICADO" });
        setCursos(data.content || []);
      } catch (err) {
        console.error("Error cargando cursos:", err);
        setError("No se pudieron cargar los cursos.");
      } finally {
        setLoading(false);
      }
    };
    fetchCursos();
  }, []);

  const indexUltimo = paginaActual * cursosPorPagina;
  const indexPrimero = indexUltimo - cursosPorPagina;
  const cursosActuales = cursos.slice(indexPrimero, indexUltimo);
  const totalPaginas = Math.ceil(cursos.length / cursosPorPagina);

  const siguientePagina = () => {
    if (paginaActual < totalPaginas) setPaginaActual(paginaActual + 1);
  };

  const anteriorPagina = () => {
    if (paginaActual > 1) setPaginaActual(paginaActual - 1);
  };

  const tieneRol = (rol) => {
    if (!user?.roles) return false;
    return user.roles.some((r) =>
      typeof r === "string" ? r === rol : r.nombre === rol
    );
  };

  const handleCrearCurso = () => navigate("/instructor/cursos/nuevo");

  return (
    <div className="cursos-container max-w-6xl mx-auto px-4 md:px-6 py-8 md:py-12">
      <header className="cursos-header flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 mb-6 border-b border-slate-200 pb-4">
        <div className="space-y-1">
          <h2 className="text-2xl md:text-3xl font-semibold text-slate-900">
            Listado de cursos
          </h2>
          <p className="text-xs md:text-sm text-slate-500">
            Explora los cursos publicados en la plataforma. Filtra por página
            según tu ritmo.
          </p>
        </div>

        {isAuthenticated &&
          !tieneRol("ROLE_INSTRUCTOR") &&
          !tieneRol("ROLE_ADMIN") && (
            <button
              className="btn-crear-curso inline-flex items-center justify-center rounded-full bg-primario-strong text-white text-xs md:text-sm font-semibold px-4 py-2 shadow-md hover:bg-primario transition-colors"
              onClick={handleCrearCurso}
            >
              Crear mi primer curso
            </button>
          )}
      </header>

      {loading && (
        <p className="text-sm text-slate-500 mb-4">Cargando cursos...</p>
      )}

      {error && (
        <p className="text-xs md:text-sm text-red-700 bg-red-50 border border-red-200 rounded-lg px-3 py-2 mb-4 text-left">
          {error}
        </p>
      )}

      {!loading && cursos.length === 0 && (
        <p className="text-sm text-slate-500">
          No hay cursos disponibles en este momento.
        </p>
      )}

      {cursos.length > 0 && (
        <>
          <div className="cursos-grid grid gap-6 sm:grid-cols-2 lg:grid-cols-3 mb-8">
            {cursosActuales.map((curso) => (
              <CursoCard key={curso.id} curso={curso} />
            ))}
          </div>

          {totalPaginas > 1 && (
            <div className="paginacion flex items-center justify-center gap-4 text-sm text-slate-600">
              <button
                className="btn-paginacion inline-flex items-center rounded-full border border-slate-300 px-3 py-1.5 text-xs md:text-sm font-semibold hover:bg-slate-100 disabled:opacity-40 disabled:cursor-not-allowed"
                onClick={anteriorPagina}
                disabled={paginaActual === 1}
              >
                ⬅ Anterior
              </button>
              <span className="text-xs md:text-sm">
                Página{" "}
                <span className="font-semibold text-slate-900">
                  {paginaActual}
                </span>{" "}
                de{" "}
                <span className="font-semibold text-slate-900">
                  {totalPaginas}
                </span>
              </span>
              <button
                className="btn-paginacion inline-flex items-center rounded-full border border-slate-300 px-3 py-1.5 text-xs md:text-sm font-semibold hover:bg-slate-100 disabled:opacity-40 disabled:cursor-not-allowed"
                onClick={siguientePagina}
                disabled={paginaActual === totalPaginas}
              >
                Siguiente ➡
              </button>
            </div>
          )}
        </>
      )}
    </div>
  );
};

export default Cursos;

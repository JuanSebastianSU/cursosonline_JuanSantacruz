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

  // ✅ Redirige correctamente al formulario
  const handleCrearCurso = () => navigate("/instructor/cursos/nuevo");

  return (
    <div className="cursos-container">
      <div className="cursos-header">
        <h2>Listado de Cursos</h2>

        {/* 🔹 Solo visible si es usuario logueado y NO es instructor ni admin */}
        {isAuthenticated &&
          !tieneRol("ROLE_INSTRUCTOR") &&
          !tieneRol("ROLE_ADMIN") && (
            <button className="btn-crear-curso" onClick={handleCrearCurso}>
              Crear mi primer curso
            </button>
          )}
      </div>

      {loading && <p>Cargando cursos...</p>}
      {error && <p className="error">{error}</p>}
      {!loading && cursos.length === 0 && <p>No hay cursos disponibles.</p>}

      <div className="cursos-grid">
        {cursosActuales.map((curso) => (
          <CursoCard key={curso.id} curso={curso} />
        ))}
      </div>

      {totalPaginas > 1 && (
        <div className="paginacion">
          <button
            className="btn-paginacion"
            onClick={anteriorPagina}
            disabled={paginaActual === 1}
          >
            ⬅ Anterior
          </button>
          <span>
            Página {paginaActual} de {totalPaginas}
          </span>
          <button
            className="btn-paginacion"
            onClick={siguientePagina}
            disabled={paginaActual === totalPaginas}
          >
            Siguiente ➡
          </button>
        </div>
      )}
    </div>
  );
};

export default Cursos;

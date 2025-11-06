import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import {
  listarCursos,
  publicarCurso,
  archivarCurso,
  eliminarCurso,
} from "../services/cursoService";
import "../assets/css/cursoAdmin.css"; // ✅ volvemos al estilo bonito original del admin

/**
 * CursoAdmin.js
 * Panel completo para el Administrador con diseño limpio, moderno y ordenado.
 */
const CursoAdmin = () => {
  const [cursos, setCursos] = useState([]);
  const [recientes, setRecientes] = useState([]);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  useEffect(() => {
    cargarCursos();
  }, []);

  const cargarCursos = async () => {
    try {
      const data = await listarCursos();
      setCursos(data.content || []);
      setRecientes(
        (data.content || [])
          .slice(0, 5)
          .map((c) => ({
            titulo: c.titulo,
            estado: c.estado,
            fecha: c.fechaCreacion || "N/D",
          }))
      );
    } catch (err) {
      console.error("Error al cargar cursos:", err);
      alert("Error al cargar los cursos.");
    } finally {
      setLoading(false);
    }
  };

  const handlePublicar = async (id) => {
    try {
      await publicarCurso(id);
      cargarCursos();
    } catch {
      alert("Error al publicar el curso.");
    }
  };

  const handleArchivar = async (id) => {
    try {
      await archivarCurso(id);
      cargarCursos();
    } catch {
      alert("Error al archivar el curso.");
    }
  };

  const handleEliminar = async (id) => {
    if (window.confirm("¿Seguro que deseas eliminar este curso?")) {
      try {
        await eliminarCurso(id);
        cargarCursos();
      } catch {
        alert("Error al eliminar el curso.");
      }
    }
  };

  const getBadgeClass = (estado) => {
    switch (estado?.toUpperCase()) {
      case "PUBLICADO":
        return "badge badge-publicado";
      case "BORRADOR":
        return "badge badge-borrador";
      case "ARCHIVADO":
        return "badge badge-archivado";
      default:
        return "badge";
    }
  };

  return (
    <div className="admin-container">
      <h1 className="admin-title">Administración de Cursos</h1>

      <div className="admin-actions">
        <button
          className="btn-crear"
          onClick={() => navigate("/admin/cursos/nuevo")}
        >
          + Crear nuevo curso
        </button>
      </div>

      <div className="tabla-wrapper">
        {loading ? (
          <p>Cargando cursos...</p>
        ) : cursos.length === 0 ? (
          <p>No hay cursos registrados.</p>
        ) : (
          <table className="tabla-cursos">
            <thead>
              <tr>
                <th>TÍTULO</th>
                <th>CATEGORÍA</th>
                <th>NIVEL</th>
                <th>ESTADO</th>
                <th>PRECIO</th>
                <th>ACCIONES</th>
              </tr>
            </thead>
            <tbody>
              {cursos.map((curso) => (
                <tr key={curso.id}>
                  <td>{curso.titulo}</td>
                  <td>{curso.categoria}</td>
                  <td>{curso.nivel}</td>
                  <td>
                    <span className={getBadgeClass(curso.estado)}>
                      {curso.estado}
                    </span>
                  </td>
                  <td>{curso.precio} USD</td>
                  <td className="acciones">
                    <button
                      className="btn-editar"
                      onClick={() =>
                        navigate(`/admin/cursos/editar/${curso.id}`)
                      }
                    >
                      ✏️
                    </button>
                    <button
                      className="btn-eliminar"
                      onClick={() => handleEliminar(curso.id)}
                    >
                      🗑️
                    </button>
                    {curso.estado === "PUBLICADO" ? (
                      <button
                        className="btn-archivar"
                        onClick={() => handleArchivar(curso.id)}
                      >
                        📦
                      </button>
                    ) : (
                      <button
                        className="btn-publicar"
                        onClick={() => handlePublicar(curso.id)}
                      >
                        🚀
                      </button>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>

      {/* ======= ACTIVIDAD ======= */}
      <section className="actividad-card">
        <h2>Actividad reciente</h2>
        {recientes.length === 0 ? (
          <p>No hay actividad reciente disponible.</p>
        ) : (
          <ul>
            {recientes.map((act, i) => (
              <li key={i} className="actividad-item">
                <strong>{act.titulo}</strong> — {act.estado} ({act.fecha})
              </li>
            ))}
          </ul>
        )}
      </section>
    </div>
  );
};

export default CursoAdmin;

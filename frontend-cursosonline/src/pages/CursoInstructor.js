import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import {
  listarCursos,
  publicarCurso,
  archivarCurso,
  eliminarCurso,
} from "../services/cursoService";
import "../assets/css/cursoAdmin.css"; // 🔄 CAMBIO: antes usaba dashboard.css

/**
 * CursoInstructor.js
 * Panel del Instructor (ahora con estilo del Admin)
 */
const CursoInstructor = () => {
  const [cursos, setCursos] = useState([]);
  const navigate = useNavigate();

  useEffect(() => {
    cargarCursos();
  }, []);

  const cargarCursos = async () => {
  try {
    // 👇 agregamos el parámetro mis:true para que el backend devuelva
    // TODOS los cursos del instructor (borrador, publicado, archivado, etc.)
    const data = await listarCursos({ mis: true });
    setCursos(data.content || []);
  } catch (err) {
    console.error("Error al cargar cursos:", err);
    alert("Error al cargar tus cursos.");
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
      <h1 className="admin-title">Mis Cursos (Instructor)</h1>

      <div className="admin-actions">
        <button
          className="btn-crear"
          onClick={() => navigate("/instructor/cursos/nuevo")}
        >
          + Crear nuevo curso
        </button>
      </div>

      <div className="tabla-wrapper">
        <table className="tabla-cursos">
          <thead>
            <tr>
              <th>Título</th>
              <th>Categoría</th>
              <th>Nivel</th>
              <th>Estado</th>
              <th>Precio</th>
              <th>Acciones</th>
            </tr>
          </thead>
          <tbody>
  {cursos.map((curso) => (
    <tr key={curso.id}>
      <td data-label="Título">{curso.titulo}</td>
      <td data-label="Categoría">{curso.categoria}</td>
      <td data-label="Nivel">{curso.nivel}</td>
      <td data-label="Estado">
        <span className={getBadgeClass(curso.estado)}>{curso.estado}</span>
      </td>
      <td data-label="Precio">{curso.precio} USD</td>
      <td data-label="Acciones" className="acciones">
        <button className="btn-editar" onClick={() => navigate(`/instructor/cursos/editar/${curso.id}`)}>✏️</button>
        <button className="btn-eliminar" onClick={() => handleEliminar(curso.id)}>🗑️</button>
        {curso.estado === "PUBLICADO" ? (
          <button className="btn-archivar" onClick={() => handleArchivar(curso.id)}>📦</button>
        ) : (
          <button className="btn-publicar" onClick={() => handlePublicar(curso.id)}>🚀</button>
        )}
      </td>
    </tr>
  ))}
</tbody>

        </table>
      </div>
    </div>
  );
};

export default CursoInstructor;

import React, { useEffect, useState } from "react";
import { useParams, Link } from "react-router-dom";
import { obtenerCurso } from "../services/cursoService";
import "../assets/css/cursoDetalle.css";

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

  if (loading) return <p className="curso-detalle-loading">Cargando curso...</p>;
  if (error) return <p className="curso-detalle-error">{error}</p>;
  if (!curso) return <p>No se encontró el curso solicitado.</p>;

  const portada =
    curso.imagenPortadaUrl && curso.imagenPortadaUrl.trim() !== ""
      ? curso.imagenPortadaUrl
      : "/default-course.jpg";

  return (
    <div className="curso-detalle-container">
      <div className="curso-detalle-header">
        <img
          src={portada}
          alt={`Imagen del curso ${curso.titulo}`}
          className="curso-detalle-img"
        />
        <div className="curso-detalle-info">
          <h1>{curso.titulo}</h1>
          <p className="curso-detalle-categoria">
            <strong>Categoría:</strong> {curso.categoria}
          </p>
          <p>
            <strong>Nivel:</strong> {curso.nivel}
          </p>
          <p>
            <strong>Idioma:</strong> {curso.idioma}
          </p>
          <p>
            <strong>Precio:</strong>{" "}
            {curso.gratuito
              ? "Gratis"
              : `${curso.precio} ${curso.moneda || "USD"}`}
          </p>
        </div>
      </div>

      <div className="curso-detalle-body">
        <h2>Descripción</h2>
        <p>{curso.descripcion || "No hay descripción disponible."}</p>

        {curso.etiquetas && curso.etiquetas.length > 0 && (
          <>
            <h3>Etiquetas</h3>
            <ul className="curso-etiquetas">
              {curso.etiquetas.map((tag, i) => (
                <li key={i}>{tag}</li>
              ))}
            </ul>
          </>
        )}

        <div className="curso-detalle-acciones">
          <Link to="/cursos" className="btn-volver">
            ← Volver al listado
          </Link>
          <button className="btn-inscribirse">Inscribirme</button>
        </div>
      </div>
    </div>
  );
};

export default CursoDetalle;

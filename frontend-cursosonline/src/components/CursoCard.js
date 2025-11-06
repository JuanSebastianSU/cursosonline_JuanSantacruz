import React from "react";
import "../assets/css/cursoCard.css";

/**
 * Componente que muestra una tarjeta con la información básica del curso
 */
const CursoCard = ({ curso }) => {
  const portada =
    curso.imagenPortadaUrl && curso.imagenPortadaUrl.trim() !== ""
      ? curso.imagenPortadaUrl
      : "/default-course.jpg";

  const getBadgeClass = (estado) => {
    switch (estado?.toUpperCase()) {
      case "PUBLICADO":
        return "badge badge-publicado";
      case "BORRADOR":
        return "badge badge-borrador";
      case "ARCHIVADO":
        return "badge badge-archivado";
      default:
        return "badge badge-default";
    }
  };

  return (
    <div className="curso-card">
      <img
        src={portada}
        alt={`Imagen del curso ${curso.titulo}`}
        className="curso-card-img"
      />
      <h3>{curso.titulo}</h3>
      <p>{curso.descripcion || "Sin descripción disponible."}</p>
      <p>
        <strong>Categoría:</strong> {curso.categoria}
      </p>
      <p>
        <strong>Nivel:</strong> {curso.nivel}
      </p>

      {/* Etiqueta visual de estado */}
      {curso.estado && (
        <span className={getBadgeClass(curso.estado)}>{curso.estado}</span>
      )}

      <a href={`/curso/${curso.id}`} className="btn-ver">
        Ver detalles
      </a>
    </div>
  );
};

export default CursoCard;

import React, { useState, useEffect } from "react";
import {
  crearCurso,
  actualizarCurso,
  obtenerCurso,
  subirPortada,
} from "../services/cursoService";
import "../assets/css/cursoForm.css";

/**
 * CursoForm.js
 * Formulario para crear o editar cursos.
 * Si recibe un `id` (prop), carga el curso existente y permite editarlo.
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
    <div className="curso-form-container">
      <h2>{idCurso ? "Editar Curso" : "Crear Nuevo Curso"}</h2>

      {mensaje && <p className="msg-success">{mensaje}</p>}
      {error && <p className="msg-error">{error}</p>}

      <form onSubmit={handleSubmit} className="curso-form">
        <label>Título</label>
        <input
          type="text"
          name="titulo"
          value={formData.titulo}
          onChange={handleChange}
          required
        />

        <label>Descripción</label>
        <textarea
          name="descripcion"
          value={formData.descripcion}
          onChange={handleChange}
          rows={4}
        />

        <label>Categoría</label>
        <input
          type="text"
          name="categoria"
          value={formData.categoria}
          onChange={handleChange}
          required
        />

        <label>Nivel</label>
        <select
          name="nivel"
          value={formData.nivel}
          onChange={handleChange}
          required
        >
          <option value="PRINCIPIANTE">Principiante</option>
          <option value="INTERMEDIO">Intermedio</option>
          <option value="AVANZADO">Avanzado</option>
        </select>

        <label>Idioma (código ISO)</label>
        <input
          type="text"
          name="idioma"
          value={formData.idioma}
          onChange={handleChange}
          required
        />

        <label>Precio (USD)</label>
        <input
          type="number"
          name="precio"
          value={formData.precio}
          onChange={handleChange}
          min="0"
          step="0.01"
        />

        <label>Portada</label>
        <input type="file" accept="image/*" onChange={handleFileChange} />

        {formData.imagenPortadaUrl && (
          <div className="preview-container">
            <p>Portada actual:</p>
            <img
              src={formData.imagenPortadaUrl}
              alt="Portada actual"
              className="preview-img"
            />
          </div>
        )}

        <button type="submit" disabled={loading}>
          {loading ? "Guardando..." : idCurso ? "Actualizar" : "Crear"}
        </button>
      </form>
    </div>
  );
};

export default CursoForm;

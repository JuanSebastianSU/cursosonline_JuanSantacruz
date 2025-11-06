import React, { useContext, useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { AuthContext } from "../context/AuthContext";
import api from "../services/api";
import "../assets/css/dashboard.css";

const CursoEditar = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { user } = useContext(AuthContext);

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

  const handleChange = (e) => {
    if (
      curso.estado?.toUpperCase() === "PUBLICADO" ||
      curso.estado?.toLowerCase() === "publicado"
    )
      return;
    const { name, value } = e.target;
    setCurso((prev) => ({ ...prev, [name]: value }));
  };

  const handleGuardar = async () => {
    if (!curso) return;
    if (
      curso.estado?.toUpperCase() === "PUBLICADO" ||
      curso.estado?.toLowerCase() === "publicado"
    ) {
      alert("No se puede editar un curso publicado. Archívalo para modificarlo.");
      return;
    }
    setGuardando(true);
    try {
      await api.put(`/v1/cursos/${id}`, curso);
      alert("Curso actualizado correctamente.");
      navigate("/instructor/cursos");
    } catch (err) {
      console.error("Error al actualizar:", err);
      alert("No se pudo guardar los cambios.");
    } finally {
      setGuardando(false);
    }
  };

  const handleCancelar = () => {
    navigate("/instructor/cursos");
  };

  if (error) return <p>{error}</p>;
  if (!curso) return <p>Cargando curso...</p>;

  const bloqueado =
    curso.estado?.toUpperCase() === "PUBLICADO" ||
    curso.estado?.toLowerCase() === "publicado";

  return (
    <div className="dashboard-container">
      <h1>Editar curso</h1>

      <form className="form-editar-curso">
        {bloqueado && (
          <div className="alerta-publicado">
            ⚠️ Este curso está <strong>PUBLICADO</strong> y no puede ser modificado.
          </div>
        )}

        <div className="form-grupo">
          <label>Título:</label>
          <input
            type="text"
            name="titulo"
            value={curso.titulo || ""}
            onChange={handleChange}
            disabled={bloqueado}
          />
        </div>

        <div className="form-grupo">
          <label>Descripción:</label>
          <textarea
            name="descripcion"
            rows="4"
            value={curso.descripcion || ""}
            onChange={handleChange}
            disabled={bloqueado}
          ></textarea>
        </div>

        <div className="form-grid">
          <div className="form-grupo">
            <label>Categoría:</label>
            <input
              type="text"
              name="categoria"
              value={curso.categoria || ""}
              onChange={handleChange}
              disabled={bloqueado}
            />
          </div>

          <div className="form-grupo">
            <label>Nivel:</label>
            <select
              name="nivel"
              value={curso.nivel || ""}
              onChange={handleChange}
              disabled={bloqueado}
            >
              <option value="PRINCIPIANTE">Principiante</option>
              <option value="INTERMEDIO">Intermedio</option>
              <option value="AVANZADO">Avanzado</option>
            </select>
          </div>

          <div className="form-grupo">
            <label>Idioma:</label>
            <input
              type="text"
              name="idioma"
              value={curso.idioma || ""}
              onChange={handleChange}
              disabled={bloqueado}
            />
          </div>

          <div className="form-grupo">
            <label>Precio ($):</label>
            <input
              type="number"
              name="precio"
              step="0.01"
              value={curso.precio || 0}
              onChange={handleChange}
              disabled={bloqueado}
            />
          </div>
        </div>

        <div className="form-grupo">
          <label>Imagen de portada (URL):</label>
          <input
            type="text"
            name="imagenPortadaUrl"
            value={curso.imagenPortadaUrl || ""}
            onChange={handleChange}
            disabled={bloqueado}
          />
          {curso.imagenPortadaUrl && (
            <img
              src={curso.imagenPortadaUrl}
              alt="Portada"
              className="preview-portada"
            />
          )}
        </div>

        <div className="form-botones">
          <button
            type="button"
            className="btn-guardar"
            onClick={handleGuardar}
            disabled={guardando || bloqueado}
          >
            {guardando ? "Guardando..." : "Guardar cambios"}
          </button>
          <button type="button" className="btn-cancelar" onClick={handleCancelar}>
            Cancelar
          </button>
        </div>
      </form>
    </div>
  );
};

export default CursoEditar;

import React, { useState, useRef, useContext } from "react";
import { useNavigate } from "react-router-dom";
import { crearCurso } from "../services/cursoService";
import { AuthContext } from "../context/AuthContext";
import "../assets/css/dashboard.css";

const CursoNuevo = () => {
  const navigate = useNavigate();
  const { user, updateUser } = useContext(AuthContext); // ✅ usamos el método oficial del contexto

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
    if (!curso.idioma.trim()) nuevosErrores.idioma = "El idioma es obligatorio";
    if (curso.precio === "" || isNaN(parseFloat(curso.precio)))
      nuevosErrores.precio = "Ingresa un precio válido";

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

      alert("Curso creado correctamente.");

      // ✅ Si el backend devuelve nuevoRol, actualizamos el usuario local
      if (res.nuevoRol && !user?.roles?.includes(res.nuevoRol)) {
        updateUser({
          roles: [...(user?.roles || []), res.nuevoRol],
        });

        alert("🎉 ¡Felicidades! Ahora eres instructor.");
      }

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
    <div className="dashboard-container">
      <h1>Crear nuevo curso</h1>

      <form className="form-editar-curso" onSubmit={(e) => e.preventDefault()}>
        <div className="form-grupo">
          <label>Título:</label>
          <input
            ref={refs.titulo}
            type="text"
            name="titulo"
            value={curso.titulo}
            onChange={handleChange}
            className={errores.titulo ? "input-error" : ""}
          />
          {errores.titulo && <p className="error-text">{errores.titulo}</p>}
        </div>

        <div className="form-grupo">
          <label>Descripción:</label>
          <textarea
            name="descripcion"
            rows="4"
            value={curso.descripcion}
            onChange={handleChange}
          ></textarea>
        </div>

        <div className="form-grid">
          <div className="form-grupo">
            <label>Categoría:</label>
            <input
              ref={refs.categoria}
              type="text"
              name="categoria"
              value={curso.categoria}
              onChange={handleChange}
              className={errores.categoria ? "input-error" : ""}
            />
            {errores.categoria && (
              <p className="error-text">{errores.categoria}</p>
            )}
          </div>

          <div className="form-grupo">
            <label>Nivel:</label>
            <select
              ref={refs.nivel}
              name="nivel"
              value={curso.nivel}
              onChange={handleChange}
              className={errores.nivel ? "input-error" : ""}
            >
              <option value="PRINCIPIANTE">Principiante</option>
              <option value="INTERMEDIO">Intermedio</option>
              <option value="AVANZADO">Avanzado</option>
            </select>
            {errores.nivel && <p className="error-text">{errores.nivel}</p>}
          </div>

          <div className="form-grupo">
            <label>Idioma:</label>
            <input
              ref={refs.idioma}
              type="text"
              name="idioma"
              value={curso.idioma}
              onChange={handleChange}
              className={errores.idioma ? "input-error" : ""}
            />
            {errores.idioma && <p className="error-text">{errores.idioma}</p>}
          </div>

          <div className="form-grupo">
            <label>Precio ($):</label>
            <input
              ref={refs.precio}
              type="text"
              name="precio"
              value={curso.precio}
              onChange={handleChange}
              className={errores.precio ? "input-error" : ""}
            />
            {errores.precio && <p className="error-text">{errores.precio}</p>}
          </div>
        </div>

        <div className="form-grupo">
          <label>Imagen de portada (URL):</label>
          <input
            type="text"
            name="imagenPortadaUrl"
            value={curso.imagenPortadaUrl}
            onChange={handleChange}
          />
          {curso.imagenPortadaUrl && (
            <div className="preview-container">
              <img
                src={curso.imagenPortadaUrl}
                alt="Vista previa"
                onError={(e) => (e.target.style.display = "none")}
              />
            </div>
          )}
        </div>

        <div className="form-botones">
          <button
            type="button"
            className="btn-guardar"
            onClick={handleGuardar}
            disabled={guardando}
          >
            {guardando ? "Guardando..." : "Crear curso"}
          </button>
          <button type="button" className="btn-cancelar" onClick={handleCancelar}>
            Cancelar
          </button>
        </div>
      </form>
    </div>
  );
};

export default CursoNuevo;

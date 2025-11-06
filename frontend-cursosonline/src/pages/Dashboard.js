import React, { useContext, useEffect, useState } from "react";
import { AuthContext } from "../context/AuthContext";
import { listarCursos } from "../services/cursoService";
import "../assets/css/dashboard.css";

/**
 * Dashboard.js
 * Panel general del usuario (estudiante, instructor o admin)
 * Muestra información personal, cursos visibles y actividad reciente.
 */
const Dashboard = () => {
  const { user, logout } = useContext(AuthContext);
  const [misCursos, setMisCursos] = useState([]);
  const [recientes, setRecientes] = useState([]);
  const [loading, setLoading] = useState(true);

  const esInstructor = user?.roles?.includes("ROLE_INSTRUCTOR");
  const esAdmin = user?.roles?.includes("ROLE_ADMIN");

  useEffect(() => {
    const fetchCursos = async () => {
      try {
        let data;
        // Si el usuario es instructor o admin, mostramos sus cursos publicados
        if (esInstructor || esAdmin) {
          data = await listarCursos({ idInstructor: user.userId, estado: "PUBLICADO" });
        } else {
          // Si es estudiante, solo los cursos públicos
          data = await listarCursos({ estado: "PUBLICADO" });
        }

        const cursos = data.content || [];
        setMisCursos(cursos);
        setRecientes(
          cursos.slice(0, 3).map((c) => ({
            titulo: c.titulo,
            fecha: c.createdAt || "N/D",
            estado: c.estado || "PUBLICADO",
          }))
        );
      } catch (err) {
        console.error("Error al cargar cursos:", err);
      } finally {
        setLoading(false);
      }
    };

    fetchCursos();
  }, [user, esInstructor, esAdmin]);

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

  if (!user)
    return (
      <div className="dashboard-container">
        <p>No se ha iniciado sesión.</p>
      </div>
    );

  return (
    <div className="dashboard-container">
      <h1>Bienvenido, {user.username}</h1>

      {/* === Información del usuario === */}
      <section className="user-info">
        <h2>Información de tu cuenta</h2>
        <p>
          <strong>ID Usuario:</strong> {user.userId}
        </p>
        <p>
          <strong>Rol:</strong> {user.roles?.join(", ")}
        </p>
        <p>
          <strong>Correo:</strong> {user.email || "No disponible"}
        </p>

        <button className="btn-logout" onClick={logout}>
          Cerrar sesión
        </button>
      </section>

      {/* === Cursos visibles === */}
      <section className="user-cursos">
        <h2>
          {esAdmin
            ? "Cursos publicados"
            : esInstructor
            ? "Tus cursos publicados"
            : "Cursos disponibles"}
        </h2>

        {loading ? (
          <p>Cargando cursos...</p>
        ) : misCursos.length === 0 ? (
          <p>No hay cursos disponibles actualmente.</p>
        ) : (
          <div className="curso-grid">
            {misCursos.map((curso) => (
              <div key={curso.id} className="curso-card-dashboard">
                <img
                  src={
                    curso.imagenPortadaUrl ||
                    "https://via.placeholder.com/200x120?text=Sin+imagen"
                  }
                  alt={curso.titulo}
                />
                <h3>{curso.titulo}</h3>
                <p>{curso.categoria}</p>
                <p>
                  <strong>
                    {curso.precio > 0 ? `$${curso.precio}` : "Gratis"}
                  </strong>
                </p>
                <span className={getBadgeClass(curso.estado)}>
                  {curso.estado}
                </span>
              </div>
            ))}
          </div>
        )}
      </section>

      {/* === Actividad reciente === */}
      <section className="user-actividad">
        <h2>Actividad reciente</h2>
        {recientes.length === 0 ? (
          <p>No hay actividad reciente registrada.</p>
        ) : (
          <ul className="actividad-lista">
            {recientes.map((act, i) => (
              <li key={i} className="actividad-item">
                <div className="actividad-info">
                  <h4>{act.titulo}</h4>
                  <p>
                    <strong>Fecha:</strong> {act.fecha}
                  </p>
                  <p>
                    <strong>Estado:</strong>{" "}
                    <span className={getBadgeClass(act.estado)}>
                      {act.estado}
                    </span>
                  </p>
                </div>
              </li>
            ))}
          </ul>
        )}
      </section>
    </div>
  );
};

export default Dashboard;

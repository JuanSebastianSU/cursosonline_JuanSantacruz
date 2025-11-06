import React, { useEffect, useState } from "react";
import {
  listarUsuarios,
  cambiarEstadoUsuario,
  eliminarUsuario,
  actualizarUsuario,
} from "../services/usuarioService";
import "../assets/css/estudiantes.css";

/**
 * Estudiantes.js
 * Vista administrativa para gestionar usuarios del sistema.
 * Compatible con los endpoints de tu backend: /api/usuarios
 */

const Estudiantes = () => {
  const [usuarios, setUsuarios] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [filtro, setFiltro] = useState("");

  // ====================== CARGAR USUARIOS ======================
  const cargarUsuarios = async () => {
    setLoading(true);
    try {
      const data = await listarUsuarios();
      setUsuarios(data || []); // tu servicio devuelve lista directa, no .content
    } catch (err) {
      setError("Error al cargar usuarios.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    cargarUsuarios();
  }, []);

  // ====================== FILTRO ======================
  const handleBuscar = (e) => {
    setFiltro(e.target.value);
  };

  const usuariosFiltrados = usuarios.filter(
    (u) =>
      u.nombre?.toLowerCase().includes(filtro.toLowerCase()) ||
      u.email?.toLowerCase().includes(filtro.toLowerCase()) ||
      u.rol?.toLowerCase().includes(filtro.toLowerCase())
  );

  // ====================== ELIMINAR ======================
  const handleEliminar = async (id) => {
    if (!window.confirm("¿Eliminar este usuario definitivamente?")) return;
    const ok = await eliminarUsuario(id);
    if (ok) {
      alert("Usuario eliminado correctamente.");
      cargarUsuarios();
    } else {
      alert("Error al eliminar usuario.");
    }
  };

  // ====================== CAMBIAR ESTADO ======================
  const handleCambiarEstado = async (id, estadoActual) => {
    const nuevoEstado = estadoActual === "ACTIVO" ? "INACTIVO" : "ACTIVO";
    try {
      await cambiarEstadoUsuario(id, nuevoEstado);
      alert(`Estado cambiado a ${nuevoEstado}`);
      cargarUsuarios();
    } catch {
      alert("Error al cambiar estado.");
    }
  };

  // ====================== CAMBIAR ROL ======================
  const handleCambiarRol = async (id, nuevoRol) => {
    try {
      await actualizarUsuario(id, { rol: nuevoRol });
      alert(`Rol cambiado a ${nuevoRol}`);
      cargarUsuarios();
    } catch {
      alert("Error al cambiar rol.");
    }
  };

  // ====================== RENDER ======================
  return (
    <div className="usuarios-container">
      <h1>Gestión de Usuarios</h1>

      <div className="filtro-bar">
        <input
          type="text"
          placeholder="Buscar por nombre, correo o rol..."
          value={filtro}
          onChange={handleBuscar}
        />
        <button onClick={cargarUsuarios}>🔄 Recargar</button>
      </div>

      {loading ? (
        <p>Cargando usuarios...</p>
      ) : error ? (
        <p className="error">{error}</p>
      ) : (
        <table className="tabla-usuarios">
          <thead>
            <tr>
              <th>Nombre</th>
              <th>Email</th>
              <th>Rol</th>
              <th>Estado</th>
              <th>Acciones</th>
            </tr>
          </thead>
          <tbody>
            {usuariosFiltrados.length === 0 ? (
              <tr>
                <td colSpan="5">No se encontraron usuarios.</td>
              </tr>
            ) : (
              usuariosFiltrados.map((u) => (
                <tr key={u.id}>
                  <td>{u.nombre}</td>
                  <td>{u.email}</td>
                  <td>
                    <select
                      value={u.rol}
                      onChange={(e) => handleCambiarRol(u.id, e.target.value)}
                    >
                      <option value="USUARIO">Usuario</option>
                      <option value="INSTRUCTOR">Instructor</option>
                      <option value="ADMIN">Admin</option>
                    </select>
                  </td>
                  <td>
                    <span
                      className={`estado-tag ${
                        u.estado === "ACTIVO" ? "activo" : "inactivo"
                      }`}
                    >
                      {u.estado}
                    </span>
                  </td>
                  <td>
                    <button
                      className="btn-estado"
                      onClick={() => handleCambiarEstado(u.id, u.estado)}
                    >
                      {u.estado === "ACTIVO" ? "Desactivar" : "Activar"}
                    </button>
                    <button
                      className="btn-eliminar"
                      onClick={() => handleEliminar(u.id)}
                    >
                      Eliminar
                    </button>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      )}
    </div>
  );
};

export default Estudiantes;

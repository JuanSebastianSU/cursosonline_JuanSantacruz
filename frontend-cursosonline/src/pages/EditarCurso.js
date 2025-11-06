import React, { useContext, useEffect, useState } from "react";
import { AuthContext } from "../context/AuthContext";
import {
  obtenerUsuario,
  actualizarUsuario,
  cambiarPassword,
} from "../services/usuarioService";
import "../assets/css/perfil.css";

/**
 * Perfil.js
 * Permite al usuario autenticado ver y actualizar su información.
 * Accede al backend a través de JWT usando AuthContext.
 */

const Perfil = () => {
  const { user, logout } = useContext(AuthContext);
  const [perfil, setPerfil] = useState(null);
  const [loading, setLoading] = useState(true);
  const [editando, setEditando] = useState(false);
  const [nuevoNombre, setNuevoNombre] = useState("");
  const [nuevaPassword, setNuevaPassword] = useState("");
  const [guardando, setGuardando] = useState(false);

  // ====================== Cargar datos del usuario ======================
  useEffect(() => {
    const fetchPerfil = async () => {
      try {
        const data = await obtenerUsuario(user.userId); // ✅ usar userId
        setPerfil(data);
        setNuevoNombre(data.nombre || "");
      } catch (err) {
        console.error("Error al cargar perfil:", err);
      } finally {
        setLoading(false);
      }
    };

    if (user?.userId) fetchPerfil();
  }, [user]);

  // ====================== Guardar cambios del perfil ======================
  const handleGuardarCambios = async () => {
    if (!nuevoNombre.trim()) {
      alert("El nombre no puede estar vacío.");
      return;
    }

    setGuardando(true);
    try {
      const actualizado = await actualizarUsuario(user.userId, {
        ...perfil,
        nombre: nuevoNombre.trim(),
      });
      setPerfil(actualizado);
      setEditando(false);
      alert("Datos actualizados correctamente.");
    } catch (err) {
      alert("Error al actualizar datos del perfil.");
    } finally {
      setGuardando(false);
    }
  };

  // ====================== Cambiar contraseña ======================
  const handleCambiarPassword = async () => {
    if (nuevaPassword.trim().length < 6) {
      alert("La nueva contraseña debe tener al menos 6 caracteres.");
      return;
    }

    try {
      await cambiarPassword(user.userId, nuevaPassword.trim());
      setNuevaPassword("");
      alert("Contraseña actualizada correctamente.");
    } catch (err) {
      alert("Error al cambiar contraseña.");
    }
  };

  if (loading) return <p>Cargando perfil...</p>;
  if (!perfil) return <p>Error: No se pudo cargar tu información.</p>;

  return (
    <div className="perfil-container">
      <h1>Mi Perfil</h1>

      <section className="perfil-info">
        <h2>Información de la cuenta</h2>

        <div className="perfil-dato">
          <label>Correo electrónico:</label>
          <input type="email" value={perfil.email} disabled />
        </div>

        <div className="perfil-dato">
          <label>Rol:</label>
          <input type="text" value={perfil.rol} disabled />
        </div>

        <div className="perfil-dato">
          <label>Estado:</label>
          <input type="text" value={perfil.estado} disabled />
        </div>

        <div className="perfil-dato">
          <label>Nombre:</label>
          {editando ? (
            <input
              type="text"
              value={nuevoNombre}
              onChange={(e) => setNuevoNombre(e.target.value)}
            />
          ) : (
            <input type="text" value={perfil.nombre} disabled />
          )}
        </div>

        <div className="perfil-botones">
          {editando ? (
            <>
              <button
                className="btn-guardar"
                onClick={handleGuardarCambios}
                disabled={guardando}
              >
                {guardando ? "Guardando..." : "Guardar cambios"}
              </button>
              <button className="btn-cancelar" onClick={() => setEditando(false)}>
                Cancelar
              </button>
            </>
          ) : (
            <button className="btn-editar" onClick={() => setEditando(true)}>
              Editar nombre
            </button>
          )}
        </div>
      </section>

      <section className="perfil-password">
        <h2>Cambiar contraseña</h2>
        <div className="perfil-dato">
          <label>Nueva contraseña:</label>
          <input
            type="password"
            value={nuevaPassword}
            onChange={(e) => setNuevaPassword(e.target.value)}
          />
        </div>
        <button className="btn-guardar" onClick={handleCambiarPassword}>
          Actualizar contraseña
        </button>
      </section>

      <section className="perfil-sesion">
        <h2>Sesión</h2>
        <p>Si deseas cerrar tu sesión actual:</p>
        <button className="btn-cerrar-sesion" onClick={logout}>
          Cerrar sesión
        </button>
      </section>
    </div>
  );
};

export default Perfil;

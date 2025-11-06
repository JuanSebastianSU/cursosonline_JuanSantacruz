import React, { useContext, useEffect, useState } from "react";
import { AuthContext } from "../context/AuthContext";
import {
  obtenerUsuario,
  actualizarUsuario,
  cambiarPassword,
} from "../services/usuarioService";
import { listarCursos } from "../services/cursoService";
import api from "../services/api";
import "../assets/css/perfil.css";

const Perfil = () => {
  const { user, logout } = useContext(AuthContext);
  const [perfil, setPerfil] = useState(null);
  const [loading, setLoading] = useState(true);
  const [editando, setEditando] = useState(false);
  const [nuevoNombre, setNuevoNombre] = useState("");
  const [nuevaPassword, setNuevaPassword] = useState("");
  const [guardando, setGuardando] = useState(false);
  const [fotoFile, setFotoFile] = useState(null);
  const [subiendoFoto, setSubiendoFoto] = useState(false);
  const [fotoUrl, setFotoUrl] = useState("");
  const [cursosRecientes, setCursosRecientes] = useState([]);
  const [mostrarModal, setMostrarModal] = useState(false);

  // ======= Cargar perfil =======
  useEffect(() => {
    const fetchPerfil = async () => {
      try {
        const data = await obtenerUsuario(user.userId);
        setPerfil(data);
        setNuevoNombre(data.nombre || "");
        setFotoUrl(data.fotoUrl || "");
      } catch (err) {
        console.error("Error al cargar perfil:", err);
      } finally {
        setLoading(false);
      }
    };
    if (user?.userId) fetchPerfil();
  }, [user]);

  // ======= Cargar cursos recientes =======
  useEffect(() => {
    if (user?.rol === "ROLE_INSTRUCTOR" || user?.rol === "ROLE_ADMIN") {
      listarCursos()
        .then((data) => {
          const publicados = (data.content || []).filter(
            (c) => c.estado === "PUBLICADO" && c.idInstructor === user.userId
          );
          setCursosRecientes(publicados.slice(0, 3));
        })
        .catch((err) => console.error("Error cargando cursos recientes:", err));
    }
  }, [user]);

  // ======= Subir foto =======
  const handleFileChange = (e) => setFotoFile(e.target.files[0]);
  const handleUploadFoto = async () => {
    if (!fotoFile) return alert("Selecciona una imagen primero.");
    const formData = new FormData();
    formData.append("file", fotoFile);
    try {
      setSubiendoFoto(true);
      const res = await api.post(`/usuarios/${user.userId}/foto`, formData, {
        headers: { "Content-Type": "multipart/form-data" },
      });
      setFotoUrl(res.data);
      alert("Foto subida correctamente.");
    } catch {
      alert("Error al subir la foto.");
    } finally {
      setSubiendoFoto(false);
    }
  };

  // ======= Guardar cambios =======
  const handleGuardarCambios = async () => {
    if (!nuevoNombre.trim()) return alert("El nombre no puede estar vacío.");
    setGuardando(true);
    try {
      const actualizado = await actualizarUsuario(user.userId, {
        ...perfil,
        nombre: nuevoNombre.trim(),
      });
      setPerfil(actualizado);
      setEditando(false);
      alert("Datos actualizados correctamente.");
    } catch {
      alert("Error al actualizar datos del perfil.");
    } finally {
      setGuardando(false);
    }
  };

  // ======= Cambiar contraseña =======
  const handleCambiarPassword = async () => {
    if (nuevaPassword.trim().length < 6)
      return alert("La nueva contraseña debe tener al menos 6 caracteres.");
    try {
      await cambiarPassword(user.userId, nuevaPassword.trim());
      setNuevaPassword("");
      setMostrarModal(false);
      alert("Contraseña actualizada correctamente.");
    } catch {
      alert("Error al cambiar contraseña.");
    }
  };

  if (loading) return <p>Cargando perfil...</p>;
  if (!perfil) return <p>Error: No se pudo cargar tu información.</p>;

  return (
    <div className="perfil-container">
      {/* ======== BIENVENIDA ======== */}
      <section className="perfil-bienvenida">
        <h1>¡Bienvenido, {perfil.nombre || "Usuario"}!</h1>
        <p>
          Gestiona tu cuenta, actualiza tu información y revisa tus cursos recientes.
        </p>
      </section>

      {/* ======== INFORMACIÓN Y FOTO ======== */}
      <div className="perfil-main-grid">
        {/* FOTO */}
        <section className="perfil-foto">
          <img
            src={
              fotoUrl
                ? `http://localhost:8080${fotoUrl}`
                : "https://via.placeholder.com/150?text=Sin+Foto"
            }
            alt={perfil.nombre}
            className="perfil-foto-img"
          />
          <div className="perfil-foto-subida">
            <input type="file" accept="image/*" onChange={handleFileChange} />
            <button onClick={handleUploadFoto} disabled={subiendoFoto}>
              {subiendoFoto ? "Subiendo..." : "Actualizar foto"}
            </button>
          </div>
        </section>

        {/* INFORMACIÓN */}
        <section className="perfil-info">
          <h2>Información de la cuenta</h2>

          <div className="perfil-dato">
            <label>Correo:</label>
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
      </div>

      {/* ======== SESIÓN ======== */}
      <section className="perfil-sesion">
        <h2>Sesión</h2>
        <div className="perfil-sesion-botones">
          <button className="btn-password" onClick={() => setMostrarModal(true)}>
            Cambiar contraseña
          </button>
          <button className="btn-cerrar-sesion" onClick={logout}>
            Cerrar sesión
          </button>
        </div>
      </section>

      {/* ======== MODAL CAMBIO DE CONTRASEÑA ======== */}
      {mostrarModal && (
        <div className="modal-overlay" onClick={() => setMostrarModal(false)}>
          <div
            className="modal-content"
            onClick={(e) => e.stopPropagation()}
          >
            <h3>🔒 Cambiar contraseña</h3>
            <input
              type="password"
              placeholder="Nueva contraseña"
              value={nuevaPassword}
              onChange={(e) => setNuevaPassword(e.target.value)}
            />
            <div className="modal-buttons">
              <button className="btn-guardar" onClick={handleCambiarPassword}>
                Actualizar
              </button>
              <button
                className="btn-cancelar"
                onClick={() => setMostrarModal(false)}
              >
                Cancelar
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ======== CURSOS RECIENTES ======== */}
      {(user?.rol === "ROLE_INSTRUCTOR" || user?.rol === "ROLE_ADMIN") && (
        <section className="perfil-cursos-recientes">
          <h2>Tus cursos recientes</h2>
          {cursosRecientes.length === 0 ? (
            <p>No tienes cursos publicados todavía.</p>
          ) : (
            <div className="perfil-curso-grid">
              {cursosRecientes.map((curso) => (
                <div key={curso.id} className="perfil-curso-card">
                  <img
                    src={curso.imagenPortadaUrl || "/no-image.png"}
                    alt={curso.titulo}
                    onError={(e) => (e.target.src = "/no-image.png")}
                  />
                  <div className="curso-info">
                    <h3>{curso.titulo}</h3>
                    <p>{curso.categoria}</p>
                    <span className="badge badge-publicado">Publicado</span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </section>
      )}
    </div>
  );
};

export default Perfil;

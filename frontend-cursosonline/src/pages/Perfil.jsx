import React, { useContext, useEffect, useState } from "react";
import { AuthContext } from "../context/AuthContext";
import {
  obtenerUsuario,
  actualizarUsuario,
  cambiarPassword,
} from "../services/usuarioService";
import { listarCursos } from "../services/cursoService";
import api from "../services/api";

const Perfil = () => {
  const { user, logout } = useContext(AuthContext);

  const [perfil, setPerfil] = useState(null);
  const [loading, setLoading] = useState(true);

  const [editando, setEditando] = useState(false);
  const [nuevoNombre, setNuevoNombre] = useState("");
  const [guardando, setGuardando] = useState(false);

  const [fotoFile, setFotoFile] = useState(null);
  const [subiendoFoto, setSubiendoFoto] = useState(false);
  const [fotoUrl, setFotoUrl] = useState("");

  const [nuevaPassword, setNuevaPassword] = useState("");
  const [mostrarModal, setMostrarModal] = useState(false);

  const [cursosRecientes, setCursosRecientes] = useState([]);

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

  // ======= Foto de perfil =======
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
    } catch (err) {
      console.error(err);
      alert("Error al subir la foto.");
    } finally {
      setSubiendoFoto(false);
    }
  };

  // ======= Guardar cambios de nombre =======
  const handleGuardarCambios = async () => {
    if (!nuevoNombre.trim())
      return alert("El nombre no puede estar vacío.");

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
      console.error(err);
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
    } catch (err) {
      console.error(err);
      alert("Error al cambiar contraseña.");
    }
  };

  if (loading) {
    return (
      <div className="max-w-4xl mx-auto px-4 md:px-6 py-10 text-center text-sm md:text-base text-slate-500">
        Cargando perfil...
      </div>
    );
  }

  if (!perfil) {
    return (
      <div className="max-w-4xl mx-auto px-4 md:px-6 py-10 text-center text-sm md:text-base text-rose-600">
        Error: No se pudo cargar tu información.
      </div>
    );
  }

  return (
    <div className="max-w-5xl mx-auto px-4 md:px-6 py-8 md:py-10 space-y-7">
      {/* ======== BIENVENIDA ======== */}
      <section className="rounded-3xl bg-gradient-to-r from-slate-900 via-slate-800 to-slate-900 px-5 md:px-8 py-7 md:py-8 text-center text-amber-50 shadow-[0_18px_45px_rgba(15,23,42,0.55)]">
        <h1 className="text-2xl md:text-3xl font-semibold tracking-tight">
          ¡Bienvenido, {perfil.nombre || "Usuario"}!
        </h1>
        <p className="mt-2 text-xs md:text-sm text-slate-200/85 max-w-2xl mx-auto">
          Gestiona tu cuenta, actualiza tu información personal y revisa tus
          cursos recientes desde este panel.
        </p>
      </section>

      {/* ======== INFORMACIÓN Y FOTO ======== */}
      <div className="grid gap-6 lg:grid-cols-[minmax(0,1.3fr)_minmax(0,2fr)] items-start">
        {/* FOTO */}
        <section className="bg-white/95 rounded-3xl border border-slate-100 shadow-[0_14px_40px_rgba(15,23,42,0.18)] px-5 py-6 md:px-6 md:py-7 flex flex-col items-center gap-4">
          <div className="relative">
            <img
              src={
                fotoUrl
                  ? `http://localhost:8080${fotoUrl}`
                  : "https://via.placeholder.com/150?text=Sin+Foto"
              }
              alt={perfil.nombre}
              className="w-32 h-32 md:w-40 md:h-40 rounded-full border-2 border-amber-300 object-cover shadow-md"
            />
          </div>

          <div className="w-full space-y-2">
            <label className="block text-xs font-semibold uppercase tracking-wide text-slate-600">
              Actualizar foto
            </label>
            <input
              type="file"
              accept="image/*"
              onChange={handleFileChange}
              className="block w-full text-xs text-slate-600 file:mr-3 file:rounded-full file:border-0 file:bg-slate-900 file:px-4 file:py-1.5 file:text-xs file:font-semibold file:text-amber-100 hover:file:bg-slate-800"
            />
            <button
              onClick={handleUploadFoto}
              disabled={subiendoFoto}
              className="mt-2 inline-flex w-full items-center justify-center rounded-full bg-slate-900 px-4 py-2 text-xs md:text-sm font-semibold text-amber-100 shadow-sm hover:bg-slate-800 active:translate-y-px disabled:opacity-60 disabled:cursor-not-allowed transition"
            >
              {subiendoFoto ? "Subiendo..." : "Actualizar foto"}
            </button>
          </div>
        </section>

        {/* INFORMACIÓN */}
        <section className="bg-white/95 rounded-3xl border border-slate-100 shadow-[0_14px_40px_rgba(15,23,42,0.18)] px-5 py-6 md:px-7 md:py-7 space-y-4">
          <h2 className="text-sm md:text-base font-semibold text-slate-900">
            Información de la cuenta
          </h2>

          <div className="grid gap-3 md:grid-cols-2 text-xs md:text-sm">
            <div className="space-y-1">
              <label className="text-[0.7rem] font-semibold uppercase tracking-wide text-slate-600">
                Correo
              </label>
              <input
                type="email"
                value={perfil.email}
                disabled
                className="w-full rounded-xl border border-slate-200 bg-slate-50 px-3 py-2 text-xs md:text-sm text-slate-700"
              />
            </div>
            <div className="space-y-1">
              <label className="text-[0.7rem] font-semibold uppercase tracking-wide text-slate-600">
                Rol
              </label>
              <input
                type="text"
                value={perfil.rol}
                disabled
                className="w-full rounded-xl border border-slate-200 bg-slate-50 px-3 py-2 text-xs md:text-sm text-slate-700"
              />
            </div>
            <div className="space-y-1">
              <label className="text-[0.7rem] font-semibold uppercase tracking-wide text-slate-600">
                Estado
              </label>
              <input
                type="text"
                value={perfil.estado}
                disabled
                className="w-full rounded-xl border border-slate-200 bg-slate-50 px-3 py-2 text-xs md:text-sm text-slate-700"
              />
            </div>
            <div className="space-y-1">
              <label className="text-[0.7rem] font-semibold uppercase tracking-wide text-slate-600">
                Nombre
              </label>
              {editando ? (
                <input
                  type="text"
                  value={nuevoNombre}
                  onChange={(e) => setNuevoNombre(e.target.value)}
                  className="w-full rounded-xl border border-slate-300 bg-white px-3 py-2 text-xs md:text-sm text-slate-900 shadow-inner focus:border-slate-900 focus:outline-none focus:ring-2 focus:ring-slate-900/10"
                />
              ) : (
                <input
                  type="text"
                  value={perfil.nombre}
                  disabled
                  className="w-full rounded-xl border border-slate-200 bg-slate-50 px-3 py-2 text-xs md:text-sm text-slate-700"
                />
              )}
            </div>
          </div>

          <div className="flex justify-end gap-3 pt-2">
            {editando ? (
              <>
                <button
                  onClick={handleGuardarCambios}
                  disabled={guardando}
                  className="inline-flex items-center justify-center rounded-full bg-emerald-600 px-4 py-2 text-xs md:text-sm font-semibold text-emerald-50 shadow-sm hover:bg-emerald-700 active:translate-y-px disabled:opacity-60 disabled:cursor-not-allowed transition"
                >
                  {guardando ? "Guardando..." : "Guardar cambios"}
                </button>
                <button
                  onClick={() => setEditando(false)}
                  className="inline-flex items-center justify-center rounded-full border border-slate-300 px-4 py-2 text-xs md:text-sm font-semibold text-slate-700 hover:bg-slate-100 active:translate-y-px transition"
                >
                  Cancelar
                </button>
              </>
            ) : (
              <button
                onClick={() => setEditando(true)}
                className="inline-flex items-center justify-center rounded-full bg-slate-900 px-4 py-2 text-xs md:text-sm font-semibold text-amber-100 shadow-sm hover:bg-slate-800 active:translate-y-px transition"
              >
                Editar nombre
              </button>
            )}
          </div>
        </section>
      </div>

      {/* ======== SESIÓN ======== */}
      <section className="bg-white/95 rounded-3xl border border-slate-100 shadow-sm px-5 py-5 md:px-7 md:py-6 flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div>
          <h2 className="text-sm md:text-base font-semibold text-slate-900">
            Sesión
          </h2>
          <p className="text-xs md:text-sm text-slate-500">
            Cambia tu contraseña o cierra la sesión actual.
          </p>
        </div>
        <div className="flex flex-wrap gap-3">
          <button
            className="inline-flex items-center justify-center rounded-full bg-slate-900 px-4 py-2 text-xs md:text-sm font-semibold text-amber-100 shadow-sm hover:bg-slate-800 active:translate-y-px transition"
            onClick={() => setMostrarModal(true)}
          >
            Cambiar contraseña
          </button>
          <button
            className="inline-flex items-center justify-center rounded-full bg-amber-600 px-4 py-2 text-xs md:text-sm font-semibold text-slate-900 shadow-sm hover:bg-amber-500 active:translate-y-px transition"
            onClick={logout}
          >
            Cerrar sesión
          </button>
        </div>
      </section>

      {/* ======== MODAL CAMBIO DE CONTRASEÑA ======== */}
      {mostrarModal && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 px-4"
          onClick={() => setMostrarModal(false)}
        >
          <div
            className="w-full max-w-sm rounded-3xl bg-white px-5 py-6 shadow-[0_18px_50px_rgba(15,23,42,0.55)]"
            onClick={(e) => e.stopPropagation()}
          >
            <h3 className="text-sm md:text-base font-semibold text-slate-900 mb-3 flex items-center gap-2">
              <span className="text-lg">🔒</span>
              Cambiar contraseña
            </h3>
            <p className="text-xs md:text-sm text-slate-500 mb-4">
              Ingresa una nueva contraseña de al menos 6 caracteres.
            </p>
            <input
              type="password"
              placeholder="Nueva contraseña"
              value={nuevaPassword}
              onChange={(e) => setNuevaPassword(e.target.value)}
              className="mb-4 w-full rounded-xl border border-slate-300 bg-slate-50 px-3 py-2 text-xs md:text-sm text-slate-900 shadow-inner focus:border-slate-900 focus:outline-none focus:ring-2 focus:ring-slate-900/10"
            />
            <div className="flex justify-end gap-2">
              <button
                className="inline-flex items-center justify-center rounded-full border border-slate-300 px-4 py-2 text-xs md:text-sm font-semibold text-slate-700 hover:bg-slate-100 active:translate-y-px transition"
                onClick={() => setMostrarModal(false)}
              >
                Cancelar
              </button>
              <button
                className="inline-flex items-center justify-center rounded-full bg-slate-900 px-4 py-2 text-xs md:text-sm font-semibold text-amber-100 shadow-sm hover:bg-slate-800 active:translate-y-px transition"
                onClick={handleCambiarPassword}
              >
                Actualizar
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ======== CURSOS RECIENTES ======== */}
      {(user?.rol === "ROLE_INSTRUCTOR" || user?.rol === "ROLE_ADMIN") && (
        <section className="bg-white/95 rounded-3xl border border-slate-100 shadow-sm px-5 py-6 md:px-7 md:py-7 space-y-3">
          <h2 className="text-sm md:text-base font-semibold text-slate-900">
            Tus cursos recientes
          </h2>
          {cursosRecientes.length === 0 ? (
            <p className="text-xs md:text-sm text-slate-500">
              No tienes cursos publicados todavía.
            </p>
          ) : (
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
              {cursosRecientes.map((curso) => (
                <div
                  key={curso.id}
                  className="flex flex-col overflow-hidden rounded-2xl border border-slate-100 bg-slate-50 shadow-sm"
                >
                  <div className="h-28 overflow-hidden bg-slate-900/5">
                    <img
                      src={curso.imagenPortadaUrl || "/no-image.png"}
                      alt={curso.titulo}
                      onError={(e) => (e.target.src = "/no-image.png")}
                      className="h-full w-full object-cover"
                    />
                  </div>
                  <div className="flex-1 px-3 py-3 space-y-1">
                    <h3 className="text-xs md:text-sm font-semibold text-slate-900 line-clamp-2">
                      {curso.titulo}
                    </h3>
                    <p className="text-[0.7rem] text-slate-500">
                      {curso.categoria || "Sin categoría"}
                    </p>
                    <span className="inline-flex rounded-full bg-emerald-600/90 px-3 py-1 text-[0.65rem] font-semibold uppercase tracking-wide text-emerald-50">
                      Publicado
                    </span>
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

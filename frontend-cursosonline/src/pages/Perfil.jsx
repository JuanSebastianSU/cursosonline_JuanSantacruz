import React, { useContext, useEffect, useState } from "react";
import { AuthContext } from "../context/AuthContext";
import {
  obtenerUsuario,
  actualizarUsuario,
  cambiarPassword,
} from "../services/usuarioService";
import { listarCursos } from "../services/cursoService";
import api from "../services/api";

/**
 * Perfil.js
 * Vista de perfil del usuario: datos básicos, cambio de nombre,
 * cambio de contraseña, foto de perfil y cursos recientes (si es instructor/admin).
 */
const Perfil = () => {
  const { user, logout } = useContext(AuthContext);

  const [perfil, setPerfil] = useState(null);
  const [loading, setLoading] = useState(true);

  const [editando, setEditando] = useState(false);
  const [nuevoNombre, setNuevoNombre] = useState("");
  const [guardando, setGuardando] = useState(false);

  const [nuevaPassword, setNuevaPassword] = useState("");
  const [cambiandoPassword, setCambiandoPassword] = useState(false);

  // === FOTO DE PERFIL: misma lógica que tu código anterior ===
  const [fotoFile, setFotoFile] = useState(null);
  const [subiendoFoto, setSubiendoFoto] = useState(false);
  const [fotoUrl, setFotoUrl] = useState("");

  const [cursosRecientes, setCursosRecientes] = useState([]);

  // Helper: iniciales cuando no hay foto
  const inicialesNombre = () => {
    const nombre = perfil?.nombre || "";
    const partes = nombre.trim().split(" ").filter(Boolean);
    if (!partes.length) return "U";
    if (partes.length === 1) return partes[0][0]?.toUpperCase();
    return (partes[0][0] + partes[1][0]).toUpperCase();
  };

  // URL final de la imagen (MISMA idea que antes: http://localhost:8080 + fotoUrl)
  const fotoSrc =
    fotoUrl && typeof fotoUrl === "string"
      ? `http://localhost:8080${fotoUrl}`
      : null;

  // ======= Cargar perfil =======
  useEffect(() => {
    const fetchPerfil = async () => {
      try {
        if (!user?.userId) {
          setLoading(false);
          return;
        }
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

    fetchPerfil();
  }, [user]);

  // ======= Cargar cursos recientes (solo instructor/admin) =======
  useEffect(() => {
    const esInstructorOAdmin =
      user?.rol === "ROLE_INSTRUCTOR" ||
      user?.rol === "ROLE_ADMIN" ||
      user?.rol === "INSTRUCTOR" ||
      user?.rol === "ADMIN";

    if (!esInstructorOAdmin) return;

    listarCursos()
      .then((data) => {
        const publicados = (data.content || []).filter(
          (c) => c.estado === "PUBLICADO" && c.idInstructor === user.userId
        );
        setCursosRecientes(publicados.slice(0, 3));
      })
      .catch((err) => console.error("Error cargando cursos recientes:", err));
  }, [user]);

  // ======= Guardar cambios de nombre =======
  const handleGuardarCambios = async () => {
    if (!nuevoNombre.trim()) {
      alert("El nombre no puede estar vacío.");
      return;
    }
    if (!perfil) return;

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
      console.error("Error al actualizar perfil:", err);
      alert("Error al actualizar datos del perfil.");
    } finally {
      setGuardando(false);
    }
  };

  // ======= Cambiar contraseña =======
  const handleCambiarPassword = async () => {
    if (nuevaPassword.trim().length < 6) {
      alert("La nueva contraseña debe tener al menos 6 caracteres.");
      return;
    }

    setCambiandoPassword(true);
    try {
      await cambiarPassword(user.userId, nuevaPassword.trim());
      setNuevaPassword("");
      alert("Contraseña actualizada correctamente.");
    } catch (err) {
      console.error("Error al cambiar contraseña:", err);
      alert("Error al cambiar contraseña.");
    } finally {
      setCambiandoPassword(false);
    }
  };

  // ======= Foto de perfil (MISMA lógica que antes) =======
  const handleFileChange = (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setFotoFile(file);
  };

  const handleUploadFoto = async () => {
    if (!fotoFile) {
      alert("Selecciona una imagen primero.");
      return;
    }

    const formData = new FormData();
    formData.append("file", fotoFile);

    try {
      setSubiendoFoto(true);
      const res = await api.post(`/usuarios/${user.userId}/foto`, formData, {
        headers: { "Content-Type": "multipart/form-data" },
      });
      // Igual que tu código: el backend devuelve el path y lo guardamos tal cual
      setFotoUrl(res.data);
      alert("Foto subida correctamente.");
    } catch (err) {
      console.error("Error al subir la foto:", err);
      alert("Error al subir la foto.");
    } finally {
      setSubiendoFoto(false);
    }
  };

  // ======= Estados especiales =======
  if (loading) {
    return (
      <main className="flex-1 bg-slate-950 text-slate-50 flex items-center justify-center">
        <p className="text-sm text-slate-400">Cargando perfil...</p>
      </main>
    );
  }

  if (!perfil) {
    return (
      <main className="flex-1 bg-slate-950 text-slate-50 flex items-center justify-center">
        <p className="text-sm text-slate-300">
          Error: no se pudo cargar tu información.
        </p>
      </main>
    );
  }

  // ======= UI principal =======
  return (
    <main className="flex-1 bg-slate-950 text-slate-50 relative overflow-hidden">
      {/* Halos y formas artísticas de fondo */}
      <div className="pointer-events-none absolute inset-0 -z-10">
        <div className="absolute -top-24 left-1/2 h-72 w-80 -translate-x-1/2 rounded-full bg-[radial-gradient(circle,_rgba(248,250,252,0.14),_transparent_60%)] blur-3xl opacity-90" />
        <div className="absolute -left-32 top-40 h-64 w-72 -rotate-6 bg-gradient-to-tr from-emerald-500/18 via-sky-400/16 to-transparent blur-3xl" />
        <div className="absolute -right-24 bottom-10 h-56 w-56 rounded-[40%] bg-gradient-to-b from-amber-400/24 to-transparent blur-2xl" />
        <div className="absolute inset-x-0 top-24 flex justify-center opacity-30">
          <div className="h-40 w-72 rounded-[999px] border border-dashed border-slate-500/40 rotate-[-8deg]" />
        </div>
      </div>

      <div className="max-w-4xl mx-auto px-4 md:px-6 py-8 md:py-10 space-y-7">
        {/* Encabezado */}
        <header className="space-y-2 border-b border-slate-800 pb-4">
          <p className="inline-flex items-center gap-2 rounded-full border border-slate-700/80 bg-slate-950/80 px-3 py-1 text-[0.65rem] font-semibold uppercase tracking-[0.3em] text-slate-400">
            <span className="h-1.5 w-7 -skew-x-12 rounded-full bg-gradient-to-r from-emerald-300/90 via-sky-300/90 to-amber-300/90" />
            Mi perfil
          </p>
          <h1 className="text-2xl md:text-3xl font-semibold tracking-tight text-slate-50">
            Hola, {perfil.nombre || "usuario"}.
          </h1>
          <p className="text-xs md:text-sm text-slate-400 max-w-xl">
            Administra tus datos de cuenta, actualiza tu nombre y mantén segura
            tu contraseña desde este panel.
          </p>
        </header>

        {/* Tarjeta de foto de perfil */}
        <section>
          <div className="relative mx-auto max-w-md md:max-w-lg rounded-3xl border border-slate-800 bg-slate-950/90 shadow-[0_18px_50px_rgba(15,23,42,0.95)] px-5 md:px-7 py-5 flex items-center gap-4 md:gap-6 overflow-hidden">
            <div className="pointer-events-none absolute -right-10 -top-10 h-28 w-28 rounded-3xl border border-slate-700/70 rotate-12" />
            <div className="pointer-events-none absolute -left-16 bottom-0 h-24 w-40 -rotate-6 border border-slate-800/70 rounded-3xl" />

            <div className="shrink-0">
              <div className="h-24 w-24 md:h-28 md:w-28 rounded-full border-2 border-amber-400/80 shadow-[0_12px_40px_rgba(251,191,36,0.8)] overflow-hidden bg-slate-900 flex items-center justify-center text-slate-100 text-xl font-semibold tracking-wide">
                {fotoSrc ? (
                  <img
                    src={fotoSrc}
                    alt="Foto de perfil"
                    className="h-full w-full object-cover"
                  />
                ) : (
                  <span>{inicialesNombre()}</span>
                )}
              </div>
            </div>

            <div className="flex-1 space-y-2">
              <h2 className="text-sm md:text-base font-semibold text-slate-50">
                Foto de perfil
              </h2>
              <p className="text-[0.75rem] text-slate-400">
                Selecciona una imagen y luego pulsa{" "}
                <span className="font-semibold">Actualizar foto</span> para
                guardarla en tu perfil.
              </p>
              <div className="flex flex-col gap-2 text-[0.75rem] md:text-xs">
                <label className="inline-flex w-full cursor-pointer items-center justify-center rounded-full border border-slate-400/80 bg-slate-950 px-4 py-1.5 font-semibold uppercase tracking-[0.18em] text-slate-100 hover:bg-slate-50 hover:text-slate-950 hover:border-slate-50 active:translate-y-px transition-colors">
                  <span>Seleccionar imagen</span>
                  <input
                    type="file"
                    accept="image/*"
                    className="hidden"
                    onChange={handleFileChange}
                    disabled={subiendoFoto}
                  />
                </label>

                <button
                  type="button"
                  onClick={handleUploadFoto}
                  disabled={subiendoFoto}
                  className="inline-flex w-full items-center justify-center rounded-full border border-amber-400/80 bg-amber-400/90 px-4 py-1.5 text-[0.75rem] font-semibold uppercase tracking-[0.18em] text-slate-950 shadow-[0_10px_30px_rgba(251,191,36,0.6)] hover:bg-amber-300 active:translate-y-px disabled:opacity-60"
                >
                  {subiendoFoto ? "Subiendo..." : "Actualizar foto"}
                </button>

                <p className="text-[0.65rem] text-slate-500">
                  Formatos recomendados: JPG o PNG, máximo 2–3 MB.
                </p>
              </div>
            </div>
          </div>
        </section>

        {/* Grid principal: datos + contraseña */}
        <section className="grid gap-6 md:grid-cols-[minmax(0,3fr)_minmax(0,2fr)]">
          {/* Tarjeta de datos */}
          <div className="relative rounded-3xl border border-slate-800 bg-slate-950/90 shadow-[0_20px_60px_rgba(15,23,42,1)] px-5 md:px-7 py-6 md:py-7 space-y-4 overflow-hidden">
            <div className="pointer-events-none absolute -right-10 -top-10 h-32 w-32 rounded-full border border-slate-700/70" />
            <div className="pointer-events-none absolute -left-16 bottom-0 h-24 w-40 -rotate-6 border border-slate-800/70 rounded-3xl" />

            <h2 className="text-sm md:text-base font-semibold text-slate-50">
              Información de la cuenta
            </h2>

            <div className="space-y-3 text-xs md:text-sm">
              <div className="space-y-1">
                <label className="block text-[0.7rem] font-semibold uppercase tracking-[0.2em] text-slate-500">
                  Correo electrónico
                </label>
                <input
                  type="email"
                  value={perfil.email}
                  disabled
                  className="w-full rounded-xl border border-slate-700/70 bg-slate-950/80 px-3 py-2 text-xs md:text-sm text-slate-200 shadow-inner focus:outline-none"
                />
              </div>

              <div className="grid gap-3 md:grid-cols-2">
                <div className="space-y-1">
                  <label className="block text-[0.7rem] font-semibold uppercase tracking-[0.2em] text-slate-500">
                    Rol
                  </label>
                  <input
                    type="text"
                    value={perfil.rol}
                    disabled
                    className="w-full rounded-xl border border-slate-700/70 bg-slate-950/80 px-3 py-2 text-xs md:text-sm text-slate-200 shadow-inner focus:outline-none"
                  />
                </div>
                <div className="space-y-1">
                  <label className="block text-[0.7rem] font-semibold uppercase tracking-[0.2em] text-slate-500">
                    Estado
                  </label>
                  <input
                    type="text"
                    value={perfil.estado}
                    disabled
                    className="w-full rounded-xl border border-slate-700/70 bg-slate-950/80 px-3 py-2 text-xs md:text-sm text-slate-200 shadow-inner focus:outline-none"
                  />
                </div>
              </div>

              <div className="space-y-1">
                <label className="block text-[0.7rem] font-semibold uppercase tracking-[0.2em] text-slate-500">
                  Nombre visible
                </label>
                {editando ? (
                  <input
                    type="text"
                    value={nuevoNombre}
                    onChange={(e) => setNuevoNombre(e.target.value)}
                    className="w-full rounded-xl border border-slate-100/80 bg-slate-950/80 px-3 py-2 text-xs md:text-sm text-slate-50 shadow-inner focus:outline-none focus:ring-2 focus:ring-slate-50/40"
                  />
                ) : (
                  <input
                    type="text"
                    value={perfil.nombre || ""}
                    disabled
                    className="w-full rounded-xl border border-slate-700/70 bg-slate-950/80 px-3 py-2 text-xs md:text-sm text-slate-200 shadow-inner focus:outline-none"
                  />
                )}
              </div>
            </div>

            <div className="mt-4 flex flex-wrap justify-end gap-2">
              {editando ? (
                <>
                  <button
                    type="button"
                    onClick={handleGuardarCambios}
                    disabled={guardando}
                    className="inline-flex items-center justify-center rounded-full bg-slate-50 px-4 py-1.5 text-[0.75rem] font-semibold uppercase tracking-[0.18em] text-slate-900 shadow-sm hover:bg-slate-200 active:translate-y-px disabled:opacity-60"
                  >
                    {guardando ? "Guardando..." : "Guardar cambios"}
                  </button>
                  <button
                    type="button"
                    onClick={() => setEditando(false)}
                    className="inline-flex items-center justify-center rounded-full border border-slate-500 px-4 py-1.5 text-[0.75rem] font-semibold uppercase tracking-[0.18em] text-slate-300 hover:bg-slate-900 active:translate-y-px"
                  >
                    Cancelar
                  </button>
                </>
              ) : (
                <button
                  type="button"
                  onClick={() => setEditando(true)}
                  className="inline-flex items-center justify-center rounded-full border border-slate-300/90 bg-slate-950 px-4 py-1.5 text-[0.75rem] font-semibold uppercase tracking-[0.18em] text-slate-100 hover:bg-slate-50 hover:text-slate-950 hover:border-slate-50 active:translate-y-px transition-colors"
                >
                  Editar nombre
                </button>
              )}
            </div>
          </div>

          {/* Tarjeta de contraseña */}
          <div className="rounded-3xl border border-slate-800 bg-slate-950/90 shadow-[0_18px_50px_rgba(15,23,42,0.95)] px-5 md:px-7 py-6 md:py-7 space-y-4 relative overflow-hidden">
            <div className="pointer-events-none absolute -top-10 right-0 h-28 w-28 rounded-3xl border border-slate-700/70 rotate-12" />
            <h2 className="text-sm md:text-base font-semibold text-slate-50">
              Cambiar contraseña
            </h2>
            <p className="text-[0.75rem] text-slate-400">
              Usa una contraseña única y difícil de adivinar. No la compartas
              con nadie.
            </p>
            <div className="space-y-1">
              <label className="block text-[0.7rem] font-semibold uppercase tracking-[0.2em] text-slate-500">
                Nueva contraseña
              </label>
              <input
                type="password"
                value={nuevaPassword}
                onChange={(e) => setNuevaPassword(e.target.value)}
                className="w-full rounded-xl border border-slate-700/70 bg-slate-950/80 px-3 py-2 text-xs md:text-sm text-slate-50 shadow-inner focus:outline-none focus:ring-2 focus:ring-slate-50/40"
              />
            </div>
            <div className="pt-2 flex justify-end">
              <button
                type="button"
                onClick={handleCambiarPassword}
                disabled={cambiandoPassword}
                className="inline-flex items-center justify-center rounded-full bg-slate-50 px-4 py-1.5 text-[0.75rem] font-semibold uppercase tracking-[0.18em] text-slate-900 shadow-sm hover:bg-slate-200 active:translate-y-px disabled:opacity-60"
              >
                {cambiandoPassword ? "Actualizando..." : "Actualizar contraseña"}
              </button>
            </div>
          </div>
        </section>

        {/* Tarjeta de sesión */}
        <section className="rounded-3xl border border-slate-800 bg-slate-950/90 shadow-[0_18px_50px_rgba(15,23,42,0.95)] px-5 md:px-7 py-5 flex flex-col md:flex-row md:items-center md:justify-between gap-3">
          <div>
            <h2 className="text-sm md:text-base font-semibold text-slate-50">
              Sesión activa
            </h2>
            <p className="text-[0.75rem] md:text-xs text-slate-400 max-w-md mt-1">
              Si estás usando un equipo compartido o público, es recomendable
              cerrar tu sesión al terminar.
            </p>
          </div>
          <button
            type="button"
            onClick={logout}
            className="inline-flex items-center justify-center rounded-full border border-rose-500/80 bg-rose-600/90 px-4 py-1.5 text-[0.75rem] font-semibold uppercase tracking-[0.18em] text-rose-50 shadow-[0_10px_30px_rgba(248,113,113,0.7)] hover:bg-rose-500 active:translate-y-px transition-colors"
          >
            Cerrar sesión
          </button>
        </section>

        {/* Tus cursos recientes (solo instructor/admin) */}
        {(user?.rol === "ROLE_INSTRUCTOR" ||
          user?.rol === "ROLE_ADMIN" ||
          user?.rol === "INSTRUCTOR" ||
          user?.rol === "ADMIN") && (
          <section className="rounded-3xl border border-slate-800 bg-slate-950/95 shadow-[0_18px_50px_rgba(15,23,42,0.95)] px-5 md:px-7 py-6 space-y-3">
            <h2 className="text-sm md:text-base font-semibold text-slate-50">
              Tus cursos recientes
            </h2>
            {cursosRecientes.length === 0 ? (
              <p className="text-xs md:text-sm text-slate-400">
                No tienes cursos publicados todavía.
              </p>
            ) : (
              <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                {cursosRecientes.map((curso) => (
                  <div
                    key={curso.id}
                    className="flex flex-col overflow-hidden rounded-2xl border border-slate-800 bg-slate-900/80 shadow-[0_14px_40px_rgba(15,23,42,0.9)]"
                  >
                    <div className="h-28 overflow-hidden bg-slate-900/40">
                      <img
                        src={curso.imagenPortadaUrl || "/no-image.png"}
                        alt={curso.titulo}
                        onError={(e) => (e.target.src = "/no-image.png")}
                        className="h-full w-full object-cover"
                      />
                    </div>
                    <div className="flex-1 px-3 py-3 space-y-1">
                      <h3 className="text-xs md:text-sm font-semibold text-slate-50 line-clamp-2">
                        {curso.titulo}
                      </h3>
                      <p className="text-[0.7rem] text-slate-400">
                        {curso.categoria || "Sin categoría"}
                      </p>
                      <span className="inline-flex rounded-full bg-emerald-500/90 px-3 py-1 text-[0.65rem] font-semibold uppercase tracking-wide text-emerald-50">
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
    </main>
  );
};

export default Perfil;

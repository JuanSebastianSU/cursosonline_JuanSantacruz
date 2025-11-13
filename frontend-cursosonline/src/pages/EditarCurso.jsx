import React, { useContext, useEffect, useState } from "react";
import { AuthContext } from "../context/AuthContext";
import {
  obtenerUsuario,
  actualizarUsuario,
  cambiarPassword,
} from "../services/usuarioService";

/**
 * Perfil.js
 * Permite al usuario autenticado ver y actualizar su información.
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
        const data = await obtenerUsuario(user.userId);
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
      console.error(err);
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
      console.error(err);
      alert("Error al cambiar contraseña.");
    }
  };

  if (loading) {
    return (
      <div className="max-w-xl mx-auto px-4 py-10 text-center text-sm text-slate-500">
        Cargando perfil...
      </div>
    );
  }

  if (!perfil) {
    return (
      <div className="max-w-xl mx-auto px-4 py-10 text-center text-sm text-rose-600">
        Error: No se pudo cargar tu información.
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto px-4 md:px-6 py-8 md:py-10 space-y-6">
      {/* Encabezado */}
      <header className="rounded-3xl bg-gradient-to-r from-slate-900 via-slate-800 to-slate-900 px-6 py-6 md:px-8 md:py-7 shadow-[0_18px_55px_rgba(15,23,42,0.5)] text-center md:text-left">
        <h1 className="text-2xl md:text-3xl font-semibold tracking-tight text-amber-100">
          Mi perfil
        </h1>
        <p className="mt-2 text-xs md:text-sm text-slate-200 max-w-xl">
          Desde aquí puedes revisar tu información de cuenta, actualizar tu
          nombre y cambiar tu contraseña cuando lo necesites.
        </p>
      </header>

      {/* Información de la cuenta */}
      <section className="bg-white/95 rounded-3xl border border-slate-100 shadow-[0_16px_50px_rgba(15,23,42,0.18)] px-5 md:px-8 py-6 md:py-8 space-y-5">
        <h2 className="text-lg md:text-xl font-semibold text-slate-900 tracking-tight">
          Información de la cuenta
        </h2>

        <div className="space-y-4 text-sm">
          <div className="space-y-1">
            <label className="text-xs font-semibold uppercase tracking-wide text-slate-600">
              Correo electrónico
            </label>
            <input
              type="email"
              value={perfil.email || ""}
              disabled
              className="w-full rounded-xl border border-slate-200 bg-slate-50/80 px-3 py-2 text-sm text-slate-900 shadow-inner"
            />
          </div>

          <div className="space-y-1">
            <label className="text-xs font-semibold uppercase tracking-wide text-slate-600">
              Rol
            </label>
            <input
              type="text"
              value={perfil.rol || ""}
              disabled
              className="w-full rounded-xl border border-slate-200 bg-slate-50/80 px-3 py-2 text-sm text-slate-900 shadow-inner"
            />
          </div>

          <div className="space-y-1">
            <label className="text-xs font-semibold uppercase tracking-wide text-slate-600">
              Estado
            </label>
            <input
              type="text"
              value={perfil.estado || ""}
              disabled
              className="w-full rounded-xl border border-slate-200 bg-slate-50/80 px-3 py-2 text-sm text-slate-900 shadow-inner"
            />
          </div>

          <div className="space-y-1">
            <label className="text-xs font-semibold uppercase tracking-wide text-slate-600">
              Nombre
            </label>
            {editando ? (
              <input
                type="text"
                value={nuevoNombre}
                onChange={(e) => setNuevoNombre(e.target.value)}
                className="w-full rounded-xl border border-slate-300 bg-white px-3 py-2 text-sm text-slate-900 shadow-inner focus:border-slate-900 focus:outline-none focus:ring-2 focus:ring-slate-900/10"
              />
            ) : (
              <input
                type="text"
                value={perfil.nombre || ""}
                disabled
                className="w-full rounded-xl border border-slate-200 bg-slate-50/80 px-3 py-2 text-sm text-slate-900 shadow-inner"
              />
            )}
          </div>
        </div>

        <div className="mt-4 flex flex-col-reverse gap-3 sm:flex-row sm:justify-end">
          {editando ? (
            <>
              <button
                className="inline-flex items-center justify-center rounded-full border border-slate-300 px-4 py-2 text-xs md:text-sm font-semibold text-slate-700 hover:bg-slate-100 active:translate-y-px transition"
                onClick={() => setEditando(false)}
              >
                Cancelar
              </button>
              <button
                className="inline-flex items-center justify-center rounded-full bg-slate-900 px-5 py-2 text-xs md:text-sm font-semibold text-amber-100 shadow-sm hover:bg-slate-800 active:translate-y-px disabled:opacity-60 disabled:cursor-not-allowed transition"
                onClick={handleGuardarCambios}
                disabled={guardando}
              >
                {guardando ? "Guardando..." : "Guardar cambios"}
              </button>
            </>
          ) : (
            <button
              className="inline-flex items-center justify-center rounded-full bg-slate-900 px-5 py-2 text-xs md:text-sm font-semibold text-amber-100 shadow-sm hover:bg-slate-800 active:translate-y-px transition"
              onClick={() => setEditando(true)}
            >
              Editar nombre
            </button>
          )}
        </div>
      </section>

      {/* Grid inferior: contraseña + sesión */}
      <div className="grid gap-5 md:grid-cols-2">
        {/* Cambiar contraseña */}
        <section className="bg-white/95 rounded-3xl border border-slate-100 shadow-[0_14px_40px_rgba(15,23,42,0.16)] px-5 md:px-7 py-5 flex flex-col justify-between gap-4">
          <div className="space-y-2">
            <h2 className="text-base md:text-lg font-semibold text-slate-900">
              Cambiar contraseña
            </h2>
            <p className="text-xs md:text-sm text-slate-500">
              Usa una contraseña segura con al menos 6 caracteres.
            </p>
          </div>

          <div className="space-y-2">
            <label className="text-xs font-semibold uppercase tracking-wide text-slate-600">
              Nueva contraseña
            </label>
            <input
              type="password"
              value={nuevaPassword}
              onChange={(e) => setNuevaPassword(e.target.value)}
              className="w-full rounded-xl border border-slate-300 bg-white px-3 py-2 text-sm text-slate-900 shadow-inner focus:border-slate-900 focus:outline-none focus:ring-2 focus:ring-slate-900/10"
            />
          </div>

          <div className="flex justify-end">
            <button
              className="inline-flex items-center justify-center rounded-full bg-emerald-600 px-5 py-2 text-xs md:text-sm font-semibold text-emerald-50 shadow-sm hover:bg-emerald-700 active:translate-y-px transition"
              onClick={handleCambiarPassword}
            >
              Actualizar contraseña
            </button>
          </div>
        </section>

        {/* Sesión */}
        <section className="bg-white/95 rounded-3xl border border-slate-100 shadow-[0_14px_40px_rgba(15,23,42,0.16)] px-5 md:px-7 py-5 flex flex-col justify-between gap-4">
          <div className="space-y-2">
            <h2 className="text-base md:text-lg font-semibold text-slate-900">
              Sesión
            </h2>
            <p className="text-xs md:text-sm text-slate-500">
              Si estás usando un equipo compartido o público, recuerda cerrar
              sesión al terminar.
            </p>
          </div>

          <div className="flex justify-end">
            <button
              className="inline-flex items-center justify-center rounded-full bg-rose-600 px-5 py-2 text-xs md:text-sm font-semibold text-rose-50 shadow-sm hover:bg-rose-700 active:translate-y-px transition"
              onClick={logout}
            >
              Cerrar sesión
            </button>
          </div>
        </section>
      </div>
    </div>
  );
};

export default Perfil;

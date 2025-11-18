// src/pages/AdminUsuariosGestion.jsx
import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import {
  listarUsuariosAdmin,
  listarTiposUsuario,
  cambiarEstadoUsuario,
  actualizarRolUsuario,
  cambiarPasswordUsuario,
  eliminarUsuarioAdmin,
} from "../services/adminUsuarioService";

const AdminUsuariosGestion = () => {
  const navigate = useNavigate();

  const [usuarios, setUsuarios] = useState([]);
  const [tiposUsuario, setTiposUsuario] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [filtroTexto, setFiltroTexto] = useState("");
  const [estadoFiltro, setEstadoFiltro] = useState("TODOS");

  const cargarDatos = async () => {
    setLoading(true);
    setError("");
    try {
      const [users, tipos] = await Promise.all([
        listarUsuariosAdmin(),
        listarTiposUsuario(),
      ]);
      setUsuarios(users || []);
      setTiposUsuario(tipos || []);
    } catch (err) {
      console.error("Error cargando datos de admin usuarios:", err);
      const msg =
        err.response?.data?.message ||
        err.response?.data ||
        "No se pudieron cargar los usuarios.";
      setError(msg);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    cargarDatos();
  }, []);

  const estadosPosibles = ["ACTIVO", "INACTIVO", "BLOQUEADO"];

  const handleCambiarEstado = async (u, nuevoEstado) => {
    if (!window.confirm(`¿Cambiar estado de ${u.nombre} a ${nuevoEstado}?`)) {
      return;
    }
    try {
      await cambiarEstadoUsuario(u.id, nuevoEstado);
      await cargarDatos();
    } catch (err) {
      alert(
        err.response?.data?.message ||
          err.response?.data ||
          "Error al cambiar estado."
      );
    }
  };

  const handleCambiarRol = async (u, nuevoRol) => {
    if (!nuevoRol || nuevoRol === u.rol) return;
    if (
      !window.confirm(
        `¿Cambiar el rol de ${u.nombre} de "${u.rol}" a "${nuevoRol}"?`
      )
    ) {
      return;
    }
    try {
      await actualizarRolUsuario(u.id, nuevoRol);
      await cargarDatos();
    } catch (err) {
      alert(
        err.response?.data?.message ||
          err.response?.data ||
          "Error al actualizar rol."
      );
    }
  };

  const handleResetPassword = async (u) => {
    const pwd = window.prompt(
      `Nueva contraseña para ${u.nombre} (${u.email}):`
    );
    if (!pwd) return;
    try {
      await cambiarPasswordUsuario(u.id, pwd);
      alert("Contraseña actualizada correctamente.");
    } catch (err) {
      alert(
        err.response?.data?.message ||
          err.response?.data ||
          "Error al cambiar contraseña."
      );
    }
  };

  const handleEliminar = async (u) => {
    if (
      !window.confirm(
        `¿Seguro que deseas eliminar al usuario "${u.nombre}"? Esta acción no se puede deshacer.`
      )
    ) {
      return;
    }
    try {
      await eliminarUsuarioAdmin(u.id);
      await cargarDatos();
    } catch (err) {
      alert(
        err.response?.data?.message ||
          err.response?.data ||
          "Error al eliminar usuario."
      );
    }
  };

  const usuariosFiltrados = usuarios.filter((u) => {
    if (filtroTexto.trim()) {
      const q = filtroTexto.toLowerCase();
      const campos = [
        u.nombre,
        u.email,
        u.rol,
        u.estado,
        u.id,
      ]
        .filter(Boolean)
        .map(String);
      const coincide = campos.some((c) => c.toLowerCase().includes(q));
      if (!coincide) return false;
    }

    if (estadoFiltro !== "TODOS") {
      if (!u.estado || u.estado.toUpperCase() !== estadoFiltro) return false;
    }
    return true;
  });

  const normalizarEstado = (estado) => (estado || "N/D").toUpperCase();

  return (
    <main className="flex-1 bg-slate-950/90 text-slate-50">
      <div className="max-w-6xl mx-auto px-4 md:px-6 py-8 md:py-10 space-y-7">
        {/* Volver + título */}
        <button
          type="button"
          onClick={() => navigate(-1)}
          className="inline-flex items-center gap-2 rounded-full border border-slate-700/70 bg-slate-950/80 px-4 py-1.5 text-[0.7rem] md:text-xs font-semibold uppercase tracking-[0.22em] text-slate-200 hover:border-amber-400/80 hover:text-amber-200 hover:bg-slate-900 transition-colors"
        >
          <span className="text-sm">←</span> Volver
        </button>

        <section className="relative overflow-hidden rounded-[2.5rem] border border-slate-800 bg-gradient-to-r from-slate-950 via-slate-900 to-slate-950 px-5 md:px-8 py-6 md:py-7 shadow-[0_24px_90px_rgba(0,0,0,0.95)]">
          <div className="pointer-events-none absolute -left-24 -top-24 h-64 w-64 rounded-full border border-slate-700/60" />
          <div className="pointer-events-none absolute -right-16 -bottom-28 h-72 w-72 rounded-[40%] border border-slate-800/70" />

          <div className="relative space-y-3">
            <span className="inline-flex items-center rounded-full bg-sky-400/95 px-3 py-1 text-[0.7rem] font-semibold uppercase tracking-[0.22em] text-slate-950 shadow-[0_0_25px_rgba(56,189,248,0.9)]">
              Panel de usuarios
            </span>
            <h1 className="text-2xl md:text-3xl font-semibold tracking-tight text-slate-50">
              Gestión de usuarios
            </h1>
            <p className="max-w-2xl text-xs md:text-sm text-slate-300/90">
              Aquí puedes ver todos los usuarios de la plataforma, cambiar su
              estado, rol, contraseña o eliminar cuentas cuando sea necesario.
            </p>
          </div>
        </section>

        {/* Filtros */}
        <section className="flex flex-col md:flex-row md:items-center md:justify-between gap-3">
          <div className="w-full md:max-w-sm">
            <label className="block text-[0.7rem] font-semibold uppercase tracking-[0.24em] text-slate-500 mb-1.5">
              Buscar
            </label>
            <div className="relative">
              <span className="pointer-events-none absolute inset-y-0 left-3 flex items-center text-slate-500 text-xs">
                🔎
              </span>
              <input
                type="text"
                value={filtroTexto}
                onChange={(e) => setFiltroTexto(e.target.value)}
                placeholder="Nombre, email, rol..."
                className="w-full rounded-full border border-slate-700/70 bg-slate-950/70 pl-8 pr-3 py-1.5 text-xs md:text-sm text-slate-100 placeholder:text-slate-500 focus:outline-none focus:ring-2 focus:ring-slate-50/40"
              />
            </div>
          </div>

          <div className="flex items-center gap-3">
            <div>
              <label className="block text-[0.7rem] font-semibold uppercase tracking-[0.24em] text-slate-500 mb-1.5">
                Estado
              </label>
              <select
                value={estadoFiltro}
                onChange={(e) => setEstadoFiltro(e.target.value)}
                className="rounded-full border border-slate-700 bg-slate-950 px-3 py-1.5 text-[0.75rem] text-slate-100 focus:outline-none focus:ring-2 focus:ring-slate-50/40"
              >
                <option value="TODOS">Todos</option>
                <option value="ACTIVO">Activo</option>
                <option value="INACTIVO">Inactivo</option>
                <option value="BLOQUEADO">Bloqueado</option>
              </select>
            </div>

            <button
              type="button"
              onClick={cargarDatos}
              className="inline-flex items-center justify-center rounded-full border border-slate-700/80 bg-slate-950/80 px-3 py-1.5 text-[0.7rem] font-semibold uppercase tracking-[0.24em] text-slate-300 hover:border-slate-300 hover:text-slate-50 transition-colors"
            >
              ↻ Actualizar
            </button>
          </div>
        </section>

        {/* Tabla */}
        <section className="mt-2">
          <div className="overflow-x-auto rounded-3xl border border-slate-800 bg-slate-950/90 shadow-[0_22px_70px_rgba(15,23,42,1)]">
            {loading ? (
              <div className="px-4 py-6 text-sm text-slate-300">
                Cargando usuarios...
              </div>
            ) : error ? (
              <div className="px-4 py-6 text-sm text-red-200 bg-red-900/40 border-b border-red-500/50">
                {error}
              </div>
            ) : usuariosFiltrados.length === 0 ? (
              <div className="px-4 py-6 text-sm text-slate-300">
                No hay usuarios que coincidan con el filtro.
              </div>
            ) : (
              <table className="min-w-full text-xs md:text-sm">
                <thead>
                  <tr className="bg-gradient-to-r from-slate-900 via-slate-950 to-slate-900 text-slate-100 border-b border-slate-800/80">
                    <th className="px-4 py-3 text-left text-[0.65rem] md:text-[0.7rem] font-semibold tracking-[0.2em] uppercase">
                      Usuario
                    </th>
                    <th className="px-4 py-3 text-left text-[0.65rem] md:text-[0.7rem] font-semibold tracking-[0.2em] uppercase">
                      Rol
                    </th>
                    <th className="px-4 py-3 text-left text-[0.65rem] md:text-[0.7rem] font-semibold tracking-[0.2em] uppercase">
                      Estado
                    </th>
                    <th className="px-4 py-3 text-left text-[0.65rem] md:text-[0.7rem] font-semibold tracking-[0.2em] uppercase">
                      Último acceso
                    </th>
                    <th className="px-4 py-3 text-right text-[0.65rem] md:text-[0.7rem] font-semibold tracking-[0.2em] uppercase">
                      Acciones
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {usuariosFiltrados.map((u) => (
                    <tr
                      key={u.id}
                      className="border-t border-slate-800/70 hover:bg-slate-900/70 transition-colors"
                    >
                      <td className="px-4 py-3 align-middle">
                        <div className="flex flex-col gap-0.5">
                          <span className="text-slate-50 font-semibold line-clamp-1">
                            {u.nombre || "Sin nombre"}
                          </span>
                          <span className="text-[0.7rem] text-slate-400">
                            {u.email}
                          </span>
                          <span className="text-[0.65rem] text-slate-500">
                            ID: {u.id}
                          </span>
                        </div>
                      </td>

                      <td className="px-4 py-3 align-middle text-slate-200">
                        <div className="flex items-center gap-2">
                          <select
                            value={u.rol || ""}
                            onChange={(e) =>
                              handleCambiarRol(u, e.target.value)
                            }
                            className="rounded-full border border-slate-700 bg-slate-950 px-2 py-1 text-[0.7rem] text-slate-100 max-w-[9rem]"
                          >
                            {/* Opciones desde TipoUsuario */}
                            {tiposUsuario.map((t) => (
                              <option key={t.id} value={t.nombre}>
                                {t.nombre}
                              </option>
                            ))}
                            {/* Por si el rol actual no está en la lista */}
                            {u.rol &&
                              !tiposUsuario.some(
                                (t) => t.nombre === u.rol
                              ) && (
                                <option value={u.rol}>{u.rol}</option>
                              )}
                          </select>
                        </div>
                      </td>

                      <td className="px-4 py-3 align-middle text-slate-200">
                        {normalizarEstado(u.estado)}
                      </td>

                      <td className="px-4 py-3 align-middle text-slate-200">
                        <span className="text-[0.7rem] text-slate-400">
                          {u.lastLoginAt || "—"}
                        </span>
                      </td>

                      <td className="px-4 py-3 align-middle">
                        <div className="flex flex-wrap justify-end gap-1.5">
                          {estadosPosibles.map((est) => (
                            <button
                              key={est}
                              type="button"
                              onClick={() => handleCambiarEstado(u, est)}
                              className="inline-flex items-center justify-center rounded-full border border-slate-600/80 bg-slate-900 px-2.5 py-1 text-[0.65rem] font-semibold text-slate-200 hover:border-emerald-400 hover:text-emerald-200 hover:bg-emerald-500/10 active:translate-y-px transition"
                            >
                              {est}
                            </button>
                          ))}

                          <button
                            type="button"
                            onClick={() => handleResetPassword(u)}
                            className="inline-flex items-center justify-center rounded-full border border-sky-500/80 bg-slate-900 px-2.5 py-1 text-[0.65rem] font-semibold text-sky-200 hover:border-sky-300 hover:text-sky-100 hover:bg-sky-500/15 active:translate-y-px transition"
                          >
                            Reset pass
                          </button>

                          <button
                            type="button"
                            onClick={() => handleEliminar(u)}
                            className="inline-flex items-center justify-center rounded-full border border-rose-700/80 bg-slate-900 px-2.5 py-1 text-[0.65rem] font-semibold text-rose-300 hover:border-rose-400 hover:text-rose-50 hover:bg-rose-600/80 active:translate-y-px transition"
                          >
                            Eliminar
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>
        </section>

        <section className="pt-1">
          <p className="text-[0.7rem] text-slate-500 max-w-md">
            Tip: usa el filtro de texto para localizar rápido usuarios por
            nombre, email, rol o ID. Los cambios de estado y rol se envían
            directamente al backend.
          </p>
        </section>
      </div>
    </main>
  );
};

export default AdminUsuariosGestion;

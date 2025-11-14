import React, { useEffect, useState } from "react";
import {
  listarUsuarios,
  cambiarEstadoUsuario,
  eliminarUsuario,
  actualizarUsuario,
} from "../services/usuarioService";

/**
 * Estudiantes.js
 * Panel de administración de usuarios/estudiantes (rol ADMIN).
 */
const Estudiantes = () => {
  const [usuarios, setUsuarios] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [filtro, setFiltro] = useState("");

  // ====================== CARGAR USUARIOS ======================
  const cargarUsuarios = async () => {
    setLoading(true);
    setError("");
    try {
      const data = await listarUsuarios();
      setUsuarios(data || []);
    } catch (err) {
      console.error("Error al cargar usuarios:", err);
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

  const usuariosFiltrados = usuarios.filter((u) => {
    if (!filtro.trim()) return true;
    const q = filtro.toLowerCase();
    return (
      u.nombre?.toLowerCase().includes(q) ||
      u.email?.toLowerCase().includes(q) ||
      u.rol?.toLowerCase().includes(q)
    );
  });

  // ====================== ELIMINAR ======================
  const handleEliminar = async (id) => {
    if (!window.confirm("¿Eliminar este usuario definitivamente?")) return;
    try {
      const ok = await eliminarUsuario(id);
      if (ok !== false) {
        alert("Usuario eliminado correctamente.");
        cargarUsuarios();
      } else {
        alert("Error al eliminar usuario.");
      }
    } catch (err) {
      console.error("Error al eliminar usuario:", err);
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
    } catch (err) {
      console.error("Error al cambiar estado:", err);
      alert("Error al cambiar estado.");
    }
  };

  // ====================== CAMBIAR ROL ======================
  const handleCambiarRol = async (id, nuevoRol) => {
    try {
      await actualizarUsuario(id, { rol: nuevoRol });
      alert(`Rol cambiado a ${nuevoRol}`);
      cargarUsuarios();
    } catch (err) {
      console.error("Error al cambiar rol:", err);
      alert("Error al cambiar rol.");
    }
  };

  const estadoBadgeClass = (estado) => {
    const base =
      "inline-flex items-center rounded-full px-3 py-1 text-[0.65rem] font-semibold uppercase tracking-[0.18em]";
    if (estado === "ACTIVO") {
      return (
        base +
        " bg-emerald-400/90 text-slate-950 shadow-[0_8px_22px_rgba(52,211,153,0.7)]"
      );
    }
    if (estado === "INACTIVO") {
      return (
        base +
        " bg-rose-500/95 text-slate-50 shadow-[0_8px_22px_rgba(244,63,94,0.7)]"
      );
    }
    return base + " bg-slate-600/90 text-slate-50";
  };

  return (
    <main className="flex-1 bg-slate-950/80 text-slate-50">
      {/* Halos / garabatos de fondo */}
      <div className="pointer-events-none fixed inset-0 -z-10">
        <div className="absolute -top-28 left-1/2 h-64 w-72 -translate-x-1/2 rounded-full bg-[radial-gradient(circle,_rgba(248,250,252,0.12),_transparent_60%)] blur-3xl opacity-80" />
        <div className="absolute -right-24 bottom-16 h-60 w-60 rounded-full bg-emerald-500/18 blur-3xl" />
        <div className="absolute -left-32 top-48 h-60 w-80 -rotate-6 bg-gradient-to-r from-sky-400/18 via-transparent to-amber-400/22 blur-2xl" />
      </div>

      <div className="max-w-6xl mx-auto px-4 md:px-6 py-8 md:py-10 space-y-7">
        {/* ENCABEZADO */}
        <header className="flex flex-col md:flex-row md:items-end md:justify-between gap-4 border-b border-slate-800 pb-4">
          <div className="space-y-2">
            <p className="inline-flex items-center gap-2 rounded-full border border-slate-700/80 bg-slate-950/80 px-3 py-1 text-[0.65rem] font-semibold uppercase tracking-[0.3em] text-slate-400">
              <span className="h-1.5 w-8 -skew-x-12 rounded-full bg-gradient-to-r from-emerald-300/90 via-sky-300/90 to-amber-300/90" />
              Usuarios
            </p>
            <h1 className="text-2xl md:text-3xl font-semibold tracking-tight text-slate-50">
              Gestión de usuarios
            </h1>
            <p className="text-xs md:text-sm text-slate-400 max-w-xl">
              Administra cuentas, roles y estados de los usuarios de la
              plataforma. Mantén el acceso bajo control sin perder la elegancia.
            </p>
          </div>

          <div className="flex flex-col items-stretch sm:items-end gap-2">
            <p className="text-[0.7rem] text-slate-500">
              {usuarios.length === 0 ? (
                <>No hay usuarios registrados todavía.</>
              ) : (
                <>
                  {usuarios.length} usuario
                  {usuarios.length !== 1 && "s"} en el sistema
                </>
              )}
            </p>
          </div>
        </header>

        {/* FILTRO / BUSCADOR */}
        <section className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
          <div className="w-full lg:max-w-sm">
            <label className="block text-[0.7rem] font-semibold uppercase tracking-[0.24em] text-slate-500 mb-1.5">
              Buscar usuarios
            </label>
            <div className="relative">
              <span className="pointer-events-none absolute inset-y-0 left-3 flex items-center text-slate-500 text-xs">
                🔎
              </span>
              <input
                type="text"
                placeholder="Nombre, correo o rol..."
                value={filtro}
                onChange={handleBuscar}
                className="w-full rounded-full border border-slate-700/70 bg-slate-950/70 pl-8 pr-3 py-1.5 text-xs md:text-sm text-slate-100 placeholder:text-slate-500 focus:outline-none focus:ring-2 focus:ring-slate-50/40"
              />
            </div>
          </div>

          <button
            type="button"
            onClick={cargarUsuarios}
            className="inline-flex items-center justify-center rounded-full border border-slate-700/80 bg-slate-950/80 px-3 py-1.5 text-[0.7rem] font-semibold uppercase tracking-[0.24em] text-slate-300 hover:border-slate-300 hover:text-slate-50 transition-colors self-start lg:self-auto"
          >
            ↻ Recargar
          </button>
        </section>

        {/* TABLA / LISTADO */}
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
                {usuarios.length === 0 ? (
                  <>No hay usuarios registrados.</>
                ) : (
                  <>No se encontraron usuarios para el criterio de búsqueda.</>
                )}
              </div>
            ) : (
              <table className="min-w-full text-xs md:text-sm">
                <thead>
                  <tr className="bg-gradient-to-r from-slate-900 via-slate-950 to-slate-900 text-slate-100 border-b border-slate-800/80">
                    <th className="px-4 py-3 text-left text-[0.65rem] md:text-[0.7rem] font-semibold tracking-[0.2em] uppercase">
                      Nombre
                    </th>
                    <th className="px-4 py-3 text-left text-[0.65rem] md:text-[0.7rem] font-semibold tracking-[0.2em] uppercase">
                      Email
                    </th>
                    <th className="px-4 py-3 text-left text-[0.65rem] md:text-[0.7rem] font-semibold tracking-[0.2em] uppercase">
                      Rol
                    </th>
                    <th className="px-4 py-3 text-left text-[0.65rem] md:text-[0.7rem] font-semibold tracking-[0.2em] uppercase">
                      Estado
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
                          <span className="text-[0.7rem] text-slate-500">
                            ID #{u.id}
                          </span>
                        </div>
                      </td>
                      <td className="px-4 py-3 align-middle text-slate-200">
                        {u.email}
                      </td>
                      <td className="px-4 py-3 align-middle">
                        <select
                          value={u.rol}
                          onChange={(e) =>
                            handleCambiarRol(u.id, e.target.value)
                          }
                          className="rounded-full border border-slate-700/80 bg-slate-950/80 px-3 py-1 text-[0.7rem] text-slate-100 focus:outline-none focus:ring-2 focus:ring-slate-50/40"
                        >
                          <option value="USUARIO">Usuario</option>
                          <option value="INSTRUCTOR">Instructor</option>
                          <option value="ADMIN">Admin</option>
                        </select>
                      </td>
                      <td className="px-4 py-3 align-middle">
                        <span className={estadoBadgeClass(u.estado)}>
                          {u.estado || "N/D"}
                        </span>
                      </td>
                      <td className="px-4 py-3 align-middle">
                        <div className="flex justify-end gap-1.5">
                          <button
                            type="button"
                            onClick={() =>
                              handleCambiarEstado(u.id, u.estado)
                            }
                            className="inline-flex items-center justify-center rounded-full border border-amber-400/70 px-3 py-1 text-[0.7rem] font-semibold uppercase tracking-[0.18em] text-amber-200 hover:border-amber-300 hover:bg-amber-400 hover:text-slate-950 transition-colors"
                          >
                            {u.estado === "ACTIVO"
                              ? "Desactivar"
                              : "Activar"}
                          </button>
                          <button
                            type="button"
                            onClick={() => handleEliminar(u.id)}
                            className="inline-flex h-8 w-8 items-center justify-center rounded-full border border-rose-700/80 text-[0.9rem] text-rose-300 hover:border-rose-400 hover:bg-rose-600 hover:text-rose-50 transition-colors"
                            title="Eliminar usuario"
                          >
                            🗑️
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

        {/* NOTA / AYUDA */}
        <section className="pt-1">
          <p className="text-[0.7rem] text-slate-500 max-w-md">
            Usa este panel con cuidado: los cambios de rol y estado afectan el
            acceso de los usuarios a cursos, áreas de instructor y funciones de
            administración.
          </p>
        </section>
      </div>
    </main>
  );
};

export default Estudiantes;

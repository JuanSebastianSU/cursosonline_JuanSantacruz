import React, { useEffect, useState } from "react";
import {
  listarUsuarios,
  cambiarEstadoUsuario,
  eliminarUsuario,
  actualizarUsuario,
} from "../services/usuarioService";

/**
 * Estudiantes.js
 * Vista administrativa para gestionar usuarios del sistema.
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
      const data = await listarUsuarios(); // lista directa
      setUsuarios(data || []);
    } catch (err) {
      console.error(err);
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
    } catch (err) {
      console.error(err);
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
      console.error(err);
      alert("Error al cambiar rol.");
    }
  };

  const getEstadoPillClass = (estado) => {
    const base =
      "inline-flex items-center rounded-full px-3 py-1 text-[0.7rem] font-semibold uppercase tracking-wide";
    if (estado === "ACTIVO") {
      return `${base} bg-emerald-500/90 text-emerald-50`;
    }
    return `${base} bg-rose-500/90 text-rose-50`;
  };

  return (
    <div className="max-w-6xl mx-auto px-4 md:px-6 py-8 md:py-10 space-y-6">
      {/* Encabezado */}
      <header className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 border-b border-slate-200 pb-4">
        <div className="space-y-1 text-center md:text-left">
          <h1 className="text-2xl md:text-3xl font-semibold tracking-tight text-slate-900">
            Gestión de usuarios
          </h1>
          <p className="text-xs md:text-sm text-slate-500 max-w-xl">
            Administra los usuarios del sistema: roles, estados y eliminación
            de cuentas cuando sea necesario.
          </p>
        </div>

        <div className="flex flex-col sm:flex-row gap-2 sm:items-center">
          <input
            type="text"
            placeholder="Buscar por nombre, correo o rol..."
            value={filtro}
            onChange={handleBuscar}
            className="w-full sm:w-64 rounded-full border border-slate-300 bg-white px-4 py-2 text-xs md:text-sm text-slate-800 shadow-inner focus:border-slate-900 focus:outline-none focus:ring-2 focus:ring-slate-900/10"
          />
          <button
            onClick={cargarUsuarios}
            className="inline-flex items-center justify-center rounded-full bg-slate-900 px-4 py-2 text-xs md:text-sm font-semibold text-amber-100 shadow-sm hover:bg-slate-800 active:translate-y-px transition"
          >
            🔄 Recargar
          </button>
        </div>
      </header>

      {/* Contenido */}
      {loading ? (
        <div className="text-sm md:text-base text-slate-500">
          Cargando usuarios...
        </div>
      ) : error ? (
        <div className="rounded-2xl border border-rose-200 bg-rose-50 px-4 py-3 text-xs md:text-sm text-rose-700">
          {error}
        </div>
      ) : (
        <section className="rounded-3xl border border-slate-200 bg-white/95 shadow-[0_16px_50px_rgba(15,23,42,0.18)] overflow-hidden">
          <div className="px-4 py-3 flex items-center justify-between text-[0.7rem] md:text-xs text-slate-500">
            <span className="font-medium text-slate-700">
              Usuarios encontrados: {usuariosFiltrados.length}
            </span>
            {filtro && (
              <span>
                Filtro aplicado:{" "}
                <span className="font-semibold text-slate-900">{filtro}</span>
              </span>
            )}
          </div>

          <div className="overflow-x-auto border-t border-slate-200">
            <table className="min-w-full text-xs md:text-sm">
              <thead>
                <tr className="bg-slate-900 text-slate-50">
                  <th className="px-4 py-3 text-left text-[0.7rem] font-semibold tracking-wide uppercase">
                    Nombre
                  </th>
                  <th className="px-4 py-3 text-left text-[0.7rem] font-semibold tracking-wide uppercase">
                    Email
                  </th>
                  <th className="px-4 py-3 text-left text-[0.7rem] font-semibold tracking-wide uppercase">
                    Rol
                  </th>
                  <th className="px-4 py-3 text-left text-[0.7rem] font-semibold tracking-wide uppercase">
                    Estado
                  </th>
                  <th className="px-4 py-3 text-right text-[0.7rem] font-semibold tracking-wide uppercase">
                    Acciones
                  </th>
                </tr>
              </thead>
              <tbody>
                {usuariosFiltrados.length === 0 ? (
                  <tr>
                    <td
                      colSpan={5}
                      className="px-4 py-6 text-center text-xs md:text-sm text-slate-500"
                    >
                      No se encontraron usuarios.
                    </td>
                  </tr>
                ) : (
                  usuariosFiltrados.map((u) => (
                    <tr
                      key={u.id}
                      className="border-t border-slate-100 hover:bg-slate-50/80 transition-colors"
                    >
                      <td className="px-4 py-3 align-middle text-slate-900">
                        {u.nombre || "—"}
                      </td>
                      <td className="px-4 py-3 align-middle text-slate-700">
                        {u.email || "—"}
                      </td>
                      <td className="px-4 py-3 align-middle text-slate-700">
                        <select
                          value={u.rol}
                          onChange={(e) =>
                            handleCambiarRol(u.id, e.target.value)
                          }
                          className="rounded-full border border-slate-300 bg-white px-3 py-1 text-[0.7rem] font-medium text-slate-800 shadow-sm focus:border-slate-900 focus:outline-none"
                        >
                          <option value="USUARIO">Usuario</option>
                          <option value="INSTRUCTOR">Instructor</option>
                          <option value="ADMIN">Admin</option>
                        </select>
                      </td>
                      <td className="px-4 py-3 align-middle">
                        <span className={getEstadoPillClass(u.estado)}>
                          {u.estado || "N/D"}
                        </span>
                      </td>
                      <td className="px-4 py-3 align-middle">
                        <div className="flex justify-end gap-2">
                          <button
                            className="inline-flex items-center justify-center rounded-full border border-slate-300 px-3 py-1.5 text-[0.7rem] font-semibold text-slate-800 hover:bg-slate-900 hover:text-amber-100 hover:border-slate-900 active:translate-y-px transition"
                            onClick={() =>
                              handleCambiarEstado(u.id, u.estado)
                            }
                          >
                            {u.estado === "ACTIVO"
                              ? "Desactivar"
                              : "Activar"}
                          </button>
                          <button
                            className="inline-flex items-center justify-center rounded-full border border-rose-300 px-3 py-1.5 text-[0.7rem] font-semibold text-rose-700 hover:bg-rose-700 hover:text-rose-50 hover:border-rose-700 active:translate-y-px transition"
                            onClick={() => handleEliminar(u.id)}
                          >
                            Eliminar
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </section>
      )}
    </div>
  );
};

export default Estudiantes;

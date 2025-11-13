import React, { useContext, useEffect, useState } from "react";
import { AuthContext } from "../context/AuthContext";
import { listarCursos } from "../services/cursoService";

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

        if (esInstructor || esAdmin) {
          // Cursos del instructor/admin
          data = await listarCursos({
            idInstructor: user.userId,
            estado: "PUBLICADO",
          });
        } else {
          // Estudiante: cursos públicos
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

    if (user) {
      fetchCursos();
    }
  }, [user, esInstructor, esAdmin]);

  // Colores de badge según estado (solo Tailwind)
  const getBadgeTone = (estado) => {
    switch ((estado || "").toUpperCase()) {
      case "PUBLICADO":
        return "bg-emerald-500 text-white";
      case "BORRADOR":
        return "bg-amber-300 text-slate-900";
      case "ARCHIVADO":
        return "bg-slate-500 text-white";
      default:
        return "bg-sky-500 text-white";
    }
  };

  if (!user)
    return (
      <div className="flex items-center justify-center min-h-[50vh] bg-slate-50">
        <p className="text-sm md:text-base text-slate-600">
          No se ha iniciado sesión.
        </p>
      </div>
    );

  return (
    <div className="max-w-6xl mx-auto px-4 md:px-6 py-8 md:py-10 flex flex-col gap-6">
      {/* Título */}
      <header className="text-center mb-2">
        <h1 className="text-2xl md:text-3xl font-semibold text-slate-900 tracking-tight">
          Bienvenido, {user.username}
        </h1>
        <p className="text-xs md:text-sm text-slate-500 mt-1">
          Este es tu panel general. Revisa tu cuenta, cursos visibles y
          actividad reciente.
        </p>
      </header>

      {/* Layout principal en grid */}
      <div className="grid gap-6 lg:grid-cols-3 items-start">
        {/* === Información del usuario === */}
        <section className="lg:col-span-1 bg-white/95 rounded-3xl border border-slate-100 shadow-[0_20px_60px_rgba(15,23,42,0.14)] px-5 md:px-6 py-5 md:py-6">
          <h2 className="text-lg font-semibold text-slate-900 mb-2">
            Información de tu cuenta
          </h2>

          <div className="space-y-1 text-sm text-slate-700">
            <p>
              <strong>ID Usuario:</strong> {user.userId}
            </p>
            <p>
              <strong>Rol:</strong>{" "}
              {Array.isArray(user.roles) && user.roles.length
                ? user.roles.join(", ")
                : "N/D"}
            </p>
            <p>
              <strong>Correo:</strong> {user.email || "No disponible"}
            </p>
          </div>

          <button
            className="mt-4 inline-flex items-center justify-center rounded-full bg-orange-500 hover:bg-orange-600 active:translate-y-[1px] px-4 py-2 text-xs md:text-sm font-semibold text-white shadow-sm transition"
            onClick={logout}
          >
            Cerrar sesión
          </button>
        </section>

        {/* === Cursos visibles === */}
        <section className="lg:col-span-2 bg-white/95 rounded-3xl border border-slate-100 shadow-[0_20px_60px_rgba(15,23,42,0.14)] px-5 md:px-6 py-5 md:py-6 flex flex-col gap-3">
          <div className="flex items-center justify-between gap-3 flex-wrap mb-1">
            <div>
              <h2 className="text-lg font-semibold text-slate-900">
                {esAdmin
                  ? "Cursos publicados"
                  : esInstructor
                  ? "Tus cursos publicados"
                  : "Cursos disponibles"}
              </h2>
              <p className="text-xs md:text-sm text-slate-500">
                {esAdmin || esInstructor
                  ? "Listado de cursos que tienes publicados actualmente."
                  : "Cursos públicos a los que puedes inscribirte desde el catálogo."}
              </p>
            </div>
          </div>

          {loading ? (
            <p className="text-sm text-slate-500">Cargando cursos...</p>
          ) : misCursos.length === 0 ? (
            <p className="text-sm text-slate-500">
              No hay cursos disponibles actualmente.
            </p>
          ) : (
            <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
              {misCursos.map((curso) => (
                <div
                  key={curso.id}
                  className="bg-sky-50/70 rounded-2xl overflow-hidden flex flex-col shadow-sm border border-slate-100"
                >
                  <div className="relative w-full h-40 overflow-hidden">
                    <img
                      src={
                        curso.imagenPortadaUrl ||
                        "https://via.placeholder.com/200x120?text=Sin+imagen"
                      }
                      alt={curso.titulo}
                      className="w-full h-full object-cover"
                    />
                    {curso.estado && (
                      <span
                        className={`absolute top-2 left-2 inline-flex items-center rounded-full px-2.5 py-0.5 text-[0.65rem] font-semibold uppercase tracking-wide ${getBadgeTone(
                          curso.estado
                        )}`}
                      >
                        {curso.estado}
                      </span>
                    )}
                  </div>

                  <div className="flex-1 px-3 py-3 flex flex-col gap-1 text-sm text-slate-700">
                    <h3 className="font-semibold text-slate-900 line-clamp-2">
                      {curso.titulo}
                    </h3>
                    <p className="text-xs text-slate-600">
                      {curso.categoria || "Sin categoría"}
                    </p>
                    <p className="mt-1 text-[0.8rem]">
                      <strong className="text-slate-900">
                        {curso.precio && curso.precio > 0
                          ? `$${curso.precio}`
                          : "Gratis"}
                      </strong>
                    </p>
                  </div>
                </div>
              ))}
            </div>
          )}
        </section>

        {/* === Actividad reciente === */}
        <section className="lg:col-span-1 bg-white/95 rounded-3xl border border-slate-100 shadow-[0_20px_60px_rgba(15,23,42,0.14)] px-5 md:px-6 py-5 md:py-6">
          <h2 className="text-lg font-semibold text-slate-900 mb-2">
            Actividad reciente
          </h2>

          {recientes.length === 0 ? (
            <p className="text-sm text-slate-500">
              No hay actividad reciente registrada.
            </p>
          ) : (
            <ul className="flex flex-col gap-3 text-sm">
              {recientes.map((act, i) => (
                <li
                  key={i}
                  className="pb-3 border-b last:border-b-0 border-slate-200"
                >
                  <div className="space-y-1">
                    <h4 className="font-semibold text-slate-900 text-[0.9rem]">
                      {act.titulo}
                    </h4>
                    <p className="text-xs text-slate-600">
                      <strong>Fecha:</strong> {act.fecha}
                    </p>
                    <p className="text-xs text-slate-600">
                      <strong>Estado:</strong>{" "}
                      <span
                        className={`inline-flex items-center rounded-full px-2 py-0.5 text-[0.65rem] font-semibold uppercase tracking-wide ${getBadgeTone(
                          act.estado
                        )}`}
                      >
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
    </div>
  );
};

export default Dashboard;

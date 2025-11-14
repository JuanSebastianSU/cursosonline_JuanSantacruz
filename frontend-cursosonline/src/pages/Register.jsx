import React, { useContext, useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import { AuthContext } from "../context/AuthContext";

/**
 * Register.js
 * Pantalla de registro de nuevos usuarios.
 */
const Register = () => {
  const { register } = useContext(AuthContext);
  const navigate = useNavigate();

  const [nombre, setNombre] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmacion, setConfirmacion] = useState("");
  const [cargando, setCargando] = useState(false);
  const [error, setError] = useState("");

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");

    if (!nombre.trim() || !email.trim() || !password.trim()) {
      setError("Completa todos los campos.");
      return;
    }
    if (password !== confirmacion) {
      setError("Las contraseñas no coinciden.");
      return;
    }
    if (password.length < 6) {
      setError("La contraseña debe tener al menos 6 caracteres.");
      return;
    }

    setCargando(true);
    const res = await register(nombre.trim(), email.trim(), password.trim());
    setCargando(false);

    if (res.success) {
      navigate("/");
    } else {
      setError(res.message || "No se pudo completar el registro.");
    }
  };

  return (
    <main className="flex-1 bg-slate-950 text-slate-50 flex items-center justify-center relative overflow-hidden">
      {/* Fondo artístico */}
      <div className="pointer-events-none absolute inset-0 -z-10">
        <div className="absolute -top-32 right-1/2 h-80 w-80 translate-x-1/3 rounded-full bg-[radial-gradient(circle,_rgba(248,250,252,0.18),_transparent_60%)] blur-3xl opacity-90" />
        <div className="absolute -right-32 top-24 h-64 w-72 rotate-12 bg-gradient-to-bl from-emerald-500/22 via-sky-500/18 to-transparent blur-3xl" />
        <div className="absolute -left-32 bottom-0 h-72 w-72 rounded-[45%] bg-gradient-to-t from-amber-400/24 via-rose-400/24 to-transparent blur-3xl" />

        {/* Garabatos */}
        <div className="absolute inset-x-0 top-28 flex justify-center opacity-35">
          <div className="h-40 w-72 rounded-[999px] border border-dashed border-slate-600/60 rotate-[10deg]" />
        </div>
        <div className="absolute inset-x-0 bottom-20 flex justify-center opacity-25">
          <div className="h-28 w-40 rounded-[999px] border border-slate-700/80 -rotate-8" />
        </div>
      </div>

      <div className="w-full max-w-md px-4 pb-10 pt-4 md:py-10">
        <div className="relative rounded-[2rem] border border-slate-800 bg-slate-950/90 shadow-[0_22px_70px_rgba(15,23,42,1)] px-6 md:px-8 py-6 md:py-7 overflow-hidden">
          {/* Detalles decorativos */}
          <div className="pointer-events-none absolute -top-10 left-4 h-24 w-24 rounded-3xl border border-slate-700/80 -rotate-6" />
          <div className="pointer-events-none absolute -bottom-10 right-0 h-24 w-40 rounded-[999px] border border-slate-800/80 rotate-6" />

          <header className="mb-5 space-y-2">
            <p className="inline-flex items-center gap-2 rounded-full border border-slate-700/80 bg-slate-950/80 px-3 py-1 text-[0.65rem] font-semibold uppercase tracking-[0.3em] text-slate-400">
              <span className="h-1.5 w-6 -skew-x-12 rounded-full bg-gradient-to-r from-amber-300/90 via-sky-300/90 to-emerald-300/90" />
              Registro
            </p>
            <h1 className="text-xl md:text-2xl font-semibold tracking-tight text-slate-50">
              Crear cuenta
            </h1>
            <p className="text-xs md:text-sm text-slate-400">
              Regístrate para empezar a explorar y crear cursos en
              CursosOnlineJS.
            </p>
          </header>

          {error && (
            <div className="mb-4 rounded-2xl border border-rose-500/70 bg-rose-900/40 px-4 py-2 text-[0.75rem] text-rose-100">
              {error}
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-1">
              <label className="block text-[0.7rem] font-semibold uppercase tracking-[0.2em] text-slate-400">
                Nombre
              </label>
              <input
                type="text"
                value={nombre}
                onChange={(e) => setNombre(e.target.value)}
                className="w-full rounded-xl border border-slate-700/80 bg-slate-950/80 px-3 py-2 text-xs md:text-sm text-slate-50 shadow-inner focus:outline-none focus:ring-2 focus:ring-slate-50/40"
                placeholder="Tu nombre"
              />
            </div>

            <div className="space-y-1">
              <label className="block text-[0.7rem] font-semibold uppercase tracking-[0.2em] text-slate-400">
                Correo electrónico
              </label>
              <input
                type="email"
                autoComplete="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full rounded-xl border border-slate-700/80 bg-slate-950/80 px-3 py-2 text-xs md:text-sm text-slate-50 shadow-inner focus:outline-none focus:ring-2 focus:ring-slate-50/40"
                placeholder="tucorreo@ejemplo.com"
              />
            </div>

            <div className="space-y-1">
              <label className="block text-[0.7rem] font-semibold uppercase tracking-[0.2em] text-slate-400">
                Contraseña
              </label>
              <input
                type="password"
                autoComplete="new-password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full rounded-xl border border-slate-700/80 bg-slate-950/80 px-3 py-2 text-xs md:text-sm text-slate-50 shadow-inner focus:outline-none focus:ring-2 focus:ring-slate-50/40"
                placeholder="••••••••"
              />
            </div>

            <div className="space-y-1">
              <label className="block text-[0.7rem] font-semibold uppercase tracking-[0.2em] text-slate-400">
                Confirmar contraseña
              </label>
              <input
                type="password"
                autoComplete="new-password"
                value={confirmacion}
                onChange={(e) => setConfirmacion(e.target.value)}
                className="w-full rounded-xl border border-slate-700/80 bg-slate-950/80 px-3 py-2 text-xs md:text-sm text-slate-50 shadow-inner focus:outline-none focus:ring-2 focus:ring-slate-50/40"
                placeholder="Repite tu contraseña"
              />
            </div>

            <button
              type="submit"
              disabled={cargando}
              className="mt-2 inline-flex w-full items-center justify-center rounded-full bg-slate-50 px-4 py-2 text-xs md:text-sm font-semibold uppercase tracking-[0.2em] text-slate-900 shadow-sm hover:bg-slate-200 active:translate-y-px disabled:opacity-60"
            >
              {cargando ? "Creando cuenta..." : "Crear cuenta"}
            </button>
          </form>

          <p className="mt-4 text-[0.75rem] text-slate-400">
            ¿Ya tienes una cuenta?{" "}
            <Link
              to="/login"
              className="font-semibold text-sky-300 hover:text-sky-200 underline underline-offset-4 decoration-sky-500/70"
            >
              Inicia sesión aquí
            </Link>
            .
          </p>
        </div>

        <p className="mt-4 text-[0.7rem] text-center text-slate-500">
          Tu cuenta se crea con rol de usuario. Luego podrás convertirte en
          instructor desde la administración.
        </p>
      </div>
    </main>
  );
};

export default Register;

import React, { useState, useContext } from "react";
import { useNavigate, Link } from "react-router-dom";
import { AuthContext } from "../context/AuthContext";
import "../assets/css/register.css";

/**
 * Register.js
 * Permite crear un nuevo usuario en la plataforma.
 * Conecta al endpoint /api/auth/register del backend Spring Boot.
 */
const Register = () => {
  const { register } = useContext(AuthContext);
  const navigate = useNavigate();

  const [form, setForm] = useState({
    nombre: "",
    email: "",
    password: "",
    confirmPassword: "",
  });
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const handleChange = (e) => {
    setForm({ ...form, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");

    if (form.password !== form.confirmPassword) {
      setError("Las contraseñas no coinciden.");
      return;
    }

    setLoading(true);
    const result = await register(form.nombre, form.email, form.password);
    setLoading(false);

    if (result.success) {
      navigate("/perfil");
    } else {
      setError(result.message || "Error al registrar el usuario.");
    }
  };

  return (
    <div className="register-container min-h-[70vh] flex items-center justify-center px-4 py-10">
      <form
        className="register-form w-full max-w-lg bg-white/95 border border-slate-200 shadow-md rounded-2xl px-6 py-6 md:px-8 md:py-8 flex flex-col gap-4"
        onSubmit={handleSubmit}
      >
        <div className="text-center mb-2">
          <h2 className="text-xl md:text-2xl font-semibold text-slate-900">
            Crear cuenta
          </h2>
          <p className="text-xs md:text-sm text-slate-500 mt-1">
            Únete a CursosOnlineJS y empieza a aprender con proyectos reales.
          </p>
        </div>

        <div className="flex flex-col gap-1">
          <label
            htmlFor="nombre"
            className="text-xs md:text-sm font-medium text-slate-700"
          >
            Nombre completo
          </label>
          <input
            id="nombre"
            name="nombre"
            type="text"
            value={form.nombre}
            onChange={handleChange}
            required
            className="w-full rounded-xl border border-slate-300 px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-primario-strong focus:border-transparent"
          />
        </div>

        <div className="flex flex-col gap-1">
          <label
            htmlFor="email"
            className="text-xs md:text-sm font-medium text-slate-700"
          >
            Correo electrónico
          </label>
          <input
            id="email"
            name="email"
            type="email"
            value={form.email}
            onChange={handleChange}
            required
            className="w-full rounded-xl border border-slate-300 px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-primario-strong focus:border-transparent"
          />
        </div>

        <div className="flex flex-col gap-1">
          <label
            htmlFor="password"
            className="text-xs md:text-sm font-medium text-slate-700"
          >
            Contraseña
          </label>
          <input
            id="password"
            name="password"
            type="password"
            value={form.password}
            onChange={handleChange}
            required
            className="w-full rounded-xl border border-slate-300 px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-primario-strong focus:border-transparent"
          />
        </div>

        <div className="flex flex-col gap-1">
          <label
            htmlFor="confirmPassword"
            className="text-xs md:text-sm font-medium text-slate-700"
          >
            Confirmar contraseña
          </label>
          <input
            id="confirmPassword"
            name="confirmPassword"
            type="password"
            value={form.confirmPassword}
            onChange={handleChange}
            required
            className="w-full rounded-xl border border-slate-300 px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-primario-strong focus:border-transparent"
          />
        </div>

        {error && (
          <p className="text-xs md:text-sm text-red-700 bg-red-50 border border-red-200 rounded-lg px-3 py-2 text-center">
            {error}
          </p>
        )}

        <button
          type="submit"
          disabled={loading}
          className="w-full mt-2 inline-flex items-center justify-center rounded-full bg-primario-strong text-white text-sm font-semibold py-2.5 shadow-md hover:bg-primario transition-colors disabled:opacity-60 disabled:cursor-not-allowed"
        >
          {loading ? "Creando cuenta..." : "Registrarse"}
        </button>

        <p className="login-link text-xs md:text-sm text-center text-slate-500 mt-3">
          ¿Ya tienes cuenta?{" "}
          <Link
            to="/login"
            className="font-semibold text-primario-strong hover:text-primario underline-offset-4 hover:underline"
          >
            Inicia sesión aquí
          </Link>
        </p>
      </form>
    </div>
  );
};

export default Register;

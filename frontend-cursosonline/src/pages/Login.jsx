import React, { useState, useContext } from "react";
import { useNavigate, Link } from "react-router-dom";
import { AuthContext } from "../context/AuthContext";
import "../assets/css/login.css";

const Login = () => {
  const { login } = useContext(AuthContext);
  const navigate = useNavigate();

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    e.stopPropagation();
    setLoading(true);
    setError("");

    try {
      const result = await login(email.trim(), password);

      if (result?.success) {
        navigate("/mi-perfil");
      } else {
        setError(result?.message || "Credenciales incorrectas.");
        setPassword("");
      }
    } catch (err) {
      console.error("Fallo al procesar login:", err);
      setError("Credenciales incorrectas.");
      setPassword("");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="login-container min-h-[70vh] flex items-center justify-center px-4 py-10">
      <form
        className="login-form w-full max-w-md bg-white/95 border border-slate-200 shadow-md rounded-2xl px-6 py-6 md:px-8 md:py-8 flex flex-col gap-4"
        onSubmit={handleSubmit}
        noValidate
      >
        <div className="text-center mb-2">
          <h2 className="text-xl md:text-2xl font-semibold text-slate-900">
            Iniciar sesión
          </h2>
          <p className="text-xs md:text-sm text-slate-500 mt-1">
            Ingresa con tu cuenta para continuar con tus cursos.
          </p>
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
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
            autoComplete="email"
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
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
            autoComplete="current-password"
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
          {loading ? "Verificando..." : "Ingresar"}
        </button>

        <p className="register-link text-xs md:text-sm text-center text-slate-500 mt-3">
          ¿No tienes cuenta?{" "}
          <Link
            to="/register"
            className="font-semibold text-primario-strong hover:text-primario underline-offset-4 hover:underline"
          >
            Regístrate aquí
          </Link>
        </p>
      </form>
    </div>
  );
};

export default Login;

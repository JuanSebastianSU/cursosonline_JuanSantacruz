import React, { useState, useContext } from "react";
import { useNavigate } from "react-router-dom";
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
    e.stopPropagation(); // 🚫 bloquea cualquier reload automático
    setLoading(true);
    setError("");

    try {
      const result = await login(email.trim(), password);

      if (result?.success) {
        navigate("/mi-perfil");
      } else {
        setError(result?.message || "Credenciales incorrectas");
        setPassword(""); // limpia solo contraseña
      }
    } catch (err) {
      console.error("Fallo al procesar login:", err);
      setError("Credenciales incorrectas");
      setPassword("");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="login-container">
      <form
        className="login-form"
        onSubmit={handleSubmit}
        onKeyDown={(e) => e.key === "Enter" && e.preventDefault()} // 🧱 evita reload
        noValidate
      >
        <h2>Iniciar sesión</h2>

        <label htmlFor="email">Correo electrónico</label>
        <input
          id="email"
          type="email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          required
          autoComplete="email"
        />

        <label htmlFor="password">Contraseña</label>
        <input
          id="password"
          type="password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          required
          autoComplete="current-password"
        />

        {error && <p className="error">{error}</p>}

        <button type="submit" disabled={loading}>
          {loading ? "Verificando..." : "Ingresar"}
        </button>

        <p className="register-link">
          ¿No tienes cuenta? <a href="/register">Regístrate aquí</a>
        </p>
      </form>
    </div>
  );
};

export default Login;

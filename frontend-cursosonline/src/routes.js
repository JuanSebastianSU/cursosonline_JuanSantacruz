import React from "react";
import { Routes, Route } from "react-router-dom";
import Home from "./pages/Home";
import Login from "./pages/Login";
import Register from "./pages/Register";
import Dashboard from "./pages/Dashboard";
import Cursos from "./pages/Cursos";
import CursoDetalle from "./components/CursoDetalle";
import CursoAdmin from "./pages/CursoAdmin";
import CursoInstructor from "./pages/CursoInstructor";
import CursoEditar from "./pages/CursoEditar";
import CursoNuevo from "./pages/CursoNuevo";
import ProtectedRoute from "./components/ProtectedRoute";
import Perfil from "./pages/Perfil";
import Contacto from "./pages/Contacto";

/**
 * AppRoutes.js
 * Define todas las rutas del frontend (públicas, autenticadas y por rol).
 */
function AppRoutes() {
  return (
    <Routes>
      {/* ======== RUTAS PÚBLICAS ======== */}
      <Route path="/" element={<Home />} />
      <Route path="/login" element={<Login />} />
      <Route path="/register" element={<Register />} />
      <Route path="/cursos" element={<Cursos />} />
      <Route path="/curso/:id" element={<CursoDetalle />} />
      <Route path="/contacto" element={<Contacto />} />

      {/* ======== RUTAS DE USUARIO AUTENTICADO ======== */}
      <Route element={<ProtectedRoute />}>
        <Route path="/perfil" element={<Dashboard />} />
        <Route path="/mi-perfil" element={<Perfil />} />

        {/* ✅ Permitir que usuarios sin rol creen su primer curso */}
        <Route path="/instructor/cursos/nuevo" element={<CursoNuevo />} />
      </Route>

      {/* ======== PANEL DEL INSTRUCTOR ======== */}
      <Route element={<ProtectedRoute roles={["ROLE_INSTRUCTOR", "ROLE_ADMIN"]} />}>
        <Route path="/instructor/cursos" element={<CursoInstructor />} />
        <Route path="/instructor/cursos/editar/:id" element={<CursoEditar />} />
      </Route>

      {/* ======== PANEL DEL ADMINISTRADOR ======== */}
      <Route element={<ProtectedRoute roles={["ROLE_ADMIN"]} />}>
        <Route path="/admin/cursos" element={<CursoAdmin />} />
        <Route path="/admin/cursos/nuevo" element={<CursoNuevo />} /> {/* ✅ FIX */}
        <Route path="/admin/cursos/editar/:id" element={<CursoEditar />} />
      </Route>

      {/* ======== RUTA 404 ======== */}
      <Route
        path="*"
        element={
          <h2 style={{ textAlign: "center", marginTop: "50px", color: "#0d47a1" }}>
            Página no encontrada
          </h2>
        }
      />
    </Routes>
  );
}

export default AppRoutes;

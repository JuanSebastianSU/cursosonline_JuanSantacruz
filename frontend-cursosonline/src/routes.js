// src/AppRoutes.js
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
import MisCursos from "./pages/MisCursos";

import CursoModulosGestion from "./pages/CursoModulosGestion";
import ModuloLeccionesGestion from "./pages/ModuloLeccionesGestion";
import LeccionEvaluacionesGestion from "./pages/LeccionEvaluacionesGestion";
import EvaluacionTomar from "./pages/EvaluacionTomar";
import PagoInscripcion from "./pages/PagoInscripcion";
import PagoRevision from "./pages/PagoRevision";
import ModuloContenidoAlumno from "./pages/ModuloContenidoAlumno";

// 👉 gestión de inscripciones de un curso (admin/instructor)
import InscripcionesCursoGestion from "./pages/InscripcionesCursoGestion";

// 👇 panel para ver intentos (instructor)
import EvaluacionIntentosGestion from "./pages/EvaluacionIntentosGestion";

// 👇 paneles de calificaciones
import CalificacionesInstructor from "./pages/CalificacionesInstructor";
import CalificacionesAdmin from "./pages/CalificacionesAdmin";

// 👇 NUEVOS: panel hub admin + gestión usuarios
import AdminPanel from "./pages/AdminPanel";
import AdminUsuariosGestion from "./pages/AdminUsuariosGestion";

// 👇 NUEVO: gestión de preguntas de una evaluación
import EvaluacionPreguntasGestion from "./pages/EvaluacionPreguntasGestion";

// 👇 NUEVO: ver / calificar un intento concreto
import EvaluacionIntentoCalificar from "./pages/EvaluacionIntentoCalificar";

function AppRoutes() {
  return (
    <Routes>
      {/* ======== PÚBLICAS ======== */}
      <Route path="/" element={<Home />} />
      <Route path="/login" element={<Login />} />
      <Route path="/register" element={<Register />} />
      <Route path="/cursos" element={<Cursos />} />
      <Route path="/cursos/:id" element={<CursoDetalle />} />
      <Route path="/contacto" element={<Contacto />} />

      {/* ======== USUARIO LOGUEADO ======== */}
      <Route element={<ProtectedRoute />}>
        <Route path="/perfil" element={<Dashboard />} />
        <Route path="/mi-perfil" element={<Perfil />} />
        <Route path="/mis-cursos" element={<MisCursos />} />

        {/* crear primer curso aunque aún no tenga rol */}
        <Route path="/instructor/cursos/nuevo" element={<CursoNuevo />} />

        {/* tomar evaluación como estudiante */}
        <Route
          path="/lecciones/:idLeccion/evaluaciones/:idEvaluacion/tomar"
          element={<EvaluacionTomar />}
        />

        {/* pago de inscripción (ALUMNO) */}
        <Route
          path="/inscripciones/:idInscripcion/pago"
          element={<PagoInscripcion />}
        />

        {/* contenido de módulo para alumno */}
        <Route
          path="/cursos/:idCurso/modulos/:idModulo"
          element={<ModuloContenidoAlumno />}
        />
      </Route>

      {/* ======== PANEL INSTRUCTOR ======== */}
      <Route
        element={<ProtectedRoute roles={["ROLE_INSTRUCTOR", "ROLE_ADMIN"]} />}
      >
        <Route path="/instructor/cursos" element={<CursoInstructor />} />
        <Route path="/instructor/cursos/editar/:id" element={<CursoEditar />} />
        <Route
          path="/instructor/cursos/:id/modulos"
          element={<CursoModulosGestion />}
        />

        {/* inscripciones de un curso (instructor) */}
        <Route
          path="/instructor/cursos/:id/inscripciones"
          element={<InscripcionesCursoGestion />}
        />

        <Route
          path="/instructor/modulos/:idModulo/lecciones"
          element={<ModuloLeccionesGestion />}
        />

        <Route
          path="/instructor/lecciones/:idLeccion/evaluaciones"
          element={<LeccionEvaluacionesGestion />}
        />

        {/* NUEVO: gestión de preguntas de una evaluación */}
        <Route
          path="/instructor/lecciones/:idLeccion/evaluaciones/:idEvaluacion/preguntas"
          element={<EvaluacionPreguntasGestion />}
        />

        {/* ver intentos de una evaluación concreta */}
        <Route
          path="/instructor/evaluaciones/:idEvaluacion/intentos"
          element={<EvaluacionIntentosGestion />}
        />

        {/* 👇 NUEVO: ver / calificar UN intento */}
        <Route
          path="/instructor/evaluaciones/:idEvaluacion/intentos/:idIntento/calificar"
          element={<EvaluacionIntentoCalificar />}
        />

        {/* panel global de calificaciones del instructor */}
        <Route
          path="/instructor/calificaciones"
          element={<CalificacionesInstructor />}
        />

        {/* revisar pagos de una inscripción (INSTRUCTOR) */}
        <Route
          path="/instructor/inscripciones/:idInscripcion/pagos"
          element={<PagoRevision />}
        />
      </Route>

      {/* ======== PANEL ADMIN ======== */}
      <Route element={<ProtectedRoute roles={["ROLE_ADMIN"]} />}>
        {/* HUB ADMIN */}
        <Route path="/admin" element={<AdminPanel />} />

        <Route path="/admin/cursos" element={<CursoAdmin />} />
        <Route path="/admin/cursos/nuevo" element={<CursoNuevo />} />
        <Route path="/admin/cursos/editar/:id" element={<CursoEditar />} />

        {/* inscripciones de un curso (admin) */}
        <Route
          path="/admin/cursos/:id/inscripciones"
          element={<InscripcionesCursoGestion />}
        />

        {/* panel global de calificaciones para admin */}
        <Route path="/admin/calificaciones" element={<CalificacionesAdmin />} />

        {/* NUEVO: gestión de usuarios */}
        <Route path="/admin/usuarios" element={<AdminUsuariosGestion />} />

        <Route
          path="/admin/inscripciones/:idInscripcion/pagos"
          element={<PagoRevision />}
        />
      </Route>

      {/* ======== 404 ======== */}
      <Route
        path="*"
        element={
          <h2
            style={{
              textAlign: "center",
              marginTop: "50px",
              color: "#0d47a1",
            }}
          >
            Página no encontrada
          </h2>
        }
      />
    </Routes>
  );
}

export default AppRoutes;

// src/App.js
import React, { useEffect, useRef } from "react";
import { BrowserRouter, useLocation } from "react-router-dom";
import { AuthProvider } from "./context/AuthContext";
import Header from "./components/Header";
import Footer from "./components/Footer";
import AppRoutes from "./routes";
import AccesibilidadPanel from "./components/AccesibilidadPanel"; // 👈 Asegura este import
import "./App.css";

function AppShell() {
  const location = useLocation();
  const mainRef = useRef(null);
  useEffect(() => {
    if (mainRef.current) {
      mainRef.current.setAttribute("tabIndex", "-1");
      mainRef.current.focus();
    }
  }, [location]);

  return (
    <div className="app-container">
      <a href="#main-content" className="skip-link">Saltar al contenido</a>
      <Header />

      {/* 👇 Panel fijo abajo-izquierda, fuera del header */}
      <AccesibilidadPanel />

      <main id="main-content" ref={mainRef} role="main" className="main-content container" aria-live="polite">
        <AppRoutes />
      </main>
      <Footer />
    </div>
  );
}

export default function App() {
  return (
    <BrowserRouter>
      <AuthProvider>
        <AppShell />
      </AuthProvider>
    </BrowserRouter>
  );
}

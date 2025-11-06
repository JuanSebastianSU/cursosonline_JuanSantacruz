import React from "react";
import { BrowserRouter } from "react-router-dom";
import { AuthProvider } from "./context/AuthContext";
import Header from "./components/Header";
import Footer from "./components/Footer";
import AppRoutes from "./routes";
import "./App.css";

/**
 * App.js
 * Estructura principal de la aplicación.
 * Integra Header, Footer, Contexto de Autenticación y Rutas.
 */

function App() {
  return (
    <BrowserRouter>
      <AuthProvider>
        <div className="app-container">
          <Header />

          <main className="main-content">
            <AppRoutes />
          </main>

          <Footer />
        </div>
      </AuthProvider>
    </BrowserRouter>
  );
}

export default App;

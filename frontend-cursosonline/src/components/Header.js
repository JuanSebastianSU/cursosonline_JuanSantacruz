import React from "react";
import Navbar from "./Navbar";
import "../assets/css/header.css";

/**
 * Header.js
 * Contiene el logotipo y la barra de navegación principal.
 * Se muestra en todas las páginas.
 */

const Header = () => {
  return (
    <header className="main-header">
      <div className="header-container">
        <div className="logo">
          <img src="/logo192.png" alt="Logo Cursos Online" />
          <h1>Cursos Online</h1>
        </div>

        <Navbar />
      </div>
    </header>
  );
};

export default Header;

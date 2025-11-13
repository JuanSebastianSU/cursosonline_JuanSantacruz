import React from "react";
import Navbar from "./Navbar";

/**
 * Header.js
 * Contiene el logotipo y la barra de navegación principal.
 */

const Header = () => {
  return (
    <header className="bg-slate-900 text-slate-50 shadow-md">
      <div className="max-w-6xl mx-auto px-4 md:px-6 py-2.5 flex items-center justify-between gap-3 flex-wrap">
        <div className="flex items-center gap-2">
          <img
            src="/logo192.png"
            alt="Logo Cursos Online"
            className="h-8 w-8 rounded-md shadow-sm"
          />
          <h1 className="text-sm md:text-base font-semibold tracking-tight">
            Cursos Online
          </h1>
        </div>

        <Navbar />
      </div>
    </header>
  );
};

export default Header;

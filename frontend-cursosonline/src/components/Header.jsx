import React from "react";
import Navbar from "./Navbar";

/**
 * Header.js
 * Banda superior con fondo oscuro y halos de color.
 */
const Header = () => {
  return (
    <header className="relative overflow-hidden border-b border-slate-800 bg-gradient-to-b from-slate-950 via-slate-900 to-slate-950">
      {/* Halos / garabatos de luz */}
      <div className="pointer-events-none absolute inset-x-0 -top-24 h-40 bg-[radial-gradient(circle_at_top,_rgba(250,204,21,0.18),_transparent_70%)]" />
      <div className="pointer-events-none absolute -right-20 -top-10 h-40 w-40 rounded-full bg-fuchsia-500/14 blur-3xl" />
      <div className="pointer-events-none absolute -left-28 bottom-[-4rem] h-40 w-56 rotate-[-12deg] bg-gradient-to-r from-sky-500/18 via-transparent to-transparent blur-2xl" />

      {/* Contenido principal del header */}
      <Navbar />
    </header>
  );
};

export default Header;

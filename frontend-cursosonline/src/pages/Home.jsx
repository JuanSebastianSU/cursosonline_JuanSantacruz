import React, { useEffect, useState } from "react";
import { listarCursos } from "../services/cursoService";
import CursoCard from "../components/CursoCard";
import "../assets/css/home.css";

/**
 * Home.js
 * Página principal pública del sitio.
 * Presenta introducción, cursos destacados y beneficios.
 */

const Home = () => {
  const [cursos, setCursos] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    listarCursos({ estado: "PUBLICADO", size: 6 })
      .then((data) => {
        setCursos(data.content || []);
        setLoading(false);
      })
      .catch(() => setLoading(false));
  }, []);

  return (
    <div className="home-container flex flex-col gap-12 md:gap-16 pb-10">
      {/* === HERO === */}
      <section className="relative overflow-hidden bg-gradient-to-r from-primario-strong to-primario text-texto shadow-suave rounded-2xl mt-6">
        <div className="max-w-6xl mx-auto px-6 md:px-10 py-10 md:py-16 flex flex-col md:flex-row items-center gap-10">
          <div className="flex-1 space-y-4 md:space-y-6 text-center md:text-left">
            <p className="uppercase tracking-[0.3em] text-xs md:text-[0.7rem] opacity-80">
              plataforma de aprendizaje
            </p>
            <h1 className="text-3xl md:text-4xl lg:text-5xl font-semibold leading-tight">
              Bienvenido a{" "}
              <span className="inline-block bg-black/15 px-3 py-1 rounded-full">
                CursosOnlineJS
              </span>
            </h1>
            <p className="text-sm md:text-base max-w-xl mx-auto md:mx-0 text-black/90">
              Aprende de manera práctica y flexible con cursos en línea creados
              por expertos. Backend en Spring Boot, frontend en React, y un
              catálogo de cursos que crece contigo.
            </p>

            <div className="flex flex-col sm:flex-row gap-3 sm:gap-4 justify-center md:justify-start pt-2">
              <a
                href="/cursos"
                className="inline-flex items-center justify-center gap-2 rounded-full bg-black/10 text-black px-6 py-2.5 text-sm font-semibold shadow-md hover:bg-black/15 hover:translate-y-[1px] transition-transform transition-colors"
              >
                Ver todos los cursos
                <span className="text-lg" aria-hidden="true">
                  →
                </span>
              </a>
              <span className="text-xs sm:text-sm opacity-85 flex items-center justify-center">
                Acceso inmediato, 24/7, desde cualquier dispositivo.
              </span>
            </div>
          </div>

          {/* Bloque decorativo / retro */}
          <div className="flex-1 hidden md:flex justify-end">
            <div className="relative w-full max-w-sm">
              <div className="absolute inset-0 bg-black/20 blur-3xl rounded-3xl" />
              <div className="relative rounded-3xl border border-white/20 bg-black/15 backdrop-blur-md px-6 py-5 flex flex-col gap-3 shadow-lg">
                <p className="text-xs uppercase tracking-[0.25em] opacity-80">
                  stack moderno
                </p>
                <h2 className="text-lg font-semibold">
                  React • Spring Boot • MongoDB
                </h2>
                <p className="text-xs text-black/85">
                  Cursos pensados para proyectos reales: APIs, autenticación,
                  paneles de administración y despliegue profesional.
                </p>
                <div className="grid grid-cols-3 gap-2 pt-1 text-[0.7rem]">
                  <div className="flex flex-col bg-white/10 rounded-xl px-2 py-2">
                    <span className="font-semibold">+{cursos.length || 6}</span>
                    <span className="opacity-75">Cursos activos</span>
                  </div>
                  <div className="flex flex-col bg-white/10 rounded-xl px-2 py-2">
                    <span className="font-semibold">Fullstack</span>
                    <span className="opacity-75">JS & Java</span>
                  </div>
                  <div className="flex flex-col bg-white/10 rounded-xl px-2 py-2">
                    <span className="font-semibold">Certificados</span>
                    <span className="opacity-75">al finalizar</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* === CURSOS DESTACADOS === */}
      <section className="max-w-6xl mx-auto px-4 md:px-6">
        <div className="flex items-center justify-between gap-4 flex-wrap mb-6">
          <div>
            <h2 className="text-xl md:text-2xl font-semibold text-slate-900">
              Cursos destacados
            </h2>
            <p className="text-xs md:text-sm text-slate-500">
              Una selección de cursos publicados recientemente.
            </p>
          </div>
          <a
            href="/cursos"
            className="text-xs md:text-sm font-semibold text-primario-strong hover:text-primario underline-offset-4 hover:underline"
          >
            Ver catálogo completo
          </a>
        </div>

        {loading ? (
          <p className="text-sm text-slate-500">Cargando cursos...</p>
        ) : cursos.length === 0 ? (
          <p className="text-sm text-slate-500">
            No hay cursos publicados actualmente.
          </p>
        ) : (
          <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {cursos.map((curso) => (
              <CursoCard key={curso.id} curso={curso} />
            ))}
          </div>
        )}
      </section>

      {/* === BENEFICIOS === */}
      <section className="bg-fondo-soft/40 border border-slate-200/40 rounded-2xl max-w-6xl mx-auto px-4 md:px-8 py-10">
        <div className="text-center mb-8 space-y-2">
          <h2 className="text-xl md:text-2xl font-semibold text-slate-900">
            ¿Por qué elegir CursosOnlineJS?
          </h2>
          <p className="text-sm text-slate-500 max-w-2xl mx-auto">
            Pensado para desarrolladores, estudiantes y profesionales que quieren
            aprender con proyectos reales y un stack moderno.
          </p>
        </div>

        <div className="grid gap-6 md:gap-8 md:grid-cols-3">
          <div className="benefit-card bg-white rounded-2xl shadow-md px-5 py-6 text-left border border-slate-100">
            <i className="fas fa-laptop-code text-2xl text-primario-strong mb-3" />
            <h3 className="font-semibold text-slate-900 mb-1">
              Aprende a tu ritmo
            </h3>
            <p className="text-sm text-slate-600">
              Accede a tus cursos en cualquier momento y desde cualquier
              dispositivo. Tú decides cuándo avanzar.
            </p>
          </div>

          <div className="benefit-card bg-white rounded-2xl shadow-md px-5 py-6 text-left border border-slate-100">
            <i className="fas fa-user-graduate text-2xl text-primario-strong mb-3" />
            <h3 className="font-semibold text-slate-900 mb-1">
              Instructores expertos
            </h3>
            <p className="text-sm text-slate-600">
              Aprende con profesionales del sector tecnológico con experiencia
              real en proyectos y empresas.
            </p>
          </div>

          <div className="benefit-card bg-white rounded-2xl shadow-md px-5 py-6 text-left border border-slate-100">
            <i className="fas fa-certificate text-2xl text-primario-strong mb-3" />
            <h3 className="font-semibold text-slate-900 mb-1">
              Certificados y comunidad
            </h3>
            <p className="text-sm text-slate-600">
              Obtén certificados de finalización y resuelve dudas junto a una
              comunidad activa de estudiantes.
            </p>
          </div>
        </div>
      </section>
    </div>
  );
};

export default Home;

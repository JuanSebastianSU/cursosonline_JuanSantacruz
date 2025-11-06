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
    <div className="home-container">
      {/* === HERO === */}
      <section className="hero">
        <div className="hero-content">
          <h1>Bienvenido a CursosOnlineJS</h1>
          <p>
            Aprende de manera práctica y flexible con cursos en línea creados por expertos.
            Tu progreso, a tu ritmo.
          </p>
          <a href="/cursos" className="btn-cta">Ver todos los cursos</a>
        </div>
      </section>

      {/* === CURSOS DESTACADOS === */}
      <section className="featured-courses">
        <h2>Cursos destacados</h2>

        {loading ? (
          <p>Cargando cursos...</p>
        ) : cursos.length === 0 ? (
          <p>No hay cursos publicados actualmente.</p>
        ) : (
          <div className="course-grid">
            {cursos.map((curso) => (
              <CursoCard key={curso.id} curso={curso} />
            ))}
          </div>
        )}
      </section>

            {/* === BENEFICIOS === */}
      <section className="benefits-section">
        <h2>¿Por qué elegir CursosOnlineJS?</h2>
        <div className="benefits-grid">
          <div className="benefit-card">
            <i className="fas fa-laptop-code"></i>
            <h3>Aprende a tu ritmo</h3>
            <p>
              Accede a tus cursos en cualquier momento y desde cualquier dispositivo.
              Tú decides cuándo avanzar.
            </p>
          </div>

          <div className="benefit-card">
            <i className="fas fa-user-graduate"></i>
            <h3>Instructores expertos</h3>
            <p>
              Aprende con profesionales del sector tecnológico con experiencia real.
            </p>
          </div>

          <div className="benefit-card">
            <i className="fas fa-certificate"></i>
            <h3>Certificados de finalización</h3>
            <p>
              Al terminar un curso obtén un certificado que valida tus conocimientos.
            </p>
          </div>

          <div className="benefit-card">
            <i className="fas fa-users"></i>
            <h3>Soporte y comunidad activa</h3>
            <p>
              Resuelve dudas con tutores y estudiantes, comparte experiencias y crece junto a la comunidad.
            </p>
          </div>

          <div className="benefit-card">
            <i className="fas fa-clock"></i>
            <h3>Acceso ilimitado</h3>
            <p>
              Revisa los contenidos cuantas veces necesites. Los cursos permanecen disponibles 24/7.
            </p>
          </div>

          <div className="benefit-card">
            <i className="fas fa-rocket"></i>
            <h3>Aprendizaje continuo</h3>
            <p>
              Nuevos cursos y actualizaciones constantes para mantenerte al día con las últimas tecnologías.
            </p>
          </div>
        </div>
      </section>

    </div>
  );
};

export default Home;

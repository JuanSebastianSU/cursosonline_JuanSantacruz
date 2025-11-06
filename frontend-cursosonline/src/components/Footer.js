import React from "react";
import "../assets/css/footer.css";

/**
 * Footer.js
 * Pie de página del sitio web, visible en todas las páginas.
 * Contiene enlaces informativos y datos de contacto.
 */

const Footer = () => {
  const year = new Date().getFullYear();

  return (
    <footer className="main-footer">
      <div className="footer-container">
        <div className="footer-section">
          <h4>Sobre nosotros</h4>
          <p>
            CursosOnlineJS es una plataforma educativa desarrollada en React y
            Spring Boot, orientada al aprendizaje interactivo en línea.
          </p>
        </div>

        <div className="footer-section">
          <h4>Enlaces útiles</h4>
          <ul>
            <li><a href="/">Inicio</a></li>
            <li><a href="/cursos">Cursos</a></li>
            <li><a href="/contacto">Contacto</a></li>
            <li><a href="/login">Iniciar sesión</a></li>
          </ul>
        </div>

        <div className="footer-section">
          <h4>Contacto</h4>
          <p>📧 info@cursosonlinejs.com</p>
          <p>📍 Quito, Ecuador</p>
          <p>📞 +593 99 999 9999</p>
        </div>
      </div>

      <div className="footer-bottom">
        <p>© {year} CursosOnlineJS. Todos los derechos reservados.</p>
      </div>
    </footer>
  );
};

export default Footer;

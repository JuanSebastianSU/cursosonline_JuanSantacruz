/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    "./src/**/*.{js,jsx,ts,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        fondo: "#050509",
        "fondo-soft": "#111322",
        primario: "#ffb347",        // dorado retro
        "primario-strong": "#ff8c42",
        acento: "#66d9e8",
        texto: "#f5f5f7",
        "texto-muted": "#a0a3b1",
      },
      boxShadow: {
        suave: "0 18px 40px rgba(0,0,0,0.45)",
      },
      borderRadius: {
        xl2: "1.25rem",
      },
    },
  },
  plugins: [],
};

// src/components/AccesibilidadPanel.jsx
import React, { useEffect, useState } from "react";

const htmlEl =
  typeof document !== "undefined" ? document.documentElement : null;
const synth =
  typeof window !== "undefined" && "speechSynthesis" in window
    ? window.speechSynthesis
    : null;

const get = (k, def) => {
  try {
    const v = localStorage.getItem(k);
    return v ?? def;
  } catch {
    return def;
  }
};
const set = (k, v) => {
  try {
    localStorage.setItem(k, v);
  } catch {
    // ignore
  }
};

export default function AccesibilidadPanel() {
  // Evitar duplicados
  const [visible, setVisible] = useState(true);
  const [open, setOpen] = useState(false);

  // ===== Estados persistentes =====
  const [theme, setTheme] = useState(get("a11y.theme", "dark")); // light|dark|hc
  const [cvd, setCvd] = useState(get("a11y.cvd", "")); // "", deuteranopia, protanopia, tritanopia
  const [fontSize, setFontSize] = useState(
    parseInt(get("a11y.font", "100"), 10)
  );
  const [textSpacing, setTextSpacing] = useState(
    get("a11y.spacing", "off") === "wide"
  );
  const [reduceMotion, setReduceMotion] = useState(
    get("a11y.motion", "off") === "true"
  );
  const [speech, setSpeech] = useState(get("a11y.speech", "off") === "on");

  // ===== Montaje único (no duplicar panel) =====
  useEffect(() => {
    if (typeof window === "undefined") return;
    if (window.__A11Y_PANEL_MOUNTED__) {
      setVisible(false);
      return;
    }
    window.__A11Y_PANEL_MOUNTED__ = true;

    return () => {
      window.__A11Y_PANEL_MOUNTED__ = false;
    };
  }, []);

  // ===== Aplicar configuración guardada al cargar =====
  useEffect(() => {
    if (!htmlEl) return;

    const clamp = (n, mn, mx) => Math.max(mn, Math.min(mx, n));

    // Tema
    const t = ["light", "dark", "hc"].includes(theme) ? theme : "dark";
    htmlEl.setAttribute("data-theme", t);

    // Daltonismo
    if (cvd) htmlEl.setAttribute("data-cvd", cvd);
    else htmlEl.removeAttribute("data-cvd");

    // Tamaño de fuente
    const f = clamp(parseInt(fontSize || 100, 10), 80, 180);
    htmlEl.style.fontSize = `${f}%`;

    // Espaciado de texto
    if (textSpacing) htmlEl.setAttribute("data-text-spacing", "wide");
    else htmlEl.removeAttribute("data-text-spacing");

    // Menos animación
    if (reduceMotion) htmlEl.setAttribute("data-reduce-motion", "true");
    else htmlEl.removeAttribute("data-reduce-motion");
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // ===== Lectura por voz (hover global) =====
  useEffect(() => {
    if (!speech || !synth) return;

    const handler = (e) => {
      const text = (e.target?.innerText || e.target?.alt || "").trim();
      if (text && text.length > 3) {
        synth.cancel();
        const u = new SpeechSynthesisUtterance(text);
        u.rate = 1.05;
        u.pitch = 1;
        synth.speak(u);
      }
    };

    document.addEventListener("mouseover", handler);
    return () => document.removeEventListener("mouseover", handler);
  }, [speech]);

  // ===== Handlers =====
  const applyTheme = (val) => {
    const v = ["light", "dark", "hc"].includes(val) ? val : "dark";
    htmlEl?.setAttribute("data-theme", v);
    set("a11y.theme", v);
    setTheme(v);
  };

  const applyCvd = (val) => {
    if (val) htmlEl?.setAttribute("data-cvd", val);
    else htmlEl?.removeAttribute("data-cvd");
    set("a11y.cvd", val || "");
    setCvd(val || "");
  };

  const applyFont = (pct) => {
    const n = Math.max(80, Math.min(180, parseInt(pct || 100, 10)));
    if (htmlEl) htmlEl.style.fontSize = `${n}%`;
    set("a11y.font", String(n));
    setFontSize(n);
  };

  const applyTextSpacing = (on) => {
    if (on) htmlEl?.setAttribute("data-text-spacing", "wide");
    else htmlEl?.removeAttribute("data-text-spacing");
    set("a11y.spacing", on ? "wide" : "off");
    setTextSpacing(!!on);
  };

  const applyReduceMotion = (on) => {
    if (on) htmlEl?.setAttribute("data-reduce-motion", "true");
    else htmlEl?.removeAttribute("data-reduce-motion");
    set("a11y.motion", on ? "true" : "off");
    setReduceMotion(!!on);
  };

  const toggleSpeech = () => {
    const on = !speech;
    set("a11y.speech", on ? "on" : "off");
    if (!on && synth) synth.cancel();
    setSpeech(on);
  };

  if (!visible) return null;

  return (
    <>
      {/* FAB flotante */}
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        aria-label="Abrir opciones de accesibilidad"
        className="fixed bottom-5 right-5 z-40 inline-flex h-11 w-11 items-center justify-center rounded-full border border-slate-700/70 bg-slate-900/90 text-sky-400 shadow-[0_12px_40px_rgba(8,47,73,0.7)] backdrop-blur hover:border-sky-400 hover:text-sky-300 hover:shadow-[0_16px_50px_rgba(8,47,73,0.9)] transition-all"
      >
        <span aria-hidden="true" className="text-xl">
          ♿
        </span>
      </button>

      {/* Panel flotante */}
      {open && (
        <aside
          aria-label="Panel de accesibilidad"
          className="fixed bottom-20 right-4 z-40 w-[min(20rem,calc(100%-2rem))] overflow-hidden rounded-3xl border border-slate-800/80 bg-slate-950/95 p-4 text-xs text-slate-100 shadow-[0_20px_60px_rgba(15,23,42,0.95)] backdrop-blur-md"
        >
          {/* Garabatos de fondo */}
          <div className="pointer-events-none absolute -right-10 top-6 h-28 w-28 rounded-[40%] border border-slate-700/40 blur-[0.5px]" />
          <div className="pointer-events-none absolute -left-10 bottom-0 h-24 w-24 translate-y-8 rounded-[45%] border border-slate-700/30" />
          <div className="pointer-events-none absolute -bottom-12 right-4 h-24 w-24 rounded-full bg-sky-500/10 blur-2" />

          {/* Cabecera */}
          <div className="relative mb-3 flex items-start justify-between gap-2">
            <div>
              <p className="text-[0.65rem] font-semibold uppercase tracking-[0.3em] text-slate-400">
                Accesibilidad
              </p>
              <p className="mt-1 text-[0.7rem] text-slate-400/90">
                Ajusta la visualización y lectura de la plataforma.
              </p>
            </div>
            <button
              type="button"
              onClick={() => setOpen(false)}
              aria-label="Cerrar panel de accesibilidad"
              className="inline-flex h-7 w-7 items-center justify-center rounded-full border border-slate-700/70 bg-slate-900/80 text-slate-300 hover:text-slate-50 hover:border-slate-500 transition-colors"
            >
              ✕
            </button>
          </div>

          {/* Controles */}
          <div className="relative flex flex-col gap-3">
            {/* Tema */}
            <div className="space-y-1">
              <span className="text-[0.68rem] font-semibold uppercase tracking-[0.18em] text-slate-400">
                Tema
              </span>
              <select
                value={theme}
                onChange={(e) => applyTheme(e.target.value)}
                className="w-full rounded-2xl border border-slate-700 bg-slate-900/80 px-3 py-2 text-[0.75rem] text-slate-100 outline-none focus:border-sky-400 focus:ring-1 focus:ring-sky-500/60"
              >
                <option value="light">Claro</option>
                <option value="dark">Oscuro</option>
                <option value="hc">Alto contraste</option>
              </select>
            </div>

            {/* Tamaño texto */}
            <div className="space-y-1">
              <span className="flex items-center justify-between text-[0.68rem] font-semibold uppercase tracking-[0.18em] text-slate-400">
                <span>Tamaño de texto</span>
                <span className="text-[0.65rem] text-slate-300">
                  {fontSize}%
                </span>
              </span>
              <input
                type="range"
                min="80"
                max="180"
                step="5"
                value={fontSize}
                onChange={(e) => applyFont(e.target.value)}
                className="w-full accent-sky-400"
              />
            </div>

            {/* Checkboxes */}
            <div className="grid grid-cols-1 gap-2">
              <label className="inline-flex items-center gap-2 text-[0.75rem] text-slate-200">
                <input
                  type="checkbox"
                  checked={textSpacing}
                  onChange={(e) => applyTextSpacing(e.target.checked)}
                  className="h-3.5 w-3.5 rounded border-slate-600 bg-slate-900 text-sky-400 focus:ring-sky-500"
                />
                <span>Espaciado amplio</span>
              </label>

              <label className="inline-flex items-center gap-2 text-[0.75rem] text-slate-200">
                <input
                  type="checkbox"
                  checked={reduceMotion}
                  onChange={(e) => applyReduceMotion(e.target.checked)}
                  className="h-3.5 w-3.5 rounded border-slate-600 bg-slate-900 text-sky-400 focus:ring-sky-500"
                />
                <span>Menos animación</span>
              </label>
            </div>

            {/* Daltonismo */}
            <div className="space-y-1">
              <span className="text-[0.68rem] font-semibold uppercase tracking-[0.18em] text-slate-400">
                Daltonismo
              </span>
              <select
                value={cvd}
                onChange={(e) => applyCvd(e.target.value)}
                className="w-full rounded-2xl border border-slate-700 bg-slate-900/80 px-3 py-2 text-[0.75rem] text-slate-100 outline-none focus:border-sky-400 focus:ring-1 focus:ring-sky-500/60"
              >
                <option value="">Sin filtro</option>
                <option value="deuteranopia">Deuteranopia</option>
                <option value="protanopia">Protanopia</option>
                <option value="tritanopia">Tritanopia</option>
              </select>
            </div>

            {/* Voz */}
            <button
              type="button"
              onClick={toggleSpeech}
              className="mt-1 inline-flex w-full items-center justify-center gap-2 rounded-full border border-sky-500/60 bg-sky-500/10 px-4 py-2 text-[0.8rem] font-semibold text-sky-200 shadow-[0_10px_30px_rgba(8,47,73,0.7)] hover:bg-sky-500/20 hover:text-sky-100 transition-colors"
            >
              <span>{speech ? "🔇" : "🔊"}</span>
              <span>{speech ? "Desactivar voz" : "Activar voz"}</span>
            </button>
          </div>
        </aside>
      )}
    </>
  );
}

import React, { useEffect, useState } from "react";
import "../assets/css/accesibilidad.css";

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
  } catch {}
};

export default function AccesibilidadPanel() {
  // ===== Guard anti-duplicados (solo 1 panel en toda la app)
  const [visible, setVisible] = useState(true);
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

  // ===== Estados persistentes
  const [theme, setTheme] = useState(get("a11y.theme", "light")); // light|dark|hc
  const [cvd, setCvd] = useState(get("a11y.cvd", "")); // "", deuteranopia, protanopia, tritanopia
  const [fontSize, setFontSize] = useState(parseInt(get("a11y.font", "100"), 10));
  const [textSpacing, setTextSpacing] = useState(get("a11y.spacing", "off") === "wide");
  const [reduceMotion, setReduceMotion] = useState(get("a11y.motion", "off") === "true");
  const [speech, setSpeech] = useState(get("a11y.speech", "off") === "on");

  // ===== Aplicar todo al montar
  useEffect(() => {
    if (!htmlEl) return;
    // tema
    const t = ["light", "dark", "hc"].includes(theme) ? theme : "light";
    htmlEl.setAttribute("data-theme", t);
    // daltonismo
    if (cvd) htmlEl.setAttribute("data-cvd", cvd);
    else htmlEl.removeAttribute("data-cvd");
    // fuente
    const clamp = (n, mn, mx) => Math.max(mn, Math.min(mx, n));
    const f = clamp(parseInt(fontSize || 100, 10), 80, 180);
    htmlEl.style.fontSize = `${f}%`;
    // espaciado
    if (textSpacing) htmlEl.setAttribute("data-text-spacing", "wide");
    else htmlEl.removeAttribute("data-text-spacing");
    // motion
    if (reduceMotion) htmlEl.setAttribute("data-reduce-motion", "true");
    else htmlEl.removeAttribute("data-reduce-motion");
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // ===== Lectura por voz (hover)
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

  // ===== Handlers
  const applyTheme = (val) => {
    const v = ["light", "dark", "hc"].includes(val) ? val : "light";
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
    <div className="a11y-anchor">
      <aside className="accesibilidad-panel" aria-label="Panel de accesibilidad">
        <label> Tema:
          <select value={theme} onChange={(e) => applyTheme(e.target.value)}>
            <option value="light">Claro</option>
            <option value="dark">Oscuro</option>
            <option value="hc">Alto contraste</option>
          </select>
        </label>

        <label> Texto: {fontSize}%
          <input
            type="range"
            min="80"
            max="180"
            step="5"
            value={fontSize}
            onChange={(e) => applyFont(e.target.value)}
          />
        </label>

        <label>
          <input
            type="checkbox"
            checked={textSpacing}
            onChange={(e) => applyTextSpacing(e.target.checked)}
          />
          &nbsp;Espaciado
        </label>

        <label>
          <input
            type="checkbox"
            checked={reduceMotion}
            onChange={(e) => applyReduceMotion(e.target.checked)}
          />
          &nbsp;Menos animación
        </label>

        <label> Daltonismo:
          <select value={cvd} onChange={(e) => applyCvd(e.target.value)}>
            <option value="">—</option>
            <option value="deuteranopia">Deuteranopia</option>
            <option value="protanopia">Protanopia</option>
            <option value="tritanopia">Tritanopia</option>
          </select>
        </label>

        <button type="button" onClick={toggleSpeech}>
          {speech ? "🔇 Voz off" : "🔊 Voz on"}
        </button>
      </aside>
    </div>
  );
}

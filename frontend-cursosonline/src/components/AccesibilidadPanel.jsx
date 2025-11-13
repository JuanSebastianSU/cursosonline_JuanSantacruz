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
  } catch {}
};

export default function AccesibilidadPanel() {
  const [visible, setVisible] = useState(true);
  const [open, setOpen] = useState(false);

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

  const [theme, setTheme] = useState(get("a11y.theme", "light"));
  const [cvd, setCvd] = useState(get("a11y.cvd", ""));
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

  useEffect(() => {
    if (!htmlEl) return;

    const clamp = (n, mn, mx) => Math.max(mn, Math.min(mx, n));
    const t = ["light", "dark", "hc"].includes(theme) ? theme : "light";
    htmlEl.setAttribute("data-theme", t);

    if (cvd) htmlEl.setAttribute("data-cvd", cvd);
    else htmlEl.removeAttribute("data-cvd");

    const f = clamp(parseInt(fontSize || 100, 10), 80, 180);
    htmlEl.style.fontSize = `${f}%`;

    if (textSpacing) htmlEl.setAttribute("data-text-spacing", "wide");
    else htmlEl.removeAttribute("data-text-spacing");

    if (reduceMotion) htmlEl.setAttribute("data-reduce-motion", "true");
    else htmlEl.removeAttribute("data-reduce-motion");
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

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
    <>
      {/* Botón flotante */}
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        className="fixed bottom-4 right-4 z-50 inline-flex h-12 w-12 items-center justify-center rounded-full border border-slate-200 bg-white text-slate-900 shadow-xl hover:-translate-y-0.5 hover:bg-slate-900 hover:text-amber-200 transition-transform transition-colors"
        aria-label="Abrir opciones de accesibilidad"
      >
        <span aria-hidden="true">♿</span>
      </button>

      {/* Panel flotante */}
      {open && (
        <aside
          className="fixed bottom-20 right-4 z-50 w-[min(18rem,calc(100vw-2.5rem))] max-h-[70vh] overflow-y-auto rounded-2xl border border-slate-200 bg-white/95 text-slate-900 shadow-[0_18px_45px_rgba(15,23,42,0.55)] px-3.5 py-3 text-[0.78rem] space-y-2"
          aria-label="Panel de accesibilidad"
        >
          <div className="flex items-center justify-between mb-1">
            <span className="text-[0.8rem] font-semibold uppercase tracking-[0.18em] text-slate-700">
              Accesibilidad
            </span>
            <button
              type="button"
              onClick={() => setOpen(false)}
              className="inline-flex h-6 w-6 items-center justify-center rounded-full text-slate-500 hover:bg-slate-100 hover:text-slate-800"
              aria-label="Cerrar panel de accesibilidad"
            >
              ✕
            </button>
          </div>

          <div className="space-y-2">
            <label className="flex flex-col gap-1">
              <span className="text-[0.7rem] font-semibold uppercase tracking-[0.14em] text-slate-500">
                Tema
              </span>
              <select
                value={theme}
                onChange={(e) => applyTheme(e.target.value)}
                className="rounded-lg border border-slate-200 bg-slate-50 px-2 py-1 text-xs focus:outline-none focus:ring-2 focus:ring-slate-900/10"
              >
                <option value="light">Claro</option>
                <option value="dark">Oscuro</option>
                <option value="hc">Alto contraste</option>
              </select>
            </label>

            <label className="flex flex-col gap-1">
              <span className="text-[0.7rem] font-semibold uppercase tracking-[0.14em] text-slate-500">
                Tamaño de texto: {fontSize}%
              </span>
              <input
                type="range"
                min="80"
                max="180"
                step="5"
                value={fontSize}
                onChange={(e) => applyFont(e.target.value)}
                className="w-full"
              />
            </label>

            <label className="flex items-center gap-2">
              <input
                type="checkbox"
                checked={textSpacing}
                onChange={(e) => applyTextSpacing(e.target.checked)}
              />
              <span>Espaciado amplio</span>
            </label>

            <label className="flex items-center gap-2">
              <input
                type="checkbox"
                checked={reduceMotion}
                onChange={(e) => applyReduceMotion(e.target.checked)}
              />
              <span>Menos animación</span>
            </label>

            <label className="flex flex-col gap-1">
              <span className="text-[0.7rem] font-semibold uppercase tracking-[0.14em] text-slate-500">
                Daltonismo
              </span>
              <select
                value={cvd}
                onChange={(e) => applyCvd(e.target.value)}
                className="rounded-lg border border-slate-200 bg-slate-50 px-2 py-1 text-xs focus:outline-none focus:ring-2 focus:ring-slate-900/10"
              >
                <option value="">Sin filtro</option>
                <option value="deuteranopia">Deuteranopia</option>
                <option value="protanopia">Protanopia</option>
                <option value="tritanopia">Tritanopia</option>
              </select>
            </label>

            <button
              type="button"
              onClick={toggleSpeech}
              className="mt-1 inline-flex w-full items-center justify-center rounded-full bg-slate-900 px-3 py-1.5 text-[0.75rem] font-semibold text-amber-100 shadow-sm hover:bg-slate-800"
            >
              {speech ? "🔇 Desactivar voz" : "🔊 Activar voz"}
            </button>
          </div>
        </aside>
      )}
    </>
  );
}

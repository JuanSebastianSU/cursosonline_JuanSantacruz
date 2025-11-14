// src/pages/PagoRevision.jsx
import React, { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import {
  listarPagosPorInscripcion,
  aprobarPago,
} from "../services/pagoService";

const PagoRevision = () => {
  const { idInscripcion } = useParams();
  const navigate = useNavigate();

  const [pagos, setPagos] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [procesandoId, setProcesandoId] = useState(null);

  const formatEstadoChip = (estadoRaw) => {
    if (!estadoRaw) return "SIN_ESTADO";
    const e = estadoRaw.toUpperCase();
    if (e === "PENDIENTE") return "PENDIENTE";
    if (e === "AUTORIZADO") return "AUTORIZADO";
    if (e === "APROBADO" || e === "CAPTURADO") return "APROBADO";
    if (e === "FALLIDO") return "FALLIDO";
    if (e === "REEMBOLSADO") return "REEMBOLSADO";
    if (e === "CANCELADO") return "CANCELADO";
    return e;
  };

  const getChipColors = (estadoRaw) => {
    const e = (estadoRaw || "").toUpperCase();
    if (e === "PENDIENTE") return "bg-amber-400 text-amber-950";
    if (e === "AUTORIZADO") return "bg-sky-400 text-sky-950";
    if (e === "APROBADO" || e === "CAPTURADO")
      return "bg-emerald-400 text-emerald-950";
    if (e === "FALLIDO" || e === "CANCELADO")
      return "bg-rose-500 text-rose-50";
    if (e === "REEMBOLSADO") return "bg-fuchsia-400 text-fuchsia-950";
    return "bg-slate-500 text-slate-50";
  };

  const formatFecha = (raw) => {
    if (!raw) return "—";
    const d = new Date(raw);
    if (Number.isNaN(d.getTime())) return "—";
    return d.toLocaleString("es-EC", {
      day: "2-digit",
      month: "2-digit",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  const formatMonto = (monto, moneda) => {
    if (monto == null) return "—";
    return `${monto} ${moneda || "USD"}`;
  };

  // Cargar pagos de la inscripción
  useEffect(() => {
    const fetchPagos = async () => {
      setLoading(true);
      setError("");
      try {
        const lista = await listarPagosPorInscripcion(idInscripcion);
        setPagos(lista || []);
      } catch (err) {
        console.error("Error al listar pagos:", err);
        setError("No se pudieron cargar los pagos de esta inscripción.");
      } finally {
        setLoading(false);
      }
    };

    if (idInscripcion) {
      fetchPagos();
    }
  }, [idInscripcion]);

  const handleAprobar = async (pago) => {
    if (!window.confirm("¿Confirmas aprobar este pago?")) return;

    setProcesandoId(pago.id);
    try {
      // Si quieres, aquí puedes pedir gatewayPaymentId / authorizationCode con un prompt
      const aprobado = await aprobarPago(idInscripcion, pago.id, {
        gatewayPaymentId: pago.gatewayPaymentId || null,
        authorizationCode: pago.authorizationCode || null,
        reciboUrl: pago.reciboUrl || null,
      });

      alert(
        `Pago aprobado correctamente.\n\nNuevo estado: ${
          aprobado.estado || "APROBADO"
        }`
      );

      // Actualizar en el listado
      setPagos((prev) =>
        prev.map((p) => (p.id === aprobado.id ? aprobado : p))
      );
    } catch (err) {
      console.error("Error al aprobar pago:", err);
      const msg =
        err.response?.data?.message ||
        err.response?.data ||
        "No se pudo aprobar el pago.";
      alert(msg);
    } finally {
      setProcesandoId(null);
    }
  };

  if (!idInscripcion) {
    return (
      <div className="max-w-5xl mx-auto px-4 md:px-6 py-10 text-center text-rose-400">
        Falta el id de inscripción en la URL.
      </div>
    );
  }

  return (
    <div className="max-w-5xl mx-auto px-4 md:px-6 py-8 md:py-10 space-y-6">
      {/* Volver */}
      <button
        type="button"
        onClick={() => navigate(-1)}
        className="inline-flex items-center gap-2 rounded-full border border-slate-700/70 bg-slate-950/80 px-4 py-1.5 text-[0.7rem] md:text-xs font-semibold uppercase tracking-[0.22em] text-slate-200 hover:border-amber-400/80 hover:text-amber-200 hover:bg-slate-900 transition-colors"
      >
        <span className="text-sm">←</span> Volver
      </button>

      {/* Cabecera */}
      <section className="rounded-[2.3rem] border border-slate-800 bg-gradient-to-r from-slate-950 via-slate-900 to-slate-950 px-5 md:px-8 py-6 md:py-7 shadow-[0_24px_90px_rgba(0,0,0,0.95)] space-y-3">
        <span className="inline-flex items-center rounded-full bg-sky-400/95 px-3 py-1 text-[0.7rem] font-semibold uppercase tracking-[0.22em] text-sky-950 shadow-[0_0_25px_rgba(56,189,248,0.9)]">
          Revisión de pagos
        </span>
        <h1 className="text-2xl md:text-3xl font-semibold tracking-tight text-slate-50">
          Pagos de la inscripción
        </h1>
        <p className="text-xs md:text-sm text-slate-300/90">
          Id de inscripción:{" "}
          <span className="font-mono text-amber-200">{idInscripcion}</span>
        </p>
      </section>

      {/* Listado de pagos */}
      <section className="rounded-[2.3rem] border border-slate-800 bg-slate-950/95 px-5 md:px-8 py-6 md:py-7 shadow-[0_24px_90px_rgba(0,0,0,0.95)] space-y-4">
        {loading ? (
          <div className="h-32 flex items-center justify-center text-sm md:text-base text-slate-300">
            Cargando pagos...
          </div>
        ) : error ? (
          <div className="h-32 flex items-center justify-center text-sm md:text-base text-rose-400">
            {error}
          </div>
        ) : pagos.length === 0 ? (
          <div className="h-32 flex items-center justify-center text-sm md:text-base text-slate-300">
            No hay pagos registrados para esta inscripción.
          </div>
        ) : (
          <div className="space-y-3 md:space-y-4">
            {pagos
              .slice()
              .sort(
                (a, b) =>
                  new Date(b.createdAt || 0) - new Date(a.createdAt || 0)
              )
              .map((pago, idx) => {
                const estado = pago.estado;
                const esAprobable = ["PENDIENTE", "AUTORIZADO"].includes(
                  (estado || "").toUpperCase()
                );

                return (
                  <article
                    key={pago.id || idx}
                    className="group relative rounded-2xl border border-slate-800/80 bg-slate-900/70 px-4 py-3 md:px-5 md:py-4 flex flex-col gap-3 hover:border-amber-300/80 hover:bg-slate-900/90 transition-colors"
                  >
                    {/* fila principal */}
                    <div className="flex flex-wrap items-start justify-between gap-3">
                      <div className="space-y-1">
                        <div className="flex items-center gap-2 flex-wrap">
                          <p className="text-sm md:text-base font-semibold text-slate-50">
                            Pago {pago.id?.slice(0, 8) || idx + 1}
                          </p>
                          <span
                            className={`inline-flex items-center rounded-full px-3 py-1 text-[0.65rem] font-semibold uppercase tracking-[0.22em] ${getChipColors(
                              estado
                            )}`}
                          >
                            {formatEstadoChip(estado)}
                          </span>
                        </div>
                        <p className="text-xs md:text-sm text-amber-300 font-semibold">
                          {formatMonto(pago.monto, pago.moneda)}
                        </p>
                        <p className="text-[0.75rem] md:text-xs text-slate-400">
                          Método:{" "}
                          <span className="font-medium text-slate-200">
                            {pago.metodo || "—"}
                          </span>{" "}
                          · Gateway:{" "}
                          <span className="font-medium text-slate-200">
                            {pago.gateway || "—"}
                          </span>
                        </p>
                      </div>

                      <div className="flex flex-col items-end gap-2">
                        <p className="text-[0.7rem] md:text-xs text-slate-400 text-right">
                          Creado: {formatFecha(pago.createdAt)}
                          <br />
                          Actualizado: {formatFecha(pago.updatedAt)}
                        </p>

                        {esAprobable && (
                          <button
                            type="button"
                            onClick={() => handleAprobar(pago)}
                            disabled={procesandoId === pago.id}
                            className="inline-flex items-center justify-center rounded-full bg-emerald-400 px-4 py-1.5 text-[0.7rem] md:text-xs font-semibold uppercase tracking-[0.22em] text-emerald-950 shadow-[0_0_25px_rgba(16,185,129,0.9)] hover:bg-emerald-300 active:translate-y-px disabled:opacity-60 disabled:cursor-not-allowed transition"
                          >
                            {procesandoId === pago.id
                              ? "Aprobando..."
                              : "Aprobar pago"}
                          </button>
                        )}
                      </div>
                    </div>

                    {/* detalles secundarios */}
                    <div className="grid md:grid-cols-3 gap-2 text-[0.7rem] md:text-xs text-slate-400">
                      <p>
                        <span className="font-semibold text-slate-300">
                          Referencia:
                        </span>{" "}
                        {pago.referencia || "—"}
                      </p>
                      <p>
                        <span className="font-semibold text-slate-300">
                          Cupón:
                        </span>{" "}
                        {pago.cupon || "—"}
                      </p>
                      <p>
                        <span className="font-semibold text-slate-300">
                          Idempotency:
                        </span>{" "}
                        {pago.idempotencyKey || "—"}
                      </p>
                    </div>
                  </article>
                );
              })}
          </div>
        )}
      </section>
    </div>
  );
};

export default PagoRevision;

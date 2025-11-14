// src/pages/InscripcionPago.jsx
import React, { useEffect, useState } from "react";
import { useLocation, useNavigate, useParams } from "react-router-dom";
import { obtenerCurso } from "../services/cursoService";
import {
  listarPagosPorInscripcion,
  crearPagoBorrador,
  editarPagoBorrador,
  eliminarPagoBorrador,
  checkoutPago,
} from "../services/pagoService";

const InscripcionPago = () => {
  const { idInscripcion } = useParams();
  const navigate = useNavigate();
  const location = useLocation();

  // si vienes desde MisCursos / CursoDetalle puedes pasar el idCurso por state
  const idCursoFromState = location.state?.idCurso || null;

  const [curso, setCurso] = useState(null);
  const [loadingCurso, setLoadingCurso] = useState(!!idCursoFromState);

  const [pagos, setPagos] = useState([]);
  const [loadingPagos, setLoadingPagos] = useState(true);
  const [errorPagos, setErrorPagos] = useState("");

  const [pagoActual, setPagoActual] = useState(null); // borrador activo o último pago
  const [form, setForm] = useState({
    monto: "",
    moneda: "USD",
    metodo: "TARJETA",
    referencia: "",
    cupon: "",
    gateway: "",
  });

  const [guardando, setGuardando] = useState(false);
  const [procesandoCheckout, setProcesandoCheckout] = useState(false);
  const [eliminando, setEliminando] = useState(false);

  // -------- helpers --------
  const estadoChip = (estado) => {
    const e = (estado || "").toUpperCase();
    if (e === "PENDIENTE") return "bg-amber-400 text-amber-950";
    if (e === "APROBADO" || e === "CAPTURADO")
      return "bg-emerald-400 text-emerald-950";
    if (e === "AUTORIZADO") return "bg-sky-400 text-sky-950";
    if (e === "FALLIDO") return "bg-rose-500 text-rose-50";
    if (e === "REEMBOLSADO") return "bg-fuchsia-400 text-fuchsia-950";
    if (e === "CANCELADO") return "bg-slate-600 text-slate-100";
    return "bg-slate-500 text-slate-50";
  };

  const metodoLabel = (m) => {
    switch ((m || "").toUpperCase()) {
      case "TARJETA":
        return "Tarjeta";
      case "TRANSFERENCIA":
        return "Transferencia";
      case "PAYPAL":
        return "PayPal";
      case "STRIPE":
        return "Stripe";
      case "EFECTIVO":
        return "Efectivo";
      case "MERCADOPAGO":
        return "Mercado Pago";
      default:
        return m || "Sin método";
    }
  };

  const formatFechaHora = (raw) => {
    if (!raw) return null;
    const d = new Date(raw);
    if (Number.isNaN(d.getTime())) return null;
    return d.toLocaleString("es-EC", {
      day: "2-digit",
      month: "2-digit",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  const estadoEsPendiente =
    (pagoActual?.estado || "").toUpperCase() === "PENDIENTE";

  // -------- cargar info del curso (opcional, solo para mostrar datos bonitos) --------
  useEffect(() => {
    if (!idCursoFromState) {
      setLoadingCurso(false);
      return;
    }

    const fetchCurso = async () => {
      setLoadingCurso(true);
      try {
        const data = await obtenerCurso(idCursoFromState);
        setCurso(data || null);

        // si no hay monto en el formulario, precargar con el precio del curso
        if (data?.precio != null) {
          setForm((prev) => ({
            ...prev,
            monto: prev.monto || String(data.precio),
          }));
        }
      } catch (err) {
        console.error("No se pudo cargar el curso:", err);
      } finally {
        setLoadingCurso(false);
      }
    };

    fetchCurso();
  }, [idCursoFromState]);

  // -------- cargar pagos --------
  const fetchPagos = async () => {
    setLoadingPagos(true);
    setErrorPagos("");
    try {
      const data = await listarPagosPorInscripcion(idInscripcion);
      const lista = data || [];
      setPagos(lista);

      // Tomamos el primer pago pendiente como "borrador actual"
      const borrador = lista.find(
        (p) => (p.estado || "").toUpperCase() === "PENDIENTE"
      );
      const principal = borrador || lista[0] || null;

      setPagoActual(principal || null);

      if (principal) {
        setForm({
          monto:
            principal.monto != null
              ? String(principal.monto)
              : form.monto || "",
          moneda: principal.moneda || "USD",
          metodo: principal.metodo || "TARJETA",
          referencia: principal.referencia || "",
          cupon: principal.cupon || "",
          gateway: principal.gateway || "",
        });
      }
    } catch (err) {
      console.error("Error al cargar pagos:", err);
      setErrorPagos(
        err.response?.data?.message ||
          err.response?.data ||
          "No se pudo cargar la información de pagos."
      );
    } finally {
      setLoadingPagos(false);
    }
  };

  useEffect(() => {
    fetchPagos();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [idInscripcion]);

  // Si se cargó el curso después y no hay monto en el form ni pago actual,
  // intenta precargar el precio del curso
  useEffect(() => {
    if (curso?.precio != null && !pagoActual && !form.monto) {
      setForm((prev) => ({
        ...prev,
        monto: String(curso.precio),
      }));
    }
  }, [curso, pagoActual, form.monto]);

  // -------- handlers --------
  const onChangeField = (field, value) => {
    setForm((prev) => ({ ...prev, [field]: value }));
  };

  const handleGuardarBorrador = async (e) => {
    e.preventDefault();

    const montoNumber = Number(form.monto);
    if (!montoNumber || Number.isNaN(montoNumber) || montoNumber <= 0) {
      alert("El monto debe ser mayor a 0.");
      return;
    }
    if (!form.metodo) {
      alert("Debes seleccionar un método de pago.");
      return;
    }

    const payloadBase = {
      monto: montoNumber,
      moneda: (form.moneda || "USD").toUpperCase(),
      metodo: form.metodo,
      referencia: form.referencia?.trim() || "",
      cupon: form.cupon?.trim() || "",
      gateway: form.gateway?.trim() || "",
    };

    setGuardando(true);
    try {
      let result;
      if (pagoActual && estadoEsPendiente) {
        // editar borrador existente
        result = await editarPagoBorrador(
          idInscripcion,
          pagoActual.id,
          payloadBase
        );
      } else if (!pagoActual) {
        // crear borrador nuevo
        result = await crearPagoBorrador(idInscripcion, payloadBase);
      } else {
        // hay un pago pero ya no está pendiente (aprobado, etc.)
        alert(
          "Este pago ya fue enviado o procesado. Si necesitas otro intento, contacta al administrador/instructor."
        );
        return;
      }

      setPagoActual(result);
      await fetchPagos();
      alert("Borrador de pago guardado correctamente.");
    } catch (err) {
      console.error(err);
      const msg =
        err.response?.data?.message ||
        err.response?.data ||
        "No se pudo guardar el borrador de pago.";
      alert(msg);
    } finally {
      setGuardando(false);
    }
  };

  const handleEliminarBorrador = async () => {
    if (!pagoActual || !estadoEsPendiente) {
      alert("Solo puedes eliminar pagos en estado PENDIENTE.");
      return;
    }
    if (
      !window.confirm(
        "¿Seguro que deseas eliminar este borrador de pago? Esta acción no se puede deshacer."
      )
    ) {
      return;
    }

    setEliminando(true);
    try {
      const ok = await eliminarPagoBorrador(idInscripcion, pagoActual.id);
      if (!ok) {
        alert("No se pudo eliminar el borrador de pago.");
      } else {
        setPagoActual(null);
        setForm((prev) => ({
          ...prev,
          referencia: "",
          cupon: "",
          gateway: "",
        }));
        await fetchPagos();
      }
    } catch (err) {
      console.error(err);
      const msg =
        err.response?.data?.message ||
        err.response?.data ||
        "No se pudo eliminar el borrador de pago.";
      alert(msg);
    } finally {
      setEliminando(false);
    }
  };

  const handleCheckout = async () => {
    if (!pagoActual) {
      alert("Primero crea y guarda un borrador de pago.");
      return;
    }
    if (!estadoEsPendiente) {
      alert("Este pago ya fue enviado o procesado.");
      return;
    }
    if (
      !window.confirm(
        "¿Confirmas que ya realizaste el pago (transferencia/depósito/etc.) y deseas enviar el comprobante a revisión?"
      )
    ) {
      return;
    }

    setProcesandoCheckout(true);
    try {
      const result = await checkoutPago(idInscripcion, pagoActual.id);
      setPagoActual(result);
      await fetchPagos();
      alert(
        "Tu pago ha sido enviado para revisión. Cuando el instructor/administrador lo apruebe, se activará tu acceso al curso."
      );
    } catch (err) {
      console.error(err);
      const msg =
        err.response?.data?.message ||
        err.response?.data ||
        "No se pudo enviar el pago a revisión.";
      alert(msg);
    } finally {
      setProcesandoCheckout(false);
    }
  };

  // -------- render --------
  return (
    <div className="max-w-6xl mx-auto px-4 md:px-6 py-8 md:py-10 space-y-7">
      {/* Volver */}
      <button
        type="button"
        onClick={() => navigate("/mis-cursos")}
        className="inline-flex items-center gap-2 rounded-full border border-slate-700/70 bg-slate-950/80 px-4 py-1.5 text-[0.7rem] md:text-xs font-semibold uppercase tracking-[0.22em] text-slate-200 hover:border-amber-400/80 hover:text-amber-200 hover:bg-slate-900 transition-colors"
      >
        <span className="text-sm">←</span> Volver a mis cursos
      </button>

      {/* Resumen curso / inscripción */}
      <section className="relative overflow-hidden rounded-[2.5rem] border border-slate-800 bg-gradient-to-r from-slate-950 via-slate-900 to-slate-950 px-5 md:px-8 py-6 md:py-7 shadow-[0_24px_90px_rgba(0,0,0,0.95)]">
        <div className="pointer-events-none absolute -left-24 -top-24 h-64 w-64 rounded-full border border-slate-700/60" />
        <div className="pointer-events-none absolute -right-16 -bottom-28 h-72 w-72 rounded-[40%] border border-slate-800/70" />

        <div className="relative flex flex-col gap-3">
          <span className="inline-flex items-center rounded-full bg-amber-400/95 px-3 py-1 text-[0.7rem] font-semibold uppercase tracking-[0.22em] text-slate-950 shadow-[0_0_25px_rgba(251,191,36,0.9)]">
            Pago de inscripción
          </span>

          <h1 className="text-2xl md:text-3xl font-semibold tracking-tight text-slate-50">
            {curso?.titulo || "Curso"}
          </h1>

          <p className="text-xs md:text-sm text-slate-300/80">
            ID inscripción:{" "}
            <span className="font-mono text-slate-100">{idInscripcion}</span>
          </p>

          <div className="grid gap-3 text-xs md:text-sm md:grid-cols-3 mt-2">
            <div>
              <p className="text-[0.7rem] font-semibold uppercase tracking-[0.2em] text-slate-400">
                Precio del curso
              </p>
              <p className="text-amber-300 font-semibold">
                {curso?.precio != null
                  ? `${curso.precio} ${curso.moneda || "USD"}`
                  : "—"}
              </p>
            </div>
            <div>
              <p className="text-[0.7rem] font-semibold uppercase tracking-[0.2em] text-slate-400">
                Curso
              </p>
              <p className="text-slate-50">
                {curso?.categoria || "Sin categoría"}
              </p>
            </div>
            <div>
              <p className="text-[0.7rem] font-semibold uppercase tracking-[0.2em] text-slate-400">
                Estado del último pago
              </p>
              {pagoActual ? (
                <span
                  className={`inline-flex mt-1 items-center rounded-full px-2.5 py-1 text-[0.65rem] font-semibold uppercase tracking-[0.22em] ${estadoChip(
                    pagoActual.estado
                  )}`}
                >
                  {pagoActual.estado || "—"}
                </span>
              ) : (
                <p className="text-slate-300">Sin pagos registrados</p>
              )}
            </div>
          </div>
        </div>
      </section>

      {/* Formulario de borrador de pago */}
      <section className="rounded-[2.5rem] border border-slate-800 bg-slate-950/95 px-5 md:px-8 py-6 md:py-7 shadow-[0_24px_90px_rgba(0,0,0,0.95)] space-y-4">
        <div className="flex items-center justify-between gap-3 flex-wrap">
          <h2 className="text-lg md:text-xl font-semibold text-slate-50 tracking-tight">
            Datos del pago
          </h2>
          {pagoActual && (
            <p className="text-[0.7rem] md:text-xs text-slate-400">
              Pago actual:{" "}
              <span className="font-mono text-slate-200">{pagoActual.id}</span>
            </p>
          )}
        </div>

        <form
          onSubmit={handleGuardarBorrador}
          className="grid gap-4 md:grid-cols-[minmax(0,2fr)_minmax(0,3fr)] items-start"
        >
          {/* Columna izquierda */}
          <div className="space-y-3">
            <div className="space-y-1.5">
              <label className="text-[0.7rem] font-semibold uppercase tracking-[0.22em] text-slate-400">
                Monto *
              </label>
              <input
                type="number"
                min={0}
                step="0.01"
                value={form.monto}
                onChange={(e) => onChangeField("monto", e.target.value)}
                className="w-full rounded-xl border border-slate-700 bg-slate-900 px-3 py-2 text-xs md:text-sm text-slate-50 shadow-inner focus:outline-none focus:ring-2 focus:ring-amber-400/40 focus:border-amber-300"
              />
            </div>

            <div className="space-y-1.5">
              <label className="text-[0.7rem] font-semibold uppercase tracking-[0.22em] text-slate-400">
                Moneda *
              </label>
              <input
                type="text"
                maxLength={3}
                value={form.moneda}
                onChange={(e) =>
                  onChangeField("moneda", e.target.value.toUpperCase())
                }
                className="w-28 rounded-xl border border-slate-700 bg-slate-900 px-3 py-2 text-xs md:text-sm text-slate-50 shadow-inner focus:outline-none focus:ring-2 focus:ring-amber-400/40 focus:border-amber-300"
              />
              <p className="text-[0.7rem] text-slate-500">
                Código ISO-4217, por ejemplo: USD, EUR.
              </p>
            </div>

            <div className="space-y-1.5">
              <label className="text-[0.7rem] font-semibold uppercase tracking-[0.22em] text-slate-400">
                Método de pago *
              </label>
              <select
                value={form.metodo}
                onChange={(e) => onChangeField("metodo", e.target.value)}
                className="w-full rounded-xl border border-slate-700 bg-slate-900 px-3 py-2 text-xs md:text-sm text-slate-50 shadow-inner focus:outline-none focus:ring-2 focus:ring-amber-400/40 focus:border-amber-300"
              >
                <option value="TARJETA">Tarjeta</option>
                <option value="TRANSFERENCIA">Transferencia</option>
                <option value="PAYPAL">PayPal</option>
                <option value="STRIPE">Stripe</option>
                <option value="EFECTIVO">Efectivo</option>
                <option value="MERCADOPAGO">Mercado Pago</option>
              </select>
            </div>
          </div>

          {/* Columna derecha */}
          <div className="space-y-3">
            <div className="space-y-1.5">
              <label className="text-[0.7rem] font-semibold uppercase tracking-[0.22em] text-slate-400">
                Referencia del pago
              </label>
              <input
                type="text"
                value={form.referencia}
                onChange={(e) => onChangeField("referencia", e.target.value)}
                className="w-full rounded-xl border border-slate-700 bg-slate-900 px-3 py-2 text-xs md:text-sm text-slate-50 shadow-inner focus:outline-none focus:ring-2 focus:ring-amber-400/40 focus:border-amber-300"
                placeholder="Número de comprobante, referencia bancaria, etc."
              />
            </div>

            <div className="space-y-1.5">
              <label className="text-[0.7rem] font-semibold uppercase tracking-[0.22em] text-slate-400">
                Cupón / código de descuento
              </label>
              <input
                type="text"
                value={form.cupon}
                onChange={(e) => onChangeField("cupon", e.target.value)}
                className="w-full rounded-xl border border-slate-700 bg-slate-900 px-3 py-2 text-xs md:text-sm text-slate-50 shadow-inner focus:outline-none focus:ring-2 focus:ring-amber-400/40 focus:border-amber-300"
                placeholder="Opcional"
              />
            </div>

            <div className="space-y-1.5">
              <label className="text-[0.7rem] font-semibold uppercase tracking-[0.22em] text-slate-400">
                Gateway / plataforma
              </label>
              <input
                type="text"
                value={form.gateway}
                onChange={(e) => onChangeField("gateway", e.target.value)}
                className="w-full rounded-xl border border-slate-700 bg-slate-900 px-3 py-2 text-xs md:text-sm text-slate-50 shadow-inner focus:outline-none focus:ring-2 focus:ring-amber-400/40 focus:border-amber-300"
                placeholder="Banco, PayPal, Stripe, etc. (opcional)"
              />
            </div>
          </div>
        </form>

        {/* Botones de acción */}
        <div className="mt-4 flex flex-wrap gap-3 justify-end">
          {pagoActual && estadoEsPendiente && (
            <button
              type="button"
              disabled={eliminando || guardando || procesandoCheckout}
              onClick={handleEliminarBorrador}
              className="inline-flex items-center justify-center rounded-full border border-rose-500/80 px-4 py-2 text-xs md:text-sm font-semibold uppercase tracking-[0.22em] text-rose-200 hover:bg-rose-500/10 active:translate-y-px disabled:opacity-60 disabled:cursor-not-allowed transition"
            >
              {eliminando ? "Eliminando..." : "Eliminar borrador"}
            </button>
          )}

          <button
            type="button"
            disabled={
              !estadoEsPendiente || !pagoActual || procesandoCheckout || guardando
            }
            onClick={handleCheckout}
            className="inline-flex items-center justify-center rounded-full border border-emerald-400/80 px-4 py-2 text-xs md:text-sm font-semibold uppercase tracking-[0.22em] text-emerald-200 hover:bg-emerald-400/10 active:translate-y-px disabled:opacity-60 disabled:cursor-not-allowed transition"
          >
            {procesandoCheckout
              ? "Enviando..."
              : "Enviar pago a revisión"}
          </button>

          <button
            type="button"
            onClick={handleGuardarBorrador}
            disabled={guardando || procesandoCheckout || eliminando}
            className="inline-flex items-center justify-center rounded-full bg-amber-400 px-5 py-2 text-xs md:text-sm font-semibold uppercase tracking-[0.22em] text-slate-950 shadow-[0_0_30px_rgba(251,191,36,0.9)] hover:bg-amber-300 active:translate-y-px disabled:opacity-60 disabled:cursor-not-allowed transition"
          >
            {guardando
              ? "Guardando..."
              : pagoActual && estadoEsPendiente
              ? "Actualizar borrador"
              : "Crear borrador"}
          </button>
        </div>
      </section>

      {/* Historial de pagos */}
      <section className="rounded-[2.5rem] border border-slate-800 bg-slate-950/95 px-5 md:px-8 py-6 md:py-7 shadow-[0_24px_90px_rgba(0,0,0,0.95)] space-y-4">
        <div className="flex items-center justify-between gap-3 flex-wrap">
          <h2 className="text-lg md:text-xl font-semibold text-slate-50 tracking-tight">
            Historial de pagos
          </h2>
          {pagos.length > 0 && (
            <p className="text-[0.7rem] md:text-xs uppercase tracking-[0.22em] text-slate-400">
              {pagos.length} registro{pagos.length > 1 ? "s" : ""}
            </p>
          )}
        </div>

        {loadingPagos ? (
          <p className="text-xs md:text-sm text-slate-300">
            Cargando historial de pagos...
          </p>
        ) : errorPagos ? (
          <p className="text-xs md:text-sm text-rose-400">{errorPagos}</p>
        ) : pagos.length === 0 ? (
          <p className="text-xs md:text-sm text-slate-400">
            Aún no hay pagos registrados para esta inscripción.
          </p>
        ) : (
          <div className="space-y-2">
            {pagos.map((pago) => (
              <div
                key={pago.id}
                className="flex flex-col md:flex-row md:items-center md:justify-between gap-2 rounded-xl border border-slate-800 bg-slate-900/80 px-3 py-2 md:px-4 md:py-3"
              >
                <div className="flex-1 space-y-1">
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className="font-mono text-[0.7rem] text-slate-300">
                      {pago.id}
                    </span>
                    <span
                      className={`inline-flex items-center rounded-full px-2.5 py-1 text-[0.65rem] font-semibold uppercase tracking-[0.22em] ${estadoChip(
                        pago.estado
                      )}`}
                    >
                      {pago.estado || "—"}
                    </span>
                  </div>
                  <p className="text-[0.75rem] text-slate-300">
                    {pago.monto} {pago.moneda} · {metodoLabel(pago.metodo)}
                    {pago.referencia && (
                      <>
                        {" "}
                        · Ref:{" "}
                        <span className="font-mono text-slate-100">
                          {pago.referencia}
                        </span>
                      </>
                    )}
                  </p>
                  <p className="text-[0.7rem] text-slate-500">
                    Creado: {formatFechaHora(pago.createdAt) || "—"}
                    {pago.pagadoAt && ` · Pagado: ${formatFechaHora(pago.pagadoAt)}`}
                  </p>
                </div>
              </div>
            ))}
          </div>
        )}
      </section>
    </div>
  );
};

export default InscripcionPago;

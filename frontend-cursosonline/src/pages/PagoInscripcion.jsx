import React, { useEffect, useState } from "react";
import { useLocation, useNavigate, useParams } from "react-router-dom";
import { obtenerCurso } from "../services/cursoService";
import {
  listarPagosPorInscripcion,
  crearPagoBorrador,
  checkoutPago,
} from "../services/pagoService";

const PagoInscripcion = () => {
  const { idInscripcion } = useParams();
  const location = useLocation();
  const navigate = useNavigate();

  // viene desde MisCursos: state: { idCurso: cursoId }
  const idCurso = location.state?.idCurso || null;

  const [curso, setCurso] = useState(null);
  const [loadingCurso, setLoadingCurso] = useState(!!idCurso);
  const [error, setError] = useState("");

  const [pagoExistente, setPagoExistente] = useState(null);
  const [loadingPago, setLoadingPago] = useState(true);
  const [procesando, setProcesando] = useState(false);

  // ---- cargar curso ----
  useEffect(() => {
    if (!idCurso) {
      setLoadingCurso(false);
      return;
    }

    const fetch = async () => {
      setLoadingCurso(true);
      setError("");
      try {
        const data = await obtenerCurso(idCurso);
        setCurso(data);
      } catch (err) {
        console.error("Error cargando curso para pago:", err);
        setError("No se pudo cargar la información del curso.");
      } finally {
        setLoadingCurso(false);
      }
    };

    fetch();
  }, [idCurso]);

  // ---- cargar pagos existentes de la inscripción ----
  useEffect(() => {
    if (!idInscripcion) return;

    const fetchPagos = async () => {
      setLoadingPago(true);
      try {
        const lista = await listarPagosPorInscripcion(idInscripcion);
        if (lista && lista.length > 0) {
          // buscamos alguno pendiente/autorizado; si no hay, tomamos el último
          const pendiente =
            lista.find((p) => {
              const e = (p.estado || "").toUpperCase();
              return e === "PENDIENTE" || e === "AUTORIZADO";
            }) || lista[lista.length - 1];

          setPagoExistente(pendiente);
        } else {
          setPagoExistente(null);
        }
      } catch (err) {
        console.error("Error al listar pagos:", err);
        // si falla, simplemente dejamos null
        setPagoExistente(null);
      } finally {
        setLoadingPago(false);
      }
    };

    fetchPagos();
  }, [idInscripcion]);

  // ---- handler de pago ----
  const handlePagar = async () => {
    if (!idInscripcion) {
      alert("Falta el id de inscripción.");
      return;
    }

    if (!idCurso || !curso) {
      alert("No se pudo determinar el curso para el pago.");
      return;
    }

    const precio = Number(curso.precio);
    if (!precio || precio <= 0) {
      alert(
        "Este curso no tiene un precio válido o es gratuito. No es necesario procesar pago."
      );
      return;
    }

    setProcesando(true);
    try {
      // 1) reutilizamos pago pendiente si existe
      let pago = pagoExistente;

      // 2) si no hay, creamos un borrador
      if (!pago) {
        const body = {
          monto: precio, // el backend lo recibe como BigDecimal
          moneda: "USD",
          metodo: "TARJETA", // puedes cambiarlo luego por un selector
          referencia: `Pago curso ${curso.titulo}`,
          cupon: null,
          gateway: "DEMO",
          idempotencyKey: `${idInscripcion}-${Date.now()}`,
        };

        pago = await crearPagoBorrador(idInscripcion, body);
        setPagoExistente(pago);
      }

      // 3) enviamos a checkout (aceptado por el usuario)
      const pagoCheckout = await checkoutPago(idInscripcion, pago.id);

      alert(
        `Pago enviado a revisión.\n\nEstado actual: ${
          pagoCheckout.estado || "PENDIENTE"
        }.\n\nEn un flujo real aquí iría el gateway (PayPal/Stripe/etc.) y luego un administrador/instructor usaría /aprobar para activar la inscripción.`
      );

      // después de pagar, volvemos a Mis Cursos
      navigate("/mis-cursos");
    } catch (err) {
      console.error("Error al procesar pago:", err);
      const msg =
        err.response?.data?.message ||
        err.response?.data ||
        "No se pudo procesar el pago.";
      alert(msg);
    } finally {
      setProcesando(false);
    }
  };

  if (!idInscripcion) {
    return (
      <div className="max-w-4xl mx-auto px-4 md:px-6 py-10 text-center text-rose-400">
        Falta el id de inscripción en la URL.
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto px-4 md:px-6 py-8 md:py-10 space-y-6">
      {/* Volver */}
      <button
        type="button"
        onClick={() => navigate(-1)}
        className="inline-flex items-center gap-2 rounded-full border border-slate-700/70 bg-slate-950/80 px-4 py-1.5 text-[0.7rem] md:text-xs font-semibold uppercase tracking-[0.22em] text-slate-200 hover:border-amber-400/80 hover:text-amber-200 hover:bg-slate-900 transition-colors"
      >
        <span className="text-sm">←</span> Volver
      </button>

      {/* Cabecera */}
      <section className="rounded-[2.5rem] border border-slate-800 bg-gradient-to-r from-slate-950 via-slate-900 to-slate-950 px-5 md:px-8 py-6 md:py-7 shadow-[0_24px_90px_rgba(0,0,0,0.95)] space-y-3">
        <span className="inline-flex items-center rounded-full bg-emerald-400/95 px-3 py-1 text-[0.7rem] font-semibold uppercase tracking-[0.22em] text-emerald-950 shadow-[0_0_25px_rgba(16,185,129,0.9)]">
          Pago de curso
        </span>
        <h1 className="text-2xl md:text-3xl font-semibold tracking-tight text-slate-50">
          Confirma tu pago
        </h1>
        <p className="text-xs md:text-sm text-slate-300/90">
          Completa el pago para activar tu inscripción en el curso.
        </p>
      </section>

      {/* Resumen + botón de pagar */}
      <section className="rounded-[2.5rem] border border-slate-800 bg-slate-950/95 px-5 md:px-8 py-6 md:py-7 shadow-[0_24px_90px_rgba(0,0,0,0.95)] space-y-4">
        {loadingCurso ? (
          <p className="text-xs md:text-sm text-slate-300">Cargando curso...</p>
        ) : error ? (
          <p className="text-xs md:text-sm text-rose-400">{error}</p>
        ) : (
          <>
            <h2 className="text-lg md:text-xl font-semibold text-slate-50 tracking-tight mb-2">
              Resumen del curso
            </h2>
            {curso ? (
              <div className="space-y-2 text-xs md:text-sm text-slate-200">
                <p className="font-semibold text-slate-50">{curso.titulo}</p>
                <p className="text-slate-400">
                  {curso.categoria || "Sin categoría"} ·{" "}
                  {curso.nivel || "Nivel no especificado"}
                </p>
                <p className="text-amber-300 font-semibold mt-2">
                  Precio:{" "}
                  {curso.precio != null ? `${curso.precio} USD` : "Gratis"}
                </p>
              </div>
            ) : (
              <p className="text-xs md:text-sm text-slate-400">
                No se pudo cargar la información del curso, pero puedes
                continuar con el pago.
              </p>
            )}
          </>
        )}

        {loadingPago ? (
          <p className="text-[0.75rem] md:text-xs text-slate-400">
            Consultando pagos existentes...
          </p>
        ) : pagoExistente ? (
          <p className="text-[0.75rem] md:text-xs text-slate-400">
            Tienes un pago en estado{" "}
            <span className="font-semibold">
              {(pagoExistente.estado || "").toUpperCase()}
            </span>{" "}
            para esta inscripción. Al continuar, se reutilizará ese pago.
          </p>
        ) : null}

        <div className="mt-4 flex justify-end">
          <button
            type="button"
            onClick={handlePagar}
            disabled={procesando}
            className="inline-flex items-center justify-center rounded-full bg-emerald-400 px-6 py-2.5 text-xs md:text-sm font-semibold uppercase tracking-[0.22em] text-emerald-950 shadow-[0_0_35px_rgba(16,185,129,0.9)] hover:bg-emerald-300 active:translate-y-px disabled:opacity-60 disabled:cursor-not-allowed transition"
          >
            {procesando ? "Procesando..." : "Pagar ahora"}
          </button>
        </div>
      </section>
    </div>
  );
};

export default PagoInscripcion;

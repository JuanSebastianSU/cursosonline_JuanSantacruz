// src/utils/alerts.js
import Swal from "sweetalert2";

/**
 * Alerta de éxito genérica
 */
export const showSuccess = (title = "Operación exitosa", text = "") => {
  return Swal.fire({
    icon: "success",
    title,
    text,
    confirmButtonText: "Aceptar",
  });
};

/**
 * Alerta de error genérica
 */
export const showError = (title = "Ocurrió un error", text = "") => {
  return Swal.fire({
    icon: "error",
    title,
    text,
    confirmButtonText: "Aceptar",
  });
};

/**
 * Alerta informativa
 */
export const showInfo = (title = "Información", text = "") => {
  return Swal.fire({
    icon: "info",
    title,
    text,
    confirmButtonText: "Aceptar",
  });
};

/**
 * Confirmación (OK / Cancelar)
 * Devuelve una promesa: result.isConfirmed === true si aceptó.
 */
export const showConfirm = (
  title = "¿Estás seguro?",
  text = "",
  confirmButtonText = "Sí",
  cancelButtonText = "Cancelar"
) => {
  return Swal.fire({
    icon: "question",
    title,
    text,
    showCancelButton: true,
    confirmButtonText,
    cancelButtonText,
  });
};

/**
 * Toast (esquina superior, se va solo)
 */
export const showToast = (icon = "success", title = "") => {
  const Toast = Swal.mixin({
    toast: true,
    position: "top-end",
    showConfirmButton: false,
    timer: 2500,
    timerProgressBar: true,
  });

  return Toast.fire({
    icon,
    title,
  });
};

// src/services/leccionService.js
import api from "./api";

/**
 * Servicio para gestionar lecciones de un módulo.
 * Endpoints base: /api/v1/modulos/{idModulo}/lecciones
 */

// LISTAR LECCIONES DE UN MÓDULO
export const listarLecciones = async (idModulo) => {
  try {
    const res = await api.get(`/v1/modulos/${idModulo}/lecciones`);
    return res.data;
  } catch (err) {
    console.error("Error al listar lecciones:", err.response?.data || err.message);
    throw err;
  }
};

// CREAR LECCIÓN
export const crearLeccion = async (idModulo, data) => {
  try {
    // Aseguramos que el tipo vaya como enum del backend
    const payload = {
      titulo: data.titulo?.trim(),
      tipo: data.tipo?.toUpperCase(), // VIDEO | ARTICULO | QUIZ
      duracion: data.duracion != null ? Number(data.duracion) : null,
      urlContenido: data.urlContenido?.trim() || null,
      orden: data.orden ? Number(data.orden) : undefined,
    };

    const res = await api.post(`/v1/modulos/${idModulo}/lecciones`, payload);
    return res.data;
  } catch (err) {
    console.error("Error al crear lección:", err.response?.data || err.message);
    throw err;
  }
};

// ACTUALIZAR LECCIÓN (PUT)
export const actualizarLeccion = async (idModulo, idLeccion, data) => {
  try {
    const payload = {
      titulo: data.titulo?.trim(),
      tipo: data.tipo?.toUpperCase(),
      duracion: data.duracion != null ? Number(data.duracion) : null,
      urlContenido: data.urlContenido?.trim() || null,
      orden: data.orden ? Number(data.orden) : undefined,
    };

    const res = await api.put(
      `/v1/modulos/${idModulo}/lecciones/${idLeccion}`,
      payload
    );
    return res.data;
  } catch (err) {
    console.error("Error al actualizar lección:", err.response?.data || err.message);
    throw err;
  }
};

// ELIMINAR LECCIÓN
export const eliminarLeccion = async (idModulo, idLeccion) => {
  try {
    await api.delete(`/v1/modulos/${idModulo}/lecciones/${idLeccion}`);
    return true;
  } catch (err) {
    console.error("Error al eliminar lección:", err.response?.data || err.message);
    throw err;
  }
};

// MOVER LECCIÓN (delta +1 / -1)
export const moverLeccion = async (idModulo, idLeccion, { delta }) => {
  try {
    const res = await api.patch(
      `/v1/modulos/${idModulo}/lecciones/${idLeccion}/mover`,
      { delta }
    );
    return res.data;
  } catch (err) {
    console.error("Error al mover lección:", err.response?.data || err.message);
    throw err;
  }
};

// PUBLICAR LECCIÓN
export const publicarLeccion = async (idModulo, idLeccion) => {
  try {
    const res = await api.patch(
      `/v1/modulos/${idModulo}/lecciones/${idLeccion}/publicar`
    );
    return res.data;
  } catch (err) {
    console.error("Error al publicar lección:", err.response?.data || err.message);
    throw err;
  }
};

// ARCHIVAR LECCIÓN
export const archivarLeccion = async (idModulo, idLeccion) => {
  try {
    const res = await api.patch(
      `/v1/modulos/${idModulo}/lecciones/${idLeccion}/archivar`
    );
    return res.data;
  } catch (err) {
    console.error("Error al archivar lección:", err.response?.data || err.message);
    throw err;
  }
};

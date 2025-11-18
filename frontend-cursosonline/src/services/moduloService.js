// src/services/moduloService.js
import api from "./api";

/**
 * moduloService.js
 * Consumir /v1/cursos/{idCurso}/modulos
 */

const normalizarNotaMinima = (valor) => {
  if (valor === undefined || valor === null || valor === "") return null;
  const num = Number(valor);
  if (Number.isNaN(num)) return null;
  return num;
};

// =============== LISTAR MÓDULOS (vista alumno / instructor / admin) ===============
export const listarModulos = async (idCurso) => {
  try {
    const res = await api.get(`/v1/cursos/${idCurso}/modulos`);
    return res.data || [];
  } catch (err) {
    console.error("Error al listar módulos:", err.response?.data || err.message);
    throw err;
  }
};

// =============== OBTENER UN MÓDULO ===============
export const obtenerModulo = async (idCurso, idModulo) => {
  try {
    const res = await api.get(`/v1/cursos/${idCurso}/modulos/${idModulo}`);
    return res.data;
  } catch (err) {
    console.error("Error al obtener módulo:", err.response?.data || err.message);
    throw err;
  }
};

// =============== CREAR MÓDULO ===============
export const crearModulo = async (idCurso, data) => {
  try {
    const payload = {
      ...data,
      notaMinimaAprobacion: normalizarNotaMinima(data.notaMinimaAprobacion),
    };

    const res = await api.post(`/v1/cursos/${idCurso}/modulos`, payload);
    return res.data;
  } catch (err) {
    console.error("Error al crear módulo:", err.response?.data || err.message);
    throw err;
  }
};

// =============== ACTUALIZAR MÓDULO ===============
export const actualizarModulo = async (idCurso, idModulo, data) => {
  try {
    const payload = {
      ...data,
      notaMinimaAprobacion: normalizarNotaMinima(data.notaMinimaAprobacion),
    };

    const res = await api.put(
      `/v1/cursos/${idCurso}/modulos/${idModulo}`,
      payload
    );
    return res.data;
  } catch (err) {
    console.error("Error al actualizar módulo:", err.response?.data || err.message);
    throw err;
  }
};

// =============== ELIMINAR MÓDULO ===============
export const eliminarModulo = async (idCurso, idModulo) => {
  try {
    await api.delete(`/v1/cursos/${idCurso}/modulos/${idModulo}`);
    return true;
  } catch (err) {
    console.error("Error al eliminar módulo:", err.response?.data || err.message);
    throw err;
  }
};

// =============== CAMBIAR ORDEN EXPLÍCITO ===============
export const cambiarOrdenModulo = async (idCurso, idModulo, nuevoOrden) => {
  try {
    const res = await api.patch(
      `/v1/cursos/${idCurso}/modulos/${idModulo}/orden`,
      { orden: nuevoOrden }
    );
    return res.data;
  } catch (err) {
    console.error("Error al cambiar orden del módulo:", err.response?.data || err.message);
    throw err;
  }
};

// =============== MOVER UP / DOWN ===============
export const moverModulo = async (idCurso, idModulo, payload) => {
  // payload: { delta: +1/-1 } o { direccion: "up"|"down" }
  try {
    const res = await api.patch(
      `/v1/cursos/${idCurso}/modulos/${idModulo}/mover`,
      payload
    );
    return res.data;
  } catch (err) {
    console.error("Error al mover módulo:", err.response?.data || err.message);
    throw err;
  }
};

// =============== REORDENAR LISTA COMPLETA ===============
export const reordenarModulos = async (idCurso, idsEnOrden) => {
  try {
    const res = await api.patch(`/v1/cursos/${idCurso}/modulos/orden`, {
      ids: idsEnOrden,
    });
    return res.data;
  } catch (err) {
    console.error("Error al reordenar módulos:", err.response?.data || err.message);
    throw err;
  }
};

// =============== PUBLICAR / ARCHIVAR ===============
export const publicarModulo = async (idCurso, idModulo) => {
  try {
    const res = await api.patch(
      `/v1/cursos/${idCurso}/modulos/${idModulo}/publicar`
    );
    return res.data;
  } catch (err) {
    console.error("Error al publicar módulo:", err.response?.data || err.message);
    throw err;
  }
};

export const archivarModulo = async (idCurso, idModulo) => {
  try {
    const res = await api.patch(
      `/v1/cursos/${idCurso}/modulos/${idModulo}/archivar`
    );
    return res.data;
  } catch (err) {
    console.error("Error al archivar módulo:", err.response?.data || err.message);
    throw err;
  }
};

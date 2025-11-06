import api from "./api";

/**
 * cursoService.js
 * Servicio para consumir los endpoints de /v1/cursos
 * Permite listar, crear, editar, publicar, archivar, eliminar y subir portadas.
 */

// ====================== LISTAR CURSOS ======================
export const listarCursos = async (params = {}) => {
  try {
    const queryParams = { ...params };

    // Permite incluir archivados o filtrar por instructor, etc.
    if (params.incluirArchivados === undefined) {
      queryParams.incluirArchivados = true;
    }

    // ✅ Se quita el /api porque api.js ya lo incluye en la baseURL
    const res = await api.get("/v1/cursos", { params: queryParams });
    return res.data;
  } catch (err) {
    console.error("Error al listar cursos:", err.response?.data || err.message);
    throw err;
  }
};

// ====================== OBTENER CURSO POR ID ======================
export const obtenerCurso = async (id) => {
  try {
    const res = await api.get(`/v1/cursos/${id}`);
    return res.data;
  } catch (err) {
    console.error("Error al obtener curso:", err.response?.data || err.message);
    throw err;
  }
};

// ====================== CREAR NUEVO CURSO ======================
export const crearCurso = async (data) => {
  try {
    const res = await api.post("/v1/cursos", data);
    return res.data;
  } catch (err) {
    console.error("Error al crear curso:", err.response?.data || err.message);
    throw err;
  }
};

// ====================== ACTUALIZAR CURSO ======================
export const actualizarCurso = async (id, data) => {
  try {
    const res = await api.put(`/v1/cursos/${id}`, data);
    return res.data;
  } catch (err) {
    console.error("Error al actualizar curso:", err.response?.data || err.message);
    throw err;
  }
};

// ====================== ELIMINAR CURSO ======================
export const eliminarCurso = async (id) => {
  try {
    await api.delete(`/v1/cursos/${id}`);
    return true;
  } catch (err) {
    console.error("Error al eliminar curso:", err.response?.data || err.message);
    return false;
  }
};

// ====================== CAMBIAR ESTADO (BORRADOR / PUBLICADO / ARCHIVADO) ======================
export const cambiarEstadoCurso = async (id, estado) => {
  try {
    const res = await api.patch(`/v1/cursos/${id}/estado`, { estado });
    return res.data;
  } catch (err) {
    console.error("Error al cambiar estado del curso:", err.response?.data || err.message);
    throw err;
  }
};

// ====================== PUBLICAR CURSO ======================
export const publicarCurso = async (id) => {
  try {
    const res = await api.patch(`/v1/cursos/${id}/publicar`);
    return res.data;
  } catch (err) {
    console.error("Error al publicar curso:", err.response?.data || err.message);
    throw err;
  }
};

// ====================== ARCHIVAR CURSO ======================
export const archivarCurso = async (id) => {
  try {
    const res = await api.patch(`/v1/cursos/${id}/archivar`);
    return res.data;
  } catch (err) {
    console.error("Error al archivar curso:", err.response?.data || err.message);
    throw err;
  }
};

// ====================== SUBIR PORTADA ======================
export const subirPortada = async (id, file) => {
  const formData = new FormData();
  formData.append("file", file);

  try {
    const res = await api.post(`/v1/cursos/${id}/portada`, formData, {
      headers: { "Content-Type": "multipart/form-data" },
    });
    return res.data;
  } catch (err) {
    console.error("Error al subir portada:", err.response?.data || err.message);
    throw err;
  }
};

// ====================== ASIGNAR PORTADA DESDE URL ======================
export const asignarPortadaDesdeUrl = async (id, url) => {
  try {
    const res = await api.post(`/v1/cursos/${id}/portada/url`, { url });
    return res.data;
  } catch (err) {
    console.error("Error al asignar portada desde URL:", err.response?.data || err.message);
    throw err;
  }
};

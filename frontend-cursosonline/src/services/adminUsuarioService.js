// src/services/adminUsuarioService.js
// OJO: api.js ya tiene baseURL = "http://localhost:8080/api"
// Aquí usamos rutas que empiezan en /usuarios y /tipousuario

import api from "./api";

// ===================== USUARIOS =====================

// Lista todos los usuarios (solo ADMIN en backend)
export const listarUsuariosAdmin = async () => {
  try {
    const res = await api.get("/usuarios");
    return Array.isArray(res.data) ? res.data : [];
  } catch (err) {
    console.error(
      "Error al listar usuarios (admin):",
      err.response?.data || err.message
    );
    throw err;
  }
};

// Cambiar estado: ACTIVO / INACTIVO / BLOQUEADO / etc
export const cambiarEstadoUsuario = async (idUsuario, nuevoEstado) => {
  try {
    const payload = { estado: String(nuevoEstado).trim().toUpperCase() };
    const res = await api.patch(`/usuarios/${idUsuario}/estado`, payload);
    return res.data;
  } catch (err) {
    console.error(
      "Error al cambiar estado de usuario:",
      err.response?.data || err.message
    );
    throw err;
  }
};

// Actualizar rol (campo rol del Usuario)
export const actualizarRolUsuario = async (idUsuario, nuevoRol) => {
  try {
    const payload = { rol: String(nuevoRol).trim() };
    const res = await api.patch(`/usuarios/${idUsuario}`, payload);
    return res.data;
  } catch (err) {
    console.error(
      "Error al actualizar rol de usuario:",
      err.response?.data || err.message
    );
    throw err;
  }
};

// Cambiar password
export const cambiarPasswordUsuario = async (idUsuario, nuevaPassword) => {
  try {
    const payload = { password: nuevaPassword };
    const res = await api.patch(`/usuarios/${idUsuario}/password`, payload);
    return res.data;
  } catch (err) {
    console.error(
      "Error al cambiar password de usuario:",
      err.response?.data || err.message
    );
    throw err;
  }
};

// Eliminar usuario
export const eliminarUsuarioAdmin = async (idUsuario) => {
  try {
    await api.delete(`/usuarios/${idUsuario}`);
    return true;
  } catch (err) {
    console.error(
      "Error al eliminar usuario:",
      err.response?.data || err.message
    );
    throw err;
  }
};

// ===================== TIPOS DE USUARIO =====================

export const listarTiposUsuario = async (q) => {
  try {
    const params = {};
    if (q && q.trim()) params.q = q.trim();

    const res = await api.get("/tipousuario", { params });
    const data = res.data;
    if (Array.isArray(data)) return data;
    if (Array.isArray(data?.content)) return data.content;
    return [];
  } catch (err) {
    console.error(
      "Error al listar tipos de usuario:",
      err.response?.data || err.message
    );
    throw err;
  }
};

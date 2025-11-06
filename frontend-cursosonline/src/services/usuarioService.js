import api from "./api";

/**
 * usuarioService.js
 * Servicio para interactuar con los endpoints de gestión de usuarios:
 * /api/usuarios
 */

// ====================== LISTAR TODOS ======================
export const listarUsuarios = async () => {
  try {
    const res = await api.get("/usuarios");
    return res.data;
  } catch (err) {
    console.error("Error al listar usuarios:", err.response?.data || err.message);
    throw err;
  }
};

// ====================== OBTENER USUARIO POR ID ======================
export const obtenerUsuario = async (id) => {
  try {
    const res = await api.get(`/usuarios/${id}`);
    return res.data;
  } catch (err) {
    console.error("Error al obtener usuario:", err.response?.data || err.message);
    throw err;
  }
};

// ====================== ACTUALIZAR USUARIO ======================
export const actualizarUsuario = async (id, data) => {
  try {
    const res = await api.put(`/usuarios/${id}`, data);
    return res.data;
  } catch (err) {
    console.error("Error al actualizar usuario:", err.response?.data || err.message);
    throw err;
  }
};

// ====================== PATCH (actualización parcial) ======================
export const patchUsuario = async (id, data) => {
  try {
    const res = await api.patch(`/usuarios/${id}`, data);
    return res.data;
  } catch (err) {
    console.error("Error en patch usuario:", err.response?.data || err.message);
    throw err;
  }
};

// ====================== CAMBIAR ESTADO ======================
export const cambiarEstadoUsuario = async (id, estado) => {
  try {
    const res = await api.patch(`/usuarios/${id}/estado`, { estado });
    return res.data;
  } catch (err) {
    console.error("Error al cambiar estado del usuario:", err.response?.data || err.message);
    throw err;
  }
};

// ====================== CAMBIAR CONTRASEÑA ======================
export const cambiarPassword = async (id, password) => {
  try {
    const res = await api.patch(`/usuarios/${id}/password`, { password });
    return res.data;
  } catch (err) {
    console.error("Error al cambiar contraseña:", err.response?.data || err.message);
    throw err;
  }
};

// ====================== ELIMINAR USUARIO ======================
export const eliminarUsuario = async (id) => {
  try {
    await api.delete(`/usuarios/${id}`);
    return true;
  } catch (err) {
    console.error("Error al eliminar usuario:", err.response?.data || err.message);
    return false;
  }
};

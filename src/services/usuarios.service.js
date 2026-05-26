import internalApi from "../api/internalApi";
import { extractApiPayload } from "../utils/api";

const toUsuarioCreatePayload = (data = {}) => ({
  username: data.username ?? "",
  correo: data.correo ?? "",
  nombres: data.nombres ?? "",
  apellidos: data.apellidos ?? null,
  password: data.password ?? "",
  creadoPorUsuario: data.creadoPorUsuario ?? null,
});

const toUsuarioUpdatePayload = (data = {}) => ({
  username: data.username ?? "",
  correo: data.correo ?? "",
  nombres: data.nombres ?? "",
  apellidos: data.apellidos ?? null,
  estadoUsuario: data.estadoUsuario ?? "ACT",
  modificadoPorUsuario: data.modificadoPorUsuario ?? null,
  rowVersion: data.rowVersion ?? null,
});

export const getUsuarios = async (params) => {
  const response = await internalApi.get("/usuarios", { params });
  return extractApiPayload(response);
};

export const getUsuario = async (id) => {
  const response = await internalApi.get(`/usuarios/${id}`);
  return extractApiPayload(response);
};

export const createUsuario = async (data) => {
  const response = await internalApi.post("/usuarios", toUsuarioCreatePayload(data));
  return extractApiPayload(response);
};

export const updateUsuario = async (id, data) => {
  const response = await internalApi.put(`/usuarios/${id}`, toUsuarioUpdatePayload(data));
  return extractApiPayload(response);
};

export const deleteUsuario = async (id) => {
  const response = await internalApi.delete(`/usuarios/${id}`);
  return extractApiPayload(response);
};

export const inhabilitarUsuario = async (id, motivo) => {
  const response = await internalApi.patch(`/usuarios/${id}/inhabilitar`, {
    motivo,
  });
  return extractApiPayload(response);
};

export const getUsuarioRoles = async (id) => {
  const response = await internalApi.get(`/usuarios/${id}/roles`);
  return extractApiPayload(response);
};

export const asignarRolUsuario = async (id, rolGuid) => {
  const response = await internalApi.post(`/usuarios/${id}/roles`, {
    rolGuid,
  });
  return extractApiPayload(response);
};

export const removerRolUsuario = async (id, rolGuid) => {
  const response = await internalApi.delete(`/usuarios/${id}/roles/${rolGuid}`);
  return extractApiPayload(response);
};

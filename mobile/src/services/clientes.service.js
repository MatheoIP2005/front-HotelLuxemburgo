import internalApi from "../api/internalApi";
import { extractApiPayload } from "../../../src/shared/utils/api";
import { normalizeTipoIdentificacion } from "../../../src/shared/utils/constraints";

const toClienteCreatePayload = (data = {}) => ({
  tipoIdentificacion: normalizeTipoIdentificacion(
    data.tipoIdentificacion ?? data.tipo_identificacion
  ),
  numeroIdentificacion: data.numeroIdentificacion ?? data.numero_identificacion ?? "",
  nombres: data.nombres ?? "",
  apellidos: data.apellidos ?? "",
  razonSocial: data.razonSocial ?? data.razon_social ?? null,
  correo: data.correo ?? null,
  telefono: data.telefono ?? null,
  direccion: data.direccion ?? null,
  creadoPorUsuario: data.creadoPorUsuario ?? null,
});

const toClienteUpdatePayload = (data = {}) => ({
  tipoIdentificacion: normalizeTipoIdentificacion(
    data.tipoIdentificacion ?? data.tipo_identificacion
  ),
  numeroIdentificacion: data.numeroIdentificacion ?? data.numero_identificacion ?? "",
  nombres: data.nombres ?? "",
  apellidos: data.apellidos ?? "",
  razonSocial: data.razonSocial ?? data.razon_social ?? null,
  correo: data.correo ?? null,
  telefono: data.telefono ?? null,
  direccion: data.direccion ?? null,
  estado: data.estado ?? "ACT",
  modificadoPorUsuario: data.modificadoPorUsuario ?? null,
  rowVersion: data.rowVersion ?? null,
});

export const getClientes = async (params) => {
  const response = await internalApi.get("/clientes", { params });
  return extractApiPayload(response);
};

export const getCliente = async (id) => {
  const response = await internalApi.get(`/clientes/${id}`);
  return extractApiPayload(response);
};

export const createCliente = async (data) => {
  const response = await internalApi.post("/clientes", toClienteCreatePayload(data));
  return extractApiPayload(response);
};

export const updateCliente = async (id, data) => {
  const response = await internalApi.put(`/clientes/${id}`, toClienteUpdatePayload(data));
  return extractApiPayload(response);
};

export const deleteCliente = async (id) => {
  const response = await internalApi.delete(`/clientes/${id}`);
  return extractApiPayload(response);
};

export const inhabilitarCliente = async (id, motivo) => {
  const response = await internalApi.patch(`/clientes/${id}/inhabilitar`, {
    motivo,
  });
  return extractApiPayload(response);
};

import internalApi from "../api/internalApi";
import { extractApiPayload } from "../utils/api";

const toNumber = (value, fallback = 0) => {
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : fallback;
};

const toNullableNumber = (value) =>
  value === null || value === undefined || value === "" ? null : Number(value);

const toCreateHabitacionPayload = (data = {}) => ({
  idSucursal: toNumber(data.idSucursal, 0),
  idTipoHabitacion: toNumber(data.idTipoHabitacion, 0),
  numeroHabitacion: data.numeroHabitacion ?? "",
  piso: toNullableNumber(data.piso),
  precioBase: toNumber(data.precioBase, 0),
  descripcionHabitacion: data.descripcionHabitacion ?? null,
});

const toUpdateHabitacionPayload = (data = {}) => ({
  idTipoHabitacion: toNumber(data.idTipoHabitacion, 0),
  numeroHabitacion: data.numeroHabitacion ?? "",
  piso: toNullableNumber(data.piso),
  precioBase: toNumber(data.precioBase, 0),
  descripcionHabitacion: data.descripcionHabitacion ?? null,
  estadoHabitacion: data.estadoHabitacion ?? "DIS",
  rowVersion: data.rowVersion ?? null,
});

export const getHabitaciones = async (params) => {
  const response = await internalApi.get("/habitaciones", { params });
  return extractApiPayload(response);
};

export const getHabitacion = async (id) => {
  const response = await internalApi.get(`/habitaciones/${id}`);
  return extractApiPayload(response);
};

export const createHabitacion = async (data) => {
  const response = await internalApi.post(
    "/habitaciones",
    toCreateHabitacionPayload(data)
  );
  return extractApiPayload(response);
};

export const updateHabitacion = async (id, data) => {
  const response = await internalApi.put(
    `/habitaciones/${id}`,
    toUpdateHabitacionPayload(data)
  );
  return extractApiPayload(response);
};

export const deleteHabitacion = async (id) => {
  const response = await internalApi.delete(`/habitaciones/${id}`);
  return extractApiPayload(response);
};

export const cambiarEstadoHabitacion = async (id, estado, rowVersion = null) => {
  const response = await internalApi.patch(`/habitaciones/${id}/estado`, {
    nuevoEstado: estado,
    rowVersion,
  });
  return extractApiPayload(response);
};

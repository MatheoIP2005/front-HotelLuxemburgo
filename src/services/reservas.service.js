import internalApi from "../api/internalApi";
import { extractApiPayload } from "../utils/api";

const toNumber = (value, fallback = 0) => {
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : fallback;
};

const toDateOnly = (value) => {
  const normalized = String(value || "").trim();
  return normalized ? normalized.slice(0, 10) : null;
};

const toReservaHabitacionPayload = (item = {}, reserva = {}) => {
  const fechaInicio =
    item.fechaInicio ?? reserva.fechaInicio ?? null;
  const fechaFin = item.fechaFin ?? reserva.fechaFin ?? null;

  return {
    idHabitacion: toNumber(item.idHabitacion, 0),
    idTarifa: toNumber(item.idTarifa, 0),
    fechaInicio: toDateOnly(fechaInicio),
    fechaFin: toDateOnly(fechaFin),
    numAdultos: toNumber(item.numAdultos, 1),
    numNinos: toNumber(item.numNinos, 0),
    precioNocheAplicado: toNumber(item.precioNocheAplicado, 0),
  };
};

const toReservaPayload = (data = {}) => ({
  idCliente: toNumber(data.idCliente, 0),
  idSucursal: toNumber(data.idSucursal, 0),
  fechaInicio: toDateOnly(data.fechaInicio),
  fechaFin: toDateOnly(data.fechaFin),
  origenCanalReserva: data.origenCanalReserva ?? "ADMIN",
  observaciones: data.observaciones ?? null,
  esWalkin: Boolean(data.esWalkin),
  creadoPorUsuario: data.creadoPorUsuario ?? null,
  habitaciones: Array.isArray(data.habitaciones)
    ? data.habitaciones.map((item) => toReservaHabitacionPayload(item, data))
    : [],
});

export const getReservas = async (params) => {
  const hasParams = params && Object.keys(params).length > 0;
  const response = await internalApi.get(
    "/reservas",
    hasParams ? { params } : undefined
  );
  return extractApiPayload(response);
};

export const getReserva = async (id) => {
  const response = await internalApi.get(`/reservas/${id}`);
  return extractApiPayload(response);
};

export const createReserva = async (data) => {
  const response = await internalApi.post("/reservas", toReservaPayload(data));
  return extractApiPayload(response);
};

export const confirmarReserva = async (id) => {
  const response = await internalApi.patch(`/reservas/${id}/confirmar`);
  return extractApiPayload(response);
};

export const cancelarReserva = async (id, motivo) => {
  const payload =
    typeof motivo === "object" && motivo !== null
      ? motivo
      : { motivo };
  const response = await internalApi.patch(`/reservas/${id}/cancelar`, payload);
  return extractApiPayload(response);
};

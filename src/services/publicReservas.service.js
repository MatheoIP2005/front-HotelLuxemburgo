import publicApi from "../api/publicApi";
import { extractApiPayload } from "../utils/api";
import { normalizeTipoIdentificacion } from "../utils/constraints";

const toDateOnly = (value) => {
  const normalized = String(value || "").trim();
  return normalized ? normalized.slice(0, 10) : null;
};

const toClientePayload = (cliente = {}) => ({
  tipoIdentificacion: normalizeTipoIdentificacion(
    cliente.tipoIdentificacion ?? cliente.tipo_identificacion
  ),
  numeroIdentificacion:
    cliente.numeroIdentificacion ?? cliente.numero_identificacion ?? "",
  nombres: cliente.nombres ?? "",
  apellidos: cliente.apellidos ?? "",
  correo: cliente.correo ?? "",
  telefono: cliente.telefono ?? "",
  direccion: cliente.direccion ?? "",
});

const toReservaHabitacionPayload = (item = {}, reserva = {}) => ({
  tipoHabitacionGuid: item.tipoHabitacionGuid ?? null,
  numHabitaciones: Number(item.numHabitaciones ?? reserva.numHabitaciones ?? 1),
  numAdultos: Number(item.numAdultos ?? reserva.numAdultos ?? 1),
  numNinos: Number(item.numNinos ?? reserva.numNinos ?? 0),
});

const toPublicReservaPayload = (data = {}) => ({
  cliente: toClientePayload(data.cliente),
  sucursalGuid: data.sucursalGuid ?? "",
  fechaInicio: toDateOnly(data.fechaInicio),
  fechaFin: toDateOnly(data.fechaFin),
  origenCanalReserva: data.origenCanalReserva ?? "PORTAL",
  observaciones: data.observaciones ?? null,
  esWalkin: Boolean(data.esWalkin),
  habitaciones: Array.isArray(data.habitaciones)
    ? data.habitaciones.map((item) => toReservaHabitacionPayload(item, data))
    : [],
});

export const createPublicReserva = async (data) => {
  const response = await publicApi.post(
    "/accommodations/reservas",
    toPublicReservaPayload(data)
  );
  return extractApiPayload(response);
};

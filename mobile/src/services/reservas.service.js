import internalApi from "../api/internalApi";
import { extractApiPayload } from "../../../src/shared/utils/api";

const toNumber = (value, fallback = 0) => {
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : fallback;
};

const toDateOnly = (value) => {
  const normalized = String(value || "").trim();
  return normalized ? normalized.slice(0, 10) : null;
};

const countNights = (fechaInicio, fechaFin) => {
  const start = toDateOnly(fechaInicio);
  const end = toDateOnly(fechaFin);
  if (!start || !end) return 1;

  const startDate = new Date(`${start}T00:00:00`);
  const endDate = new Date(`${end}T00:00:00`);
  const diffMs = endDate.getTime() - startDate.getTime();
  const nights = Math.round(diffMs / (1000 * 60 * 60 * 24));
  return nights > 0 ? nights : 1;
};

const roundMoney = (value) => Math.round((Number(value) + Number.EPSILON) * 100) / 100;

const buildReservaHabitacionPayload = (item = {}, reserva = {}) => {
  const fechaInicio = toDateOnly(item.fechaInicio ?? reserva.fechaInicio);
  const fechaFin = toDateOnly(item.fechaFin ?? reserva.fechaFin);
  const nights = countNights(fechaInicio, fechaFin);
  const precioNocheAplicado = Math.max(
    0.01,
    toNumber(item.precioNocheAplicado, 0.01)
  );
  const subtotalLinea = roundMoney(precioNocheAplicado * nights);
  const valorIvaLinea = roundMoney(item.valorIvaLinea ?? 0);
  const descuentoLinea = roundMoney(item.descuentoLinea ?? 0);
  const totalLinea = roundMoney(subtotalLinea - descuentoLinea + valorIvaLinea);

  return {
    habitacionGuid: item.habitacionGuid ?? "",
    tarifaGuid: item.tarifaGuid || null,
    fechaInicio,
    fechaFin,
    numAdultos: toNumber(item.numAdultos, 1),
    numNinos: toNumber(item.numNinos, 0),
    precioNocheAplicado,
    subtotalLinea,
    valorIvaLinea,
    descuentoLinea,
    totalLinea: totalLinea > 0 ? totalLinea : subtotalLinea,
  };
};

const toReservaPayload = (data = {}) => {
  const habitaciones = Array.isArray(data.habitaciones)
    ? data.habitaciones.filter(Boolean).map((item) => buildReservaHabitacionPayload(item, data))
    : [];

  const subtotalReserva = roundMoney(
    habitaciones.reduce((sum, line) => sum + line.subtotalLinea, 0)
  );
  const valorIva = roundMoney(
    data.valorIva ?? habitaciones.reduce((sum, line) => sum + line.valorIvaLinea, 0)
  );
  const descuentoAplicado = roundMoney(data.descuentoAplicado ?? 0);
  const totalReserva = roundMoney(
    habitaciones.reduce((sum, line) => sum + line.totalLinea, 0) - descuentoAplicado
  );

  return {
    clienteGuid: data.clienteGuid ?? "",
    sucursalGuid: data.sucursalGuid ?? "",
    fechaInicio: toDateOnly(data.fechaInicio),
    fechaFin: toDateOnly(data.fechaFin),
    subtotalReserva,
    valorIva,
    totalReserva: totalReserva > 0 ? totalReserva : roundMoney(subtotalReserva + valorIva),
    descuentoAplicado,
    saldoPendiente:
      data.saldoPendiente != null
        ? roundMoney(data.saldoPendiente)
        : totalReserva > 0
          ? totalReserva
          : roundMoney(subtotalReserva + valorIva),
    origenCanalReserva: data.origenCanalReserva ?? "ADMIN",
    observaciones: data.observaciones ?? null,
    esWalkin: Boolean(data.esWalkin),
    creadoPorUsuario: data.creadoPorUsuario ?? null,
    habitaciones,
  };
};

export const getReservas = async (params = {}) => {
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

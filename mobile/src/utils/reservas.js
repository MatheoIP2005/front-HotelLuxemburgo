import { normalizeCollectionPayload } from "../../../src/shared/utils/api";

export const getReservaId = (reserva) =>
  reserva?.reservaGuid ?? reserva?.guidReserva ?? null;

export const formatReservaDate = (value) => {
  if (!value) return "-";
  const normalized = String(value).slice(0, 10);
  return normalized || "-";
};

export const formatReservaMoney = (value) => {
  const amount = Number(value ?? 0);
  return `$${amount.toFixed(2)}`;
};

export const normalizeReservasList = (response, params = {}) =>
  normalizeCollectionPayload(response, {
    pagina: Number(params?.pagina) || 1,
    limite: Number(params?.limite) || 20,
  });

export const canConfirmReserva = (estado) => String(estado || "").toUpperCase() === "PEN";

export const canCancelReserva = (estado) => {
  const normalized = String(estado || "").toUpperCase();
  return normalized === "PEN" || normalized === "CON";
};

export const isValidGuid = (value) =>
  /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(
    String(value || "").trim()
  );

export const getLocalDateMin = () => new Date().toISOString().slice(0, 10);

export const addDaysToIsoDate = (isoDate, amount) => {
  if (!isoDate) return "";
  const [year, month, day] = isoDate.split("-").map(Number);
  const nextDate = new Date(year, month - 1, day);
  nextDate.setDate(nextDate.getDate() + amount);
  return nextDate.toISOString().slice(0, 10);
};

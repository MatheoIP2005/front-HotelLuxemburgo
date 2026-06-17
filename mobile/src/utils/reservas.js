import { normalizeCollectionPayload } from "../../../src/shared/utils/api";
import { filterSafeList, withSafeItems } from "./adminCollection";
import { RESERVA_CANALES } from "./constraints";
import {
  parseNonNegativeInteger,
  parsePositiveInteger,
  parsePositiveNumber,
} from "./numeric";
import { addDaysToIsoDate, getTodayIsoDate } from "./booking";

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
  withSafeItems(
    normalizeCollectionPayload(response, {
      pagina: Number(params?.pagina) || 1,
      limite: Number(params?.limite) || 20,
    })
  );

export const canConfirmReserva = (estado) => String(estado || "").toUpperCase() === "PEN";

export const canCancelReserva = (estado) => {
  const normalized = String(estado || "").toUpperCase();
  return normalized === "PEN" || normalized === "CON";
};

export const isValidGuid = (value) =>
  /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(
    String(value || "").trim()
  );

export const getLocalDateMin = getTodayIsoDate;

export const validateReservaLinea = (linea = {}) => {
  const errors = {};
  const numAdultos = parsePositiveInteger(linea.numAdultos);
  const numNinos = parseNonNegativeInteger(linea.numNinos);
  const precioNocheAplicado = parsePositiveNumber(linea.precioNocheAplicado);

  if (!isValidGuid(linea.habitacionGuid)) {
    errors.habitacionGuid = "Seleccione una habitación válida.";
  }
  if (!isValidGuid(linea.tarifaGuid)) {
    errors.tarifaGuid = "Seleccione una tarifa válida.";
  }
  if (!String(linea.numAdultos ?? "").trim() || numAdultos === null || Number.isNaN(numAdultos)) {
    errors.numAdultos = "Debe ingresar al menos un adulto.";
  }
  if (String(linea.numNinos ?? "").trim() === "" || numNinos === null || Number.isNaN(numNinos)) {
    errors.numNinos = "El número de niños no puede ser negativo.";
  }
  if (
    !String(linea.precioNocheAplicado ?? "").trim() ||
    precioNocheAplicado === null ||
    Number.isNaN(precioNocheAplicado)
  ) {
    errors.precioNocheAplicado = "El precio por noche debe ser mayor a cero.";
  }

  return errors;
};

export const validateReservaForm = (form = {}, { minFechaInicio } = {}) => {
  const formErrors = {};
  const lineErrors = filterSafeList(form.habitaciones).map((linea) =>
    validateReservaLinea(linea)
  );

  if (!isValidGuid(form.clienteGuid)) {
    formErrors.clienteGuid = "Seleccione un cliente válido.";
  }
  if (!isValidGuid(form.sucursalGuid)) {
    formErrors.sucursalGuid = "Seleccione una sucursal válida.";
  }
  if (!form.fechaInicio) {
    formErrors.fechaInicio = "La fecha inicio es obligatoria.";
  }
  if (!form.fechaFin) {
    formErrors.fechaFin = "La fecha fin es obligatoria.";
  }
  if (form.fechaInicio && form.fechaFin && form.fechaFin <= form.fechaInicio) {
    formErrors.fechaFin = "La fecha fin debe ser posterior a la fecha inicio.";
  }
  if (form.fechaInicio && minFechaInicio && form.fechaInicio < minFechaInicio) {
    formErrors.fechaInicio = "No se permiten fechas pasadas.";
  }
  if (!RESERVA_CANALES.includes(form.origenCanalReserva)) {
    formErrors.origenCanalReserva = "Seleccione una opción válida.";
  }
  if (String(form.observaciones ?? "").length > 2000) {
    formErrors.observaciones = "Las observaciones no pueden exceder 2000 caracteres.";
  }

  if (!form.habitaciones?.length) {
    formErrors.habitaciones = "Agrega al menos una habitación.";
  }

  const habitacionGuids = (form.habitaciones ?? [])
    .map((linea) => linea.habitacionGuid)
    .filter(isValidGuid);
  const hasDuplicates = habitacionGuids.some(
    (guid, index) => habitacionGuids.indexOf(guid) !== index
  );
  if (hasDuplicates) {
    formErrors.habitaciones =
      "No puedes asignar la misma habitación en más de una línea.";
  }

  const hasLineErrors = lineErrors.some((lineError) => Object.keys(lineError).length > 0);

  return { formErrors, lineErrors, hasLineErrors };
};

export const buildReservaLineaPayload = (linea = {}, fechas = {}) => ({
  habitacionGuid: linea.habitacionGuid ?? "",
  tarifaGuid: linea.tarifaGuid || null,
  fechaInicio: fechas.fechaInicio,
  fechaFin: fechas.fechaFin,
  numAdultos: Number(linea.numAdultos ?? 1),
  numNinos: Number(linea.numNinos ?? 0),
  precioNocheAplicado: Number(linea.precioNocheAplicado ?? 0),
});

export { addDaysToIsoDate };

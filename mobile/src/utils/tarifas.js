import { TARIFA_CANALES, TARIFA_ESTADOS } from "./constraints";
import {
  parseNonNegativeNumber,
  parsePositiveInteger,
  parsePositiveNumber,
} from "./numeric";

const TARIFA_LIMITS = {
  codigo: 30,
  nombre: 150,
};

export const validateTarifaForm = (form, isEdit = false, minLocalDate) => {
  const errors = {};
  const codigoTarifa = String(form.codigoTarifa ?? "").trim();
  const nombreTarifa = String(form.nombreTarifa ?? "").trim();
  const precioPorNoche = parsePositiveNumber(form.precioPorNoche);
  const porcentajeIva = parseNonNegativeNumber(form.porcentajeIva);
  const minNoches = parsePositiveInteger(form.minNoches);
  const maxNochesRaw = String(form.maxNoches ?? "").trim();
  const maxNoches = maxNochesRaw === "" ? null : parsePositiveInteger(form.maxNoches);
  const prioridad = parsePositiveInteger(form.prioridad);

  if (!codigoTarifa) {
    errors.codigoTarifa = "El código de tarifa es obligatorio.";
  } else if (codigoTarifa.length > TARIFA_LIMITS.codigo) {
    errors.codigoTarifa = "No puede exceder 30 caracteres.";
  }

  if (!nombreTarifa) {
    errors.nombreTarifa = "El nombre de tarifa es obligatorio.";
  } else if (nombreTarifa.length > TARIFA_LIMITS.nombre) {
    errors.nombreTarifa = "No puede exceder 150 caracteres.";
  }

  if (!form.idSucursal || Number(form.idSucursal) <= 0) {
    errors.idSucursal = "Selecciona una sucursal válida.";
  }

  if (!form.idTipoHabitacion || Number(form.idTipoHabitacion) <= 0) {
    errors.idTipoHabitacion = "Selecciona un tipo de habitación válido.";
  }

  if (!TARIFA_CANALES.includes(form.canalTarifa)) {
    errors.canalTarifa = "Selecciona un canal válido.";
  }

  if (!form.fechaInicio) {
    errors.fechaInicio = "La fecha de inicio es obligatoria.";
  } else if (form.fechaInicio < minLocalDate) {
    errors.fechaInicio = "La fecha de inicio no puede estar en el pasado.";
  }

  if (!form.fechaFin) {
    errors.fechaFin = "La fecha de fin es obligatoria.";
  } else if (form.fechaFin < minLocalDate) {
    errors.fechaFin = "La fecha de fin no puede estar en el pasado.";
  }

  if (form.fechaInicio && form.fechaFin && form.fechaFin < form.fechaInicio) {
    errors.fechaFin = "La fecha de fin debe ser mayor o igual a la fecha de inicio.";
  }

  if (precioPorNoche === null || Number.isNaN(precioPorNoche)) {
    errors.precioPorNoche = "El precio por noche debe ser mayor a 0.";
  }

  if (
    form.porcentajeIva === "" ||
    porcentajeIva === null ||
    Number.isNaN(porcentajeIva)
  ) {
    errors.porcentajeIva = "El IVA debe ser un valor mayor o igual a 0.";
  }

  if (minNoches === null || Number.isNaN(minNoches)) {
    errors.minNoches = "El mínimo de noches debe ser mayor a 0.";
  }

  if (maxNochesRaw !== "" && (maxNoches === null || Number.isNaN(maxNoches))) {
    errors.maxNoches = "El máximo debe ser un entero mayor a 0.";
  } else if (
    maxNoches !== null &&
    !Number.isNaN(maxNoches) &&
    minNoches !== null &&
    !Number.isNaN(minNoches) &&
    maxNoches < minNoches
  ) {
    errors.maxNoches = "El máximo debe ser nulo o mayor/igual al mínimo.";
  }

  if (prioridad === null || Number.isNaN(prioridad)) {
    errors.prioridad = "La prioridad debe ser mayor a 0.";
  }

  if (isEdit && !TARIFA_ESTADOS.includes(form.estadoTarifa)) {
    errors.estadoTarifa = "Selecciona un estado válido.";
  }

  return errors;
};

export const buildTarifaPayload = (form, isEdit = false) => ({
  codigoTarifa: String(form.codigoTarifa ?? "").trim(),
  nombreTarifa: String(form.nombreTarifa ?? "").trim(),
  idSucursal: Number(form.idSucursal),
  idTipoHabitacion: Number(form.idTipoHabitacion),
  canalTarifa: form.canalTarifa,
  fechaInicio: form.fechaInicio,
  fechaFin: form.fechaFin,
  precioPorNoche: Number(form.precioPorNoche),
  porcentajeIva: Number(form.porcentajeIva),
  minNoches: Number(form.minNoches),
  maxNoches: String(form.maxNoches ?? "").trim() === "" ? null : Number(form.maxNoches),
  prioridad: Number(form.prioridad),
  permitePortalPublico: form.permitePortalPublico,
  ...(isEdit ? { estadoTarifa: form.estadoTarifa, rowVersion: form.rowVersion } : {}),
});

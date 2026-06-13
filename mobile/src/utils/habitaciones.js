import { HABITACION_ESTADOS, MAX_LENGTHS } from "./constraints";
import {
  parseNonNegativeInteger,
  parsePositiveNumber,
} from "./numeric";
import { isValidGuid } from "./reservas";

export const validateHabitacionForm = (form, isEdit = false) => {
  const errors = {};
  const numeroHabitacion = String(form.numeroHabitacion ?? "").trim();
  const descripcionHabitacion = String(form.descripcionHabitacion ?? "").trim();
  const precioBase = parsePositiveNumber(form.precioBase);
  const pisoRaw = String(form.piso ?? "").trim();
  const piso = pisoRaw === "" ? null : parseNonNegativeInteger(form.piso);

  if (!isValidGuid(form.sucursalGuid)) {
    errors.sucursalGuid = "Selecciona una sucursal válida.";
  }

  if (!isValidGuid(form.tipoHabitacionGuid)) {
    errors.tipoHabitacionGuid = "Selecciona un tipo de habitación válido.";
  }

  if (!numeroHabitacion) {
    errors.numeroHabitacion = "El número de habitación es obligatorio.";
  } else if (numeroHabitacion.length > MAX_LENGTHS.habitacion.numero) {
    errors.numeroHabitacion = "No puede exceder 20 caracteres.";
  }

  if (pisoRaw !== "" && (piso === null || Number.isNaN(piso))) {
    errors.piso = "El piso debe ser un número mayor o igual a 0.";
  }

  if (precioBase === null || Number.isNaN(precioBase)) {
    errors.precioBase = "El precio base debe ser mayor a 0.";
  }

  if (descripcionHabitacion.length > MAX_LENGTHS.habitacion.descripcion) {
    errors.descripcionHabitacion = "La descripción no puede exceder 250 caracteres.";
  }

  if (isEdit && !HABITACION_ESTADOS.includes(form.estadoHabitacion)) {
    errors.estadoHabitacion = "Selecciona un estado válido.";
  }

  return errors;
};

export const buildHabitacionPayload = (form, isEdit = false) => ({
  sucursalGuid: form.sucursalGuid,
  tipoHabitacionGuid: form.tipoHabitacionGuid,
  numeroHabitacion: String(form.numeroHabitacion ?? "").trim(),
  piso: String(form.piso ?? "").trim() === "" ? null : Number(form.piso),
  precioBase: Number(form.precioBase),
  descripcionHabitacion: String(form.descripcionHabitacion ?? "").trim() || null,
  ...(isEdit ? { estadoHabitacion: form.estadoHabitacion } : {}),
});

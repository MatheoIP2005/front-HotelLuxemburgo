import { MAX_LENGTHS, TIME_24H_REGEX } from "./constraints";
import { toIsoDate } from "./dates";
import {
  parseNonNegativeNumber,
  parsePositiveInteger,
} from "./numeric";

export const parseFechaConsumoDateTime = (fecha, hora) => {
  const datePart = String(fecha ?? "").trim();
  if (!datePart) return null;

  const timePart = String(hora ?? "").trim() || "00:00";
  const parsed = new Date(`${datePart}T${timePart}:00`);
  return Number.isNaN(parsed.getTime()) ? null : parsed;
};

export const getFechaConsumoBounds = (estadia) => {
  const todayIso = toIsoDate(new Date());
  const checkinIso = estadia?.checkinUtc
    ? toIsoDate(new Date(estadia.checkinUtc))
    : undefined;
  const checkoutIso = estadia?.checkoutUtc
    ? toIsoDate(new Date(estadia.checkoutUtc))
    : undefined;

  let maxDate = todayIso;
  if (checkoutIso && checkoutIso < maxDate) {
    maxDate = checkoutIso;
  }

  return {
    minDate: checkinIso,
    maxDate,
  };
};

export const validateCargoEstadiaForm = (form = {}, { estadia } = {}) => {
  const errors = {};
  const cantidad = parsePositiveInteger(form.cantidad);
  const precioUnitario = parseNonNegativeNumber(form.precioUnitario);
  const fechaConsumoHora = String(form.fechaConsumoHora ?? "").trim();

  if (!form.catalogoGuid) {
    errors.catalogoGuid = "Selecciona un ítem del catálogo.";
  }

  if (!String(form.descripcionCargo ?? "").trim()) {
    errors.descripcionCargo = "La descripción del cargo es obligatoria.";
  } else if (
    String(form.descripcionCargo).trim().length > MAX_LENGTHS.cargoEstadia.descripcion
  ) {
    errors.descripcionCargo = "La descripción no puede exceder 250 caracteres.";
  }

  if (cantidad === null || Number.isNaN(cantidad)) {
    errors.cantidad = "La cantidad debe ser mayor a cero.";
  }

  if (
    String(form.precioUnitario ?? "").trim() !== "" &&
    (precioUnitario === null || Number.isNaN(precioUnitario))
  ) {
    errors.precioUnitario = "El precio unitario no es válido.";
  } else if (precioUnitario !== null && !Number.isNaN(precioUnitario) && precioUnitario < 0) {
    errors.precioUnitario = "El precio unitario no puede ser negativo.";
  }

  if (form.fechaConsumo) {
    if (fechaConsumoHora && !TIME_24H_REGEX.test(fechaConsumoHora)) {
      errors.fechaConsumoHora = "Formato HH:MM.";
    }

    const fechaConsumo = parseFechaConsumoDateTime(form.fechaConsumo, fechaConsumoHora);
    if (!fechaConsumo) {
      errors.fechaConsumo = "La fecha de consumo no es válida.";
    } else {
      const ahora = new Date();
      const checkin = estadia?.checkinUtc ? new Date(estadia.checkinUtc) : null;
      const checkout = estadia?.checkoutUtc ? new Date(estadia.checkoutUtc) : null;

      if (fechaConsumo > ahora) {
        errors.fechaConsumo = "La fecha de consumo no puede estar en el futuro.";
      } else if (checkin && fechaConsumo < checkin) {
        errors.fechaConsumo = "La fecha de consumo no puede ser anterior al check-in.";
      } else if (checkout && fechaConsumo > checkout) {
        errors.fechaConsumo = "La fecha de consumo no puede ser posterior al checkout.";
      }
    }
  }

  return errors;
};

export const buildCargoEstadiaPayload = (form) => ({
  catalogoGuid: form.catalogoGuid,
  descripcionCargo: String(form.descripcionCargo ?? "").trim(),
  cantidad: Number(form.cantidad),
  precioUnitario: Number(form.precioUnitario || 0),
});

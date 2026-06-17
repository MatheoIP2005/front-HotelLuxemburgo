import { MAX_LENGTHS } from "./constraints";
import {
  parseNonNegativeNumber,
  parsePositiveInteger,
} from "./numeric";

export const validateCargoEstadiaForm = (form = {}) => {
  const errors = {};
  const cantidad = parsePositiveInteger(form.cantidad);
  const precioUnitario = parseNonNegativeNumber(form.precioUnitario);

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

  return errors;
};

export const buildCargoEstadiaPayload = (form) => ({
  catalogoGuid: form.catalogoGuid,
  descripcionCargo: String(form.descripcionCargo ?? "").trim(),
  cantidad: Number(form.cantidad),
  precioUnitario: Number(form.precioUnitario || 0),
});

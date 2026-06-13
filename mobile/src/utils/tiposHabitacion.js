import {
  parseNonNegativeInteger,
  parsePositiveInteger,
  parsePositiveNumber,
} from "./numeric";

const TIPO_LIMITS = {
  codigo: 30,
  nombre: 60,
  tipoCama: 60,
};

export const getTipoCapacidadTotal = (form) =>
  (Number(form.capacidadAdultos) || 0) + (Number(form.capacidadNinos) || 0);

export const validateTipoHabitacionForm = (form) => {
  const errors = {};
  const codigo = String(form.codigoTipoHabitacion ?? "").trim();
  const nombre = String(form.nombreTipoHabitacion ?? "").trim();
  const capacidadAdultos = parsePositiveInteger(form.capacidadAdultos);
  const capacidadNinos = parseNonNegativeInteger(form.capacidadNinos);
  const areaM2 = parsePositiveNumber(form.areaM2);
  const capacidadTotal = getTipoCapacidadTotal(form);

  if (!codigo) {
    errors.codigoTipoHabitacion = "El código es obligatorio.";
  } else if (codigo.length > TIPO_LIMITS.codigo) {
    errors.codigoTipoHabitacion = "El código no puede exceder 30 caracteres.";
  }

  if (!nombre) {
    errors.nombreTipoHabitacion = "El nombre es obligatorio.";
  } else if (nombre.length > TIPO_LIMITS.nombre) {
    errors.nombreTipoHabitacion = "El nombre no puede exceder 60 caracteres.";
  }

  if (String(form.capacidadAdultos ?? "").trim() === "") {
    errors.capacidadAdultos = "La capacidad de adultos es obligatoria.";
  } else if (capacidadAdultos === null || Number.isNaN(capacidadAdultos)) {
    errors.capacidadAdultos = "La capacidad de adultos debe ser un entero mayor a cero.";
  }

  if (String(form.capacidadNinos ?? "").trim() === "") {
    errors.capacidadNinos = "La capacidad de niños es obligatoria.";
  } else if (capacidadNinos === null || Number.isNaN(capacidadNinos)) {
    errors.capacidadNinos = "La capacidad de niños debe ser un entero mayor o igual a cero.";
  }

  if (!Number.isFinite(capacidadTotal) || capacidadTotal <= 0) {
    errors.capacidadTotal = "La capacidad total debe ser mayor a cero.";
  }

  if (String(form.tipoCama ?? "").trim().length > TIPO_LIMITS.tipoCama) {
    errors.tipoCama = "El tipo de cama no puede exceder 60 caracteres.";
  }

  if (String(form.areaM2 ?? "").trim() === "") {
    errors.areaM2 = "El área en m² es obligatoria.";
  } else if (areaM2 === null || Number.isNaN(areaM2)) {
    errors.areaM2 = "El área en m² debe ser mayor a cero.";
  }

  return errors;
};

export const buildTipoHabitacionPayload = (form, isEdit = false) => ({
  codigoTipoHabitacion: String(form.codigoTipoHabitacion ?? "").trim(),
  nombreTipoHabitacion: String(form.nombreTipoHabitacion ?? "").trim(),
  descripcion: String(form.descripcion ?? "").trim() || null,
  capacidadAdultos: Number(form.capacidadAdultos),
  capacidadNinos: Number(form.capacidadNinos),
  tipoCama: String(form.tipoCama ?? "").trim() || null,
  areaM2: Number(form.areaM2),
  permiteReservaPublica: form.permiteReservaPublica,
  ...(isEdit
    ? {
        estadoTipoHabitacion: form.estadoTipoHabitacion,
        rowVersion: form.rowVersion,
      }
    : {}),
});

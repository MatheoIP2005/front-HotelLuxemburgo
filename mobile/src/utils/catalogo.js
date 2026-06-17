import {
  CATALOGO_ESTADOS,
  CATALOGO_TIPOS,
  MAX_LENGTHS,
  TIME_24H_REGEX,
} from "./constraints";
import { parseNonNegativeNumber } from "./numeric";

const trim = (value) => String(value ?? "").trim();

export const formatCatalogoLabel = (item) => {
  if (!item) return "Sin ítem";
  const nombre = item.nombreCatalogo ?? item.nombre ?? "Sin nombre";
  const precio = Number(item.precioBase ?? 0).toFixed(2);
  return `${nombre} · $${precio}`;
};

export const validateCatalogoForm = (form = {}, isEdit = false) => {
  const errors = {};
  const codigoCatalogo = trim(form.codigoCatalogo);
  const nombreCatalogo = trim(form.nombreCatalogo);
  const categoriaCatalogo = trim(form.categoriaCatalogo);
  const descripcionCatalogo = trim(form.descripcionCatalogo);
  const iconoUrl = trim(form.iconoUrl);
  const precioBase = parseNonNegativeNumber(form.precioBase);

  if (!form.idSucursal || Number(form.idSucursal) <= 0) {
    errors.idSucursal = "Debes seleccionar una sucursal válida.";
  }

  if (!codigoCatalogo) {
    errors.codigoCatalogo = "El código es obligatorio.";
  } else if (codigoCatalogo.length > MAX_LENGTHS.catalogo.codigo) {
    errors.codigoCatalogo = "El código no puede exceder 10 caracteres.";
  }

  if (!nombreCatalogo) {
    errors.nombreCatalogo = "El nombre es obligatorio.";
  } else if (nombreCatalogo.length > MAX_LENGTHS.catalogo.nombre) {
    errors.nombreCatalogo = "El nombre no puede exceder 60 caracteres.";
  }

  if (!CATALOGO_TIPOS.includes(form.tipoCatalogo)) {
    errors.tipoCatalogo = "El tipo de catálogo no es válido.";
  }

  if (!categoriaCatalogo) {
    errors.categoriaCatalogo = "La categoría es obligatoria.";
  } else if (categoriaCatalogo.length > MAX_LENGTHS.catalogo.categoria) {
    errors.categoriaCatalogo = "La categoría no puede exceder 80 caracteres.";
  }

  if (form.precioBase === "" || precioBase === null || Number.isNaN(precioBase)) {
    errors.precioBase = "Ingresa un precio base válido.";
  } else if (precioBase < 0) {
    errors.precioBase = "El precio base no puede ser negativo.";
  } else if (form.tipoCatalogo === "AME" && precioBase !== 0) {
    errors.precioBase = "Las amenidades (AME) deben tener precio base igual a 0.";
  }

  if (descripcionCatalogo.length > MAX_LENGTHS.catalogo.descripcion) {
    errors.descripcionCatalogo = "La descripción no puede exceder 250 caracteres.";
  }

  if (iconoUrl.length > MAX_LENGTHS.catalogo.iconoUrl) {
    errors.iconoUrl = "La URL del ícono no puede exceder 500 caracteres.";
  }

  if (isEdit && !CATALOGO_ESTADOS.includes(form.estadoCatalogo)) {
    errors.estadoCatalogo = "El estado del catálogo no es válido.";
  }

  if (!form.disponible24h) {
    const hasInicio = Boolean(trim(form.horaInicio));
    const hasFin = Boolean(trim(form.horaFin));
    if (hasInicio !== hasFin) {
      errors.horaInicio = "Debes ingresar ambas horas o dejar ambas vacías.";
      errors.horaFin = "Debes ingresar ambas horas o dejar ambas vacías.";
    } else if (hasInicio && hasFin) {
      if (!TIME_24H_REGEX.test(form.horaInicio)) {
        errors.horaInicio = "Formato HH:MM.";
      }
      if (!TIME_24H_REGEX.test(form.horaFin)) {
        errors.horaFin = "Formato HH:MM.";
      } else if (
        TIME_24H_REGEX.test(form.horaInicio) &&
        form.horaFin <= form.horaInicio
      ) {
        errors.horaFin = "La hora fin debe ser posterior a la hora inicio.";
      }
    }
  }

  return errors;
};

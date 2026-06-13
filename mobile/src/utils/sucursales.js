import {
  EMAIL_REGEX,
  MAX_LENGTHS,
  SUCURSAL_CATEGORIA_VIAJE_OPTIONS,
  SUCURSAL_TIPO_ALOJAMIENTO_OPTIONS,
  TIME_24H_REGEX,
} from "./constraints";
import { parsePositiveInteger } from "./numeric";

const trim = (value) => String(value ?? "").trim();

export const validateSucursalForm = (form) => {
  const errors = {};
  const codigoSucursal = trim(form.codigoSucursal);
  const nombreSucursal = trim(form.nombreSucursal);
  const descripcionCorta = trim(form.descripcionCorta);
  const descripcionSucursal = trim(form.descripcionSucursal);
  const pais = trim(form.pais);
  const provincia = trim(form.provincia);
  const ciudad = trim(form.ciudad);
  const direccion = trim(form.direccion);
  const ubicacion = trim(form.ubicacion);
  const telefono = trim(form.telefono);
  const correo = trim(form.correo);

  if (!codigoSucursal) {
    errors.codigoSucursal = "El código es obligatorio.";
  } else if (codigoSucursal.length > MAX_LENGTHS.sucursal.codigo) {
    errors.codigoSucursal = "El código solo puede tener 10 caracteres.";
  }

  if (!nombreSucursal) {
    errors.nombreSucursal = "El nombre es obligatorio.";
  } else if (nombreSucursal.length > MAX_LENGTHS.sucursal.nombre) {
    errors.nombreSucursal = "El nombre no puede exceder 100 caracteres.";
  }

  if (!SUCURSAL_TIPO_ALOJAMIENTO_OPTIONS.includes(form.tipoAlojamiento)) {
    errors.tipoAlojamiento = "Seleccione una opción válida.";
  }

  if (form.estrellas) {
    const estrellas = Number(form.estrellas);
    if (estrellas < 1 || estrellas > 5) {
      errors.estrellas = "Seleccione entre 1 y 5 estrellas.";
    }
  }

  if (
    form.categoriaViaje &&
    !SUCURSAL_CATEGORIA_VIAJE_OPTIONS.includes(form.categoriaViaje)
  ) {
    errors.categoriaViaje = "Seleccione una opción válida.";
  }

  if (descripcionCorta.length > MAX_LENGTHS.sucursal.descripcionCorta) {
    errors.descripcionCorta = "La descripción corta no puede exceder 250 caracteres.";
  }

  if (descripcionSucursal.length > MAX_LENGTHS.sucursal.descripcion) {
    errors.descripcionSucursal = "La descripción no puede exceder 350 caracteres.";
  }

  if (!pais) {
    errors.pais = "El país es obligatorio.";
  } else if (pais.length > MAX_LENGTHS.sucursal.pais) {
    errors.pais = "El país no puede exceder 15 caracteres.";
  }

  if (provincia.length > MAX_LENGTHS.sucursal.provincia) {
    errors.provincia = "La provincia no puede exceder 30 caracteres.";
  }

  if (!ciudad) {
    errors.ciudad = "La ciudad es obligatoria.";
  } else if (ciudad.length > MAX_LENGTHS.sucursal.ciudad) {
    errors.ciudad = "La ciudad no puede exceder 25 caracteres.";
  }

  if (!direccion) {
    errors.direccion = "La dirección es obligatoria.";
  } else if (direccion.length > MAX_LENGTHS.sucursal.direccion) {
    errors.direccion = "La dirección no puede exceder 250 caracteres.";
  }

  if (!ubicacion) {
    errors.ubicacion = "La ubicación es obligatoria.";
  } else if (ubicacion.length > MAX_LENGTHS.sucursal.ubicacion) {
    errors.ubicacion = "La ubicación no puede exceder 200 caracteres.";
  }

  if (!telefono) {
    errors.telefono = "El teléfono es obligatorio.";
  } else if (!/^\d+$/.test(telefono)) {
    errors.telefono = "El teléfono solo puede contener números.";
  } else if (telefono.length !== MAX_LENGTHS.sucursal.telefono) {
    errors.telefono = "El teléfono solo puede tener 9 dígitos.";
  }

  if (!correo) {
    errors.correo = "El correo es obligatorio.";
  } else if (correo.length > MAX_LENGTHS.sucursal.correo) {
    errors.correo = "El correo no puede exceder 50 caracteres.";
  } else if (!EMAIL_REGEX.test(correo)) {
    errors.correo = "Ingrese un correo con formato válido.";
  }

  if (form.horaCheckin && !TIME_24H_REGEX.test(form.horaCheckin)) {
    errors.horaCheckin = "Formato HH:MM.";
  }

  if (form.horaCheckout && !TIME_24H_REGEX.test(form.horaCheckout)) {
    errors.horaCheckout = "Formato HH:MM.";
  }

  if (form.edadMinimaHuesped) {
    const edad = parsePositiveInteger(form.edadMinimaHuesped);
    if (edad === null || Number.isNaN(edad)) {
      errors.edadMinimaHuesped = "Debe ser un entero mayor a cero.";
    }
  }

  return errors;
};

import {
  CLIENT_KINDS,
  COMPANY_NAME_REGEX,
  EMAIL_REGEX,
  MAX_LENGTHS,
  PASSPORT_REGEX,
  PERSON_NAME_REGEX,
} from "../../../src/utils/constraints";
import { normalizeTipoIdentificacion } from "../../../src/shared/utils/constraints";

export const validateClienteForm = (form, isEdit = false) => {
  const errors = {};
  const numeroIdentificacion = String(form.numeroIdentificacion ?? "").trim();
  const nombres = String(form.nombres ?? "").trim();
  const apellidos = String(form.apellidos ?? "").trim();
  const razonSocial = String(form.razonSocial ?? "NAT").trim();
  const correo = String(form.correo ?? "").trim();
  const telefono = String(form.telefono ?? "").trim();
  const direccion = String(form.direccion ?? "").trim();
  const tipoIdentificacion = normalizeTipoIdentificacion(form.tipoIdentificacion);
  const tipoCliente = razonSocial || "NAT";
  const nombreRegex = tipoCliente === "EMP" ? COMPANY_NAME_REGEX : PERSON_NAME_REGEX;

  if (!numeroIdentificacion) {
    errors.numeroIdentificacion = "El número de identificación es obligatorio.";
  } else if (numeroIdentificacion.length > MAX_LENGTHS.cliente.numeroIdentificacion) {
    errors.numeroIdentificacion = "No puede exceder 30 caracteres.";
  } else if (tipoIdentificacion === "CED" && !/^\d{10}$/.test(numeroIdentificacion)) {
    errors.numeroIdentificacion = "La cédula debe tener 10 dígitos.";
  } else if (tipoIdentificacion === "RUC" && !/^\d{13}$/.test(numeroIdentificacion)) {
    errors.numeroIdentificacion = "El RUC debe tener 13 dígitos.";
  } else if (
    tipoIdentificacion === "PAS" &&
    !PASSPORT_REGEX.test(numeroIdentificacion.toUpperCase())
  ) {
    errors.numeroIdentificacion = "Pasaporte inválido.";
  }

  if (!CLIENT_KINDS.includes(tipoCliente)) {
    errors.razonSocial = "Tipo de cliente inválido.";
  }
  if (!nombres) {
    errors.nombres =
      tipoCliente === "EMP" ? "Razón social obligatoria." : "Nombres obligatorios.";
  } else if (nombres.length > MAX_LENGTHS.cliente.nombres) {
    errors.nombres = "No puede exceder 50 caracteres.";
  } else if (!nombreRegex.test(nombres)) {
    errors.nombres = "Formato de nombre inválido.";
  }

  if (tipoCliente === "NAT") {
    if (!apellidos) errors.apellidos = "Apellidos obligatorios.";
    else if (apellidos.length > MAX_LENGTHS.cliente.apellidos) {
      errors.apellidos = "No puede exceder 50 caracteres.";
    } else if (!PERSON_NAME_REGEX.test(apellidos)) {
      errors.apellidos = "Solo letras en apellidos.";
    }
  }

  if (!correo) errors.correo = "Correo obligatorio.";
  else if (correo.length > MAX_LENGTHS.cliente.correo) {
    errors.correo = "No puede exceder 100 caracteres.";
  } else if (!EMAIL_REGEX.test(correo)) {
    errors.correo = "Correo inválido.";
  }

  if (!telefono) errors.telefono = "Teléfono obligatorio.";
  else if (telefono.length !== MAX_LENGTHS.cliente.telefono) {
    errors.telefono = "Debe tener 10 dígitos.";
  } else if (!/^\d+$/.test(telefono)) {
    errors.telefono = "Solo números.";
  }

  if (!direccion) errors.direccion = "Dirección obligatoria.";
  else if (direccion.length > MAX_LENGTHS.cliente.direccion) {
    errors.direccion = "No puede exceder 200 caracteres.";
  }

  if (isEdit && !["ACT", "INA"].includes(form.estado)) {
    errors.estado = "Estado inválido.";
  }

  return errors;
};

export const getClienteDisplayName = (cliente) => {
  if (!cliente) return "-";
  const nombre = `${cliente.nombres ?? ""} ${cliente.apellidos ?? ""}`.trim();
  const id = cliente.numeroIdentificacion ?? "";
  if (nombre && id) return `${nombre} (${id})`;
  return nombre || id || "-";
};

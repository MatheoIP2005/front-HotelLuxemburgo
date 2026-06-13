import {
  CLIENT_KINDS,
  COMPANY_NAME_REGEX,
  EMAIL_REGEX,
  MAX_LENGTHS,
  PASSPORT_REGEX,
  PERSON_NAME_REGEX,
} from "../../../src/utils/constraints";
import { normalizeTipoIdentificacion } from "../../../src/shared/utils/constraints";
import {
  sanitizeIdentificationNumber,
  sanitizePhoneDigits,
  sanitizeCompanyNameInput,
  sanitizePersonNameInput,
} from "./text";

export const toClienteFormFromPublic = (form) => ({
  tipoIdentificacion: form.tipo_identificacion,
  numeroIdentificacion: form.numero_identificacion,
  nombres: form.nombres,
  apellidos: form.apellidos,
  razonSocial: "NAT",
  correo: form.correo,
  telefono: form.telefono,
  direccion: form.direccion,
});

const PUBLIC_FIELD_MAP = {
  tipoIdentificacion: "tipo_identificacion",
  numeroIdentificacion: "numero_identificacion",
  nombres: "nombres",
  apellidos: "apellidos",
  correo: "correo",
  telefono: "telefono",
  direccion: "direccion",
};

export const mapClienteErrorsToPublic = (errors) =>
  Object.fromEntries(
    Object.entries(errors)
      .map(([key, message]) => [PUBLIC_FIELD_MAP[key] ?? key, message])
      .filter(([, message]) => Boolean(message))
  );

export const resolveClienteFieldUpdate = (prev, key, value) => {
  if (key === "tipoIdentificacion") {
    return {
      ...prev,
      tipoIdentificacion: normalizeTipoIdentificacion(value),
      numeroIdentificacion: "",
    };
  }

  if (key === "razonSocial") {
    return {
      ...prev,
      razonSocial: value,
      apellidos: value === "EMP" ? "" : prev.apellidos,
    };
  }

  if (key === "telefono") {
    return {
      ...prev,
      telefono: sanitizePhoneDigits(value, MAX_LENGTHS.cliente.telefono),
    };
  }

  if (key === "numeroIdentificacion") {
    const sanitized = sanitizeIdentificationNumber(value, prev.tipoIdentificacion);
    if (sanitized === null) return prev;
    return { ...prev, numeroIdentificacion: sanitized };
  }

  if (key === "nombres") {
    const tipoCliente = prev.razonSocial || "NAT";
    const sanitized =
      tipoCliente === "EMP"
        ? sanitizeCompanyNameInput(value)
        : sanitizePersonNameInput(value);
    if (sanitized === null) return prev;
    return { ...prev, nombres: sanitized };
  }

  if (key === "apellidos") {
    const sanitized = sanitizePersonNameInput(value);
    if (sanitized === null) return prev;
    return { ...prev, apellidos: sanitized };
  }

  return { ...prev, [key]: value };
};

export const resolvePublicClienteFieldUpdate = (prev, key, value) => {
  const adminKey =
    key === "tipo_identificacion"
      ? "tipoIdentificacion"
      : key === "numero_identificacion"
        ? "numeroIdentificacion"
        : key;
  const adminPrev = toClienteFormFromPublic(prev);
  const next = resolveClienteFieldUpdate(adminPrev, adminKey, value);
  return {
    tipo_identificacion: next.tipoIdentificacion,
    numero_identificacion: next.numeroIdentificacion,
    nombres: next.nombres,
    apellidos: next.apellidos,
    correo: next.correo,
    telefono: next.telefono,
    direccion: next.direccion,
  };
};

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

import { normalizeTipoIdentificacion } from "../../../src/shared/utils/constraints";
import {
  COMPANY_NAME_REGEX,
  MAX_LENGTHS,
  ONLY_OPTIONAL_DIGITS_REGEX,
  PASSPORT_REGEX,
  PERSON_NAME_REGEX,
  TIME_24H_REGEX,
} from "./constraints";
import { sanitizeOptionalDigits } from "./numeric";

export const sanitizePhoneDigits = (value, maxLength) =>
  sanitizeOptionalDigits(value).slice(0, maxLength);

export const sanitizePassport = (value) => {
  const upper = String(value ?? "").toUpperCase();
  if (upper && !PASSPORT_REGEX.test(upper)) return null;
  return upper;
};

export const sanitizeIdentificationNumber = (value, tipoIdentificacion) => {
  const tipo = normalizeTipoIdentificacion(tipoIdentificacion);
  if (tipo === "PAS") {
    return sanitizePassport(value);
  }
  if (!ONLY_OPTIONAL_DIGITS_REGEX.test(String(value ?? ""))) return null;
  return value;
};

export const sanitizePersonNameInput = (value) => {
  if (!value) return "";
  if (!PERSON_NAME_REGEX.test(value)) return null;
  return value;
};

export const sanitizeCompanyNameInput = (value) => {
  if (!value) return "";
  if (!COMPANY_NAME_REGEX.test(value)) return null;
  return value;
};

export const sanitizeTimeInput = (value) => {
  const digits = String(value ?? "").replace(/\D/g, "").slice(0, 4);
  if (digits.length <= 2) return digits;
  return `${digits.slice(0, 2)}:${digits.slice(2)}`;
};

export const isValidTimeOrEmpty = (value) =>
  !String(value ?? "").trim() || TIME_24H_REGEX.test(String(value).trim());

export const validateMotivo = (motivo, maxLength, label = "El motivo") => {
  const trimmed = String(motivo ?? "").trim();
  if (!trimmed) return `${label} es obligatorio.`;
  if (trimmed.length > maxLength) {
    return `${label} no puede exceder ${maxLength} caracteres.`;
  }
  return "";
};

export const validateMotivoFactura = (motivo) =>
  validateMotivo(motivo, MAX_LENGTHS.factura.motivo, "El motivo de anulación");

export const validateMotivoInhabilitacion = (motivo) =>
  validateMotivo(motivo, MAX_LENGTHS.rol.motivo, "El motivo de inhabilitación");

export const validateMotivoCancelacion = (motivo) =>
  validateMotivo(
    motivo,
    MAX_LENGTHS.reserva.motivoCancelacion,
    "El motivo de cancelación"
  );

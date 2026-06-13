import {
  ONLY_DIGITS_REGEX,
  ONLY_OPTIONAL_DIGITS_REGEX,
} from "./constraints";

export const sanitizeOptionalDigits = (value) =>
  String(value ?? "").replace(/\D/g, "");

export const sanitizeDecimalInput = (value) => {
  let cleaned = String(value ?? "").replace(/[^\d.]/g, "");
  const dotIndex = cleaned.indexOf(".");
  if (dotIndex !== -1) {
    cleaned =
      cleaned.slice(0, dotIndex + 1) +
      cleaned.slice(dotIndex + 1).replace(/\./g, "");
  }
  return cleaned;
};

export const parseInteger = (value) => {
  const normalized = String(value ?? "").trim();
  if (normalized === "") return null;
  if (!ONLY_DIGITS_REGEX.test(normalized)) return NaN;
  const parsed = Number(normalized);
  return Number.isInteger(parsed) ? parsed : NaN;
};

export const parseNonNegativeInteger = (value) => {
  const normalized = String(value ?? "").trim();
  if (normalized === "") return null;
  if (!ONLY_OPTIONAL_DIGITS_REGEX.test(normalized)) return NaN;
  const parsed = Number(normalized);
  return Number.isInteger(parsed) ? parsed : NaN;
};

export const parsePositiveInteger = (value) => {
  const parsed = parseInteger(value);
  if (parsed === null) return null;
  if (Number.isNaN(parsed) || parsed <= 0) return NaN;
  return parsed;
};

export const parsePositiveNumber = (value) => {
  const normalized = String(value ?? "").trim();
  if (normalized === "") return null;
  const parsed = Number(normalized);
  if (!Number.isFinite(parsed) || parsed <= 0) return NaN;
  return parsed;
};

export const parseNonNegativeNumber = (value) => {
  const normalized = String(value ?? "").trim();
  if (normalized === "") return null;
  const parsed = Number(normalized);
  if (!Number.isFinite(parsed) || parsed < 0) return NaN;
  return parsed;
};

export const parseOptionalPositiveInteger = (value) => {
  const normalized = String(value ?? "").trim();
  if (normalized === "") return null;
  return parsePositiveInteger(normalized);
};

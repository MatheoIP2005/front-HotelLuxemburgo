export const CARD_NUMBER_REGEX = /^\d{16}$/;
export const CVV_REGEX = /^\d{3,4}$/;

export const sanitizeDigits = (value) => String(value || "").replace(/\D/g, "");

export const formatCardNumber = (value) =>
  sanitizeDigits(value)
    .slice(0, 16)
    .replace(/(\d{4})(?=\d)/g, "$1 ")
    .trim();

export const formatExpiryDate = (value) => {
  const normalized = sanitizeDigits(value).slice(0, 4);
  return normalized.length > 2
    ? `${normalized.slice(0, 2)}/${normalized.slice(2)}`
    : normalized;
};

export const randomToken = (prefix) =>
  `${prefix}-${Date.now()}-${Math.random().toString(36).slice(2, 8).toUpperCase()}`;

export const isExpiryValid = (value) => {
  const normalized = String(value || "").trim();
  const match = normalized.match(/^(\d{2})\/(\d{2})$/);
  if (!match) return false;

  const month = Number(match[1]);
  const year = Number(match[2]);
  if (month < 1 || month > 12) return false;

  const now = new Date();
  const currentYear = now.getFullYear() % 100;
  const currentMonth = now.getMonth() + 1;

  return year > currentYear || (year === currentYear && month >= currentMonth);
};

export const buildMaskedCard = (numeroTarjeta) =>
  `**** **** **** ${sanitizeDigits(numeroTarjeta).slice(-4)}`;

const IDENTIFICATION_TYPE_ALIASES = {
  CED: "CED",
  CEDULA: "CED",
  RUC: "RUC",
  PAS: "PAS",
  PASAPORTE: "PAS",
};

export const normalizeTipoIdentificacion = (value, fallback = "CED") => {
  const normalized = String(value ?? "")
    .trim()
    .toUpperCase();
  return IDENTIFICATION_TYPE_ALIASES[normalized] ?? fallback;
};

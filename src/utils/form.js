export const UUID_REGEX =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

export const isUuid = (value) => UUID_REGEX.test(String(value || "").trim());

export const normalizeGuid = (value) => String(value || "").trim();

export const requireUuid = (value, label) => {
  const guid = normalizeGuid(value);

  if (!guid) {
    throw new Error(`${label} es obligatorio.`);
  }

  if (!isUuid(guid)) {
    throw new Error(`${label} debe ser un UUID valido.`);
  }

  return guid;
};

export const optionalUuid = (value, label) => {
  const guid = normalizeGuid(value);

  if (!guid) {
    return null;
  }

  if (!isUuid(guid)) {
    throw new Error(`${label} debe ser un UUID valido.`);
  }

  return guid;
};

export const toDateOnly = (value) => {
  const normalized = String(value || "").trim();
  return normalized ? normalized.slice(0, 10) : null;
};

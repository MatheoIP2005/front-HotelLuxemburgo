const trim = (value) => String(value ?? "").trim();

const LOCAL_IMAGE_FILES = new Set([
  "HotelLuxemburgo.png",
  "LUX-BAN.jpeg",
  "LUX-BANT.jpg",
  "LUX-BANV.jpeg",
  "LUX-CAN.jpeg",
  "LUX-COT.jpeg",
  "LUX-CUE.jpeg",
  "LUX-CUEA.jpeg",
  "LUX-CUEH.jpeg",
  "LUX-CUEW.jpeg",
  "LUX-GYE.jpeg",
  "LUX-GYEA.jpeg",
  "LUX-IBR.jpeg",
  "LUX-MAN.jpeg",
  "LUX-MIT.jpeg",
  "LUX-MND.jpeg",
  "LUX-MNDW.jpeg",
  "LUX-NAP.jpeg",
  "LUX-PAP.jpeg",
  "LUX-PLA.jpg",
  "LUX-PUY.jpeg",
  "LUX-QUI.jpeg",
  "LUX-RIO.jpeg",
  "LUX-SAL.jpeg",
  "LUX-SAM.jpeg",
  "LUX-TEN.jpeg",
  "LUX-UIO.jpeg",
  "LUX-UIOH.jpeg",
  "LUX-UIOR.jpeg",
  "LUX-YAS.jpeg",
  "LUX-YUN.jpeg",
  "RadiadorSprings.jpeg",
  "TH-DOBLE.jpeg",
  "TH-FAMILIAR.jpeg",
  "TH-PREMIUM.jpeg",
  "TH-SINGLE.jpeg",
  "TH-TRIPLE.jpeg",
]);

const EXTENSIONS = ["jpeg", "jpg", "png"];

export const LOCAL_IMAGES_PATH_PREFIX = "/imagenes";

const normalizeSucursalCode = (codigo) => {
  const value = trim(codigo).toUpperCase();
  if (!value) return "";
  return value.startsWith("LUX-") ? value : `LUX-${value}`;
};

const normalizeTipoHabitacionCode = (codigo) => {
  const value = trim(codigo).toUpperCase();
  if (!value) return "";
  return value.startsWith("TH-") ? value : `TH-${value}`;
};

const extractLuxCodeFromText = (value) => {
  const match = trim(value).toUpperCase().match(/LUX-[A-Z0-9]+/);
  return match ? match[0] : "";
};

const CITY_TO_SUCURSAL_CODE = {
  GUAYAQUIL: "GYE",
  QUITO: "UIO",
  CUENCA: "CUE",
  MANTA: "MAN",
  PUYO: "PUY",
  BANOS: "BAN",
  "BAÑOS": "BAN",
  SALINAS: "SAL",
  RIOBAMBA: "RIO",
  AMBATO: "TEN",
};

const inferSucursalCodesFromText = (...parts) => {
  const text = parts
    .map((part) => trim(part))
    .filter(Boolean)
    .join(" ")
    .toUpperCase();

  if (!text) return [];

  const inferred = [];

  for (const [city, code] of Object.entries(CITY_TO_SUCURSAL_CODE)) {
    if (text.includes(city)) inferred.push(code);
  }

  for (const filename of LOCAL_IMAGE_FILES) {
    if (!filename.startsWith("LUX-")) continue;
    const baseName = filename.replace(/\.(jpeg|jpg|png)$/i, "");
    const shortCode = baseName.replace(/^LUX-/, "");
    if (text.includes(baseName) || text.includes(shortCode)) {
      inferred.push(shortCode);
    }
  }

  return inferred;
};

const collectSucursalCodeCandidates = (record = {}) => {
  const candidates = [];
  const add = (value) => {
    const normalized = trim(value);
    if (!normalized) return;
    candidates.push(normalized);
    const luxCode = extractLuxCodeFromText(normalized);
    if (luxCode) candidates.push(luxCode);
  };

  add(record.codigoSucursal);
  add(record.codigo_sucursal);
  add(record.codigo);
  add(record.slug);
  add(record.sucursal?.codigoSucursal);
  add(record.sucursal?.codigo_sucursal);
  add(record.sucursal?.codigo);
  add(record.sucursal?.slug);
  add(record.hotel?.codigoSucursal);
  add(record.hotel?.codigo);
  add(record.propiedad?.codigoSucursal);
  add(record.propiedad?.codigo);

  inferSucursalCodesFromText(
    record.nombre,
    record.nombreSucursal,
    record.ciudad,
    record.sucursal?.nombre,
    record.sucursal?.nombreSucursal,
    record.sucursal?.ciudad
  ).forEach(add);

  return [...new Set(candidates)];
};

const inferTipoHabitacionCodeFromName = (nombre) => {
  const value = trim(nombre).toUpperCase();
  if (!value) return "";

  for (const code of ["PREMIUM", "FAMILIAR", "TRIPLE", "DOBLE", "SINGLE"]) {
    if (value.includes(code)) return code;
  }

  return "";
};

const collectTipoHabitacionCodeCandidates = (record = {}) => {
  const candidates = [];
  const add = (value) => {
    const normalized = trim(value);
    if (normalized) candidates.push(normalized);
  };

  add(record.codigoTipoHabitacion);
  add(record.codigo_tipo_habitacion);
  add(record.codigoTipo);
  add(record.codigo);
  add(record.tipoHabitacion?.codigoTipoHabitacion);
  add(record.tipoHabitacion?.codigo_tipo_habitacion);
  add(record.tipoHabitacion?.codigo);
  add(inferTipoHabitacionCodeFromName(record.nombreTipoHabitacion));
  add(inferTipoHabitacionCodeFromName(record.nombre));

  return [...new Set(candidates)];
};

export const resolveLocalImageFilename = (baseName) => {
  const normalized = trim(baseName);
  if (!normalized) return "";

  for (const extension of EXTENSIONS) {
    const candidate = `${normalized}.${extension}`;
    if (LOCAL_IMAGE_FILES.has(candidate)) {
      return candidate;
    }
  }

  return `${normalized}.jpeg`;
};

export const buildLocalImagePath = (baseName) => {
  const filename = resolveLocalImageFilename(baseName);
  if (!filename) return "";
  return `${LOCAL_IMAGES_PATH_PREFIX}/${filename}`;
};

const resolveFirstLocalImagePath = (candidates, normalizeCode) => {
  for (const candidate of candidates) {
    const baseName = normalizeCode(candidate);
    if (!baseName) continue;

    const filename = resolveLocalImageFilename(baseName);
    if (LOCAL_IMAGE_FILES.has(filename)) {
      return buildLocalImagePath(baseName);
    }
  }

  const firstCandidate = candidates[0];
  if (!firstCandidate) return "";

  const fallbackBaseName = normalizeCode(firstCandidate);
  return fallbackBaseName ? buildLocalImagePath(fallbackBaseName) : "";
};

export const resolveLocalSucursalImagePath = (record = {}) =>
  resolveFirstLocalImagePath(
    collectSucursalCodeCandidates(record),
    normalizeSucursalCode
  );

export const resolveLocalTipoHabitacionImagePath = (record = {}) =>
  resolveFirstLocalImagePath(
    collectTipoHabitacionCodeCandidates(record),
    normalizeTipoHabitacionCode
  );

export const toAbsoluteLocalImageUrl = (path, baseUrl = "") => {
  const normalizedPath = trim(path);
  if (!normalizedPath) return "";
  if (/^https?:\/\//i.test(normalizedPath)) return normalizedPath;
  if (normalizedPath.startsWith("file:")) return normalizedPath;

  const base = trim(baseUrl).replace(/\/+$/, "");
  if (!base) return normalizedPath;

  return `${base}${normalizedPath.startsWith("/") ? "" : "/"}${normalizedPath}`;
};

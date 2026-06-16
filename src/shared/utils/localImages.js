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
export const LOCAL_SUCURSALES_PATH_PREFIX = `${LOCAL_IMAGES_PATH_PREFIX}/sucursales`;
export const LOCAL_HABITACIONES_PATH_PREFIX = `${LOCAL_IMAGES_PATH_PREFIX}/habitaciones`;

const TOKEN_TO_SUCURSAL_CODE = {
  YASUNI: "YAS",
  ORELLANA: "YAS",
  MINDO: "MND",
  COTOPAXI: "COT",
  LATACUNGA: "COT",
  MARISCAL: "UIOR",
  SAME: "SAM",
  QUITO: "UIO",
  GUAYAQUIL: "GYE",
  CUENCA: "CUE",
  MANTA: "MAN",
  PUYO: "PUY",
  BANOS: "BAN",
  BAÑOS: "BAN",
  SALINAS: "SAL",
  RIOBAMBA: "RIO",
  AMBATO: "TEN",
  IBARRA: "IBR",
  NAPO: "NAP",
  PAPALLACTA: "PAP",
};

const COMPOUND_SUCURSAL_RULES = [
  { all: ["MINDO", "WELLNESS"], code: "MNDW" },
  { all: ["MINDO", "CLOUD"], code: "MNDW" },
  { all: ["CUENCA", "HISTORICO"], code: "CUEH" },
  { all: ["CUENCA", "HISTORICA"], code: "CUEH" },
  { all: ["CUENCA", "CENTRO"], code: "CUEA" },
  { all: ["GUAYAQUIL", "AEROPUERTO"], code: "GYEA" },
  { all: ["QUITO", "HISTORICO"], code: "UIOH" },
  { all: ["QUITO", "HISTORICA"], code: "UIOH" },
];

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
  return match ? match[0].replace(/^LUX-/, "") : "";
};

const tokenizeText = (...parts) =>
  parts
    .map((part) => trim(part))
    .filter(Boolean)
    .join(" ")
    .toUpperCase()
    .split(/[^A-Z0-9ÁÉÍÓÚÑ]+/u)
    .map((token) => token.normalize("NFD").replace(/\p{M}/gu, ""))
    .filter(Boolean);

const inferSucursalCodesFromText = (...parts) => {
  const tokens = tokenizeText(...parts);
  if (tokens.length === 0) return [];

  const tokenSet = new Set(tokens);
  const inferred = [];

  for (const rule of COMPOUND_SUCURSAL_RULES) {
    if (rule.all.every((keyword) => tokenSet.has(keyword))) {
      inferred.push(rule.code);
    }
  }

  for (const token of tokens) {
    const mapped = TOKEN_TO_SUCURSAL_CODE[token];
    if (mapped) inferred.push(mapped);
  }

  return inferred;
};

const collectSucursalCodeCandidates = (record = {}) => {
  const explicitCandidates = [];
  const inferredCandidates = [];
  const addCandidate = (target, value) => {
    const normalized = trim(value);
    if (!normalized) return;
    target.push(normalized);
    const luxCode = extractLuxCodeFromText(normalized);
    if (luxCode) target.push(luxCode);
  };

  addCandidate(explicitCandidates, record.codigoSucursal);
  addCandidate(explicitCandidates, record.codigo_sucursal);
  addCandidate(explicitCandidates, record.codigo);
  addCandidate(explicitCandidates, record.slug);
  addCandidate(explicitCandidates, record.sucursal?.codigoSucursal);
  addCandidate(explicitCandidates, record.sucursal?.codigo_sucursal);
  addCandidate(explicitCandidates, record.sucursal?.codigo);
  addCandidate(explicitCandidates, record.sucursal?.slug);
  addCandidate(explicitCandidates, record.hotel?.codigoSucursal);
  addCandidate(explicitCandidates, record.hotel?.codigo);
  addCandidate(explicitCandidates, record.propiedad?.codigoSucursal);
  addCandidate(explicitCandidates, record.propiedad?.codigo);

  inferSucursalCodesFromText(
    record.nombre,
    record.nombreSucursal,
    record.ciudad,
    record.sucursal?.nombre,
    record.sucursal?.nombreSucursal,
    record.sucursal?.ciudad
  ).forEach((value) => addCandidate(inferredCandidates, value));

  return [...new Set([...inferredCandidates, ...explicitCandidates])];
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

  return "";
};

export const buildLocalImagePath = (baseName, folder = "") => {
  const filename = resolveLocalImageFilename(baseName);
  if (!filename) return "";
  const normalizedFolder = trim(folder).replace(/^\/+|\/+$/g, "");
  if (!normalizedFolder) return `${LOCAL_IMAGES_PATH_PREFIX}/${filename}`;
  return `${LOCAL_IMAGES_PATH_PREFIX}/${normalizedFolder}/${filename}`;
};

const resolveFirstLocalImagePath = (candidates, normalizeCode, folder) => {
  for (const candidate of candidates) {
    const baseName = normalizeCode(candidate);
    if (!baseName) continue;

    const path = buildLocalImagePath(baseName, folder);
    if (path) return path;
  }

  return "";
};

export const resolveLocalSucursalImagePath = (record = {}) =>
  resolveFirstLocalImagePath(
    collectSucursalCodeCandidates(record),
    normalizeSucursalCode,
    "sucursales"
  );

export const resolveLocalTipoHabitacionImagePath = (record = {}) =>
  resolveFirstLocalImagePath(
    collectTipoHabitacionCodeCandidates(record),
    normalizeTipoHabitacionCode,
    "habitaciones"
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

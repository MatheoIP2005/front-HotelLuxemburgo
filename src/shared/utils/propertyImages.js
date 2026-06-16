import {
  resolveLocalSucursalImagePath,
  resolveLocalTipoHabitacionImagePath,
  toAbsoluteLocalImageUrl,
} from "./localImages";

const getImageUrlFromRecord = (record, directKeys = []) => {
  for (const key of directKeys) {
    const candidate = record?.[key];
    if (typeof candidate === "string" && candidate.trim()) {
      return candidate.trim();
    }
  }

  return "";
};

const getFirstStringImage = (items) =>
  Array.isArray(items)
    ? items.find((item) => typeof item === "string" && item.trim())?.trim() || ""
    : "";

const getImageUrlFromCollection = (collection) => {
  if (!Array.isArray(collection) || collection.length === 0) return "";

  const directStringImage = getFirstStringImage(collection);
  if (directStringImage) return directStringImage;

  const principal =
    collection.find((item) => item?.esPrincipal || item?.es_principal || item?.principal) ??
    collection[0];

  return getImageUrlFromRecord(principal, [
    "urlImagen",
    "url_imagen",
    "imagenUrl",
    "imagen_url",
    "secureUrl",
    "url",
  ]);
};

const SUCURSAL_NESTED_KEYS = ["sucursal", "hotel", "propiedad", "accommodation", "data"];

const SUCURSAL_DIRECT_IMAGE_KEYS = [
  "sucursalImagenPrincipalUrl",
  "imagenSucursalPrincipalUrl",
  "imagenSucursalUrl",
  "urlImagenSucursal",
  "portadaSucursalUrl",
  "coverSucursalUrl",
];

const SUCURSAL_COLLECTION_KEYS = [
  "sucursalImagenes",
  "imagenesSucursal",
  "imagenesPropiedad",
  "propiedadImagenes",
  "galeriaSucursal",
  "fotosSucursal",
];

const getSucursalImageFromNestedObject = (source, nestedKeys = []) => {
  for (const key of nestedKeys) {
    const nested = source?.[key];
    if (!nested || typeof nested !== "object") continue;

    const direct = getImageUrlFromRecord(nested, SUCURSAL_DIRECT_IMAGE_KEYS);
    if (direct) return direct;

    const nestedCollection = SUCURSAL_COLLECTION_KEYS.map((collectionKey) =>
      getImageUrlFromCollection(nested?.[collectionKey])
    ).find(Boolean);

    if (nestedCollection) return nestedCollection;
  }

  return "";
};

const resolveApiPropertyImageUrl = (propiedad) => {
  const hydrated = getImageUrlFromRecord(propiedad, ["imagenSucursalResuelta"]);
  if (hydrated) return hydrated;

  const direct = getImageUrlFromRecord(propiedad, SUCURSAL_DIRECT_IMAGE_KEYS);
  if (direct) return direct;

  const nestedDirect = getSucursalImageFromNestedObject(propiedad, SUCURSAL_NESTED_KEYS);
  if (nestedDirect) return nestedDirect;

  const collection = SUCURSAL_COLLECTION_KEYS.map((key) =>
    getImageUrlFromCollection(propiedad?.[key])
  ).find(Boolean);

  return collection || "";
};

const ROOM_DIRECT_IMAGE_KEYS = [
  "tipoHabitacionImagenPrincipalUrl",
  "tipoHabitacionImagenUrl",
  "habitacionImagenPrincipalUrl",
  "habitacionImagenUrl",
  "portadaHabitacionUrl",
  "coverHabitacionUrl",
  "fotoHabitacionUrl",
  "fotoTipoHabitacionUrl",
  "imagenPrincipalUrl",
  "imagenTipoHabitacionUrl",
  "imagenHabitacionUrl",
  "urlImagen",
  "imagenUrl",
];

const ROOM_NESTED_KEYS = [
  "tipoHabitacion",
  "habitacion",
  "roomType",
  "room",
  "tipo",
  "detalle",
  "data",
];

const ROOM_COLLECTION_KEYS = [
  "tipoHabitacionImagenes",
  "imagenesTipoHabitacion",
  "habitacionImagenes",
  "imagenesHabitacion",
  "imagenes",
  "galeria",
  "fotos",
];

const getImageUrlFromNestedObject = (source, nestedKeys = [], directKeys = []) => {
  for (const key of nestedKeys) {
    const nested = source?.[key];
    if (!nested || typeof nested !== "object") continue;

    const direct = getImageUrlFromRecord(nested, directKeys);
    if (direct) return direct;

    const nestedCollection = ROOM_COLLECTION_KEYS.map((collectionKey) =>
      getImageUrlFromCollection(nested?.[collectionKey])
    ).find(Boolean);

    if (nestedCollection) return nestedCollection;
  }

  return "";
};

const resolveApiRoomImageUrl = (room, propiedad) => {
  const direct = getImageUrlFromRecord(room, ROOM_DIRECT_IMAGE_KEYS);
  if (direct) return direct;

  const nestedDirect = getImageUrlFromNestedObject(room, ROOM_NESTED_KEYS, ROOM_DIRECT_IMAGE_KEYS);
  if (nestedDirect) return nestedDirect;

  const nested = ROOM_COLLECTION_KEYS.map((key) => getImageUrlFromCollection(room?.[key])).find(
    Boolean
  );
  if (nested) return nested;

  const matchingTipo = Array.isArray(propiedad?.tiposHabitacion)
    ? propiedad.tiposHabitacion.find(
        (tipo) =>
          String(tipo?.tipoHabitacionGuid ?? "") === String(room?.tipoHabitacionGuid ?? "")
      )
    : null;

  if (matchingTipo && matchingTipo !== room) {
    const matchingTipoImage = resolveApiRoomImageUrl(matchingTipo, null);
    if (matchingTipoImage) return matchingTipoImage;
  }

  const propertyRoomImages = [
    propiedad?.tipoHabitacionImagenes,
    propiedad?.imagenesTipoHabitacion,
    propiedad?.habitacionImagenes,
    propiedad?.imagenesHabitacion,
  ]
    .flatMap((items) => (Array.isArray(items) ? items : []))
    .filter((item) => {
      const tipoGuid = item?.tipoHabitacionGuid ?? item?.tipo_habitacion_guid;
      const habitacionGuid = item?.habitacionGuid ?? item?.habitacion_guid;
      return (
        (tipoGuid && String(tipoGuid) === String(room?.tipoHabitacionGuid ?? "")) ||
        (habitacionGuid && String(habitacionGuid) === String(room?.habitacionGuid ?? ""))
      );
    });

  return getImageUrlFromCollection(propertyRoomImages);
};

export const resolvePropertyImageUrl = (propiedad, { imagesBaseUrl = "" } = {}) => {
  const localPath = resolveLocalSucursalImagePath(propiedad);
  if (localPath) {
    return toAbsoluteLocalImageUrl(localPath, imagesBaseUrl);
  }

  return resolveApiPropertyImageUrl(propiedad);
};

export const resolveRoomImageUrl = (room, propiedad, { imagesBaseUrl = "" } = {}) => {
  const localPath = resolveLocalTipoHabitacionImagePath(room);
  if (localPath) {
    return toAbsoluteLocalImageUrl(localPath, imagesBaseUrl);
  }

  return resolveApiRoomImageUrl(room, propiedad);
};

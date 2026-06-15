export const getOptionalChildrenCount = (value) =>
  value === "" || value === null || value === undefined ? 0 : Number(value);

export const trimText = (value) => String(value ?? "").trim();

export const getTodayIsoDate = () => {
  const now = new Date();
  const offset = now.getTimezoneOffset();
  return new Date(now.getTime() - offset * 60000).toISOString().slice(0, 10);
};

export const addDaysToIsoDate = (isoDate, amount) => {
  if (!isoDate) return "";
  const [year, month, day] = isoDate.split("-").map(Number);
  const nextDate = new Date(year, month - 1, day);
  nextDate.setDate(nextDate.getDate() + amount);
  const nextYear = nextDate.getFullYear();
  const nextMonth = String(nextDate.getMonth() + 1).padStart(2, "0");
  const nextDay = String(nextDate.getDate()).padStart(2, "0");
  return `${nextYear}-${nextMonth}-${nextDay}`;
};

export const formatMoney = (value) => {
  const amount = Number(value ?? 0);
  return `$${amount.toFixed(2)}`;
};

export const formatLocation = (propiedad) =>
  [propiedad?.ciudad, propiedad?.pais].filter(Boolean).join(", ");

export const getImageUrlFromRecord = (record, directKeys = []) => {
  for (const key of directKeys) {
    const candidate = record?.[key];
    if (typeof candidate === "string" && candidate.trim()) {
      return candidate.trim();
    }
  }

  return "";
};

export const getImageUrl = getImageUrlFromRecord;

export const getFirstStringImage = (items) =>
  Array.isArray(items)
    ? items.find((item) => typeof item === "string" && item.trim())?.trim() || ""
    : "";

export const getImageUrlFromCollection = (collection) => {
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

export const getImageUrlFromNestedObject = (source, nestedKeys = [], directKeys = []) => {
  for (const key of nestedKeys) {
    const nested = source?.[key];
    if (!nested || typeof nested !== "object") continue;

    const direct = getImageUrlFromRecord(nested, directKeys);
    if (direct) return direct;

    const nestedCollection = [
      nested?.tipoHabitacionImagenes,
      nested?.imagenesTipoHabitacion,
      nested?.habitacionImagenes,
      nested?.imagenesHabitacion,
      nested?.imagenes,
      nested?.galeria,
      nested?.fotos,
      nested?.sucursalImagenes,
      nested?.imagenesSucursal,
      nested?.imagenesPropiedad,
      nested?.propiedadImagenes,
    ]
      .map((items) => getImageUrlFromCollection(items))
      .find(Boolean);

    if (nestedCollection) return nestedCollection;
  }

  return "";
};

export const resolvePropertyImageUrl = (propiedad) => {
  const hydrated = getImageUrlFromRecord(propiedad, ["imagenSucursalResuelta"]);
  if (hydrated) return hydrated;

  const direct = getImageUrlFromRecord(propiedad, [
    "sucursalImagenPrincipalUrl",
    "imagenSucursalPrincipalUrl",
    "imagenSucursalUrl",
    "urlImagenSucursal",
    "portadaSucursalUrl",
    "coverSucursalUrl",
  ]);
  if (direct) return direct;

  const nestedDirect = getImageUrlFromNestedObject(
    propiedad,
    ["sucursal", "hotel", "propiedad", "accommodation", "data"],
    [
      "sucursalImagenPrincipalUrl",
      "imagenSucursalPrincipalUrl",
      "imagenSucursalUrl",
      "urlImagenSucursal",
      "portadaSucursalUrl",
      "coverSucursalUrl",
      "imagenPrincipalUrl",
      "imagenUrl",
      "urlImagen",
    ]
  );
  if (nestedDirect) return nestedDirect;

  const collection = [
    propiedad?.sucursalImagenes,
    propiedad?.imagenesSucursal,
    propiedad?.imagenesPropiedad,
    propiedad?.propiedadImagenes,
    propiedad?.galeriaSucursal,
    propiedad?.fotosSucursal,
  ]
    .map((items) => getImageUrlFromCollection(items))
    .find(Boolean);
  if (collection) return collection;

  return getImageUrlFromRecord(propiedad, ["imagenPrincipalUrl"]);
};

export const resolveRoomImageUrl = (room, propiedad) => {
  const direct = getImageUrlFromRecord(room, [
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
  ]);
  if (direct) return direct;

  const nestedDirect = getImageUrlFromNestedObject(
    room,
    ["tipoHabitacion", "habitacion", "roomType", "room", "tipo", "detalle", "data"],
    [
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
      "imagenUrl",
      "urlImagen",
    ]
  );
  if (nestedDirect) return nestedDirect;

  const nested = [
    room?.tipoHabitacionImagenes,
    room?.imagenesTipoHabitacion,
    room?.habitacionImagenes,
    room?.imagenesHabitacion,
    room?.imagenes,
    room?.galeria,
    room?.fotos,
  ]
    .map((items) => getImageUrlFromCollection(items))
    .find(Boolean);
  if (nested) return nested;

  const matchingTipo = Array.isArray(propiedad?.tiposHabitacion)
    ? propiedad.tiposHabitacion.find(
        (tipo) =>
          String(tipo?.tipoHabitacionGuid ?? "") === String(room?.tipoHabitacionGuid ?? "")
      )
    : null;

  if (matchingTipo && matchingTipo !== room) {
    const matchingTipoImage = resolveRoomImageUrl(matchingTipo, null);
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

  const matchedImage = getImageUrlFromCollection(propertyRoomImages);
  if (matchedImage) return matchedImage;

  return "";
};

export const normalizeRoomOptions = (propiedad) => {
  const tiposHabitacion = Array.isArray(propiedad?.tiposHabitacion)
    ? propiedad.tiposHabitacion
    : [];
  const tarifasActivas = Array.isArray(propiedad?.tarifasActivas)
    ? propiedad.tarifasActivas
    : [];

  if (tiposHabitacion.length > 0) {
    return tiposHabitacion.map((tipo) => {
      const tarifaRelacionada =
        tarifasActivas.find(
          (tarifa) => tarifa.tipoHabitacionGuid === tipo.tipoHabitacionGuid
        ) ??
        tarifasActivas[0] ??
        null;

      return {
        id: tipo.tipoHabitacionGuid ?? tarifaRelacionada?.tarifaGuid,
        nombre: tipo.nombreTipoHabitacion ?? tipo.nombre ?? "Tipo de habitacion",
        descripcion: tipo.descripcion ?? "",
        tipoCama: tipo.tipoCama ?? "N/A",
        capacidad:
          tipo.capacidadTotal ?? tipo.capacidadHabitacion ?? tipo.capacidad ?? "N/A",
        precioPorNoche:
          tarifaRelacionada?.precioPorNoche ??
          tipo.precioDesde ??
          tipo.precioBase ??
          propiedad?.precioDesde ??
          0,
        disponiblesEnRango: Number(tipo.disponiblesEnRango ?? tipo.disponibles ?? 0),
        tipoHabitacionGuid: tipo.tipoHabitacionGuid ?? null,
        habitacionGuid: tipo.habitacionGuid ?? null,
        tarifaGuid: tarifaRelacionada?.tarifaGuid ?? tipo.tarifaGuid ?? null,
        imagenUrl:
          getFirstStringImage(tipo.imagenes) || resolveRoomImageUrl(tipo, propiedad),
      };
    });
  }

  if (Array.isArray(propiedad?.habitacionesDisponibles)) {
    return propiedad.habitacionesDisponibles.map((habitacion) => ({
      id: habitacion.habitacionGuid ?? habitacion.tipoHabitacionGuid,
      nombre: habitacion.nombre ?? habitacion.numeroHabitacion ?? "Habitación disponible",
      descripcion: habitacion.descripcionHabitacion ?? "",
      tipoCama: habitacion.tipoCama ?? "N/A",
      capacidad:
        habitacion.capacidadHabitacion ??
        habitacion.capacidadTotal ??
        habitacion.capacidad ??
        "N/A",
      precioPorNoche:
        habitacion.precioPorNoche ??
        habitacion.precioDesde ??
        habitacion.precioBase ??
        propiedad?.precioDesde ??
        0,
      disponiblesEnRango: Number(habitacion.disponiblesEnRango ?? habitacion.disponibles ?? 1),
      tipoHabitacionGuid: habitacion.tipoHabitacionGuid ?? null,
      habitacionGuid: habitacion.habitacionGuid ?? null,
      tarifaGuid: habitacion.tarifaGuid ?? tarifasActivas[0]?.tarifaGuid ?? null,
      imagenUrl:
        getFirstStringImage(habitacion.imagenes) || resolveRoomImageUrl(habitacion, propiedad),
    }));
  }

  return [];
};

export const getHabitacionesDisponiblesCount = (propiedad, roomOptions = []) => {
  if (roomOptions.length > 0) {
    return roomOptions.filter((room) => Number(room.disponiblesEnRango ?? 1) > 0).length;
  }

  if (typeof propiedad?.habitacionesDisponibles === "number") {
    return propiedad.habitacionesDisponibles;
  }

  return 0;
};

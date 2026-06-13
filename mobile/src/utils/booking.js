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

export const getImageUrl = (record, directKeys = []) => {
  for (const key of directKeys) {
    const candidate = record?.[key];
    if (typeof candidate === "string" && candidate.trim()) {
      return candidate.trim();
    }
  }

  return "";
};

export const resolvePropertyImageUrl = (propiedad) =>
  getImageUrl(propiedad, [
    "imagenPrincipalUrl",
    "sucursalImagenPrincipalUrl",
    "imagenSucursalPrincipalUrl",
    "imagenSucursalUrl",
    "urlImagenSucursal",
    "portadaSucursalUrl",
    "coverSucursalUrl",
  ]);

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
          tarifaRelacionada?.precioPorNoche ?? tipo.precioDesde ?? propiedad?.precioDesde ?? 0,
        tipoHabitacionGuid: tipo.tipoHabitacionGuid ?? null,
        habitacionGuid: tipo.habitacionGuid ?? null,
        tarifaGuid: tarifaRelacionada?.tarifaGuid ?? tipo.tarifaGuid ?? null,
        imagenUrl: getImageUrl(tipo, ["imagenPrincipalUrl", "imagenUrl", "urlImagen"]),
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
        habitacion.precioPorNoche ?? habitacion.precioDesde ?? propiedad?.precioDesde ?? 0,
      tipoHabitacionGuid: habitacion.tipoHabitacionGuid ?? null,
      habitacionGuid: habitacion.habitacionGuid ?? null,
      tarifaGuid: habitacion.tarifaGuid ?? tarifasActivas[0]?.tarifaGuid ?? null,
      imagenUrl: getImageUrl(habitacion, ["imagenPrincipalUrl", "imagenUrl", "urlImagen"]),
    }));
  }

  return [];
};

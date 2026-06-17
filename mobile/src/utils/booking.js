import {
  resolvePropertyImageUrl as resolveSharedPropertyImageUrl,
  resolveRoomImageUrl as resolveSharedRoomImageUrl,
} from "../../../src/shared/utils/propertyImages";
import { getImagesBaseUrl } from "../config/images";
import { filterSafeList } from "./adminCollection";

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

export const getFirstStringImage = (items) =>
  Array.isArray(items)
    ? items.find((item) => typeof item === "string" && item.trim())?.trim() || ""
    : "";

export const resolvePropertyImageUrl = (propiedad) =>
  resolveSharedPropertyImageUrl(propiedad, { imagesBaseUrl: getImagesBaseUrl() });

export const isRoomAvailableForBooking = (room, habitacionesSolicitadas = 1) => {
  if (!room?.tipoHabitacionGuid) return false;
  return Number(room.disponiblesEnRango ?? 0) >= Number(habitacionesSolicitadas || 1);
};

export const buildRoomForBooking = ({
  selectedRoom,
  roomOptionsDisponibles,
  propiedad,
  habitacionesSolicitadas = 1,
}) => {
  if (isRoomAvailableForBooking(selectedRoom, habitacionesSolicitadas)) {
    return selectedRoom;
  }

  if (selectedRoom) {
    return null;
  }

  const firstAvailable = roomOptionsDisponibles.find((room) =>
    isRoomAvailableForBooking(room, habitacionesSolicitadas)
  );

  if (!firstAvailable) return null;

  return {
    id: null,
    nombre: "Habitación por asignar",
    precioPorNoche: firstAvailable.precioPorNoche ?? propiedad?.precioDesde ?? 0,
    disponiblesEnRango: firstAvailable.disponiblesEnRango,
    tipoHabitacionGuid: firstAvailable.tipoHabitacionGuid,
    habitacionGuid: firstAvailable.habitacionGuid ?? null,
    tarifaGuid: firstAvailable.tarifaGuid ?? null,
  };
};

export const resolveRoomImageUrl = (room, propiedad) =>
  resolveSharedRoomImageUrl(room, propiedad, { imagesBaseUrl: getImagesBaseUrl() });

export const normalizeRoomOptions = (propiedad) => {
  const tiposHabitacion = filterSafeList(
    Array.isArray(propiedad?.tiposHabitacion) ? propiedad.tiposHabitacion : []
  );
  const tarifasActivas = filterSafeList(
    Array.isArray(propiedad?.tarifasActivas) ? propiedad.tarifasActivas : []
  );

  if (tiposHabitacion.length > 0) {
    return tiposHabitacion.filter(Boolean).map((tipo) => {
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
    return propiedad.habitacionesDisponibles.filter(Boolean).map((habitacion) => ({
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

export const getHabitacionesDisponiblesCount = (
  propiedad,
  roomOptions = [],
  habitacionesSolicitadas = 1
) => {
  if (roomOptions.length > 0) {
    return roomOptions.filter((room) =>
      isRoomAvailableForBooking(room, habitacionesSolicitadas)
    ).length;
  }

  if (typeof propiedad?.habitacionesDisponibles === "number") {
    return propiedad.habitacionesDisponibles;
  }

  return 0;
};

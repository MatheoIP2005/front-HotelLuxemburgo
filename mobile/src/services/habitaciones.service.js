import internalApi from "../api/internalApi";
import publicApi from "../api/publicApi";
import { extractApiList, extractApiPayload } from "../../../src/shared/utils/api";

const toNullableNumber = (value) =>
  value === null || value === undefined || value === "" ? null : Number(value);

const resolveCapacidadHabitacion = (data = {}) => {
  const explicit = Number(data.capacidadHabitacion);
  if (Number.isFinite(explicit) && explicit > 0) {
    return explicit;
  }

  const total = Number(data.capacidadTotal);
  if (Number.isFinite(total) && total > 0) {
    return total;
  }

  const adultos = Number(data.capacidadAdultos) || 0;
  const ninos = Number(data.capacidadNinos) || 0;
  const sum = adultos + ninos;
  return sum > 0 ? sum : 0;
};

const toCreateHabitacionPayload = (data = {}) => ({
  sucursalGuid: data.sucursalGuid ?? "",
  tipoHabitacionGuid: data.tipoHabitacionGuid ?? "",
  numeroHabitacion: data.numeroHabitacion ?? "",
  piso: toNullableNumber(data.piso),
  capacidadHabitacion: resolveCapacidadHabitacion(data),
  precioBase: Number(data.precioBase) || 0,
  descripcionHabitacion: data.descripcionHabitacion ?? null,
});

const toUpdateHabitacionPayload = (data = {}) => ({
  numeroHabitacion: data.numeroHabitacion ?? "",
  piso: toNullableNumber(data.piso),
  capacidadHabitacion: resolveCapacidadHabitacion(data),
  precioBase: Number(data.precioBase) || 0,
  descripcionHabitacion: data.descripcionHabitacion ?? null,
  estadoHabitacion: data.estadoHabitacion ?? "DIS",
});

export const getHabitaciones = async (params) => {
  const response = await internalApi.get("/habitaciones", { params });
  return extractApiPayload(response);
};

const normalizeHabitacionDisponible = (item = {}) => ({
  habitacionGuid: item.habitacionGuid ?? item.HabitacionGuid ?? "",
  tipoHabitacionGuid: item.tipoHabitacionGuid ?? item.TipoHabitacionGuid ?? "",
  tipoNombre: item.tipoNombre ?? item.TipoNombre ?? "",
  numeroHabitacion: item.numeroHabitacion ?? item.NumeroHabitacion ?? "",
  piso: item.piso ?? item.Piso ?? null,
  precioBase: Number(item.precioBase ?? item.PrecioBase ?? 0),
  estadoHabitacion: item.estadoHabitacion ?? item.EstadoHabitacion ?? "DIS",
  disponibleEnRango:
    item.disponibleEnRango ?? item.DisponibleEnRango ?? true,
  capacidadAdultos: Number(item.capacidadAdultos ?? item.CapacidadAdultos ?? 0),
  capacidadNinos: Number(item.capacidadNinos ?? item.CapacidadNinos ?? 0),
});

export const getHabitacionesDisponiblesPorSucursal = async ({
  sucursalGuid,
  fechaInicio,
  fechaFin,
  tipoHabitacionGuid,
} = {}) => {
  const params = {
    fechaInicio,
    fechaFin,
  };

  if (tipoHabitacionGuid) {
    params.tipo_habitacion_guid = tipoHabitacionGuid;
  }

  const response = await publicApi.get(
    `/public/sucursales/${sucursalGuid}/habitaciones`,
    { params }
  );

  return extractApiList(response)
    .map(normalizeHabitacionDisponible)
    .filter(
      (habitacion) =>
        habitacion.habitacionGuid &&
        habitacion.disponibleEnRango &&
        habitacion.estadoHabitacion === "DIS"
    );
};

export const getHabitacion = async (id) => {
  const response = await internalApi.get(`/habitaciones/${id}`);
  return extractApiPayload(response);
};

export const createHabitacion = async (data) => {
  const response = await internalApi.post(
    "/habitaciones",
    toCreateHabitacionPayload(data)
  );
  return extractApiPayload(response);
};

export const updateHabitacion = async (id, data) => {
  const response = await internalApi.put(
    `/habitaciones/${id}`,
    toUpdateHabitacionPayload(data)
  );
  return extractApiPayload(response);
};

export const deleteHabitacion = async (id) => {
  const response = await internalApi.delete(`/habitaciones/${id}`);
  return extractApiPayload(response);
};

export const cambiarEstadoHabitacion = async (id, estado, rowVersion = null) => {
  const response = await internalApi.patch(`/habitaciones/${id}/estado`, {
    nuevoEstado: estado,
    rowVersion,
  });
  return extractApiPayload(response);
};

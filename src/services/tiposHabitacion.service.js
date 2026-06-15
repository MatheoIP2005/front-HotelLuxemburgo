import internalApi from "../api/internalApi";
import { extractApiPayload } from "../utils/api";

const toNumber = (value, fallback = 0) =>
  value === null || value === undefined || value === "" ? fallback : Number(value);

const toNullableNumber = (value) =>
  value === null || value === undefined || value === "" ? null : Number(value);

const toCreateTipoHabitacionPayload = (data = {}) => {
  const capacidadAdultos = toNumber(data.capacidadAdultos ?? data.capacidad_adultos, 0);
  const capacidadNinos = toNumber(data.capacidadNinos ?? data.capacidad_ninos, 0);
  const capacidadTotal = toNumber(
    data.capacidadTotal ?? data.capacidad_total,
    capacidadAdultos + capacidadNinos
  );

  return {
    codigoTipoHabitacion: data.codigoTipoHabitacion ?? data.codigo_tipo_habitacion ?? "",
    nombreTipoHabitacion: data.nombreTipoHabitacion ?? data.nombre_tipo_habitacion ?? "",
    descripcion: data.descripcion ?? null,
    capacidadAdultos,
    capacidadNinos,
    capacidadTotal,
    tipoCama: data.tipoCama ?? data.tipo_cama ?? null,
    areaM2: toNullableNumber(data.areaM2 ?? data.area_m2),
    permiteReservaPublica: Boolean(
      data.permiteReservaPublica ?? data.permite_reserva_publica ?? true
    ),
  };
};

const toUpdateTipoHabitacionPayload = (data = {}) => ({
  ...toCreateTipoHabitacionPayload(data),
  estadoTipoHabitacion:
    data.estadoTipoHabitacion ?? data.estado_tipo_habitacion ?? "ACT",
  rowVersion: data.rowVersion ?? null,
});

export const getTiposHabitacion = async (params) => {
  const response = await internalApi.get("/tipos-habitacion", { params });
  return extractApiPayload(response);
};

export const getTipoHabitacion = async (id) => {
  const response = await internalApi.get(`/tipos-habitacion/${id}`);
  return extractApiPayload(response);
};

export const createTipoHabitacion = async (data) => {
  const response = await internalApi.post(
    "/tipos-habitacion",
    toCreateTipoHabitacionPayload(data)
  );
  return extractApiPayload(response);
};

export const updateTipoHabitacion = async (id, data) => {
  const response = await internalApi.put(
    `/tipos-habitacion/${id}`,
    toUpdateTipoHabitacionPayload(data)
  );
  return extractApiPayload(response);
};

export const deleteTipoHabitacion = async (id) => {
  const response = await internalApi.delete(`/tipos-habitacion/${id}`);
  return extractApiPayload(response);
};

export const inhabilitarTipoHabitacion = async (id) => {
  const response = await internalApi.patch(`/tipos-habitacion/${id}/inhabilitar`);
  return extractApiPayload(response);
};

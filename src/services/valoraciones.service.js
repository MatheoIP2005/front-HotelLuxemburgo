import internalApi from "../api/internalApi";
import { extractApiPayload } from "../utils/api";
import {
  VALORACION_ESTADOS,
  VALORACION_MODERATION_STATES,
  VALORACION_TIPO_VIAJE_OPTIONS,
} from "../utils/constraints";

const toNullableScore = (value) => {
  if (value === null || value === undefined || value === "") return null;
  const parsed = Number(value);
  if (!Number.isFinite(parsed)) return null;
  if (parsed < 0 || parsed > 10) {
    throw new Error("Las puntuaciones deben estar entre 0 y 10.");
  }
  return parsed;
};

const toValoracionPayload = (data = {}) => ({
  idEstadia: data.idEstadia ?? null,
  puntuacionGeneral: toNullableScore(data.puntuacionGeneral),
  puntuacionLimpieza: toNullableScore(data.puntuacionLimpieza),
  puntuacionConfort: toNullableScore(data.puntuacionConfort),
  puntuacionUbicacion: toNullableScore(data.puntuacionUbicacion),
  puntuacionInstalaciones: toNullableScore(data.puntuacionInstalaciones),
  puntuacionPersonal: toNullableScore(data.puntuacionPersonal),
  puntuacionCalidadPrecio: toNullableScore(data.puntuacionCalidadPrecio),
  comentarioPositivo: data.comentarioPositivo ?? null,
  comentarioNegativo: data.comentarioNegativo ?? null,
  tipoViaje: VALORACION_TIPO_VIAJE_OPTIONS.includes(data.tipoViaje) ? data.tipoViaje : null,
  creadoPorUsuario: data.creadoPorUsuario ?? null,
});

export const getValoraciones = async (params) => {
  const response = await internalApi.get("/valoraciones", { params });
  return extractApiPayload(response);
};

export const getValoracion = async (id) => {
  const response = await internalApi.get(`/valoraciones/${id}`);
  return extractApiPayload(response);
};

export const createValoracion = async (data) => {
  const response = await internalApi.post("/valoraciones", toValoracionPayload(data));
  return extractApiPayload(response);
};

export const moderarValoracion = async (id, data) => {
  const estadoValoracion = String(
    data?.estadoValoracion ?? data?.nuevoEstado ?? data?.estado ?? ""
  )
    .trim()
    .toUpperCase();

  if (!VALORACION_MODERATION_STATES.includes(estadoValoracion)) {
    throw new Error(
      `Estado de valoración no válido. Usa: ${VALORACION_MODERATION_STATES.join(", ")}.`
    );
  }

  const payload = {
    estadoValoracion,
    modificadoPorUsuario: data?.modificadoPorUsuario ?? null,
    rowVersion: data?.rowVersion ?? null,
  };
  const response = await internalApi.patch(`/valoraciones/${id}/moderar`, payload);
  return extractApiPayload(response);
};

export const responderValoracion = async (id, data) => {
  const payload = {
    respuestaHotel: data?.respuestaHotel ?? data?.respuesta ?? "",
    modificadoPorUsuario: data?.modificadoPorUsuario ?? null,
    rowVersion: data?.rowVersion ?? null,
  };
  const response = await internalApi.patch(`/valoraciones/${id}/responder`, payload);
  return extractApiPayload(response);
};

export { VALORACION_ESTADOS };

export const deleteValoracion = async (id) => {
  const response = await internalApi.delete(`/valoraciones/${id}`);
  return extractApiPayload(response);
};

import publicApi from "../api/publicApi";
import { extractApiPayload } from "../utils/api";

const toAccommodationParams = (params = {}) => ({
  destino: params.destino ?? undefined,
  fechaInicio:
    params.fechaInicio ??
    params.fecha_inicio ??
    params.fechaEntrada ??
    params.fecha_entrada ??
    undefined,
  fechaFin:
    params.fechaFin ??
    params.fecha_salida ??
    params.fechaSalida ??
    params.fecha_fin ??
    undefined,
  numAdultos: params.numAdultos ?? params.num_adultos ?? undefined,
  numHabitaciones: params.numHabitaciones ?? params.num_habitaciones ?? undefined,
});

export const searchAccommodations = async (params) => {
  const response = await publicApi.get("/accommodations/search", {
    params: toAccommodationParams(params),
  });
  return extractApiPayload(response);
};

export const getAccommodation = async (id, params) => {
  const response = await publicApi.get(`/accommodations/${id}`, {
    params: toAccommodationParams(params),
  });
  return extractApiPayload(response);
};

export const getCategories = async (params) => {
  const response = await publicApi.get("/accommodations/categories", { params });
  return extractApiPayload(response);
};

export const getReviews = async (id, params) => {
  const response = await publicApi.get(`/accommodations/${id}/reviews`, { params });
  return extractApiPayload(response);
};

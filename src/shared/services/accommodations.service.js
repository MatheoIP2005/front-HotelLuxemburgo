import { extractApiPayload } from "../utils/api";

const toOptionalParam = (value) => {
  if (value === null || value === undefined) return undefined;
  if (typeof value === "string") {
    const trimmed = value.trim();
    return trimmed === "" ? undefined : trimmed;
  }
  return value;
};

const toAccommodationParams = (params = {}) => ({
  destino: toOptionalParam(params.destino),
  fechaInicio: toOptionalParam(
    params.fechaInicio ??
      params.fecha_inicio ??
      params.fechaEntrada ??
      params.fecha_entrada
  ),
  fechaFin: toOptionalParam(
    params.fechaFin ??
      params.fecha_salida ??
      params.fechaSalida ??
      params.fecha_fin
  ),
  num_adultos: toOptionalParam(params.numAdultos ?? params.num_adultos),
  num_ninos: toOptionalParam(params.numNinos ?? params.num_ninos),
  num_habitaciones: toOptionalParam(params.numHabitaciones ?? params.num_habitaciones),
});

export const createAccommodationsService = (publicApi) => ({
  searchAccommodations: async (params) => {
    const response = await publicApi.get("/accommodations/search", {
      params: toAccommodationParams(params),
    });
    return extractApiPayload(response);
  },

  getAccommodation: async (id, params) => {
    const response = await publicApi.get(`/accommodations/${id}`, {
      params: toAccommodationParams(params),
    });
    return extractApiPayload(response);
  },

  getCategories: async (params) => {
    const response = await publicApi.get("/accommodations/categories", { params });
    return extractApiPayload(response);
  },

  getReviews: async (id, params) => {
    const response = await publicApi.get(`/accommodations/${id}/reviews`, { params });
    return extractApiPayload(response);
  },
});

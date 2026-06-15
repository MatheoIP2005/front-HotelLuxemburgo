import { extractApiPayload } from "../utils/api";

const inFlightPublicGetRequests = new Map();

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

const toStableParams = (params = {}) =>
  Object.keys(params)
    .sort()
    .reduce((stableParams, key) => {
      if (params[key] !== undefined) {
        stableParams[key] = params[key];
      }
      return stableParams;
    }, {});

const buildPublicGetRequestKey = (publicApi, path, params) =>
  JSON.stringify({
    baseURL: publicApi?.defaults?.baseURL ?? "",
    path,
    params: toStableParams(params),
  });

const dedupePublicGet = (publicApi, path, config = {}) => {
  const key = buildPublicGetRequestKey(publicApi, path, config.params);
  const inFlightRequest = inFlightPublicGetRequests.get(key);

  if (inFlightRequest) {
    return inFlightRequest;
  }

  const request = publicApi.get(path, config).finally(() => {
    inFlightPublicGetRequests.delete(key);
  });

  inFlightPublicGetRequests.set(key, request);
  return request;
};

export const createAccommodationsService = (publicApi) => ({
  searchAccommodations: async (params) => {
    const response = await dedupePublicGet(publicApi, "/accommodations/search", {
      params: toAccommodationParams(params),
      retryOnRateLimit: false,
    });
    return extractApiPayload(response);
  },

  getAccommodation: async (id, params) => {
    const response = await dedupePublicGet(publicApi, `/accommodations/${id}`, {
      params: toAccommodationParams(params),
      retryOnRateLimit: false,
    });
    return extractApiPayload(response);
  },

  getCategories: async (params) => {
    const response = await dedupePublicGet(publicApi, "/accommodations/categories", {
      params,
      retryOnRateLimit: false,
    });
    return extractApiPayload(response);
  },

  getReviews: async (id, params) => {
    const response = await dedupePublicGet(publicApi, `/accommodations/${id}/reviews`, {
      params,
      retryOnRateLimit: false,
    });
    return extractApiPayload(response);
  },
});

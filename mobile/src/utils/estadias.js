import { normalizeCollectionPayload } from "../../../src/shared/utils/api";
import { filterSafeList, withSafeItems } from "./adminCollection";

export const getEstadiaId = (estadia) =>
  estadia?.estadiaGuid ?? estadia?.guidEstadia ?? null;

export const formatEstadiaDateTime = (value) => {
  if (!value) return "Pendiente";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return String(value).slice(0, 16);
  return date.toLocaleString("es-EC", {
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
  });
};

export const normalizeEstadiasList = (response, params = {}) =>
  withSafeItems(
    normalizeCollectionPayload(response, {
      pagina: Number(params?.pagina) || 1,
      limite: Number(params?.limite) || 50,
    })
  );

export const canCheckoutEstadia = (estado) => String(estado || "").toUpperCase() === "ACT";

export const normalizeCargosList = (response) => {
  if (Array.isArray(response)) return filterSafeList(response);
  if (Array.isArray(response?.items)) return filterSafeList(response.items);
  return [];
};

import internalApi from "../api/internalApi";
import { extractApiPayload } from "../../../src/shared/utils/api";

const toNumber = (value, fallback = 0) => {
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : fallback;
};

const toNullableNumber = (value) =>
  value === null || value === undefined || value === "" ? null : Number(value);

const toDateOnly = (value) => {
  const normalized = String(value || "").trim();
  return normalized ? normalized.slice(0, 10) : null;
};

const toCreateTarifaPayload = (data = {}) => ({
  codigoTarifa: data.codigoTarifa ?? "",
  idSucursal: toNumber(data.idSucursal, 0),
  idTipoHabitacion: toNumber(data.idTipoHabitacion, 0),
  nombreTarifa: data.nombreTarifa ?? "",
  canalTarifa: data.canalTarifa ?? "TODOS",
  fechaInicio: toDateOnly(data.fechaInicio),
  fechaFin: toDateOnly(data.fechaFin),
  precioPorNoche: toNumber(data.precioPorNoche, 0),
  porcentajeIva: toNumber(data.porcentajeIva, 0),
  minNoches: toNumber(data.minNoches, 1),
  maxNoches: toNullableNumber(data.maxNoches),
  permitePortalPublico: Boolean(data.permitePortalPublico ?? true),
  prioridad: toNumber(data.prioridad, 1),
});

const toUpdateTarifaPayload = (data = {}) => ({
  ...toCreateTarifaPayload(data),
  estadoTarifa: data.estadoTarifa ?? "ACT",
  rowVersion: data.rowVersion ?? null,
});

export const getTarifas = async (params) => {
  const response = await internalApi.get("/tarifas", { params });
  return extractApiPayload(response);
};

export const getTarifa = async (id) => {
  const response = await internalApi.get(`/tarifas/${id}`);
  return extractApiPayload(response);
};

export const createTarifa = async (data) => {
  const response = await internalApi.post("/tarifas", toCreateTarifaPayload(data));
  return extractApiPayload(response);
};

export const updateTarifa = async (id, data) => {
  const response = await internalApi.put(`/tarifas/${id}`, toUpdateTarifaPayload(data));
  return extractApiPayload(response);
};

export const deleteTarifa = async (id) => {
  const response = await internalApi.delete(`/tarifas/${id}`);
  return extractApiPayload(response);
};

export const desactivarTarifa = async (id) => {
  const response = await internalApi.patch(`/tarifas/${id}/desactivar`);
  return extractApiPayload(response);
};

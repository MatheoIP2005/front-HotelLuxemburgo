import internalApi from "../api/internalApi";
import { extractApiPayload } from "../../../src/shared/utils/api";

const toNumber = (value, fallback = 0) => {
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : fallback;
};

const toBaseCatalogoPayload = (data = {}) => ({
  idSucursal: data.idSucursal ?? null,
  codigoCatalogo: data.codigoCatalogo ?? "",
  nombreCatalogo: data.nombreCatalogo ?? "",
  tipoCatalogo: data.tipoCatalogo ?? "AME",
  categoriaCatalogo: data.categoriaCatalogo ?? "",
  descripcionCatalogo: data.descripcionCatalogo ?? null,
  precioBase: toNumber(data.precioBase, 0),
  aplicaIva: Boolean(data.aplicaIva),
  disponible24h: Boolean(data.disponible24h),
  horaInicio: data.horaInicio ?? null,
  horaFin: data.horaFin ?? null,
  iconoUrl: data.iconoUrl ?? null,
});

const toCreateCatalogoPayload = (data = {}) => ({
  ...toBaseCatalogoPayload(data),
  creadoPorUsuario: data.creadoPorUsuario ?? null,
});

const toUpdateCatalogoPayload = (data = {}) => ({
  ...toBaseCatalogoPayload(data),
  estadoCatalogo: data.estadoCatalogo ?? "ACT",
  modificadoPorUsuario: data.modificadoPorUsuario ?? null,
  rowVersion: data.rowVersion ?? null,
});

export const getCatalogo = async (params) => {
  const response = await internalApi.get("/catalogo-servicios", { params });
  return extractApiPayload(response);
};

export const getCatalogoItem = async (id) => {
  const response = await internalApi.get(`/catalogo-servicios/${id}`);
  return extractApiPayload(response);
};

export const createCatalogoItem = async (data) => {
  const response = await internalApi.post(
    "/catalogo-servicios",
    toCreateCatalogoPayload(data)
  );
  return extractApiPayload(response);
};

export const updateCatalogoItem = async (id, data) => {
  const response = await internalApi.put(
    `/catalogo-servicios/${id}`,
    toUpdateCatalogoPayload(data)
  );
  return extractApiPayload(response);
};

export const deleteCatalogoItem = async (id) => {
  const response = await internalApi.delete(`/catalogo-servicios/${id}`);
  return extractApiPayload(response);
};

export const desactivarCatalogoItem = async (id) => {
  const response = await internalApi.patch(`/catalogo-servicios/${id}/desactivar`);
  return extractApiPayload(response);
};

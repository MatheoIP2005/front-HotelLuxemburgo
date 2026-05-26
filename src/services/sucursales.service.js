import internalApi from "../api/internalApi";
import { extractApiPayload } from "../utils/api";

const toNullableNumber = (value) =>
  value === null || value === undefined || value === "" ? null : Number(value);

const toSucursalPayload = (data = {}) => ({
  codigoSucursal: data.codigoSucursal ?? data.codigo_sucursal ?? "",
  nombreSucursal: data.nombreSucursal ?? data.nombre_sucursal ?? "",
  descripcionSucursal: data.descripcionSucursal ?? data.descripcion_sucursal ?? null,
  descripcionCorta: data.descripcionCorta ?? data.descripcion_corta ?? null,
  tipoAlojamiento: data.tipoAlojamiento ?? data.tipo_alojamiento ?? "hotel",
  estrellas: toNullableNumber(data.estrellas),
  categoriaViaje: data.categoriaViaje ?? data.categoria_viaje ?? null,
  pais: data.pais ?? "",
  provincia: data.provincia ?? null,
  ciudad: data.ciudad ?? "",
  ubicacion: data.ubicacion ?? "",
  direccion: data.direccion ?? "",
  codigoPostal: data.codigoPostal ?? data.codigo_postal ?? null,
  telefono: data.telefono ?? "",
  correo: data.correo ?? "",
  latitud: toNullableNumber(data.latitud),
  longitud: toNullableNumber(data.longitud),
  horaCheckin: data.horaCheckin ?? data.hora_checkin ?? null,
  horaCheckout: data.horaCheckout ?? data.hora_checkout ?? null,
  checkinAnticipado: Boolean(data.checkinAnticipado ?? data.checkin_anticipado),
  checkoutTardio: Boolean(data.checkoutTardio ?? data.checkout_tardio),
  aceptaNinos: Boolean(data.aceptaNinos ?? data.acepta_ninos ?? true),
  edadMinimaHuesped: toNullableNumber(
    data.edadMinimaHuesped ?? data.edad_minima_huesped
  ),
  permiteMascotas: Boolean(data.permiteMascotas ?? data.permite_mascotas),
  sePermiteFumar: Boolean(data.sePermiteFumar ?? data.se_permite_fumar),
  estadoSucursal: data.estadoSucursal ?? data.estado_sucursal ?? "ACT",
});

export const getSucursales = async (params) => {
  const response = await internalApi.get("/sucursales", { params });
  return extractApiPayload(response);
};

export const getSucursal = async (id) => {
  const response = await internalApi.get(`/sucursales/${id}`);
  return extractApiPayload(response);
};

export const createSucursal = async (data) => {
  const response = await internalApi.post("/sucursales", toSucursalPayload(data));
  return extractApiPayload(response);
};

export const updateSucursal = async (id, data) => {
  const response = await internalApi.put(`/sucursales/${id}`, toSucursalPayload(data));
  return extractApiPayload(response);
};

export const deleteSucursal = async (id) => {
  const response = await internalApi.delete(`/sucursales/${id}`);
  return extractApiPayload(response);
};

export const inhabilitarSucursal = async (guid) => {
  const response = await internalApi.patch(`/sucursales/${guid}/inhabilitar`);
  return extractApiPayload(response);
};

export const updatePoliticas = async (guid, data) => {
  const response = await internalApi.patch(`/sucursales/${guid}/politicas`, data);
  return extractApiPayload(response);
};

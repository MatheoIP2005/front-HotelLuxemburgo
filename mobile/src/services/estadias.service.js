import internalApi from "../api/internalApi";
import { extractApiPayload } from "../../../src/shared/utils/api";

const toEstadiaViewModel = (item) => {
  if (!item) return null;

  return {
    ...item,
    estadiaGuid: item.estadiaGuid ?? null,
    reservaGuid: item.reservaGuid ?? null,
    reservaHabitacionGuid: item.reservaHabitacionGuid ?? null,
    clienteGuid: item.clienteGuid ?? null,
    sucursalGuid: item.sucursalGuid ?? null,
    habitacionGuid: item.habitacionGuid ?? null,
    idHabitacion: item.idHabitacion ?? item.habitacionGuid ?? null,
    estadoEstadia: item.estadoEstadia ?? item.estado ?? null,
    checkinUtc: item.checkinUtc ?? item.fechaCheckinUtc ?? null,
    checkoutUtc: item.checkoutUtc ?? item.fechaCheckoutUtc ?? null,
    requiereMantenimiento: Boolean(item.requiereMantenimiento),
  };
};

const mapEstadiaItems = (items) =>
  (Array.isArray(items) ? items : []).filter(Boolean).map(toEstadiaViewModel).filter(Boolean);

const toEstadiaCollection = (payload) => {
  if (Array.isArray(payload)) {
    return mapEstadiaItems(payload);
  }

  if (payload && Array.isArray(payload.items)) {
    return {
      ...payload,
      items: mapEstadiaItems(payload.items),
    };
  }

  return payload;
};

const toCargoPayload = (data = {}) => {
  const cantidad = Number(data.cantidad ?? 1);
  const precioUnitario = Number(data.precioUnitario ?? 0);
  const subtotal = cantidad * precioUnitario;
  const valorIva =
    data.valorIva !== undefined && data.valorIva !== null
      ? Number(data.valorIva)
      : Number((subtotal * 0.15).toFixed(2));

  return {
    catalogoGuid: data.catalogoGuid ?? null,
    descripcionCargo: data.descripcionCargo ?? "",
    cantidad,
    precioUnitario,
    valorIva,
    creadoPorUsuario: data.creadoPorUsuario ?? null,
  };
};

export const getEstadias = async (params) => {
  const response = await internalApi.get("/estadias", { params });
  return toEstadiaCollection(extractApiPayload(response));
};

export const getEstadia = async (id) => {
  const response = await internalApi.get(`/estadias/${id}`);
  return toEstadiaViewModel(extractApiPayload(response));
};

export const hacerCheckin = async (idReserva, data) => {
  const response = await internalApi.post(`/estadias/checkin/${idReserva}`, data);
  return toEstadiaViewModel(extractApiPayload(response));
};

export const hacerCheckout = async (id, data) => {
  const payload = {
    requiereMantenimiento: Boolean(data?.requiereMantenimiento),
    observacionesCheckout:
      data?.observacionesCheckout ?? data?.observaciones ?? null,
  };
  const response = await internalApi.patch(`/estadias/${id}/checkout`, payload);
  return toEstadiaViewModel(extractApiPayload(response));
};

export const getCargosEstadia = async (id) => {
  const response = await internalApi.get(`/estadias/${id}/cargos`);
  return extractApiPayload(response);
};

export const addCargoEstadia = async (id, data) => {
  const response = await internalApi.post(`/estadias/${id}/cargos`, toCargoPayload(data));
  return extractApiPayload(response);
};

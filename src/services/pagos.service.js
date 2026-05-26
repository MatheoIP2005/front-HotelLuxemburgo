import internalApi from "../api/internalApi";
import { extractApiPayload } from "../utils/api";
import { PAGO_METODOS } from "../utils/constraints";

const toNumber = (value, fallback = 0) => {
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : fallback;
};

const toPagoPayload = (data = {}) => {
  const facturaGuid = String(data.facturaGuid ?? "").trim();
  const monto = toNumber(data.monto, 0);
  const metodoPago = String(data.metodoPago ?? "EFECTIVO")
    .trim()
    .toUpperCase();

  if (!facturaGuid) {
    throw new Error("La factura es obligatoria para registrar el pago.");
  }
  if (monto <= 0) {
    throw new Error("El monto del pago debe ser mayor a cero.");
  }
  if (!PAGO_METODOS.includes(metodoPago)) {
    throw new Error(`Método de pago inválido. Usa: ${PAGO_METODOS.join(", ")}.`);
  }

  return {
    facturaGuid,
    monto,
    metodoPago,
    creadoPorUsuario: data.creadoPorUsuario ?? null,
  };
};

export const getPagos = async (params) => {
  const response = await internalApi.get("/pagos", {
    params,
  });
  return extractApiPayload(response);
};

export const getPago = async (id) => {
  const response = await internalApi.get(`/pagos/${id}`);
  return extractApiPayload(response);
};

export const createPago = async (data) => {
  const response = await internalApi.post("/pagos", toPagoPayload(data));
  return extractApiPayload(response);
};

export const aprobarPago = async (id) => {
  const response = await internalApi.put(`/pagos/${id}/aprobar`);
  return extractApiPayload(response);
};

export const updateEstadoPago = async (id, estado) => {
  const response = await internalApi.patch(`/pagos/${id}/estado`, {
    nuevoEstado: estado,
  });
  return extractApiPayload(response);
};

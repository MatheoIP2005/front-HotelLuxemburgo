import internalApi from "../api/internalApi";
import { extractApiPayload } from "../utils/api";
import { createPago, aprobarPago, getPago } from "./pagos.service";
import { FACTURA_ITEM_TYPES, FACTURA_REFERENCIA_TYPES, PAGO_METODOS } from "../utils/constraints";

const ALLOWED_FACTURA_ITEM_TYPES = new Set(FACTURA_ITEM_TYPES);
const ALLOWED_REFERENCIA_TYPES = new Set(FACTURA_REFERENCIA_TYPES);

const toNumber = (value, fallback = 0) => {
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : fallback;
};

const toFacturaItemPayload = (item = {}, index = 0) => {
  const descripcion = String(item.descripcion ?? "").trim();
  const cantidad = toNumber(item.cantidad, 1);
  const precioUnitario = toNumber(item.precioUnitario, 0);
  const subtotal = toNumber(item.subtotal, 0);
  const valorIva = toNumber(item.valorIva, 0);
  const descuento = toNumber(item.descuento, 0);
  const total = toNumber(item.total, 0);
  const tipoItem = String(item.tipoItem ?? "").trim().toUpperCase();
  const referenciaTipo = item.referenciaTipo
    ? String(item.referenciaTipo).trim().toUpperCase()
    : null;

  if (!descripcion) {
    throw new Error(`La descripción del item ${index + 1} es obligatoria.`);
  }
  if (descripcion.length > 250) {
    throw new Error(`La descripción del item ${index + 1} no puede exceder 250 caracteres.`);
  }
  if (!ALLOWED_FACTURA_ITEM_TYPES.has(tipoItem)) {
    throw new Error(`El tipo de item ${index + 1} no es válido.`);
  }
  if (referenciaTipo && !ALLOWED_REFERENCIA_TYPES.has(referenciaTipo)) {
    throw new Error(`La referencia del item ${index + 1} no es válida.`);
  }
  if (cantidad <= 0) {
    throw new Error(`La cantidad del item ${index + 1} debe ser mayor a cero.`);
  }
  if (precioUnitario < 0 || subtotal < 0 || valorIva < 0 || descuento < 0 || total < 0) {
    throw new Error(`Los valores monetarios del item ${index + 1} no pueden ser negativos.`);
  }

  return {
    descripcion,
    cantidad,
    precioUnitario,
    subtotal,
    valorIva,
    descuento,
    total,
    tipoItem,
    referenciaTipo,
    referenciaGuid: item.referenciaGuid ?? null,
  };
};

const toFacturaGeneracionPayload = (data = {}) => ({
  clienteGuid: data.clienteGuid ?? "",
  sucursalGuid: data.sucursalGuid ?? "",
  items: Array.isArray(data.items)
    ? data.items.map((item, index) => toFacturaItemPayload(item, index))
    : [],
});

export const getFacturas = async (params) => {
  const response = await internalApi.get("/facturas", { params });
  return extractApiPayload(response);
};

export const getFactura = async (id) => {
  const response = await internalApi.get(`/facturas/${id}`);
  return extractApiPayload(response);
};

export const getFacturasByReserva = async (reservaGuid) => {
  const response = await internalApi.get(`/facturas/reserva/${reservaGuid}`);
  return extractApiPayload(response);
};

export const getFacturaDetalle = async (facturaGuid) => {
  const response = await internalApi.get(`/facturas/${facturaGuid}/detalle`);
  return extractApiPayload(response);
};

export const getFacturaPagos = async (facturaGuid) => {
  const response = await internalApi.get(`/facturas/${facturaGuid}/pagos`);
  return extractApiPayload(response);
};

export const generarFacturaReserva = async (reservaGuid, body) => {
  const response = await internalApi.post(
    `/facturas/generar-reserva/${reservaGuid}`,
    toFacturaGeneracionPayload(body)
  );
  return extractApiPayload(response);
};

export const generarFacturaFinal = async (reservaGuid, body) => {
  const response = await internalApi.post(
    `/facturas/generar-final/${reservaGuid}`,
    toFacturaGeneracionPayload(body)
  );
  return extractApiPayload(response);
};

export const generarFacturaFinalYPagoSimulado = async (
  reservaGuid,
  body,
  metodoPago = "EFECTIVO"
) => {
  if (!PAGO_METODOS.includes(metodoPago)) {
    throw new Error(`Método de pago inválido. Usa: ${PAGO_METODOS.join(", ")}.`);
  }

  const factura = await generarFacturaFinal(reservaGuid, body);
  const facturaGuid =
    factura?.factura?.facturaGuid ?? factura?.facturaGuid ?? factura?.guidFactura ?? null;
  const saldoPendiente = Number(
    factura?.factura?.saldoPendiente ?? factura?.saldoPendiente ?? factura?.total ?? 0
  );

  if (!facturaGuid) {
    throw new Error("No se pudo resolver la factura generada para registrar el pago.");
  }

  if (saldoPendiente <= 0) {
    return {
      factura: await getFactura(facturaGuid),
      pago: null,
      aprobacion: null,
      metodoPago,
    };
  }

  const pagoCreado = await createPago({
    facturaGuid,
    monto: saldoPendiente,
    metodoPago,
  });
  const pagoGuid = pagoCreado?.pagoGuid ?? pagoCreado?.guidPago ?? null;

  if (!pagoGuid) {
    throw new Error("No se pudo resolver el pago recién creado para aprobarlo.");
  }

  await aprobarPago(pagoGuid);

  return {
    factura: await getFactura(facturaGuid),
    pago: await getPago(pagoGuid),
    aprobacion: true,
    metodoPago,
  };
};

export const anularFactura = async (id, motivo, rowVersion = null) => {
  const response = await internalApi.patch(`/facturas/${id}/anular`, {
    motivo,
    rowVersion,
  });
  return extractApiPayload(response);
};

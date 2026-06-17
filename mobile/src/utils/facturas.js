import { normalizeCollectionPayload } from "../../../src/shared/utils/api";
import { filterSafeList, withSafeItems } from "./adminCollection";
import { formatReservaMoney } from "./reservas";

export const getFacturaId = (factura) =>
  factura?.facturaGuid ?? factura?.guidFactura ?? null;

export const formatFacturaMoney = formatReservaMoney;

export const normalizeFacturasList = (response, params = {}) =>
  withSafeItems(
    normalizeCollectionPayload(response, {
      pagina: Number(params?.pagina) || 1,
      limite: Number(params?.limite) || 20,
    })
  );

const getDiffDays = (start, end) => {
  if (!start || !end) return 1;
  const startDate = new Date(`${String(start).slice(0, 10)}T00:00:00`);
  const endDate = new Date(`${String(end).slice(0, 10)}T00:00:00`);
  const diffMs = endDate.getTime() - startDate.getTime();
  const diffDays = Math.round(diffMs / 86400000);
  return Math.max(1, diffDays);
};

export const buildReservaFacturaItems = (reserva) => {
  const habitaciones = filterSafeList(
    Array.isArray(reserva?.habitaciones) ? reserva.habitaciones : []
  );
  if (habitaciones.length === 0) return [];

  return habitaciones.map((item, index) => {
    const nights = getDiffDays(
      item.fechaInicio ?? reserva?.fechaInicio,
      item.fechaFin ?? reserva?.fechaFin
    );
    const precioUnitario = Number(item.precioNocheAplicado ?? 0);
    const subtotal = Number(item.subtotalLinea ?? precioUnitario * nights);
    const valorIva = Number(item.valorIvaLinea ?? 0);
    const descuento = Number(item.descuentoLinea ?? 0);
    const total = Number(item.totalLinea ?? subtotal + valorIva - descuento);
    const numeroHabitacion =
      item.numeroHabitacion ?? item.habitacionNumero ?? item.idHabitacion ?? index + 1;

    return {
      descripcion: `Habitación ${numeroHabitacion} (${String(
        item.fechaInicio ?? reserva?.fechaInicio ?? ""
      ).slice(0, 10)} - ${String(item.fechaFin ?? reserva?.fechaFin ?? "").slice(0, 10)})`,
      cantidad: nights,
      precioUnitario,
      subtotal,
      valorIva,
      descuento,
      total,
      tipoItem: "ALOJAMIENTO",
      referenciaTipo: "RESERVA_HABITACION",
      referenciaGuid: item.reservaHabitacionGuid ?? null,
    };
  });
};

export const buildFinalFacturaItems = (cargos = []) =>
  filterSafeList(cargos)
    .filter((cargo) => cargo?.estadoCargo === "PEN")
    .map((cargo) => ({
      descripcion: cargo.descripcionCargo ?? "Cargo de estadía",
      cantidad: Number(cargo.cantidad ?? 1),
      precioUnitario: Number(cargo.precioUnitario ?? 0),
      subtotal: Number(cargo.subtotal ?? cargo.totalCargo ?? 0),
      valorIva: Number(cargo.valorIva ?? 0),
      descuento: 0,
      total: Number(cargo.totalCargo ?? 0),
      tipoItem: "SERVICIO",
      referenciaTipo: "CARGO_ESTADIA",
      referenciaGuid: cargo.cargoGuid ?? null,
    }));

export const buildFacturaGeneracionBody = (reserva, cargos, mode) => {
  const clienteGuid = reserva?.clienteGuid;
  const sucursalGuid = reserva?.sucursalGuid;

  if (!clienteGuid) {
    throw new Error("No se pudo resolver clienteGuid para generar la factura.");
  }
  if (!sucursalGuid) {
    throw new Error("No se pudo resolver sucursalGuid para generar la factura.");
  }

  const items =
    mode === "reserva"
      ? buildReservaFacturaItems(reserva)
      : buildFinalFacturaItems(cargos);

  if (items.length === 0) {
    throw new Error(
      mode === "reserva"
        ? "La reserva no tiene líneas de alojamiento suficientes para generar la factura."
        : "No existen cargos de estadía pendientes para generar la factura final."
    );
  }

  return { clienteGuid, sucursalGuid, items };
};

export const canPayFactura = (factura) =>
  factura?.estado === "EMI" && Number(factura?.saldoPendiente ?? 0) > 0;

export const canAnularFactura = (factura) => factura?.estado === "EMI";

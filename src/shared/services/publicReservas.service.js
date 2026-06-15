import { extractApiPayload } from "../utils/api";
import { normalizeTipoIdentificacion } from "../utils/constraints";

const toDateOnly = (value) => {
  const normalized = String(value || "").trim();
  return normalized ? normalized.slice(0, 10) : null;
};

const toClientePayload = (cliente = {}) => ({
  tipoIdentificacion: normalizeTipoIdentificacion(
    cliente.tipoIdentificacion ?? cliente.tipo_identificacion
  ),
  numeroIdentificacion:
    cliente.numeroIdentificacion ?? cliente.numero_identificacion ?? "",
  nombres: cliente.nombres ?? "",
  apellidos: cliente.apellidos ?? "",
  correo: cliente.correo ?? "",
  telefono: cliente.telefono ?? "",
  direccion: cliente.direccion ?? "",
});

const toReservaHabitacionPayload = (item = {}, reserva = {}) => ({
  tipoHabitacionGuid: item.tipoHabitacionGuid ?? null,
  habitacionGuid: item.habitacionGuid ?? null,
  tarifaGuid: item.tarifaGuid ?? null,
  numHabitaciones: Number(item.numHabitaciones ?? reserva.numHabitaciones ?? 1),
  numAdultos: Number(item.numAdultos ?? reserva.numAdultos ?? 1),
  numNinos: Number(item.numNinos ?? reserva.numNinos ?? 0),
  precioNocheAplicado:
    item.precioNocheAplicado == null ? undefined : Number(item.precioNocheAplicado),
});

const validateKnownAvailability = (data = {}) => {
  const habitaciones = Array.isArray(data.habitaciones) ? data.habitaciones : [];

  for (const item of habitaciones) {
    const solicitadas = Number(item.numHabitaciones ?? data.numHabitaciones ?? 1);
    const disponibles =
      item.disponiblesEnRango === null || item.disponiblesEnRango === undefined
        ? null
        : Number(item.disponiblesEnRango);

    if (!item.tipoHabitacionGuid) {
      throw new Error(
        "No se pudo resolver el tipo de habitación para crear la reserva."
      );
    }

    if (disponibles !== null && Number.isFinite(disponibles) && disponibles < solicitadas) {
      throw new Error(
        "La habitación seleccionada ya no tiene disponibilidad suficiente para esas fechas."
      );
    }
  }
};

const toPublicReservaPayload = (data = {}) => ({
  cliente: toClientePayload(data.cliente),
  sucursalGuid: data.sucursalGuid ?? "",
  fechaInicio: toDateOnly(data.fechaInicio),
  fechaFin: toDateOnly(data.fechaFin),
  origenCanalReserva: data.origenCanalReserva ?? "PORTAL",
  observaciones: data.observaciones ?? null,
  esWalkin: Boolean(data.esWalkin),
  habitaciones: Array.isArray(data.habitaciones)
    ? data.habitaciones.map((item) => toReservaHabitacionPayload(item, data))
    : [],
});

export const createPublicReservasService = (publicApi) => ({
  createPublicReserva: async (data) => {
    validateKnownAvailability(data);
    const response = await publicApi.post(
      "/accommodations/reservas",
      toPublicReservaPayload(data),
      {
        retryOnRateLimit: true,
        retryRateLimitMethods: ["post"],
        rateLimitMaxRetries: 1,
      }
    );
    return extractApiPayload(response);
  },
});

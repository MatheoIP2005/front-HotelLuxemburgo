import { normalizeCollectionPayload } from "../../../src/shared/utils/api";

export const getAuditoriaId = (item) =>
  item?.auditoriaGuid ?? item?.auditoria_guid ?? null;

export const getAuditoriaTabla = (item) =>
  item?.tablaAfectada ?? item?.tabla_afectada ?? "-";

export const getAuditoriaOperacion = (item) =>
  item?.operacion ?? item?.Operacion ?? "-";

export const getAuditoriaUsuario = (item) =>
  item?.usuarioEjecutor ?? item?.usuario_ejecutor ?? "-";

export const getAuditoriaServicio = (item) =>
  item?.servicioOrigen ?? item?.servicio_origen ?? "-";

export const getAuditoriaFecha = (item) =>
  item?.fechaEventoUtc ?? item?.fecha_evento_utc ?? null;

export const getAuditoriaIdRegistro = (item) =>
  item?.idRegistroAfectado ?? item?.id_registro_afectado ?? "N/A";

export const getAuditoriaIp = (item) => item?.ipOrigen ?? item?.ip_origen ?? "N/A";

export const getAuditoriaEntidadGuid = (item) =>
  item?.entidadGuid ?? item?.entidad_guid ?? null;

export const getAuditoriaDatosAnteriores = (item) =>
  item?.datosAnteriores ?? item?.datos_anteriores ?? null;

export const getAuditoriaDatosNuevos = (item) =>
  item?.datosNuevos ?? item?.datos_nuevos ?? null;

export const formatAuditoriaDateTime = (value) => {
  if (!value) return "-";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return String(value);
  return date.toLocaleString("es-EC", {
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit",
  });
};

export const formatAuditoriaJson = (value) => {
  if (value === null || value === undefined || value === "") {
    return null;
  }
  if (typeof value === "object") {
    try {
      return JSON.stringify(value, null, 2);
    } catch {
      return String(value);
    }
  }
  const text = String(value).trim();
  if (!text) return null;
  try {
    return JSON.stringify(JSON.parse(text), null, 2);
  } catch {
    return text;
  }
};

export const normalizeAuditoriaList = (response, params = {}) =>
  normalizeCollectionPayload(response, {
    pagina: Number(params?.pagina) || 1,
    limite: Number(params?.limite) || 50,
  });

export const buildAuditoriaQuery = (filters = {}) =>
  Object.fromEntries(
    Object.entries(filters).filter(([, value]) => String(value ?? "").trim() !== "")
  );

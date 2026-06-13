import internalApi from "../api/internalApi";
import { extractApiPayload } from "../../../src/shared/utils/api";

export const getAuditoria = async (params) => {
  if (params?.auditoriaGuid) {
    const response = await internalApi.get(`/auditoria/${params.auditoriaGuid}`);
    const payload = extractApiPayload(response);
    return {
      items: payload ? [payload] : [],
      paginaActual: 1,
      totalResultados: payload ? 1 : 0,
      totalPaginas: 1,
      limite: 1,
    };
  }
  const response = await internalApi.get("/auditoria", { params });
  return extractApiPayload(response);
};

export const getAuditoriaItem = async (id) => {
  const response = await internalApi.get(`/auditoria/${id}`);
  return extractApiPayload(response);
};

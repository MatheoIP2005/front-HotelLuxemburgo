import internalApi from "../api/internalApi";
import { extractApiPayload } from "../utils/api";

export const getPermisos = async () => {
  const response = await internalApi.get("/permisos");
  return extractApiPayload(response);
};

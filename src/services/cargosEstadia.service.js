import internalApi from "../api/internalApi";
import { extractApiPayload } from "../utils/api";

export const getCargoEstadia = async (cargoGuid) => {
  const response = await internalApi.get(`/cargos-estadia/${cargoGuid}`);
  return extractApiPayload(response);
};

export const anularCargoEstadia = async (cargoGuid) => {
  const response = await internalApi.patch(`/cargos-estadia/${cargoGuid}/anular`);
  return extractApiPayload(response);
};

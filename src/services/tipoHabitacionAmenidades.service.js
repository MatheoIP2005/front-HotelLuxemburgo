import internalApi from "../api/internalApi";
import { extractApiPayload } from "../utils/api";

export const getTipoHabitacionAmenidades = async (tipoHabitacionGuid) => {
  const response = await internalApi.get(`/tipos-habitacion/${tipoHabitacionGuid}/amenidades`);
  return extractApiPayload(response);
};

export const asignarAmenidadTipoHabitacion = async (tipoHabitacionGuid, catalogoGuid) => {
  const response = await internalApi.post(`/tipos-habitacion/${tipoHabitacionGuid}/amenidades`, {
    catalogoGuid,
  });
  return extractApiPayload(response);
};

export const removerAmenidadTipoHabitacion = async (tipoHabitacionGuid, id) => {
  const response = await internalApi.delete(`/tipos-habitacion/${tipoHabitacionGuid}/amenidades/${id}`);
  return extractApiPayload(response);
};

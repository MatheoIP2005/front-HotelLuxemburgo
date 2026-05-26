import internalApi from "../api/internalApi";
import { extractApiPayload } from "../utils/api";
import { MAX_LENGTHS } from "../utils/constraints";

const toPayload = (data = {}) => {
  const urlImagen = String(data.urlImagen ?? data.url_imagen ?? "").trim();
  const descripcionImagen = String(
    data.descripcionImagen ?? data.descripcion_imagen ?? ""
  ).trim();
  const ordenVisualizacion = Number(data.ordenVisualizacion ?? data.orden_visualizacion ?? 1);

  if (!urlImagen) {
    throw new Error("La URL de la imagen es obligatoria.");
  }
  if (urlImagen.length > MAX_LENGTHS.imagen.url) {
    throw new Error(`La URL no puede exceder ${MAX_LENGTHS.imagen.url} caracteres.`);
  }
  if (descripcionImagen.length > MAX_LENGTHS.imagen.descripcion) {
    throw new Error(
      `La descripción no puede exceder ${MAX_LENGTHS.imagen.descripcion} caracteres.`
    );
  }
  if (!Number.isFinite(ordenVisualizacion) || ordenVisualizacion <= 0) {
    throw new Error("El orden de visualización debe ser mayor a cero.");
  }

  return {
    urlImagen,
    descripcionImagen: descripcionImagen || null,
    ordenVisualizacion,
    esPrincipal: Boolean(data.esPrincipal ?? data.es_principal),
  };
};

export const getTipoHabitacionImagenes = async (tipoHabitacionGuid) => {
  const response = await internalApi.get(`/tipos-habitacion/${tipoHabitacionGuid}/imagenes`);
  return extractApiPayload(response);
};

export const createTipoHabitacionImagen = async (tipoHabitacionGuid, data) => {
  const response = await internalApi.post(
    `/tipos-habitacion/${tipoHabitacionGuid}/imagenes`,
    toPayload(data)
  );
  return extractApiPayload(response);
};

export const deleteTipoHabitacionImagen = async (tipoHabitacionGuid, id) => {
  const response = await internalApi.delete(`/tipos-habitacion/${tipoHabitacionGuid}/imagenes/${id}`);
  return extractApiPayload(response);
};

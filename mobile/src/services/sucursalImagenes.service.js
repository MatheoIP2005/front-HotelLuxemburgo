/** Imágenes de sucursal (URL manual o subida nativa vía images.service). */
import internalApi from "../api/internalApi";
import { extractApiPayload } from "../../../src/shared/utils/api";
import { MAX_LENGTHS } from "../../../src/utils/constraints";

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

export const getSucursalImagenes = async (sucursalGuid) => {
  const response = await internalApi.get(`/sucursales/${sucursalGuid}/imagenes`);
  return extractApiPayload(response);
};

export const createSucursalImagen = async (sucursalGuid, data) => {
  const response = await internalApi.post(
    `/sucursales/${sucursalGuid}/imagenes`,
    toPayload(data)
  );
  return extractApiPayload(response);
};

export const deleteSucursalImagen = async (sucursalGuid, idSucursalImagen) => {
  const response = await internalApi.delete(
    `/sucursales/${sucursalGuid}/imagenes/${idSucursalImagen}`
  );
  return extractApiPayload(response);
};

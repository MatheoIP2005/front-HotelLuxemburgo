import internalApi from "../api/internalApi";
import { extractApiPayload } from "../../../src/shared/utils/api";

const resolveUploadedImage = (payload) => {
  const data = payload?.data && typeof payload.data === "object" ? payload.data : payload;
  const url = data?.secureUrl ?? data?.secure_url ?? data?.url ?? data?.urlImagen ?? "";
  const secureUrl = data?.secureUrl ?? data?.secure_url ?? url;

  return {
    ...(data && typeof data === "object" ? data : {}),
    url,
    secureUrl,
    urlImagen: data?.urlImagen ?? url,
  };
};

export const uploadImage = async (asset) => {
  if (!asset?.uri) {
    throw new Error("Debes seleccionar un archivo para subir.");
  }

  const name = asset.fileName || asset.filename || "hotel-image.jpg";
  const type = asset.mimeType || "image/jpeg";

  const formData = new FormData();
  formData.append("file", {
    uri: asset.uri,
    name,
    type,
  });

  const response = await internalApi.post("/images/upload", formData, {
    headers: {
      "Content-Type": "multipart/form-data",
    },
  });

  return resolveUploadedImage(extractApiPayload(response));
};

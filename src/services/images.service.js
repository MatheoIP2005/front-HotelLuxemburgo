import internalApi from "../api/internalApi";
import { extractApiPayload } from "../utils/api";

export const uploadImage = async (file) => {
  if (!file) {
    throw new Error("Debes seleccionar un archivo para subir.");
  }

  const formData = new FormData();
  formData.append("file", file);

  const response = await internalApi.post("/images/upload", formData, {
    headers: {
      "Content-Type": "multipart/form-data",
    },
  });
  return extractApiPayload(response);
};

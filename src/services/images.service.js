import internalApi from "../api/internalApi";
import { extractApiPayload } from "../utils/api";

const CLOUDINARY_CLOUD_NAME = import.meta.env.VITE_CLOUDINARY_CLOUD_NAME?.trim();
const CLOUDINARY_UPLOAD_PRESET =
  import.meta.env.VITE_CLOUDINARY_UPLOAD_PRESET?.trim();

const hasPartialCloudinaryConfig =
  Boolean(CLOUDINARY_CLOUD_NAME) !== Boolean(CLOUDINARY_UPLOAD_PRESET);
const hasCloudinaryConfig =
  Boolean(CLOUDINARY_CLOUD_NAME) && Boolean(CLOUDINARY_UPLOAD_PRESET);

const uploadToInternalApi = async (file) => {
  const formData = new FormData();
  formData.append("file", file);

  const response = await internalApi.post("/images/upload", formData, {
    headers: {
      "Content-Type": "multipart/form-data",
    },
  });
  return extractApiPayload(response);
};

const uploadToCloudinary = async (file) => {
  const formData = new FormData();
  formData.append("file", file);
  formData.append("upload_preset", CLOUDINARY_UPLOAD_PRESET);

  const response = await fetch(
    `https://api.cloudinary.com/v1_1/${CLOUDINARY_CLOUD_NAME}/image/upload`,
    {
      method: "POST",
      body: formData,
    }
  );
  const payload = await response.json().catch(() => ({}));

  if (!response.ok) {
    throw new Error(
      payload?.error?.message || "Cloudinary no pudo procesar la imagen."
    );
  }

  return {
    ...payload,
    url: payload.secure_url || payload.url || "",
    secureUrl: payload.secure_url || "",
    publicId: payload.public_id || "",
  };
};

export const uploadImage = async (file) => {
  if (!file) {
    throw new Error("Debes seleccionar un archivo para subir.");
  }

  if (hasPartialCloudinaryConfig) {
    throw new Error(
      "Configura VITE_CLOUDINARY_CLOUD_NAME y VITE_CLOUDINARY_UPLOAD_PRESET."
    );
  }

  if (hasCloudinaryConfig) {
    return uploadToCloudinary(file);
  }

  return uploadToInternalApi(file);
};

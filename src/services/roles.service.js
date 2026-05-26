import internalApi from "../api/internalApi";
import { extractApiPayload } from "../utils/api";
import { MAX_LENGTHS, ROLE_STATES } from "../utils/constraints";

const toRolPayload = (data = {}, isUpdate = false) => {
  const nombreRol = String(data.nombreRol ?? data.nombre_rol ?? "").trim();
  const descripcionRol = String(
    data.descripcionRol ?? data.descripcion_rol ?? ""
  ).trim();
  const estadoRol = String(data.estadoRol ?? data.estado_rol ?? "ACT")
    .trim()
    .toUpperCase();

  if (!nombreRol) {
    throw new Error("El nombre del rol es obligatorio.");
  }
  if (nombreRol.length > MAX_LENGTHS.rol.nombre) {
    throw new Error(`El nombre del rol no puede exceder ${MAX_LENGTHS.rol.nombre} caracteres.`);
  }
  if (descripcionRol.length > MAX_LENGTHS.rol.descripcion) {
    throw new Error(
      `La descripción del rol no puede exceder ${MAX_LENGTHS.rol.descripcion} caracteres.`
    );
  }
  if (isUpdate && !ROLE_STATES.includes(estadoRol)) {
    throw new Error(`Estado de rol inválido. Usa: ${ROLE_STATES.join(", ")}.`);
  }

  return {
    nombreRol,
    descripcionRol: descripcionRol || null,
    ...(isUpdate ? { estadoRol } : {}),
  };
};

export const getRoles = async () => {
  const response = await internalApi.get("/roles");
  return extractApiPayload(response);
};

export const getRol = async (rolGuid) => {
  const response = await internalApi.get(`/roles/${rolGuid}`);
  return extractApiPayload(response);
};

export const createRol = async (data) => {
  const response = await internalApi.post("/roles", toRolPayload(data));
  return extractApiPayload(response);
};

export const updateRol = async (rolGuid, data) => {
  const response = await internalApi.put(`/roles/${rolGuid}`, toRolPayload(data, true));
  return extractApiPayload(response);
};

export const inhabilitarRol = async (rolGuid) => {
  const response = await internalApi.patch(`/roles/${rolGuid}/inhabilitar`);
  return extractApiPayload(response);
};

export const deleteRol = async (rolGuid) => {
  const response = await internalApi.delete(`/roles/${rolGuid}`);
  return extractApiPayload(response);
};

export const assignPermisoToRol = async (rolGuid, permisoId) => {
  const response = await internalApi.post(`/roles/${rolGuid}/permisos`, {
    idPermiso: Number(permisoId),
  });
  return extractApiPayload(response);
};

export const removePermisoFromRol = async (rolGuid, permisoId) => {
  const response = await internalApi.delete(`/roles/${rolGuid}/permisos/${permisoId}`);
  return extractApiPayload(response);
};

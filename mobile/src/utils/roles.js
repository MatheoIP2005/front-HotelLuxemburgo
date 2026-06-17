import { MAX_LENGTHS, ROLE_STATES } from "../../../src/utils/constraints";
import { filterSafeList } from "./adminCollection";

export const getRolId = (rol) => rol?.rolGuid ?? null;

export const validateRolForm = (form = {}, isEdit = false) => {
  const errors = {};
  const nombreRol = String(form.nombreRol ?? "").trim();
  const descripcionRol = String(form.descripcionRol ?? "").trim();

  if (!nombreRol) errors.nombreRol = "El nombre del rol es obligatorio.";
  else if (nombreRol.length > MAX_LENGTHS.rol.nombre) {
    errors.nombreRol = `Máximo ${MAX_LENGTHS.rol.nombre} caracteres.`;
  }

  if (descripcionRol.length > MAX_LENGTHS.rol.descripcion) {
    errors.descripcionRol = `Máximo ${MAX_LENGTHS.rol.descripcion} caracteres.`;
  }

  if (isEdit && form.estadoRol && !ROLE_STATES.includes(form.estadoRol)) {
    errors.estadoRol = `Estado inválido. Usa: ${ROLE_STATES.join(", ")}.`;
  }

  return errors;
};

export const validatePermisoId = (value) => {
  const trimmed = String(value ?? "").trim();
  if (!trimmed) return "Selecciona o ingresa un ID de permiso.";
  const parsed = Number(trimmed);
  if (!Number.isInteger(parsed) || parsed <= 0) {
    return "Ingresa un ID de permiso válido.";
  }
  return "";
};

export const normalizePermisosList = (response) =>
  filterSafeList(Array.isArray(response) ? response : response?.items ?? []);

export const permisoToOption = (permiso) => {
  if (permiso == null || permiso === "") {
    return { value: "", label: "Sin permiso" };
  }
  const value = typeof permiso === "string" ? permiso.trim() : String(permiso);
  return { value, label: value };
};

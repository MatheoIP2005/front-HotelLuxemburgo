import {
  EMAIL_REGEX,
  MAX_LENGTHS,
  PERSON_NAME_REGEX,
  USER_STATES,
} from "../../../src/utils/constraints";
import { sanitizePersonNameInput } from "./text";

export const resolveUsuarioFieldUpdate = (prev, key, value) => {
  if (key === "nombres" || key === "apellidos") {
    const sanitized = sanitizePersonNameInput(value);
    if (sanitized === null) return prev;
    return { ...prev, [key]: sanitized };
  }
  return { ...prev, [key]: value };
};

export const getUsuarioId = (usuario) => usuario?.usuarioGuid ?? null;

export const getUsuarioDisplayName = (usuario) => {
  if (!usuario) return "-";
  const nombre = `${String(usuario.nombres ?? "").trim()} ${String(usuario.apellidos ?? "").trim()}`.trim();
  return nombre || usuario.username || "-";
};

export const validateUsuarioForm = (form, isEdit = false) => {
  const errors = {};
  const username = String(form.username ?? "").trim();
  const nombres = String(form.nombres ?? "").trim();
  const apellidos = String(form.apellidos ?? "").trim();
  const correo = String(form.correo ?? "").trim();
  const password = String(form.password ?? "").trim();

  if (!username) errors.username = "El username es obligatorio.";
  else if (username.length > MAX_LENGTHS.usuario.username) {
    errors.username = "El username no puede exceder 15 caracteres.";
  }

  if (!nombres) errors.nombres = "Los nombres son obligatorios.";
  else if (nombres.length > MAX_LENGTHS.usuario.nombres) {
    errors.nombres = "Los nombres no pueden exceder 30 caracteres.";
  } else if (!PERSON_NAME_REGEX.test(nombres)) {
    errors.nombres = "Los nombres solo pueden contener letras.";
  }

  if (apellidos) {
    if (apellidos.length > MAX_LENGTHS.usuario.apellidos) {
      errors.apellidos = "Los apellidos no pueden exceder 30 caracteres.";
    } else if (!PERSON_NAME_REGEX.test(apellidos)) {
      errors.apellidos = "Los apellidos solo pueden contener letras.";
    }
  }

  if (!correo) errors.correo = "El correo es obligatorio.";
  else if (correo.length > MAX_LENGTHS.usuario.correo) {
    errors.correo = "El correo no puede exceder 120 caracteres.";
  } else if (!EMAIL_REGEX.test(correo)) {
    errors.correo = "El correo no tiene un formato válido.";
  }

  if (!isEdit) {
    if (!password) errors.password = "La contraseña es obligatoria para crear el usuario.";
    else if (password.length > 200) {
      errors.password = "La contraseña no puede exceder 200 caracteres.";
    }
  }

  if (isEdit && form.estadoUsuario && !USER_STATES.includes(form.estadoUsuario)) {
    errors.estadoUsuario = `Estado inválido. Usa: ${USER_STATES.join(", ")}.`;
  }

  return errors;
};

export const normalizeRolesList = (response) => (Array.isArray(response) ? response : response?.items ?? []);

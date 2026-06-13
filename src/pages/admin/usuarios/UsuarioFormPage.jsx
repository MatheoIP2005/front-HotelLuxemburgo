import { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import {
  asignarRolUsuario,
  createUsuario,
  getUsuario,
  getUsuarioRoles,
  removerRolUsuario,
  updateUsuario,
} from "../../../services/usuarios.service";
import {
  EMAIL_REGEX,
  MAX_LENGTHS,
  PERSON_NAME_REGEX,
  USER_STATES,
} from "../../../utils/constraints";
import { getRoles } from "../../../services/roles.service";
import styles from "./UsuarioFormPage.module.css";

const EMPTY_FORM = {
  username: "",
  nombres: "",
  apellidos: "",
  correo: "",
  password: "",
  estado_usuario: "ACT",
  row_version: null,
};

const trimText = (value) => (typeof value === "string" ? value.trim() : value);

const buildDescribedBy = (...ids) => ids.filter(Boolean).join(" ") || undefined;

const getCounterText = (value, max) => `${String(value ?? "").length}/${max}`;

const getFieldClassName = (baseClassName, hasError) =>
  hasError ? `${baseClassName} ${styles.fieldError}` : baseClassName;

const validateUsuarioField = (name, value, isEditMode) => {
  const trimmedValue = typeof value === "string" ? value.trim() : value;

  switch (name) {
    case "username":
      if (!trimmedValue) {
        return "El username es obligatorio.";
      }
      if (trimmedValue.length > MAX_LENGTHS.usuario.username) {
        return "El username no puede exceder 15 caracteres.";
      }
      return "";
    case "nombres":
      if (!trimmedValue) {
        return "Los nombres son obligatorios.";
      }
      if (trimmedValue.length > MAX_LENGTHS.usuario.nombres) {
        return "Los nombres no pueden exceder 30 caracteres.";
      }
      if (!PERSON_NAME_REGEX.test(trimmedValue)) {
        return "Los nombres solo pueden contener letras.";
      }
      return "";
    case "apellidos":
      if (!trimmedValue) {
        return "";
      }
      if (trimmedValue.length > MAX_LENGTHS.usuario.apellidos) {
        return "Los apellidos no pueden exceder 30 caracteres.";
      }
      if (!PERSON_NAME_REGEX.test(trimmedValue)) {
        return "Los apellidos solo pueden contener letras.";
      }
      return "";
    case "correo":
      if (!trimmedValue) {
        return "El correo es obligatorio.";
      }
      if (trimmedValue.length > MAX_LENGTHS.usuario.correo) {
        return "El correo no puede exceder 120 caracteres.";
      }
      if (!EMAIL_REGEX.test(trimmedValue)) {
        return "El correo no tiene un formato valido.";
      }
      return "";
    case "password":
      if (!isEditMode && !trimmedValue) {
        return "La contraseña es obligatoria para crear el usuario.";
      }
      if (trimmedValue && trimmedValue.length > 200) {
        return "La contraseña no puede exceder 200 caracteres.";
      }
      return "";
    case "estado_usuario":
      if (!USER_STATES.includes(value)) {
        return `El estado debe ser uno de: ${USER_STATES.join(", ")}.`;
      }
      return "";
    case "selectedRolGuid":
      if (!value) {
        return "Selecciona un rol para asignarlo.";
      }
      return "";
    default:
      return "";
  }
};

export default function UsuarioFormPage() {
  const navigate = useNavigate();
  const { id } = useParams();
  const isEditMode = Boolean(id);

  const [form, setForm] = useState(EMPTY_FORM);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(null);
  const [fieldErrors, setFieldErrors] = useState({});
  const [rolesCatalog, setRolesCatalog] = useState([]);
  const [assignedRoles, setAssignedRoles] = useState([]);
  const [selectedRolGuid, setSelectedRolGuid] = useState("");

  useEffect(() => {
    const loadData = async () => {
      setLoading(true);
      setError(null);

      try {
        const [item, catalogRoles, usuarioRoles] = await Promise.all([
          id ? getUsuario(id) : Promise.resolve(null),
          getRoles().catch(() => []),
          id ? getUsuarioRoles(id).catch(() => []) : Promise.resolve([]),
        ]);

        setRolesCatalog(Array.isArray(catalogRoles) ? catalogRoles : []);
        setAssignedRoles(Array.isArray(usuarioRoles) ? usuarioRoles : []);

        if (item) {
          setForm({
            username: trimText(item.username ?? ""),
            nombres: trimText(item.nombres ?? ""),
            apellidos: trimText(item.apellidos ?? ""),
            correo: trimText(item.correo ?? ""),
            password: "",
            estado_usuario: trimText(item.estadoUsuario) || "ACT",
            row_version: item.rowVersion ?? null,
          });
        }
      } catch (err) {
        setError(err?.response?.data?.message || "Error al cargar el registro");
      } finally {
        setLoading(false);
      }
    };

    loadData();
  }, [id]);

  const handleChange = (event) => {
    const { name, value } = event.target;

    if ((name === "nombres" || name === "apellidos") && value && !PERSON_NAME_REGEX.test(value)) {
      return;
    }

    setForm((prev) => ({ ...prev, [name]: value }));

    if (fieldErrors[name]) {
      setFieldErrors((prev) => ({
        ...prev,
        [name]: validateUsuarioField(name, value, isEditMode),
      }));
    }
  };

  const handleBlur = (event) => {
    const { name, value } = event.target;
    setFieldErrors((prev) => ({
      ...prev,
      [name]: validateUsuarioField(name, value, isEditMode),
    }));
  };

  const validateForm = () => {
    const nextErrors = {
      username: validateUsuarioField("username", form.username, isEditMode),
      nombres: validateUsuarioField("nombres", form.nombres, isEditMode),
      apellidos: validateUsuarioField("apellidos", form.apellidos, isEditMode),
      correo: validateUsuarioField("correo", form.correo, isEditMode),
      password: validateUsuarioField("password", form.password, isEditMode),
      estado_usuario: validateUsuarioField("estado_usuario", form.estado_usuario, isEditMode),
    };

    setFieldErrors((prev) => ({
      ...prev,
      ...nextErrors,
    }));

    return Object.values(nextErrors).every((message) => !message);
  };

  const handleSubmit = async (event) => {
    event.preventDefault();
    setError(null);
    setSuccess(null);

    if (!validateForm()) {
      return;
    }

    setLoading(true);
    try {
      const username = trimText(form.username);
      const nombres = trimText(form.nombres);
      const apellidos = trimText(form.apellidos);
      const correo = trimText(form.correo);
      const password = trimText(form.password);

      const payload = {
        username,
        nombres,
        apellidos: apellidos || null,
        correo,
        password,
        estadoUsuario: form.estado_usuario,
        rowVersion: form.row_version,
      };

      if (isEditMode) {
        await updateUsuario(id, payload);
        setSuccess("Usuario actualizado correctamente.");
      } else {
        await createUsuario(payload);
        setSuccess("Usuario creado correctamente.");
      }
      setTimeout(() => navigate("/admin/usuarios"), 1500);
    } catch (err) {
      setError(err?.response?.data?.message || err?.message || "Error al guardar");
    } finally {
      setLoading(false);
    }
  };

  const refreshUserRoles = async () => {
    if (!id) return;

    const [catalogRoles, usuarioRoles] = await Promise.all([
      getRoles().catch(() => []),
      getUsuarioRoles(id).catch(() => []),
    ]);
    setRolesCatalog(Array.isArray(catalogRoles) ? catalogRoles : []);
    setAssignedRoles(Array.isArray(usuarioRoles) ? usuarioRoles : []);
  };

  const handleAssignRole = async () => {
    if (!id) return;

    const selectedRolError = validateUsuarioField("selectedRolGuid", selectedRolGuid, isEditMode);
    setFieldErrors((prev) => ({
      ...prev,
      selectedRolGuid: selectedRolError,
    }));

    if (selectedRolError) {
      return;
    }

    setLoading(true);
    setError(null);
    setSuccess(null);
    try {
      await asignarRolUsuario(id, selectedRolGuid);
      await refreshUserRoles();
      setSelectedRolGuid("");
      setFieldErrors((prev) => ({
        ...prev,
        selectedRolGuid: "",
      }));
      setSuccess("Rol asignado correctamente.");
    } catch (err) {
      setError(err?.response?.data?.message || "No se pudo asignar el rol.");
    } finally {
      setLoading(false);
    }
  };

  const handleRemoveRole = async (rolGuid) => {
    if (!id) return;
    if (!window.confirm("¿Deseas quitar este rol del usuario?")) return;

    setLoading(true);
    setError(null);
    setSuccess(null);
    try {
      await removerRolUsuario(id, rolGuid);
      await refreshUserRoles();
      setSuccess("Rol removido correctamente.");
    } catch (err) {
      setError(err?.response?.data?.message || "No se pudo remover el rol.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <form className={styles.page} onSubmit={handleSubmit} noValidate>
      <div className={styles.topBar}>
        <h2>{isEditMode ? "Editar Usuario" : "Nuevo Usuario"}</h2>
        <button type="button" className={styles.btnSecondary} onClick={() => navigate("/admin/usuarios")}>
          Volver
        </button>
      </div>

      {error && (
        <div className={styles.errorBox} role="alert">
          {error}
        </div>
      )}
      {success && (
        <div className={styles.successBox} aria-live="polite">
          {success}
        </div>
      )}

      <section className={styles.card}>
        <h3 className={styles.sectionTitle}>Datos del Usuario</h3>
        <div className={styles.grid2}>
          <div className={getFieldClassName(styles.field, fieldErrors.username)}>
            <label htmlFor="usuario-username">Username</label>
            <input
              id="usuario-username"
              name="username"
              maxLength={15}
              value={form.username}
              onChange={handleChange}
              onBlur={handleBlur}
              autoComplete="username"
              spellCheck={false}
              aria-invalid={Boolean(fieldErrors.username)}
              aria-describedby={buildDescribedBy(
                "usuario-username-help",
                "usuario-username-counter",
                fieldErrors.username ? "usuario-username-error" : null
              )}
            />
            <div className={styles.fieldMeta}>
              <span id="usuario-username-help" className={styles.helpText}>
                Identificador unico para iniciar sesion. Maximo 15 caracteres.
              </span>
              <span id="usuario-username-counter" className={styles.counterText}>
                {getCounterText(form.username, 15)}
              </span>
            </div>
            {fieldErrors.username && (
              <span id="usuario-username-error" className={styles.errorText} role="alert">
                {fieldErrors.username}
              </span>
            )}
          </div>

          <div className={getFieldClassName(styles.field, fieldErrors.nombres)}>
            <label htmlFor="usuario-nombres">Nombres</label>
            <input
              id="usuario-nombres"
              name="nombres"
              maxLength={30}
              value={form.nombres}
              onChange={handleChange}
              onBlur={handleBlur}
              autoComplete="given-name"
              aria-invalid={Boolean(fieldErrors.nombres)}
              aria-describedby={buildDescribedBy(
                "usuario-nombres-help",
                "usuario-nombres-counter",
                fieldErrors.nombres ? "usuario-nombres-error" : null
              )}
            />
            <div className={styles.fieldMeta}>
              <span id="usuario-nombres-help" className={styles.helpText}>
                Ingresa solo letras. Maximo 30 caracteres.
              </span>
              <span id="usuario-nombres-counter" className={styles.counterText}>
                {getCounterText(form.nombres, 30)}
              </span>
            </div>
            {fieldErrors.nombres && (
              <span id="usuario-nombres-error" className={styles.errorText} role="alert">
                {fieldErrors.nombres}
              </span>
            )}
          </div>

          <div className={getFieldClassName(styles.field, fieldErrors.apellidos)}>
            <label htmlFor="usuario-apellidos">Apellidos</label>
            <input
              id="usuario-apellidos"
              name="apellidos"
              maxLength={30}
              value={form.apellidos}
              onChange={handleChange}
              onBlur={handleBlur}
              autoComplete="family-name"
              aria-invalid={Boolean(fieldErrors.apellidos)}
              aria-describedby={buildDescribedBy(
                "usuario-apellidos-help",
                "usuario-apellidos-counter",
                fieldErrors.apellidos ? "usuario-apellidos-error" : null
              )}
            />
            <div className={styles.fieldMeta}>
              <span id="usuario-apellidos-help" className={styles.helpText}>
                Campo opcional. Usa solo letras y hasta 30 caracteres.
              </span>
              <span id="usuario-apellidos-counter" className={styles.counterText}>
                {getCounterText(form.apellidos, 30)}
              </span>
            </div>
            {fieldErrors.apellidos && (
              <span id="usuario-apellidos-error" className={styles.errorText} role="alert">
                {fieldErrors.apellidos}
              </span>
            )}
          </div>

          <div className={getFieldClassName(styles.field, fieldErrors.correo)}>
            <label htmlFor="usuario-correo">Correo</label>
            <input
              id="usuario-correo"
              type="email"
              name="correo"
              maxLength={120}
              value={form.correo}
              onChange={handleChange}
              onBlur={handleBlur}
              autoComplete="email"
              spellCheck={false}
              aria-invalid={Boolean(fieldErrors.correo)}
              aria-describedby={buildDescribedBy(
                "usuario-correo-help",
                "usuario-correo-counter",
                fieldErrors.correo ? "usuario-correo-error" : null
              )}
            />
            <div className={styles.fieldMeta}>
              <span id="usuario-correo-help" className={styles.helpText}>
                Debe ser un correo valido. Maximo 120 caracteres.
              </span>
              <span id="usuario-correo-counter" className={styles.counterText}>
                {getCounterText(form.correo, 120)}
              </span>
            </div>
            {fieldErrors.correo && (
              <span id="usuario-correo-error" className={styles.errorText} role="alert">
                {fieldErrors.correo}
              </span>
            )}
          </div>

          {isEditMode && (
            <div className={getFieldClassName(styles.field, fieldErrors.estado_usuario)}>
              <label htmlFor="usuario-estado">Estado</label>
              <select
                id="usuario-estado"
                name="estado_usuario"
                value={form.estado_usuario}
                onChange={handleChange}
                onBlur={handleBlur}
                aria-invalid={Boolean(fieldErrors.estado_usuario)}
                aria-describedby={buildDescribedBy(
                  "usuario-estado-help",
                  fieldErrors.estado_usuario ? "usuario-estado-error" : null
                )}
              >
                {USER_STATES.map((estado) => (
                  <option key={estado} value={estado}>
                    {trimText(estado)}
                  </option>
                ))}
              </select>
              <span id="usuario-estado-help" className={styles.helpText}>
                Define si la cuenta queda activa, inactiva o bloqueada.
              </span>
              {fieldErrors.estado_usuario && (
                <span id="usuario-estado-error" className={styles.errorText} role="alert">
                  {fieldErrors.estado_usuario}
                </span>
              )}
            </div>
          )}

          {!isEditMode && (
            <div className={getFieldClassName(styles.field, fieldErrors.password)}>
              <label htmlFor="usuario-password">Contraseña</label>
              <input
                id="usuario-password"
                type="password"
                name="password"
                maxLength={200}
                value={form.password}
                onChange={handleChange}
                onBlur={handleBlur}
                autoComplete="new-password"
                aria-invalid={Boolean(fieldErrors.password)}
                aria-describedby={buildDescribedBy(
                  "usuario-password-help",
                  "usuario-password-counter",
                  fieldErrors.password ? "usuario-password-error" : null
                )}
              />
              <div className={styles.fieldMeta}>
                <span id="usuario-password-help" className={styles.helpText}>
                  Solo se solicita al crear el usuario. Maximo 200 caracteres.
                </span>
                <span id="usuario-password-counter" className={styles.counterText}>
                  {getCounterText(form.password, 200)}
                </span>
              </div>
              {fieldErrors.password && (
                <span id="usuario-password-error" className={styles.errorText} role="alert">
                  {fieldErrors.password}
                </span>
              )}
            </div>
          )}

          {isEditMode && (
            <div className={styles.fieldFull}>
              <span className={styles.helpText}>
                La contraseña no se actualiza desde este formulario. Usa la vista de cambio de
                contraseña para el usuario autenticado.
              </span>
            </div>
          )}
        </div>
      </section>

      {isEditMode && (
        <section className={styles.card}>
          <h3 className={styles.sectionTitle}>Roles asignados</h3>
          <div className={styles.grid2}>
            <div className={getFieldClassName(styles.field, fieldErrors.selectedRolGuid)}>
              <label htmlFor="usuario-rol-disponible">Rol disponible</label>
              <select
                id="usuario-rol-disponible"
                value={selectedRolGuid}
                onChange={(event) => {
                  const nextValue = event.target.value;
                  setSelectedRolGuid(nextValue);
                  if (fieldErrors.selectedRolGuid) {
                    setFieldErrors((prev) => ({
                      ...prev,
                      selectedRolGuid: validateUsuarioField("selectedRolGuid", nextValue, isEditMode),
                    }));
                  }
                }}
                onBlur={(event) =>
                  setFieldErrors((prev) => ({
                    ...prev,
                    selectedRolGuid: validateUsuarioField(
                      "selectedRolGuid",
                      event.target.value,
                      isEditMode
                    ),
                  }))
                }
                aria-invalid={Boolean(fieldErrors.selectedRolGuid)}
                aria-describedby={buildDescribedBy(
                  "usuario-rol-help",
                  fieldErrors.selectedRolGuid ? "usuario-rol-error" : null
                )}
              >
                <option value="">Selecciona un rol</option>
                {rolesCatalog
                  .filter(
                    (rol) =>
                      !assignedRoles.some(
                        (assigned) => String(assigned.rolGuid) === String(rol.rolGuid)
                      )
                  )
                  .map((rol) => (
                    <option key={rol.rolGuid} value={rol.rolGuid}>
                      {trimText(rol.nombreRol)}
                    </option>
                  ))}
              </select>
              <span id="usuario-rol-help" className={styles.helpText}>
                Solo se muestran roles que todavia no estan asignados al usuario.
              </span>
              {fieldErrors.selectedRolGuid && (
                <span id="usuario-rol-error" className={styles.errorText} role="alert">
                  {fieldErrors.selectedRolGuid}
                </span>
              )}
            </div>

            <div className={styles.field}>
              <label>&nbsp;</label>
              <button
                type="button"
                className={styles.btnPrimary}
                onClick={handleAssignRole}
                disabled={loading}
              >
                Asignar rol
              </button>
            </div>
          </div>

          <div className={styles.tableWrapper}>
            <table className={styles.table}>
              <thead>
                <tr>
                  <th>Rol</th>
                  <th>Estado</th>
                  <th>Acciones</th>
                </tr>
              </thead>
              <tbody>
                {assignedRoles.length === 0 && (
                  <tr>
                    <td colSpan={3} className={styles.helpText}>
                      Este usuario no tiene roles asignados.
                    </td>
                  </tr>
                )}
                {assignedRoles.map((rol) => (
                  <tr key={rol.rolGuid}>
                    <td>{trimText(rol.nombreRol) || "-"}</td>
                    <td>{trimText(rol.estadoRol) || "-"}</td>
                    <td>
                      <button
                        type="button"
                        className={styles.btnWarning}
                        onClick={() => handleRemoveRole(rol.rolGuid)}
                        disabled={loading}
                      >
                        Quitar
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </section>
      )}

      <div className={styles.actions}>
        <button type="button" className={styles.btnSecondary} onClick={() => navigate("/admin/usuarios")}>
          Cancelar
        </button>
        <button type="submit" className={styles.btnPrimary} disabled={loading}>
          {loading ? "Guardando..." : "Guardar"}
        </button>
      </div>
    </form>
  );
}

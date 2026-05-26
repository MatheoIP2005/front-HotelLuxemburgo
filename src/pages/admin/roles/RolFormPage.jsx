import { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { getPermisos } from "../../../services/permisos.service";
import {
  assignPermisoToRol,
  createRol,
  getRol,
  removePermisoFromRol,
  updateRol,
} from "../../../services/roles.service";
import { MAX_LENGTHS, ROLE_STATES } from "../../../utils/constraints";
import styles from "../usuarios/UsuarioFormPage.module.css";

const EMPTY_FORM = {
  nombre_rol: "",
  descripcion_rol: "",
  estado_rol: "ACT",
};

const trimText = (value) => (typeof value === "string" ? value.trim() : value);

const buildDescribedBy = (...ids) => ids.filter(Boolean).join(" ") || undefined;

const getCounterText = (value, max) => `${String(value ?? "").length}/${max}`;

const getFieldClassName = (baseClassName, hasError) =>
  hasError ? `${baseClassName} ${styles.fieldError}` : baseClassName;

const validateRolField = (name, value) => {
  const trimmedValue = typeof value === "string" ? value.trim() : value;

  switch (name) {
    case "nombre_rol":
      if (!trimmedValue) {
        return "El nombre del rol es obligatorio.";
      }
      if (trimmedValue.length > MAX_LENGTHS.rol.nombre) {
        return `El nombre del rol no puede exceder ${MAX_LENGTHS.rol.nombre} caracteres.`;
      }
      return "";
    case "descripcion_rol":
      if (trimmedValue.length > MAX_LENGTHS.rol.descripcion) {
        return `La descripcion no puede exceder ${MAX_LENGTHS.rol.descripcion} caracteres.`;
      }
      return "";
    case "estado_rol":
      if (!ROLE_STATES.includes(value)) {
        return `El estado debe ser uno de: ${ROLE_STATES.join(", ")}.`;
      }
      return "";
    case "permisoId": {
      const parsedId = Number(trimmedValue);
      if (!trimmedValue) {
        return "Selecciona o escribe un ID de permiso.";
      }
      if (!Number.isInteger(parsedId) || parsedId <= 0) {
        return "Ingresa un ID de permiso valido.";
      }
      return "";
    }
    default:
      return "";
  }
};

export default function RolFormPage() {
  const navigate = useNavigate();
  const { id } = useParams();
  const isEditMode = Boolean(id);

  const [form, setForm] = useState(EMPTY_FORM);
  const [permisoId, setPermisoId] = useState("");
  const [permisos, setPermisos] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(null);
  const [fieldErrors, setFieldErrors] = useState({});

  useEffect(() => {
    const loadData = async () => {
      setLoading(true);
      setError(null);
      try {
        const [rol, permisosResponse] = await Promise.all([
          isEditMode ? getRol(id) : Promise.resolve(null),
          getPermisos().catch(() => []),
        ]);

        if (rol) {
          setForm({
            nombre_rol: trimText(rol.nombreRol ?? ""),
            descripcion_rol: trimText(rol.descripcionRol ?? ""),
            estado_rol: trimText(rol.estadoRol) || "ACT",
          });
        }

        setPermisos(Array.isArray(permisosResponse) ? permisosResponse : []);
      } catch (err) {
        setError(err?.response?.data?.message || "No se pudo cargar el rol.");
      } finally {
        setLoading(false);
      }
    };

    void loadData();
  }, [id, isEditMode]);

  const handleChange = (event) => {
    const { name, value } = event.target;
    setForm((prev) => ({ ...prev, [name]: value }));

    if (fieldErrors[name]) {
      setFieldErrors((prev) => ({
        ...prev,
        [name]: validateRolField(name, value),
      }));
    }
  };

  const handleBlur = (event) => {
    const { name, value } = event.target;
    setFieldErrors((prev) => ({
      ...prev,
      [name]: validateRolField(name, value),
    }));
  };

  const validateForm = () => {
    const nextErrors = {
      nombre_rol: validateRolField("nombre_rol", form.nombre_rol),
      descripcion_rol: validateRolField("descripcion_rol", form.descripcion_rol),
      estado_rol: validateRolField("estado_rol", form.estado_rol),
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
      const nombreRol = trimText(form.nombre_rol);
      const descripcionRol = trimText(form.descripcion_rol);

      const payload = {
        nombreRol,
        descripcionRol,
        estadoRol: form.estado_rol,
      };

      if (isEditMode) {
        await updateRol(id, payload);
        setSuccess("Rol actualizado correctamente.");
      } else {
        await createRol(payload);
        setSuccess("Rol creado correctamente.");
      }
      window.setTimeout(() => navigate("/admin/roles"), 1200);
    } catch (err) {
      setError(err?.response?.data?.message || err?.message || "No se pudo guardar el rol.");
    } finally {
      setLoading(false);
    }
  };

  const handlePermisoChange = (nextValue) => {
    setPermisoId(nextValue);

    if (fieldErrors.permisoId) {
      setFieldErrors((prev) => ({
        ...prev,
        permisoId: validateRolField("permisoId", nextValue),
      }));
    }
  };

  const handlePermisoAction = async (mode) => {
    if (!isEditMode) return;

    const permisoError = validateRolField("permisoId", permisoId);
    setFieldErrors((prev) => ({
      ...prev,
      permisoId: permisoError,
    }));

    if (permisoError) {
      return;
    }

    const parsedId = Number(permisoId);
    setLoading(true);
    setError(null);
    setSuccess(null);
    try {
      if (mode === "assign") {
        await assignPermisoToRol(id, parsedId);
        setSuccess("Permiso enviado al backend correctamente.");
      } else {
        await removePermisoFromRol(id, parsedId);
        setSuccess("Permiso removido correctamente.");
      }
      setPermisoId("");
      setFieldErrors((prev) => ({
        ...prev,
        permisoId: "",
      }));
    } catch (err) {
      setError(err?.response?.data?.message || "No se pudo actualizar el permiso del rol.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <form className={styles.page} onSubmit={handleSubmit} noValidate>
      <div className={styles.topBar}>
        <h2>{isEditMode ? "Editar Rol" : "Nuevo Rol"}</h2>
        <button type="button" className={styles.btnSecondary} onClick={() => navigate("/admin/roles")}>
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
        <h3 className={styles.sectionTitle}>Datos del rol</h3>
        <div className={styles.grid2}>
          <div className={getFieldClassName(styles.field, fieldErrors.nombre_rol)}>
            <label htmlFor="rol-nombre">Nombre</label>
            <input
              id="rol-nombre"
              name="nombre_rol"
              maxLength={MAX_LENGTHS.rol.nombre}
              value={form.nombre_rol}
              onChange={handleChange}
              onBlur={handleBlur}
              aria-invalid={Boolean(fieldErrors.nombre_rol)}
              aria-describedby={buildDescribedBy(
                "rol-nombre-help",
                "rol-nombre-counter",
                fieldErrors.nombre_rol ? "rol-nombre-error" : null
              )}
            />
            <div className={styles.fieldMeta}>
              <span id="rol-nombre-help" className={styles.helpText}>
                Nombre visible del rol. Maximo {MAX_LENGTHS.rol.nombre} caracteres.
              </span>
              <span id="rol-nombre-counter" className={styles.counterText}>
                {getCounterText(form.nombre_rol, MAX_LENGTHS.rol.nombre)}
              </span>
            </div>
            {fieldErrors.nombre_rol && (
              <span id="rol-nombre-error" className={styles.errorText} role="alert">
                {fieldErrors.nombre_rol}
              </span>
            )}
          </div>

          {isEditMode && (
            <div className={getFieldClassName(styles.field, fieldErrors.estado_rol)}>
              <label htmlFor="rol-estado">Estado</label>
              <select
                id="rol-estado"
                name="estado_rol"
                value={form.estado_rol}
                onChange={handleChange}
                onBlur={handleBlur}
                aria-invalid={Boolean(fieldErrors.estado_rol)}
                aria-describedby={buildDescribedBy(
                  "rol-estado-help",
                  fieldErrors.estado_rol ? "rol-estado-error" : null
                )}
              >
                {ROLE_STATES.map((estado) => (
                  <option key={estado} value={estado}>
                    {trimText(estado)}
                  </option>
                ))}
              </select>
              <span id="rol-estado-help" className={styles.helpText}>
                Usa ACT para roles disponibles e INA para ocultarlos del uso normal.
              </span>
              {fieldErrors.estado_rol && (
                <span id="rol-estado-error" className={styles.errorText} role="alert">
                  {fieldErrors.estado_rol}
                </span>
              )}
            </div>
          )}

          <div className={getFieldClassName(styles.fieldFull, fieldErrors.descripcion_rol)}>
            <label htmlFor="rol-descripcion">Descripcion</label>
            <textarea
              id="rol-descripcion"
              name="descripcion_rol"
              maxLength={MAX_LENGTHS.rol.descripcion}
              value={form.descripcion_rol}
              onChange={handleChange}
              onBlur={handleBlur}
              rows={4}
              aria-invalid={Boolean(fieldErrors.descripcion_rol)}
              aria-describedby={buildDescribedBy(
                "rol-descripcion-help",
                "rol-descripcion-counter",
                fieldErrors.descripcion_rol ? "rol-descripcion-error" : null
              )}
            />
            <div className={styles.fieldMeta}>
              <span id="rol-descripcion-help" className={styles.helpText}>
                Resume el alcance del rol y cuando debe usarse.
              </span>
              <span id="rol-descripcion-counter" className={styles.counterText}>
                {getCounterText(form.descripcion_rol, MAX_LENGTHS.rol.descripcion)}
              </span>
            </div>
            {fieldErrors.descripcion_rol && (
              <span id="rol-descripcion-error" className={styles.errorText} role="alert">
                {fieldErrors.descripcion_rol}
              </span>
            )}
          </div>
        </div>
      </section>

      {isEditMode && (
        <section className={styles.card}>
          <h3 className={styles.sectionTitle}>Permisos</h3>
          <div className={styles.grid2}>
            <div className={getFieldClassName(styles.field, fieldErrors.permisoId)}>
              <label htmlFor="rol-permiso-select">Permiso</label>
              <select
                id="rol-permiso-select"
                value={permisoId}
                onChange={(event) => handlePermisoChange(event.target.value)}
                onBlur={(event) =>
                  setFieldErrors((prev) => ({
                    ...prev,
                    permisoId: validateRolField("permisoId", event.target.value),
                  }))
                }
                aria-invalid={Boolean(fieldErrors.permisoId)}
                aria-describedby={buildDescribedBy(
                  "rol-permiso-help",
                  fieldErrors.permisoId ? "rol-permiso-error" : null
                )}
              >
                <option value="">Selecciona un permiso</option>
                {permisos.map((permiso) => {
                  const optionValue =
                    typeof permiso === "string" ? trimText(permiso) : String(permiso);
                  return (
                    <option key={optionValue} value={optionValue}>
                      {optionValue}
                    </option>
                  );
                })}
              </select>
              <span id="rol-permiso-help" className={styles.helpText}>
                Selecciona un permiso del catalogo o escribe el ID manualmente.
              </span>
              {fieldErrors.permisoId && (
                <span id="rol-permiso-error" className={styles.errorText} role="alert">
                  {fieldErrors.permisoId}
                </span>
              )}
            </div>

            <div className={getFieldClassName(styles.field, fieldErrors.permisoId)}>
              <label htmlFor="rol-permiso-manual">ID permiso manual</label>
              <input
                id="rol-permiso-manual"
                type="number"
                min="1"
                value={permisoId}
                onChange={(event) => handlePermisoChange(event.target.value)}
                onBlur={(event) =>
                  setFieldErrors((prev) => ({
                    ...prev,
                    permisoId: validateRolField("permisoId", event.target.value),
                  }))
                }
                placeholder="Ej. 1"
                inputMode="numeric"
                aria-invalid={Boolean(fieldErrors.permisoId)}
                aria-describedby={buildDescribedBy(
                  "rol-permiso-manual-help",
                  fieldErrors.permisoId ? "rol-permiso-error" : null
                )}
              />
              <span id="rol-permiso-manual-help" className={styles.helpText}>
                Usa este campo cuando el backend ya tiene permisos cargados y el catalogo es parcial.
              </span>
            </div>

            <div className={styles.fieldFull}>
              <span className={styles.helpText}>
                La integracion actual de permisos no cambia: se mantiene la asignacion/remocion por ID
                sin tocar endpoints ni contratos.
              </span>
            </div>
          </div>

          <div className={styles.actions}>
            <button
              type="button"
              className={styles.btnPrimary}
              onClick={() => handlePermisoAction("assign")}
              disabled={loading}
            >
              Asignar permiso
            </button>
            <button
              type="button"
              className={styles.btnWarning}
              onClick={() => handlePermisoAction("remove")}
              disabled={loading}
            >
              Quitar permiso
            </button>
          </div>
        </section>
      )}

      <div className={styles.actions}>
        <button type="button" className={styles.btnSecondary} onClick={() => navigate("/admin/roles")}>
          Cancelar
        </button>
        <button type="submit" className={styles.btnPrimary} disabled={loading}>
          {loading ? "Guardando..." : "Guardar"}
        </button>
      </div>
    </form>
  );
}

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
            nombre_rol: rol.nombreRol ?? "",
            descripcion_rol: rol.descripcionRol ?? "",
            estado_rol: rol.estadoRol ?? "ACT",
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
  };

  const handleSubmit = async (event) => {
    event.preventDefault();
    setLoading(true);
    setError(null);
    setSuccess(null);
    try {
      const nombreRol = form.nombre_rol.trim();
      const descripcionRol = form.descripcion_rol.trim();

      if (!nombreRol) {
        throw new Error("El nombre del rol es obligatorio.");
      }
      if (nombreRol.length > MAX_LENGTHS.rol.nombre) {
        throw new Error(`El nombre del rol no puede exceder ${MAX_LENGTHS.rol.nombre} caracteres.`);
      }
      if (descripcionRol.length > MAX_LENGTHS.rol.descripcion) {
        throw new Error(
          `La descripción no puede exceder ${MAX_LENGTHS.rol.descripcion} caracteres.`
        );
      }
      if (isEditMode && !ROLE_STATES.includes(form.estado_rol)) {
        throw new Error(`Estado de rol inválido. Usa: ${ROLE_STATES.join(", ")}.`);
      }

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

  const handlePermisoAction = async (mode) => {
    if (!isEditMode) return;

    const parsedId = Number(permisoId);
    if (!Number.isInteger(parsedId) || parsedId <= 0) {
      setError("Ingresa un ID de permiso válido.");
      return;
    }

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
    } catch (err) {
      setError(err?.response?.data?.message || "No se pudo actualizar el permiso del rol.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <form className={styles.page} onSubmit={handleSubmit}>
      <div className={styles.topBar}>
        <h2>{isEditMode ? "Editar Rol" : "Nuevo Rol"}</h2>
        <button type="button" className={styles.btnSecondary} onClick={() => navigate("/admin/roles")}>
          Volver
        </button>
      </div>

      {error && <div className={styles.errorBox}>{error}</div>}
      {success && <div className={styles.successBox}>{success}</div>}

      <section className={styles.card}>
        <h3 className={styles.sectionTitle}>Datos del rol</h3>
        <div className={styles.grid2}>
          <div className={styles.field}>
            <label>Nombre</label>
            <input
              name="nombre_rol"
              maxLength={MAX_LENGTHS.rol.nombre}
              value={form.nombre_rol}
              onChange={handleChange}
              required
            />
          </div>
          {isEditMode && (
            <div className={styles.field}>
              <label>Estado</label>
              <select name="estado_rol" value={form.estado_rol} onChange={handleChange}>
                {ROLE_STATES.map((estado) => (
                  <option key={estado} value={estado}>
                    {estado}
                  </option>
                ))}
              </select>
            </div>
          )}
          <div className={styles.fieldFull}>
            <label>Descripción</label>
            <textarea
              name="descripcion_rol"
              maxLength={MAX_LENGTHS.rol.descripcion}
              value={form.descripcion_rol}
              onChange={handleChange}
              rows={4}
            />
          </div>
        </div>
      </section>

      {isEditMode && (
        <section className={styles.card}>
          <h3 className={styles.sectionTitle}>Permisos</h3>
          <div className={styles.grid2}>
            <div className={styles.field}>
              <label>Permiso</label>
              <select value={permisoId} onChange={(event) => setPermisoId(event.target.value)}>
                <option value="">Selecciona un permiso</option>
                {permisos.map((permiso) => (
                  <option key={permiso} value={permiso}>
                    {permiso}
                  </option>
                ))}
              </select>
            </div>
            <div className={styles.field}>
              <label>ID permiso manual</label>
              <input
                type="number"
                min="1"
                value={permisoId}
                onChange={(event) => setPermisoId(event.target.value)}
                placeholder="Ej. 1"
              />
            </div>
            <div className={styles.fieldFull}>
              <span className={styles.helpText}>
                El backend actual expone asignación/remoción, pero el catálogo de permisos todavía es
                un stub. Puedes usar un ID manual si tu entorno ya tiene permisos cargados.
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

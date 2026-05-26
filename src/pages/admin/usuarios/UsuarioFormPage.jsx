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

export default function UsuarioFormPage() {
  const navigate = useNavigate();
  const { id } = useParams();
  const isEditMode = Boolean(id);

  const [form, setForm] = useState(EMPTY_FORM);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(null);
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

        if (!item) return;

        setForm({
          username: item.username ?? "",
          nombres: item.nombres ?? "",
          apellidos: item.apellidos ?? "",
          correo: item.correo ?? "",
          password: "",
          estado_usuario: item.estadoUsuario ?? "ACT",
          row_version: item.rowVersion ?? null,
        });
        setRolesCatalog(Array.isArray(catalogRoles) ? catalogRoles : []);
        setAssignedRoles(Array.isArray(usuarioRoles) ? usuarioRoles : []);
      } catch (err) {
        setError(err?.response?.data?.message || "Error al cargar el registro");
      } finally {
        setLoading(false);
      }
    };
    loadData();
  }, [id]);

  useEffect(() => {
    if (!isEditMode) {
      getRoles()
        .then((response) => {
          setRolesCatalog(Array.isArray(response) ? response : []);
        })
        .catch(() => {});
    }
  }, [isEditMode]);

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    if ((name === "nombres" || name === "apellidos") && value && !PERSON_NAME_REGEX.test(value)) {
      return;
    }
    setForm((prev) => ({ ...prev, [name]: type === "checkbox" ? checked : value }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError(null);
    setSuccess(null);
    try {
      const username = form.username.trim();
      const nombres = form.nombres.trim();
      const apellidos = form.apellidos.trim();
      const correo = form.correo.trim();
      const password = form.password.trim();

      if (!isEditMode && !username) {
        throw new Error("El username es obligatorio.");
      }
      if (username && username.length > MAX_LENGTHS.usuario.username) {
        throw new Error("El username no puede exceder 15 caracteres.");
      }
      if (!nombres) {
        throw new Error("Los nombres son obligatorios.");
      }
      if (
        nombres.length > MAX_LENGTHS.usuario.nombres ||
        apellidos.length > MAX_LENGTHS.usuario.apellidos
      ) {
        throw new Error("Nombres y apellidos no pueden exceder 30 caracteres.");
      }
      if (
        !PERSON_NAME_REGEX.test(nombres) ||
        (apellidos && !PERSON_NAME_REGEX.test(apellidos))
      ) {
        throw new Error("Nombres y apellidos solo pueden contener letras.");
      }
      if (!correo) {
        throw new Error("El correo es obligatorio.");
      }
      if (correo.length > MAX_LENGTHS.usuario.correo) {
        throw new Error("El correo no puede exceder 120 caracteres.");
      }
      if (!EMAIL_REGEX.test(correo)) {
        throw new Error("El correo no tiene un formato válido.");
      }
      if (!isEditMode && !password) {
        throw new Error("La contraseña es obligatoria para crear usuario.");
      }
      if (password && password.length > 200) {
        throw new Error("La contraseña no puede exceder 200 caracteres.");
      }

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
    if (!id || !selectedRolGuid) {
      setError("Selecciona un rol para asignarlo.");
      return;
    }
    setLoading(true);
    setError(null);
    setSuccess(null);
    try {
      await asignarRolUsuario(id, selectedRolGuid);
      await refreshUserRoles();
      setSelectedRolGuid("");
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
    <form className={styles.page} onSubmit={handleSubmit}>
      <div className={styles.topBar}>
        <h2>{isEditMode ? "Editar Usuario" : "Nuevo Usuario"}</h2>
        <button type="button" className={styles.btnSecondary} onClick={() => navigate("/admin/usuarios")}>
          Volver
        </button>
      </div>

      {error && <div className={styles.errorBox}>{error}</div>}
      {success && <div className={styles.successBox}>{success}</div>}

      <section className={styles.card}>
        <h3 className={styles.sectionTitle}>Datos del Usuario</h3>
        <div className={styles.grid2}>
          <div className={styles.field}><label>Username</label><input name="username" maxLength={15} value={form.username} onChange={handleChange} required /></div>
          <div className={styles.field}><label>Nombres</label><input name="nombres" maxLength={30} value={form.nombres} onChange={handleChange} required /></div>
          <div className={styles.field}><label>Apellidos</label><input name="apellidos" maxLength={30} value={form.apellidos} onChange={handleChange} /></div>
          <div className={styles.field}><label>Correo</label><input type="email" name="correo" maxLength={120} value={form.correo} onChange={handleChange} required /></div>
          {!isEditMode && (
            <div className={styles.field}>
              <label>Password</label>
              <input
                type="password"
                name="password"
                maxLength={200}
                value={form.password}
                onChange={handleChange}
                required
              />
            </div>
          )}
          {isEditMode && (
            <div className={styles.field}>
              <label>Estado</label>
              <select
                name="estado_usuario"
                value={form.estado_usuario}
                onChange={handleChange}
              >
                {USER_STATES.map((estado) => (
                  <option key={estado} value={estado}>
                    {estado}
                  </option>
                ))}
              </select>
            </div>
          )}
          {isEditMode && (
            <div className={styles.fieldFull}>
              <span className={styles.helpText}>
                La contraseña no se actualiza desde este formulario. Usa la vista
                de cambiar password para el usuario autenticado.
              </span>
            </div>
          )}
        </div>
      </section>

      {isEditMode && (
        <section className={styles.card}>
          <h3 className={styles.sectionTitle}>Roles asignados</h3>
          <div className={styles.grid2}>
            <div className={styles.field}>
              <label>Rol disponible</label>
              <select
                value={selectedRolGuid}
                onChange={(event) => setSelectedRolGuid(event.target.value)}
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
                      {rol.nombreRol}
                    </option>
                  ))}
              </select>
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
                    <td>{rol.nombreRol}</td>
                    <td>{rol.estadoRol}</td>
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
        <button type="button" className={styles.btnSecondary} onClick={() => navigate("/admin/usuarios")}>Cancelar</button>
        <button type="submit" className={styles.btnPrimary} disabled={loading}>{loading ? "Guardando..." : "Guardar"}</button>
      </div>
    </form>
  );
}

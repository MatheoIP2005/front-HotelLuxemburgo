import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { deleteRol, getRoles, inhabilitarRol } from "../../../services/roles.service";
import styles from "../usuarios/UsuariosPage.module.css";

export default function RolesPage() {
  const navigate = useNavigate();
  const [roles, setRoles] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [actionError, setActionError] = useState(null);

  const loadRoles = async () => {
    setLoading(true);
    setError(null);
    try {
      const response = await getRoles();
      setRoles(Array.isArray(response) ? response : []);
    } catch (err) {
      setError(err?.response?.data?.message || "No se pudieron cargar los roles.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    void loadRoles();
  }, []);

  const onDelete = async (rolGuid) => {
    if (!window.confirm("¿Deseas eliminar este rol?")) return;
    setActionError(null);
    try {
      await deleteRol(rolGuid);
      await loadRoles();
    } catch (err) {
      setActionError(err?.response?.data?.message || "No se pudo eliminar el rol.");
    }
  };

  const onInhabilitar = async (rolGuid) => {
    if (!window.confirm("¿Deseas inhabilitar este rol?")) return;
    setActionError(null);
    try {
      await inhabilitarRol(rolGuid);
      await loadRoles();
    } catch (err) {
      setActionError(err?.response?.data?.message || "No se pudo inhabilitar el rol.");
    }
  };

  return (
    <div className={styles.page}>
      <div className={styles.topBar}>
        <h2>Roles</h2>
        <button
          type="button"
          className={styles.btnPrimary}
          onClick={() => navigate("/admin/roles/nuevo")}
        >
          Nuevo Rol
        </button>
      </div>

      {(error || actionError) && <div className={styles.errorBox}>{actionError || error}</div>}

      <div className={styles.tableWrapper}>
        <table className={styles.table}>
          <thead>
            <tr>
              <th>Nombre</th>
              <th>Descripción</th>
              <th>Estado</th>
              <th>Activo</th>
              <th>Acciones</th>
            </tr>
          </thead>
          <tbody>
            {loading && (
              <tr>
                <td colSpan={5} className={styles.loadingMsg}>
                  Cargando...
                </td>
              </tr>
            )}
            {!loading && roles.length === 0 && (
              <tr>
                <td colSpan={5} className={styles.emptyMsg}>
                  No hay roles registrados.
                </td>
              </tr>
            )}
            {!loading &&
              roles.map((rol) => (
                <tr key={rol.rolGuid}>
                  <td>{rol.nombreRol}</td>
                  <td>{rol.descripcionRol || "-"}</td>
                  <td>{rol.estadoRol}</td>
                  <td>{rol.activo ? "Sí" : "No"}</td>
                  <td>
                    <div className={styles.actions}>
                      <button
                        type="button"
                        className={styles.btnPrimary}
                        onClick={() => navigate(`/admin/roles/${rol.rolGuid}`)}
                      >
                        Editar
                      </button>
                      {rol.estadoRol === "ACT" && (
                        <button
                          type="button"
                          className={styles.btnWarning}
                          onClick={() => onInhabilitar(rol.rolGuid)}
                        >
                          Inhabilitar
                        </button>
                      )}
                      <button
                        type="button"
                        className={styles.btnDanger}
                        onClick={() => onDelete(rol.rolGuid)}
                      >
                        Eliminar
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

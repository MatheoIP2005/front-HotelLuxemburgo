import { useState } from "react";
import { useNavigate } from "react-router-dom";
import useUsuarios from "../../../hooks/useUsuarios";
import styles from "./UsuariosPage.module.css";

export default function UsuariosPage() {
  const navigate = useNavigate();
  const { usuarios, loading, error, handleDelete, handleInhabilitar } = useUsuarios();
  const [actionError, setActionError] = useState(null);

  const onDelete = async (id) => {
    if (!window.confirm("¿Estás seguro de eliminar este usuario?")) return;
    setActionError(null);
    try {
      await handleDelete(id);
    } catch (err) {
      setActionError(err?.response?.data?.message || "No se pudo eliminar el usuario.");
    }
  };

  const onInhabilitar = async (id) => {
    const motivo = window.prompt("Motivo de inhabilitación:");
    const motivoNormalizado = String(motivo ?? "").trim();
    if (!motivoNormalizado) return;
    if (motivoNormalizado.length > 150) {
      setActionError("El motivo de inhabilitación no puede exceder 150 caracteres.");
      return;
    }
    setActionError(null);
    try {
      await handleInhabilitar(id, motivoNormalizado);
    } catch (err) {
      setActionError(err?.response?.data?.message || "No se pudo inhabilitar el usuario.");
    }
  };

  return (
    <div className={styles.page}>
      <div className={styles.topBar}>
        <h2>Usuarios</h2>
        <button
          type="button"
          className={styles.btnPrimary}
          onClick={() => navigate("/admin/usuarios/nuevo")}
        >
          Nuevo Usuario
        </button>
      </div>

      {(error || actionError) && <div className={styles.errorBox}>{actionError || error}</div>}

      <div className={styles.tableWrapper}>
        <table className={styles.table}>
          <thead>
            <tr>
              <th>Username</th>
              <th>Nombres</th>
              <th>Correo</th>
              <th>Estado</th>
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
            {!loading && usuarios.length === 0 && (
              <tr>
                <td colSpan={5} className={styles.emptyMsg}>
                  No hay registros
                </td>
              </tr>
            )}
            {!loading &&
              usuarios.map((u) => (
                <tr key={u.usuarioGuid}>
                  <td>{u.username}</td>
                  <td>{`${u.nombres} ${u.apellidos ?? ""}`.trim()}</td>
                  <td>{u.correo}</td>
                  <td>
                    <span
                      className={`${styles.badge} ${
                        u.estadoUsuario === "ACT"
                          ? styles.badgeActive
                          : styles.badgeInactive
                      }`}
                    >
                      {u.estadoUsuario}
                    </span>
                  </td>
                  <td>
                    <div className={styles.actions}>
                      <button
                        type="button"
                        className={styles.btnPrimary}
                        onClick={() => navigate(`/admin/usuarios/${u.usuarioGuid}`)}
                      >
                        Editar
                      </button>
                      {u.estadoUsuario === "ACT" && (
                        <button
                          type="button"
                          className={styles.btnWarning}
                          onClick={() => onInhabilitar(u.usuarioGuid)}
                        >
                          Inhabilitar
                        </button>
                      )}
                      <button
                        type="button"
                        className={styles.btnDanger}
                        onClick={() => onDelete(u.usuarioGuid)}
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

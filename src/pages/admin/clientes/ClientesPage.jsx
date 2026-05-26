import { useState } from "react";
import { useNavigate } from "react-router-dom";
import useClientes from "../../../hooks/useClientes";
import styles from "./ClientesPage.module.css";

export default function ClientesPage() {
  const navigate = useNavigate();
  const { clientes, loading, error, handleDelete, handleInhabilitar } = useClientes();
  const [actionError, setActionError] = useState(null);

  const onDelete = async (id) => {
    if (!window.confirm("¿Estás seguro de eliminar este cliente?")) return;
    setActionError(null);
    try {
      await handleDelete(id);
    } catch (err) {
      setActionError(err?.response?.data?.message || "No se pudo eliminar el cliente.");
    }
  };

  const onInhabilitar = async (id) => {
    if (!window.confirm("¿Deseas inhabilitar este cliente?")) return;
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
      setActionError(err?.response?.data?.message || "No se pudo inhabilitar el cliente.");
    }
  };

  return (
    <div className={styles.page}>
      <div className={styles.topBar}>
        <h2>Clientes</h2>
        <button
          type="button"
          className={styles.btnPrimary}
          onClick={() => navigate("/admin/clientes/nuevo")}
        >
          Nuevo Cliente
        </button>
      </div>

      {(error || actionError) && <div className={styles.errorBox}>{actionError || error}</div>}

      <div className={styles.tableWrapper}>
        <table className={styles.table}>
          <thead>
            <tr>
              <th>Identificación</th>
              <th>Nombres</th>
              <th>Correo</th>
              <th>Teléfono</th>
              <th>Estado</th>
              <th>Acciones</th>
            </tr>
          </thead>
          <tbody>
            {loading && (
              <tr>
                <td colSpan={6} className={styles.loadingMsg}>
                  Cargando...
                </td>
              </tr>
            )}
            {!loading && clientes.length === 0 && (
              <tr>
                <td colSpan={6} className={styles.emptyMsg}>
                  No hay registros
                </td>
              </tr>
            )}
            {!loading &&
              clientes.map((c) => (
                <tr key={c.clienteGuid}>
                  <td>{`${c.tipoIdentificacion}: ${c.numeroIdentificacion}`}</td>
                  <td>{`${c.nombres} ${c.apellidos ?? ""}`.trim()}</td>
                  <td>{c.correo}</td>
                  <td>{c.telefono}</td>
                  <td>
                    <span
                      className={`${styles.badge} ${
                        c.estado === "ACT" ? styles.badgeActive : styles.badgeInactive
                      }`}
                    >
                      {c.estado}
                    </span>
                  </td>
                  <td>
                    <div className={styles.actions}>
                      <button
                        type="button"
                        className={styles.btnPrimary}
                        onClick={() => navigate(`/admin/clientes/${c.clienteGuid}`)}
                      >
                        Editar
                      </button>
                      {c.estado === "ACT" && (
                        <button
                          type="button"
                          className={styles.btnWarning}
                          onClick={() => onInhabilitar(c.clienteGuid)}
                        >
                          Inhabilitar
                        </button>
                      )}
                      <button
                        type="button"
                        className={styles.btnDanger}
                        onClick={() => onDelete(c.clienteGuid)}
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

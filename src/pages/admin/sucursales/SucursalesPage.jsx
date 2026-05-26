import { useState } from "react";
import { useNavigate } from "react-router-dom";
import useSucursales from "../../../hooks/useSucursales";
import styles from "./SucursalesPage.module.css";

export default function SucursalesPage() {
  const navigate = useNavigate();
  const { sucursales, loading, error, handleDelete, handleInhabilitar } =
    useSucursales();
  const [actionError, setActionError] = useState(null);

  const onDelete = async (guid) => {
    const confirmed = window.confirm(
      "¿Estás seguro de eliminar esta sucursal?"
    );

    if (!confirmed) return;

    setActionError(null);
    try {
      await handleDelete(guid);
    } catch (err) {
      setActionError(err?.response?.data?.message || "No se pudo eliminar la sucursal.");
    }
  };

  const onInhabilitar = async (guid) => {
    const confirmed = window.confirm("¿Deseas inhabilitar esta sucursal?");
    if (!confirmed) return;
    setActionError(null);
    try {
      await handleInhabilitar(guid);
    } catch (err) {
      setActionError(err?.response?.data?.message || "No se pudo inhabilitar la sucursal.");
    }
  };

  return (
    <div className={styles.page}>
      <div className={styles.topBar}>
        <h2>Sucursales</h2>
        <button
          type="button"
          className={styles.btnPrimary}
          onClick={() => navigate("/admin/sucursales/nueva")}
        >
          Nueva Sucursal
        </button>
      </div>

      {(error || actionError) && <div className={styles.errorBox}>{actionError || error}</div>}

      <div className={styles.tableWrapper}>
        <table className={styles.table}>
          <thead>
            <tr>
              <th>Código</th>
              <th>Nombre</th>
              <th>Tipo</th>
              <th>Ciudad</th>
              <th>Estrellas</th>
              <th>Estado</th>
              <th>Acciones</th>
            </tr>
          </thead>
          <tbody>
            {loading && (
              <tr>
                <td colSpan={7} className={styles.loadingMsg}>
                  Cargando...
                </td>
              </tr>
            )}

            {!loading && sucursales.length === 0 && (
              <tr>
                <td colSpan={7} className={styles.emptyMsg}>
                  No hay sucursales registradas
                </td>
              </tr>
            )}

            {!loading &&
              sucursales.map((s) => (
                <tr key={s.sucursalGuid}>
                  <td>{s.codigoSucursal}</td>
                  <td>{s.nombreSucursal}</td>
                  <td>{s.tipoAlojamiento}</td>
                  <td>{s.ciudad}</td>
                  <td>{s.estrellas ?? "N/A"}</td>
                  <td>
                    <span
                      className={`${styles.badge} ${
                        s.estadoSucursal === "ACT"
                          ? styles.badgeActive
                          : styles.badgeInactive
                      }`}
                    >
                      {s.estadoSucursal}
                    </span>
                  </td>
                  <td>
                    <div className={styles.actions}>
                      <button
                        type="button"
                        className={styles.btnPrimary}
                        onClick={() =>
                          navigate(`/admin/sucursales/${s.sucursalGuid}`)
                        }
                      >
                        Editar
                      </button>
                      {s.estadoSucursal === "ACT" && (
                        <button
                          type="button"
                          className={styles.btnWarning}
                          onClick={() => onInhabilitar(s.sucursalGuid)}
                        >
                          Inhabilitar
                        </button>
                      )}
                      <button
                        type="button"
                        className={styles.btnDanger}
                        onClick={() => onDelete(s.sucursalGuid)}
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

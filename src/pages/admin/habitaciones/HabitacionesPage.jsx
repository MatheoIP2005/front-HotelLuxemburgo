import { useState } from "react";
import { useNavigate } from "react-router-dom";
import useHabitaciones from "../../../hooks/useHabitaciones";
import styles from "./HabitacionesPage.module.css";

export default function HabitacionesPage() {
  const navigate = useNavigate();
  const { habitaciones, loading, error, handleDelete, handleCambiarEstado } = useHabitaciones();
  const [actionError, setActionError] = useState(null);

  const onDelete = async (id) => {
    if (!window.confirm("¿Estás seguro de eliminar esta habitación?")) return;
    setActionError(null);
    try {
      await handleDelete(id);
    } catch (err) {
      setActionError(err?.response?.data?.message || "No se pudo eliminar la habitación.");
    }
  };

  const onCambiarEstado = async (id, estado) => {
    setActionError(null);
    try {
      await handleCambiarEstado(id, estado);
    } catch (err) {
      setActionError(err?.response?.data?.message || "No se pudo cambiar el estado de la habitación.");
    }
  };

  return (
    <div className={styles.page}>
      <div className={styles.topBar}>
        <h2>Habitaciones</h2>
        <button
          type="button"
          className={styles.btnPrimary}
          onClick={() => navigate("/admin/habitaciones/nueva")}
        >
          Nueva Habitación
        </button>
      </div>

      {(error || actionError) && <div className={styles.errorBox}>{actionError || error}</div>}

      <div className={styles.tableWrapper}>
        <table className={styles.table}>
          <thead>
            <tr>
              <th>Número</th>
              <th>Piso</th>
              <th>Precio Base</th>
              <th>Capacidad</th>
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
            {!loading && habitaciones.length === 0 && (
              <tr>
                <td colSpan={6} className={styles.emptyMsg}>
                  No hay registros
                </td>
              </tr>
            )}
            {!loading &&
              habitaciones.map((h) => (
                <tr key={h.habitacionGuid}>
                  <td>{h.numeroHabitacion}</td>
                  <td>{h.piso ?? "N/A"}</td>
                  <td>${h.precioBase}</td>
                  <td>{`${h.tipoCapacidadAdultos ?? 0}A / ${h.tipoCapacidadNinos ?? 0}N`}</td>
                  <td>
                    <span
                      className={`${styles.badge} ${
                        h.estadoHabitacion === "DIS"
                          ? styles.badgeActive
                          : styles.badgeInactive
                      }`}
                    >
                      {h.estadoHabitacion}
                    </span>
                  </td>
                  <td>
                    <div className={styles.actions}>
                      <button
                        type="button"
                        className={styles.btnPrimary}
                        onClick={() => navigate(`/admin/habitaciones/${h.habitacionGuid}`)}
                      >
                        Editar
                      </button>
                      {h.estadoHabitacion !== "DIS" && (
                        <button
                          type="button"
                          className={styles.btnWarning}
                          onClick={() => onCambiarEstado(h.habitacionGuid, "DIS")}
                        >
                          Marcar DISPONIBLE
                        </button>
                      )}
                      {h.estadoHabitacion !== "MNT" && (
                        <button
                          type="button"
                          className={styles.btnWarning}
                          onClick={() => onCambiarEstado(h.habitacionGuid, "MNT")}
                        >
                          Marcar MANTENIMIENTO
                        </button>
                      )}
                      <button
                        type="button"
                        className={styles.btnDanger}
                        onClick={() => onDelete(h.habitacionGuid)}
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

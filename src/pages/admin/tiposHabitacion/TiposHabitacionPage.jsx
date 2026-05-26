import { useState } from "react";
import { useNavigate } from "react-router-dom";
import useTiposHabitacion from "../../../hooks/useTiposHabitacion";
import styles from "./TiposHabitacionPage.module.css";

export default function TiposHabitacionPage() {
  const navigate = useNavigate();
  const { tiposHabitacion, loading, error, handleDelete } = useTiposHabitacion();
  const [actionError, setActionError] = useState(null);

  const onDelete = async (id) => {
    if (!window.confirm("¿Estás seguro de eliminar este tipo de habitación?")) return;
    setActionError(null);
    try {
      await handleDelete(id);
    } catch (err) {
      setActionError(
        err?.response?.data?.message || "No se pudo eliminar el tipo de habitación."
      );
    }
  };

  return (
    <div className={styles.page}>
      <div className={styles.topBar}>
        <h2>Tipos de Habitación</h2>
        <button
          type="button"
          className={styles.btnPrimary}
          onClick={() => navigate("/admin/tipos-habitacion/nuevo")}
        >
          Nuevo Tipo
        </button>
      </div>

      {(error || actionError) && <div className={styles.errorBox}>{actionError || error}</div>}

      <div className={styles.tableWrapper}>
        <table className={styles.table}>
          <thead>
            <tr>
              <th>Código</th>
              <th>Nombre</th>
              <th>Capacidad Adultos</th>
              <th>Capacidad Niños</th>
              <th>Tipo Cama</th>
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
            {!loading && tiposHabitacion.length === 0 && (
              <tr>
                <td colSpan={7} className={styles.emptyMsg}>
                  No hay registros
                </td>
              </tr>
            )}
            {!loading &&
              tiposHabitacion.map((t) => (
                <tr key={t.tipoHabitacionGuid}>
                  <td>{t.codigoTipoHabitacion}</td>
                  <td>{t.nombreTipoHabitacion}</td>
                  <td>{t.capacidadAdultos}</td>
                  <td>{t.capacidadNinos}</td>
                  <td>{t.tipoCama ?? "N/A"}</td>
                  <td>
                    <span
                      className={`${styles.badge} ${
                        t.estadoTipoHabitacion === "ACT"
                          ? styles.badgeActive
                          : styles.badgeInactive
                      }`}
                    >
                      {t.estadoTipoHabitacion}
                    </span>
                  </td>
                  <td>
                    <div className={styles.actions}>
                      <button
                        type="button"
                        className={styles.btnPrimary}
                        onClick={() =>
                          navigate(`/admin/tipos-habitacion/${t.tipoHabitacionGuid}`)
                        }
                      >
                        Editar
                      </button>
                      <button
                        type="button"
                        className={styles.btnDanger}
                        onClick={() => onDelete(t.tipoHabitacionGuid)}
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

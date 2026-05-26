import { useState } from "react";
import { useNavigate } from "react-router-dom";
import useTarifas from "../../../hooks/useTarifas";
import styles from "./TarifasPage.module.css";

export default function TarifasPage() {
  const navigate = useNavigate();
  const { tarifas, loading, error, handleDelete, handleDesactivar } = useTarifas();
  const [actionError, setActionError] = useState(null);

  const onDelete = async (id) => {
    if (!window.confirm("¿Estás seguro de eliminar esta tarifa?")) return;
    setActionError(null);
    try {
      await handleDelete(id);
    } catch (err) {
      setActionError(err?.response?.data?.message || "No se pudo eliminar la tarifa.");
    }
  };

  const onDesactivar = async (id) => {
    if (!window.confirm("¿Deseas desactivar esta tarifa?")) return;
    setActionError(null);
    try {
      await handleDesactivar(id);
    } catch (err) {
      setActionError(err?.response?.data?.message || "No se pudo desactivar la tarifa.");
    }
  };

  return (
    <div className={styles.page}>
      <div className={styles.topBar}>
        <h2>Tarifas</h2>
        <button
          type="button"
          className={styles.btnPrimary}
          onClick={() => navigate("/admin/tarifas/nueva")}
        >
          Nueva Tarifa
        </button>
      </div>

      {(error || actionError) && <div className={styles.errorBox}>{actionError || error}</div>}

      <div className={styles.tableWrapper}>
        <table className={styles.table}>
          <thead>
            <tr>
              <th>Código</th>
              <th>Nombre</th>
              <th>Canal</th>
              <th>Precio/Noche</th>
              <th>Vigencia</th>
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
            {!loading && tarifas.length === 0 && (
              <tr>
                <td colSpan={7} className={styles.emptyMsg}>
                  No hay registros
                </td>
              </tr>
            )}
            {!loading &&
              tarifas.map((t) => (
                <tr key={t.tarifaGuid}>
                  <td>{t.codigoTarifa}</td>
                  <td>{t.nombreTarifa}</td>
                  <td>{t.canalTarifa}</td>
                  <td>${t.precioPorNoche}</td>
                  <td>{`${t.fechaInicio} → ${t.fechaFin}`}</td>
                  <td>
                    <span
                      className={`${styles.badge} ${
                        t.estadoTarifa === "ACT"
                          ? styles.badgeActive
                          : styles.badgeInactive
                      }`}
                    >
                      {t.estadoTarifa}
                    </span>
                  </td>
                  <td>
                    <div className={styles.actions}>
                      <button
                        type="button"
                        className={styles.btnPrimary}
                        onClick={() => navigate(`/admin/tarifas/${t.tarifaGuid}`)}
                      >
                        Editar
                      </button>
                      <button
                        type="button"
                        className={styles.btnDanger}
                        onClick={() => onDelete(t.tarifaGuid)}
                      >
                        Eliminar
                      </button>
                      <button
                        type="button"
                        className={styles.btnWarning}
                        onClick={() => onDesactivar(t.tarifaGuid)}
                      >
                        Desactivar
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

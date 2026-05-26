import { useState } from "react";
import useAuditoria from "../../../hooks/useAuditoria";
import styles from "./AuditoriaPage.module.css";

export default function AuditoriaPage() {
  const { auditoria, loading, error, fetchAuditoria } = useAuditoria();
  const [auditoriaGuid, setAuditoriaGuid] = useState("");
  const [actionError, setActionError] = useState(null);

  const getOperacionClass = (operacion) => {
    if (operacion === "INSERT") return styles.badgeActive;
    return styles.badgeInactive;
  };

  const getOperacionStyle = (operacion) => {
    if (operacion === "UPDATE") return { color: "#d48806" };
    return undefined;
  };

  const onBuscar = async () => {
    setActionError(null);
    try {
      if (!auditoriaGuid.trim()) {
        await fetchAuditoria();
        return;
      }
      await fetchAuditoria({ auditoriaGuid: auditoriaGuid.trim() });
    } catch (err) {
      setActionError(err?.response?.data?.message || "No se pudo consultar auditoría.");
    }
  };

  return (
    <div className={styles.page}>
      <div className={styles.topBar}>
        <h2>Auditoría</h2>
        <div>
          <input
            placeholder="GUID auditoría (opcional)"
            value={auditoriaGuid}
            onChange={(e) => setAuditoriaGuid(e.target.value)}
          />
          <button type="button" className={styles.btnWarning} onClick={onBuscar}>
            Buscar
          </button>
        </div>
      </div>

      {(error || actionError) && <div className={styles.errorBox}>{actionError || error}</div>}

      <div className={styles.tableWrapper}>
        <table className={styles.table}>
          <thead>
            <tr>
              <th>Tabla</th>
              <th>Operación</th>
              <th>ID Registro</th>
              <th>Usuario</th>
              <th>IP</th>
              <th>Fecha</th>
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
            {!loading && auditoria.length === 0 && (
              <tr>
                <td colSpan={6} className={styles.emptyMsg}>
                  No hay registros
                </td>
              </tr>
            )}
            {!loading &&
              auditoria.map((a) => (
                <tr key={a.auditoria_guid ?? `${a.fecha_evento_utc}-${a.id_registro_afectado}`}>
                  <td>{a.tabla_afectada}</td>
                  <td>
                    <span
                      className={`${styles.badge} ${getOperacionClass(a.operacion)}`}
                      style={getOperacionStyle(a.operacion)}
                    >
                      {a.operacion}
                    </span>
                  </td>
                  <td>{a.id_registro_afectado ?? "N/A"}</td>
                  <td>{a.usuario_ejecutor}</td>
                  <td>{a.ip_origen ?? "N/A"}</td>
                  <td>{a.fecha_evento_utc}</td>
                </tr>
              ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

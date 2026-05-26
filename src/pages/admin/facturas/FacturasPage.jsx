import { useState } from "react";
import { useNavigate } from "react-router-dom";
import useFacturas from "../../../hooks/useFacturas";
import styles from "./FacturasPage.module.css";

export default function FacturasPage() {
  const navigate = useNavigate();
  const { facturas, loading, error, handleAnular } = useFacturas();
  const [actionError, setActionError] = useState(null);

  const onAnular = async (id) => {
    const motivo = window.prompt("Motivo de anulación:");
    const motivoNormalizado = String(motivo ?? "").trim();
    if (!motivoNormalizado) return;
    if (motivoNormalizado.length > 150) {
      setActionError("El motivo de anulación no puede exceder 150 caracteres.");
      return;
    }
    setActionError(null);
    try {
      await handleAnular(id, motivoNormalizado);
    } catch (err) {
      setActionError(err?.response?.data?.message || "No se pudo anular la factura.");
    }
  };

  return (
    <div className={styles.page}>
      <div className={styles.topBar}>
        <h2>Facturas</h2>
      </div>

      {(error || actionError) && <div className={styles.errorBox}>{actionError || error}</div>}

      <div className={styles.tableWrapper}>
        <table className={styles.table}>
          <thead>
            <tr>
              <th>Número</th>
              <th>Tipo</th>
              <th>Total</th>
              <th>Saldo Pendiente</th>
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
            {!loading && facturas.length === 0 && (
              <tr>
                <td colSpan={6} className={styles.emptyMsg}>
                  No hay registros
                </td>
              </tr>
            )}
            {!loading &&
              facturas.map((f) => (
                <tr key={f.facturaGuid ?? f.guidFactura}>
                  <td>{f.numeroFactura}</td>
                  <td>{f.tipoFactura}</td>
                  <td>${f.total}</td>
                  <td>${f.saldoPendiente}</td>
                  <td>
                    <span
                      className={`${styles.badge} ${
                        f.estado === "EMI" ? styles.badgeActive : styles.badgeInactive
                      }`}
                    >
                      {f.estado}
                    </span>
                  </td>
                  <td>
                    <div className={styles.actions}>
                      <button
                        type="button"
                        className={styles.btnPrimary}
                        onClick={() =>
                          navigate("/admin/pagos/nuevo", {
                            state: { facturaGuid: f.facturaGuid ?? f.guidFactura },
                          })
                        }
                        disabled={Number(f.saldoPendiente ?? 0) <= 0 || f.estado !== "EMI"}
                      >
                        {Number(f.saldoPendiente ?? 0) > 0 ? "Pagar saldo" : "Registrar pago"}
                      </button>
                      {f.estado === "EMI" && (
                        <button
                          type="button"
                          className={styles.btnDanger}
                          onClick={() => onAnular(f.facturaGuid ?? f.guidFactura)}
                        >
                          Anular
                        </button>
                      )}
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

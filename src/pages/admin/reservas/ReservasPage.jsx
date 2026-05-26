import { useState } from "react";
import { useNavigate } from "react-router-dom";
import useReservas from "../../../hooks/useReservas";
import styles from "./ReservasPage.module.css";

export default function ReservasPage() {
  const navigate = useNavigate();
  const { reservas, loading, error, handleConfirmar, handleCancelar } = useReservas();
  const [actionError, setActionError] = useState(null);

  const onConfirmar = async (id) => {
    if (!window.confirm("¿Deseas confirmar esta reserva?")) return;
    setActionError(null);
    try {
      await handleConfirmar(id);
    } catch (err) {
      setActionError(err?.response?.data?.message || "No se pudo confirmar la reserva.");
    }
  };

  const onCancelar = async (id) => {
    const motivo = window.prompt("Motivo de cancelación:");
    const motivoNormalizado = String(motivo ?? "").trim();
    if (!motivoNormalizado) return;
    if (motivoNormalizado.length > 150) {
      setActionError("El motivo de cancelación no puede exceder 150 caracteres.");
      return;
    }
    setActionError(null);
    try {
      await handleCancelar(id, motivoNormalizado);
    } catch (err) {
      setActionError(err?.response?.data?.message || "No se pudo cancelar la reserva.");
    }
  };

  return (
    <div className={styles.page}>
      <div className={styles.topBar}>
        <h2>Reservas</h2>
        <button
          type="button"
          className={styles.btnPrimary}
          onClick={() => navigate("/admin/reservas/nueva")}
        >
          Nueva Reserva
        </button>
      </div>

      {(error || actionError) && <div className={styles.errorBox}>{actionError || error}</div>}

      <div className={styles.tableWrapper}>
        <table className={styles.table}>
          <thead>
            <tr>
              <th>Código</th>
              <th>Cliente ID</th>
              <th>Sucursal ID</th>
              <th>Fecha Inicio</th>
              <th>Fecha Fin</th>
              <th>Total</th>
              <th>Estado</th>
              <th>Acciones</th>
            </tr>
          </thead>
          <tbody>
            {loading && (
              <tr>
                <td colSpan={8} className={styles.loadingMsg}>
                  Cargando...
                </td>
              </tr>
            )}
            {!loading && reservas.length === 0 && (
              <tr>
                <td colSpan={8} className={styles.emptyMsg}>
                  No hay registros
                </td>
              </tr>
            )}
            {!loading &&
              reservas.map((r) => (
                <tr key={r.reservaGuid ?? r.guidReserva}>
                  <td>{r.codigoReserva}</td>
                  <td>{r.idCliente}</td>
                  <td>{r.idSucursal}</td>
                  <td>{r.fechaInicio}</td>
                  <td>{r.fechaFin}</td>
                  <td>${r.totalReserva}</td>
                  <td>
                    <span
                      className={`${styles.badge} ${
                        r.estadoReserva === "ACT" || r.estadoReserva === "CON"
                          ? styles.badgeActive
                          : styles.badgeInactive
                      }`}
                    >
                      {r.estadoReserva}
                    </span>
                  </td>
                  <td>
                    <div className={styles.actions}>
                      <button
                        type="button"
                        className={styles.btnPrimary}
                        onClick={() =>
                          navigate(`/admin/reservas/${r.reservaGuid ?? r.guidReserva}`)
                        }
                      >
                        Ver
                      </button>
                      {r.estadoReserva === "PEN" && (
                        <button
                          type="button"
                          className={styles.btnPrimary}
                          onClick={() => onConfirmar(r.reservaGuid ?? r.guidReserva)}
                        >
                          Confirmar
                        </button>
                      )}
                      {(r.estadoReserva === "PEN" || r.estadoReserva === "CON") && (
                        <button
                          type="button"
                          className={styles.btnDanger}
                          onClick={() => onCancelar(r.reservaGuid ?? r.guidReserva)}
                        >
                          Cancelar
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

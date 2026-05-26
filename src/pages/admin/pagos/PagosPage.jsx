import { useState } from "react";
import { useNavigate } from "react-router-dom";
import usePagos from "../../../hooks/usePagos";
import styles from "./PagosPage.module.css";

export default function PagosPage() {
  const navigate = useNavigate();
  const { pagos, loading, error, handleAprobar, fetchPagos } = usePagos();
  const [filters, setFilters] = useState({
    facturaGuid: "",
    reservaGuid: "",
    estado: "",
    metodo: "",
  });
  const [actionError, setActionError] = useState(null);

  const onAprobar = async (id) => {
    if (!window.confirm("¿Deseas aprobar este pago?")) return;
    setActionError(null);
    try {
      await handleAprobar(id);
      await fetchPagos(
        Object.fromEntries(
          Object.entries(filters).filter(([, value]) => String(value || "").trim() !== "")
        )
      );
    } catch (err) {
      setActionError(err?.response?.data?.message || err?.message || "No se pudo aprobar el pago.");
    }
  };

  const handleChange = (event) => {
    const { name, value } = event.target;
    setFilters((prev) => ({ ...prev, [name]: value }));
  };

  const handleSearch = () => {
    fetchPagos(
      Object.fromEntries(
        Object.entries(filters).filter(([, value]) => String(value || "").trim() !== "")
      )
    );
  };

  return (
    <div className={styles.page}>
      <div className={styles.topBar}>
        <h2>Pagos</h2>
        <div>
          <input
            name="facturaGuid"
            placeholder="Factura GUID"
            value={filters.facturaGuid}
            onChange={handleChange}
          />
          <input
            name="reservaGuid"
            placeholder="Reserva GUID"
            value={filters.reservaGuid}
            onChange={handleChange}
          />
          <select name="estado" value={filters.estado} onChange={handleChange}>
            <option value="">Todos los estados</option>
            <option value="PEN">PEN</option>
            <option value="APR">APR</option>
            <option value="REC">REC</option>
            <option value="CAN">CAN</option>
          </select>
          <select name="metodo" value={filters.metodo} onChange={handleChange}>
            <option value="">Todos los métodos</option>
            <option value="EFECTIVO">EFECTIVO</option>
            <option value="TARJETA_CREDITO">TARJETA_CREDITO</option>
            <option value="TARJETA_DEBITO">TARJETA_DEBITO</option>
            <option value="TRANSFERENCIA">TRANSFERENCIA</option>
            <option value="CHEQUE">CHEQUE</option>
            <option value="OTRO">OTRO</option>
          </select>
          <button
            type="button"
            className={styles.btnPrimary}
            onClick={handleSearch}
          >
            Buscar
          </button>
        </div>
        <button
          type="button"
          className={styles.btnPrimary}
          onClick={() => navigate("/admin/pagos/nuevo")}
        >
          Registrar Pago
        </button>
      </div>

      {(error || actionError) && <div className={styles.errorBox}>{actionError || error}</div>}

      <div className={styles.tableWrapper}>
        <table className={styles.table}>
          <thead>
            <tr>
              <th>GUID</th>
              <th>Monto</th>
              <th>Método</th>
              <th>Estado</th>
              <th>Fecha</th>
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
            {!loading && pagos.length === 0 && (
              <tr>
                <td colSpan={6} className={styles.emptyMsg}>
                  No hay registros
                </td>
              </tr>
            )}
            {!loading &&
              pagos.map((p) => (
                <tr key={p.pagoGuid}>
                  <td>{`${p.pagoGuid?.slice(0, 8)}...`}</td>
                  <td>${p.monto}</td>
                  <td>{p.metodoPago}</td>
                  <td>
                    <span
                      className={`${styles.badge} ${
                        p.estadoPago === "APR"
                          ? styles.badgeActive
                          : styles.badgeInactive
                      }`}
                    >
                      {p.estadoPago}
                    </span>
                  </td>
                  <td>{p.fechaPagoUtc}</td>
                  <td>
                    <div className={styles.actions}>
                      {p.estadoPago === "PEN" && (
                        <button
                          type="button"
                          className={styles.btnPrimary}
                          onClick={() => onAprobar(p.pagoGuid)}
                        >
                          Aprobar
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

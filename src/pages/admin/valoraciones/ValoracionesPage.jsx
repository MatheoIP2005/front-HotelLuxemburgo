import { useEffect, useState } from "react";
import useValoraciones from "../../../hooks/useValoraciones";
import { getSucursales } from "../../../services/sucursales.service";
import { normalizeCollectionPayload } from "../../../utils/api";
import { VALORACION_MODERATION_STATES } from "../../../utils/constraints";
import styles from "./ValoracionesPage.module.css";

export default function ValoracionesPage() {
  const { valoraciones, loading, error, handleDelete, handleModerar, fetchValoraciones } =
    useValoraciones();
  const [sucursales, setSucursales] = useState([]);
  const [sucursalGuid, setSucursalGuid] = useState("");
  const [actionError, setActionError] = useState(null);

  useEffect(() => {
    const loadSucursales = async () => {
      try {
        const response = await getSucursales({ pagina: 1, limite: 100 });
        setSucursales(normalizeCollectionPayload(response).items);
      } catch (err) {
        setActionError(err?.response?.data?.message || "No se pudieron cargar las sucursales.");
      }
    };

    loadSucursales();
  }, []);

  const onModerar = async (id) => {
    if (!window.confirm("¿Deseas moderar esta valoración?")) return;
    const estadoValoracion = window.prompt(
      `Nuevo estado de valoración (${VALORACION_MODERATION_STATES.join(", ")}):`,
      "PUB"
    );
    if (!estadoValoracion) return;
    const nuevoEstado = estadoValoracion.trim().toUpperCase();
    if (!VALORACION_MODERATION_STATES.includes(nuevoEstado)) {
      setActionError(
        `Estado inválido. Usa uno de: ${VALORACION_MODERATION_STATES.join(", ")}.`
      );
      return;
    }
    setActionError(null);
    try {
      await handleModerar(id, { estadoValoracion: nuevoEstado });
    } catch (err) {
      setActionError(err?.response?.data?.message || "No se pudo moderar la valoración.");
    }
  };

  const onDelete = async (id) => {
    if (!window.confirm("¿Deseas eliminar esta valoración?")) return;
    setActionError(null);
    try {
      await handleDelete(id);
    } catch (err) {
      setActionError(err?.response?.data?.message || "No se pudo eliminar la valoración.");
    }
  };

  return (
    <div className={styles.page}>
      <div className={styles.topBar}>
        <h2>Valoraciones</h2>
        <div>
          <select value={sucursalGuid} onChange={(e) => setSucursalGuid(e.target.value)}>
            <option value="">Selecciona una sucursal</option>
            {sucursales.map((item) => (
              <option key={item.sucursalGuid} value={item.sucursalGuid}>
                {item.nombreSucursal} ({item.codigoSucursal})
              </option>
            ))}
          </select>
          <button
            type="button"
            className={styles.btnWarning}
            onClick={() => fetchValoraciones(sucursalGuid ? { sucursalGuid } : {})}
          >
            Buscar
          </button>
        </div>
      </div>

      {(error || actionError) && <div className={styles.errorBox}>{actionError || error}</div>}

      <div className={styles.tableWrapper}>
        <table className={styles.table}>
          <thead>
            <tr>
              <th>Puntuación</th>
              <th>Tipo Viaje</th>
              <th>Estado</th>
              <th>Portal</th>
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
            {!loading && valoraciones.length === 0 && (
              <tr>
                <td colSpan={5} className={styles.emptyMsg}>
                  No hay registros
                </td>
              </tr>
            )}
            {!loading &&
              valoraciones.map((v) => (
                <tr key={v.valoracionGuid}>
                  <td>{v.puntuacionGeneral}</td>
                  <td>{v.tipoViaje ?? "N/A"}</td>
                  <td>
                    <span
                      className={`${styles.badge} ${
                        v.estadoValoracion === "PUB"
                          ? styles.badgeActive
                          : styles.badgeInactive
                      }`}
                    >
                      {v.estadoValoracion}
                    </span>
                  </td>
                  <td>{v.publicadaEnPortal ? "Sí" : "No"}</td>
                  <td>
                    <div className={styles.actions}>
                      <button
                        type="button"
                        className={styles.btnWarning}
                        onClick={() => onModerar(v.valoracionGuid)}
                      >
                        Moderar
                      </button>
                      <button
                        type="button"
                        className={styles.btnDanger}
                        onClick={() => onDelete(v.valoracionGuid)}
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

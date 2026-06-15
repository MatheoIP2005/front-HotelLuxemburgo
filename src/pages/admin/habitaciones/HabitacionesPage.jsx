import { useCallback, useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import useHabitaciones from "../../../hooks/useHabitaciones";
import { getSucursales } from "../../../services/sucursales.service";
import { normalizeCollectionPayload } from "../../../utils/api";
import styles from "./HabitacionesPage.module.css";

const trimText = (value) => String(value ?? "").trim();

const ESTADO_LABELS = {
  DIS: "Disponible",
  OCU: "Ocupada",
  MNT: "Mantenimiento",
  FDS: "Fuera de servicio",
  INA: "Inactiva",
};

const getEstadoLabel = (estado) =>
  ESTADO_LABELS[estado] ?? (trimText(estado) || "Sin estado");

const getEstadoBadgeClass = (estado) => {
  if (estado === "DIS") return styles.badgeActive;
  if (estado === "OCU") return styles.badgeOcupada;
  if (estado === "MNT") return styles.badgeMantenimiento;
  return styles.badgeInactive;
};

export default function HabitacionesPage() {
  const navigate = useNavigate();
  const { habitaciones, loading, error, handleDelete, handleCambiarEstado } = useHabitaciones();
  const [sucursales, setSucursales] = useState([]);
  const [actionError, setActionError] = useState(null);

  useEffect(() => {
    const loadSucursales = async () => {
      try {
        const response = await getSucursales();
        setSucursales(normalizeCollectionPayload(response).items);
      } catch {
        setSucursales([]);
      }
    };

    loadSucursales();
  }, []);

  const sucursalPorGuid = useMemo(() => {
    const map = new Map();
    sucursales.forEach((sucursal) => {
      if (sucursal?.sucursalGuid) {
        map.set(String(sucursal.sucursalGuid), sucursal);
      }
    });
    return map;
  }, [sucursales]);

  const getSucursalDisplay = useCallback((habitacion) => {
    const sucursal = sucursalPorGuid.get(String(habitacion?.sucursalGuid ?? ""));
    if (!sucursal) {
      return habitacion?.sucursalGuid
        ? `Sucursal (${String(habitacion.sucursalGuid).slice(0, 8)}…)`
        : "Sin sucursal";
    }

    const nombre = trimText(sucursal.nombreSucursal);
    const codigo = trimText(sucursal.codigoSucursal);
    if (nombre && codigo) return `${nombre} (${codigo})`;
    return nombre || codigo || "Sucursal";
  }, [sucursalPorGuid]);

  const habitacionesOrdenadas = useMemo(
    () =>
      [...habitaciones].sort((a, b) => {
        const sucursalA = getSucursalDisplay(a).toLocaleLowerCase("es");
        const sucursalB = getSucursalDisplay(b).toLocaleLowerCase("es");
        if (sucursalA !== sucursalB) {
          return sucursalA.localeCompare(sucursalB, "es");
        }
        return String(a.numeroHabitacion ?? "").localeCompare(
          String(b.numeroHabitacion ?? ""),
          "es",
          { numeric: true }
        );
      }),
    [habitaciones, getSucursalDisplay]
  );

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
              <th>Sucursal</th>
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
                <td colSpan={7} className={styles.loadingMsg}>
                  Cargando...
                </td>
              </tr>
            )}
            {!loading && habitaciones.length === 0 && (
              <tr>
                <td colSpan={7} className={styles.emptyMsg}>
                  No hay registros
                </td>
              </tr>
            )}
            {!loading &&
              habitacionesOrdenadas.map((h) => (
                <tr key={h.habitacionGuid}>
                  <td className={styles.sucursalCell}>
                    <span className={styles.sucursalNombre}>{getSucursalDisplay(h)}</span>
                  </td>
                  <td>{h.numeroHabitacion}</td>
                  <td>{h.piso ?? "N/A"}</td>
                  <td>${h.precioBase}</td>
                  <td>{`${h.tipoCapacidadAdultos ?? 0}A / ${h.tipoCapacidadNinos ?? 0}N`}</td>
                  <td>
                    <span
                      className={`${styles.badge} ${getEstadoBadgeClass(h.estadoHabitacion)}`}
                      title={h.estadoHabitacion}
                    >
                      {getEstadoLabel(h.estadoHabitacion)}
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

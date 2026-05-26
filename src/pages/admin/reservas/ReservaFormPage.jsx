import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { createReserva } from "../../../services/reservas.service";
import { getClientes } from "../../../services/clientes.service";
import { getSucursales } from "../../../services/sucursales.service";
import { getHabitaciones } from "../../../services/habitaciones.service";
import { getTarifas } from "../../../services/tarifas.service";
import { normalizeCollectionPayload } from "../../../utils/api";
import styles from "./ReservaFormPage.module.css";

const getLocalDateMin = () => {
  const now = new Date();
  const offset = now.getTimezoneOffset();
  return new Date(now.getTime() - offset * 60000).toISOString().slice(0, 10);
};

const createEmptyLinea = () => ({
  habitacion_id: "",
  habitacion_guid: "",
  tarifa_id: "",
  tarifa_guid: "",
  num_adultos: "1",
  num_ninos: "0",
  precio_noche_aplicado: "",
});

const EMPTY_FORM = {
  cliente_id: "",
  cliente_guid: "",
  sucursal_id: "",
  sucursal_guid: "",
  fecha_inicio: "",
  fecha_fin: "",
  origen_canal_reserva: "ADMIN",
  observaciones: "",
  es_walkin: false,
  habitaciones: [createEmptyLinea()],
};

export default function ReservaFormPage() {
  const navigate = useNavigate();
  const [form, setForm] = useState(EMPTY_FORM);
  const [catalogs, setCatalogs] = useState({
    clientes: [],
    sucursales: [],
    habitaciones: [],
    tarifas: [],
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(null);

  const parseApiError = (err) => {
    const apiError = err?.response?.data;
    if (Array.isArray(apiError?.details) && apiError.details.length > 0) {
      return `${apiError.error || "Solicitud inválida"}: ${apiError.details.join(" | ")}`;
    }
    return apiError?.message || apiError?.error || err?.message || "Error al guardar";
  };

  useEffect(() => {
    const loadCatalogs = async () => {
      try {
        const [clientes, sucursales, habitaciones, tarifas] = await Promise.all([
          getClientes({ pagina: 1, limite: 100 }),
          getSucursales({ pagina: 1, limite: 100 }),
          getHabitaciones({ pagina: 1, limite: 100 }),
          getTarifas({ pagina: 1, limite: 100 }),
        ]);

        setCatalogs({
          clientes: normalizeCollectionPayload(clientes).items,
          sucursales: normalizeCollectionPayload(sucursales).items,
          habitaciones: normalizeCollectionPayload(habitaciones).items,
          tarifas: normalizeCollectionPayload(tarifas).items,
        });
      } catch (err) {
        setError(err?.response?.data?.message || "No se pudieron cargar los catálogos.");
      }
    };

    loadCatalogs();
  }, []);

  const handleChange = (e) => {
    const { name, type, checked, value } = e.target;

    if (name === "cliente_id") {
      const cliente = catalogs.clientes.find(
        (item) => String(item.idCliente) === String(value)
      );
      setForm((prev) => ({
        ...prev,
        cliente_id: value,
        cliente_guid: cliente?.clienteGuid ?? "",
      }));
      return;
    }

    if (name === "sucursal_id") {
      const sucursal = catalogs.sucursales.find(
        (item) => String(item.idSucursal) === String(value)
      );
      setForm((prev) => ({
        ...prev,
        sucursal_id: value,
        sucursal_guid: sucursal?.sucursalGuid ?? "",
      }));
      return;
    }

    setForm((prev) => ({ ...prev, [name]: type === "checkbox" ? checked : value }));
  };

  const handleLineaChange = (index, event) => {
    const { name, value } = event.target;

    setForm((prev) => ({
      ...prev,
      habitaciones: prev.habitaciones.map((item, currentIndex) =>
        currentIndex === index
          ? (() => {
              if (name === "habitacion_id") {
                const habitacion = catalogs.habitaciones.find(
                  (current) => String(current.idHabitacion) === String(value)
                );
                return {
                  ...item,
                  habitacion_id: value,
                  habitacion_guid: habitacion?.habitacionGuid ?? "",
                };
              }

              if (name === "tarifa_id") {
                const tarifa = catalogs.tarifas.find(
                  (current) => String(current.idTarifa) === String(value)
                );
                return {
                  ...item,
                  tarifa_id: value,
                  tarifa_guid: tarifa?.tarifaGuid ?? "",
                };
              }

              return { ...item, [name]: value };
            })()
          : item
      ),
    }));
  };

  const addLinea = () => {
    setForm((prev) => ({
      ...prev,
      habitaciones: [...prev.habitaciones, createEmptyLinea()],
    }));
  };

  const removeLinea = (index) => {
    setForm((prev) => ({
      ...prev,
      habitaciones: prev.habitaciones.filter((_, currentIndex) => currentIndex !== index),
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError(null);
    setSuccess(null);

    try {
      if (!form.cliente_id || Number(form.cliente_id) <= 0) {
        throw new Error("Debes seleccionar un cliente válido.");
      }
      if (!form.sucursal_id || Number(form.sucursal_id) <= 0) {
        throw new Error("Debes seleccionar una sucursal válida.");
      }
      if (!form.fecha_inicio || !form.fecha_fin) {
        throw new Error("Debes ingresar fecha de inicio y fin.");
      }

      const now = new Date(`${getLocalDateMin()}T00:00:00`);
      const fechaInicio = new Date(`${form.fecha_inicio}T00:00:00`);
      const fechaFin = new Date(`${form.fecha_fin}T00:00:00`);

      if (fechaInicio < now || fechaFin < now) {
        throw new Error("No se puede reservar en fechas pasadas.");
      }
      if (fechaFin <= fechaInicio) {
        throw new Error("La fecha fin debe ser mayor que la fecha inicio.");
      }
      if (!["PORTAL", "ADMIN", "API", "WALKIN"].includes(form.origen_canal_reserva)) {
        throw new Error("El canal de la reserva no es válido.");
      }
      if (form.observaciones && form.observaciones.length > 2000) {
        throw new Error("Las observaciones son demasiado largas.");
      }

      const habitaciones = form.habitaciones.map((item, index) => {
        const idHabitacion = Number(item.habitacion_id);
        const idTarifa = Number(item.tarifa_id);
        const numAdultos = Number(item.num_adultos);
        const numNinos = Number(item.num_ninos);
        const precioNocheAplicado = Number(item.precio_noche_aplicado);

        if (!idHabitacion || idHabitacion <= 0) {
          throw new Error(`Selecciona la habitación de la línea ${index + 1}.`);
        }
        if (!idTarifa || idTarifa <= 0) {
          throw new Error(`Selecciona la tarifa de la línea ${index + 1}.`);
        }
        if (numAdultos <= 0) {
          throw new Error(`La línea ${index + 1} debe tener al menos un adulto.`);
        }
        if (numNinos < 0) {
          throw new Error(`La línea ${index + 1} no admite niños negativos.`);
        }
        if (precioNocheAplicado < 0 || Number.isNaN(precioNocheAplicado)) {
          throw new Error(`La línea ${index + 1} tiene un precio por noche inválido.`);
        }

        return {
          idHabitacion,
          idTarifa,
          fechaInicio: form.fecha_inicio,
          fechaFin: form.fecha_fin,
          numAdultos,
          numNinos,
          precioNocheAplicado,
        };
      });

      if (habitaciones.length === 0) {
        throw new Error("Debes agregar al menos una habitación.");
      }

      const payload = {
        idCliente: Number(form.cliente_id),
        idSucursal: Number(form.sucursal_id),
        fechaInicio: form.fecha_inicio,
        fechaFin: form.fecha_fin,
        origenCanalReserva: form.origen_canal_reserva,
        observaciones: form.observaciones.trim() || null,
        esWalkin: form.es_walkin,
        habitaciones,
      };

      await createReserva(payload);
      setSuccess("Reserva creada correctamente.");
      setTimeout(() => navigate("/admin/reservas"), 1500);
    } catch (err) {
      setError(parseApiError(err));
    } finally {
      setLoading(false);
    }
  };

  return (
    <form className={styles.page} onSubmit={handleSubmit}>
      <div className={styles.topBar}>
        <h2>Nueva Reserva</h2>
        <button type="button" className={styles.btnSecondary} onClick={() => navigate("/admin/reservas")}>
          Volver
        </button>
      </div>

      {error && <div className={styles.errorBox}>{error}</div>}
      {success && <div className={styles.successBox}>{success}</div>}

      <section className={styles.card}>
        <h3 className={styles.sectionTitle}>Datos de Reserva</h3>
        <div className={styles.grid2}>
          <div className={styles.field}>
            <label>Cliente</label>
            <select name="cliente_id" value={form.cliente_id} onChange={handleChange}>
              <option value="">Selecciona un cliente</option>
              {catalogs.clientes.map((item) => (
                <option key={item.clienteGuid} value={item.idCliente}>
                  {`${item.nombres} ${item.apellidos ?? ""}`.trim()} ({item.numeroIdentificacion}) - ID {item.idCliente}
                </option>
              ))}
            </select>
            <span className={styles.helpText}>GUID: {form.cliente_guid || "N/A"}</span>
          </div>
          <div className={styles.field}>
            <label>Sucursal</label>
            <select name="sucursal_id" value={form.sucursal_id} onChange={handleChange}>
              <option value="">Selecciona una sucursal</option>
              {catalogs.sucursales.map((item) => (
                <option key={item.sucursalGuid} value={item.idSucursal}>
                  {item.nombreSucursal} ({item.codigoSucursal}) - ID {item.idSucursal}
                </option>
              ))}
            </select>
            <span className={styles.helpText}>GUID: {form.sucursal_guid || "N/A"}</span>
          </div>
          <div className={styles.field}><label>Fecha inicio</label><input type="date" min={getLocalDateMin()} name="fecha_inicio" value={form.fecha_inicio} onChange={handleChange} required /></div>
          <div className={styles.field}><label>Fecha fin</label><input type="date" min={getLocalDateMin()} name="fecha_fin" value={form.fecha_fin} onChange={handleChange} required /></div>
          <div className={styles.field}>
            <label>Origen canal reserva</label>
            <select name="origen_canal_reserva" value={form.origen_canal_reserva} onChange={handleChange}>
              <option value="PORTAL">PORTAL</option>
              <option value="ADMIN">ADMIN</option>
              <option value="API">API</option>
              <option value="WALKIN">WALKIN</option>
            </select>
          </div>
          <div className={styles.fieldFull}>
            <label>Observaciones</label>
            <textarea name="observaciones" value={form.observaciones} onChange={handleChange} />
          </div>
          <div className={styles.fieldFull}>
            <div className={styles.checkboxField}>
              <label className={styles.checkboxItem}>
                <input type="checkbox" name="es_walkin" checked={form.es_walkin} onChange={handleChange} />
                <span>Es walk-in</span>
              </label>
            </div>
          </div>
        </div>
      </section>

      <section className={styles.card}>
        <div className={styles.topBar}>
          <h3 className={styles.sectionTitle}>Habitaciones de la reserva</h3>
          <button type="button" className={styles.btnSecondary} onClick={addLinea}>
            Agregar habitación
          </button>
        </div>

        <div className={styles.lineList}>
          {form.habitaciones.map((item, index) => (
            <div key={`habitacion-linea-${index}`} className={styles.lineCard}>
              <div className={styles.lineHeader}>
                <strong>Línea {index + 1}</strong>
                {form.habitaciones.length > 1 && (
                  <button
                    type="button"
                    className={styles.btnDanger}
                    onClick={() => removeLinea(index)}
                  >
                    Quitar
                  </button>
                )}
              </div>

              <div className={styles.lineGrid}>
                <div className={styles.field}>
                  <label>Habitación</label>
                  <select
                    name="habitacion_id"
                    value={item.habitacion_id}
                    onChange={(event) => handleLineaChange(index, event)}
                  >
                    <option value="">Selecciona una habitación</option>
                    {catalogs.habitaciones.map((habitacion) => (
                      <option
                        key={habitacion.habitacionGuid}
                        value={habitacion.idHabitacion}
                      >
                        {habitacion.numeroHabitacion} - ID {habitacion.idHabitacion}
                      </option>
                    ))}
                  </select>
                  <span className={styles.helpText}>GUID: {item.habitacion_guid || "N/A"}</span>
                </div>
                <div className={styles.field}>
                  <label>Tarifa</label>
                  <select
                    name="tarifa_id"
                    value={item.tarifa_id}
                    onChange={(event) => handleLineaChange(index, event)}
                  >
                    <option value="">Selecciona una tarifa</option>
                    {catalogs.tarifas.map((tarifa) => (
                      <option key={tarifa.tarifaGuid} value={tarifa.idTarifa}>
                        {tarifa.codigoTarifa} - {tarifa.nombreTarifa} - ID {tarifa.idTarifa}
                      </option>
                    ))}
                  </select>
                  <span className={styles.helpText}>GUID: {item.tarifa_guid || "N/A"}</span>
                </div>
                <div className={styles.field}>
                  <label>Adultos</label>
                  <input
                    type="number"
                    min="1"
                    name="num_adultos"
                    value={item.num_adultos}
                    onChange={(event) => handleLineaChange(index, event)}
                    required
                  />
                </div>
                <div className={styles.field}>
                  <label>Niños</label>
                  <input
                    type="number"
                    min="0"
                    name="num_ninos"
                    value={item.num_ninos}
                    onChange={(event) => handleLineaChange(index, event)}
                    required
                  />
                </div>
                <div className={styles.field}>
                  <label>Precio noche aplicado</label>
                  <input
                    type="number"
                    min="0"
                    step="0.01"
                    name="precio_noche_aplicado"
                    value={item.precio_noche_aplicado}
                    onChange={(event) => handleLineaChange(index, event)}
                    required
                  />
                </div>
              </div>
            </div>
          ))}
        </div>
      </section>

      <div className={styles.actions}>
        <button type="button" className={styles.btnSecondary} onClick={() => navigate("/admin/reservas")}>Cancelar</button>
        <button type="submit" className={styles.btnPrimary} disabled={loading}>{loading ? "Guardando..." : "Guardar"}</button>
      </div>
    </form>
  );
}

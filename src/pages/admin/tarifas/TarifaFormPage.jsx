import { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import {
  createTarifa,
  getTarifa,
  updateTarifa,
} from "../../../services/tarifas.service";
import { getSucursales } from "../../../services/sucursales.service";
import { getTiposHabitacion } from "../../../services/tiposHabitacion.service";
import { normalizeCollectionPayload } from "../../../utils/api";
import styles from "./TarifaFormPage.module.css";

const getLocalDateMin = () => {
  const now = new Date();
  const offset = now.getTimezoneOffset();
  return new Date(now.getTime() - offset * 60000).toISOString().slice(0, 10);
};

const EMPTY_FORM = {
  codigo_tarifa: "",
  nombre_tarifa: "",
  id_sucursal: "",
  sucursal_guid: "",
  id_tipo_habitacion: "",
  tipo_habitacion_guid: "",
  canal_tarifa: "TODOS",
  fecha_inicio: "",
  fecha_fin: "",
  precio_por_noche: "",
  porcentaje_iva: "15.00",
  min_noches: "1",
  max_noches: "",
  prioridad: "1",
  permite_portal_publico: true,
  estado_tarifa: "ACT",
  row_version: null,
};

export default function TarifaFormPage() {
  const navigate = useNavigate();
  const { id } = useParams();
  const isEditMode = Boolean(id);

  const [form, setForm] = useState(EMPTY_FORM);
  const [catalogs, setCatalogs] = useState({
    sucursales: [],
    tiposHabitacion: [],
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(null);

  useEffect(() => {
    const loadData = async () => {
      setLoading(true);
      setError(null);

      try {
        const [sucursales, tiposHabitacion, item] = await Promise.all([
          getSucursales({ pagina: 1, limite: 100 }),
          getTiposHabitacion({ pagina: 1, limite: 100 }),
          id ? getTarifa(id) : Promise.resolve(null),
        ]);

        const availableSucursales = normalizeCollectionPayload(sucursales).items;
        const availableTipos = normalizeCollectionPayload(tiposHabitacion).items;

        setCatalogs({
          sucursales: availableSucursales,
          tiposHabitacion: availableTipos,
        });

        if (!item) return;

        setForm({
          codigo_tarifa: item.codigoTarifa ?? "",
          nombre_tarifa: item.nombreTarifa ?? "",
          id_sucursal: item.idSucursal ?? "",
          sucursal_guid:
            availableSucursales.find(
              (option) => option.idSucursal === item.idSucursal
            )?.sucursalGuid ?? "",
          id_tipo_habitacion: item.idTipoHabitacion ?? "",
          tipo_habitacion_guid:
            availableTipos.find(
              (option) => option.idTipoHabitacion === item.idTipoHabitacion
            )?.tipoHabitacionGuid ?? item.tipoHabitacionGuid ?? "",
          canal_tarifa: item.canalTarifa ?? "TODOS",
          fecha_inicio: String(item.fechaInicio || "").slice(0, 10),
          fecha_fin: String(item.fechaFin || "").slice(0, 10),
          precio_por_noche: item.precioPorNoche ?? "",
          porcentaje_iva: item.porcentajeIva ?? "15.00",
          min_noches: item.minNoches ?? "1",
          max_noches: item.maxNoches ?? "",
          prioridad: item.prioridad ?? "1",
          permite_portal_publico: Boolean(item.permitePortalPublico),
          estado_tarifa: item.estadoTarifa ?? "ACT",
          row_version: item.rowVersion ?? null,
        });
      } catch (err) {
        setError(err?.response?.data?.message || "Error al cargar el registro");
      } finally {
        setLoading(false);
      }
    };
    loadData();
  }, [id]);

  const handleChange = (e) => {
    const { name, type, checked, value } = e.target;

    if (name === "id_sucursal") {
      const sucursal = catalogs.sucursales.find(
        (item) => String(item.idSucursal) === String(value)
      );
      setForm((prev) => ({
        ...prev,
        id_sucursal: value,
        sucursal_guid: sucursal?.sucursalGuid ?? "",
      }));
      return;
    }

    if (name === "id_tipo_habitacion") {
      const tipo = catalogs.tiposHabitacion.find(
        (item) => String(item.idTipoHabitacion) === String(value)
      );
      setForm((prev) => ({
        ...prev,
        id_tipo_habitacion: value,
        tipo_habitacion_guid: tipo?.tipoHabitacionGuid ?? "",
      }));
      return;
    }

    setForm((prev) => ({ ...prev, [name]: type === "checkbox" ? checked : value }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError(null);
    setSuccess(null);
    try {
      const codigoTarifa = form.codigo_tarifa.trim();
      const nombreTarifa = form.nombre_tarifa.trim();
      if (!codigoTarifa || !nombreTarifa) {
        throw new Error("Código y nombre de tarifa son obligatorios.");
      }
      if (codigoTarifa.length > 30) {
        throw new Error("El código de tarifa no puede exceder 30 caracteres.");
      }
      if (nombreTarifa.length > 150) {
        throw new Error("El nombre de tarifa no puede exceder 150 caracteres.");
      }
      if (!form.fecha_inicio || !form.fecha_fin) {
        throw new Error("Fecha inicio y fecha fin son obligatorias.");
      }
      const hoy = new Date();
      hoy.setHours(0, 0, 0, 0);
      const fechaInicio = new Date(`${form.fecha_inicio}T00:00:00`);
      const fechaFin = new Date(`${form.fecha_fin}T00:00:00`);
      if (fechaInicio < hoy || fechaFin < hoy) {
        throw new Error("No se puede reservar en fechas pasadas.");
      }
      if (fechaFin < fechaInicio) {
        throw new Error("La fecha fin no puede ser menor que fecha inicio.");
      }
      if (!["TODOS", "PORTAL", "ADMIN", "API", "WALKIN"].includes(form.canal_tarifa)) {
        throw new Error("El canal de tarifa no es válido.");
      }
      if (!form.id_sucursal || Number(form.id_sucursal) <= 0) {
        throw new Error("Debes seleccionar una sucursal válida.");
      }
      if (!form.id_tipo_habitacion || Number(form.id_tipo_habitacion) <= 0) {
        throw new Error("Debes seleccionar un tipo de habitación válido.");
      }
      if (!form.precio_por_noche || Number(form.precio_por_noche) <= 0) {
        throw new Error("Precio por noche debe ser mayor a cero.");
      }
      if (Number(form.porcentaje_iva) < 0) {
        throw new Error("El porcentaje de IVA no puede ser negativo.");
      }
      if (!form.min_noches || Number(form.min_noches) <= 0) {
        throw new Error("El mínimo de noches debe ser mayor a cero.");
      }
      if (form.max_noches && Number(form.max_noches) < Number(form.min_noches)) {
        throw new Error("El máximo de noches debe ser mayor o igual al mínimo.");
      }
      if (!form.prioridad || Number(form.prioridad) <= 0) {
        throw new Error("La prioridad debe ser mayor a cero.");
      }

      const payload = {
        codigoTarifa,
        nombreTarifa,
        idSucursal: Number(form.id_sucursal),
        idTipoHabitacion: Number(form.id_tipo_habitacion),
        canalTarifa: form.canal_tarifa,
        fechaInicio: form.fecha_inicio,
        fechaFin: form.fecha_fin,
        precioPorNoche: Number(form.precio_por_noche),
        porcentajeIva: Number(form.porcentaje_iva),
        minNoches: Number(form.min_noches),
        maxNoches: form.max_noches ? Number(form.max_noches) : null,
        prioridad: Number(form.prioridad),
        permitePortalPublico: form.permite_portal_publico,
        estadoTarifa: form.estado_tarifa,
        rowVersion: form.row_version,
      };

      if (isEditMode) {
        await updateTarifa(id, payload);
        setSuccess("Tarifa actualizada correctamente.");
      } else {
        await createTarifa(payload);
        setSuccess("Tarifa creada correctamente.");
      }
      setTimeout(() => navigate("/admin/tarifas"), 1500);
    } catch (err) {
      setError(err?.response?.data?.message || err?.message || "Error al guardar");
    } finally {
      setLoading(false);
    }
  };

  return (
    <form className={styles.page} onSubmit={handleSubmit}>
      <div className={styles.topBar}>
        <h2>{isEditMode ? "Editar Tarifa" : "Nueva Tarifa"}</h2>
        <button type="button" className={styles.btnSecondary} onClick={() => navigate("/admin/tarifas")}>
          Volver
        </button>
      </div>

      {error && <div className={styles.errorBox}>{error}</div>}
      {success && <div className={styles.successBox}>{success}</div>}

      <section className={styles.card}>
        <h3 className={styles.sectionTitle}>Información</h3>
        <div className={styles.grid2}>
          <div className={styles.field}><label>Código</label><input name="codigo_tarifa" maxLength={30} value={form.codigo_tarifa} onChange={handleChange} required /></div>
          <div className={styles.field}><label>Nombre</label><input name="nombre_tarifa" maxLength={150} value={form.nombre_tarifa} onChange={handleChange} required /></div>
          <div className={styles.field}>
            <label>Sucursal</label>
            <select name="id_sucursal" value={form.id_sucursal} onChange={handleChange}>
              <option value="">Selecciona una sucursal</option>
              {catalogs.sucursales.map((item) => (
                <option key={item.sucursalGuid} value={item.idSucursal}>
                  {item.nombreSucursal} ({item.codigoSucursal}) - ID {item.idSucursal}
                </option>
              ))}
            </select>
            <span className={styles.helpText}>GUID: {form.sucursal_guid || "N/A"}</span>
          </div>
          <div className={styles.field}>
            <label>Tipo de habitación</label>
            <select
              name="id_tipo_habitacion"
              value={form.id_tipo_habitacion}
              onChange={handleChange}
            >
              <option value="">Selecciona un tipo</option>
              {catalogs.tiposHabitacion.map((item) => (
                <option
                  key={item.tipoHabitacionGuid}
                  value={item.idTipoHabitacion}
                >
                  {item.nombreTipoHabitacion} ({item.codigoTipoHabitacion}) - ID {item.idTipoHabitacion}
                </option>
              ))}
            </select>
            <span className={styles.helpText}>
              GUID: {form.tipo_habitacion_guid || "N/A"}
            </span>
          </div>
          <div className={styles.field}>
            <label>Canal tarifa</label>
            <select name="canal_tarifa" value={form.canal_tarifa} onChange={handleChange}>
              <option value="TODOS">TODOS</option>
              <option value="PORTAL">PORTAL</option>
              <option value="ADMIN">ADMIN</option>
              <option value="API">API</option>
              <option value="WALKIN">WALKIN</option>
            </select>
          </div>
          <div className={styles.field}><label>Fecha inicio</label><input type="date" min={getLocalDateMin()} name="fecha_inicio" value={form.fecha_inicio} onChange={handleChange} required /></div>
          <div className={styles.field}><label>Fecha fin</label><input type="date" min={getLocalDateMin()} name="fecha_fin" value={form.fecha_fin} onChange={handleChange} required /></div>
          <div className={styles.field}><label>Precio por noche</label><input type="number" min="0.01" step="0.01" name="precio_por_noche" value={form.precio_por_noche} onChange={handleChange} required /></div>
          <div className={styles.field}><label>% IVA</label><input type="number" min="0" step="0.01" name="porcentaje_iva" value={form.porcentaje_iva} onChange={handleChange} required /></div>
          <div className={styles.field}><label>Mínimo noches</label><input type="number" min="1" name="min_noches" value={form.min_noches} onChange={handleChange} required /></div>
          <div className={styles.field}><label>Máximo noches</label><input type="number" min="1" name="max_noches" value={form.max_noches} onChange={handleChange} /></div>
          <div className={styles.field}><label>Prioridad</label><input type="number" min="1" name="prioridad" value={form.prioridad} onChange={handleChange} required /></div>
          {isEditMode && (
            <div className={styles.field}>
              <label>Estado</label>
              <select name="estado_tarifa" value={form.estado_tarifa} onChange={handleChange}>
                <option value="ACT">ACT</option>
                <option value="INA">INA</option>
              </select>
            </div>
          )}
          <div className={styles.fieldFull}>
            <div className={styles.checkboxField}>
              <label className={styles.checkboxItem}>
                <input type="checkbox" name="permite_portal_publico" checked={form.permite_portal_publico} onChange={handleChange} />
                <span>Permite portal público</span>
              </label>
            </div>
          </div>
        </div>
      </section>

      <div className={styles.actions}>
        <button type="button" className={styles.btnSecondary} onClick={() => navigate("/admin/tarifas")}>Cancelar</button>
        <button type="submit" className={styles.btnPrimary} disabled={loading}>{loading ? "Guardando..." : "Guardar"}</button>
      </div>
    </form>
  );
}

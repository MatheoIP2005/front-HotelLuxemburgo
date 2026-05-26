import { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import {
  createHabitacion,
  getHabitacion,
  updateHabitacion,
} from "../../../services/habitaciones.service";
import { getSucursales } from "../../../services/sucursales.service";
import { getTiposHabitacion } from "../../../services/tiposHabitacion.service";
import { normalizeCollectionPayload } from "../../../utils/api";
import { HABITACION_ESTADOS, MAX_LENGTHS } from "../../../utils/constraints";
import styles from "./HabitacionFormPage.module.css";

const EMPTY_FORM = {
  id_sucursal: "",
  sucursal_guid: "",
  id_tipo_habitacion: "",
  tipo_habitacion_guid: "",
  numero_habitacion: "",
  piso: "",
  precio_base: "",
  descripcion_habitacion: "",
  estado_habitacion: "DIS",
  row_version: null,
};

export default function HabitacionFormPage() {
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
          id ? getHabitacion(id) : Promise.resolve(null),
        ]);

        const availableSucursales = normalizeCollectionPayload(sucursales).items;
        const availableTipos = normalizeCollectionPayload(tiposHabitacion).items;

        setCatalogs({
          sucursales: availableSucursales,
          tiposHabitacion: availableTipos,
        });

        if (!item) return;

        setForm({
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
          numero_habitacion: item.numeroHabitacion ?? "",
          piso: item.piso ?? "",
          precio_base: item.precioBase ?? "",
          descripcion_habitacion: item.descripcionHabitacion ?? "",
          estado_habitacion: item.estadoHabitacion ?? "DIS",
          row_version: item.rowVersion ?? null,
        });
      } catch (err) {
        setError(err?.response?.data?.message || "Error al cargar la habitacion");
      } finally {
        setLoading(false);
      }
    };
    loadData();
  }, [id]);

  const handleChange = (e) => {
    const { name, value } = e.target;

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

    setForm((prev) => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError(null);
    setSuccess(null);

    try {
      const numeroHabitacion = form.numero_habitacion.trim();
      const descripcionHabitacion = form.descripcion_habitacion.trim();

      if (!numeroHabitacion) {
        throw new Error("El número de habitación es obligatorio.");
      }
      if (numeroHabitacion.length > MAX_LENGTHS.habitacion.numero) {
        throw new Error("El número de habitación no puede exceder 20 caracteres.");
      }
      if (!form.precio_base || Number(form.precio_base) <= 0) {
        throw new Error("El precio base debe ser mayor a cero.");
      }
      if (descripcionHabitacion.length > MAX_LENGTHS.habitacion.descripcion) {
        throw new Error("La descripción no puede exceder 250 caracteres.");
      }
      if (!form.id_sucursal || Number(form.id_sucursal) <= 0) {
        throw new Error("Debes seleccionar una sucursal válida.");
      }
      if (!form.id_tipo_habitacion || Number(form.id_tipo_habitacion) <= 0) {
        throw new Error("Debes seleccionar un tipo de habitación válido.");
      }
      if (form.piso !== "" && Number(form.piso) < 0) {
        throw new Error("El piso no puede ser negativo.");
      }
      if (isEditMode && !HABITACION_ESTADOS.includes(form.estado_habitacion)) {
        throw new Error("El estado de habitación no es válido.");
      }

      const payload = {
        idSucursal: Number(form.id_sucursal),
        idTipoHabitacion: Number(form.id_tipo_habitacion),
        numeroHabitacion,
        piso: form.piso === "" ? null : Number(form.piso),
        precioBase: Number(form.precio_base),
        descripcionHabitacion: descripcionHabitacion || null,
        estadoHabitacion: form.estado_habitacion,
        rowVersion: form.row_version,
      };

      if (isEditMode) {
        await updateHabitacion(id, payload);
        setSuccess("Habitación actualizada correctamente.");
      } else {
        await createHabitacion(payload);
        setSuccess("Habitación creada correctamente.");
      }
      setTimeout(() => navigate("/admin/habitaciones"), 1500);
    } catch (err) {
      setError(err?.response?.data?.message || err?.message || "Error al guardar");
    } finally {
      setLoading(false);
    }
  };

  return (
    <form className={styles.page} onSubmit={handleSubmit}>
      <div className={styles.topBar}>
        <h2>{isEditMode ? "Editar Habitación" : "Nueva Habitación"}</h2>
        <button
          type="button"
          className={styles.btnSecondary}
          onClick={() => navigate("/admin/habitaciones")}
        >
          Volver
        </button>
      </div>

      {error && <div className={styles.errorBox}>{error}</div>}
      {success && <div className={styles.successBox}>{success}</div>}

      <section className={styles.card}>
        <h3 className={styles.sectionTitle}>Información</h3>
        <div className={styles.grid2}>
          <div className={styles.field}>
            <label>Sucursal</label>
            <select
              name="id_sucursal"
              value={form.id_sucursal}
              onChange={handleChange}
            >
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
            <label>Número</label>
            <input
              name="numero_habitacion"
              maxLength={20}
              value={form.numero_habitacion}
              onChange={handleChange}
              required
            />
          </div>
          <div className={styles.field}>
            <label>Piso</label>
            <input type="number" min="0" name="piso" value={form.piso} onChange={handleChange} />
          </div>
          <div className={styles.field}>
            <label>Capacidad del tipo</label>
            <input
              value={
                (() => {
                  const tipo = catalogs.tiposHabitacion.find(
                    (item) =>
                      String(item.idTipoHabitacion) === String(form.id_tipo_habitacion)
                  );
                  if (!tipo) return "";
                  return `${tipo.capacidadAdultos} adultos / ${tipo.capacidadNinos} niños`;
                })()
              }
              readOnly
            />
          </div>
          <div className={styles.field}>
            <label>Precio base</label>
            <input type="number" min="0.01" step="0.01" name="precio_base" value={form.precio_base} onChange={handleChange} required />
          </div>
          {isEditMode && (
            <div className={styles.field}>
              <label>Estado</label>
              <select
                name="estado_habitacion"
                value={form.estado_habitacion}
                onChange={handleChange}
              >
                {HABITACION_ESTADOS.map((estado) => (
                  <option key={estado} value={estado}>
                    {estado}
                  </option>
                ))}
              </select>
            </div>
          )}
          <div className={styles.fieldFull}>
            <label>Descripción</label>
            <textarea name="descripcion_habitacion" maxLength={250} value={form.descripcion_habitacion} onChange={handleChange} />
          </div>
        </div>
      </section>

      <div className={styles.actions}>
        <button type="button" className={styles.btnSecondary} onClick={() => navigate("/admin/habitaciones")}>
          Cancelar
        </button>
        <button type="submit" className={styles.btnPrimary} disabled={loading}>
          {loading ? "Guardando..." : "Guardar"}
        </button>
      </div>
    </form>
  );
}

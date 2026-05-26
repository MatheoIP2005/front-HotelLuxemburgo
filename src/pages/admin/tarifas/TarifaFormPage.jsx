import { useEffect, useMemo, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import {
  createTarifa,
  getTarifa,
  updateTarifa,
} from "../../../services/tarifas.service";
import { getSucursales } from "../../../services/sucursales.service";
import { getTiposHabitacion } from "../../../services/tiposHabitacion.service";
import { normalizeCollectionPayload } from "../../../utils/api";
import { TARIFA_CANALES, TARIFA_ESTADOS } from "../../../utils/constraints";
import styles from "../usuarios/UsuarioFormPage.module.css";

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

const trimText = (value) => (typeof value === "string" ? value.trim() : value);

const sanitizeSucursales = (items) =>
  items.map((item) => ({
    ...item,
    nombreSucursal: trimText(item.nombreSucursal) ?? "",
    codigoSucursal: trimText(item.codigoSucursal) ?? "",
    sucursalGuid: trimText(item.sucursalGuid) ?? "",
  }));

const sanitizeTiposHabitacion = (items) =>
  items.map((item) => ({
    ...item,
    nombreTipoHabitacion: trimText(item.nombreTipoHabitacion) ?? "",
    codigoTipoHabitacion: trimText(item.codigoTipoHabitacion) ?? "",
    tipoHabitacionGuid: trimText(item.tipoHabitacionGuid) ?? "",
  }));

const getFieldIds = (fieldName) => ({
  help: `${fieldName}-help`,
  error: `${fieldName}-error`,
});

const getFieldDescribedBy = (fieldName, hasError) => {
  const ids = getFieldIds(fieldName);
  return hasError ? `${ids.help} ${ids.error}` : ids.help;
};

const validateTarifaForm = (form, isEditMode, minLocalDate) => {
  const errors = {};
  const codigoTarifa = String(form.codigo_tarifa ?? "").trim();
  const nombreTarifa = String(form.nombre_tarifa ?? "").trim();
  const canalTarifa = String(form.canal_tarifa ?? "").trim();
  const estadoTarifa = String(form.estado_tarifa ?? "").trim();
  const precioPorNoche = Number(form.precio_por_noche);
  const porcentajeIva = Number(form.porcentaje_iva);
  const minNoches = Number(form.min_noches);
  const maxNoches = form.max_noches === "" ? null : Number(form.max_noches);
  const prioridad = Number(form.prioridad);

  if (!codigoTarifa) {
    errors.codigo_tarifa = "El código de tarifa es obligatorio.";
  } else if (codigoTarifa.length > 30) {
    errors.codigo_tarifa = "No puede exceder 30 caracteres.";
  }

  if (!nombreTarifa) {
    errors.nombre_tarifa = "El nombre de tarifa es obligatorio.";
  } else if (nombreTarifa.length > 150) {
    errors.nombre_tarifa = "No puede exceder 150 caracteres.";
  }

  if (!form.id_sucursal || Number(form.id_sucursal) <= 0) {
    errors.id_sucursal = "Selecciona una sucursal válida.";
  }

  if (!form.id_tipo_habitacion || Number(form.id_tipo_habitacion) <= 0) {
    errors.id_tipo_habitacion = "Selecciona un tipo de habitación válido.";
  }

  if (!TARIFA_CANALES.includes(canalTarifa)) {
    errors.canal_tarifa = "Selecciona un canal válido.";
  }

  if (!form.fecha_inicio) {
    errors.fecha_inicio = "La fecha de inicio es obligatoria.";
  } else if (form.fecha_inicio < minLocalDate) {
    errors.fecha_inicio = "La fecha de inicio no puede estar en el pasado.";
  }

  if (!form.fecha_fin) {
    errors.fecha_fin = "La fecha de fin es obligatoria.";
  } else if (form.fecha_fin < minLocalDate) {
    errors.fecha_fin = "La fecha de fin no puede estar en el pasado.";
  }

  if (form.fecha_inicio && form.fecha_fin && form.fecha_fin < form.fecha_inicio) {
    errors.fecha_fin = "La fecha de fin debe ser mayor o igual a la fecha de inicio.";
  }

  if (!form.precio_por_noche || Number.isNaN(precioPorNoche) || precioPorNoche <= 0) {
    errors.precio_por_noche = "El precio por noche debe ser mayor a 0.";
  }

  if (form.porcentaje_iva === "" || Number.isNaN(porcentajeIva) || porcentajeIva < 0) {
    errors.porcentaje_iva = "El IVA debe ser un valor mayor o igual a 0.";
  }

  if (!form.min_noches || Number.isNaN(minNoches) || minNoches <= 0) {
    errors.min_noches = "El mínimo de noches debe ser mayor a 0.";
  }

  if (form.max_noches !== "" && (Number.isNaN(maxNoches) || maxNoches < minNoches)) {
    errors.max_noches = "El máximo debe ser nulo o mayor/igual al mínimo.";
  }

  if (!form.prioridad || Number.isNaN(prioridad) || prioridad <= 0) {
    errors.prioridad = "La prioridad debe ser mayor a 0.";
  }

  if (isEditMode && !TARIFA_ESTADOS.includes(estadoTarifa)) {
    errors.estado_tarifa = "Selecciona un estado válido.";
  }

  return errors;
};

export default function TarifaFormPage() {
  const navigate = useNavigate();
  const { id } = useParams();
  const isEditMode = Boolean(id);
  const minLocalDate = useMemo(() => getLocalDateMin(), []);

  const [form, setForm] = useState(EMPTY_FORM);
  const [touchedFields, setTouchedFields] = useState({});
  const [submitAttempted, setSubmitAttempted] = useState(false);
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

        const availableSucursales = sanitizeSucursales(
          normalizeCollectionPayload(sucursales).items
        );
        const availableTipos = sanitizeTiposHabitacion(
          normalizeCollectionPayload(tiposHabitacion).items
        );

        setCatalogs({
          sucursales: availableSucursales,
          tiposHabitacion: availableTipos,
        });

        if (!item) {
          setForm(EMPTY_FORM);
          setTouchedFields({});
          setSubmitAttempted(false);
          return;
        }

        setForm({
          codigo_tarifa: trimText(item.codigoTarifa) ?? "",
          nombre_tarifa: trimText(item.nombreTarifa) ?? "",
          id_sucursal: item.idSucursal ?? "",
          sucursal_guid:
            availableSucursales.find(
              (option) => option.idSucursal === item.idSucursal
            )?.sucursalGuid ?? "",
          id_tipo_habitacion: item.idTipoHabitacion ?? "",
          tipo_habitacion_guid:
            availableTipos.find(
              (option) => option.idTipoHabitacion === item.idTipoHabitacion
            )?.tipoHabitacionGuid ?? trimText(item.tipoHabitacionGuid) ?? "",
          canal_tarifa: trimText(item.canalTarifa) ?? "TODOS",
          fecha_inicio: String(item.fechaInicio || "").slice(0, 10),
          fecha_fin: String(item.fechaFin || "").slice(0, 10),
          precio_por_noche: item.precioPorNoche ?? "",
          porcentaje_iva: item.porcentajeIva ?? "15.00",
          min_noches: item.minNoches ?? "1",
          max_noches: item.maxNoches ?? "",
          prioridad: item.prioridad ?? "1",
          permite_portal_publico: Boolean(item.permitePortalPublico),
          estado_tarifa: trimText(item.estadoTarifa) ?? "ACT",
          row_version: item.rowVersion ?? null,
        });
        setTouchedFields({});
        setSubmitAttempted(false);
      } catch (err) {
        setError(err?.response?.data?.message || "Error al cargar el registro");
      } finally {
        setLoading(false);
      }
    };
    loadData();
  }, [id]);

  const fieldErrors = useMemo(
    () => validateTarifaForm(form, isEditMode, minLocalDate),
    [form, isEditMode, minLocalDate]
  );

  const showFieldError = (fieldName) =>
    Boolean(fieldErrors[fieldName] && (touchedFields[fieldName] || submitAttempted));

  const getFieldClassName = (baseClassName, fieldName) =>
    [styles[baseClassName], showFieldError(fieldName) ? styles.fieldError : ""]
      .filter(Boolean)
      .join(" ");

  const handleBlur = (e) => {
    const { name } = e.target;
    setTouchedFields((prev) => ({ ...prev, [name]: true }));
  };

  const handleChange = (e) => {
    const { name, type, checked, value } = e.target;
    setError(null);
    setSuccess(null);

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
    setSubmitAttempted(true);
    setError(null);
    setSuccess(null);

    const currentFieldErrors = validateTarifaForm(form, isEditMode, minLocalDate);
    if (Object.keys(currentFieldErrors).length > 0) {
      return;
    }

    setLoading(true);
    try {
      const codigoTarifa = form.codigo_tarifa.trim();
      const nombreTarifa = form.nombre_tarifa.trim();

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
    <form className={styles.page} onSubmit={handleSubmit} noValidate>
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
        <div className={styles.grid3}>
          <div className={getFieldClassName("fieldCompact", "codigo_tarifa")}>
            <label htmlFor="codigo_tarifa">Código</label>
            <input
              id="codigo_tarifa"
              name="codigo_tarifa"
              maxLength={30}
              value={form.codigo_tarifa}
              onChange={handleChange}
              onBlur={handleBlur}
              aria-invalid={showFieldError("codigo_tarifa")}
              aria-describedby={getFieldDescribedBy(
                "codigo_tarifa",
                showFieldError("codigo_tarifa")
              )}
              required
            />
            <div className={styles.fieldMeta}>
              <span id={getFieldIds("codigo_tarifa").help} className={styles.helperText}>
                Código interno de la tarifa. Máximo 30 caracteres.
              </span>
              <span className={styles.counterText}>{form.codigo_tarifa.length}/30</span>
            </div>
            {showFieldError("codigo_tarifa") && (
              <span id={getFieldIds("codigo_tarifa").error} className={styles.errorText}>
                {fieldErrors.codigo_tarifa}
              </span>
            )}
          </div>
          <div className={getFieldClassName("fieldWide", "nombre_tarifa")}>
            <label htmlFor="nombre_tarifa">Nombre</label>
            <input
              id="nombre_tarifa"
              name="nombre_tarifa"
              maxLength={150}
              value={form.nombre_tarifa}
              onChange={handleChange}
              onBlur={handleBlur}
              aria-invalid={showFieldError("nombre_tarifa")}
              aria-describedby={getFieldDescribedBy(
                "nombre_tarifa",
                showFieldError("nombre_tarifa")
              )}
              required
            />
            <div className={styles.fieldMeta}>
              <span id={getFieldIds("nombre_tarifa").help} className={styles.helperText}>
                Nombre comercial visible para identificar la tarifa. Máximo 150 caracteres.
              </span>
              <span className={styles.counterText}>{form.nombre_tarifa.length}/150</span>
            </div>
            {showFieldError("nombre_tarifa") && (
              <span id={getFieldIds("nombre_tarifa").error} className={styles.errorText}>
                {fieldErrors.nombre_tarifa}
              </span>
            )}
          </div>
          <div className={getFieldClassName("fieldWide", "id_sucursal")}>
            <label htmlFor="id_sucursal">Sucursal</label>
            <select
              id="id_sucursal"
              name="id_sucursal"
              value={form.id_sucursal}
              onChange={handleChange}
              onBlur={handleBlur}
              aria-invalid={showFieldError("id_sucursal")}
              aria-describedby={getFieldDescribedBy(
                "id_sucursal",
                showFieldError("id_sucursal")
              )}
            >
              <option value="">Selecciona una sucursal</option>
              {catalogs.sucursales.map((item) => (
                <option key={item.sucursalGuid} value={item.idSucursal}>
                  {item.nombreSucursal} ({item.codigoSucursal}) - ID {item.idSucursal}
                </option>
              ))}
            </select>
            <div className={styles.fieldMeta}>
              <span id={getFieldIds("id_sucursal").help} className={styles.helperText}>
                Selecciona la sucursal a la que aplica la tarifa. GUID:{" "}
                {form.sucursal_guid || "N/A"}
              </span>
            </div>
            {showFieldError("id_sucursal") && (
              <span id={getFieldIds("id_sucursal").error} className={styles.errorText}>
                {fieldErrors.id_sucursal}
              </span>
            )}
          </div>
          <div className={getFieldClassName("fieldWide", "id_tipo_habitacion")}>
            <label htmlFor="id_tipo_habitacion">Tipo de habitación</label>
            <select
              id="id_tipo_habitacion"
              name="id_tipo_habitacion"
              value={form.id_tipo_habitacion}
              onChange={handleChange}
              onBlur={handleBlur}
              aria-invalid={showFieldError("id_tipo_habitacion")}
              aria-describedby={getFieldDescribedBy(
                "id_tipo_habitacion",
                showFieldError("id_tipo_habitacion")
              )}
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
            <div className={styles.fieldMeta}>
              <span
                id={getFieldIds("id_tipo_habitacion").help}
                className={styles.helperText}
              >
                Relaciona la tarifa con el tipo de habitación correcto. GUID:{" "}
                {form.tipo_habitacion_guid || "N/A"}
              </span>
            </div>
            {showFieldError("id_tipo_habitacion") && (
              <span
                id={getFieldIds("id_tipo_habitacion").error}
                className={styles.errorText}
              >
                {fieldErrors.id_tipo_habitacion}
              </span>
            )}
          </div>
          <div className={getFieldClassName("fieldCompact", "canal_tarifa")}>
            <label htmlFor="canal_tarifa">Canal tarifa</label>
            <select
              id="canal_tarifa"
              name="canal_tarifa"
              value={form.canal_tarifa}
              onChange={handleChange}
              onBlur={handleBlur}
              aria-invalid={showFieldError("canal_tarifa")}
              aria-describedby={getFieldDescribedBy(
                "canal_tarifa",
                showFieldError("canal_tarifa")
              )}
            >
              {TARIFA_CANALES.map((canal) => (
                <option key={canal} value={canal}>
                  {canal}
                </option>
              ))}
            </select>
            <span id={getFieldIds("canal_tarifa").help} className={styles.helperText}>
              Canal permitido: {TARIFA_CANALES.join(", ")}.
            </span>
            {showFieldError("canal_tarifa") && (
              <span id={getFieldIds("canal_tarifa").error} className={styles.errorText}>
                {fieldErrors.canal_tarifa}
              </span>
            )}
          </div>
          <div className={getFieldClassName("fieldCompact", "fecha_inicio")}>
            <label htmlFor="fecha_inicio">Fecha inicio</label>
            <input
              id="fecha_inicio"
              type="date"
              min={minLocalDate}
              name="fecha_inicio"
              value={form.fecha_inicio}
              onChange={handleChange}
              onBlur={handleBlur}
              aria-invalid={showFieldError("fecha_inicio")}
              aria-describedby={getFieldDescribedBy(
                "fecha_inicio",
                showFieldError("fecha_inicio")
              )}
              required
            />
            <span id={getFieldIds("fecha_inicio").help} className={styles.helperText}>
              Debe ser hoy o una fecha futura.
            </span>
            {showFieldError("fecha_inicio") && (
              <span id={getFieldIds("fecha_inicio").error} className={styles.errorText}>
                {fieldErrors.fecha_inicio}
              </span>
            )}
          </div>
          <div className={getFieldClassName("fieldCompact", "fecha_fin")}>
            <label htmlFor="fecha_fin">Fecha fin</label>
            <input
              id="fecha_fin"
              type="date"
              min={form.fecha_inicio || minLocalDate}
              name="fecha_fin"
              value={form.fecha_fin}
              onChange={handleChange}
              onBlur={handleBlur}
              aria-invalid={showFieldError("fecha_fin")}
              aria-describedby={getFieldDescribedBy(
                "fecha_fin",
                showFieldError("fecha_fin")
              )}
              required
            />
            <span id={getFieldIds("fecha_fin").help} className={styles.helperText}>
              Debe ser mayor o igual a la fecha de inicio.
            </span>
            {showFieldError("fecha_fin") && (
              <span id={getFieldIds("fecha_fin").error} className={styles.errorText}>
                {fieldErrors.fecha_fin}
              </span>
            )}
          </div>
          <div className={getFieldClassName("fieldCompact", "precio_por_noche")}>
            <label htmlFor="precio_por_noche">Precio por noche</label>
            <input
              id="precio_por_noche"
              type="number"
              min="0.01"
              step="0.01"
              name="precio_por_noche"
              value={form.precio_por_noche}
              onChange={handleChange}
              onBlur={handleBlur}
              aria-invalid={showFieldError("precio_por_noche")}
              aria-describedby={getFieldDescribedBy(
                "precio_por_noche",
                showFieldError("precio_por_noche")
              )}
              required
            />
            <span
              id={getFieldIds("precio_por_noche").help}
              className={styles.helperText}
            >
              Monto base de la tarifa, debe ser mayor a 0.
            </span>
            {showFieldError("precio_por_noche") && (
              <span
                id={getFieldIds("precio_por_noche").error}
                className={styles.errorText}
              >
                {fieldErrors.precio_por_noche}
              </span>
            )}
          </div>
          <div className={getFieldClassName("fieldCompact", "porcentaje_iva")}>
            <label htmlFor="porcentaje_iva">% IVA</label>
            <input
              id="porcentaje_iva"
              type="number"
              min="0"
              step="0.01"
              name="porcentaje_iva"
              value={form.porcentaje_iva}
              onChange={handleChange}
              onBlur={handleBlur}
              aria-invalid={showFieldError("porcentaje_iva")}
              aria-describedby={getFieldDescribedBy(
                "porcentaje_iva",
                showFieldError("porcentaje_iva")
              )}
              required
            />
            <span
              id={getFieldIds("porcentaje_iva").help}
              className={styles.helperText}
            >
              Porcentaje aplicado al precio. Puede ser 0 o mayor.
            </span>
            {showFieldError("porcentaje_iva") && (
              <span
                id={getFieldIds("porcentaje_iva").error}
                className={styles.errorText}
              >
                {fieldErrors.porcentaje_iva}
              </span>
            )}
          </div>
          <div className={getFieldClassName("fieldCompact", "min_noches")}>
            <label htmlFor="min_noches">Mínimo noches</label>
            <input
              id="min_noches"
              type="number"
              min="1"
              name="min_noches"
              value={form.min_noches}
              onChange={handleChange}
              onBlur={handleBlur}
              aria-invalid={showFieldError("min_noches")}
              aria-describedby={getFieldDescribedBy(
                "min_noches",
                showFieldError("min_noches")
              )}
              required
            />
            <span id={getFieldIds("min_noches").help} className={styles.helperText}>
              Debe ser un entero mayor a 0.
            </span>
            {showFieldError("min_noches") && (
              <span id={getFieldIds("min_noches").error} className={styles.errorText}>
                {fieldErrors.min_noches}
              </span>
            )}
          </div>
          <div className={getFieldClassName("fieldCompact", "max_noches")}>
            <label htmlFor="max_noches">Máximo noches</label>
            <input
              id="max_noches"
              type="number"
              min={form.min_noches || "1"}
              name="max_noches"
              value={form.max_noches}
              onChange={handleChange}
              onBlur={handleBlur}
              aria-invalid={showFieldError("max_noches")}
              aria-describedby={getFieldDescribedBy(
                "max_noches",
                showFieldError("max_noches")
              )}
            />
            <span id={getFieldIds("max_noches").help} className={styles.helperText}>
              Opcional. Si se informa, debe ser mayor o igual al mínimo.
            </span>
            {showFieldError("max_noches") && (
              <span id={getFieldIds("max_noches").error} className={styles.errorText}>
                {fieldErrors.max_noches}
              </span>
            )}
          </div>
          <div className={getFieldClassName("fieldCompact", "prioridad")}>
            <label htmlFor="prioridad">Prioridad</label>
            <input
              id="prioridad"
              type="number"
              min="1"
              name="prioridad"
              value={form.prioridad}
              onChange={handleChange}
              onBlur={handleBlur}
              aria-invalid={showFieldError("prioridad")}
              aria-describedby={getFieldDescribedBy(
                "prioridad",
                showFieldError("prioridad")
              )}
              required
            />
            <span id={getFieldIds("prioridad").help} className={styles.helperText}>
              Orden de preferencia. Debe ser mayor a 0.
            </span>
            {showFieldError("prioridad") && (
              <span id={getFieldIds("prioridad").error} className={styles.errorText}>
                {fieldErrors.prioridad}
              </span>
            )}
          </div>
          {isEditMode && (
            <div className={getFieldClassName("fieldCompact", "estado_tarifa")}>
              <label htmlFor="estado_tarifa">Estado</label>
              <select
                id="estado_tarifa"
                name="estado_tarifa"
                value={form.estado_tarifa}
                onChange={handleChange}
                onBlur={handleBlur}
                aria-invalid={showFieldError("estado_tarifa")}
                aria-describedby={getFieldDescribedBy(
                  "estado_tarifa",
                  showFieldError("estado_tarifa")
                )}
              >
                {TARIFA_ESTADOS.map((estado) => (
                  <option key={estado} value={estado}>
                    {estado}
                  </option>
                ))}
              </select>
              <span id={getFieldIds("estado_tarifa").help} className={styles.helperText}>
                Estados permitidos: {TARIFA_ESTADOS.join(", ")}.
              </span>
              {showFieldError("estado_tarifa") && (
                <span id={getFieldIds("estado_tarifa").error} className={styles.errorText}>
                  {fieldErrors.estado_tarifa}
                </span>
              )}
            </div>
          )}
          <div className={styles.fieldFull}>
            <div className={styles.checkboxField}>
              <label className={styles.checkboxItem} htmlFor="permite_portal_publico">
                <input
                  id="permite_portal_publico"
                  type="checkbox"
                  name="permite_portal_publico"
                  checked={form.permite_portal_publico}
                  onChange={handleChange}
                  onBlur={handleBlur}
                  aria-describedby={getFieldIds("permite_portal_publico").help}
                />
                <span>Permite portal público</span>
              </label>
            </div>
            <span
              id={getFieldIds("permite_portal_publico").help}
              className={styles.helperText}
            >
              Controla si la tarifa puede exponerse en canales públicos del portal.
            </span>
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

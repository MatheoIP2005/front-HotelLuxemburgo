import { useEffect, useMemo, useState } from "react";
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
import styles from "../usuarios/UsuarioFormPage.module.css";

const EMPTY_FORM = {
  sucursal_guid: "",
  tipo_habitacion_guid: "",
  capacidad_habitacion: "",
  numero_habitacion: "",
  piso: "",
  precio_base: "",
  descripcion_habitacion: "",
  estado_habitacion: "DIS",
};

const isValidGuid = (value) =>
  typeof value === "string" &&
  /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(
    value.trim()
  );

const getCapacidadFromTipo = (tipo) => {
  if (!tipo) return 0;
  const total = Number(tipo.capacidadTotal);
  if (Number.isFinite(total) && total > 0) return total;
  const adultos = Number(tipo.capacidadAdultos) || 0;
  const ninos = Number(tipo.capacidadNinos) || 0;
  return adultos + ninos > 0 ? adultos + ninos : 0;
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

const validateHabitacionForm = (form, isEditMode) => {
  const errors = {};
  const numeroHabitacion = String(form.numero_habitacion ?? "").trim();
  const descripcionHabitacion = String(form.descripcion_habitacion ?? "").trim();
  const precioBase = Number(form.precio_base);
  const piso = form.piso === "" ? null : Number(form.piso);

  if (!isValidGuid(form.sucursal_guid)) {
    errors.sucursal_guid = "Selecciona una sucursal válida.";
  }

  if (!isValidGuid(form.tipo_habitacion_guid)) {
    errors.tipo_habitacion_guid = "Selecciona un tipo de habitación válido.";
  }

  if (!numeroHabitacion) {
    errors.numero_habitacion = "El número de habitación es obligatorio.";
  } else if (numeroHabitacion.length > MAX_LENGTHS.habitacion.numero) {
    errors.numero_habitacion = "No puede exceder 20 caracteres.";
  }

  if (form.piso !== "" && (Number.isNaN(piso) || piso < 0)) {
    errors.piso = "El piso debe ser un número mayor o igual a 0.";
  }

  if (!form.precio_base || Number.isNaN(precioBase) || precioBase <= 0) {
    errors.precio_base = "El precio base debe ser mayor a 0.";
  }

  if (descripcionHabitacion.length > MAX_LENGTHS.habitacion.descripcion) {
    errors.descripcion_habitacion = "La descripción no puede exceder 250 caracteres.";
  }

  if (
    isEditMode &&
    !HABITACION_ESTADOS.includes(String(form.estado_habitacion ?? "").trim())
  ) {
    errors.estado_habitacion = "Selecciona un estado válido.";
  }

  return errors;
};

export default function HabitacionFormPage() {
  const navigate = useNavigate();
  const { id } = useParams();
  const isEditMode = Boolean(id);

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
          id ? getHabitacion(id) : Promise.resolve(null),
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

        const tipoHabitacionGuid = trimText(item.tipoHabitacionGuid) ?? "";
        const tipoRelacionado = availableTipos.find(
          (option) => option.tipoHabitacionGuid === tipoHabitacionGuid
        );

        setForm({
          sucursal_guid: trimText(item.sucursalGuid) ?? "",
          tipo_habitacion_guid: tipoHabitacionGuid,
          capacidad_habitacion:
            item.capacidadHabitacion ?? getCapacidadFromTipo(tipoRelacionado) ?? "",
          numero_habitacion: trimText(item.numeroHabitacion) ?? "",
          piso: item.piso ?? "",
          precio_base: item.precioBase ?? "",
          descripcion_habitacion: trimText(item.descripcionHabitacion) ?? "",
          estado_habitacion: trimText(item.estadoHabitacion) ?? "DIS",
        });
        setTouchedFields({});
        setSubmitAttempted(false);
      } catch (err) {
        setError(err?.response?.data?.message || "Error al cargar la habitacion");
      } finally {
        setLoading(false);
      }
    };
    loadData();
  }, [id]);

  const fieldErrors = useMemo(
    () => validateHabitacionForm(form, isEditMode),
    [form, isEditMode]
  );

  const selectedTipoHabitacion = useMemo(
    () =>
      catalogs.tiposHabitacion.find(
        (item) => item.tipoHabitacionGuid === form.tipo_habitacion_guid
      ) ?? null,
    [catalogs.tiposHabitacion, form.tipo_habitacion_guid]
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
    const { name, value } = e.target;
    setError(null);
    setSuccess(null);

    if (name === "sucursal_guid") {
      setForm((prev) => ({ ...prev, sucursal_guid: value }));
      return;
    }

    if (name === "tipo_habitacion_guid") {
      const tipo = catalogs.tiposHabitacion.find(
        (item) => item.tipoHabitacionGuid === value
      );
      setForm((prev) => ({
        ...prev,
        tipo_habitacion_guid: value,
        capacidad_habitacion: getCapacidadFromTipo(tipo),
      }));
      return;
    }

    setForm((prev) => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSubmitAttempted(true);
    setError(null);
    setSuccess(null);

    const currentFieldErrors = validateHabitacionForm(form, isEditMode);
    if (Object.keys(currentFieldErrors).length > 0) {
      return;
    }

    setLoading(true);

    try {
      const numeroHabitacion = form.numero_habitacion.trim();
      const descripcionHabitacion = form.descripcion_habitacion.trim();

      const capacidadHabitacion = isEditMode
        ? Number(form.capacidad_habitacion) ||
          getCapacidadFromTipo(selectedTipoHabitacion)
        : getCapacidadFromTipo(selectedTipoHabitacion);

      if (!isEditMode && capacidadHabitacion <= 0) {
        setError(
          "El tipo de habitación seleccionado no tiene capacidad configurada."
        );
        return;
      }

      const basePayload = {
        numeroHabitacion,
        piso: form.piso === "" ? null : Number(form.piso),
        precioBase: Number(form.precio_base),
        descripcionHabitacion: descripcionHabitacion || null,
        capacidadHabitacion,
        capacidadTotal: selectedTipoHabitacion?.capacidadTotal,
        capacidadAdultos: selectedTipoHabitacion?.capacidadAdultos,
        capacidadNinos: selectedTipoHabitacion?.capacidadNinos,
      };

      if (isEditMode) {
        await updateHabitacion(id, {
          ...basePayload,
          estadoHabitacion: form.estado_habitacion,
        });
        setSuccess("Habitación actualizada correctamente.");
      } else {
        await createHabitacion({
          ...basePayload,
          sucursalGuid: form.sucursal_guid,
          tipoHabitacionGuid: form.tipo_habitacion_guid,
        });
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
    <form className={styles.page} onSubmit={handleSubmit} noValidate>
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
        <div className={styles.grid3}>
          <div className={getFieldClassName("fieldWide", "sucursal_guid")}>
            <label htmlFor="sucursal_guid">Sucursal</label>
            <select
              id="sucursal_guid"
              name="sucursal_guid"
              value={form.sucursal_guid}
              onChange={handleChange}
              onBlur={handleBlur}
              disabled={isEditMode}
              aria-invalid={showFieldError("sucursal_guid")}
              aria-describedby={getFieldDescribedBy(
                "sucursal_guid",
                showFieldError("sucursal_guid")
              )}
            >
              <option value="">Selecciona una sucursal</option>
              {catalogs.sucursales.map((item) => (
                <option key={item.sucursalGuid} value={item.sucursalGuid}>
                  {item.nombreSucursal} ({item.codigoSucursal})
                </option>
              ))}
            </select>
            <div className={styles.fieldMeta}>
              <span id={getFieldIds("sucursal_guid").help} className={styles.helperText}>
                Selecciona la sucursal asociada a la habitación.
                {isEditMode ? " No se puede cambiar al editar." : ""}
              </span>
            </div>
            {showFieldError("sucursal_guid") && (
              <span
                id={getFieldIds("sucursal_guid").error}
                className={styles.errorText}
              >
                {fieldErrors.sucursal_guid}
              </span>
            )}
          </div>
          <div className={getFieldClassName("fieldWide", "tipo_habitacion_guid")}>
            <label htmlFor="tipo_habitacion_guid">Tipo de habitación</label>
            <select
              id="tipo_habitacion_guid"
              name="tipo_habitacion_guid"
              value={form.tipo_habitacion_guid}
              onChange={handleChange}
              onBlur={handleBlur}
              disabled={isEditMode}
              aria-invalid={showFieldError("tipo_habitacion_guid")}
              aria-describedby={getFieldDescribedBy(
                "tipo_habitacion_guid",
                showFieldError("tipo_habitacion_guid")
              )}
            >
              <option value="">Selecciona un tipo</option>
              {catalogs.tiposHabitacion.map((item) => (
                <option key={item.tipoHabitacionGuid} value={item.tipoHabitacionGuid}>
                  {item.nombreTipoHabitacion} ({item.codigoTipoHabitacion})
                </option>
              ))}
            </select>
            <div className={styles.fieldMeta}>
              <span
                id={getFieldIds("tipo_habitacion_guid").help}
                className={styles.helperText}
              >
                Elige la categoría operativa de la habitación.
                {isEditMode ? " No se puede cambiar al editar." : ""}
              </span>
            </div>
            {showFieldError("tipo_habitacion_guid") && (
              <span
                id={getFieldIds("tipo_habitacion_guid").error}
                className={styles.errorText}
              >
                {fieldErrors.tipo_habitacion_guid}
              </span>
            )}
          </div>
          <div className={getFieldClassName("fieldCompact", "numero_habitacion")}>
            <label htmlFor="numero_habitacion">Número</label>
            <input
              id="numero_habitacion"
              name="numero_habitacion"
              maxLength={MAX_LENGTHS.habitacion.numero}
              value={form.numero_habitacion}
              onChange={handleChange}
              onBlur={handleBlur}
              aria-invalid={showFieldError("numero_habitacion")}
              aria-describedby={getFieldDescribedBy(
                "numero_habitacion",
                showFieldError("numero_habitacion")
              )}
              required
            />
            <div className={styles.fieldMeta}>
              <span
                id={getFieldIds("numero_habitacion").help}
                className={styles.helperText}
              >
                Identificador visible de la habitación. Máximo 20 caracteres.
              </span>
              <span className={styles.counterText}>
                {form.numero_habitacion.length}/{MAX_LENGTHS.habitacion.numero}
              </span>
            </div>
            {showFieldError("numero_habitacion") && (
              <span
                id={getFieldIds("numero_habitacion").error}
                className={styles.errorText}
              >
                {fieldErrors.numero_habitacion}
              </span>
            )}
          </div>
          <div className={getFieldClassName("fieldCompact", "piso")}>
            <label htmlFor="piso">Piso</label>
            <input
              id="piso"
              type="number"
              min="0"
              name="piso"
              value={form.piso}
              onChange={handleChange}
              onBlur={handleBlur}
              aria-invalid={showFieldError("piso")}
              aria-describedby={getFieldDescribedBy("piso", showFieldError("piso"))}
            />
            <span id={getFieldIds("piso").help} className={styles.helperText}>
              Campo opcional. Usa valores enteros mayores o iguales a 0.
            </span>
            {showFieldError("piso") && (
              <span id={getFieldIds("piso").error} className={styles.errorText}>
                {fieldErrors.piso}
              </span>
            )}
          </div>
          <div className={styles.fieldCompact}>
            <label htmlFor="capacidad_tipo">Capacidad del tipo</label>
            <input
              id="capacidad_tipo"
              value={
                selectedTipoHabitacion
                  ? `${selectedTipoHabitacion.capacidadAdultos} adultos / ${selectedTipoHabitacion.capacidadNinos} niños`
                  : ""
              }
              readOnly
              aria-describedby={getFieldIds("capacidad_tipo").help}
            />
            <span
              id={getFieldIds("capacidad_tipo").help}
              className={styles.helperText}
            >
              Referencia informativa basada en el tipo de habitación seleccionado.
            </span>
          </div>
          <div className={getFieldClassName("fieldCompact", "precio_base")}>
            <label htmlFor="precio_base">Precio base</label>
            <input
              id="precio_base"
              type="number"
              min="0.01"
              step="0.01"
              name="precio_base"
              value={form.precio_base}
              onChange={handleChange}
              onBlur={handleBlur}
              aria-invalid={showFieldError("precio_base")}
              aria-describedby={getFieldDescribedBy(
                "precio_base",
                showFieldError("precio_base")
              )}
              required
            />
            <span id={getFieldIds("precio_base").help} className={styles.helperText}>
              Valor base por noche antes de descuentos o recargos.
            </span>
            {showFieldError("precio_base") && (
              <span
                id={getFieldIds("precio_base").error}
                className={styles.errorText}
              >
                {fieldErrors.precio_base}
              </span>
            )}
          </div>
          {isEditMode && (
            <div className={getFieldClassName("fieldCompact", "estado_habitacion")}>
              <label htmlFor="estado_habitacion">Estado</label>
              <select
                id="estado_habitacion"
                name="estado_habitacion"
                value={form.estado_habitacion}
                onChange={handleChange}
                onBlur={handleBlur}
                aria-invalid={showFieldError("estado_habitacion")}
                aria-describedby={getFieldDescribedBy(
                  "estado_habitacion",
                  showFieldError("estado_habitacion")
                )}
              >
                {HABITACION_ESTADOS.map((estado) => (
                  <option key={estado} value={estado}>
                    {estado}
                  </option>
                ))}
              </select>
              <span
                id={getFieldIds("estado_habitacion").help}
                className={styles.helperText}
              >
                Estados permitidos: {HABITACION_ESTADOS.join(", ")}.
              </span>
              {showFieldError("estado_habitacion") && (
                <span
                  id={getFieldIds("estado_habitacion").error}
                  className={styles.errorText}
                >
                  {fieldErrors.estado_habitacion}
                </span>
              )}
            </div>
          )}
          <div className={getFieldClassName("fieldFull", "descripcion_habitacion")}>
            <label htmlFor="descripcion_habitacion">Descripción</label>
            <textarea
              id="descripcion_habitacion"
              name="descripcion_habitacion"
              maxLength={MAX_LENGTHS.habitacion.descripcion}
              value={form.descripcion_habitacion}
              onChange={handleChange}
              onBlur={handleBlur}
              aria-invalid={showFieldError("descripcion_habitacion")}
              aria-describedby={getFieldDescribedBy(
                "descripcion_habitacion",
                showFieldError("descripcion_habitacion")
              )}
            />
            <div className={styles.fieldMeta}>
              <span
                id={getFieldIds("descripcion_habitacion").help}
                className={styles.helperText}
              >
                Campo opcional para observaciones visibles en gestión interna.
              </span>
              <span className={styles.counterText}>
                {form.descripcion_habitacion.length}/{MAX_LENGTHS.habitacion.descripcion}
              </span>
            </div>
            {showFieldError("descripcion_habitacion") && (
              <span
                id={getFieldIds("descripcion_habitacion").error}
                className={styles.errorText}
              >
                {fieldErrors.descripcion_habitacion}
              </span>
            )}
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

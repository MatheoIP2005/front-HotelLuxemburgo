import { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import {
  createCatalogoItem,
  getCatalogoItem,
  updateCatalogoItem,
} from "../../../services/catalogoServicios.service";
import { getSucursales } from "../../../services/sucursales.service";
import { normalizeCollectionPayload } from "../../../utils/api";
import {
  CATALOGO_ESTADOS,
  CATALOGO_TIPOS,
  MAX_LENGTHS,
} from "../../../utils/constraints";
import styles from "../usuarios/UsuarioFormPage.module.css";

const trimLoadedText = (value) =>
  typeof value === "string" ? value.trim() : value == null ? "" : String(value).trim();

const joinDescribedBy = (...ids) => ids.filter(Boolean).join(" ") || undefined;

export default function CatalogoServicioFormPage() {
  const navigate = useNavigate();
  const { id } = useParams();
  const isEditMode = Boolean(id);

  const [form, setForm] = useState({
    id_sucursal: "",
    sucursal_guid: "",
    codigo_catalogo: "",
    nombre_catalogo: "",
    tipo_catalogo: "AME",
    categoria_catalogo: "",
    descripcion_catalogo: "",
    precio_base: "0",
    aplica_iva: false,
    disponible_24h: false,
    hora_inicio: "",
    hora_fin: "",
    icono_url: "",
    estado_catalogo: "ACT",
  });
  const [sucursales, setSucursales] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(null);
  const [fieldErrors, setFieldErrors] = useState({});
  const [touchedFields, setTouchedFields] = useState({});
  const [submitAttempted, setSubmitAttempted] = useState(false);

  const validateForm = (currentForm) => {
    const nextErrors = {};
    const codigoCatalogo = currentForm.codigo_catalogo.trim();
    const nombreCatalogo = currentForm.nombre_catalogo.trim();
    const categoriaCatalogo = currentForm.categoria_catalogo.trim();
    const descripcionCatalogo = currentForm.descripcion_catalogo.trim();
    const iconoUrl = currentForm.icono_url.trim();
    const precioBase = Number(currentForm.precio_base);

    if (!currentForm.id_sucursal || Number(currentForm.id_sucursal) <= 0) {
      nextErrors.id_sucursal = "Debes seleccionar una sucursal válida.";
    }
    if (!codigoCatalogo) {
      nextErrors.codigo_catalogo = "El código es obligatorio.";
    } else if (codigoCatalogo.length > MAX_LENGTHS.catalogo.codigo) {
      nextErrors.codigo_catalogo = "El código no puede exceder 10 caracteres.";
    }
    if (!nombreCatalogo) {
      nextErrors.nombre_catalogo = "El nombre es obligatorio.";
    } else if (nombreCatalogo.length > MAX_LENGTHS.catalogo.nombre) {
      nextErrors.nombre_catalogo = "El nombre no puede exceder 60 caracteres.";
    }
    if (!CATALOGO_TIPOS.includes(currentForm.tipo_catalogo)) {
      nextErrors.tipo_catalogo = "El tipo de catálogo no es válido.";
    }
    if (!categoriaCatalogo) {
      nextErrors.categoria_catalogo = "La categoría es obligatoria.";
    } else if (categoriaCatalogo.length > MAX_LENGTHS.catalogo.categoria) {
      nextErrors.categoria_catalogo = "La categoría no puede exceder 80 caracteres.";
    }
    if (currentForm.precio_base === "" || Number.isNaN(precioBase)) {
      nextErrors.precio_base = "Ingresa un precio base válido.";
    } else if (precioBase < 0) {
      nextErrors.precio_base = "El precio base no puede ser negativo.";
    } else if (currentForm.tipo_catalogo === "AME" && precioBase !== 0) {
      nextErrors.precio_base = "Las amenidades (AME) deben tener precio base igual a 0.";
    }
    if (descripcionCatalogo.length > MAX_LENGTHS.catalogo.descripcion) {
      nextErrors.descripcion_catalogo =
        "La descripción no puede exceder 250 caracteres.";
    }
    if (iconoUrl.length > MAX_LENGTHS.catalogo.iconoUrl) {
      nextErrors.icono_url = "La URL del ícono no puede exceder 500 caracteres.";
    }
    if (!CATALOGO_ESTADOS.includes(currentForm.estado_catalogo)) {
      nextErrors.estado_catalogo = "El estado del catálogo no es válido.";
    }

    if (!currentForm.disponible_24h) {
      if (Boolean(currentForm.hora_inicio) !== Boolean(currentForm.hora_fin)) {
        nextErrors.hora_inicio = "Debes ingresar ambas horas o dejar ambas vacías.";
        nextErrors.hora_fin = "Debes ingresar ambas horas o dejar ambas vacías.";
      } else if (
        currentForm.hora_inicio &&
        currentForm.hora_fin &&
        currentForm.hora_fin <= currentForm.hora_inicio
      ) {
        nextErrors.hora_fin = "La hora fin debe ser posterior a la hora inicio.";
      }
    }

    return nextErrors;
  };

  const showFieldError = (fieldName) =>
    Boolean(fieldErrors[fieldName]) && (submitAttempted || touchedFields[fieldName]);

  const getFieldClassName = (baseClassName, fieldName) =>
    [baseClassName, showFieldError(fieldName) ? styles.fieldError : ""]
      .filter(Boolean)
      .join(" ");

  const renderFieldMeta = (fieldName, helpText, value, maxLength) => (
    <>
      {(helpText || typeof maxLength === "number") && (
        <div className={styles.fieldMeta}>
          {helpText ? (
            <span id={`${fieldName}-help`} className={styles.helpText}>
              {helpText}
            </span>
          ) : (
            <span />
          )}
          {typeof maxLength === "number" ? (
            <span id={`${fieldName}-counter`} className={styles.counterText}>
              {String(value || "").length}/{maxLength}
            </span>
          ) : null}
        </div>
      )}
      {showFieldError(fieldName) ? (
        <span id={`${fieldName}-error`} className={styles.errorText}>
          {fieldErrors[fieldName]}
        </span>
      ) : null}
    </>
  );

  useEffect(() => {
    const loadData = async () => {
      setLoading(true);
      setError(null);
      try {
        const [sucursalesResponse, response] = await Promise.all([
          getSucursales({ pagina: 1, limite: 100 }),
          id ? getCatalogoItem(id) : Promise.resolve(null),
        ]);
        const availableSucursales = normalizeCollectionPayload(sucursalesResponse).items;
        setSucursales(availableSucursales);

        const item = response || {};
        const matchedSucursal = availableSucursales.find(
          (current) => current.idSucursal === item.idSucursal
        );

        setForm((prev) => ({
          ...prev,
          id_sucursal: item.idSucursal ?? "",
          sucursal_guid: trimLoadedText(matchedSucursal?.sucursalGuid),
          codigo_catalogo: trimLoadedText(item.codigoCatalogo),
          nombre_catalogo: trimLoadedText(item.nombreCatalogo),
          tipo_catalogo: trimLoadedText(item.tipoCatalogo) || "AME",
          categoria_catalogo: trimLoadedText(item.categoriaCatalogo),
          descripcion_catalogo: trimLoadedText(item.descripcionCatalogo),
          precio_base:
            item.precioBase == null ? "0" : trimLoadedText(String(item.precioBase)),
          aplica_iva: Boolean(item.aplicaIva),
          disponible_24h: Boolean(item.disponible24h),
          hora_inicio: trimLoadedText(item.horaInicio),
          hora_fin: trimLoadedText(item.horaFin),
          icono_url: trimLoadedText(item.iconoUrl),
          estado_catalogo: trimLoadedText(item.estadoCatalogo) || "ACT",
        }));
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
    let nextForm;

    if (name === "id_sucursal") {
      const sucursal = sucursales.find(
        (item) => String(item.idSucursal) === String(value)
      );
      nextForm = {
        ...form,
        id_sucursal: value,
        sucursal_guid: trimLoadedText(sucursal?.sucursalGuid),
      };
    } else if (name === "tipo_catalogo") {
      nextForm = {
        ...form,
        tipo_catalogo: value,
        precio_base: value === "AME" ? "0" : form.precio_base,
      };
    } else if (name === "disponible_24h") {
      nextForm = {
        ...form,
        disponible_24h: checked,
        hora_inicio: checked ? "" : form.hora_inicio,
        hora_fin: checked ? "" : form.hora_fin,
      };
    } else {
      nextForm = { ...form, [name]: type === "checkbox" ? checked : value };
    }

    setForm(nextForm);
    setError(null);

    if (submitAttempted || touchedFields[name]) {
      setFieldErrors(validateForm(nextForm));
    }
  };

  const handleBlur = (e) => {
    const { name } = e.target;

    setTouchedFields((prev) => ({ ...prev, [name]: true }));
    setFieldErrors(validateForm(form));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSubmitAttempted(true);
    setError(null);
    setSuccess(null);

    const nextErrors = validateForm(form);
    setFieldErrors(nextErrors);

    if (Object.keys(nextErrors).length > 0) {
      return;
    }

    setLoading(true);
    try {
      const codigoCatalogo = form.codigo_catalogo.trim();
      const nombreCatalogo = form.nombre_catalogo.trim();
      const categoriaCatalogo = form.categoria_catalogo.trim();

      const payload = {
        idSucursal: Number(form.id_sucursal),
        codigoCatalogo,
        nombreCatalogo,
        tipoCatalogo: form.tipo_catalogo,
        categoriaCatalogo,
        descripcionCatalogo: form.descripcion_catalogo.trim() || null,
        precioBase: Number(form.precio_base),
        aplicaIva: form.aplica_iva,
        disponible24h: form.disponible_24h,
        horaInicio: form.hora_inicio || null,
        horaFin: form.hora_fin || null,
        iconoUrl: form.icono_url.trim() || null,
        estadoCatalogo: form.estado_catalogo,
      };

      if (isEditMode) {
        await updateCatalogoItem(id, payload);
        setSuccess("Registro actualizado correctamente.");
      } else {
        await createCatalogoItem(payload);
        setSuccess("Registro creado correctamente.");
      }

      setTimeout(() => navigate("/admin/catalogo-servicios"), 1500);
    } catch (err) {
      setError(err?.response?.data?.message || err?.message || "Error al guardar");
    } finally {
      setLoading(false);
    }
  };

  return (
    <form className={styles.page} onSubmit={handleSubmit} noValidate>
      <div className={styles.topBar}>
        <h2>{isEditMode ? "Editar Servicio/Catalogo" : "Nuevo Servicio/Catalogo"}</h2>
        <button
          type="button"
          className={styles.btnSecondary}
          onClick={() => navigate("/admin/catalogo-servicios")}
        >
          Volver
        </button>
      </div>

      {error && <div className={styles.errorBox}>{error}</div>}
      {success && <div className={styles.successBox}>{success}</div>}

      <section className={styles.card}>
        <h3 className={styles.sectionTitle}>Informacion</h3>
        <div className={styles.grid2}>
          <div className={getFieldClassName(styles.fieldWide, "id_sucursal")}>
            <label htmlFor="id_sucursal">Sucursal</label>
            <select
              id="id_sucursal"
              name="id_sucursal"
              value={form.id_sucursal}
              onChange={handleChange}
              onBlur={handleBlur}
              aria-invalid={showFieldError("id_sucursal")}
              aria-describedby={joinDescribedBy(
                "id_sucursal-help",
                showFieldError("id_sucursal") ? "id_sucursal-error" : null
              )}
            >
              <option value="">Selecciona una sucursal</option>
              {sucursales.map((item) => (
                <option
                  key={trimLoadedText(item.sucursalGuid) || item.idSucursal}
                  value={item.idSucursal}
                >
                  {trimLoadedText(item.nombreSucursal)} ({trimLoadedText(item.codigoSucursal)}) -
                  ID {item.idSucursal}
                </option>
              ))}
            </select>
            {renderFieldMeta(
              "id_sucursal",
              `GUID: ${form.sucursal_guid || "N/A"}`,
              null,
              null
            )}
          </div>

          <div className={getFieldClassName(styles.fieldCompact, "codigo_catalogo")}>
            <label htmlFor="codigo_catalogo">Codigo</label>
            <input
              id="codigo_catalogo"
              name="codigo_catalogo"
              maxLength={10}
              value={form.codigo_catalogo}
              onChange={handleChange}
              onBlur={handleBlur}
              required
              placeholder="Ej. SPA001"
              aria-invalid={showFieldError("codigo_catalogo")}
              aria-describedby={joinDescribedBy(
                "codigo_catalogo-help",
                "codigo_catalogo-counter",
                showFieldError("codigo_catalogo") ? "codigo_catalogo-error" : null
              )}
            />
            {renderFieldMeta(
              "codigo_catalogo",
              "Identificador corto del servicio o amenidad.",
              form.codigo_catalogo,
              10
            )}
          </div>

          <div className={getFieldClassName(styles.fieldWide, "nombre_catalogo")}>
            <label htmlFor="nombre_catalogo">Nombre</label>
            <input
              id="nombre_catalogo"
              name="nombre_catalogo"
              maxLength={60}
              value={form.nombre_catalogo}
              onChange={handleChange}
              onBlur={handleBlur}
              required
              placeholder="Nombre visible en el catalogo"
              aria-invalid={showFieldError("nombre_catalogo")}
              aria-describedby={joinDescribedBy(
                "nombre_catalogo-help",
                "nombre_catalogo-counter",
                showFieldError("nombre_catalogo") ? "nombre_catalogo-error" : null
              )}
            />
            {renderFieldMeta(
              "nombre_catalogo",
              "Nombre comercial que vera el usuario en la interfaz.",
              form.nombre_catalogo,
              60
            )}
          </div>

          <div className={getFieldClassName(styles.fieldCompact, "tipo_catalogo")}>
            <label htmlFor="tipo_catalogo">Tipo</label>
            <select
              id="tipo_catalogo"
              name="tipo_catalogo"
              value={form.tipo_catalogo}
              onChange={handleChange}
              onBlur={handleBlur}
              aria-invalid={showFieldError("tipo_catalogo")}
              aria-describedby={joinDescribedBy(
                "tipo_catalogo-help",
                showFieldError("tipo_catalogo") ? "tipo_catalogo-error" : null
              )}
            >
              {CATALOGO_TIPOS.map((tipo) => (
                <option key={tipo} value={tipo}>
                  {trimLoadedText(tipo)}
                </option>
              ))}
            </select>
            {renderFieldMeta(
              "tipo_catalogo",
              "AME exige precio 0; SRV permite precio mayor o igual a 0.",
              null,
              null
            )}
          </div>

          <div className={getFieldClassName(styles.fieldWide, "categoria_catalogo")}>
            <label htmlFor="categoria_catalogo">Categoria</label>
            <input
              id="categoria_catalogo"
              name="categoria_catalogo"
              maxLength={80}
              value={form.categoria_catalogo}
              onChange={handleChange}
              onBlur={handleBlur}
              required
              placeholder="Ej. Bienestar, Transporte, Habitacion"
              aria-invalid={showFieldError("categoria_catalogo")}
              aria-describedby={joinDescribedBy(
                "categoria_catalogo-help",
                "categoria_catalogo-counter",
                showFieldError("categoria_catalogo") ? "categoria_catalogo-error" : null
              )}
            />
            {renderFieldMeta(
              "categoria_catalogo",
              "Agrupa items similares para facilitar la busqueda.",
              form.categoria_catalogo,
              80
            )}
          </div>

          <div className={getFieldClassName(styles.fieldCompact, "precio_base")}>
            <label htmlFor="precio_base">Precio base</label>
            <input
              id="precio_base"
              type="number"
              min="0"
              step="0.01"
              name="precio_base"
              value={form.precio_base}
              onChange={handleChange}
              onBlur={handleBlur}
              required
              readOnly={form.tipo_catalogo === "AME"}
              aria-invalid={showFieldError("precio_base")}
              aria-describedby={joinDescribedBy(
                "precio_base-help",
                showFieldError("precio_base") ? "precio_base-error" : null
              )}
            />
            {renderFieldMeta(
              "precio_base",
              form.tipo_catalogo === "AME"
                ? "Para amenidades el valor siempre debe ser 0."
                : "Ingresa un valor numerico mayor o igual a 0.",
              null,
              null
            )}
          </div>

          <div className={getFieldClassName(styles.fieldWide, "icono_url")}>
            <label htmlFor="icono_url">Icono URL</label>
            <input
              id="icono_url"
              name="icono_url"
              maxLength={500}
              value={form.icono_url}
              onChange={handleChange}
              onBlur={handleBlur}
              placeholder="https://..."
              aria-invalid={showFieldError("icono_url")}
              aria-describedby={joinDescribedBy(
                "icono_url-help",
                "icono_url-counter",
                showFieldError("icono_url") ? "icono_url-error" : null
              )}
            />
            {renderFieldMeta(
              "icono_url",
              "Opcional. Usa una URL corta y estable para el icono del item.",
              form.icono_url,
              500
            )}
          </div>

          <div className={getFieldClassName(styles.fieldCompact, "hora_inicio")}>
            <label htmlFor="hora_inicio">Hora inicio</label>
            <input
              id="hora_inicio"
              type="time"
              name="hora_inicio"
              value={form.hora_inicio}
              onChange={handleChange}
              onBlur={handleBlur}
              disabled={form.disponible_24h}
              aria-invalid={showFieldError("hora_inicio")}
              aria-describedby={joinDescribedBy(
                "hora_inicio-help",
                showFieldError("hora_inicio") ? "hora_inicio-error" : null
              )}
            />
            {renderFieldMeta(
              "hora_inicio",
              form.disponible_24h
                ? "No aplica cuando el servicio esta disponible 24 horas."
                : "Opcional. Si ingresas inicio, tambien debes ingresar fin.",
              null,
              null
            )}
          </div>

          <div className={getFieldClassName(styles.fieldCompact, "hora_fin")}>
            <label htmlFor="hora_fin">Hora fin</label>
            <input
              id="hora_fin"
              type="time"
              name="hora_fin"
              value={form.hora_fin}
              onChange={handleChange}
              onBlur={handleBlur}
              disabled={form.disponible_24h}
              aria-invalid={showFieldError("hora_fin")}
              aria-describedby={joinDescribedBy(
                "hora_fin-help",
                showFieldError("hora_fin") ? "hora_fin-error" : null
              )}
            />
            {renderFieldMeta(
              "hora_fin",
              form.disponible_24h
                ? "No aplica cuando el servicio esta disponible 24 horas."
                : "Debe ser posterior a la hora de inicio.",
              null,
              null
            )}
          </div>

          {isEditMode && (
            <div className={getFieldClassName(styles.fieldCompact, "estado_catalogo")}>
              <label htmlFor="estado_catalogo">Estado</label>
              <select
                id="estado_catalogo"
                name="estado_catalogo"
                value={form.estado_catalogo}
                onChange={handleChange}
                onBlur={handleBlur}
                aria-invalid={showFieldError("estado_catalogo")}
                aria-describedby={joinDescribedBy(
                  "estado_catalogo-help",
                  showFieldError("estado_catalogo") ? "estado_catalogo-error" : null
                )}
              >
                {CATALOGO_ESTADOS.map((estado) => (
                  <option key={estado} value={estado}>
                    {trimLoadedText(estado)}
                  </option>
                ))}
              </select>
              {renderFieldMeta(
                "estado_catalogo",
                "ACT mantiene el item disponible; INA lo oculta del uso operativo.",
                null,
                null
              )}
            </div>
          )}

          <div className={getFieldClassName(styles.fieldFull, "descripcion_catalogo")}>
            <label htmlFor="descripcion_catalogo">Descripcion</label>
            <textarea
              id="descripcion_catalogo"
              name="descripcion_catalogo"
              maxLength={250}
              value={form.descripcion_catalogo}
              onChange={handleChange}
              onBlur={handleBlur}
              placeholder="Describe brevemente el servicio o amenidad."
              aria-invalid={showFieldError("descripcion_catalogo")}
              aria-describedby={joinDescribedBy(
                "descripcion_catalogo-help",
                "descripcion_catalogo-counter",
                showFieldError("descripcion_catalogo")
                  ? "descripcion_catalogo-error"
                  : null
              )}
            />
            {renderFieldMeta(
              "descripcion_catalogo",
              "Opcional. Resume beneficios, condiciones o alcance del item.",
              form.descripcion_catalogo,
              250
            )}
          </div>

          <div className={styles.fieldFull}>
            <div className={styles.checkboxGroup}>
              <div className={styles.checkboxField}>
                <label className={styles.checkboxItem} htmlFor="aplica_iva">
                  <input
                    id="aplica_iva"
                    type="checkbox"
                    name="aplica_iva"
                    checked={form.aplica_iva}
                    onChange={handleChange}
                  />
                  Aplica IVA
                </label>
              </div>
              <div className={styles.checkboxField}>
                <label className={styles.checkboxItem} htmlFor="disponible_24h">
                  <input
                    id="disponible_24h"
                    type="checkbox"
                    name="disponible_24h"
                    checked={form.disponible_24h}
                    onChange={handleChange}
                    onBlur={handleBlur}
                  />
                  Disponible 24h
                </label>
              </div>
            </div>
          </div>
        </div>
      </section>

      <div className={styles.actions}>
        <button
          type="button"
          className={styles.btnSecondary}
          onClick={() => navigate("/admin/catalogo-servicios")}
        >
          Cancelar
        </button>
        <button type="submit" className={styles.btnPrimary} disabled={loading}>
          {loading ? "Guardando..." : "Guardar"}
        </button>
      </div>
    </form>
  );
}

import { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import {
  createTipoHabitacion,
  getTipoHabitacion,
  updateTipoHabitacion,
} from "../../../services/tiposHabitacion.service";
import { getCatalogo } from "../../../services/catalogoServicios.service";
import { uploadImage } from "../../../services/images.service";
import {
  asignarAmenidadTipoHabitacion,
  getTipoHabitacionAmenidades,
  removerAmenidadTipoHabitacion,
} from "../../../services/tipoHabitacionAmenidades.service";
import {
  createTipoHabitacionImagen,
  deleteTipoHabitacionImagen,
  getTipoHabitacionImagenes,
} from "../../../services/tipoHabitacionImagenes.service";
import { CATALOGO_TIPOS, MAX_LENGTHS } from "../../../utils/constraints";
import { normalizeCollectionPayload } from "../../../utils/api";
import styles from "../usuarios/UsuarioFormPage.module.css";

const EMPTY_IMAGE_FORM = {
  url_imagen: "",
  descripcion_imagen: "",
  orden_visualizacion: "1",
  es_principal: false,
};

const EMPTY_FORM = {
  codigo_tipo_habitacion: "",
  nombre_tipo_habitacion: "",
  descripcion: "",
  capacidad_adultos: "",
  capacidad_ninos: "0",
  tipo_cama: "",
  area_m2: "",
  estado_tipo_habitacion: "ACT",
  permite_reserva_publica: true,
};

const TIPO_LIMITS = {
  codigo: 30,
  nombre: 60,
  tipoCama: 60,
};

const trimText = (value) => (typeof value === "string" ? value.trim() : value);

const getTipoHabitacionGuid = (value) =>
  value?.tipoHabitacionGuid ??
  value?.tipo_habitacion_guid ??
  value?.data?.tipoHabitacionGuid ??
  value?.data?.tipo_habitacion_guid ??
  "";

const buildDescribedBy = (...ids) => ids.filter(Boolean).join(" ") || undefined;

const getCounterText = (value, max) => `${String(value ?? "").length}/${max}`;

const getCharacterCount = (value) => `${String(value ?? "").length} caracteres`;

const getFieldClassName = (baseClassName, hasError) =>
  hasError ? `${baseClassName} ${styles.fieldError}` : baseClassName;

const isPositiveInteger = (value) => {
  const parsed = Number(value);
  return Number.isInteger(parsed) && parsed > 0;
};

const isNonNegativeInteger = (value) => {
  const parsed = Number(value);
  return Number.isInteger(parsed) && parsed >= 0;
};

const isPositiveNumber = (value) => {
  const parsed = Number(value);
  return Number.isFinite(parsed) && parsed > 0;
};

const validateTipoField = (name, value, currentForm) => {
  const trimmedValue = typeof value === "string" ? value.trim() : value;

  switch (name) {
    case "codigo_tipo_habitacion":
      if (!trimmedValue) {
        return "El codigo es obligatorio.";
      }
      if (trimmedValue.length > TIPO_LIMITS.codigo) {
        return "El codigo no puede exceder 30 caracteres.";
      }
      return "";
    case "nombre_tipo_habitacion":
      if (!trimmedValue) {
        return "El nombre es obligatorio.";
      }
      if (trimmedValue.length > TIPO_LIMITS.nombre) {
        return "El nombre no puede exceder 60 caracteres.";
      }
      return "";
    case "capacidad_adultos":
      if (trimmedValue === "") {
        return "La capacidad de adultos es obligatoria.";
      }
      if (!isPositiveInteger(trimmedValue)) {
        return "La capacidad de adultos debe ser un entero mayor a cero.";
      }
      return "";
    case "capacidad_ninos":
      if (trimmedValue === "") {
        return "La capacidad de ninos es obligatoria.";
      }
      if (!isNonNegativeInteger(trimmedValue)) {
        return "La capacidad de ninos debe ser un entero mayor o igual a cero.";
      }
      return "";
    case "capacidad_total": {
      const total =
        (Number(currentForm.capacidad_adultos) || 0) + (Number(currentForm.capacidad_ninos) || 0);
      if (!Number.isFinite(total) || total <= 0) {
        return "La capacidad total debe ser mayor a cero.";
      }
      return "";
    }
    case "tipo_cama":
      if (trimmedValue.length > TIPO_LIMITS.tipoCama) {
        return "El tipo de cama no puede exceder 60 caracteres.";
      }
      return "";
    case "area_m2":
      if (trimmedValue === "") {
        return "El area en m2 es obligatoria.";
      }
      if (!isPositiveNumber(trimmedValue)) {
        return "El area en m2 debe ser mayor a cero.";
      }
      return "";
    case "estado_tipo_habitacion":
      if (!["ACT", "INA"].includes(value)) {
        return "El estado debe ser ACT o INA.";
      }
      return "";
    case "selectedAmenidadGuid":
      if (!value) {
        return "Selecciona una amenidad para asignarla.";
      }
      return "";
    case "url_imagen":
      if (!trimmedValue) {
        return "La URL de la imagen es obligatoria.";
      }
      if (trimmedValue.length > MAX_LENGTHS.imagen.url) {
        return `La URL no puede exceder ${MAX_LENGTHS.imagen.url} caracteres.`;
      }
      return "";
    case "descripcion_imagen":
      if (trimmedValue.length > MAX_LENGTHS.imagen.descripcion) {
        return `La descripcion no puede exceder ${MAX_LENGTHS.imagen.descripcion} caracteres.`;
      }
      return "";
    case "orden_visualizacion":
      if (trimmedValue === "") {
        return "El orden es obligatorio.";
      }
      if (!isPositiveInteger(trimmedValue)) {
        return "El orden debe ser un entero mayor a cero.";
      }
      return "";
    default:
      return "";
  }
};

export default function TipoHabitacionFormPage() {
  const navigate = useNavigate();
  const { id } = useParams();
  const isEditMode = Boolean(id);

  const [form, setForm] = useState(EMPTY_FORM);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(null);
  const [fieldErrors, setFieldErrors] = useState({});
  const [imagenes, setImagenes] = useState([]);
  const [imagenForm, setImagenForm] = useState(EMPTY_IMAGE_FORM);
  const [amenidades, setAmenidades] = useState([]);
  const [catalogoAmenidades, setCatalogoAmenidades] = useState([]);
  const [selectedAmenidadGuid, setSelectedAmenidadGuid] = useState("");
  const [assetLoading, setAssetLoading] = useState(false);

  const capacidadTotal =
    (Number(form.capacidad_adultos) || 0) + (Number(form.capacidad_ninos) || 0);

  useEffect(() => {
    const loadData = async () => {
      if (!id) return;

      setLoading(true);
      setError(null);
      try {
        const [response, imagenesResponse, amenidadesResponse, catalogoResponse] = await Promise.all([
          getTipoHabitacion(id),
          getTipoHabitacionImagenes(id).catch(() => []),
          getTipoHabitacionAmenidades(id).catch(() => []),
          getCatalogo({ pagina: 1, limite: 300, tipoCatalogo: CATALOGO_TIPOS[0] }).catch(() => []),
        ]);

        const item = response?.data || response || {};
        setForm((prev) => ({
          ...prev,
          codigo_tipo_habitacion: trimText(item.codigoTipoHabitacion ?? ""),
          nombre_tipo_habitacion: trimText(item.nombreTipoHabitacion ?? ""),
          descripcion: trimText(item.descripcion ?? ""),
          capacidad_adultos:
            item.capacidadAdultos === null || item.capacidadAdultos === undefined
              ? ""
              : String(item.capacidadAdultos),
          capacidad_ninos:
            item.capacidadNinos === null || item.capacidadNinos === undefined
              ? "0"
              : String(item.capacidadNinos),
          tipo_cama: trimText(item.tipoCama ?? ""),
          area_m2: item.areaM2 === null || item.areaM2 === undefined ? "" : String(item.areaM2),
          estado_tipo_habitacion: trimText(item.estadoTipoHabitacion) || "ACT",
          permite_reserva_publica:
            item.permiteReservaPublica === null || item.permiteReservaPublica === undefined
              ? prev.permite_reserva_publica
              : Boolean(item.permiteReservaPublica),
        }));
        setImagenes(Array.isArray(imagenesResponse) ? imagenesResponse : []);
        setAmenidades(Array.isArray(amenidadesResponse) ? amenidadesResponse : []);
        setCatalogoAmenidades(
          normalizeCollectionPayload(catalogoResponse, { pagina: 1, limite: 300 }).items.filter(
            (catalogo) => trimText(catalogo.tipoCatalogo) === "AME"
          )
        );
      } catch (err) {
        setError(err?.response?.data?.message || "Error al cargar el registro");
      } finally {
        setLoading(false);
      }
    };

    loadData();
  }, [id]);

  const handleChange = (event) => {
    const { name, type, checked, value } = event.target;
    const nextValue = type === "checkbox" ? checked : value;

    setForm((prev) => {
      const nextForm = { ...prev, [name]: nextValue };

      if (
        fieldErrors[name] ||
        (["capacidad_adultos", "capacidad_ninos"].includes(name) && fieldErrors.capacidad_total)
      ) {
        setFieldErrors((prevErrors) => ({
          ...prevErrors,
          [name]: validateTipoField(name, nextValue, nextForm),
          ...(name === "capacidad_adultos" || name === "capacidad_ninos"
            ? { capacidad_total: validateTipoField("capacidad_total", "", nextForm) }
            : {}),
        }));
      }

      return nextForm;
    });
  };

  const handleBlur = (event) => {
    const { name, type, checked, value } = event.target;
    const nextValue = type === "checkbox" ? checked : value;
    const nextForm = { ...form, [name]: nextValue };

    setFieldErrors((prev) => ({
      ...prev,
      [name]: validateTipoField(name, nextValue, nextForm),
      ...(name === "capacidad_adultos" || name === "capacidad_ninos"
        ? { capacidad_total: validateTipoField("capacidad_total", "", nextForm) }
        : {}),
    }));
  };

  const handleImageChange = (event) => {
    const { name, value, type, checked } = event.target;
    const nextValue = type === "checkbox" ? checked : value;

    setImagenForm((prev) => ({
      ...prev,
      [name]: nextValue,
    }));

    if (fieldErrors[name]) {
      setFieldErrors((prev) => ({
        ...prev,
        [name]: validateTipoField(name, nextValue, form),
      }));
    }
  };

  const handleImageBlur = (event) => {
    const { name, value, type, checked } = event.target;
    const nextValue = type === "checkbox" ? checked : value;

    setFieldErrors((prev) => ({
      ...prev,
      [name]: validateTipoField(name, nextValue, form),
    }));
  };

  const validateMainForm = () => {
    const nextErrors = {
      codigo_tipo_habitacion: validateTipoField(
        "codigo_tipo_habitacion",
        form.codigo_tipo_habitacion,
        form
      ),
      nombre_tipo_habitacion: validateTipoField(
        "nombre_tipo_habitacion",
        form.nombre_tipo_habitacion,
        form
      ),
      capacidad_adultos: validateTipoField("capacidad_adultos", form.capacidad_adultos, form),
      capacidad_ninos: validateTipoField("capacidad_ninos", form.capacidad_ninos, form),
      capacidad_total: validateTipoField("capacidad_total", "", form),
      tipo_cama: validateTipoField("tipo_cama", form.tipo_cama, form),
      area_m2: validateTipoField("area_m2", form.area_m2, form),
      estado_tipo_habitacion: validateTipoField(
        "estado_tipo_habitacion",
        form.estado_tipo_habitacion,
        form
      ),
    };

    setFieldErrors((prev) => ({
      ...prev,
      ...nextErrors,
    }));

    return Object.values(nextErrors).every((message) => !message);
  };

  const handleSubmit = async (event) => {
    event.preventDefault();
    setError(null);
    setSuccess(null);

    if (!validateMainForm()) {
      return;
    }

    setLoading(true);
    try {
      if (isEditMode) {
        await updateTipoHabitacion(id, form);
        setSuccess("Tipo de habitacion actualizado correctamente.");
      } else {
        const createdTipoHabitacion = await createTipoHabitacion(form);
        const createdTipoHabitacionGuid = getTipoHabitacionGuid(createdTipoHabitacion);

        if (imagenes.length > 0 && !createdTipoHabitacionGuid) {
          throw new Error(
            "El tipo de habitacion fue creado, pero no se pudo obtener su GUID para registrar las imagenes."
          );
        }

        if (createdTipoHabitacionGuid && imagenes.length > 0) {
          await Promise.all(
            imagenes.map((imagen) =>
              createTipoHabitacionImagen(createdTipoHabitacionGuid, {
                urlImagen: imagen.urlImagen,
                descripcionImagen: imagen.descripcionImagen,
                ordenVisualizacion: imagen.ordenVisualizacion,
                esPrincipal: imagen.esPrincipal,
              })
            )
          );
        }

        setSuccess(
          imagenes.length > 0
            ? "Tipo de habitacion creado correctamente con sus imagenes."
            : "Tipo de habitacion creado correctamente."
        );
      }
      setTimeout(() => navigate("/admin/tipos-habitacion"), 1500);
    } catch (err) {
      setError(err?.response?.data?.message || err?.message || "Error al guardar");
    } finally {
      setLoading(false);
    }
  };

  const refreshAssets = async (tipoHabitacionGuid = id) => {
    if (!tipoHabitacionGuid) return;

    const [imagenesResponse, amenidadesResponse] = await Promise.all([
      getTipoHabitacionImagenes(tipoHabitacionGuid).catch(() => []),
      getTipoHabitacionAmenidades(tipoHabitacionGuid).catch(() => []),
    ]);
    setImagenes(Array.isArray(imagenesResponse) ? imagenesResponse : []);
    setAmenidades(Array.isArray(amenidadesResponse) ? amenidadesResponse : []);
  };

  const handleUploadImage = async (event) => {
    const file = event.target.files?.[0];
    if (!file) return;

    setAssetLoading(true);
    setError(null);
    try {
      const result = await uploadImage(file);
      const nextUrl = trimText(
        result?.secureUrl ?? result?.url ?? result?.data?.secureUrl ?? result?.data?.url ?? ""
      );
      setImagenForm((prev) => ({
        ...prev,
        url_imagen: nextUrl,
      }));
      setFieldErrors((prev) => ({
        ...prev,
        url_imagen: validateTipoField("url_imagen", nextUrl, form),
      }));
    } catch (err) {
      setError(err?.response?.data?.message || err?.message || "No se pudo subir la imagen.");
    } finally {
      setAssetLoading(false);
      event.target.value = "";
    }
  };

  const handleAddImage = async () => {
    const nextErrors = {
      url_imagen: validateTipoField("url_imagen", imagenForm.url_imagen, form),
      descripcion_imagen: validateTipoField(
        "descripcion_imagen",
        imagenForm.descripcion_imagen,
        form
      ),
      orden_visualizacion: validateTipoField(
        "orden_visualizacion",
        imagenForm.orden_visualizacion,
        form
      ),
    };

    setFieldErrors((prev) => ({
      ...prev,
      ...nextErrors,
    }));

    if (Object.values(nextErrors).some(Boolean)) {
      return;
    }

    setAssetLoading(true);
    setError(null);
    setSuccess(null);
    try {
      const payload = {
        urlImagen: trimText(imagenForm.url_imagen),
        descripcionImagen: trimText(imagenForm.descripcion_imagen) || null,
        ordenVisualizacion: Number(imagenForm.orden_visualizacion || 1),
        esPrincipal: imagenForm.es_principal,
      };

      if (isEditMode) {
        await createTipoHabitacionImagen(id, payload);
        await refreshAssets(id);
        setSuccess("Imagen agregada correctamente.");
      } else {
        const stagedImage = {
          ...payload,
          tempId: `temp-${Date.now()}-${Math.random().toString(36).slice(2)}`,
        };

        setImagenes((prev) => [
          ...prev.map((imagen) =>
            stagedImage.esPrincipal ? { ...imagen, esPrincipal: false } : imagen
          ),
          stagedImage,
        ]);
        setSuccess("Imagen preparada. Se guardara al crear el tipo de habitacion.");
      }

      setImagenForm(EMPTY_IMAGE_FORM);
    } catch (err) {
      setError(err?.response?.data?.message || err?.message || "No se pudo registrar la imagen.");
    } finally {
      setAssetLoading(false);
    }
  };

  const handleDeleteImage = async (imageId) => {
    if (!isEditMode) {
      setImagenes((prev) => prev.filter((imagen) => imagen.tempId !== imageId));
      return;
    }
    if (!window.confirm("Deseas eliminar esta imagen?")) return;

    setAssetLoading(true);
    setError(null);
    setSuccess(null);
    try {
      await deleteTipoHabitacionImagen(id, imageId);
      await refreshAssets();
      setSuccess("Imagen eliminada correctamente.");
    } catch (err) {
      setError(err?.response?.data?.message || "No se pudo eliminar la imagen.");
    } finally {
      setAssetLoading(false);
    }
  };

  const handleAssignAmenidad = async () => {
    if (!id) return;

    const amenidadError = validateTipoField("selectedAmenidadGuid", selectedAmenidadGuid, form);
    setFieldErrors((prev) => ({
      ...prev,
      selectedAmenidadGuid: amenidadError,
    }));

    if (amenidadError) {
      return;
    }

    setAssetLoading(true);
    setError(null);
    setSuccess(null);
    try {
      await asignarAmenidadTipoHabitacion(id, selectedAmenidadGuid);
      await refreshAssets();
      setSelectedAmenidadGuid("");
      setFieldErrors((prev) => ({
        ...prev,
        selectedAmenidadGuid: "",
      }));
      setSuccess("Amenidad asignada correctamente.");
    } catch (err) {
      setError(err?.response?.data?.message || "No se pudo asignar la amenidad.");
    } finally {
      setAssetLoading(false);
    }
  };

  const handleRemoveAmenidad = async (amenidadId) => {
    if (!id) return;
    if (!window.confirm("Deseas remover esta amenidad?")) return;

    setAssetLoading(true);
    setError(null);
    setSuccess(null);
    try {
      await removerAmenidadTipoHabitacion(id, amenidadId);
      await refreshAssets();
      setSuccess("Amenidad removida correctamente.");
    } catch (err) {
      setError(err?.response?.data?.message || "No se pudo remover la amenidad.");
    } finally {
      setAssetLoading(false);
    }
  };

  return (
    <form className={styles.page} onSubmit={handleSubmit} noValidate>
      <div className={styles.topBar}>
        <h2>{isEditMode ? "Editar Tipo de Habitación" : "Nuevo Tipo de Habitación"}</h2>
        <button
          type="button"
          className={styles.btnSecondary}
          onClick={() => navigate("/admin/tipos-habitacion")}
        >
          Volver
        </button>
      </div>

      {error && (
        <div className={styles.errorBox} role="alert">
          {error}
        </div>
      )}
      {success && (
        <div className={styles.successBox} aria-live="polite">
          {success}
        </div>
      )}

      <section className={styles.card}>
        <h3 className={styles.sectionTitle}>Informacion</h3>
        <div className={styles.grid2}>
          <div className={getFieldClassName(styles.field, fieldErrors.codigo_tipo_habitacion)}>
            <label htmlFor="tipo-codigo">Codigo</label>
            <input
              id="tipo-codigo"
              name="codigo_tipo_habitacion"
              maxLength={TIPO_LIMITS.codigo}
              value={form.codigo_tipo_habitacion}
              onChange={handleChange}
              onBlur={handleBlur}
              spellCheck={false}
              aria-invalid={Boolean(fieldErrors.codigo_tipo_habitacion)}
              aria-describedby={buildDescribedBy(
                "tipo-codigo-help",
                "tipo-codigo-counter",
                fieldErrors.codigo_tipo_habitacion ? "tipo-codigo-error" : null
              )}
            />
            <div className={styles.fieldMeta}>
              <span id="tipo-codigo-help" className={styles.helpText}>
                Codigo interno unico del tipo de habitacion. Maximo 30 caracteres.
              </span>
              <span id="tipo-codigo-counter" className={styles.counterText}>
                {getCounterText(form.codigo_tipo_habitacion, TIPO_LIMITS.codigo)}
              </span>
            </div>
            {fieldErrors.codigo_tipo_habitacion && (
              <span id="tipo-codigo-error" className={styles.errorText} role="alert">
                {fieldErrors.codigo_tipo_habitacion}
              </span>
            )}
          </div>

          <div className={getFieldClassName(styles.field, fieldErrors.nombre_tipo_habitacion)}>
            <label htmlFor="tipo-nombre">Nombre</label>
            <input
              id="tipo-nombre"
              name="nombre_tipo_habitacion"
              maxLength={TIPO_LIMITS.nombre}
              value={form.nombre_tipo_habitacion}
              onChange={handleChange}
              onBlur={handleBlur}
              aria-invalid={Boolean(fieldErrors.nombre_tipo_habitacion)}
              aria-describedby={buildDescribedBy(
                "tipo-nombre-help",
                "tipo-nombre-counter",
                fieldErrors.nombre_tipo_habitacion ? "tipo-nombre-error" : null
              )}
            />
            <div className={styles.fieldMeta}>
              <span id="tipo-nombre-help" className={styles.helpText}>
                Nombre comercial visible en la administracion. Maximo 60 caracteres.
              </span>
              <span id="tipo-nombre-counter" className={styles.counterText}>
                {getCounterText(form.nombre_tipo_habitacion, TIPO_LIMITS.nombre)}
              </span>
            </div>
            {fieldErrors.nombre_tipo_habitacion && (
              <span id="tipo-nombre-error" className={styles.errorText} role="alert">
                {fieldErrors.nombre_tipo_habitacion}
              </span>
            )}
          </div>

          <div className={getFieldClassName(styles.field, fieldErrors.capacidad_adultos)}>
            <label htmlFor="tipo-capacidad-adultos">Capacidad adultos</label>
            <input
              id="tipo-capacidad-adultos"
              type="number"
              min="1"
              step="1"
              name="capacidad_adultos"
              value={form.capacidad_adultos}
              onChange={handleChange}
              onBlur={handleBlur}
              inputMode="numeric"
              aria-invalid={Boolean(fieldErrors.capacidad_adultos)}
              aria-describedby={buildDescribedBy(
                "tipo-capacidad-adultos-help",
                fieldErrors.capacidad_adultos ? "tipo-capacidad-adultos-error" : null
              )}
            />
            <span id="tipo-capacidad-adultos-help" className={styles.helpText}>
              Ingresa un entero mayor a cero.
            </span>
            {fieldErrors.capacidad_adultos && (
              <span id="tipo-capacidad-adultos-error" className={styles.errorText} role="alert">
                {fieldErrors.capacidad_adultos}
              </span>
            )}
          </div>

          <div className={getFieldClassName(styles.field, fieldErrors.capacidad_ninos)}>
            <label htmlFor="tipo-capacidad-ninos">Capacidad ninos</label>
            <input
              id="tipo-capacidad-ninos"
              type="number"
              min="0"
              step="1"
              name="capacidad_ninos"
              value={form.capacidad_ninos}
              onChange={handleChange}
              onBlur={handleBlur}
              inputMode="numeric"
              aria-invalid={Boolean(fieldErrors.capacidad_ninos)}
              aria-describedby={buildDescribedBy(
                "tipo-capacidad-ninos-help",
                fieldErrors.capacidad_ninos ? "tipo-capacidad-ninos-error" : null
              )}
            />
            <span id="tipo-capacidad-ninos-help" className={styles.helpText}>
              Ingresa un entero mayor o igual a cero.
            </span>
            {fieldErrors.capacidad_ninos && (
              <span id="tipo-capacidad-ninos-error" className={styles.errorText} role="alert">
                {fieldErrors.capacidad_ninos}
              </span>
            )}
          </div>

          <div className={getFieldClassName(styles.field, fieldErrors.capacidad_total)}>
            <label htmlFor="tipo-capacidad-total">Capacidad total</label>
            <input
              id="tipo-capacidad-total"
              value={capacidadTotal}
              readOnly
              aria-invalid={Boolean(fieldErrors.capacidad_total)}
              aria-describedby={buildDescribedBy(
                "tipo-capacidad-total-help",
                fieldErrors.capacidad_total ? "tipo-capacidad-total-error" : null
              )}
            />
            <span id="tipo-capacidad-total-help" className={styles.helpText}>
              Se calcula automaticamente sumando adultos y ninos.
            </span>
            {fieldErrors.capacidad_total && (
              <span id="tipo-capacidad-total-error" className={styles.errorText} role="alert">
                {fieldErrors.capacidad_total}
              </span>
            )}
          </div>

          <div className={getFieldClassName(styles.field, fieldErrors.tipo_cama)}>
            <label htmlFor="tipo-cama">Tipo cama</label>
            <input
              id="tipo-cama"
              name="tipo_cama"
              maxLength={TIPO_LIMITS.tipoCama}
              value={form.tipo_cama}
              onChange={handleChange}
              onBlur={handleBlur}
              aria-invalid={Boolean(fieldErrors.tipo_cama)}
              aria-describedby={buildDescribedBy(
                "tipo-cama-help",
                "tipo-cama-counter",
                fieldErrors.tipo_cama ? "tipo-cama-error" : null
              )}
            />
            <div className={styles.fieldMeta}>
              <span id="tipo-cama-help" className={styles.helpText}>
                Describe la configuracion principal de camas. Maximo 60 caracteres.
              </span>
              <span id="tipo-cama-counter" className={styles.counterText}>
                {getCounterText(form.tipo_cama, TIPO_LIMITS.tipoCama)}
              </span>
            </div>
            {fieldErrors.tipo_cama && (
              <span id="tipo-cama-error" className={styles.errorText} role="alert">
                {fieldErrors.tipo_cama}
              </span>
            )}
          </div>

          <div className={getFieldClassName(styles.field, fieldErrors.area_m2)}>
            <label htmlFor="tipo-area">Area m2</label>
            <input
              id="tipo-area"
              type="number"
              min="0.01"
              step="0.01"
              name="area_m2"
              value={form.area_m2}
              onChange={handleChange}
              onBlur={handleBlur}
              inputMode="decimal"
              aria-invalid={Boolean(fieldErrors.area_m2)}
              aria-describedby={buildDescribedBy(
                "tipo-area-help",
                fieldErrors.area_m2 ? "tipo-area-error" : null
              )}
            />
            <span id="tipo-area-help" className={styles.helpText}>
              Registra el area util de la habitacion. Debe ser mayor a cero.
            </span>
            {fieldErrors.area_m2 && (
              <span id="tipo-area-error" className={styles.errorText} role="alert">
                {fieldErrors.area_m2}
              </span>
            )}
          </div>

          <div className={styles.fieldFull}>
            <label htmlFor="tipo-descripcion">Descripcion</label>
            <textarea
              id="tipo-descripcion"
              name="descripcion"
              value={form.descripcion}
              onChange={handleChange}
              onBlur={handleBlur}
              rows={4}
              aria-describedby={buildDescribedBy("tipo-descripcion-help", "tipo-descripcion-counter")}
            />
            <div className={styles.fieldMeta}>
              <span id="tipo-descripcion-help" className={styles.helpText}>
                Resume distribucion, vistas o atributos diferenciales del tipo de habitacion.
              </span>
              <span id="tipo-descripcion-counter" className={styles.counterText}>
                {getCharacterCount(form.descripcion)}
              </span>
            </div>
          </div>
        </div>
      </section>

      <section className={styles.card}>
        <h3 className={styles.sectionTitle}>Configuracion</h3>
        <div className={styles.grid2}>
          <div className={styles.fieldFull}>
            <label htmlFor="tipo-reserva-publica">Reserva publica</label>
            <label className={styles.checkboxField}>
              <span className={styles.checkboxItem}>
                <input
                  id="tipo-reserva-publica"
                  type="checkbox"
                  name="permite_reserva_publica"
                  checked={form.permite_reserva_publica}
                  onChange={handleChange}
                  aria-describedby="tipo-reserva-publica-help"
                />
                Permite reserva publica
              </span>
            </label>
            <span id="tipo-reserva-publica-help" className={styles.helpText}>
              Activa esta opcion si el tipo puede mostrarse en flujos de reserva publica.
            </span>
          </div>

          <div className={getFieldClassName(styles.field, fieldErrors.estado_tipo_habitacion)}>
            <label htmlFor="tipo-estado">Estado</label>
            <select
              id="tipo-estado"
              name="estado_tipo_habitacion"
              value={form.estado_tipo_habitacion}
              onChange={handleChange}
              onBlur={handleBlur}
              aria-invalid={Boolean(fieldErrors.estado_tipo_habitacion)}
              aria-describedby={buildDescribedBy(
                "tipo-estado-help",
                fieldErrors.estado_tipo_habitacion ? "tipo-estado-error" : null
              )}
            >
              <option value="ACT">ACT</option>
              <option value="INA">INA</option>
            </select>
            <span id="tipo-estado-help" className={styles.helpText}>
              Usa ACT para disponibilidad normal e INA para ocultarlo de operaciones nuevas.
            </span>
            {fieldErrors.estado_tipo_habitacion && (
              <span id="tipo-estado-error" className={styles.errorText} role="alert">
                {fieldErrors.estado_tipo_habitacion}
              </span>
            )}
          </div>
        </div>
      </section>

      <section className={styles.card}>
          <h3 className={styles.sectionTitle}>Imagenes</h3>
          <div className={styles.grid2}>
            <div className={styles.fieldFull}>
              <label htmlFor="tipo-imagen-file">Subir archivo</label>
              <input id="tipo-imagen-file" type="file" accept="image/*" onChange={handleUploadImage} />
              <span className={styles.helpText}>
                {isEditMode
                  ? "Se sube con el endpoint interno o Cloudinary si las variables VITE_CLOUDINARY estan configuradas."
                  : "Puedes subir o preparar una o varias imagenes; se guardaran al crear el tipo de habitacion."}
              </span>
            </div>

            <div className={getFieldClassName(styles.fieldFull, fieldErrors.url_imagen)}>
              <label htmlFor="tipo-imagen-url">URL imagen</label>
              <input
                id="tipo-imagen-url"
                name="url_imagen"
                maxLength={MAX_LENGTHS.imagen.url}
                value={imagenForm.url_imagen}
                onChange={handleImageChange}
                onBlur={handleImageBlur}
                spellCheck={false}
                aria-invalid={Boolean(fieldErrors.url_imagen)}
                aria-describedby={buildDescribedBy(
                  "tipo-imagen-url-help",
                  "tipo-imagen-url-counter",
                  fieldErrors.url_imagen ? "tipo-imagen-url-error" : null
                )}
              />
              <div className={styles.fieldMeta}>
                <span id="tipo-imagen-url-help" className={styles.helpText}>
                  URL publica de la imagen. Maximo {MAX_LENGTHS.imagen.url} caracteres.
                </span>
                <span id="tipo-imagen-url-counter" className={styles.counterText}>
                  {getCounterText(imagenForm.url_imagen, MAX_LENGTHS.imagen.url)}
                </span>
              </div>
              {fieldErrors.url_imagen && (
                <span id="tipo-imagen-url-error" className={styles.errorText} role="alert">
                  {fieldErrors.url_imagen}
                </span>
              )}
            </div>

            {imagenForm.url_imagen && (
              <div className={styles.fieldFull}>
                <img
                  className={styles.imagePreviewLarge}
                  src={trimText(imagenForm.url_imagen)}
                  alt="Preview de imagen"
                />
              </div>
            )}

            <div className={getFieldClassName(styles.fieldFull, fieldErrors.descripcion_imagen)}>
              <label htmlFor="tipo-imagen-descripcion">Descripcion</label>
              <input
                id="tipo-imagen-descripcion"
                name="descripcion_imagen"
                maxLength={MAX_LENGTHS.imagen.descripcion}
                value={imagenForm.descripcion_imagen}
                onChange={handleImageChange}
                onBlur={handleImageBlur}
                aria-invalid={Boolean(fieldErrors.descripcion_imagen)}
                aria-describedby={buildDescribedBy(
                  "tipo-imagen-descripcion-help",
                  "tipo-imagen-descripcion-counter",
                  fieldErrors.descripcion_imagen ? "tipo-imagen-descripcion-error" : null
                )}
              />
              <div className={styles.fieldMeta}>
                <span id="tipo-imagen-descripcion-help" className={styles.helpText}>
                  Describe el encuadre o la vista destacada de la foto.
                </span>
                <span id="tipo-imagen-descripcion-counter" className={styles.counterText}>
                  {getCounterText(imagenForm.descripcion_imagen, MAX_LENGTHS.imagen.descripcion)}
                </span>
              </div>
              {fieldErrors.descripcion_imagen && (
                <span id="tipo-imagen-descripcion-error" className={styles.errorText} role="alert">
                  {fieldErrors.descripcion_imagen}
                </span>
              )}
            </div>

            <div className={getFieldClassName(styles.field, fieldErrors.orden_visualizacion)}>
              <label htmlFor="tipo-imagen-orden">Orden</label>
              <input
                id="tipo-imagen-orden"
                type="number"
                min="1"
                step="1"
                name="orden_visualizacion"
                value={imagenForm.orden_visualizacion}
                onChange={handleImageChange}
                onBlur={handleImageBlur}
                inputMode="numeric"
                aria-invalid={Boolean(fieldErrors.orden_visualizacion)}
                aria-describedby={buildDescribedBy(
                  "tipo-imagen-orden-help",
                  fieldErrors.orden_visualizacion ? "tipo-imagen-orden-error" : null
                )}
              />
              <span id="tipo-imagen-orden-help" className={styles.helpText}>
                Define la posicion en la galeria. Debe ser mayor a cero.
              </span>
              {fieldErrors.orden_visualizacion && (
                <span id="tipo-imagen-orden-error" className={styles.errorText} role="alert">
                  {fieldErrors.orden_visualizacion}
                </span>
              )}
            </div>

            <div className={styles.field}>
              <label htmlFor="tipo-imagen-principal">Imagen principal</label>
              <label className={styles.checkboxField}>
                <span className={styles.checkboxItem}>
                  <input
                    id="tipo-imagen-principal"
                    type="checkbox"
                    name="es_principal"
                    checked={imagenForm.es_principal}
                    onChange={handleImageChange}
                  />
                  Marcar como principal
                </span>
              </label>
              <span className={styles.helpText}>
                Activa esta opcion si la imagen debe mostrarse primero.
              </span>
            </div>
          </div>

          <div className={styles.actions}>
            <button
              type="button"
              className={styles.btnPrimary}
              onClick={handleAddImage}
              disabled={assetLoading}
            >
              {assetLoading ? "Procesando..." : "Agregar imagen"}
            </button>
          </div>

          <div className={styles.tableWrapper}>
            <table className={styles.table}>
              <thead>
                <tr>
                  <th>Preview</th>
                  <th>Descripcion</th>
                  <th>Orden</th>
                  <th>Principal</th>
                  <th>Acciones</th>
                </tr>
              </thead>
              <tbody>
                {imagenes.length === 0 && (
                  <tr>
                    <td colSpan={5} className={styles.emptyMsg}>
                      {isEditMode
                        ? "No hay imagenes registradas."
                        : "No hay imagenes preparadas para este nuevo tipo de habitacion."}
                    </td>
                  </tr>
                )}
                {imagenes.map((imagen) => {
                  const imageUrl = trimText(imagen.urlImagen) || "";
                  const imageDescription = trimText(imagen.descripcionImagen) || "-";
                  return (
                    <tr key={imagen.idTipoHabitacionImagen ?? imagen.tempId}>
                      <td>
                        {imageUrl ? (
                          <a href={imageUrl} target="_blank" rel="noreferrer">
                            <img
                              className={styles.imagePreview}
                              src={imageUrl}
                              alt={
                                imageDescription === "-"
                                  ? "Imagen de tipo de habitacion"
                                  : imageDescription
                              }
                            />
                          </a>
                        ) : (
                          "-"
                        )}
                      </td>
                      <td>{imageDescription}</td>
                      <td>{imagen.ordenVisualizacion}</td>
                      <td>{imagen.esPrincipal ? "Si" : "No"}</td>
                      <td>
                        <button
                          type="button"
                          className={styles.btnSecondary}
                          onClick={() =>
                            handleDeleteImage(
                              isEditMode ? imagen.idTipoHabitacionImagen : imagen.tempId
                            )
                          }
                          disabled={assetLoading}
                        >
                          Eliminar
                        </button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
      </section>

      {isEditMode && (
        <section className={styles.card}>
          <h3 className={styles.sectionTitle}>Amenidades</h3>
          <div className={styles.grid2}>
            <div className={getFieldClassName(styles.field, fieldErrors.selectedAmenidadGuid)}>
              <label htmlFor="tipo-amenidad">Amenidad disponible</label>
              <select
                id="tipo-amenidad"
                value={selectedAmenidadGuid}
                onChange={(event) => {
                  const nextValue = event.target.value;
                  setSelectedAmenidadGuid(nextValue);
                  if (fieldErrors.selectedAmenidadGuid) {
                    setFieldErrors((prev) => ({
                      ...prev,
                      selectedAmenidadGuid: validateTipoField(
                        "selectedAmenidadGuid",
                        nextValue,
                        form
                      ),
                    }));
                  }
                }}
                onBlur={(event) =>
                  setFieldErrors((prev) => ({
                    ...prev,
                    selectedAmenidadGuid: validateTipoField(
                      "selectedAmenidadGuid",
                      event.target.value,
                      form
                    ),
                  }))
                }
                aria-invalid={Boolean(fieldErrors.selectedAmenidadGuid)}
                aria-describedby={buildDescribedBy(
                  "tipo-amenidad-help",
                  fieldErrors.selectedAmenidadGuid ? "tipo-amenidad-error" : null
                )}
              >
                <option value="">Selecciona una amenidad</option>
                {catalogoAmenidades
                  .filter(
                    (catalogo) =>
                      !amenidades.some(
                        (amenidad) => String(amenidad.catalogoGuid) === String(catalogo.catalogoGuid)
                      )
                  )
                  .map((catalogo) => (
                    <option key={catalogo.catalogoGuid} value={catalogo.catalogoGuid}>
                      {trimText(catalogo.nombreCatalogo)}
                    </option>
                  ))}
              </select>
              <span id="tipo-amenidad-help" className={styles.helpText}>
                Solo se listan amenidades aun no asociadas a este tipo de habitacion.
              </span>
              {fieldErrors.selectedAmenidadGuid && (
                <span id="tipo-amenidad-error" className={styles.errorText} role="alert">
                  {fieldErrors.selectedAmenidadGuid}
                </span>
              )}
            </div>

            <div className={styles.field}>
              <label>&nbsp;</label>
              <button
                type="button"
                className={styles.btnPrimary}
                onClick={handleAssignAmenidad}
                disabled={assetLoading}
              >
                Asignar amenidad
              </button>
            </div>
          </div>

          <div className={styles.tableWrapper}>
            <table className={styles.table}>
              <thead>
                <tr>
                  <th>Codigo</th>
                  <th>Nombre</th>
                  <th>Acciones</th>
                </tr>
              </thead>
              <tbody>
                {amenidades.length === 0 && (
                  <tr>
                    <td colSpan={3} className={styles.emptyMsg}>
                      No hay amenidades asignadas.
                    </td>
                  </tr>
                )}
                {amenidades.map((amenidad) => (
                  <tr key={amenidad.catalogoGuid ?? amenidad.idCatalogo}>
                    <td>{trimText(amenidad.codigoCatalogo) || amenidad.idCatalogo || "-"}</td>
                    <td>{trimText(amenidad.nombreCatalogo) || "-"}</td>
                    <td>
                      <button
                        type="button"
                        className={styles.btnSecondary}
                        onClick={() => handleRemoveAmenidad(amenidad.idCatalogo)}
                        disabled={assetLoading}
                      >
                        Quitar
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </section>
      )}

      <div className={styles.actions}>
        <button
          type="button"
          className={styles.btnSecondary}
          onClick={() => navigate("/admin/tipos-habitacion")}
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

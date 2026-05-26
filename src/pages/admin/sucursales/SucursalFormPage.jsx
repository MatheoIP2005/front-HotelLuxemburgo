import { useEffect, useMemo, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import {
  createSucursal,
  getSucursal,
  updateSucursal,
} from "../../../services/sucursales.service";
import {
  createSucursalImagen,
  deleteSucursalImagen,
  getSucursalImagenes,
} from "../../../services/sucursalImagenes.service";
import { uploadImage } from "../../../services/images.service";
import {
  EMAIL_REGEX,
  MAX_LENGTHS,
  ONLY_OPTIONAL_DIGITS_REGEX,
  SUCURSAL_CATEGORIA_VIAJE_OPTIONS,
  SUCURSAL_TIPO_ALOJAMIENTO_OPTIONS,
  TIME_24H_REGEX,
} from "../../../utils/constraints";
import styles from "./SucursalFormPage.module.css";

const DEFAULT_TIPO_ALOJAMIENTO = "hotel";
const DEFAULT_PAIS = "Ecuador";
const EMPTY_IMAGE_FORM = {
  url_imagen: "",
  descripcion_imagen: "",
  orden_visualizacion: "1",
  es_principal: false,
};

const trimText = (value) => String(value ?? "").trim();

const getSucursalGuid = (value) =>
  value?.sucursalGuid ??
  value?.sucursal_guid ??
  value?.data?.sucursalGuid ??
  value?.data?.sucursal_guid ??
  "";

const getCounterText = (value, maxLength) => `${String(value ?? "").length}/${maxLength}`;

const getDescribedBy = (helpId, errorId, errorText) =>
  errorText ? `${helpId} ${errorId}` : helpId;

function FieldHint({ helpId, errorId, helpText, errorText, counterText }) {
  return (
    <>
      <div className={styles.fieldMeta}>
        <span id={helpId} className={styles.helpText}>
          {helpText}
        </span>
        {counterText ? <span className={styles.counterText}>{counterText}</span> : null}
      </div>
      {errorText ? (
        <span id={errorId} className={styles.errorText}>
          {errorText}
        </span>
      ) : null}
    </>
  );
}

export default function SucursalFormPage() {
  const navigate = useNavigate();
  const { id } = useParams();
  const isEditMode = Boolean(id);

  const [form, setForm] = useState({
    codigo_sucursal: "",
    nombre_sucursal: "",
    tipo_alojamiento: DEFAULT_TIPO_ALOJAMIENTO,
    estrellas: "",
    categoria_viaje: "",
    descripcion_corta: "",
    descripcion_sucursal: "",
    pais: DEFAULT_PAIS,
    provincia: "",
    ciudad: "",
    direccion: "",
    codigo_postal: "",
    ubicacion: "",
    telefono: "",
    correo: "",
    latitud: "",
    longitud: "",
    hora_checkin: "15:00",
    hora_checkout: "12:00",
    checkin_anticipado: false,
    checkout_tardio: false,
    acepta_ninos: true,
    edad_minima_huesped: "",
    permite_mascotas: false,
    se_permite_fumar: false,
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(null);
  const [imagenes, setImagenes] = useState([]);
  const [imagenForm, setImagenForm] = useState(EMPTY_IMAGE_FORM);
  const [uploadingImage, setUploadingImage] = useState(false);
  const [touched, setTouched] = useState({});
  const [submitAttempted, setSubmitAttempted] = useState(false);

  const fieldErrors = useMemo(() => {
    const errors = {};
    const codigoSucursal = trimText(form.codigo_sucursal);
    const nombreSucursal = trimText(form.nombre_sucursal);
    const tipoAlojamiento = trimText(form.tipo_alojamiento);
    const categoriaViaje = trimText(form.categoria_viaje);
    const descripcionCorta = trimText(form.descripcion_corta);
    const descripcionSucursal = trimText(form.descripcion_sucursal);
    const pais = trimText(form.pais);
    const provincia = trimText(form.provincia);
    const ciudad = trimText(form.ciudad);
    const direccion = trimText(form.direccion);
    const codigoPostal = trimText(form.codigo_postal);
    const ubicacion = trimText(form.ubicacion);
    const telefono = trimText(form.telefono);
    const correo = trimText(form.correo);

    if (!codigoSucursal) {
      errors.codigo_sucursal = "El código es obligatorio.";
    } else if (codigoSucursal.length > MAX_LENGTHS.sucursal.codigo) {
      errors.codigo_sucursal = "El código solo puede tener 10 caracteres.";
    }

    if (!nombreSucursal) {
      errors.nombre_sucursal = "El nombre es obligatorio.";
    } else if (nombreSucursal.length > MAX_LENGTHS.sucursal.nombre) {
      errors.nombre_sucursal = "El nombre no puede exceder 100 caracteres.";
    }

    if (!SUCURSAL_TIPO_ALOJAMIENTO_OPTIONS.includes(tipoAlojamiento)) {
      errors.tipo_alojamiento = "Seleccione una opción válida.";
    }

    if (form.estrellas && (Number(form.estrellas) < 1 || Number(form.estrellas) > 5)) {
      errors.estrellas = "Seleccione entre 1 y 5 estrellas.";
    }

    if (
      categoriaViaje &&
      !SUCURSAL_CATEGORIA_VIAJE_OPTIONS.includes(categoriaViaje)
    ) {
      errors.categoria_viaje = "Seleccione una opción válida.";
    }

    if (descripcionCorta.length > MAX_LENGTHS.sucursal.descripcionCorta) {
      errors.descripcion_corta = "La descripción corta no puede exceder 250 caracteres.";
    }

    if (descripcionSucursal.length > MAX_LENGTHS.sucursal.descripcion) {
      errors.descripcion_sucursal = "La descripción de sucursal no puede exceder 350 caracteres.";
    }

    if (!pais) {
      errors.pais = "El país es obligatorio.";
    } else if (pais.length > MAX_LENGTHS.sucursal.pais) {
      errors.pais = "El país no puede exceder 15 caracteres.";
    }

    if (provincia.length > MAX_LENGTHS.sucursal.provincia) {
      errors.provincia = "La provincia no puede exceder 30 caracteres.";
    }

    if (!ciudad) {
      errors.ciudad = "La ciudad es obligatoria.";
    } else if (ciudad.length > MAX_LENGTHS.sucursal.ciudad) {
      errors.ciudad = "La ciudad no puede exceder 25 caracteres.";
    }

    if (!direccion) {
      errors.direccion = "La dirección es obligatoria.";
    } else if (direccion.length > MAX_LENGTHS.sucursal.direccion) {
      errors.direccion = "La dirección no puede exceder 250 caracteres.";
    }

    if (codigoPostal.length > MAX_LENGTHS.sucursal.codigoPostal) {
      errors.codigo_postal = "El código postal no puede exceder 20 caracteres.";
    }

    if (!ubicacion) {
      errors.ubicacion = "La ubicación es obligatoria.";
    } else if (ubicacion.length > MAX_LENGTHS.sucursal.ubicacion) {
      errors.ubicacion = "La ubicación no puede exceder 200 caracteres.";
    }

    if (!telefono) {
      errors.telefono = "El teléfono es obligatorio.";
    } else if (!/^\d+$/.test(telefono)) {
      errors.telefono = "El teléfono solo puede contener números.";
    } else if (telefono.length !== MAX_LENGTHS.sucursal.telefono) {
      errors.telefono = "El teléfono solo puede tener 9 dígitos.";
    }

    if (!correo) {
      errors.correo = "El correo es obligatorio.";
    } else if (correo.length > MAX_LENGTHS.sucursal.correo) {
      errors.correo = "El correo no puede exceder 50 caracteres.";
    } else if (!EMAIL_REGEX.test(correo)) {
      errors.correo = "Ingrese un correo con formato válido.";
    }

    if (form.latitud !== "" && Number.isNaN(Number(form.latitud))) {
      errors.latitud = "La latitud debe ser un número válido.";
    }

    if (form.longitud !== "" && Number.isNaN(Number(form.longitud))) {
      errors.longitud = "La longitud debe ser un número válido.";
    }

    if (form.hora_checkin && !TIME_24H_REGEX.test(form.hora_checkin)) {
      errors.hora_checkin = "La hora debe tener formato HH:mm.";
    }

    if (form.hora_checkout && !TIME_24H_REGEX.test(form.hora_checkout)) {
      errors.hora_checkout = "La hora debe tener formato HH:mm.";
    }

    if (form.edad_minima_huesped && Number(form.edad_minima_huesped) < 0) {
      errors.edad_minima_huesped = "La edad mínima no puede ser negativa.";
    }

    return errors;
  }, [form]);

  useEffect(() => {
    const loadSucursal = async () => {
      if (!id) return;

      setLoading(true);
      setError(null);

      try {
        const [response, imagenesResponse] = await Promise.all([
          getSucursal(id),
          getSucursalImagenes(id).catch(() => []),
        ]);
        const item = response?.data || response || {};
        setForm((prev) => ({
          ...prev,
          codigo_sucursal: trimText(item.codigoSucursal),
          nombre_sucursal: trimText(item.nombreSucursal),
          tipo_alojamiento: trimText(item.tipoAlojamiento) || DEFAULT_TIPO_ALOJAMIENTO,
          estrellas: item.estrellas ?? "",
          categoria_viaje: trimText(item.categoriaViaje),
          descripcion_corta: trimText(item.descripcionCorta),
          descripcion_sucursal: trimText(item.descripcionSucursal),
          pais: trimText(item.pais) || DEFAULT_PAIS,
          provincia: trimText(item.provincia),
          ciudad: trimText(item.ciudad),
          ubicacion: trimText(item.ubicacion),
          direccion: trimText(item.direccion),
          codigo_postal: trimText(item.codigoPostal),
          telefono: trimText(item.telefono),
          correo: trimText(item.correo),
          latitud: item.latitud ?? "",
          longitud: item.longitud ?? "",
          hora_checkin: trimText(item.horaCheckin) || "15:00",
          hora_checkout: trimText(item.horaCheckout) || "12:00",
          checkin_anticipado: Boolean(item.checkinAnticipado),
          checkout_tardio: Boolean(item.checkoutTardio),
          acepta_ninos: Boolean(item.aceptaNinos),
          edad_minima_huesped: item.edadMinimaHuesped ?? "",
          permite_mascotas: Boolean(item.permiteMascotas),
          se_permite_fumar: Boolean(item.sePermiteFumar),
        }));
        setImagenes(Array.isArray(imagenesResponse) ? imagenesResponse : []);
      } catch (err) {
        setError(err?.response?.data?.message || "Error al cargar la sucursal");
      } finally {
        setLoading(false);
      }
    };

    loadSucursal();
  }, [id]);

  const handleChange = (e) => {
    const { name, type, checked, value } = e.target;
    if (name === "telefono" && !ONLY_OPTIONAL_DIGITS_REGEX.test(value)) {
      return;
    }
    setForm((prev) => ({
      ...prev,
      [name]: type === "checkbox" ? checked : value,
    }));
  };

  const handleBlur = (event) => {
    const { name } = event.target;
    setTouched((prev) => ({ ...prev, [name]: true }));
  };

  const getFieldError = (name) => (submitAttempted || touched[name] ? fieldErrors[name] : "");

  const getFieldClassName = (name, baseClass = styles.field) =>
    [baseClass, getFieldError(name) ? styles.fieldError : ""].filter(Boolean).join(" ");

  const handleImageChange = (event) => {
    const { name, value, type, checked } = event.target;
    setImagenForm((prev) => ({
      ...prev,
      [name]: type === "checkbox" ? checked : value,
    }));
  };

  const refreshImages = async (sucursalGuid = id) => {
    if (!sucursalGuid) return;
    const response = await getSucursalImagenes(sucursalGuid);
    setImagenes(Array.isArray(response) ? response : []);
  };

  const buildImagePayload = () => {
    const urlImagen = trimText(imagenForm.url_imagen);
    const descripcionImagen = trimText(imagenForm.descripcion_imagen);
    const ordenVisualizacion = Number(imagenForm.orden_visualizacion || 1);

    if (!urlImagen) {
      throw new Error("La URL de la imagen es obligatoria.");
    }
    if (urlImagen.length > MAX_LENGTHS.imagen.url) {
      throw new Error(`La URL no puede exceder ${MAX_LENGTHS.imagen.url} caracteres.`);
    }
    if (descripcionImagen.length > MAX_LENGTHS.imagen.descripcion) {
      throw new Error(
        `La descripción no puede exceder ${MAX_LENGTHS.imagen.descripcion} caracteres.`
      );
    }
    if (!Number.isFinite(ordenVisualizacion) || ordenVisualizacion <= 0) {
      throw new Error("El orden de visualización debe ser mayor a cero.");
    }

    return {
      urlImagen,
      descripcionImagen: descripcionImagen || null,
      ordenVisualizacion,
      esPrincipal: imagenForm.es_principal,
    };
  };

  const handleUploadImage = async (event) => {
    const file = event.target.files?.[0];
    if (!file) return;
    setUploadingImage(true);
    setError(null);
    try {
      const result = await uploadImage(file);
      setImagenForm((prev) => ({
        ...prev,
        url_imagen:
          result?.secureUrl ?? result?.url ?? result?.data?.secureUrl ?? result?.data?.url ?? "",
      }));
    } catch (err) {
      setError(err?.response?.data?.message || err?.message || "No se pudo subir la imagen.");
    } finally {
      setUploadingImage(false);
      event.target.value = "";
    }
  };

  const handleAddImage = async () => {
    setUploadingImage(true);
    setError(null);
    setSuccess(null);
    try {
      const payload = buildImagePayload();

      if (isEditMode) {
        await createSucursalImagen(id, payload);
        await refreshImages(id);
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
        setSuccess("Imagen preparada. Se guardará al crear la sucursal.");
      }

      setImagenForm(EMPTY_IMAGE_FORM);
    } catch (err) {
      setError(err?.response?.data?.message || err?.message || "No se pudo registrar la imagen.");
    } finally {
      setUploadingImage(false);
    }
  };

  const handleDeleteImage = async (imageId) => {
    if (!isEditMode) {
      setImagenes((prev) => prev.filter((imagen) => imagen.tempId !== imageId));
      return;
    }
    if (!window.confirm("¿Deseas eliminar esta imagen?")) return;
    setUploadingImage(true);
    setError(null);
    setSuccess(null);
    try {
      await deleteSucursalImagen(id, imageId);
      await refreshImages();
      setSuccess("Imagen eliminada correctamente.");
    } catch (err) {
      setError(err?.response?.data?.message || "No se pudo eliminar la imagen.");
    } finally {
      setUploadingImage(false);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSubmitAttempted(true);
    setError(null);
    setSuccess(null);

    if (Object.values(fieldErrors).some(Boolean)) {
      return;
    }

    setLoading(true);

    try {
      const codigoSucursal = form.codigo_sucursal.trim();
      const nombreSucursal = form.nombre_sucursal.trim();
      const tipoAlojamiento = form.tipo_alojamiento.trim();
      const pais = form.pais.trim();
      const provincia = form.provincia.trim();
      const ciudad = form.ciudad.trim();
      const ubicacion = form.ubicacion.trim();
      const direccion = form.direccion.trim();
      const telefono = form.telefono.trim();
      const correo = form.correo.trim();
      const descripcionCorta = form.descripcion_corta.trim();
      const descripcionSucursal = form.descripcion_sucursal.trim();
      const categoriaViaje = form.categoria_viaje.trim();

      if (!codigoSucursal || !nombreSucursal) {
        throw new Error("Código y nombre de sucursal son obligatorios.");
      }
      if (codigoSucursal.length > MAX_LENGTHS.sucursal.codigo) {
        throw new Error("El código de sucursal no puede exceder 10 caracteres.");
      }
      if (nombreSucursal.length > MAX_LENGTHS.sucursal.nombre) {
        throw new Error("El nombre de sucursal no puede exceder 100 caracteres.");
      }
      if (!SUCURSAL_TIPO_ALOJAMIENTO_OPTIONS.includes(tipoAlojamiento)) {
        throw new Error("El tipo de alojamiento no es válido.");
      }
      if (!pais || !ciudad || !ubicacion) {
        throw new Error("País, ciudad y ubicación son obligatorios.");
      }
      if (pais.length > MAX_LENGTHS.sucursal.pais || ciudad.length > MAX_LENGTHS.sucursal.ciudad) {
        throw new Error("País y ciudad exceden la longitud permitida.");
      }
      if (provincia.length > MAX_LENGTHS.sucursal.provincia) {
        throw new Error("La provincia no puede exceder 30 caracteres.");
      }
      if (ubicacion.length > 200) {
        throw new Error("La ubicación no puede exceder 200 caracteres.");
      }
      if (!direccion || !telefono || !correo) {
        throw new Error("Dirección, teléfono y correo son obligatorios.");
      }
      if (direccion.length > 250) {
        throw new Error("La dirección no puede exceder 250 caracteres.");
      }
      if (telefono.length !== MAX_LENGTHS.sucursal.telefono) {
        throw new Error("El teléfono de sucursal debe tener exactamente 9 dígitos.");
      }
      if (!/^\d+$/.test(telefono)) {
        throw new Error("En teléfono solo se permiten números.");
      }
      if (correo.length > MAX_LENGTHS.sucursal.correo) {
        throw new Error("El correo no puede exceder 50 caracteres.");
      }
      if (!EMAIL_REGEX.test(correo)) {
        throw new Error("El correo no tiene un formato válido.");
      }
      if (form.estrellas && (Number(form.estrellas) < 1 || Number(form.estrellas) > 5)) {
        throw new Error("Las estrellas deben estar entre 1 y 5.");
      }
      if (form.edad_minima_huesped && Number(form.edad_minima_huesped) < 0) {
        throw new Error("La edad mínima del huésped no puede ser negativa.");
      }
      if (form.codigo_postal && form.codigo_postal.trim().length > 20) {
        throw new Error("El código postal no puede exceder 20 caracteres.");
      }
      if (descripcionCorta.length > MAX_LENGTHS.sucursal.descripcionCorta) {
        throw new Error("La descripción corta no puede exceder 250 caracteres.");
      }
      if (descripcionSucursal.length > MAX_LENGTHS.sucursal.descripcion) {
        throw new Error("La descripción de sucursal no puede exceder 350 caracteres.");
      }
      if (
        categoriaViaje &&
        !SUCURSAL_CATEGORIA_VIAJE_OPTIONS.includes(categoriaViaje)
      ) {
        throw new Error("La categoría de viaje no es válida.");
      }
      if (form.hora_checkin && !TIME_24H_REGEX.test(form.hora_checkin)) {
        throw new Error("La hora de check-in debe tener formato HH:mm.");
      }
      if (form.hora_checkout && !TIME_24H_REGEX.test(form.hora_checkout)) {
        throw new Error("La hora de check-out debe tener formato HH:mm.");
      }
      if (form.latitud !== "" && Number.isNaN(Number(form.latitud))) {
        throw new Error("La latitud debe ser un número válido.");
      }
      if (form.longitud !== "" && Number.isNaN(Number(form.longitud))) {
        throw new Error("La longitud debe ser un número válido.");
      }

      if (isEditMode) {
        await updateSucursal(id, {
          ...form,
          tipo_alojamiento: tipoAlojamiento,
          pais,
        });
        setSuccess("Sucursal actualizada correctamente.");
      } else {
        const createdSucursal = await createSucursal({
          ...form,
          tipo_alojamiento: tipoAlojamiento,
          pais,
        });

        const createdSucursalGuid = getSucursalGuid(createdSucursal);

        if (imagenes.length > 0 && !createdSucursalGuid) {
          throw new Error(
            "La sucursal fue creada, pero no se pudo obtener su GUID para registrar las imágenes."
          );
        }

        if (createdSucursalGuid && imagenes.length > 0) {
          await Promise.all(
            imagenes.map((imagen) =>
              createSucursalImagen(createdSucursalGuid, {
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
            ? "Sucursal creada correctamente con sus imágenes."
            : "Sucursal creada correctamente."
        );
      }

      setTimeout(() => {
        navigate("/admin/sucursales");
      }, 1500);
    } catch (err) {
      setError(
        err?.response?.data?.message || err?.message || "Error al guardar la sucursal"
      );
    } finally {
      setLoading(false);
    }
  };

  return (
    <form className={styles.page} onSubmit={handleSubmit} noValidate>
      <div className={styles.topBar}>
        <h2>{isEditMode ? "Editar Sucursal" : "Nueva Sucursal"}</h2>
        <button
          type="button"
          className={styles.btnSecondary}
          onClick={() => navigate("/admin/sucursales")}
        >
          Volver
        </button>
      </div>

      {error && <div className={styles.errorBox}>{error}</div>}
      {success && <div className={styles.successBox}>{success}</div>}

      <section className={styles.card}>
        <h3 className={styles.sectionTitle}>Información General</h3>
        <div className={styles.grid2}>
          <div className={getFieldClassName("codigo_sucursal", styles.fieldCompact)}>
            <label htmlFor="codigo_sucursal">Código</label>
            <input
              id="codigo_sucursal"
              name="codigo_sucursal"
              value={form.codigo_sucursal}
              onChange={handleChange}
              onBlur={handleBlur}
              maxLength={10}
              required
              aria-invalid={Boolean(getFieldError("codigo_sucursal"))}
              aria-describedby={getDescribedBy(
                "codigo_sucursal-help",
                "codigo_sucursal-error",
                getFieldError("codigo_sucursal")
              )}
            />
            <FieldHint
              helpId="codigo_sucursal-help"
              errorId="codigo_sucursal-error"
              helpText="Código interno de la sucursal."
              errorText={getFieldError("codigo_sucursal")}
              counterText={getCounterText(form.codigo_sucursal, 10)}
            />
          </div>

          <div className={getFieldClassName("nombre_sucursal", styles.fieldWide)}>
            <label htmlFor="nombre_sucursal">Nombre</label>
            <input
              id="nombre_sucursal"
              name="nombre_sucursal"
              value={form.nombre_sucursal}
              onChange={handleChange}
              onBlur={handleBlur}
              maxLength={100}
              required
              aria-invalid={Boolean(getFieldError("nombre_sucursal"))}
              aria-describedby={getDescribedBy(
                "nombre_sucursal-help",
                "nombre_sucursal-error",
                getFieldError("nombre_sucursal")
              )}
            />
            <FieldHint
              helpId="nombre_sucursal-help"
              errorId="nombre_sucursal-error"
              helpText="Nombre comercial visible en el panel."
              errorText={getFieldError("nombre_sucursal")}
              counterText={getCounterText(form.nombre_sucursal, 100)}
            />
          </div>

          <div className={getFieldClassName("tipo_alojamiento", styles.fieldCompact)}>
            <label htmlFor="tipo_alojamiento">Tipo de alojamiento</label>
            <select
              id="tipo_alojamiento"
              name="tipo_alojamiento"
              value={form.tipo_alojamiento}
              onChange={handleChange}
              onBlur={handleBlur}
              aria-invalid={Boolean(getFieldError("tipo_alojamiento"))}
              aria-describedby={getDescribedBy(
                "tipo_alojamiento-help",
                "tipo_alojamiento-error",
                getFieldError("tipo_alojamiento")
              )}
            >
              {SUCURSAL_TIPO_ALOJAMIENTO_OPTIONS.map((option) => (
                <option key={option} value={option}>
                  {option}
                </option>
              ))}
            </select>
            <FieldHint
              helpId="tipo_alojamiento-help"
              errorId="tipo_alojamiento-error"
              helpText="Selecciona el tipo permitido por la base de datos."
              errorText={getFieldError("tipo_alojamiento")}
            />
          </div>

          <div className={getFieldClassName("estrellas", styles.fieldCompact)}>
            <label htmlFor="estrellas">Estrellas</label>
            <select
              id="estrellas"
              name="estrellas"
              value={form.estrellas}
              onChange={handleChange}
              onBlur={handleBlur}
              aria-invalid={Boolean(getFieldError("estrellas"))}
              aria-describedby={getDescribedBy(
                "estrellas-help",
                "estrellas-error",
                getFieldError("estrellas")
              )}
            >
              <option value="">Seleccione</option>
              <option value="1">1</option>
              <option value="2">2</option>
              <option value="3">3</option>
              <option value="4">4</option>
              <option value="5">5</option>
            </select>
            <FieldHint
              helpId="estrellas-help"
              errorId="estrellas-error"
              helpText="Opcional. Entre 1 y 5."
              errorText={getFieldError("estrellas")}
            />
          </div>

          <div className={getFieldClassName("categoria_viaje", styles.fieldCompact)}>
            <label htmlFor="categoria_viaje">Categoría de viaje</label>
            <select
              id="categoria_viaje"
              name="categoria_viaje"
              value={form.categoria_viaje}
              onChange={handleChange}
              onBlur={handleBlur}
              aria-invalid={Boolean(getFieldError("categoria_viaje"))}
              aria-describedby={getDescribedBy(
                "categoria_viaje-help",
                "categoria_viaje-error",
                getFieldError("categoria_viaje")
              )}
            >
              <option value="">Seleccione</option>
              <option value="playa">playa</option>
              <option value="ciudad">ciudad</option>
              <option value="montana">montana</option>
              <option value="aventura">aventura</option>
              <option value="cultural">cultural</option>
              <option value="bienestar">bienestar</option>
            </select>
            <FieldHint
              helpId="categoria_viaje-help"
              errorId="categoria_viaje-error"
              helpText="Opcional. Úsala para clasificación comercial."
              errorText={getFieldError("categoria_viaje")}
            />
          </div>

          <div className={getFieldClassName("descripcion_corta", styles.fieldFull)}>
            <label htmlFor="descripcion_corta">Descripción corta</label>
            <textarea
              id="descripcion_corta"
              name="descripcion_corta"
              maxLength={250}
              value={form.descripcion_corta}
              onChange={handleChange}
              onBlur={handleBlur}
              aria-invalid={Boolean(getFieldError("descripcion_corta"))}
              aria-describedby={getDescribedBy(
                "descripcion_corta-help",
                "descripcion_corta-error",
                getFieldError("descripcion_corta")
              )}
            />
            <FieldHint
              helpId="descripcion_corta-help"
              errorId="descripcion_corta-error"
              helpText="Resumen breve para listados y tarjetas."
              errorText={getFieldError("descripcion_corta")}
              counterText={getCounterText(form.descripcion_corta, 250)}
            />
          </div>

          <div className={getFieldClassName("descripcion_sucursal", styles.fieldFull)}>
            <label htmlFor="descripcion_sucursal">Descripción sucursal</label>
            <textarea
              id="descripcion_sucursal"
              name="descripcion_sucursal"
              maxLength={350}
              value={form.descripcion_sucursal}
              onChange={handleChange}
              onBlur={handleBlur}
              aria-invalid={Boolean(getFieldError("descripcion_sucursal"))}
              aria-describedby={getDescribedBy(
                "descripcion_sucursal-help",
                "descripcion_sucursal-error",
                getFieldError("descripcion_sucursal")
              )}
            />
            <FieldHint
              helpId="descripcion_sucursal-help"
              errorId="descripcion_sucursal-error"
              helpText="Descripción completa según el límite real en base de datos."
              errorText={getFieldError("descripcion_sucursal")}
              counterText={getCounterText(form.descripcion_sucursal, 350)}
            />
          </div>
        </div>
      </section>

      <section className={styles.card}>
        <h3 className={styles.sectionTitle}>Ubicación</h3>
        <div className={styles.grid3}>
          <div className={getFieldClassName("pais", styles.fieldCompact)}>
            <label htmlFor="pais">País</label>
            <input
              id="pais"
              name="pais"
              maxLength={15}
              value={form.pais}
              onChange={handleChange}
              onBlur={handleBlur}
              required
              aria-invalid={Boolean(getFieldError("pais"))}
              aria-describedby={getDescribedBy("pais-help", "pais-error", getFieldError("pais"))}
            />
            <FieldHint
              helpId="pais-help"
              errorId="pais-error"
              helpText="Máximo 15 caracteres."
              errorText={getFieldError("pais")}
              counterText={getCounterText(form.pais, 15)}
            />
          </div>

          <div className={getFieldClassName("provincia", styles.fieldCompact)}>
            <label htmlFor="provincia">Provincia</label>
            <input
              id="provincia"
              name="provincia"
              maxLength={30}
              value={form.provincia}
              onChange={handleChange}
              onBlur={handleBlur}
              aria-invalid={Boolean(getFieldError("provincia"))}
              aria-describedby={getDescribedBy(
                "provincia-help",
                "provincia-error",
                getFieldError("provincia")
              )}
            />
            <FieldHint
              helpId="provincia-help"
              errorId="provincia-error"
              helpText="Opcional. Hasta 30 caracteres."
              errorText={getFieldError("provincia")}
              counterText={getCounterText(form.provincia, 30)}
            />
          </div>

          <div className={getFieldClassName("ciudad", styles.fieldCompact)}>
            <label htmlFor="ciudad">Ciudad</label>
            <input
              id="ciudad"
              name="ciudad"
              maxLength={25}
              value={form.ciudad}
              onChange={handleChange}
              onBlur={handleBlur}
              required
              aria-invalid={Boolean(getFieldError("ciudad"))}
              aria-describedby={getDescribedBy(
                "ciudad-help",
                "ciudad-error",
                getFieldError("ciudad")
              )}
            />
            <FieldHint
              helpId="ciudad-help"
              errorId="ciudad-error"
              helpText="Ciudad principal de la sucursal."
              errorText={getFieldError("ciudad")}
              counterText={getCounterText(form.ciudad, 25)}
            />
          </div>

          <div className={getFieldClassName("direccion", styles.fieldFull)}>
            <label htmlFor="direccion">Dirección</label>
            <input
              id="direccion"
              name="direccion"
              maxLength={250}
              value={form.direccion}
              onChange={handleChange}
              onBlur={handleBlur}
              required
              aria-invalid={Boolean(getFieldError("direccion"))}
              aria-describedby={getDescribedBy(
                "direccion-help",
                "direccion-error",
                getFieldError("direccion")
              )}
            />
            <FieldHint
              helpId="direccion-help"
              errorId="direccion-error"
              helpText="Dirección física completa para recepción y facturación."
              errorText={getFieldError("direccion")}
              counterText={getCounterText(form.direccion, 250)}
            />
          </div>

          <div className={getFieldClassName("ubicacion", styles.fieldFull)}>
            <label htmlFor="ubicacion">Ubicación</label>
            <input
              id="ubicacion"
              name="ubicacion"
              maxLength={200}
              value={form.ubicacion}
              onChange={handleChange}
              onBlur={handleBlur}
              required
              aria-invalid={Boolean(getFieldError("ubicacion"))}
              aria-describedby={getDescribedBy(
                "ubicacion-help",
                "ubicacion-error",
                getFieldError("ubicacion")
              )}
            />
            <FieldHint
              helpId="ubicacion-help"
              errorId="ubicacion-error"
              helpText="Referencia amplia de ubicación o zona."
              errorText={getFieldError("ubicacion")}
              counterText={getCounterText(form.ubicacion, 200)}
            />
          </div>

          <div className={getFieldClassName("codigo_postal", styles.fieldCompact)}>
            <label htmlFor="codigo_postal">Código postal</label>
            <input
              id="codigo_postal"
              name="codigo_postal"
              maxLength={20}
              value={form.codigo_postal}
              onChange={handleChange}
              onBlur={handleBlur}
              aria-invalid={Boolean(getFieldError("codigo_postal"))}
              aria-describedby={getDescribedBy(
                "codigo_postal-help",
                "codigo_postal-error",
                getFieldError("codigo_postal")
              )}
            />
            <FieldHint
              helpId="codigo_postal-help"
              errorId="codigo_postal-error"
              helpText="Opcional. Hasta 20 caracteres."
              errorText={getFieldError("codigo_postal")}
              counterText={getCounterText(form.codigo_postal, 20)}
            />
          </div>

          <div className={getFieldClassName("telefono", styles.fieldCompact)}>
            <label htmlFor="telefono">Teléfono</label>
            <input
              id="telefono"
              name="telefono"
              inputMode="numeric"
              maxLength={9}
              value={form.telefono}
              onChange={handleChange}
              onBlur={handleBlur}
              required
              aria-invalid={Boolean(getFieldError("telefono"))}
              aria-describedby={getDescribedBy(
                "telefono-help",
                "telefono-error",
                getFieldError("telefono")
              )}
            />
            <FieldHint
              helpId="telefono-help"
              errorId="telefono-error"
              helpText="Debe tener exactamente 9 dígitos."
              errorText={getFieldError("telefono")}
              counterText={getCounterText(form.telefono, 9)}
            />
          </div>

          <div className={getFieldClassName("correo", styles.fieldWide)}>
            <label htmlFor="correo">Correo</label>
            <input
              id="correo"
              name="correo"
              type="email"
              maxLength={50}
              value={form.correo}
              onChange={handleChange}
              onBlur={handleBlur}
              required
              aria-invalid={Boolean(getFieldError("correo"))}
              aria-describedby={getDescribedBy(
                "correo-help",
                "correo-error",
                getFieldError("correo")
              )}
            />
            <FieldHint
              helpId="correo-help"
              errorId="correo-error"
              helpText="Correo principal de contacto de la sucursal."
              errorText={getFieldError("correo")}
              counterText={getCounterText(form.correo, 50)}
            />
          </div>

          <div className={getFieldClassName("latitud", styles.fieldCompact)}>
            <label htmlFor="latitud">Latitud</label>
            <input
              id="latitud"
              name="latitud"
              type="number"
              inputMode="decimal"
              step="0.0000001"
              value={form.latitud}
              onChange={handleChange}
              onBlur={handleBlur}
              aria-invalid={Boolean(getFieldError("latitud"))}
              aria-describedby={getDescribedBy(
                "latitud-help",
                "latitud-error",
                getFieldError("latitud")
              )}
            />
            <FieldHint
              helpId="latitud-help"
              errorId="latitud-error"
              helpText="Opcional. Formato numérico con hasta 7 decimales."
              errorText={getFieldError("latitud")}
            />
          </div>

          <div className={getFieldClassName("longitud", styles.fieldCompact)}>
            <label htmlFor="longitud">Longitud</label>
            <input
              id="longitud"
              name="longitud"
              type="number"
              inputMode="decimal"
              step="0.0000001"
              value={form.longitud}
              onChange={handleChange}
              onBlur={handleBlur}
              aria-invalid={Boolean(getFieldError("longitud"))}
              aria-describedby={getDescribedBy(
                "longitud-help",
                "longitud-error",
                getFieldError("longitud")
              )}
            />
            <FieldHint
              helpId="longitud-help"
              errorId="longitud-error"
              helpText="Opcional. Formato numérico con hasta 7 decimales."
              errorText={getFieldError("longitud")}
            />
          </div>
        </div>
      </section>

      <section className={styles.card}>
        <h3 className={styles.sectionTitle}>Políticas</h3>
        <div className={styles.grid2}>
          <div className={getFieldClassName("hora_checkin", styles.fieldCompact)}>
            <label htmlFor="hora_checkin">Hora check-in</label>
            <input
              id="hora_checkin"
              name="hora_checkin"
              type="time"
              value={form.hora_checkin}
              onChange={handleChange}
              onBlur={handleBlur}
              aria-invalid={Boolean(getFieldError("hora_checkin"))}
              aria-describedby={getDescribedBy(
                "hora_checkin-help",
                "hora_checkin-error",
                getFieldError("hora_checkin")
              )}
            />
            <FieldHint
              helpId="hora_checkin-help"
              errorId="hora_checkin-error"
              helpText="Formato de 24 horas."
              errorText={getFieldError("hora_checkin")}
            />
          </div>

          <div className={getFieldClassName("hora_checkout", styles.fieldCompact)}>
            <label htmlFor="hora_checkout">Hora check-out</label>
            <input
              id="hora_checkout"
              name="hora_checkout"
              type="time"
              value={form.hora_checkout}
              onChange={handleChange}
              onBlur={handleBlur}
              aria-invalid={Boolean(getFieldError("hora_checkout"))}
              aria-describedby={getDescribedBy(
                "hora_checkout-help",
                "hora_checkout-error",
                getFieldError("hora_checkout")
              )}
            />
            <FieldHint
              helpId="hora_checkout-help"
              errorId="hora_checkout-error"
              helpText="Formato de 24 horas."
              errorText={getFieldError("hora_checkout")}
            />
          </div>

          <div className={getFieldClassName("edad_minima_huesped", styles.fieldCompact)}>
            <label htmlFor="edad_minima_huesped">Edad mínima huésped</label>
            <input
              id="edad_minima_huesped"
              name="edad_minima_huesped"
              type="number"
              min="0"
              value={form.edad_minima_huesped}
              onChange={handleChange}
              onBlur={handleBlur}
              aria-invalid={Boolean(getFieldError("edad_minima_huesped"))}
              aria-describedby={getDescribedBy(
                "edad_minima_huesped-help",
                "edad_minima_huesped-error",
                getFieldError("edad_minima_huesped")
              )}
            />
            <FieldHint
              helpId="edad_minima_huesped-help"
              errorId="edad_minima_huesped-error"
              helpText="Opcional. Debe ser cero o mayor."
              errorText={getFieldError("edad_minima_huesped")}
            />
          </div>

          <div className={styles.fieldFull}>
            <div className={styles.checkboxGroup}>
              <label className={styles.checkboxItem}>
                <input
                  type="checkbox"
                  name="checkin_anticipado"
                  checked={form.checkin_anticipado}
                  onChange={handleChange}
                />
                Check-in anticipado
              </label>
              <label className={styles.checkboxItem}>
                <input
                  type="checkbox"
                  name="checkout_tardio"
                  checked={form.checkout_tardio}
                  onChange={handleChange}
                />
                Checkout tardío
              </label>
              <label className={styles.checkboxItem}>
                <input
                  type="checkbox"
                  name="acepta_ninos"
                  checked={form.acepta_ninos}
                  onChange={handleChange}
                />
                Acepta niños
              </label>
              <label className={styles.checkboxItem}>
                <input
                  type="checkbox"
                  name="permite_mascotas"
                  checked={form.permite_mascotas}
                  onChange={handleChange}
                />
                Permite mascotas
              </label>
              <label className={styles.checkboxItem}>
                <input
                  type="checkbox"
                  name="se_permite_fumar"
                  checked={form.se_permite_fumar}
                  onChange={handleChange}
                />
                Se permite fumar
              </label>
            </div>
            <FieldHint
              helpId="politicas-help"
              errorId="politicas-error"
              helpText="Estas opciones solo ajustan preferencias y políticas visibles de la sucursal."
            />
          </div>
        </div>
      </section>

      <section className={styles.card}>
          <h3 className={styles.sectionTitle}>Imágenes de sucursal</h3>
          <div className={styles.grid2}>
            <div className={styles.fieldFull}>
              <label>Subir archivo</label>
              <input type="file" accept="image/*" onChange={handleUploadImage} />
              <span className={styles.helperText}>
                {isEditMode
                  ? "Se sube a Cloudinary si las variables VITE_CLOUDINARY estan configuradas."
                  : "Puedes preparar una o varias imágenes; se guardarán al crear la sucursal."}
              </span>
            </div>
            <div className={styles.fieldFull}>
              <label>URL imagen</label>
              <input
                name="url_imagen"
                maxLength={MAX_LENGTHS.imagen.url}
                value={imagenForm.url_imagen}
                onChange={handleImageChange}
                placeholder="/files/imagen.jpg o URL publica"
              />
            </div>
            {imagenForm.url_imagen && (
              <div className={styles.fieldFull}>
                <img
                  className={styles.imagePreviewLarge}
                  src={imagenForm.url_imagen}
                  alt="Preview de imagen"
                />
              </div>
            )}
            <div className={styles.fieldFull}>
              <label>Descripción</label>
              <input
                name="descripcion_imagen"
                maxLength={MAX_LENGTHS.imagen.descripcion}
                value={imagenForm.descripcion_imagen}
                onChange={handleImageChange}
              />
            </div>
            <div className={styles.field}>
              <label>Orden</label>
              <input
                type="number"
                min="1"
                name="orden_visualizacion"
                value={imagenForm.orden_visualizacion}
                onChange={handleImageChange}
              />
            </div>
            <div className={styles.field}>
              <label className={styles.checkboxItem}>
                <input
                  type="checkbox"
                  name="es_principal"
                  checked={imagenForm.es_principal}
                  onChange={handleImageChange}
                />
                Marcar como principal
              </label>
            </div>
          </div>
          <div className={styles.actions}>
            <button
              type="button"
              className={styles.btnPrimary}
              onClick={handleAddImage}
              disabled={uploadingImage}
            >
              {uploadingImage ? "Procesando..." : "Agregar imagen"}
            </button>
          </div>
          <div className={styles.tableWrapper}>
            <table className={styles.table}>
              <thead>
                <tr>
                  <th>Preview</th>
                  <th>Descripción</th>
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
                        ? "No hay imágenes registradas."
                        : "No hay imágenes preparadas para esta nueva sucursal."}
                    </td>
                  </tr>
                )}
                {imagenes.map((imagen) => (
                  <tr
                    key={
                      imagen.sucursalImagenGuid ?? imagen.idSucursalImagen ?? imagen.tempId
                    }
                  >
                    <td>
                      <a href={imagen.urlImagen} target="_blank" rel="noreferrer">
                        <img
                          className={styles.imagePreview}
                          src={imagen.urlImagen}
                          alt={imagen.descripcionImagen || "Imagen de sucursal"}
                        />
                      </a>
                    </td>
                    <td>{imagen.descripcionImagen || "-"}</td>
                    <td>{imagen.ordenVisualizacion}</td>
                    <td>{imagen.esPrincipal ? "Sí" : "No"}</td>
                    <td>
                      <button
                        type="button"
                        className={styles.btnSecondary}
                        onClick={() =>
                          handleDeleteImage(
                            isEditMode ? imagen.idSucursalImagen : imagen.tempId
                          )
                        }
                        disabled={uploadingImage}
                      >
                        Eliminar
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
      </section>

      <div className={styles.actions}>
        <button
          type="button"
          className={styles.btnSecondary}
          onClick={() => navigate("/admin/sucursales")}
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

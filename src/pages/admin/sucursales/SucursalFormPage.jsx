import { useEffect, useState } from "react";
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
          codigo_sucursal: item.codigoSucursal ?? "",
          nombre_sucursal: item.nombreSucursal ?? "",
          tipo_alojamiento: item.tipoAlojamiento ?? DEFAULT_TIPO_ALOJAMIENTO,
          estrellas: item.estrellas ?? "",
          categoria_viaje: item.categoriaViaje ?? "",
          descripcion_corta: item.descripcionCorta ?? "",
          descripcion_sucursal: item.descripcionSucursal ?? "",
          pais: item.pais ?? DEFAULT_PAIS,
          provincia: item.provincia ?? "",
          ciudad: item.ciudad ?? "",
          ubicacion: item.ubicacion ?? "",
          direccion: item.direccion ?? "",
          codigo_postal: item.codigoPostal ?? "",
          telefono: item.telefono ?? "",
          correo: item.correo ?? "",
          latitud: item.latitud ?? "",
          longitud: item.longitud ?? "",
          hora_checkin: item.horaCheckin ?? "15:00",
          hora_checkout: item.horaCheckout ?? "12:00",
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

  const handleImageChange = (event) => {
    const { name, value, type, checked } = event.target;
    setImagenForm((prev) => ({
      ...prev,
      [name]: type === "checkbox" ? checked : value,
    }));
  };

  const refreshImages = async () => {
    if (!id) return;
    const response = await getSucursalImagenes(id);
    setImagenes(Array.isArray(response) ? response : []);
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
    if (!id) return;
    setUploadingImage(true);
    setError(null);
    setSuccess(null);
    try {
      await createSucursalImagen(id, {
        urlImagen: imagenForm.url_imagen,
        descripcionImagen: imagenForm.descripcion_imagen,
        ordenVisualizacion: Number(imagenForm.orden_visualizacion || 1),
        esPrincipal: imagenForm.es_principal,
      });
      await refreshImages();
      setImagenForm(EMPTY_IMAGE_FORM);
      setSuccess("Imagen agregada correctamente.");
    } catch (err) {
      setError(err?.response?.data?.message || err?.message || "No se pudo registrar la imagen.");
    } finally {
      setUploadingImage(false);
    }
  };

  const handleDeleteImage = async (imageId) => {
    if (!id) return;
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
    setLoading(true);
    setError(null);
    setSuccess(null);

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
        throw new Error("La descripción de sucursal no puede exceder 250 caracteres.");
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
        await createSucursal({
          ...form,
          tipo_alojamiento: tipoAlojamiento,
          pais,
        });
        setSuccess("Sucursal creada correctamente.");
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
    <form className={styles.page} onSubmit={handleSubmit}>
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
          <div className={styles.field}>
            <label htmlFor="codigo_sucursal">Código</label>
            <input
              id="codigo_sucursal"
              name="codigo_sucursal"
              value={form.codigo_sucursal}
              onChange={handleChange}
              maxLength={10}
              required
            />
          </div>

          <div className={styles.field}>
            <label htmlFor="nombre_sucursal">Nombre</label>
            <input
              id="nombre_sucursal"
              name="nombre_sucursal"
              value={form.nombre_sucursal}
              onChange={handleChange}
              maxLength={100}
              required
            />
          </div>

          <div className={styles.field}>
            <label htmlFor="tipo_alojamiento">Tipo de alojamiento</label>
            <select
              id="tipo_alojamiento"
              name="tipo_alojamiento"
              value={form.tipo_alojamiento}
              onChange={handleChange}
            >
              {SUCURSAL_TIPO_ALOJAMIENTO_OPTIONS.map((option) => (
                <option key={option} value={option}>
                  {option}
                </option>
              ))}
            </select>
          </div>

          <div className={styles.field}>
            <label htmlFor="estrellas">Estrellas</label>
            <select
              id="estrellas"
              name="estrellas"
              value={form.estrellas}
              onChange={handleChange}
            >
              <option value="">Seleccione</option>
              <option value="1">1</option>
              <option value="2">2</option>
              <option value="3">3</option>
              <option value="4">4</option>
              <option value="5">5</option>
            </select>
          </div>

          <div className={styles.field}>
            <label htmlFor="categoria_viaje">Categoría de viaje</label>
            <select
              id="categoria_viaje"
              name="categoria_viaje"
              value={form.categoria_viaje}
              onChange={handleChange}
            >
              <option value="">Seleccione</option>
              <option value="playa">playa</option>
              <option value="ciudad">ciudad</option>
              <option value="montana">montana</option>
              <option value="aventura">aventura</option>
              <option value="cultural">cultural</option>
              <option value="bienestar">bienestar</option>
            </select>
          </div>

          <div className={styles.fieldFull}>
            <label htmlFor="descripcion_corta">Descripción corta</label>
            <textarea
              id="descripcion_corta"
              name="descripcion_corta"
              maxLength={250}
              value={form.descripcion_corta}
              onChange={handleChange}
            />
          </div>

          <div className={styles.fieldFull}>
            <label htmlFor="descripcion_sucursal">Descripción sucursal</label>
            <textarea
              id="descripcion_sucursal"
              name="descripcion_sucursal"
              maxLength={250}
              value={form.descripcion_sucursal}
              onChange={handleChange}
            />
          </div>
        </div>
      </section>

      <section className={styles.card}>
        <h3 className={styles.sectionTitle}>Ubicación</h3>
        <div className={styles.grid3}>
          <div className={styles.field}>
            <label htmlFor="pais">País</label>
            <input
              id="pais"
              name="pais"
              maxLength={15}
              value={form.pais}
              onChange={handleChange}
              required
            />
          </div>

          <div className={styles.field}>
            <label htmlFor="provincia">Provincia</label>
            <input
              id="provincia"
              name="provincia"
              maxLength={30}
              value={form.provincia}
              onChange={handleChange}
            />
          </div>

          <div className={styles.field}>
            <label htmlFor="ciudad">Ciudad</label>
            <input
              id="ciudad"
              name="ciudad"
              maxLength={25}
              value={form.ciudad}
              onChange={handleChange}
              required
            />
          </div>

          <div className={styles.fieldFull}>
            <label htmlFor="direccion">Dirección</label>
            <input
              id="direccion"
              name="direccion"
              maxLength={250}
              value={form.direccion}
              onChange={handleChange}
              required
            />
          </div>

          <div className={styles.fieldFull}>
            <label htmlFor="ubicacion">Ubicación</label>
            <input
              id="ubicacion"
              name="ubicacion"
              maxLength={200}
              value={form.ubicacion}
              onChange={handleChange}
              required
            />
          </div>

          <div className={styles.field}>
            <label htmlFor="codigo_postal">Código postal</label>
            <input
              id="codigo_postal"
              name="codigo_postal"
              maxLength={20}
              value={form.codigo_postal}
              onChange={handleChange}
            />
          </div>

          <div className={styles.field}>
            <label htmlFor="telefono">Teléfono</label>
            <input
              id="telefono"
              name="telefono"
              inputMode="numeric"
              maxLength={9}
              value={form.telefono}
              onChange={handleChange}
              required
            />
          </div>

          <div className={styles.field}>
            <label htmlFor="correo">Correo</label>
            <input
              id="correo"
              name="correo"
              type="email"
              maxLength={50}
              value={form.correo}
              onChange={handleChange}
              required
            />
          </div>

          <div className={styles.field}>
            <label htmlFor="latitud">Latitud</label>
            <input
              id="latitud"
              name="latitud"
              value={form.latitud}
              onChange={handleChange}
            />
          </div>

          <div className={styles.field}>
            <label htmlFor="longitud">Longitud</label>
            <input
              id="longitud"
              name="longitud"
              value={form.longitud}
              onChange={handleChange}
            />
          </div>
        </div>
      </section>

      <section className={styles.card}>
        <h3 className={styles.sectionTitle}>Políticas</h3>
        <div className={styles.grid2}>
          <div className={styles.field}>
            <label htmlFor="hora_checkin">Hora check-in</label>
            <input
              id="hora_checkin"
              name="hora_checkin"
              type="time"
              value={form.hora_checkin}
              onChange={handleChange}
            />
          </div>

          <div className={styles.field}>
            <label htmlFor="hora_checkout">Hora check-out</label>
            <input
              id="hora_checkout"
              name="hora_checkout"
              type="time"
              value={form.hora_checkout}
              onChange={handleChange}
            />
          </div>

          <div className={styles.field}>
            <label htmlFor="edad_minima_huesped">Edad mínima huésped</label>
            <input
              id="edad_minima_huesped"
              name="edad_minima_huesped"
              type="number"
              min="0"
              value={form.edad_minima_huesped}
              onChange={handleChange}
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
          </div>
        </div>
      </section>

      {isEditMode && (
        <section className={styles.card}>
          <h3 className={styles.sectionTitle}>Imágenes de sucursal</h3>
          <div className={styles.grid2}>
            <div className={styles.fieldFull}>
              <label>Subir archivo</label>
              <input type="file" accept="image/*" onChange={handleUploadImage} />
              <span className={styles.helperText}>
                Se sube a Cloudinary si las variables VITE_CLOUDINARY estan configuradas.
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
                      No hay imágenes registradas.
                    </td>
                  </tr>
                )}
                {imagenes.map((imagen) => (
                  <tr key={imagen.sucursalImagenGuid ?? imagen.idSucursalImagen}>
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
                        onClick={() => handleDeleteImage(imagen.idSucursalImagen)}
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
      )}

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

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
import styles from "./TipoHabitacionFormPage.module.css";

const EMPTY_IMAGE_FORM = {
  url_imagen: "",
  descripcion_imagen: "",
  orden_visualizacion: "1",
  es_principal: false,
};

export default function TipoHabitacionFormPage() {
  const navigate = useNavigate();
  const { id } = useParams();
  const isEditMode = Boolean(id);

  const [form, setForm] = useState({
    codigo_tipo_habitacion: "",
    nombre_tipo_habitacion: "",
    descripcion: "",
    capacidad_adultos: "",
    capacidad_ninos: "0",
    tipo_cama: "",
    area_m2: "",
    estado_tipo_habitacion: "ACT",
    permite_reserva_publica: true,
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(null);
  const [imagenes, setImagenes] = useState([]);
  const [imagenForm, setImagenForm] = useState(EMPTY_IMAGE_FORM);
  const [amenidades, setAmenidades] = useState([]);
  const [catalogoAmenidades, setCatalogoAmenidades] = useState([]);
  const [selectedAmenidadGuid, setSelectedAmenidadGuid] = useState("");
  const [assetLoading, setAssetLoading] = useState(false);

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
          codigo_tipo_habitacion: item.codigoTipoHabitacion ?? "",
          nombre_tipo_habitacion: item.nombreTipoHabitacion ?? "",
          descripcion: item.descripcion ?? "",
          capacidad_adultos: item.capacidadAdultos ?? "",
          capacidad_ninos: item.capacidadNinos ?? "0",
          tipo_cama: item.tipoCama ?? "",
          area_m2: item.areaM2 ?? "",
          estado_tipo_habitacion: item.estadoTipoHabitacion ?? "ACT",
          permite_reserva_publica: Boolean(item.permiteReservaPublica),
        }));
        setImagenes(Array.isArray(imagenesResponse) ? imagenesResponse : []);
        setAmenidades(Array.isArray(amenidadesResponse) ? amenidadesResponse : []);
        setCatalogoAmenidades(
          normalizeCollectionPayload(catalogoResponse, { pagina: 1, limite: 300 }).items.filter(
            (item) => item.tipoCatalogo === "AME"
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

  const handleChange = (e) => {
    const { name, type, checked, value } = e.target;
    setForm((prev) => ({ ...prev, [name]: type === "checkbox" ? checked : value }));
  };

  const handleImageChange = (event) => {
    const { name, value, type, checked } = event.target;
    setImagenForm((prev) => ({
      ...prev,
      [name]: type === "checkbox" ? checked : value,
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError(null);
    setSuccess(null);
    try {
      const codigoTipo = form.codigo_tipo_habitacion.trim();
      const nombreTipo = form.nombre_tipo_habitacion.trim();

      if (!codigoTipo || !nombreTipo) {
        throw new Error("Código y nombre son obligatorios.");
      }
      if (codigoTipo.length > 30) {
        throw new Error("El código no puede exceder 30 caracteres.");
      }
      if (nombreTipo.length > 60) {
        throw new Error("El nombre no puede exceder 60 caracteres.");
      }
      if (!form.capacidad_adultos || Number(form.capacidad_adultos) <= 0) {
        throw new Error("Capacidad de adultos debe ser mayor a cero.");
      }
      if (Number(form.capacidad_ninos) < 0) {
        throw new Error("Capacidad de niños no puede ser negativa.");
      }
      if (form.area_m2 && Number(form.area_m2) <= 0) {
        throw new Error("El área debe ser mayor a cero.");
      }
      if (form.tipo_cama && form.tipo_cama.trim().length > 60) {
        throw new Error("El tipo de cama no puede exceder 60 caracteres.");
      }
      if (!["ACT", "INA"].includes(form.estado_tipo_habitacion)) {
        throw new Error("El estado de tipo de habitación no es válido.");
      }

      if (isEditMode) {
        await updateTipoHabitacion(id, form);
        setSuccess("Tipo de habitación actualizado correctamente.");
      } else {
        await createTipoHabitacion(form);
        setSuccess("Tipo de habitación creado correctamente.");
      }
      setTimeout(() => navigate("/admin/tipos-habitacion"), 1500);
    } catch (err) {
      setError(err?.response?.data?.message || err?.message || "Error al guardar");
    } finally {
      setLoading(false);
    }
  };

  const refreshAssets = async () => {
    if (!id) return;
    const [imagenesResponse, amenidadesResponse] = await Promise.all([
      getTipoHabitacionImagenes(id).catch(() => []),
      getTipoHabitacionAmenidades(id).catch(() => []),
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
      setImagenForm((prev) => ({
        ...prev,
        url_imagen:
          result?.secureUrl ?? result?.url ?? result?.data?.secureUrl ?? result?.data?.url ?? "",
      }));
    } catch (err) {
      setError(err?.response?.data?.message || err?.message || "No se pudo subir la imagen.");
    } finally {
      setAssetLoading(false);
      event.target.value = "";
    }
  };

  const handleAddImage = async () => {
    if (!id) return;
    setAssetLoading(true);
    setError(null);
    setSuccess(null);
    try {
      await createTipoHabitacionImagen(id, {
        urlImagen: imagenForm.url_imagen,
        descripcionImagen: imagenForm.descripcion_imagen,
        ordenVisualizacion: Number(imagenForm.orden_visualizacion || 1),
        esPrincipal: imagenForm.es_principal,
      });
      await refreshAssets();
      setImagenForm(EMPTY_IMAGE_FORM);
      setSuccess("Imagen agregada correctamente.");
    } catch (err) {
      setError(err?.response?.data?.message || err?.message || "No se pudo registrar la imagen.");
    } finally {
      setAssetLoading(false);
    }
  };

  const handleDeleteImage = async (imageId) => {
    if (!id) return;
    if (!window.confirm("¿Deseas eliminar esta imagen?")) return;
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
    if (!id || !selectedAmenidadGuid) {
      setError("Selecciona una amenidad para asignarla.");
      return;
    }
    setAssetLoading(true);
    setError(null);
    setSuccess(null);
    try {
      await asignarAmenidadTipoHabitacion(id, selectedAmenidadGuid);
      await refreshAssets();
      setSelectedAmenidadGuid("");
      setSuccess("Amenidad asignada correctamente.");
    } catch (err) {
      setError(err?.response?.data?.message || "No se pudo asignar la amenidad.");
    } finally {
      setAssetLoading(false);
    }
  };

  const handleRemoveAmenidad = async (amenidadId) => {
    if (!id) return;
    if (!window.confirm("¿Deseas remover esta amenidad?")) return;
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
    <form className={styles.page} onSubmit={handleSubmit}>
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

      {error && <div className={styles.errorBox}>{error}</div>}
      {success && <div className={styles.successBox}>{success}</div>}

      <section className={styles.card}>
        <h3 className={styles.sectionTitle}>Información</h3>
        <div className={styles.grid2}>
          <div className={styles.field}>
            <label>Código</label>
            <input name="codigo_tipo_habitacion" maxLength={30} value={form.codigo_tipo_habitacion} onChange={handleChange} required />
          </div>
          <div className={styles.field}>
            <label>Nombre</label>
            <input name="nombre_tipo_habitacion" maxLength={60} value={form.nombre_tipo_habitacion} onChange={handleChange} required />
          </div>
          <div className={styles.field}>
            <label>Capacidad adultos</label>
            <input type="number" min="1" name="capacidad_adultos" value={form.capacidad_adultos} onChange={handleChange} required />
          </div>
          <div className={styles.field}>
            <label>Capacidad niños</label>
            <input type="number" min="0" name="capacidad_ninos" value={form.capacidad_ninos} onChange={handleChange} required />
          </div>
          <div className={styles.field}>
            <label>Capacidad total</label>
            <input
              value={
                (Number(form.capacidad_adultos) || 0) +
                (Number(form.capacidad_ninos) || 0)
              }
              readOnly
            />
          </div>
          <div className={styles.field}>
            <label>Tipo cama</label>
            <input name="tipo_cama" maxLength={60} value={form.tipo_cama} onChange={handleChange} />
          </div>
          <div className={styles.field}>
            <label>Área m2</label>
            <input type="number" min="0" step="0.01" name="area_m2" value={form.area_m2} onChange={handleChange} />
          </div>
          <div className={styles.fieldFull}>
            <label>Descripción</label>
            <textarea name="descripcion" value={form.descripcion} onChange={handleChange} />
          </div>
        </div>
      </section>

      <section className={styles.card}>
        <h3 className={styles.sectionTitle}>Configuración</h3>
        <div className={styles.checkboxGroup}>
          <label className={styles.checkboxItem}>
            <input
              type="checkbox"
              name="permite_reserva_publica"
              checked={form.permite_reserva_publica}
              onChange={handleChange}
            />
            Permite reserva pública
          </label>
          <label className={styles.checkboxItem}>
            Estado
            <select
              name="estado_tipo_habitacion"
              value={form.estado_tipo_habitacion}
              onChange={handleChange}
            >
              <option value="ACT">ACT</option>
              <option value="INA">INA</option>
            </select>
          </label>
        </div>
      </section>

      {isEditMode && (
        <section className={styles.card}>
          <h3 className={styles.sectionTitle}>Imágenes</h3>
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
                  <tr key={imagen.idTipoHabitacionImagen}>
                    <td>
                      <a href={imagen.urlImagen} target="_blank" rel="noreferrer">
                        <img
                          className={styles.imagePreview}
                          src={imagen.urlImagen}
                          alt={imagen.descripcionImagen || "Imagen de tipo de habitacion"}
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
                        onClick={() => handleDeleteImage(imagen.idTipoHabitacionImagen)}
                        disabled={assetLoading}
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

      {isEditMode && (
        <section className={styles.card}>
          <h3 className={styles.sectionTitle}>Amenidades</h3>
          <div className={styles.grid2}>
            <div className={styles.field}>
              <label>Amenidad disponible</label>
              <select
                value={selectedAmenidadGuid}
                onChange={(event) => setSelectedAmenidadGuid(event.target.value)}
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
                      {catalogo.nombreCatalogo}
                    </option>
                  ))}
              </select>
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
                  <th>Código</th>
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
                    <td>{amenidad.codigoCatalogo ?? amenidad.idCatalogo ?? "-"}</td>
                    <td>{amenidad.nombreCatalogo}</td>
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
        <button type="button" className={styles.btnSecondary} onClick={() => navigate("/admin/tipos-habitacion")}>
          Cancelar
        </button>
        <button type="submit" className={styles.btnPrimary} disabled={loading}>
          {loading ? "Guardando..." : "Guardar"}
        </button>
      </div>
    </form>
  );
}

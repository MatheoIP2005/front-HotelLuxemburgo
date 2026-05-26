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
import styles from "./CatalogoServicioFormPage.module.css";

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
        setForm((prev) => ({
          ...prev,
          id_sucursal: item.idSucursal ?? "",
          sucursal_guid:
            availableSucursales.find(
              (current) => current.idSucursal === item.idSucursal
            )?.sucursalGuid ?? "",
          codigo_catalogo: item.codigoCatalogo ?? "",
          nombre_catalogo: item.nombreCatalogo ?? "",
          tipo_catalogo: item.tipoCatalogo ?? "AME",
          categoria_catalogo: item.categoriaCatalogo ?? "",
          descripcion_catalogo: item.descripcionCatalogo ?? "",
          precio_base: item.precioBase ?? "0",
          aplica_iva: Boolean(item.aplicaIva),
          disponible_24h: Boolean(item.disponible24h),
          hora_inicio: item.horaInicio ?? "",
          hora_fin: item.horaFin ?? "",
          icono_url: item.iconoUrl ?? "",
          estado_catalogo: item.estadoCatalogo ?? "ACT",
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

    if (name === "id_sucursal") {
      const sucursal = sucursales.find(
        (item) => String(item.idSucursal) === String(value)
      );
      setForm((prev) => ({
        ...prev,
        id_sucursal: value,
        sucursal_guid: sucursal?.sucursalGuid ?? "",
      }));
      return;
    }

    if (name === "tipo_catalogo") {
      setForm((prev) => ({
        ...prev,
        tipo_catalogo: value,
        precio_base: value === "AME" ? "0" : prev.precio_base,
      }));
      return;
    }

    if (name === "disponible_24h") {
      setForm((prev) => ({
        ...prev,
        disponible_24h: checked,
        hora_inicio: checked ? "" : prev.hora_inicio,
        hora_fin: checked ? "" : prev.hora_fin,
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
      const codigoCatalogo = form.codigo_catalogo.trim();
      const nombreCatalogo = form.nombre_catalogo.trim();
      const categoriaCatalogo = form.categoria_catalogo.trim();

      if (!codigoCatalogo || !nombreCatalogo) {
        throw new Error("Código y nombre son obligatorios.");
      }
      if (codigoCatalogo.length > MAX_LENGTHS.catalogo.codigo) {
        throw new Error("El código no puede exceder 10 caracteres.");
      }
      if (nombreCatalogo.length > MAX_LENGTHS.catalogo.nombre) {
        throw new Error("El nombre no puede exceder 60 caracteres.");
      }
      if (!categoriaCatalogo) {
        throw new Error("La categoría es obligatoria.");
      }
      if (categoriaCatalogo.length > MAX_LENGTHS.catalogo.categoria) {
        throw new Error("La categoría no puede exceder 80 caracteres.");
      }
      if (!form.id_sucursal || Number(form.id_sucursal) <= 0) {
        throw new Error("Debes seleccionar una sucursal válida.");
      }
      if (!CATALOGO_TIPOS.includes(form.tipo_catalogo)) {
        throw new Error("El tipo de catálogo no es válido.");
      }
      if (Number(form.precio_base) < 0) {
        throw new Error("El precio base no puede ser negativo.");
      }
      if (form.tipo_catalogo === "AME" && Number(form.precio_base) !== 0) {
        throw new Error("Las amenidades (AME) deben tener precio base igual a 0.");
      }
      if (form.descripcion_catalogo && form.descripcion_catalogo.trim().length > 250) {
        throw new Error("La descripción no puede exceder 250 caracteres.");
      }
      if (form.icono_url && form.icono_url.trim().length > 500) {
        throw new Error("La URL del ícono no puede exceder 500 caracteres.");
      }
      if (!CATALOGO_ESTADOS.includes(form.estado_catalogo)) {
        throw new Error("El estado del catálogo no es válido.");
      }
      if (!form.disponible_24h && Boolean(form.hora_inicio) !== Boolean(form.hora_fin)) {
        throw new Error("Debes ingresar ambas horas o dejar ambas vacías.");
      }
      if (form.hora_inicio && form.hora_fin && form.hora_fin <= form.hora_inicio) {
        throw new Error("La hora fin debe ser posterior a la hora inicio.");
      }

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
    <form className={styles.page} onSubmit={handleSubmit}>
      <div className={styles.topBar}>
        <h2>{isEditMode ? "Editar Servicio/Catálogo" : "Nuevo Servicio/Catálogo"}</h2>
        <button type="button" className={styles.btnSecondary} onClick={() => navigate("/admin/catalogo-servicios")}>
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
            <select name="id_sucursal" value={form.id_sucursal} onChange={handleChange}>
              <option value="">Selecciona una sucursal</option>
              {sucursales.map((item) => (
                <option key={item.sucursalGuid} value={item.idSucursal}>
                  {item.nombreSucursal} ({item.codigoSucursal}) - ID {item.idSucursal}
                </option>
              ))}
            </select>
            <span className={styles.helpText}>GUID: {form.sucursal_guid || "N/A"}</span>
          </div>
          <div className={styles.field}><label>Código</label><input name="codigo_catalogo" maxLength={10} value={form.codigo_catalogo} onChange={handleChange} required /></div>
          <div className={styles.field}><label>Nombre</label><input name="nombre_catalogo" maxLength={60} value={form.nombre_catalogo} onChange={handleChange} required /></div>
          <div className={styles.field}>
            <label>Tipo</label>
            <select name="tipo_catalogo" value={form.tipo_catalogo} onChange={handleChange}>
              <option value="AME">AME</option>
              <option value="SRV">SRV</option>
            </select>
          </div>
          <div className={styles.field}><label>Categoría</label><input name="categoria_catalogo" maxLength={80} value={form.categoria_catalogo} onChange={handleChange} required /></div>
          <div className={styles.field}><label>Precio base</label><input type="number" min="0" step="0.01" name="precio_base" value={form.precio_base} onChange={handleChange} required /></div>
          <div className={styles.field}><label>Icono URL</label><input name="icono_url" maxLength={500} value={form.icono_url} onChange={handleChange} /></div>
          <div className={styles.field}><label>Hora inicio</label><input type="time" name="hora_inicio" value={form.hora_inicio} onChange={handleChange} disabled={form.disponible_24h} /></div>
          <div className={styles.field}><label>Hora fin</label><input type="time" name="hora_fin" value={form.hora_fin} onChange={handleChange} disabled={form.disponible_24h} /></div>
          {isEditMode && (
            <div className={styles.field}>
              <label>Estado</label>
              <select name="estado_catalogo" value={form.estado_catalogo} onChange={handleChange}>
                {CATALOGO_ESTADOS.map((estado) => (
                  <option key={estado} value={estado}>
                    {estado}
                  </option>
                ))}
              </select>
            </div>
          )}
          <div className={styles.fieldFull}>
            <label>Descripción</label>
            <textarea name="descripcion_catalogo" maxLength={250} value={form.descripcion_catalogo} onChange={handleChange} />
          </div>
          <div className={styles.fieldFull}>
            <div className={styles.checkboxGroup}>
              <label className={styles.checkboxItem}>
                <input type="checkbox" name="aplica_iva" checked={form.aplica_iva} onChange={handleChange} />
                Aplica IVA
              </label>
              <label className={styles.checkboxItem}>
                <input type="checkbox" name="disponible_24h" checked={form.disponible_24h} onChange={handleChange} />
                Disponible 24h
              </label>
            </div>
          </div>
        </div>
      </section>

      <div className={styles.actions}>
        <button type="button" className={styles.btnSecondary} onClick={() => navigate("/admin/catalogo-servicios")}>Cancelar</button>
        <button type="submit" className={styles.btnPrimary} disabled={loading}>{loading ? "Guardando..." : "Guardar"}</button>
      </div>
    </form>
  );
}

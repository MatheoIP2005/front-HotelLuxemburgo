import { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import {
  createCliente,
  getClientes,
  getCliente,
  updateCliente,
} from "../../../services/clientes.service";
import { normalizeCollectionPayload } from "../../../utils/api";
import {
  CLIENT_KIND_OPTIONS,
  CLIENT_KINDS,
  EMAIL_REGEX,
  MAX_LENGTHS,
  ONLY_OPTIONAL_DIGITS_REGEX,
  PASSPORT_REGEX,
  PERSON_NAME_REGEX,
  COMPANY_NAME_REGEX,
  IDENTIFICATION_TYPE_OPTIONS,
  normalizeTipoIdentificacion,
} from "../../../utils/constraints";
import styles from "./ClienteFormPage.module.css";

export default function ClienteFormPage() {
  const navigate = useNavigate();
  const { id } = useParams();
  const isEditMode = Boolean(id);

  const [form, setForm] = useState({
    tipo_identificacion: "CED",
    numero_identificacion: "",
    nombres: "",
    apellidos: "",
    razon_social: "NAT",
    correo: "",
    telefono: "",
    direccion: "",
    estado: "ACT",
    row_version: null,
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(null);

  useEffect(() => {
    const loadData = async () => {
      if (!id) return;
      setLoading(true);
      setError(null);
      try {
        const response = await getCliente(id);
        const item = response || {};
        setForm((prev) => ({
          ...prev,
          tipo_identificacion: normalizeTipoIdentificacion(
            item.tipoIdentificacion ?? prev.tipo_identificacion
          ),
          numero_identificacion: item.numeroIdentificacion ?? prev.numero_identificacion,
          nombres: item.nombres ?? "",
          apellidos: item.apellidos ?? "",
          razon_social: item.razonSocial ?? "NAT",
          correo: item.correo ?? "",
          telefono: item.telefono ?? "",
          direccion: item.direccion ?? "",
          estado: item.estado ?? "ACT",
          row_version: item.rowVersion ?? null,
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
    const { name, value } = e.target;
    const tipoCliente = form.razon_social;
    const nombreRegex = tipoCliente === "EMP" ? COMPANY_NAME_REGEX : PERSON_NAME_REGEX;

    if (name === "tipo_identificacion") {
      setForm((prev) => ({ ...prev, tipo_identificacion: normalizeTipoIdentificacion(value) }));
      return;
    }

    if (name === "razon_social") {
      setForm((prev) => ({
        ...prev,
        razon_social: value,
        apellidos: value === "EMP" ? "" : prev.apellidos,
      }));
      return;
    }

    if (name === "nombres" || name === "apellidos") {
      const regex = name === "nombres" ? nombreRegex : PERSON_NAME_REGEX;
      if (value && !regex.test(value)) return;
    }

    if (name === "telefono") {
      if (!ONLY_OPTIONAL_DIGITS_REGEX.test(value)) return;
    }

    if (name === "numero_identificacion") {
      if (normalizeTipoIdentificacion(form.tipo_identificacion) === "PAS") {
        const upperValue = value.toUpperCase();
        if (upperValue && !PASSPORT_REGEX.test(upperValue)) return;
        setForm((prev) => ({ ...prev, [name]: upperValue }));
        return;
      }
      if (!ONLY_OPTIONAL_DIGITS_REGEX.test(value)) return;
    }

    setForm((prev) => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError(null);
    setSuccess(null);
    try {
      const numeroIdentificacion = form.numero_identificacion.trim();
      const nombres = form.nombres.trim();
      const apellidos = form.apellidos.trim();
      const razonSocial = form.razon_social.trim();
      const correo = form.correo.trim();
      const telefono = form.telefono.trim();
      const direccion = form.direccion.trim();
      const tipoIdentificacion = normalizeTipoIdentificacion(form.tipo_identificacion);
      const tipoCliente = razonSocial || "NAT";
      const nombreRegex = tipoCliente === "EMP" ? COMPANY_NAME_REGEX : PERSON_NAME_REGEX;

      if (!numeroIdentificacion) {
        throw new Error("El número de identificación es obligatorio.");
      }
      if (numeroIdentificacion.length > MAX_LENGTHS.cliente.numeroIdentificacion) {
        throw new Error("El número de identificación no puede exceder 30 caracteres.");
      }
      if (!IDENTIFICATION_TYPE_OPTIONS.some((option) => option.value === tipoIdentificacion)) {
        throw new Error("El tipo de identificación no es válido.");
      }
      if (tipoIdentificacion === "CED" && !/^\d{10}$/.test(numeroIdentificacion)) {
        throw new Error("La cédula debe tener exactamente 10 números.");
      }
      if (tipoIdentificacion === "RUC" && !/^\d{13}$/.test(numeroIdentificacion)) {
        throw new Error("El RUC debe tener exactamente 13 números.");
      }
      if (tipoIdentificacion === "PAS" && !PASSPORT_REGEX.test(numeroIdentificacion.toUpperCase())) {
        throw new Error("El pasaporte solo puede contener letras y números.");
      }
      if (!CLIENT_KINDS.includes(tipoCliente)) {
        throw new Error("El tipo de cliente no es válido.");
      }
      if (!nombres) {
        throw new Error(
          tipoCliente === "EMP"
            ? "La razón social o nombre comercial es obligatoria."
            : "El nombre es obligatorio."
        );
      }
      if (nombres.length > MAX_LENGTHS.cliente.nombres) {
        throw new Error("El nombre no puede exceder 50 caracteres.");
      }
      if (!nombreRegex.test(nombres)) {
        throw new Error(
          tipoCliente === "EMP"
            ? "La razón social solo puede contener letras, números y puntuación básica."
            : "En nombres solo se permiten letras."
        );
      }
      if (apellidos.length > MAX_LENGTHS.cliente.apellidos) {
        throw new Error("Los apellidos no pueden exceder 50 caracteres.");
      }
      if (tipoCliente === "NAT" && !apellidos) {
        throw new Error("Nombres y apellidos son obligatorios.");
      }
      if (apellidos && !PERSON_NAME_REGEX.test(apellidos)) {
        throw new Error("En apellidos solo se permiten letras.");
      }
      if (!correo) {
        throw new Error("El correo es obligatorio.");
      }
      if (correo.length > MAX_LENGTHS.cliente.correo) {
        throw new Error("El correo no puede exceder 100 caracteres.");
      }
      if (!EMAIL_REGEX.test(correo)) {
        throw new Error("El correo no tiene un formato válido.");
      }
      if (!telefono) {
        throw new Error("El teléfono es obligatorio.");
      }
      if (telefono.length !== MAX_LENGTHS.cliente.telefono) {
        throw new Error("El teléfono debe tener exactamente 10 dígitos.");
      }
      if (!/^\d+$/.test(telefono)) {
        throw new Error("En teléfono solo se permiten números.");
      }
      if (!direccion) {
        throw new Error("La dirección es obligatoria.");
      }
      if (direccion.length > MAX_LENGTHS.cliente.direccion) {
        throw new Error("La dirección no puede exceder 200 caracteres.");
      }

      if (isEditMode) {
        await updateCliente(id, {
          ...form,
          tipo_identificacion: tipoIdentificacion,
          apellidos: tipoCliente === "EMP" ? null : apellidos,
          razon_social: tipoCliente,
          rowVersion: form.row_version,
        });
        setSuccess("Cliente actualizado correctamente.");
      } else {
        const response = await getClientes({ pagina: 1, limite: 500 });
        const clientes = normalizeCollectionPayload(response).items;
        const numeroExiste = clientes.some(
          (cliente) =>
            String(cliente?.numeroIdentificacion || "").trim() === numeroIdentificacion
        );
        if (numeroExiste) {
          throw new Error(
            `Ya existe un cliente con identificación '${numeroIdentificacion}'.`
          );
        }

        const correoExiste = clientes.some(
          (cliente) =>
            String(cliente?.correo || "")
              .trim()
              .toLowerCase() === correo.toLowerCase()
        );
        if (correoExiste) {
          throw new Error(`Ya existe un cliente con correo '${correo}'.`);
        }

        await createCliente({
          ...form,
          tipo_identificacion: tipoIdentificacion,
          apellidos: tipoCliente === "EMP" ? null : apellidos,
          razon_social: tipoCliente,
          numero_identificacion:
            tipoIdentificacion === "PAS" ? numeroIdentificacion.toUpperCase() : numeroIdentificacion,
        });
        setSuccess("Cliente creado correctamente.");
      }
      setTimeout(() => navigate("/admin/clientes"), 1500);
    } catch (err) {
      const backendMessage =
        err?.response?.data?.message ||
        err?.response?.data?.title ||
        (typeof err?.response?.data === "string" ? err.response.data : "");
      const fullMessage = `${backendMessage || ""} ${err?.message || ""}`.toLowerCase();

      if (
        err?.response?.status === 409 ||
        fullMessage.includes("ya existe un cliente con identificación") ||
        fullMessage.includes("ya existe un cliente con identificacion")
      ) {
        setError(
          `La identificación '${form.numero_identificacion.trim()}' ya está registrada.`
        );
      } else if (fullMessage.includes("ya existe un cliente con correo")) {
        setError(`El correo '${form.correo.trim()}' ya está registrado.`);
      } else {
        setError(backendMessage || err?.message || "Error al guardar");
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <form className={styles.page} onSubmit={handleSubmit}>
      <div className={styles.topBar}>
        <h2>{isEditMode ? "Editar Cliente" : "Nuevo Cliente"}</h2>
        <button type="button" className={styles.btnSecondary} onClick={() => navigate("/admin/clientes")}>
          Volver
        </button>
      </div>

      {error && <div className={styles.errorBox}>{error}</div>}
      {success && <div className={styles.successBox}>{success}</div>}

      <section className={styles.card}>
        <h3 className={styles.sectionTitle}>Información Personal</h3>
        <div className={styles.grid2}>
          <div className={styles.field}>
            <label>Tipo identificación</label>
            <select name="tipo_identificacion" value={form.tipo_identificacion} onChange={handleChange}>
              {IDENTIFICATION_TYPE_OPTIONS.map((option) => (
                <option key={option.value} value={option.value}>
                  {option.label}
                </option>
              ))}
            </select>
          </div>
          <div className={styles.field}>
            <label>Tipo cliente</label>
            <select name="razon_social" value={form.razon_social} onChange={handleChange}>
              {CLIENT_KIND_OPTIONS.map((option) => (
                <option key={option.value} value={option.value}>
                  {option.label}
                </option>
              ))}
            </select>
          </div>
          <div className={styles.field}><label>Número identificación</label><input name="numero_identificacion" maxLength={30} value={form.numero_identificacion} onChange={handleChange} required /></div>
          <div className={styles.field}><label>{form.razon_social === "EMP" ? "Razón social / nombre comercial" : "Nombres"}</label><input name="nombres" maxLength={50} value={form.nombres} onChange={handleChange} required /></div>
          <div className={styles.field}><label>Apellidos</label><input name="apellidos" maxLength={50} value={form.apellidos} onChange={handleChange} required={form.razon_social === "NAT"} disabled={form.razon_social === "EMP"} /></div>
          <div className={styles.field}><label>Correo</label><input type="email" name="correo" maxLength={100} value={form.correo} onChange={handleChange} required /></div>
          <div className={styles.field}><label>Teléfono</label><input name="telefono" inputMode="numeric" maxLength={10} value={form.telefono} onChange={handleChange} required /></div>
          {isEditMode && (
            <div className={styles.field}>
              <label>Estado</label>
              <select name="estado" value={form.estado} onChange={handleChange}>
                <option value="ACT">ACT</option>
                <option value="INA">INA</option>
              </select>
            </div>
          )}
          <div className={styles.fieldFull}>
            <label>Dirección</label>
            <textarea name="direccion" maxLength={200} value={form.direccion} onChange={handleChange} required />
          </div>
        </div>
      </section>

      <div className={styles.actions}>
        <button type="button" className={styles.btnSecondary} onClick={() => navigate("/admin/clientes")}>Cancelar</button>
        <button type="submit" className={styles.btnPrimary} disabled={loading}>{loading ? "Guardando..." : "Guardar"}</button>
      </div>
    </form>
  );
}

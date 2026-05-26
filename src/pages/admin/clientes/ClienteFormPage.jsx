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
import styles from "../usuarios/UsuarioFormPage.module.css";

const trimLoadedText = (value) =>
  typeof value === "string" ? value.trim() : value == null ? "" : String(value).trim();

const joinDescribedBy = (...ids) => ids.filter(Boolean).join(" ") || undefined;

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
  const [fieldErrors, setFieldErrors] = useState({});
  const [touchedFields, setTouchedFields] = useState({});
  const [submitAttempted, setSubmitAttempted] = useState(false);

  const validateForm = (currentForm) => {
    const nextErrors = {};
    const numeroIdentificacion = currentForm.numero_identificacion.trim();
    const nombres = currentForm.nombres.trim();
    const apellidos = currentForm.apellidos.trim();
    const razonSocial = currentForm.razon_social.trim();
    const correo = currentForm.correo.trim();
    const telefono = currentForm.telefono.trim();
    const direccion = currentForm.direccion.trim();
    const tipoIdentificacion = normalizeTipoIdentificacion(currentForm.tipo_identificacion);
    const tipoCliente = razonSocial || "NAT";
    const nombreRegex =
      tipoCliente === "EMP" ? COMPANY_NAME_REGEX : PERSON_NAME_REGEX;

    if (!IDENTIFICATION_TYPE_OPTIONS.some((option) => option.value === tipoIdentificacion)) {
      nextErrors.tipo_identificacion = "El tipo de identificacion no es valido.";
    }
    if (!numeroIdentificacion) {
      nextErrors.numero_identificacion = "El numero de identificacion es obligatorio.";
    } else if (
      numeroIdentificacion.length > MAX_LENGTHS.cliente.numeroIdentificacion
    ) {
      nextErrors.numero_identificacion =
        "El numero de identificacion no puede exceder 30 caracteres.";
    } else if (tipoIdentificacion === "CED" && !/^\d{10}$/.test(numeroIdentificacion)) {
      nextErrors.numero_identificacion =
        "La cedula debe tener exactamente 10 numeros.";
    } else if (tipoIdentificacion === "RUC" && !/^\d{13}$/.test(numeroIdentificacion)) {
      nextErrors.numero_identificacion = "El RUC debe tener exactamente 13 numeros.";
    } else if (
      tipoIdentificacion === "PAS" &&
      !PASSPORT_REGEX.test(numeroIdentificacion.toUpperCase())
    ) {
      nextErrors.numero_identificacion =
        "El pasaporte solo puede contener letras y numeros.";
    }

    if (!CLIENT_KINDS.includes(tipoCliente)) {
      nextErrors.razon_social = "El tipo de cliente no es valido.";
    }
    if (!nombres) {
      nextErrors.nombres =
        tipoCliente === "EMP"
          ? "La razon social o nombre comercial es obligatoria."
          : "El nombre es obligatorio.";
    } else if (nombres.length > MAX_LENGTHS.cliente.nombres) {
      nextErrors.nombres = "El nombre no puede exceder 50 caracteres.";
    } else if (!nombreRegex.test(nombres)) {
      nextErrors.nombres =
        tipoCliente === "EMP"
          ? "La razon social solo puede contener letras, numeros y puntuacion basica."
          : "En nombres solo se permiten letras.";
    }

    if (tipoCliente === "NAT") {
      if (!apellidos) {
        nextErrors.apellidos = "Los apellidos son obligatorios para persona natural.";
      } else if (apellidos.length > MAX_LENGTHS.cliente.apellidos) {
        nextErrors.apellidos = "Los apellidos no pueden exceder 50 caracteres.";
      } else if (!PERSON_NAME_REGEX.test(apellidos)) {
        nextErrors.apellidos = "En apellidos solo se permiten letras.";
      }
    }

    if (!correo) {
      nextErrors.correo = "El correo es obligatorio.";
    } else if (correo.length > MAX_LENGTHS.cliente.correo) {
      nextErrors.correo = "El correo no puede exceder 100 caracteres.";
    } else if (!EMAIL_REGEX.test(correo)) {
      nextErrors.correo = "El correo no tiene un formato valido.";
    }

    if (!telefono) {
      nextErrors.telefono = "El telefono es obligatorio.";
    } else if (telefono.length !== MAX_LENGTHS.cliente.telefono) {
      nextErrors.telefono = "El telefono debe tener exactamente 10 digitos.";
    } else if (!/^\d+$/.test(telefono)) {
      nextErrors.telefono = "En telefono solo se permiten numeros.";
    }

    if (!direccion) {
      nextErrors.direccion = "La direccion es obligatoria.";
    } else if (direccion.length > MAX_LENGTHS.cliente.direccion) {
      nextErrors.direccion = "La direccion no puede exceder 200 caracteres.";
    }

    if (isEditMode && !["ACT", "INA"].includes(currentForm.estado)) {
      nextErrors.estado = "El estado del cliente no es valido.";
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
      if (!id) {
        return;
      }

      setLoading(true);
      setError(null);
      try {
        const response = await getCliente(id);
        const item = response || {};
        setForm((prev) => ({
          ...prev,
          tipo_identificacion: normalizeTipoIdentificacion(
            trimLoadedText(item.tipoIdentificacion) || prev.tipo_identificacion
          ),
          numero_identificacion:
            trimLoadedText(item.numeroIdentificacion) || prev.numero_identificacion,
          nombres: trimLoadedText(item.nombres),
          apellidos: trimLoadedText(item.apellidos),
          razon_social: trimLoadedText(item.razonSocial) || "NAT",
          correo: trimLoadedText(item.correo),
          telefono: trimLoadedText(item.telefono),
          direccion: trimLoadedText(item.direccion),
          estado: trimLoadedText(item.estado) || "ACT",
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
    const nombreRegex =
      tipoCliente === "EMP" ? COMPANY_NAME_REGEX : PERSON_NAME_REGEX;
    let nextForm;

    if (name === "tipo_identificacion") {
      nextForm = {
        ...form,
        tipo_identificacion: normalizeTipoIdentificacion(value),
        numero_identificacion:
          normalizeTipoIdentificacion(value) === "PAS"
            ? form.numero_identificacion.toUpperCase()
            : form.numero_identificacion,
      };
      setForm(nextForm);
      setError(null);
      if (submitAttempted || touchedFields[name] || touchedFields.numero_identificacion) {
        setFieldErrors(validateForm(nextForm));
      }
      return;
    }

    if (name === "razon_social") {
      nextForm = {
        ...form,
        razon_social: value,
        apellidos: value === "EMP" ? "" : form.apellidos,
      };
      setForm(nextForm);
      setError(null);
      if (
        submitAttempted ||
        touchedFields[name] ||
        touchedFields.nombres ||
        touchedFields.apellidos
      ) {
        setFieldErrors(validateForm(nextForm));
      }
      return;
    }

    if (name === "nombres" || name === "apellidos") {
      const regex = name === "nombres" ? nombreRegex : PERSON_NAME_REGEX;
      if (value && !regex.test(value)) {
        return;
      }
    }

    if (name === "telefono" && !ONLY_OPTIONAL_DIGITS_REGEX.test(value)) {
      return;
    }

    if (name === "numero_identificacion") {
      if (normalizeTipoIdentificacion(form.tipo_identificacion) === "PAS") {
        const upperValue = value.toUpperCase();
        if (upperValue && !PASSPORT_REGEX.test(upperValue)) {
          return;
        }
        nextForm = { ...form, [name]: upperValue };
        setForm(nextForm);
        setError(null);
        if (submitAttempted || touchedFields[name]) {
          setFieldErrors(validateForm(nextForm));
        }
        return;
      }
      if (!ONLY_OPTIONAL_DIGITS_REGEX.test(value)) {
        return;
      }
    }

    nextForm = { ...form, [name]: value };
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
      const numeroIdentificacion = form.numero_identificacion.trim();
      const apellidos = form.apellidos.trim();
      const razonSocial = form.razon_social.trim();
      const correo = form.correo.trim();
      const tipoIdentificacion = normalizeTipoIdentificacion(form.tipo_identificacion);
      const tipoCliente = razonSocial || "NAT";

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
        const uniquenessErrors = {};

        const numeroExiste = clientes.some(
          (cliente) =>
            String(cliente?.numeroIdentificacion || "").trim() === numeroIdentificacion
        );
        if (numeroExiste) {
          uniquenessErrors.numero_identificacion = `La identificacion '${numeroIdentificacion}' ya esta registrada.`;
        }

        const correoExiste = clientes.some(
          (cliente) =>
            String(cliente?.correo || "")
              .trim()
              .toLowerCase() === correo.toLowerCase()
        );
        if (correoExiste) {
          uniquenessErrors.correo = `El correo '${correo}' ya esta registrado.`;
        }

        if (Object.keys(uniquenessErrors).length > 0) {
          setFieldErrors((prev) => ({ ...prev, ...uniquenessErrors }));
          return;
        }

        await createCliente({
          ...form,
          tipo_identificacion: tipoIdentificacion,
          apellidos: tipoCliente === "EMP" ? null : apellidos,
          razon_social: tipoCliente,
          numero_identificacion:
            tipoIdentificacion === "PAS"
              ? numeroIdentificacion.toUpperCase()
              : numeroIdentificacion,
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
          `La identificacion '${form.numero_identificacion.trim()}' ya esta registrada.`
        );
      } else if (fullMessage.includes("ya existe un cliente con correo")) {
        setError(`El correo '${form.correo.trim()}' ya esta registrado.`);
      } else {
        setError(backendMessage || err?.message || "Error al guardar");
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <form className={styles.page} onSubmit={handleSubmit} noValidate>
      <div className={styles.topBar}>
        <h2>{isEditMode ? "Editar Cliente" : "Nuevo Cliente"}</h2>
        <button
          type="button"
          className={styles.btnSecondary}
          onClick={() => navigate("/admin/clientes")}
        >
          Volver
        </button>
      </div>

      {error && <div className={styles.errorBox}>{error}</div>}
      {success && <div className={styles.successBox}>{success}</div>}

      <section className={styles.card}>
        <h3 className={styles.sectionTitle}>Informacion personal</h3>
        <div className={styles.grid2}>
          <div className={getFieldClassName(styles.fieldCompact, "tipo_identificacion")}>
            <label htmlFor="tipo_identificacion">Tipo identificacion</label>
            <select
              id="tipo_identificacion"
              name="tipo_identificacion"
              value={form.tipo_identificacion}
              onChange={handleChange}
              onBlur={handleBlur}
              aria-invalid={showFieldError("tipo_identificacion")}
              aria-describedby={joinDescribedBy(
                "tipo_identificacion-help",
                showFieldError("tipo_identificacion")
                  ? "tipo_identificacion-error"
                  : null
              )}
            >
              {IDENTIFICATION_TYPE_OPTIONS.map((option) => (
                <option key={option.value} value={String(option.value).trim()}>
                  {String(option.label).trim()}
                </option>
              ))}
            </select>
            {renderFieldMeta(
              "tipo_identificacion",
              "CED y RUC aceptan solo numeros; PAS permite letras y numeros.",
              null,
              null
            )}
          </div>

          <div className={getFieldClassName(styles.fieldCompact, "razon_social")}>
            <label htmlFor="razon_social">Tipo cliente</label>
            <select
              id="razon_social"
              name="razon_social"
              value={form.razon_social}
              onChange={handleChange}
              onBlur={handleBlur}
              aria-invalid={showFieldError("razon_social")}
              aria-describedby={joinDescribedBy(
                "razon_social-help",
                showFieldError("razon_social") ? "razon_social-error" : null
              )}
            >
              {CLIENT_KIND_OPTIONS.map((option) => (
                <option key={option.value} value={String(option.value).trim()}>
                  {String(option.label).trim()}
                </option>
              ))}
            </select>
            {renderFieldMeta(
              "razon_social",
              "EMP oculta apellidos y usa el campo nombres como razon social.",
              null,
              null
            )}
          </div>

          <div
            className={getFieldClassName(styles.fieldCompact, "numero_identificacion")}
          >
            <label htmlFor="numero_identificacion">Numero identificacion</label>
            <input
              id="numero_identificacion"
              name="numero_identificacion"
              maxLength={30}
              value={form.numero_identificacion}
              onChange={handleChange}
              onBlur={handleBlur}
              required
              inputMode={form.tipo_identificacion === "PAS" ? "text" : "numeric"}
              placeholder={
                form.tipo_identificacion === "PAS"
                  ? "Ej. AB123456"
                  : "Solo numeros"
              }
              aria-invalid={showFieldError("numero_identificacion")}
              aria-describedby={joinDescribedBy(
                "numero_identificacion-help",
                "numero_identificacion-counter",
                showFieldError("numero_identificacion")
                  ? "numero_identificacion-error"
                  : null
              )}
            />
            {renderFieldMeta(
              "numero_identificacion",
              form.tipo_identificacion === "CED"
                ? "Debe tener exactamente 10 digitos."
                : form.tipo_identificacion === "RUC"
                  ? "Debe tener exactamente 13 digitos."
                  : "Puede contener letras y numeros, hasta 30 caracteres.",
              form.numero_identificacion,
              30
            )}
          </div>

          <div className={getFieldClassName(styles.fieldWide, "nombres")}>
            <label htmlFor="nombres">
              {form.razon_social === "EMP"
                ? "Razon social / nombre comercial"
                : "Nombres"}
            </label>
            <input
              id="nombres"
              name="nombres"
              maxLength={50}
              value={form.nombres}
              onChange={handleChange}
              onBlur={handleBlur}
              required
              autoComplete={form.razon_social === "EMP" ? "organization" : "given-name"}
              placeholder={
                form.razon_social === "EMP"
                  ? "Nombre comercial o razon social"
                  : "Nombres del cliente"
              }
              aria-invalid={showFieldError("nombres")}
              aria-describedby={joinDescribedBy(
                "nombres-help",
                "nombres-counter",
                showFieldError("nombres") ? "nombres-error" : null
              )}
            />
            {renderFieldMeta(
              "nombres",
              form.razon_social === "EMP"
                ? "Se permiten letras, numeros y puntuacion basica."
                : "Ingresa solo letras y espacios.",
              form.nombres,
              50
            )}
          </div>

          <div className={getFieldClassName(styles.fieldWide, "apellidos")}>
            <label htmlFor="apellidos">Apellidos</label>
            <input
              id="apellidos"
              name="apellidos"
              maxLength={50}
              value={form.apellidos}
              onChange={handleChange}
              onBlur={handleBlur}
              required={form.razon_social === "NAT"}
              disabled={form.razon_social === "EMP"}
              autoComplete="family-name"
              placeholder={
                form.razon_social === "EMP"
                  ? "No aplica para empresa"
                  : "Apellidos del cliente"
              }
              aria-invalid={showFieldError("apellidos")}
              aria-describedby={joinDescribedBy(
                "apellidos-help",
                "apellidos-counter",
                showFieldError("apellidos") ? "apellidos-error" : null
              )}
            />
            {renderFieldMeta(
              "apellidos",
              form.razon_social === "EMP"
                ? "Este campo se limpia y no se envia para empresas."
                : "Obligatorio para persona natural. Solo se permiten letras.",
              form.apellidos,
              50
            )}
          </div>

          <div className={getFieldClassName(styles.fieldWide, "correo")}>
            <label htmlFor="correo">Correo</label>
            <input
              id="correo"
              type="email"
              name="correo"
              maxLength={100}
              value={form.correo}
              onChange={handleChange}
              onBlur={handleBlur}
              required
              autoComplete="email"
              placeholder="correo@dominio.com"
              aria-invalid={showFieldError("correo")}
              aria-describedby={joinDescribedBy(
                "correo-help",
                "correo-counter",
                showFieldError("correo") ? "correo-error" : null
              )}
            />
            {renderFieldMeta(
              "correo",
              "Se valida formato y unicidad al crear un cliente.",
              form.correo,
              100
            )}
          </div>

          <div className={getFieldClassName(styles.fieldCompact, "telefono")}>
            <label htmlFor="telefono">Telefono</label>
            <input
              id="telefono"
              name="telefono"
              inputMode="numeric"
              maxLength={10}
              value={form.telefono}
              onChange={handleChange}
              onBlur={handleBlur}
              required
              autoComplete="tel"
              placeholder="10 digitos"
              aria-invalid={showFieldError("telefono")}
              aria-describedby={joinDescribedBy(
                "telefono-help",
                showFieldError("telefono") ? "telefono-error" : null
              )}
            />
            {renderFieldMeta(
              "telefono",
              "Debe contener exactamente 10 numeros.",
              null,
              null
            )}
          </div>

          {isEditMode && (
            <div className={getFieldClassName(styles.fieldCompact, "estado")}>
              <label htmlFor="estado">Estado</label>
              <select
                id="estado"
                name="estado"
                value={form.estado}
                onChange={handleChange}
                onBlur={handleBlur}
                aria-invalid={showFieldError("estado")}
                aria-describedby={joinDescribedBy(
                  "estado-help",
                  showFieldError("estado") ? "estado-error" : null
                )}
              >
                <option value="ACT">ACT</option>
                <option value="INA">INA</option>
              </select>
              {renderFieldMeta(
                "estado",
                "ACT mantiene al cliente disponible; INA lo marca inactivo.",
                null,
                null
              )}
            </div>
          )}

          <div className={getFieldClassName(styles.fieldFull, "direccion")}>
            <label htmlFor="direccion">Direccion</label>
            <textarea
              id="direccion"
              name="direccion"
              maxLength={200}
              value={form.direccion}
              onChange={handleChange}
              onBlur={handleBlur}
              required
              autoComplete="street-address"
              placeholder="Direccion principal del cliente"
              aria-invalid={showFieldError("direccion")}
              aria-describedby={joinDescribedBy(
                "direccion-help",
                "direccion-counter",
                showFieldError("direccion") ? "direccion-error" : null
              )}
            />
            {renderFieldMeta(
              "direccion",
              "Incluye referencia suficiente para contacto o facturacion.",
              form.direccion,
              200
            )}
          </div>
        </div>
      </section>

      <div className={styles.actions}>
        <button
          type="button"
          className={styles.btnSecondary}
          onClick={() => navigate("/admin/clientes")}
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

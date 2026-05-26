import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { createPago } from "../../../services/pagos.service";
import { getFacturas } from "../../../services/facturas.service";
import { normalizeCollectionPayload } from "../../../utils/api";
import { PAGO_METODOS } from "../../../utils/constraints";
import styles from "../usuarios/UsuarioFormPage.module.css";

const ALLOWED_MANUAL_PAYMENT_METHODS = new Set(PAGO_METODOS);

const EMPTY_FORM = {
  factura_guid: "",
  monto: "",
  metodo_pago: "EFECTIVO",
};

const trimText = (value) => String(value ?? "").trim();

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

export default function PagoFormPage() {
  const navigate = useNavigate();
  const location = useLocation();
  const [form, setForm] = useState(EMPTY_FORM);
  const [facturas, setFacturas] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(null);
  const [touched, setTouched] = useState({});
  const [submitAttempted, setSubmitAttempted] = useState(false);
  const preselectedFacturaGuid = location.state?.facturaGuid ?? "";
  const hasAppliedPreselectionRef = useRef(false);
  const selectedFactura = useMemo(
    () =>
      facturas.find(
        (item) => String(item.facturaGuid ?? item.guidFactura) === String(form.factura_guid)
      ),
    [facturas, form.factura_guid]
  );

  const fieldErrors = useMemo(() => {
    const errors = {};
    const monto = Number(form.monto);
    const metodoPago = trimText(form.metodo_pago);

    if (!form.factura_guid) {
      errors.factura_guid = "Seleccione una factura válida.";
    } else if (!selectedFactura) {
      errors.factura_guid = "La factura seleccionada no está disponible para pago.";
    } else if (selectedFactura.estado && trimText(selectedFactura.estado) !== "EMI") {
      errors.factura_guid = "Solo se pueden registrar pagos sobre facturas emitidas (EMI).";
    } else if (Number(selectedFactura.saldoPendiente ?? 0) <= 0) {
      errors.factura_guid = "La factura seleccionada no tiene saldo pendiente.";
    }

    if (!form.monto) {
      errors.monto = "El monto es obligatorio.";
    } else if (Number.isNaN(monto) || monto <= 0) {
      errors.monto = "El monto debe ser mayor a cero.";
    } else if (selectedFactura && monto > Number(selectedFactura.saldoPendiente ?? 0)) {
      errors.monto = "El monto no puede exceder el saldo pendiente de la factura.";
    }

    if (!metodoPago || !ALLOWED_MANUAL_PAYMENT_METHODS.has(metodoPago)) {
      errors.metodo_pago = "Seleccione una opción válida.";
    }

    return errors;
  }, [form, selectedFactura]);

  const applyFacturaSelection = useCallback((facturaGuid, preserveAmount = false) => {
    const factura = facturas.find(
      (item) => String(item.facturaGuid ?? item.guidFactura) === String(facturaGuid)
    );

    setForm((prev) => ({
      ...prev,
      factura_guid: factura?.facturaGuid ?? factura?.guidFactura ?? "",
      monto:
        preserveAmount && prev.monto
          ? prev.monto
          : factura?.saldoPendiente !== undefined && factura?.saldoPendiente !== null
            ? String(factura.saldoPendiente)
            : prev.monto,
    }));
  }, [facturas]);

  useEffect(() => {
    const loadFacturas = async () => {
      try {
        const response = await getFacturas({ pagina: 1, limite: 100 });
        setFacturas(normalizeCollectionPayload(response).items);
      } catch (err) {
        setError(err?.response?.data?.message || "No se pudieron cargar las facturas.");
      }
    };

    loadFacturas();
  }, []);

  useEffect(() => {
    if (
      hasAppliedPreselectionRef.current ||
      !preselectedFacturaGuid ||
      facturas.length === 0
    ) {
      return;
    }

    applyFacturaSelection(preselectedFacturaGuid);
    hasAppliedPreselectionRef.current = true;
  }, [applyFacturaSelection, facturas, preselectedFacturaGuid]);

  const handleChange = (e) => {
    const { name, value } = e.target;

    if (name === "factura_guid") {
      applyFacturaSelection(value);
      return;
    }

    setForm((prev) => ({ ...prev, [name]: value }));
  };

  const handleBlur = (event) => {
    const { name } = event.target;
    setTouched((prev) => ({ ...prev, [name]: true }));
  };

  const getVisibleError = (name) => (submitAttempted || touched[name] ? fieldErrors[name] : "");

  const getFieldClassName = (name, baseClass = styles.field) =>
    [baseClass, getVisibleError(name) ? styles.fieldError : ""].filter(Boolean).join(" ");

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
      if (!form.factura_guid) {
        throw new Error("Debes seleccionar una factura válida.");
      }
      if (!selectedFactura) {
        throw new Error("La factura seleccionada no está disponible para pago.");
      }
      if (selectedFactura.estado && selectedFactura.estado !== "EMI") {
        throw new Error("Solo se pueden registrar pagos sobre facturas emitidas (EMI).");
      }
      if (Number(selectedFactura.saldoPendiente ?? 0) <= 0) {
        throw new Error("La factura seleccionada no tiene saldo pendiente.");
      }
      if (!form.monto || Number(form.monto) <= 0) {
        throw new Error("El monto es obligatorio y debe ser mayor a cero.");
      }
      if (Number(form.monto) > Number(selectedFactura.saldoPendiente ?? 0)) {
        throw new Error("El monto no puede exceder el saldo pendiente de la factura.");
      }
      if (form.metodo_pago.trim().length > 40) {
        throw new Error("El método de pago no puede exceder 40 caracteres.");
      }
      if (!ALLOWED_MANUAL_PAYMENT_METHODS.has(form.metodo_pago.trim())) {
        throw new Error("El método de pago no es válido para registro manual.");
      }

      const payload = {
        facturaGuid: form.factura_guid,
        monto: Number(form.monto),
        metodoPago: form.metodo_pago.trim(),
      };

      await createPago(payload);
      setSuccess("Pago creado correctamente.");
      setTimeout(() => navigate("/admin/pagos"), 1500);
    } catch (err) {
      setError(err?.response?.data?.message || err?.message || "Error al guardar");
    } finally {
      setLoading(false);
    }
  };

  return (
    <form className={styles.page} onSubmit={handleSubmit} noValidate>
      <div className={styles.topBar}>
        <h2>Registrar Pago</h2>
        <button type="button" className={styles.btnSecondary} onClick={() => navigate("/admin/pagos")}>
          Volver
        </button>
      </div>

      {error && <div className={styles.errorBox}>{error}</div>}
      {success && <div className={styles.successBox}>{success}</div>}

      <section className={styles.card}>
        <h3 className={styles.sectionTitle}>Datos del Pago</h3>
        <div className={styles.grid2}>
          <div className={getFieldClassName("factura_guid", styles.fieldWide)}>
            <label htmlFor="factura_guid">Factura</label>
            <select
              id="factura_guid"
              name="factura_guid"
              value={form.factura_guid}
              onChange={handleChange}
              onBlur={handleBlur}
              aria-invalid={Boolean(getVisibleError("factura_guid"))}
              aria-describedby={getDescribedBy(
                "factura_guid-help",
                "factura_guid-error",
                getVisibleError("factura_guid")
              )}
            >
              <option value="">Selecciona una factura</option>
              {facturas.map((item) => {
                const facturaGuid = item.facturaGuid ?? item.guidFactura;
                return (
                  <option key={facturaGuid} value={facturaGuid}>
                    {trimText(item.numeroFactura) || "Factura sin número"}
                  </option>
                );
              })}
            </select>
            <FieldHint
              helpId="factura_guid-help"
              errorId="factura_guid-error"
              helpText="Selecciona la factura sobre la que se registrará el pago."
              errorText={getVisibleError("factura_guid")}
            />
          </div>
          <div className={styles.field}>
            <label htmlFor="estado_factura_display">Estado factura</label>
            <input
              id="estado_factura_display"
              value={trimText(selectedFactura?.estado) || "N/A"}
              readOnly
            />
            <FieldHint
              helpId="estado_factura_display-help"
              errorId="estado_factura_display-error"
              helpText="Solo se pueden registrar pagos sobre facturas emitidas."
            />
          </div>
          <div className={styles.field}>
            <label htmlFor="numero_factura_display">Número de factura</label>
            <input
              id="numero_factura_display"
              value={trimText(selectedFactura?.numeroFactura) || "N/A"}
              readOnly
            />
            <FieldHint
              helpId="numero_factura_display-help"
              errorId="numero_factura_display-error"
              helpText="Se completa automáticamente al elegir una factura."
            />
          </div>
          <div className={styles.field}>
            <label htmlFor="total_factura_display">Total factura</label>
            <input
              id="total_factura_display"
              value={selectedFactura ? `$${selectedFactura.total}` : "N/A"}
              readOnly
            />
            <FieldHint
              helpId="total_factura_display-help"
              errorId="total_factura_display-error"
              helpText="Monto total emitido en la factura seleccionada."
            />
          </div>
          <div className={styles.field}>
            <label htmlFor="saldo_pendiente_display">Saldo pendiente</label>
            <input
              id="saldo_pendiente_display"
              value={
                selectedFactura?.saldoPendiente !== undefined
                  ? `$${selectedFactura.saldoPendiente}`
                  : "N/A"
              }
              readOnly
            />
            <FieldHint
              helpId="saldo_pendiente_display-help"
              errorId="saldo_pendiente_display-error"
              helpText="El monto sugerido toma el saldo pendiente actual."
            />
          </div>
          <div className={getFieldClassName("monto", styles.fieldCompact)}>
            <label htmlFor="monto">Monto</label>
            <input
              id="monto"
              type="number"
              min="0.01"
              step="0.01"
              inputMode="decimal"
              name="monto"
              value={form.monto}
              onChange={handleChange}
              onBlur={handleBlur}
              required
              aria-invalid={Boolean(getVisibleError("monto"))}
              aria-describedby={getDescribedBy("monto-help", "monto-error", getVisibleError("monto"))}
            />
            <FieldHint
              helpId="monto-help"
              errorId="monto-error"
              helpText="Debe ser mayor a cero y no superar el saldo pendiente."
              errorText={getVisibleError("monto")}
            />
          </div>
          <div className={getFieldClassName("metodo_pago", styles.fieldCompact)}>
            <label htmlFor="metodo_pago">Método de pago</label>
            <select
              id="metodo_pago"
              name="metodo_pago"
              value={form.metodo_pago}
              onChange={handleChange}
              onBlur={handleBlur}
              aria-invalid={Boolean(getVisibleError("metodo_pago"))}
              aria-describedby={getDescribedBy(
                "metodo_pago-help",
                "metodo_pago-error",
                getVisibleError("metodo_pago")
              )}
            >
              <option value="TARJETA_CREDITO">TARJETA_CREDITO</option>
              <option value="TARJETA_DEBITO">TARJETA_DEBITO</option>
              <option value="EFECTIVO">EFECTIVO</option>
              <option value="TRANSFERENCIA">TRANSFERENCIA</option>
              <option value="CHEQUE">CHEQUE</option>
              <option value="OTRO">OTRO</option>
            </select>
            <FieldHint
              helpId="metodo_pago-help"
              errorId="metodo_pago-error"
              helpText="Opciones válidas según la base de datos financiera."
              errorText={getVisibleError("metodo_pago")}
              counterText={getCounterText(trimText(form.metodo_pago), 40)}
            />
          </div>
        </div>
      </section>

      <div className={styles.actions}>
        <button type="button" className={styles.btnSecondary} onClick={() => navigate("/admin/pagos")}>Cancelar</button>
        <button type="submit" className={styles.btnPrimary} disabled={loading}>{loading ? "Guardando..." : "Guardar"}</button>
      </div>
    </form>
  );
}

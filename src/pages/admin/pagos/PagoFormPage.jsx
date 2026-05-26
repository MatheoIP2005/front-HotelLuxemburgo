import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { createPago } from "../../../services/pagos.service";
import { getFacturas } from "../../../services/facturas.service";
import { normalizeCollectionPayload } from "../../../utils/api";
import { PAGO_METODOS } from "../../../utils/constraints";
import styles from "./PagoFormPage.module.css";

const ALLOWED_MANUAL_PAYMENT_METHODS = new Set(PAGO_METODOS);

const EMPTY_FORM = {
  factura_guid: "",
  monto: "",
  metodo_pago: "EFECTIVO",
};

export default function PagoFormPage() {
  const navigate = useNavigate();
  const location = useLocation();
  const [form, setForm] = useState(EMPTY_FORM);
  const [facturas, setFacturas] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(null);
  const preselectedFacturaGuid = location.state?.facturaGuid ?? "";
  const hasAppliedPreselectionRef = useRef(false);
  const selectedFactura = useMemo(
    () =>
      facturas.find(
        (item) => String(item.facturaGuid ?? item.guidFactura) === String(form.factura_guid)
      ),
    [facturas, form.factura_guid]
  );

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

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError(null);
    setSuccess(null);
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
    <form className={styles.page} onSubmit={handleSubmit}>
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
          <div className={styles.field}>
            <label>Factura</label>
            <select name="factura_guid" value={form.factura_guid} onChange={handleChange}>
              <option value="">Selecciona una factura</option>
              {facturas.map((item) => {
                const facturaGuid = item.facturaGuid ?? item.guidFactura;
                return (
                  <option key={facturaGuid} value={facturaGuid}>
                    {item.numeroFactura} - {facturaGuid}
                  </option>
                );
              })}
            </select>
            <span className={styles.helpText}>Se enviará `facturaGuid`.</span>
          </div>
          <div className={styles.field}>
            <label>Reserva GUID</label>
            <input value={selectedFactura?.reservaGuid ?? "N/A"} readOnly />
          </div>
          <div className={styles.field}>
            <label>Número de factura</label>
            <input value={selectedFactura?.numeroFactura ?? "N/A"} readOnly />
          </div>
          <div className={styles.field}>
            <label>Total factura</label>
            <input value={selectedFactura ? `$${selectedFactura.total}` : "N/A"} readOnly />
          </div>
          <div className={styles.field}>
            <label>Saldo pendiente</label>
            <input
              value={
                selectedFactura?.saldoPendiente !== undefined
                  ? `$${selectedFactura.saldoPendiente}`
                  : "N/A"
              }
              readOnly
            />
            <span className={styles.helpText}>
              El monto sugerido toma el saldo pendiente actual.
            </span>
          </div>
          <div className={styles.field}><label>Monto</label><input type="number" min="0.01" step="0.01" name="monto" value={form.monto} onChange={handleChange} required /></div>
          <div className={styles.field}>
            <label>Método pago</label>
            <select name="metodo_pago" value={form.metodo_pago} onChange={handleChange}>
              <option value="TARJETA_CREDITO">TARJETA_CREDITO</option>
              <option value="TARJETA_DEBITO">TARJETA_DEBITO</option>
              <option value="EFECTIVO">EFECTIVO</option>
              <option value="TRANSFERENCIA">TRANSFERENCIA</option>
              <option value="CHEQUE">CHEQUE</option>
              <option value="OTRO">OTRO</option>
            </select>
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

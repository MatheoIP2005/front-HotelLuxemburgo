import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { Alert, StyleSheet, Text } from "react-native";
import AdminFormScreen from "../../components/admin/AdminFormScreen";
import FormField from "../../components/admin/FormField";
import ScrollSelectField from "../../components/admin/ScrollSelectField";
import useRequireAuth from "../../hooks/useRequireAuth";
import { getFacturas } from "../../services/facturas.service";
import { createPago } from "../../services/pagos.service";
import { extractApiErrorMessage } from "../../../../src/shared/utils/api";
import { PAGO_METODOS } from "../../../../src/utils/constraints";
import { normalizeAdminList } from "../../utils/adminCollection";
import { getFacturaId } from "../../utils/facturas";
import { validatePagoForm } from "../../utils/pagos";
import { sanitizeDecimalInput } from "../../utils/numeric";
import { colors } from "../../styles/theme";

const EMPTY_FORM = {
  factura_guid: "",
  monto: "",
  metodo_pago: "EFECTIVO",
};

const METODO_OPTIONS = PAGO_METODOS.map((value) => ({ value, label: value }));

export default function AdminPagoFormScreen({ navigation, route }) {
  const preselectedFacturaGuid = route.params?.facturaGuid ?? "";
  const { bootstrapping, isAuthenticated } = useRequireAuth(navigation);
  const hasAppliedPreselectionRef = useRef(false);

  const [form, setForm] = useState(EMPTY_FORM);
  const [facturas, setFacturas] = useState([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [fieldErrors, setFieldErrors] = useState({});

  const payableFacturas = useMemo(
    () =>
      facturas.filter(
        (item) => item.estado === "EMI" && Number(item.saldoPendiente ?? 0) > 0
      ),
    [facturas]
  );

  const facturaOptions = useMemo(
    () =>
      payableFacturas.map((item) => {
        const id = getFacturaId(item);
        return {
          value: id,
          label: `${item.numeroFactura || "Sin número"} · Saldo $${Number(item.saldoPendiente ?? 0).toFixed(2)}`,
        };
      }),
    [payableFacturas]
  );

  const selectedFactura = useMemo(
    () =>
      payableFacturas.find(
        (item) => String(getFacturaId(item)) === String(form.factura_guid)
      ) ?? null,
    [payableFacturas, form.factura_guid]
  );

  const applyFacturaSelection = useCallback(
    (facturaGuid, preserveAmount = false) => {
      const factura = payableFacturas.find(
        (item) => String(getFacturaId(item)) === String(facturaGuid)
      );
      setForm((prev) => ({
        ...prev,
        factura_guid: getFacturaId(factura) ?? "",
        monto:
          preserveAmount && prev.monto
            ? prev.monto
            : factura?.saldoPendiente != null
              ? String(factura.saldoPendiente)
              : prev.monto,
      }));
    },
    [payableFacturas]
  );

  useEffect(() => {
    if (bootstrapping || !isAuthenticated) return;
    const load = async () => {
      setLoading(true);
      try {
        const response = await getFacturas({ pagina: 1, limite: 100 });
        setFacturas(normalizeAdminList(response).items);
      } catch (err) {
        setError(extractApiErrorMessage(err, "No se pudieron cargar las facturas."));
      } finally {
        setLoading(false);
      }
    };
    load();
  }, [bootstrapping, isAuthenticated]);

  useEffect(() => {
    if (
      hasAppliedPreselectionRef.current ||
      !preselectedFacturaGuid ||
      payableFacturas.length === 0
    ) {
      return;
    }
    applyFacturaSelection(preselectedFacturaGuid);
    hasAppliedPreselectionRef.current = true;
  }, [applyFacturaSelection, payableFacturas, preselectedFacturaGuid]);

  const validate = () => validatePagoForm(form, selectedFactura);

  const onSubmit = async () => {
    const errors = validate();
    setFieldErrors(errors);
    if (Object.keys(errors).length) return;

    setSaving(true);
    setError("");
    try {
      await createPago({
        facturaGuid: form.factura_guid,
        monto: Number(form.monto),
        metodoPago: form.metodo_pago,
      });
      Alert.alert("Pago", "Pago creado correctamente.", [
        { text: "OK", onPress: () => navigation.navigate("AdminPagos") },
      ]);
    } catch (err) {
      setError(extractApiErrorMessage(err, "No se pudo registrar el pago."));
    } finally {
      setSaving(false);
    }
  };

  return (
    <AdminFormScreen
      title="Registrar pago"
      loading={loading || bootstrapping}
      saving={saving}
      error={error}
      onSubmit={onSubmit}
      onCancel={() => navigation.goBack()}
      submitLabel="Guardar pago"
    >
      <ScrollSelectField
        label="Factura"
        value={form.factura_guid}
        onChange={(value) => applyFacturaSelection(value)}
        options={facturaOptions}
        error={fieldErrors.factura_guid}
        placeholder="Selecciona una factura con saldo"
      />

      <FormField
        label="Estado factura"
        value={selectedFactura?.estado ?? "N/A"}
        editable={false}
      />

      <FormField
        label="Saldo pendiente"
        value={
          selectedFactura?.saldoPendiente != null
            ? `$${Number(selectedFactura.saldoPendiente).toFixed(2)}`
            : "N/A"
        }
        editable={false}
      />

      <FormField
        label="Monto"
        value={form.monto}
        onChangeText={(value) =>
          setForm((prev) => ({ ...prev, monto: sanitizeDecimalInput(value) }))
        }
        keyboardType="decimal-pad"
        error={fieldErrors.monto}
      />

      <ScrollSelectField
        label="Método de pago"
        value={form.metodo_pago}
        onChange={(value) => setForm((prev) => ({ ...prev, metodo_pago: value }))}
        options={METODO_OPTIONS}
        error={fieldErrors.metodo_pago}
      />

      {payableFacturas.length === 0 && !loading ? (
        <Text style={styles.hint}>No hay facturas emitidas con saldo pendiente.</Text>
      ) : null}
    </AdminFormScreen>
  );
}

const styles = StyleSheet.create({
  hint: { color: colors.muted, marginTop: 8 },
});

import { useCallback, useEffect, useMemo, useState } from "react";
import {
  ActivityIndicator,
  Alert,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from "react-native";
import AdminDetailSection from "../../components/admin/AdminDetailSection";
import FormField from "../../components/admin/FormField";
import useRequireAuth from "../../hooks/useRequireAuth";
import { getCargosEstadia, getEstadias } from "../../services/estadias.service";
import {
  anularFactura,
  generarFacturaFinal,
  generarFacturaFinalYPagoSimulado,
  generarFacturaReserva,
  getFactura,
  getFacturaDetalle,
  getFacturaPagos,
  getFacturasByReserva,
} from "../../services/facturas.service";
import { getReserva } from "../../services/reservas.service";
import { extractApiErrorMessage } from "../../../../src/shared/utils/api";
import { MAX_LENGTHS } from "../../../../src/utils/constraints";
import { confirmAdminAction } from "../../utils/adminCollection";
import {
  buildFacturaGeneracionBody,
  canAnularFactura,
  canPayFactura,
  formatFacturaMoney,
  getFacturaId,
} from "../../utils/facturas";
import { getReservaId, isValidGuid } from "../../utils/reservas";
import { normalizeEstadiasList, normalizeCargosList } from "../../utils/estadias";
import { colors, shadow } from "../../styles/theme";

function DetailRow({ label, value }) {
  return (
    <View style={styles.row}>
      <Text style={styles.rowLabel}>{label}</Text>
      <Text style={styles.rowValue}>{value ?? "-"}</Text>
    </View>
  );
}

export default function AdminFacturaDetailScreen({ navigation, route }) {
  const { id, mode, reservaId: initialReservaId } = route.params ?? {};
  const isGenerateMode = mode === "generate" && !id;
  const { bootstrapping, isAuthenticated } = useRequireAuth(navigation);

  const [factura, setFactura] = useState(null);
  const [detalle, setDetalle] = useState([]);
  const [pagos, setPagos] = useState([]);
  const [loading, setLoading] = useState(!isGenerateMode);
  const [actionLoading, setActionLoading] = useState(false);
  const [error, setError] = useState("");
  const [motivoAnular, setMotivoAnular] = useState("");
  const [showAnular, setShowAnular] = useState(false);

  const [reservaGuid, setReservaGuid] = useState(initialReservaId ?? "");
  const [reservaPreview, setReservaPreview] = useState(null);
  const [facturasReserva, setFacturasReserva] = useState([]);
  const [cargosReserva, setCargosReserva] = useState([]);

  const activeReservaFactura = useMemo(
    () =>
      facturasReserva.find((item) => item.tipoFactura === "RESERVA" && item.estado !== "ANU") ??
      null,
    [facturasReserva]
  );

  const activeFinalFactura = useMemo(
    () =>
      facturasReserva.find((item) => item.tipoFactura === "FINAL" && item.estado !== "ANU") ?? null,
    [facturasReserva]
  );

  const pendingCargos = useMemo(
    () => cargosReserva.filter((cargo) => cargo.estadoCargo === "PEN"),
    [cargosReserva]
  );

  const loadFacturaData = useCallback(async () => {
    if (!id) return;
    setLoading(true);
    setError("");
    try {
      const [facturaData, detalleData, pagosData] = await Promise.all([
        getFactura(id),
        getFacturaDetalle(id),
        getFacturaPagos(id),
      ]);
      setFactura(facturaData);
      setDetalle(Array.isArray(detalleData) ? detalleData : detalleData?.items ?? []);
      setPagos(Array.isArray(pagosData) ? pagosData : pagosData?.items ?? []);
    } catch (err) {
      setError(extractApiErrorMessage(err, "No se pudo cargar la factura."));
      setFactura(null);
    } finally {
      setLoading(false);
    }
  }, [id]);

  useEffect(() => {
    if (!bootstrapping && isAuthenticated && !isGenerateMode) {
      loadFacturaData();
    }
  }, [bootstrapping, isAuthenticated, isGenerateMode, loadFacturaData]);

  const loadReservaContext = async () => {
    const guid = reservaGuid.trim();
    if (!isValidGuid(guid)) {
      setError("Ingresa un GUID de reserva válido.");
      return;
    }
    setActionLoading(true);
    setError("");
    try {
      const [reserva, facturasRes, estadiasRes] = await Promise.all([
        getReserva(guid),
        getFacturasByReserva(guid),
        getEstadias({ pagina: 1, limite: 200, reservaGuid: guid }).catch(() => []),
      ]);
      setReservaPreview(reserva);
      const facturasList = Array.isArray(facturasRes)
        ? facturasRes
        : facturasRes?.items ?? [];
      setFacturasReserva(facturasList);

      const estadias = normalizeEstadiasList(estadiasRes, { pagina: 1, limite: 200 }).items.filter(
        (item) =>
          String(item.reservaGuid ?? "") === String(guid) ||
          String(item.idReserva ?? "") === String(reserva?.idReserva ?? "")
      );
      const cargosLists = await Promise.all(
        estadias.map((estadia) =>
          getCargosEstadia(estadia.estadiaGuid ?? estadia.guidEstadia).catch(() => [])
        )
      );
      setCargosReserva(cargosLists.flatMap((list) => normalizeCargosList(list)));
    } catch (err) {
      setError(extractApiErrorMessage(err, "No se pudo cargar la reserva."));
      setReservaPreview(null);
      setFacturasReserva([]);
      setCargosReserva([]);
    } finally {
      setActionLoading(false);
    }
  };

  const handleGenerate = async (generateMode) => {
    if (!reservaPreview) {
      setError("Carga primero una reserva válida.");
      return;
    }
    const reservaGuidValue = getReservaId(reservaPreview) ?? reservaGuid.trim();
    const estadoReserva = String(reservaPreview.estadoReserva ?? "").trim().toUpperCase();

    if (generateMode === "reserva") {
      if (!["CON", "EMI", "FIN"].includes(estadoReserva)) {
        setError("La factura de reserva solo puede emitirse para reservas confirmadas, en estadía o finalizadas.");
        return;
      }
      if (activeReservaFactura) {
        setError("Ya existe una factura de reserva activa para esta reserva.");
        return;
      }
    } else {
      if (!["EMI", "FIN"].includes(estadoReserva)) {
        setError("La factura final solo puede emitirse para reservas en estadía o finalizadas.");
        return;
      }
      if (activeFinalFactura) {
        setError("Ya existe una factura final activa para esta reserva.");
        return;
      }
      if (pendingCargos.length === 0) {
        setError("No hay cargos pendientes de facturar para esta reserva.");
        return;
      }
    }

    setActionLoading(true);
    setError("");
    try {
      const body = buildFacturaGeneracionBody(
        reservaPreview,
        pendingCargos,
        generateMode === "reserva" ? "reserva" : "final"
      );
      let result;
      if (generateMode === "reserva") {
        result = await generarFacturaReserva(reservaGuidValue, body);
      } else if (generateMode === "final") {
        result = await generarFacturaFinal(reservaGuidValue, body);
      } else {
        result = await generarFacturaFinalYPagoSimulado(reservaGuidValue, body, "EFECTIVO");
      }

      const generatedId =
        result?.factura?.facturaGuid ??
        result?.facturaGuid ??
        getFacturaId(result?.factura) ??
        getFacturaId(result);

      Alert.alert(
        "Factura generada",
        generateMode === "final-pago"
          ? "Factura final generada con pago simulado."
          : "Factura generada correctamente."
      );

      if (generatedId) {
        navigation.replace("AdminFacturaDetail", { id: generatedId });
      } else {
        await loadReservaContext();
      }
    } catch (err) {
      setError(extractApiErrorMessage(err, "No se pudo generar la factura."));
    } finally {
      setActionLoading(false);
    }
  };

  const handleAnular = async () => {
    const motivo = motivoAnular.trim();
    if (!motivo) {
      setError("Ingresa un motivo de anulación.");
      return;
    }
    if (motivo.length > MAX_LENGTHS.factura.motivo) {
      setError(`El motivo no puede exceder ${MAX_LENGTHS.factura.motivo} caracteres.`);
      return;
    }
    if (!(await confirmAdminAction("Anular", "¿Anular esta factura?"))) return;

    setActionLoading(true);
    setError("");
    try {
      await anularFactura(id, motivo, factura?.rowVersion ?? null);
      Alert.alert("Anulación", "Factura anulada.");
      setShowAnular(false);
      setMotivoAnular("");
      await loadFacturaData();
    } catch (err) {
      setError(extractApiErrorMessage(err, "No se pudo anular la factura."));
    } finally {
      setActionLoading(false);
    }
  };

  if (loading) {
    return (
      <View style={styles.center}>
        <ActivityIndicator color={colors.primary} size="large" />
        <Text style={styles.muted}>Cargando...</Text>
      </View>
    );
  }

  if (isGenerateMode) {
    return (
      <ScrollView contentContainerStyle={styles.container}>
        <Text style={styles.title}>Generar factura</Text>
        {error ? <Text style={styles.error}>{error}</Text> : null}

        <FormField
          label="GUID de reserva"
          value={reservaGuid}
          onChangeText={setReservaGuid}
          placeholder="00000000-0000-0000-0000-000000000000"
          autoCapitalize="none"
        />

        <Pressable
          style={[styles.primaryBtn, actionLoading && styles.disabled]}
          disabled={actionLoading}
          onPress={loadReservaContext}
        >
          <Text style={styles.primaryBtnText}>Cargar reserva</Text>
        </Pressable>

        {reservaPreview ? (
          <AdminDetailSection title="Reserva">
            <DetailRow label="Estado" value={reservaPreview.estadoReserva} />
            <DetailRow label="Cliente" value={reservaPreview.clienteGuid} />
            <DetailRow label="Factura reserva activa" value={activeReservaFactura ? "Sí" : "No"} />
            <DetailRow label="Factura final activa" value={activeFinalFactura ? "Sí" : "No"} />
            <DetailRow label="Cargos pendientes" value={String(pendingCargos.length)} />
          </AdminDetailSection>
        ) : null}

        <View style={styles.actions}>
          <Pressable
            style={[styles.primaryBtn, actionLoading && styles.disabled]}
            disabled={actionLoading || !reservaPreview}
            onPress={() => handleGenerate("reserva")}
          >
            <Text style={styles.primaryBtnText}>Factura de reserva</Text>
          </Pressable>
          <Pressable
            style={[styles.secondaryBtn, actionLoading && styles.disabled]}
            disabled={actionLoading || !reservaPreview}
            onPress={() => handleGenerate("final")}
          >
            <Text style={styles.secondaryBtnText}>Factura final</Text>
          </Pressable>
          <Pressable
            style={[styles.secondaryBtn, actionLoading && styles.disabled]}
            disabled={actionLoading || !reservaPreview}
            onPress={() => handleGenerate("final-pago")}
          >
            <Text style={styles.secondaryBtnText}>Final + pago simulado</Text>
          </Pressable>
        </View>
      </ScrollView>
    );
  }

  if (!factura) {
    return (
      <View style={styles.center}>
        <Text style={styles.error}>{error || "Factura no encontrada."}</Text>
      </View>
    );
  }

  const facturaGuid = getFacturaId(factura);

  return (
    <ScrollView contentContainerStyle={styles.container}>
      <Text style={styles.title}>{factura.numeroFactura || "Factura"}</Text>
      {error ? <Text style={styles.error}>{error}</Text> : null}

      <AdminDetailSection title="Datos generales">
        <DetailRow label="Número" value={factura.numeroFactura} />
        <DetailRow label="Tipo" value={factura.tipoFactura} />
        <DetailRow label="Estado" value={factura.estado} />
        <DetailRow label="Total" value={formatFacturaMoney(factura.total)} />
        <DetailRow label="Saldo pendiente" value={formatFacturaMoney(factura.saldoPendiente)} />
        <DetailRow label="Cliente" value={factura.clienteGuid} />
        <DetailRow label="Sucursal" value={factura.sucursalGuid} />
      </AdminDetailSection>

      <AdminDetailSection title="Detalle">
        {detalle.length === 0 ? (
          <Text style={styles.muted}>Sin líneas de detalle.</Text>
        ) : (
          detalle.map((line, index) => (
            <View key={line.facturaDetalleGuid ?? index} style={styles.lineCard}>
              <Text style={styles.lineTitle}>{line.descripcion}</Text>
              <Text style={styles.lineMeta}>
                Cant: {line.cantidad} · PU: {formatFacturaMoney(line.precioUnitario)} · Total:{" "}
                {formatFacturaMoney(line.total)}
              </Text>
            </View>
          ))
        )}
      </AdminDetailSection>

      <AdminDetailSection title="Pagos">
        {pagos.length === 0 ? (
          <Text style={styles.muted}>Sin pagos registrados.</Text>
        ) : (
          pagos.map((pago, index) => (
            <View key={pago.pagoGuid ?? index} style={styles.lineCard}>
              <Text style={styles.lineTitle}>{formatFacturaMoney(pago.monto)}</Text>
              <Text style={styles.lineMeta}>
                {pago.metodoPago} · {pago.estadoPago} · {pago.fechaPagoUtc ?? "-"}
              </Text>
            </View>
          ))
        )}
      </AdminDetailSection>

      <View style={styles.actions}>
        {canPayFactura(factura) ? (
          <Pressable
            style={styles.primaryBtn}
            onPress={() => navigation.navigate("AdminPagoForm", { facturaGuid })}
          >
            <Text style={styles.primaryBtnText}>Registrar pago</Text>
          </Pressable>
        ) : null}
        {canAnularFactura(factura) ? (
          <Pressable style={styles.dangerBtn} onPress={() => setShowAnular((prev) => !prev)}>
            <Text style={styles.dangerBtnText}>Anular factura</Text>
          </Pressable>
        ) : null}
      </View>

      {showAnular ? (
        <View style={styles.anularBox}>
          <Text style={styles.anularTitle}>Motivo de anulación</Text>
          <TextInput
            style={styles.input}
            value={motivoAnular}
            onChangeText={setMotivoAnular}
            placeholder="Motivo (obligatorio)"
            maxLength={MAX_LENGTHS.factura.motivo}
            multiline
          />
          <Pressable
            style={[styles.dangerBtn, actionLoading && styles.disabled]}
            disabled={actionLoading}
            onPress={handleAnular}
          >
            <Text style={styles.dangerBtnText}>Confirmar anulación</Text>
          </Pressable>
        </View>
      ) : null}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { padding: 16, paddingBottom: 32 },
  center: { flex: 1, alignItems: "center", justifyContent: "center", padding: 24 },
  title: { fontSize: 22, fontWeight: "800", color: colors.text, marginBottom: 12 },
  muted: { color: colors.muted },
  error: { color: colors.danger, marginBottom: 12, fontWeight: "600" },
  row: {
    flexDirection: "row",
    justifyContent: "space-between",
    gap: 12,
    paddingVertical: 6,
    borderBottomWidth: 1,
    borderBottomColor: "#e2e8f0",
  },
  rowLabel: { color: colors.muted, flex: 1 },
  rowValue: { color: colors.text, fontWeight: "700", flex: 1, textAlign: "right" },
  lineCard: {
    backgroundColor: colors.surface,
    borderRadius: 8,
    padding: 10,
    marginBottom: 8,
    ...shadow,
  },
  lineTitle: { fontWeight: "700", color: colors.text },
  lineMeta: { color: colors.muted, marginTop: 4, fontSize: 12 },
  actions: { gap: 10, marginTop: 8 },
  primaryBtn: {
    minHeight: 44,
    borderRadius: 8,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: colors.primary,
  },
  primaryBtnText: { color: "#fff", fontWeight: "800" },
  secondaryBtn: {
    minHeight: 44,
    borderRadius: 8,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "#e2e8f0",
  },
  secondaryBtnText: { color: "#334155", fontWeight: "800" },
  dangerBtn: {
    minHeight: 44,
    borderRadius: 8,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: colors.danger,
  },
  dangerBtnText: { color: "#fff", fontWeight: "800" },
  disabled: { opacity: 0.6 },
  anularBox: {
    marginTop: 12,
    padding: 12,
    borderRadius: 8,
    backgroundColor: "#fff7ed",
    borderWidth: 1,
    borderColor: "#fdba74",
    gap: 10,
  },
  anularTitle: { fontWeight: "700", color: "#9a3412" },
  input: {
    minHeight: 72,
    borderWidth: 1,
    borderColor: "#cbd5e1",
    borderRadius: 8,
    padding: 10,
    backgroundColor: "#fff",
    textAlignVertical: "top",
  },
});

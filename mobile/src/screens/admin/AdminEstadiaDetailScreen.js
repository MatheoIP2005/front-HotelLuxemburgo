import { useCallback, useEffect, useState } from "react";
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
import SwitchField from "../../components/admin/SwitchField";
import useRequireAuth from "../../hooks/useRequireAuth";
import { anularCargoEstadia } from "../../services/cargosEstadia.service";
import {
  getCargosEstadia,
  getEstadia,
  hacerCheckin,
  hacerCheckout,
} from "../../services/estadias.service";
import { extractApiErrorMessage } from "../../../../src/shared/utils/api";
import { CARGO_ESTADIA_ESTADOS } from "../../../../src/utils/constraints";
import { confirmAdminAction } from "../../utils/adminCollection";
import {
  canCheckoutEstadia,
  formatEstadiaDateTime,
  getEstadiaId,
  normalizeCargosList,
} from "../../utils/estadias";
import { isValidGuid } from "../../utils/reservas";
import { colors, shadow } from "../../styles/theme";

function DetailRow({ label, value }) {
  return (
    <View style={styles.row}>
      <Text style={styles.rowLabel}>{label}</Text>
      <Text style={styles.rowValue}>{value}</Text>
    </View>
  );
}

export default function AdminEstadiaDetailScreen({ navigation, route }) {
  const { id, mode, reservaId: initialReservaId } = route.params ?? {};
  const isCheckinMode = mode === "checkin" && !id;
  const { bootstrapping, isAuthenticated } = useRequireAuth(navigation);

  const [estadia, setEstadia] = useState(null);
  const [cargos, setCargos] = useState([]);
  const [loading, setLoading] = useState(!isCheckinMode);
  const [cargosLoading, setCargosLoading] = useState(false);
  const [actionLoading, setActionLoading] = useState(false);
  const [error, setError] = useState("");

  const [reservaGuid, setReservaGuid] = useState(initialReservaId ?? "");
  const [observacionesCheckin, setObservacionesCheckin] = useState("");
  const [observacionesCheckout, setObservacionesCheckout] = useState("");
  const [requiereMantenimiento, setRequiereMantenimiento] = useState(false);

  const loadCargos = useCallback(async (estadiaGuid) => {
    if (!estadiaGuid) return;
    setCargosLoading(true);
    try {
      const response = await getCargosEstadia(estadiaGuid);
      setCargos(normalizeCargosList(response));
    } catch (err) {
      setError(extractApiErrorMessage(err, "No se pudieron cargar los cargos."));
      setCargos([]);
    } finally {
      setCargosLoading(false);
    }
  }, []);

  const loadEstadia = useCallback(async () => {
    if (!id) return;
    setLoading(true);
    setError("");
    try {
      const data = await getEstadia(id);
      setEstadia(data);
      await loadCargos(getEstadiaId(data));
    } catch (err) {
      setError(extractApiErrorMessage(err, "No se pudo cargar la estadía."));
      setEstadia(null);
    } finally {
      setLoading(false);
    }
  }, [id, loadCargos]);

  useEffect(() => {
    if (!bootstrapping && isAuthenticated && !isCheckinMode) {
      loadEstadia();
    }
  }, [bootstrapping, isAuthenticated, isCheckinMode, loadEstadia]);

  const handleCheckin = async () => {
    const guid = reservaGuid.trim();
    if (!isValidGuid(guid)) {
      setError("Ingresa un GUID de reserva válido.");
      return;
    }
    setActionLoading(true);
    setError("");
    try {
      const result = await hacerCheckin(guid, {
        observacionesCheckin: observacionesCheckin.trim() || null,
      });
      Alert.alert("Check-in", "Check-in realizado correctamente.");
      navigation.replace("AdminEstadiaDetail", { id: getEstadiaId(result) });
    } catch (err) {
      setError(
        extractApiErrorMessage(
          err,
          "No se pudo realizar check-in. Verifique que la reserva esté confirmada (CON)."
        )
      );
    } finally {
      setActionLoading(false);
    }
  };

  const handleCheckout = async () => {
    if (!(await confirmAdminAction("Checkout", "¿Realizar checkout de esta estadía?"))) return;
    setActionLoading(true);
    setError("");
    try {
      await hacerCheckout(id, {
        requiereMantenimiento,
        observacionesCheckout: observacionesCheckout.trim() || null,
      });
      await loadEstadia();
      Alert.alert("Checkout", "Checkout realizado correctamente.");
    } catch (err) {
      setError(extractApiErrorMessage(err, "No se pudo realizar checkout."));
    } finally {
      setActionLoading(false);
    }
  };

  const handleAnularCargo = async (cargoGuid) => {
    if (!(await confirmAdminAction("Anular cargo", "¿Anular este cargo?"))) return;
    try {
      await anularCargoEstadia(cargoGuid);
      await loadCargos(id);
    } catch (err) {
      setError(extractApiErrorMessage(err, "No se pudo anular el cargo."));
    }
  };

  if (isCheckinMode) {
    return (
      <ScrollView contentContainerStyle={styles.page}>
        <Text style={styles.title}>Check-in de reserva</Text>
        <Text style={styles.muted}>
          La reserva debe estar confirmada (CON). Ingresa el GUID de la reserva.
        </Text>
        {error ? <Text style={styles.error}>{error}</Text> : null}
        <View style={styles.card}>
          <FormField
            label="Reserva GUID"
            value={reservaGuid}
            onChangeText={setReservaGuid}
            autoCapitalize="none"
          />
          <FormField
            label="Observaciones check-in"
            value={observacionesCheckin}
            onChangeText={setObservacionesCheckin}
            multiline
          />
          <Pressable
            style={[styles.primaryButton, actionLoading && styles.disabled]}
            disabled={actionLoading}
            onPress={handleCheckin}
          >
            <Text style={styles.buttonText}>Realizar check-in</Text>
          </Pressable>
        </View>
      </ScrollView>
    );
  }

  if (loading) {
    return (
      <View style={styles.center}>
        <ActivityIndicator color={colors.primary} size="large" />
        <Text style={styles.muted}>Cargando estadía...</Text>
      </View>
    );
  }

  if (!estadia) {
    return (
      <View style={styles.center}>
        <Text style={styles.error}>{error || "Estadía no encontrada."}</Text>
      </View>
    );
  }

  const estado = estadia.estadoEstadia;

  return (
    <ScrollView contentContainerStyle={styles.page}>
      <View style={styles.card}>
        <Text style={styles.title}>Detalle estadía</Text>
        <DetailRow label="Estado" value={estado || "-"} />
        <DetailRow label="Check-in" value={formatEstadiaDateTime(estadia.checkinUtc)} />
        <DetailRow label="Check-out" value={formatEstadiaDateTime(estadia.checkoutUtc)} />
        <DetailRow label="Reserva" value={estadia.reservaGuid || "-"} />
        <DetailRow label="Cliente" value={estadia.clienteGuid || "-"} />
        <DetailRow label="Sucursal" value={estadia.sucursalGuid || "-"} />
        <DetailRow label="Habitación" value={estadia.habitacionGuid || "-"} />
      </View>

      <AdminDetailSection title={`Cargos (${cargos.length})`}>
        {cargosLoading ? <Text style={styles.muted}>Cargando cargos...</Text> : null}
        {!cargosLoading && cargos.length === 0 ? (
          <Text style={styles.muted}>Sin cargos registrados.</Text>
        ) : null}
        {cargos.map((cargo) => (
          <View key={String(cargo.cargoGuid)} style={styles.cargoRow}>
            <Text style={styles.cargoTitle}>{cargo.descripcionCargo}</Text>
            <Text style={styles.muted}>
              Cant: {cargo.cantidad} · ${Number(cargo.precioUnitario ?? 0).toFixed(2)} · Total: $
              {Number(cargo.totalCargo ?? 0).toFixed(2)}
            </Text>
            <Text style={styles.muted}>Estado: {cargo.estadoCargo}</Text>
            {cargo.estadoCargo === CARGO_ESTADIA_ESTADOS[0] ? (
              <Text
                style={styles.linkDanger}
                onPress={() => handleAnularCargo(cargo.cargoGuid)}
              >
                Anular cargo
              </Text>
            ) : null}
          </View>
        ))}
        {canCheckoutEstadia(estado) ? (
          <Pressable
            style={styles.secondaryButton}
            onPress={() =>
              navigation.navigate("AdminCargoEstadiaForm", { estadiaId: id })
            }
          >
            <Text style={styles.secondaryText}>Agregar cargo</Text>
          </Pressable>
        ) : null}
      </AdminDetailSection>

      {error ? <Text style={styles.error}>{error}</Text> : null}

      {canCheckoutEstadia(estado) ? (
        <View style={styles.card}>
          <Text style={styles.sectionTitle}>Checkout</Text>
          <SwitchField
            label="Requiere mantenimiento"
            value={requiereMantenimiento}
            onValueChange={setRequiereMantenimiento}
          />
          <TextInput
            style={styles.input}
            value={observacionesCheckout}
            onChangeText={setObservacionesCheckout}
            placeholder="Observaciones checkout (opcional)"
            multiline
          />
          <Pressable
            style={[styles.warningButton, actionLoading && styles.disabled]}
            disabled={actionLoading}
            onPress={handleCheckout}
          >
            <Text style={styles.buttonText}>Realizar checkout</Text>
          </Pressable>
        </View>
      ) : null}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  page: { padding: 16, paddingBottom: 32, gap: 14, backgroundColor: colors.background },
  center: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    gap: 12,
    padding: 24,
    backgroundColor: colors.background,
  },
  card: {
    backgroundColor: colors.surface,
    borderRadius: 8,
    padding: 16,
    gap: 10,
    ...shadow,
  },
  title: { color: colors.text, fontSize: 22, fontWeight: "800" },
  sectionTitle: { color: colors.text, fontSize: 18, fontWeight: "800" },
  row: { flexDirection: "row", justifyContent: "space-between", gap: 12 },
  rowLabel: { color: colors.muted, fontWeight: "700" },
  rowValue: { flex: 1, color: colors.text, textAlign: "right", fontWeight: "700" },
  muted: { color: colors.muted },
  error: { color: colors.danger, fontWeight: "800", textAlign: "center" },
  cargoRow: { borderTopWidth: 1, borderTopColor: colors.border, paddingTop: 10, gap: 4 },
  cargoTitle: { color: colors.text, fontWeight: "800" },
  linkDanger: { color: colors.danger, fontWeight: "700" },
  input: {
    minHeight: 70,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: 8,
    padding: 10,
    backgroundColor: colors.surface,
    textAlignVertical: "top",
  },
  primaryButton: {
    minHeight: 48,
    borderRadius: 8,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: colors.primary,
  },
  warningButton: {
    minHeight: 48,
    borderRadius: 8,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: colors.warning,
  },
  secondaryButton: {
    minHeight: 44,
    borderRadius: 8,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: colors.primary,
    marginTop: 8,
  },
  secondaryText: { color: colors.onPrimary, fontWeight: "800" },
  buttonText: { color: colors.onPrimary, fontWeight: "800" },
  disabled: { opacity: 0.7 },
});

import { useCallback, useEffect, useMemo, useState } from "react";
import {
  ActivityIndicator,
  Alert,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from "react-native";
import FormField from "../components/admin/FormField";
import useRequireAuth from "../hooks/useRequireAuth";
import { getClientes } from "../services/clientes.service";
import {
  cancelarReserva,
  confirmarReserva,
  getReserva,
} from "../services/reservas.service";
import { getSucursales } from "../services/sucursales.service";
import { extractApiErrorMessage } from "../../../src/shared/utils/api";
import { MAX_LENGTHS } from "../../../src/utils/constraints";
import { getClienteDisplayName } from "../utils/clientes";
import { normalizeAdminList, pickGuid } from "../utils/adminCollection";
import { formatSucursalLabel } from "../utils/sucursales";
import { validateMotivoCancelacion } from "../utils/text";
import {
  canCancelReserva,
  canConfirmReserva,
  formatReservaDate,
  formatReservaMoney,
} from "../utils/reservas";
import { colors, shadow } from "../styles/theme";

function DetailRow({ label, value }) {
  return (
    <View style={styles.row}>
      <Text style={styles.rowLabel}>{label}</Text>
      <Text style={styles.rowValue}>{value}</Text>
    </View>
  );
}

export default function AdminReservaDetailScreen({ navigation, route }) {
  const { id } = route.params ?? {};
  const { bootstrapping, isAuthenticated } = useRequireAuth(navigation);
  const [reserva, setReserva] = useState(null);
  const [clientes, setClientes] = useState([]);
  const [sucursales, setSucursales] = useState([]);
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState(false);
  const [error, setError] = useState("");
  const [motivoCancelacion, setMotivoCancelacion] = useState("");
  const [motivoError, setMotivoError] = useState("");

  const loadReserva = useCallback(async () => {
    if (!id) return;

    setLoading(true);
    setError("");

    try {
      const [data, clientesRes, sucursalesRes] = await Promise.all([
        getReserva(id),
        getClientes({ pagina: 1, limite: 200 }),
        getSucursales({ pagina: 1, limite: 100 }),
      ]);
      setReserva(data || null);
      setClientes(normalizeAdminList(clientesRes).items);
      setSucursales(normalizeAdminList(sucursalesRes).items);
    } catch (err) {
      setError(extractApiErrorMessage(err, "No se pudo cargar la reserva."));
      setReserva(null);
    } finally {
      setLoading(false);
    }
  }, [id]);

  useEffect(() => {
    if (!bootstrapping && isAuthenticated) loadReserva();
  }, [bootstrapping, isAuthenticated, loadReserva]);

  const clienteLabel = useMemo(() => {
    const guid = reserva?.clienteGuid ?? reserva?.idCliente;
    const cliente = clientes.find(
      (c) => pickGuid(c, "clienteGuid", "cliente_guid") === String(guid)
    );
    return cliente ? getClienteDisplayName(cliente) : guid || "-";
  }, [reserva, clientes]);

  const sucursalLabel = useMemo(() => {
    const guid = reserva?.sucursalGuid ?? reserva?.idSucursal;
    const sucursal = sucursales.find(
      (s) => pickGuid(s, "sucursalGuid", "sucursal_guid") === String(guid)
    );
    if (!sucursal) return guid || "-";
    return formatSucursalLabel(sucursal);
  }, [reserva, sucursales]);

  const handleConfirmar = () => {
    Alert.alert("Confirmar reserva", "¿Deseas confirmar esta reserva?", [
      { text: "No", style: "cancel" },
      {
        text: "Confirmar",
        onPress: async () => {
          setActionLoading(true);
          setError("");
          try {
            await confirmarReserva(id);
            await loadReserva();
          } catch (err) {
            setError(extractApiErrorMessage(err, "No se pudo confirmar la reserva."));
          } finally {
            setActionLoading(false);
          }
        },
      },
    ]);
  };

  const handleCancelar = async () => {
    const motivoErr = validateMotivoCancelacion(motivoCancelacion);
    if (motivoErr) {
      setMotivoError(motivoErr);
      return;
    }

    setActionLoading(true);
    setError("");
    setMotivoError("");

    try {
      await cancelarReserva(id, motivoCancelacion.trim());
      setMotivoCancelacion("");
      await loadReserva();
    } catch (err) {
      setError(extractApiErrorMessage(err, "No se pudo cancelar la reserva."));
    } finally {
      setActionLoading(false);
    }
  };

  if (loading) {
    return (
      <View style={styles.center}>
        <ActivityIndicator color={colors.primary} size="large" />
        <Text style={styles.muted}>Cargando detalle...</Text>
      </View>
    );
  }

  if (!reserva) {
    return (
      <View style={styles.center}>
        <Text style={styles.error}>{error || "Reserva no encontrada."}</Text>
      </View>
    );
  }

  const estado = reserva.estadoReserva;
  const habitaciones = (Array.isArray(reserva.habitaciones) ? reserva.habitaciones : []).filter(
    Boolean
  );

  return (
    <ScrollView contentContainerStyle={styles.page}>
      <View style={styles.card}>
        <Text style={styles.title}>{reserva.codigoReserva || "Reserva"}</Text>
        <DetailRow label="Estado" value={estado || "-"} />
        <DetailRow label="Inicio" value={formatReservaDate(reserva.fechaInicio)} />
        <DetailRow label="Fin" value={formatReservaDate(reserva.fechaFin)} />
        <DetailRow label="Subtotal" value={formatReservaMoney(reserva.subtotalReserva)} />
        <DetailRow label="IVA" value={formatReservaMoney(reserva.valorIva)} />
        <DetailRow label="Descuento" value={formatReservaMoney(reserva.descuentoAplicado)} />
        <DetailRow label="Total" value={formatReservaMoney(reserva.totalReserva)} />
        <DetailRow label="Saldo" value={formatReservaMoney(reserva.saldoPendiente)} />
        <DetailRow label="Canal" value={reserva.origenCanalReserva || "-"} />
        <DetailRow label="Walk-in" value={reserva.esWalkin ? "Sí" : "No"} />
        <DetailRow label="Cliente" value={clienteLabel} />
        <DetailRow label="Sucursal" value={sucursalLabel} />
        {reserva.observaciones ? (
          <DetailRow label="Observaciones" value={reserva.observaciones} />
        ) : null}
        {reserva.motivoCancelacion ? (
          <DetailRow label="Motivo cancelación" value={reserva.motivoCancelacion} />
        ) : null}
      </View>

      <View style={styles.card}>
        <Text style={styles.sectionTitle}>
          Habitaciones ({habitaciones.length})
        </Text>
        {habitaciones.length === 0 ? (
          <Text style={styles.muted}>Sin habitaciones registradas.</Text>
        ) : (
          habitaciones.map((item, index) => (
            <View key={String(item?.reservaHabitacionGuid ?? index)} style={styles.lineItem}>
              <Text style={styles.lineTitle}>
                Habitación{" "}
                {item?.numeroHabitacion ?? item?.habitacionNumero ?? index + 1}
              </Text>
              <Text style={styles.muted}>
                Adultos: {item?.numAdultos ?? "-"} · Niños: {item?.numNinos ?? 0}
              </Text>
              <Text style={styles.muted}>
                {formatReservaDate(item?.fechaInicio ?? reserva.fechaInicio)} →{" "}
                {formatReservaDate(item?.fechaFin ?? reserva.fechaFin)}
              </Text>
              <Text style={styles.muted}>
                Precio/noche: {formatReservaMoney(item?.precioNocheAplicado)}
              </Text>
              <Text style={styles.muted}>
                Subtotal: {formatReservaMoney(item?.subtotalLinea)} · IVA:{" "}
                {formatReservaMoney(item?.valorIvaLinea)}
              </Text>
              <Text style={styles.lineTotal}>
                Total línea: {formatReservaMoney(item?.totalLinea ?? item?.precioNocheAplicado)}
              </Text>
            </View>
          ))
        )}
      </View>

      {error ? <Text style={styles.error}>{error}</Text> : null}

      {canConfirmReserva(estado) ? (
        <Pressable
          style={[styles.primaryButton, actionLoading && styles.disabledButton]}
          disabled={actionLoading}
          onPress={handleConfirmar}
        >
          <Text style={styles.primaryButtonText}>Confirmar reserva</Text>
        </Pressable>
      ) : null}

      {canCancelReserva(estado) ? (
        <View style={styles.card}>
          <Text style={styles.sectionTitle}>Cancelar reserva</Text>
          <FormField
            label="Motivo de cancelación"
            value={motivoCancelacion}
            onChangeText={(value) => {
              setMotivoCancelacion(value);
              if (motivoError) setMotivoError("");
            }}
            placeholder="Motivo (obligatorio)"
            maxLength={MAX_LENGTHS.reserva.motivoCancelacion}
            multiline
            error={motivoError}
          />
          <Pressable
            style={[styles.dangerButton, actionLoading && styles.disabledButton]}
            disabled={actionLoading}
            onPress={handleCancelar}
          >
            <Text style={styles.primaryButtonText}>Cancelar reserva</Text>
          </Pressable>
        </View>
      ) : null}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  page: {
    padding: 16,
    paddingBottom: 32,
    gap: 14,
    backgroundColor: colors.background,
  },
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
  title: {
    color: colors.text,
    fontSize: 22,
    fontWeight: "800",
  },
  sectionTitle: {
    color: colors.text,
    fontSize: 18,
    fontWeight: "800",
  },
  row: {
    flexDirection: "row",
    justifyContent: "space-between",
    gap: 12,
  },
  rowLabel: {
    color: colors.muted,
    fontWeight: "700",
  },
  rowValue: {
    flex: 1,
    color: colors.text,
    textAlign: "right",
    fontWeight: "700",
  },
  lineItem: {
    borderTopWidth: 1,
    borderTopColor: colors.border,
    paddingTop: 10,
    gap: 4,
  },
  lineTitle: {
    color: colors.text,
    fontWeight: "800",
  },
  lineTotal: {
    color: colors.primaryDark,
    fontWeight: "800",
  },
  muted: {
    color: colors.muted,
  },
  error: {
    color: colors.danger,
    fontWeight: "800",
    textAlign: "center",
  },
  primaryButton: {
    minHeight: 48,
    borderRadius: 8,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: colors.primary,
  },
  dangerButton: {
    minHeight: 48,
    borderRadius: 8,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: colors.danger,
  },
  disabledButton: {
    opacity: 0.7,
  },
  primaryButtonText: {
    color: colors.onPrimary,
    fontWeight: "800",
  },
});

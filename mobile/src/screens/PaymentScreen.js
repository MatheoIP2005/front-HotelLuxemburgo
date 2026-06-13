import { useState } from "react";
import {
  ActivityIndicator,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from "react-native";
import { createPublicReserva } from "../services/publicServices";
import { useBooking } from "../context/BookingContext";
import { formatMoney } from "../utils/booking";
import { colors, shadow } from "../styles/theme";

export default function PaymentScreen({ navigation }) {
  const { bookingData, setPublicReservation } = useBooking();
  const [cardName, setCardName] = useState("");
  const [cardNumber, setCardNumber] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const buildReservaPayload = () => ({
    cliente: bookingData.cliente,
    sucursalGuid: bookingData.propiedad?.sucursalGuid,
    fechaInicio: bookingData.fechaEntrada,
    fechaFin: bookingData.fechaSalida,
    origenCanalReserva: "APP_MOVIL",
    observaciones: "Reserva creada desde app movil React Native.",
    esWalkin: false,
    habitaciones: [
      {
        tipoHabitacionGuid: bookingData.habitacion?.tipoHabitacionGuid,
        numHabitaciones: Number(bookingData.numHabitaciones || 1),
        numAdultos: Number(bookingData.numAdultos || 1),
        numNinos: Number(bookingData.numNinos || 0),
      },
    ],
  });

  const handlePay = async () => {
    if (!bookingData.cliente || !bookingData.propiedad || !bookingData.habitacion) {
      setError("La reserva esta incompleta. Vuelve a buscar el alojamiento.");
      return;
    }

    if (!bookingData.habitacion.tipoHabitacionGuid) {
      setError("No se pudo identificar el tipo de habitacion para reservar.");
      return;
    }

    if (!cardName.trim() || cardNumber.replace(/\s/g, "").length < 12) {
      setError("Ingresa datos de pago validos para simular la reserva.");
      return;
    }

    setLoading(true);
    setError("");

    try {
      const reservation = await createPublicReserva(buildReservaPayload());
      setPublicReservation(reservation);
      navigation.replace("Confirmation");
    } catch (err) {
      setError(err?.response?.data?.message || "No se pudo crear la reserva.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <ScrollView contentContainerStyle={styles.page}>
      <View style={styles.summary}>
        <Text style={styles.title}>Resumen de pago</Text>
        <Row label="Propiedad" value={bookingData.propiedad?.nombre || "-"} />
        <Row label="Habitación" value={bookingData.habitacion?.nombre || "-"} />
        <Row
          label="Fechas"
          value={`${bookingData.fechaEntrada || "-"} / ${bookingData.fechaSalida || "-"}`}
        />
        <View style={styles.totalRow}>
          <Text style={styles.totalLabel}>Total estimado</Text>
          <Text style={styles.total}>{formatMoney(bookingData.precioTotal)}</Text>
        </View>
      </View>

      <View style={styles.card}>
        <Text style={styles.title}>Pago simulado</Text>
        <Text style={styles.muted}>
          Este flujo no procesa tarjetas reales. Solo confirma la reserva publica.
        </Text>

        <Text style={styles.label}>Nombre en la tarjeta</Text>
        <TextInput
          style={styles.input}
          value={cardName}
          onChangeText={setCardName}
          placeholder="Nombre completo"
        />

        <Text style={styles.label}>Numero de tarjeta</Text>
        <TextInput
          style={styles.input}
          value={cardNumber}
          onChangeText={setCardNumber}
          placeholder="4111 1111 1111 1111"
          keyboardType="number-pad"
        />

        {error ? <Text style={styles.error}>{error}</Text> : null}

        <Pressable
          style={[styles.primaryButton, loading && styles.disabledButton]}
          disabled={loading}
          onPress={handlePay}
        >
          {loading ? (
            <ActivityIndicator color="#fff" />
          ) : (
            <Text style={styles.primaryButtonText}>Confirmar reserva</Text>
          )}
        </Pressable>
      </View>
    </ScrollView>
  );
}

function Row({ label, value }) {
  return (
    <View style={styles.row}>
      <Text style={styles.muted}>{label}</Text>
      <Text style={styles.rowValue}>{value}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  page: {
    padding: 16,
    paddingBottom: 32,
    gap: 14,
    backgroundColor: colors.background,
  },
  summary: {
    backgroundColor: colors.surface,
    borderRadius: 8,
    padding: 16,
    gap: 10,
    ...shadow,
  },
  card: {
    backgroundColor: colors.surface,
    borderRadius: 8,
    padding: 16,
    gap: 12,
    ...shadow,
  },
  title: {
    color: colors.text,
    fontSize: 22,
    fontWeight: "800",
  },
  row: {
    flexDirection: "row",
    justifyContent: "space-between",
    gap: 14,
  },
  rowValue: {
    flex: 1,
    color: colors.text,
    textAlign: "right",
    fontWeight: "700",
  },
  totalRow: {
    marginTop: 4,
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: colors.border,
    flexDirection: "row",
    justifyContent: "space-between",
  },
  totalLabel: {
    color: colors.text,
    fontWeight: "800",
  },
  total: {
    color: colors.primaryDark,
    fontSize: 20,
    fontWeight: "800",
  },
  muted: {
    color: colors.muted,
  },
  label: {
    color: colors.text,
    fontWeight: "700",
  },
  input: {
    minHeight: 46,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: 8,
    paddingHorizontal: 12,
    backgroundColor: "#fff",
  },
  error: {
    color: colors.danger,
    fontWeight: "800",
  },
  primaryButton: {
    minHeight: 50,
    borderRadius: 8,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: colors.primary,
  },
  disabledButton: {
    opacity: 0.7,
  },
  primaryButtonText: {
    color: "#fff",
    fontWeight: "800",
    fontSize: 16,
  },
});

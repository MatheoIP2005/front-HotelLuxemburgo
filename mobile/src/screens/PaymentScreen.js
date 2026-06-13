import { useEffect, useState } from "react";
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
import {
  CARD_NUMBER_REGEX,
  CVV_REGEX,
  buildMaskedCard,
  formatCardNumber,
  formatExpiryDate,
  isExpiryValid,
  randomToken,
  sanitizeDigits,
} from "../utils/payment";
import { colors, shadow } from "../styles/theme";

const PROCESSING_LABELS = {
  validating: "Validando datos simulados...",
  processing: "Procesando pago simulado...",
  success: "Pago simulado aprobado.",
  error: "Error en la simulación.",
};

export default function PaymentScreen({ navigation }) {
  const { bookingData, setPublicReservation, setSimulatedPayment } = useBooking();
  const [form, setForm] = useState({
    numero_tarjeta: "",
    nombre_titular: "",
    fecha_vencimiento: "",
    cvv: "",
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [processingState, setProcessingState] = useState("idle");
  const [simulationInfo, setSimulationInfo] = useState(null);

  useEffect(() => {
    if (!bookingData.cliente) {
      navigation.replace("BookingForm");
    }
  }, [bookingData.cliente, navigation]);

  const handleChange = (name, value) => {
    if (name === "numero_tarjeta") {
      setForm((prev) => ({ ...prev, [name]: formatCardNumber(value) }));
      return;
    }

    if (name === "cvv") {
      setForm((prev) => ({ ...prev, [name]: sanitizeDigits(value).slice(0, 4) }));
      return;
    }

    if (name === "fecha_vencimiento") {
      setForm((prev) => ({ ...prev, [name]: formatExpiryDate(value) }));
      return;
    }

    setForm((prev) => ({ ...prev, [name]: value }));
  };

  const handlePay = async () => {
    const numeroTarjeta = sanitizeDigits(form.numero_tarjeta);
    const cvv = sanitizeDigits(form.cvv);
    const nombreTitular = form.nombre_titular.trim();
    const fechaVencimiento = form.fecha_vencimiento.trim();
    const tipoHabitacionGuid = bookingData.habitacion?.tipoHabitacionGuid;

    if (!nombreTitular) {
      setError("El nombre del titular es obligatorio.");
      return;
    }

    if (!CARD_NUMBER_REGEX.test(numeroTarjeta)) {
      setError("La tarjeta simulada debe tener exactamente 16 dígitos.");
      return;
    }

    if (!CVV_REGEX.test(cvv)) {
      setError("El CVV simulado debe tener 3 o 4 dígitos.");
      return;
    }

    if (!isExpiryValid(fechaVencimiento)) {
      setError("La fecha de vencimiento debe tener formato MM/AA y no estar vencida.");
      return;
    }

    if (!bookingData.propiedad?.sucursalGuid || !bookingData.fechaEntrada || !bookingData.fechaSalida) {
      setError("Faltan datos de la reserva para continuar.");
      return;
    }

    if (!tipoHabitacionGuid) {
      setError("No se pudo resolver el tipo de habitación para crear la reserva.");
      return;
    }

    setError("");
    setLoading(true);
    setProcessingState("validating");
    setSimulationInfo(null);

    try {
      const authorizationCode = randomToken("AUTH");
      const transactionCode = randomToken("TXN");
      const maskedCard = buildMaskedCard(numeroTarjeta);

      setSimulationInfo({
        authorizationCode,
        transactionCode,
        maskedCard,
      });

      setProcessingState("processing");
      await new Promise((resolve) => setTimeout(resolve, 900));

      const reserva = await createPublicReserva({
        cliente: {
          tipoIdentificacion: bookingData.cliente?.tipo_identificacion,
          numeroIdentificacion: bookingData.cliente?.numero_identificacion,
          nombres: bookingData.cliente?.nombres,
          apellidos: bookingData.cliente?.apellidos || "",
          correo: bookingData.cliente?.correo,
          telefono: bookingData.cliente?.telefono,
          direccion: bookingData.cliente?.direccion,
        },
        sucursalGuid: bookingData.propiedad?.sucursalGuid,
        fechaInicio: bookingData.fechaEntrada,
        fechaFin: bookingData.fechaSalida,
        origenCanalReserva: "PORTAL",
        esWalkin: false,
        observaciones: null,
        habitaciones: [
          {
            tipoHabitacionGuid: bookingData.habitacion?.tipoHabitacionGuid ?? null,
            numHabitaciones: bookingData.numHabitaciones || 1,
            numAdultos: bookingData.numAdultos || 1,
            numNinos: bookingData.numNinos || 0,
          },
        ],
      });

      setPublicReservation(reserva);
      setSimulatedPayment({
        authorizationCode,
        transactionCode,
        maskedCard,
        nombreTitular,
        fechaVencimiento,
        metodo: "TARJETA SIMULADA",
      });
      setProcessingState("success");
      navigation.replace("Confirmation");
    } catch (err) {
      setProcessingState("error");
      setError(
        err?.response?.data?.message ||
          err?.response?.data?.error ||
          err?.message ||
          "No se pudo completar el pago"
      );
    } finally {
      setLoading(false);
    }
  };

  return (
    <ScrollView contentContainerStyle={styles.page}>
      <View style={styles.badge}>
        <Text style={styles.badgeText}>
          Pasarela de pago simulada. No ingreses datos reales.
        </Text>
      </View>

      <View style={styles.summary}>
        <Text style={styles.title}>Resumen de pago</Text>
        <Row label="Propiedad" value={bookingData.propiedad?.nombre || "-"} />
        <Row label="Habitación" value={bookingData.habitacion?.nombre || "-"} />
        <Row
          label="Fechas"
          value={`${bookingData.fechaEntrada || "-"} - ${bookingData.fechaSalida || "-"}`}
        />
        <View style={styles.totalRow}>
          <Text style={styles.totalLabel}>Total</Text>
          <Text style={styles.total}>{formatMoney(bookingData.precioTotal)}</Text>
        </View>
      </View>

      <View style={styles.card}>
        <Text style={styles.title}>Datos de pago</Text>

        <Text style={styles.label}>Número de tarjeta</Text>
        <TextInput
          style={styles.input}
          value={form.numero_tarjeta}
          onChangeText={(value) => handleChange("numero_tarjeta", value)}
          placeholder="1234 5678 9012 3456"
          keyboardType="number-pad"
        />

        <Text style={styles.label}>Nombre del titular</Text>
        <TextInput
          style={styles.input}
          value={form.nombre_titular}
          onChangeText={(value) => handleChange("nombre_titular", value)}
        />

        <View style={styles.rowFields}>
          <View style={styles.rowField}>
            <Text style={styles.label}>Fecha de vencimiento</Text>
            <TextInput
              style={styles.input}
              value={form.fecha_vencimiento}
              onChangeText={(value) => handleChange("fecha_vencimiento", value)}
              placeholder="MM/AA"
              keyboardType="number-pad"
            />
          </View>
          <View style={styles.rowField}>
            <Text style={styles.label}>CVV</Text>
            <TextInput
              style={styles.input}
              value={form.cvv}
              onChangeText={(value) => handleChange("cvv", value)}
              placeholder="123"
              keyboardType="number-pad"
              secureTextEntry
            />
          </View>
        </View>

        {processingState !== "idle" ? (
          <View style={styles.infoBox}>
            <Row label="Estado" value={PROCESSING_LABELS[processingState] || "-"} />
            {simulationInfo ? (
              <>
                <Row label="Autorización" value={simulationInfo.authorizationCode} />
                <Row label="Transacción" value={simulationInfo.transactionCode} />
                <Row label="Tarjeta" value={simulationInfo.maskedCard} />
              </>
            ) : null}
          </View>
        ) : null}

        {error ? <Text style={styles.error}>{error}</Text> : null}

        <Pressable
          style={[styles.primaryButton, loading && styles.disabledButton]}
          disabled={loading}
          onPress={handlePay}
        >
          {loading ? (
            <ActivityIndicator color={colors.onPrimary} />
          ) : (
            <Text style={styles.primaryButtonText}>Confirmar y pagar</Text>
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
  badge: {
    backgroundColor: colors.infoBoxBg,
    borderWidth: 1,
    borderColor: colors.primary,
    borderRadius: 8,
    padding: 12,
  },
  badgeText: {
    color: colors.text,
    fontWeight: "700",
    textAlign: "center",
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
    backgroundColor: colors.surface,
  },
  rowFields: {
    flexDirection: "row",
    gap: 10,
  },
  rowField: {
    flex: 1,
    gap: 6,
  },
  infoBox: {
    backgroundColor: colors.infoBoxBg,
    borderWidth: 1.5,
    borderColor: colors.primary,
    borderRadius: 10,
    padding: 14,
    gap: 8,
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
    color: colors.onPrimary,
    fontWeight: "800",
    fontSize: 16,
  },
});

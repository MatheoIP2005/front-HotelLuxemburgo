import { Pressable, StyleSheet, Text, View } from "react-native";
import { useBooking } from "../context/BookingContext";
import { formatMoney } from "../utils/booking";
import { colors, shadow } from "../styles/theme";

export default function ConfirmationScreen({ navigation }) {
  const { bookingData, resetBooking } = useBooking();
  const reservation = bookingData.publicReservation;

  const startOver = () => {
    resetBooking();
    navigation.replace("Search");
  };

  return (
    <View style={styles.page}>
      <View style={styles.card}>
        <View style={styles.iconCircle}>
          <Text style={styles.iconText}>OK</Text>
        </View>
        <Text style={styles.title}>Reserva confirmada</Text>
        <Text style={styles.muted}>
          Tu reserva fue enviada correctamente al backend de Hotel Luxemburgo.
        </Text>

        <View style={styles.infoBox}>
          <Row
            label="Codigo"
            value={reservation?.codigoReserva || reservation?.reservaGuid || "Pendiente"}
          />
          <Row label="Propiedad" value={bookingData.propiedad?.nombre || "-"} />
          <Row label="Cliente" value={bookingData.cliente?.nombres || "-"} />
          <Row label="Total" value={formatMoney(bookingData.precioTotal)} />
        </View>

        <Pressable style={styles.primaryButton} onPress={startOver}>
          <Text style={styles.primaryButtonText}>Nueva busqueda</Text>
        </Pressable>
      </View>
    </View>
  );
}

function Row({ label, value }) {
  return (
    <View style={styles.row}>
      <Text style={styles.muted}>{label}</Text>
      <Text style={styles.value}>{value}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  page: {
    flex: 1,
    justifyContent: "center",
    padding: 16,
    backgroundColor: colors.background,
  },
  card: {
    alignItems: "center",
    backgroundColor: colors.surface,
    borderRadius: 8,
    padding: 20,
    gap: 14,
    ...shadow,
  },
  iconCircle: {
    width: 64,
    height: 64,
    borderRadius: 32,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "#dcfce7",
  },
  iconText: {
    color: "#166534",
    fontWeight: "900",
  },
  title: {
    color: colors.text,
    fontSize: 24,
    fontWeight: "800",
    textAlign: "center",
  },
  muted: {
    color: colors.muted,
    textAlign: "center",
  },
  infoBox: {
    alignSelf: "stretch",
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: 8,
    padding: 14,
    gap: 10,
  },
  row: {
    flexDirection: "row",
    justifyContent: "space-between",
    gap: 14,
  },
  value: {
    flex: 1,
    color: colors.text,
    textAlign: "right",
    fontWeight: "800",
  },
  primaryButton: {
    alignSelf: "stretch",
    minHeight: 50,
    borderRadius: 8,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: colors.primary,
  },
  primaryButtonText: {
    color: "#fff",
    fontWeight: "800",
    fontSize: 16,
  },
});

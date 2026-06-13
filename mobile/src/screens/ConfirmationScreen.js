import { Pressable, StyleSheet, Text, View } from "react-native";
import { useBooking } from "../context/BookingContext";
import { formatMoney } from "../utils/booking";
import { colors, shadow } from "../styles/theme";

export default function ConfirmationScreen({ navigation }) {
  const { bookingData, resetBooking } = useBooking();
  const reservation = bookingData.publicReservation;
  const payment = bookingData.simulatedPayment;

  const reservaInfo = {
    propiedad: bookingData.propiedad?.nombre,
    habitacion: bookingData.habitacion?.nombre,
    fechaEntrada: bookingData.fechaEntrada,
    fechaSalida: bookingData.fechaSalida,
    total: bookingData.precioTotal,
    reservaGuid: reservation?.reservaGuid ?? null,
    codigoReserva: reservation?.codigoReserva ?? null,
    authorizationCode: payment?.authorizationCode ?? null,
    transactionCode: payment?.transactionCode ?? null,
    tarjeta: payment?.maskedCard ?? null,
  };

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
          Tu reserva ha sido registrada exitosamente. Recibirás un correo de confirmación.
        </Text>

        <View style={styles.infoBox}>
          <Row label="Propiedad" value={reservaInfo.propiedad || "-"} />
          <Row label="Habitación" value={reservaInfo.habitacion || "-"} />
          <Row
            label="Fechas"
            value={`${reservaInfo.fechaEntrada || "-"} - ${reservaInfo.fechaSalida || "-"}`}
          />
          <Row label="Total" value={formatMoney(reservaInfo.total)} />
          {reservaInfo.codigoReserva ? (
            <Row label="Código reserva" value={reservaInfo.codigoReserva} />
          ) : null}
          {reservaInfo.reservaGuid ? (
            <Row label="Reserva GUID" value={reservaInfo.reservaGuid} />
          ) : null}
          {reservaInfo.authorizationCode ? (
            <Row label="Autorización simulada" value={reservaInfo.authorizationCode} />
          ) : null}
          {reservaInfo.transactionCode ? (
            <Row label="Transacción simulada" value={reservaInfo.transactionCode} />
          ) : null}
          {reservaInfo.tarjeta ? <Row label="Tarjeta" value={reservaInfo.tarjeta} /> : null}
        </View>

        <Pressable style={styles.primaryButton} onPress={startOver}>
          <Text style={styles.primaryButtonText}>Nueva búsqueda</Text>
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
    backgroundColor: colors.successBg,
  },
  iconText: {
    color: colors.success,
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
    backgroundColor: colors.infoBoxBg,
    borderWidth: 1.5,
    borderColor: colors.primary,
    borderRadius: 10,
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
    color: colors.onPrimary,
    fontWeight: "800",
    fontSize: 16,
  },
});

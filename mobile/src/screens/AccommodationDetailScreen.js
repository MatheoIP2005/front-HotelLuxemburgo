import { useEffect, useMemo, useState } from "react";
import {
  ActivityIndicator,
  Image,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from "react-native";
import { getAccommodation } from "../services/publicServices";
import { useBooking } from "../context/BookingContext";
import {
  buildRoomForBooking,
  formatLocation,
  formatMoney,
  getHabitacionesDisponiblesCount,
  isRoomAvailableForBooking,
  normalizeRoomOptions,
  resolvePropertyImageUrl,
} from "../utils/booking";
import { colors, shadow } from "../styles/theme";

export default function AccommodationDetailScreen({ navigation, route }) {
  const { id, fechaInicio, fechaFin, numAdultos, numHabitaciones, numNinos } =
    route.params ?? {};
  const { bookingData, setPropiedad, setHabitacion, setPrecioTotal } = useBooking();
  const [propiedad, setPropiedadState] = useState(null);
  const [selectedRoom, setSelectedRoom] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [sinDisponibilidad, setSinDisponibilidad] = useState(false);

  useEffect(() => {
    let mounted = true;

    const load = async () => {
      setLoading(true);
      setError("");
      setSinDisponibilidad(false);
      setSelectedRoom(null);

      try {
        const response =
          fechaInicio && fechaFin
            ? await getAccommodation(id, {
                fechaInicio,
                fechaFin,
                numAdultos,
                numHabitaciones,
                numNinos,
              })
            : await getAccommodation(id);

        if (mounted) setPropiedadState(response || null);
      } catch (err) {
        if (!mounted) return;

        if (err?.response?.status === 409) {
          setPropiedadState(err?.response?.data?.data ?? err?.response?.data ?? null);
          setSinDisponibilidad(true);
          setError("");
        } else if (err?.response?.status === 429) {
          setError(
            "El servidor esta limitando temporalmente las consultas. Espera unos segundos e intenta nuevamente."
          );
        } else {
          setError(err?.response?.data?.message || "No se pudo cargar el alojamiento.");
        }
      } finally {
        if (mounted) setLoading(false);
      }
    };

    load();

    return () => {
      mounted = false;
    };
  }, [id, fechaInicio, fechaFin, numAdultos, numHabitaciones, numNinos]);

  const roomOptions = useMemo(() => normalizeRoomOptions(propiedad), [propiedad]);
  const habitacionesSolicitadas = Number(bookingData.numHabitaciones || 1);
  const roomOptionsDisponibles = useMemo(
    () =>
      roomOptions.filter((room) =>
        isRoomAvailableForBooking(room, habitacionesSolicitadas)
      ),
    [roomOptions, habitacionesSolicitadas]
  );
  const habitacionesDisponibles =
    roomOptions.length > 0
      ? roomOptionsDisponibles.length
      : getHabitacionesDisponiblesCount(
          propiedad,
          roomOptions,
          habitacionesSolicitadas
        );
  const hayUnidadesDisponibles = habitacionesDisponibles > 0;
  const imageUrl = resolvePropertyImageUrl(propiedad);

  const roomForBooking = useMemo(
    () =>
      buildRoomForBooking({
        selectedRoom,
        roomOptionsDisponibles,
        propiedad,
        habitacionesSolicitadas,
      }),
    [selectedRoom, roomOptionsDisponibles, propiedad, habitacionesSolicitadas]
  );

  const canReserve = Boolean(roomForBooking);

  const continueBooking = () => {
    if (!propiedad || !roomForBooking) return;

    setPropiedad(propiedad);
    setHabitacion(roomForBooking);
    setPrecioTotal(roomForBooking.precioPorNoche || propiedad.precioDesde || 0);
    navigation.navigate("BookingForm");
  };

  if (loading) {
    return (
      <View style={styles.center}>
        <ActivityIndicator color={colors.primary} size="large" />
        <Text style={styles.muted}>Cargando alojamiento...</Text>
      </View>
    );
  }

  if (error && !propiedad) {
    return (
      <View style={styles.center}>
        <Text style={styles.error}>{error}</Text>
      </View>
    );
  }

  return (
    <ScrollView contentContainerStyle={styles.page}>
      {imageUrl ? (
        <Image source={{ uri: imageUrl }} style={styles.heroImage} />
      ) : (
        <View style={styles.heroFallback}>
          <Text style={styles.muted}>Sin imagen principal</Text>
        </View>
      )}

      <View style={styles.card}>
        <Text style={styles.title}>{propiedad?.nombre || "Alojamiento"}</Text>
        <Text style={styles.location}>{formatLocation(propiedad)}</Text>
        <View style={styles.ratingRow}>
          <Text style={styles.badge}>{propiedad?.promedioValoracion ?? "-"}</Text>
          <Text style={styles.muted}>Valoración promedio</Text>
        </View>
        <Text style={styles.description}>
          {propiedad?.descripcionCorta ||
            propiedad?.descripcionCompleta ||
            "Descripción no disponible."}
        </Text>
      </View>

      <View style={styles.sectionHeader}>
        <Text style={styles.sectionTitle}>Habitaciones disponibles</Text>
      </View>

      {sinDisponibilidad ? (
        <View style={styles.card}>
          <Text style={styles.muted}>
            No hay habitaciones disponibles para las fechas seleccionadas. Prueba con otras
            fechas.
          </Text>
        </View>
      ) : roomOptions.length === 0 && habitacionesDisponibles > 0 ? (
        <View style={styles.card}>
          <Text style={styles.muted}>
            {habitacionesDisponibles} habitaciones disponibles
          </Text>
        </View>
      ) : roomOptions.length > 0 ? (
        roomOptions.map((room) => {
          if (!room) return null;
          const isSelected = selectedRoom?.id === room.id;
          const disponible = isRoomAvailableForBooking(room, habitacionesSolicitadas);
          return (
            <Pressable
              key={String(room.id)}
              style={[
                styles.roomCard,
                !disponible && styles.roomCardUnavailable,
                isSelected && styles.roomCardSelected,
              ]}
              onPress={() => {
                if (disponible) setSelectedRoom(room);
              }}
              disabled={!disponible}
            >
              {room.imagenUrl ? (
                <Image source={{ uri: room.imagenUrl }} style={styles.roomImage} />
              ) : (
                <View style={styles.roomImageFallback}>
                  <Text style={styles.muted}>Sin imagen</Text>
                </View>
              )}
              <View style={styles.roomBody}>
                <Text style={styles.roomTitle}>{room.nombre}</Text>
                <Text style={styles.muted}>Cama: {room.tipoCama}</Text>
                <Text style={styles.muted}>Capacidad: {room.capacidad}</Text>
                <Text style={disponible ? styles.muted : styles.unavailableText}>
                  {disponible
                    ? `${room.disponiblesEnRango} disponibles en tus fechas`
                    : "Sin disponibilidad en tus fechas"}
                </Text>
                {room.descripcion ? (
                  <Text style={styles.description}>{room.descripcion}</Text>
                ) : null}
                <Text style={styles.price}>{formatMoney(room.precioPorNoche)} / noche</Text>
              </View>
            </Pressable>
          );
        })
      ) : (
        <View style={styles.card}>
          <Text style={styles.muted}>
            Contacta con el hotel para ver habitaciones disponibles
          </Text>
        </View>
      )}

      <View style={styles.summary}>
        <View style={styles.summaryInfo}>
          {selectedRoom ? (
            <>
              <Text style={styles.muted}>Habitación</Text>
              <Text style={styles.summaryPrice}>{selectedRoom.nombre}</Text>
              <Text style={styles.muted}>Total estimado</Text>
              <Text style={styles.summaryPrice}>
                {formatMoney(selectedRoom.precioPorNoche)}
              </Text>
            </>
          ) : hayUnidadesDisponibles ? (
            <>
              <Text style={styles.muted}>Disponibilidad</Text>
              <Text style={styles.summaryPrice}>
                {habitacionesDisponibles} habitaciones
              </Text>
              <Text style={styles.muted}>Desde</Text>
              <Text style={styles.summaryPrice}>
                {formatMoney(propiedad?.precioDesde)}
              </Text>
            </>
          ) : (
            <Text style={styles.muted}>Selecciona una habitación para continuar</Text>
          )}
        </View>
        <Pressable
          style={[styles.primaryButton, !canReserve && styles.primaryButtonDisabled]}
          onPress={continueBooking}
          disabled={!canReserve}
        >
          <Text style={styles.primaryButtonText}>
            {hayUnidadesDisponibles ? "Reservar" : "Sin disponibilidad"}
          </Text>
        </Pressable>
      </View>
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
  heroImage: {
    height: 220,
    borderRadius: 8,
    backgroundColor: colors.border,
  },
  heroFallback: {
    height: 220,
    borderRadius: 8,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: colors.badgeBg,
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
    fontSize: 26,
    fontWeight: "800",
  },
  location: {
    color: colors.muted,
    fontSize: 15,
  },
  ratingRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
  },
  badge: {
    overflow: "hidden",
    borderRadius: 6,
    backgroundColor: colors.nav,
    color: colors.onPrimary,
    paddingHorizontal: 10,
    paddingVertical: 5,
    fontWeight: "800",
  },
  description: {
    color: colors.text,
    lineHeight: 21,
  },
  muted: {
    color: colors.muted,
  },
  error: {
    color: colors.danger,
    textAlign: "center",
    fontWeight: "800",
  },
  sectionHeader: {
    marginTop: 8,
  },
  sectionTitle: {
    color: colors.text,
    fontSize: 19,
    fontWeight: "800",
  },
  roomCard: {
    overflow: "hidden",
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: 8,
    backgroundColor: colors.surface,
    ...shadow,
  },
  roomCardUnavailable: {
    opacity: 0.62,
    backgroundColor: colors.badgeBg,
  },
  roomCardSelected: {
    borderColor: colors.primary,
    borderWidth: 2,
  },
  roomImage: {
    height: 140,
    width: "100%",
    backgroundColor: colors.border,
  },
  roomImageFallback: {
    height: 140,
    width: "100%",
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: colors.badgeBg,
  },
  roomBody: {
    padding: 14,
    gap: 7,
  },
  roomTitle: {
    color: colors.text,
    fontSize: 17,
    fontWeight: "800",
  },
  unavailableText: {
    color: colors.danger,
    fontWeight: "700",
  },
  price: {
    color: colors.primaryDark,
    fontWeight: "800",
  },
  summary: {
    marginTop: 4,
    backgroundColor: colors.surface,
    borderRadius: 8,
    padding: 16,
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    gap: 14,
    ...shadow,
  },
  summaryInfo: {
    flex: 1,
    gap: 4,
  },
  summaryPrice: {
    color: colors.text,
    fontSize: 18,
    fontWeight: "800",
  },
  primaryButton: {
    minHeight: 48,
    minWidth: 128,
    borderRadius: 8,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: colors.primary,
  },
  primaryButtonDisabled: {
    opacity: 0.5,
  },
  primaryButtonText: {
    color: colors.onPrimary,
    fontWeight: "800",
  },
});

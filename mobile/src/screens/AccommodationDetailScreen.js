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
  formatLocation,
  formatMoney,
  normalizeRoomOptions,
  resolvePropertyImageUrl,
} from "../utils/booking";
import { colors, shadow } from "../styles/theme";

export default function AccommodationDetailScreen({ navigation, route }) {
  const { id, fechaInicio, fechaFin } = route.params ?? {};
  const { setPropiedad, setHabitacion, setPrecioTotal } = useBooking();
  const [propiedad, setPropiedadState] = useState(null);
  const [selectedRoom, setSelectedRoom] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    let mounted = true;

    const load = async () => {
      setLoading(true);
      setError("");

      try {
        const response = await getAccommodation(id, { fechaInicio, fechaFin });
        if (mounted) setPropiedadState(response || null);
      } catch (err) {
        if (mounted) {
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
  }, [id, fechaInicio, fechaFin]);

  const roomOptions = useMemo(() => normalizeRoomOptions(propiedad), [propiedad]);
  const imageUrl = resolvePropertyImageUrl(propiedad);
  const fallbackRoom =
    roomOptions[0] ??
    (propiedad
      ? {
          id: "fallback-room",
          nombre: "Habitación por asignar",
          precioPorNoche: propiedad.precioDesde || 0,
          tipoHabitacionGuid: null,
          habitacionGuid: null,
          tarifaGuid: null,
        }
      : null);
  const roomForBooking = selectedRoom ?? fallbackRoom;

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

  if (error) {
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
          <Text style={styles.muted}>Valoracion promedio</Text>
        </View>
        <Text style={styles.description}>
          {propiedad?.descripcionCorta ||
            propiedad?.descripcionCompleta ||
            "Descripcion no disponible."}
        </Text>
      </View>

      <View style={styles.sectionHeader}>
        <Text style={styles.sectionTitle}>Habitaciones disponibles</Text>
      </View>

      {roomOptions.length === 0 ? (
        <View style={styles.card}>
          <Text style={styles.muted}>
            Hay disponibilidad general, pero el backend no devolvio detalle de
            habitaciones para estas fechas.
          </Text>
        </View>
      ) : (
        roomOptions.map((room) => {
          const isSelected = selectedRoom?.id === room.id;
          return (
            <Pressable
              key={String(room.id)}
              style={[styles.roomCard, isSelected && styles.roomCardSelected]}
              onPress={() => setSelectedRoom(room)}
            >
              {room.imagenUrl ? (
                <Image source={{ uri: room.imagenUrl }} style={styles.roomImage} />
              ) : null}
              <View style={styles.roomBody}>
                <Text style={styles.roomTitle}>{room.nombre}</Text>
                <Text style={styles.muted}>Cama: {room.tipoCama}</Text>
                <Text style={styles.muted}>Capacidad: {room.capacidad}</Text>
                {room.descripcion ? (
                  <Text style={styles.description}>{room.descripcion}</Text>
                ) : null}
                <Text style={styles.price}>{formatMoney(room.precioPorNoche)} / noche</Text>
              </View>
            </Pressable>
          );
        })
      )}

      <View style={styles.summary}>
        <View>
          <Text style={styles.muted}>Total estimado</Text>
          <Text style={styles.summaryPrice}>
            {formatMoney(roomForBooking?.precioPorNoche ?? propiedad?.precioDesde)}
          </Text>
        </View>
        <Pressable style={styles.primaryButton} onPress={continueBooking}>
          <Text style={styles.primaryButtonText}>Reservar</Text>
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
    backgroundColor: "#e2e8f0",
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
    backgroundColor: "#dcfce7",
    color: "#166534",
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
  roomCardSelected: {
    borderColor: colors.primary,
    borderWidth: 2,
  },
  roomImage: {
    height: 140,
    width: "100%",
    backgroundColor: colors.border,
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
  summaryPrice: {
    color: colors.text,
    fontSize: 20,
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
  primaryButtonText: {
    color: "#fff",
    fontWeight: "800",
  },
});

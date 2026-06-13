import { useMemo, useState } from "react";
import {
  ActivityIndicator,
  FlatList,
  Image,
  KeyboardAvoidingView,
  Platform,
  Pressable,
  StyleSheet,
  Text,
  TextInput,
  View,
} from "react-native";
import { searchAccommodations } from "../services/publicServices";
import { useBooking } from "../context/BookingContext";
import {
  addDaysToIsoDate,
  formatLocation,
  formatMoney,
  getTodayIsoDate,
  resolvePropertyImageUrl,
} from "../utils/booking";
import { API_CONFIG_WARNING, isApiConfigured } from "../config/env";
import { colors, shadow } from "../styles/theme";

export default function SearchScreen({ navigation }) {
  const today = useMemo(() => getTodayIsoDate(), []);
  const tomorrow = useMemo(() => addDaysToIsoDate(today, 1), [today]);
  const { setFechas, setHuespedes, setPropiedad } = useBooking();
  const [form, setForm] = useState({
    destino: "",
    fechaInicio: today,
    fechaFin: tomorrow,
    numAdultos: "1",
    numNinos: "0",
    numHabitaciones: "1",
  });
  const [items, setItems] = useState([]);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [searched, setSearched] = useState(false);

  const updateField = (name, value) => {
    setForm((prev) => ({ ...prev, [name]: value }));
  };

  const handleSearch = async () => {
    if (!isApiConfigured) {
      setError(API_CONFIG_WARNING);
      return;
    }

    if (!form.fechaInicio || !form.fechaFin) {
      setError("Ingresa fecha de entrada y salida.");
      return;
    }

    if (form.fechaFin <= form.fechaInicio) {
      setError("La fecha de salida debe ser posterior a la entrada.");
      return;
    }

    setLoading(true);
    setError("");
    setSearched(true);

    try {
      const response = await searchAccommodations({
        ...form,
        numAdultos: Number(form.numAdultos || 1),
        numNinos: Number(form.numNinos || 0),
        numHabitaciones: Number(form.numHabitaciones || 1),
      });
      const nextItems = Array.isArray(response?.items) ? response.items : [];
      setItems(nextItems);
      setTotal(Number(response?.totalResultados ?? response?.total ?? nextItems.length));
    } catch (err) {
      setItems([]);
      setTotal(0);
      setError(err?.response?.data?.message || "No se pudo buscar alojamientos.");
    } finally {
      setLoading(false);
    }
  };

  const openDetail = (item) => {
    const id = item.sucursalGuid ?? item.id ?? item.slug;
    if (!id) return;

    setPropiedad(item);
    setFechas(form.fechaInicio, form.fechaFin);
    setHuespedes(
      Number(form.numAdultos || 1),
      Number(form.numHabitaciones || 1),
      Number(form.numNinos || 0)
    );

    navigation.navigate("AccommodationDetail", {
      id,
      fechaInicio: form.fechaInicio,
      fechaFin: form.fechaFin,
    });
  };

  return (
    <KeyboardAvoidingView
      style={styles.page}
      behavior={Platform.OS === "ios" ? "padding" : undefined}
    >
      <FlatList
        data={items}
        keyExtractor={(item, index) => String(item.sucursalGuid ?? item.id ?? index)}
        ListHeaderComponent={
          <View style={styles.header}>
            <Text style={styles.eyebrow}>Reserva movil</Text>
            <Text style={styles.title}>Encuentra tu alojamiento ideal</Text>
            <Text style={styles.subtitle}>
              Busca disponibilidad en las sucursales de Hotel Luxemburgo.
            </Text>

            <Pressable
              style={styles.adminLinkButton}
              onPress={() => navigation.navigate("Login")}
            >
              <Text style={styles.adminLinkText}>Acceso administrador</Text>
            </Pressable>

            {!isApiConfigured ? (
              <View style={styles.configWarning}>
                <Text style={styles.configWarningText}>{API_CONFIG_WARNING}</Text>
              </View>
            ) : null}

            <View style={styles.card}>
              <Text style={styles.label}>Destino</Text>
              <TextInput
                value={form.destino}
                onChangeText={(value) => updateField("destino", value)}
                placeholder="Ciudad o sucursal"
                style={styles.input}
              />

              <View style={styles.row}>
                <View style={styles.rowItem}>
                  <Text style={styles.label}>Entrada</Text>
                  <TextInput
                    value={form.fechaInicio}
                    onChangeText={(value) => updateField("fechaInicio", value)}
                    placeholder="YYYY-MM-DD"
                    style={styles.input}
                  />
                </View>
                <View style={styles.rowItem}>
                  <Text style={styles.label}>Salida</Text>
                  <TextInput
                    value={form.fechaFin}
                    onChangeText={(value) => updateField("fechaFin", value)}
                    placeholder="YYYY-MM-DD"
                    style={styles.input}
                  />
                </View>
              </View>

              <View style={styles.row}>
                <View style={styles.rowItem}>
                  <Text style={styles.label}>Adultos</Text>
                  <TextInput
                    value={form.numAdultos}
                    onChangeText={(value) => updateField("numAdultos", value)}
                    keyboardType="number-pad"
                    style={styles.input}
                  />
                </View>
                <View style={styles.rowItem}>
                  <Text style={styles.label}>Ninos</Text>
                  <TextInput
                    value={form.numNinos}
                    onChangeText={(value) => updateField("numNinos", value)}
                    keyboardType="number-pad"
                    style={styles.input}
                  />
                </View>
                <View style={styles.rowItem}>
                  <Text style={styles.label}>Hab.</Text>
                  <TextInput
                    value={form.numHabitaciones}
                    onChangeText={(value) => updateField("numHabitaciones", value)}
                    keyboardType="number-pad"
                    style={styles.input}
                  />
                </View>
              </View>

              {error ? <Text style={styles.error}>{error}</Text> : null}

              <Pressable style={styles.primaryButton} onPress={handleSearch}>
                <Text style={styles.primaryButtonText}>Buscar</Text>
              </Pressable>
            </View>

            <View style={styles.resultsHeader}>
              <Text style={styles.resultsTitle}>
                {searched ? `${total} alojamientos encontrados` : "Busca para comenzar"}
              </Text>
              {loading ? <ActivityIndicator color={colors.primary} /> : null}
            </View>
          </View>
        }
        renderItem={({ item }) => {
          const imageUrl = resolvePropertyImageUrl(item);

          return (
            <Pressable style={styles.resultCard} onPress={() => openDetail(item)}>
              {imageUrl ? (
                <Image source={{ uri: imageUrl }} style={styles.image} />
              ) : (
                <View style={styles.imageFallback}>
                  <Text style={styles.imageFallbackText}>Sin imagen</Text>
                </View>
              )}
              <View style={styles.resultBody}>
                <Text style={styles.resultName}>{item.nombre}</Text>
                <Text style={styles.muted}>{formatLocation(item) || "Ubicacion no disponible"}</Text>
                <View style={styles.resultFooter}>
                  <Text style={styles.badge}>{item.promedioValoracion ?? "-"}</Text>
                  <Text style={styles.price}>
                    Desde {formatMoney(item.precioDesde)}
                  </Text>
                </View>
              </View>
            </Pressable>
          );
        }}
        ListEmptyComponent={
          searched && !loading ? (
            <Text style={styles.empty}>No hay resultados para esta busqueda.</Text>
          ) : null
        }
        contentContainerStyle={styles.listContent}
      />
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  page: {
    flex: 1,
    backgroundColor: colors.background,
  },
  listContent: {
    padding: 16,
    paddingBottom: 32,
  },
  header: {
    gap: 14,
  },
  eyebrow: {
    color: colors.primary,
    fontWeight: "800",
    textTransform: "uppercase",
  },
  title: {
    color: colors.text,
    fontSize: 30,
    fontWeight: "800",
  },
  subtitle: {
    color: colors.muted,
    fontSize: 15,
    lineHeight: 21,
  },
  adminLinkButton: {
    alignSelf: "flex-start",
    paddingVertical: 4,
  },
  adminLinkText: {
    color: colors.primaryDark,
    fontWeight: "800",
  },
  configWarning: {
    backgroundColor: "#fef3c7",
    borderWidth: 1,
    borderColor: "#f59e0b",
    borderRadius: 8,
    padding: 12,
  },
  configWarningText: {
    color: "#92400e",
    fontWeight: "700",
    lineHeight: 20,
  },
  card: {
    backgroundColor: colors.surface,
    borderRadius: 8,
    padding: 16,
    gap: 10,
    ...shadow,
  },
  label: {
    color: colors.text,
    fontWeight: "700",
  },
  input: {
    minHeight: 44,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: 8,
    paddingHorizontal: 12,
    backgroundColor: "#fff",
  },
  row: {
    flexDirection: "row",
    gap: 10,
  },
  rowItem: {
    flex: 1,
    gap: 6,
  },
  error: {
    color: colors.danger,
    fontWeight: "700",
  },
  primaryButton: {
    minHeight: 48,
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
  resultsHeader: {
    marginTop: 12,
    marginBottom: 4,
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  resultsTitle: {
    color: colors.text,
    fontSize: 18,
    fontWeight: "800",
  },
  resultCard: {
    overflow: "hidden",
    marginTop: 14,
    backgroundColor: colors.surface,
    borderRadius: 8,
    ...shadow,
  },
  image: {
    width: "100%",
    height: 170,
    backgroundColor: colors.border,
  },
  imageFallback: {
    height: 170,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "#e2e8f0",
  },
  imageFallbackText: {
    color: colors.muted,
    fontWeight: "700",
  },
  resultBody: {
    padding: 14,
    gap: 8,
  },
  resultName: {
    color: colors.text,
    fontSize: 18,
    fontWeight: "800",
  },
  muted: {
    color: colors.muted,
  },
  resultFooter: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
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
  price: {
    color: colors.primaryDark,
    fontWeight: "800",
  },
  empty: {
    marginTop: 24,
    color: colors.muted,
    textAlign: "center",
  },
});

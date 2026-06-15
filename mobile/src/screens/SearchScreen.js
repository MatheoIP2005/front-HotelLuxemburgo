import { useMemo, useRef, useState } from "react";
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
import MinimalDateInput from "../components/public/MinimalDateInput";
import { searchAccommodations } from "../services/publicServices";
import { useBooking } from "../context/BookingContext";
import {
  addDaysToIsoDate,
  formatLocation,
  formatMoney,
  getOptionalChildrenCount,
  getTodayIsoDate,
  resolvePropertyImageUrl,
} from "../utils/booking";
import { API_CONFIG_WARNING, isApiConfigured } from "../config/env";
import {
  parseNonNegativeInteger,
  parsePositiveInteger,
  sanitizeOptionalDigits,
} from "../utils/numeric";
import { colors, shadow } from "../styles/theme";

const resetSearchResults = (setItems, setTotal, setSearched) => {
  setItems([]);
  setTotal(0);
  setSearched(true);
};

const DUPLICATE_SEARCH_WINDOW_MS = 2500;
const SEARCH_REQUEST_COOLDOWN_MS = 30000;
const RATE_LIMIT_COOLDOWN_MS = 30000;

const getCooldownSeconds = (until, now = Date.now()) =>
  Math.max(1, Math.ceil((until - now) / 1000));

const getRateLimitCooldownMs = (error) => {
  const retryAfter = error?.response?.headers?.["retry-after"];
  if (!retryAfter) return RATE_LIMIT_COOLDOWN_MS;

  const retryAfterSeconds = Number(retryAfter);
  if (Number.isFinite(retryAfterSeconds) && retryAfterSeconds > 0) {
    return retryAfterSeconds * 1000;
  }

  const retryAfterDate = Date.parse(retryAfter);
  if (Number.isFinite(retryAfterDate)) {
    return Math.max(retryAfterDate - Date.now(), RATE_LIMIT_COOLDOWN_MS);
  }

  return RATE_LIMIT_COOLDOWN_MS;
};

const buildSearchKey = (payload) =>
  JSON.stringify({
    destino: String(payload.destino ?? "").trim().toLowerCase(),
    fechaInicio: payload.fechaInicio,
    fechaFin: payload.fechaFin,
    numAdultos: payload.numAdultos,
    numHabitaciones: payload.numHabitaciones,
    numNinos: payload.numNinos ?? "",
  });

export default function SearchScreen({ navigation }) {
  const todayIso = useMemo(() => getTodayIsoDate(), []);
  const { setFechas, setHuespedes, setPropiedad } = useBooking();
  const [form, setForm] = useState({
    destino: "",
    fechaInicio: "",
    fechaFin: "",
    numAdultos: "1",
    numNinos: "",
    numHabitaciones: "1",
  });
  const [items, setItems] = useState([]);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [searched, setSearched] = useState(false);
  const searchInFlightRef = useRef(false);
  const lastSearchRef = useRef({ key: "", at: 0 });
  const requestCooldownUntilRef = useRef(0);
  const rateLimitedUntilRef = useRef(0);

  const salidaMinDate = form.fechaInicio
    ? addDaysToIsoDate(form.fechaInicio, 1)
    : todayIso;

  const updateField = (name, value) => {
    setForm((prev) => ({ ...prev, [name]: value }));
  };

  const updateNumericField = (name, value) => {
    setForm((prev) => ({ ...prev, [name]: sanitizeOptionalDigits(value) }));
  };

  const handleFechaInicioChange = (nextValue) => {
    setForm((prev) => {
      if (!nextValue) {
        return { ...prev, fechaInicio: "", fechaFin: "" };
      }

      return {
        ...prev,
        fechaInicio: nextValue,
        fechaFin: prev.fechaFin && prev.fechaFin <= nextValue ? "" : prev.fechaFin,
      };
    });
  };

  const handleFechaFinChange = (nextValue) => {
    setForm((prev) => ({ ...prev, fechaFin: nextValue }));
  };

  const handleSearch = async () => {
    const now = Date.now();

    if (searchInFlightRef.current || loading) {
      return;
    }

    if (rateLimitedUntilRef.current > now) {
      const seconds = getCooldownSeconds(rateLimitedUntilRef.current, now);
      setError(
        `El servidor está limitando temporalmente las búsquedas. Intenta nuevamente en ${seconds} segundos.`
      );
      return;
    }

    if (requestCooldownUntilRef.current > now) {
      const seconds = getCooldownSeconds(requestCooldownUntilRef.current, now);
      setError(`Espera ${seconds} segundos antes de lanzar otra busqueda.`);
      return;
    }

    if (!isApiConfigured) {
      setError(API_CONFIG_WARNING);
      resetSearchResults(setItems, setTotal, setSearched);
      return;
    }

    if (!form.fechaInicio || !form.fechaFin) {
      setError("Selecciona fecha de entrada y salida.");
      resetSearchResults(setItems, setTotal, setSearched);
      return;
    }

    if (form.fechaInicio < todayIso) {
      setError("La fecha de entrada no puede ser menor a la fecha actual.");
      resetSearchResults(setItems, setTotal, setSearched);
      return;
    }

    if (form.fechaFin <= form.fechaInicio) {
      setError("La fecha de salida debe ser posterior a la fecha de entrada.");
      resetSearchResults(setItems, setTotal, setSearched);
      return;
    }

    const adultos = parsePositiveInteger(form.numAdultos);
    if (adultos === null || Number.isNaN(adultos)) {
      setError("Ingresa un número válido de adultos (mínimo 1).");
      resetSearchResults(setItems, setTotal, setSearched);
      return;
    }

    const habitaciones = parsePositiveInteger(form.numHabitaciones);
    if (habitaciones === null || Number.isNaN(habitaciones)) {
      setError("Ingresa un número válido de habitaciones (mínimo 1).");
      resetSearchResults(setItems, setTotal, setSearched);
      return;
    }

    if (form.numNinos !== "") {
      const ninos = parseNonNegativeInteger(form.numNinos);
      if (ninos === null || Number.isNaN(ninos)) {
        setError("Ingresa un número válido de niños.");
        resetSearchResults(setItems, setTotal, setSearched);
        return;
      }
      if (ninos < 0) {
        setError("El número de niños no puede ser negativo.");
        resetSearchResults(setItems, setTotal, setSearched);
        return;
      }
    }

    setLoading(true);
    searchInFlightRef.current = true;
    setError("");
    setSearched(true);

    const searchPayload = {
      ...form,
      numAdultos: adultos,
      numHabitaciones: habitaciones,
      numNinos: form.numNinos === "" ? undefined : form.numNinos,
    };
    const searchKey = buildSearchKey(searchPayload);

    if (
      lastSearchRef.current.key === searchKey &&
      now - lastSearchRef.current.at < DUPLICATE_SEARCH_WINDOW_MS
    ) {
      searchInFlightRef.current = false;
      setLoading(false);
      return;
    }

    lastSearchRef.current = { key: searchKey, at: now };
    requestCooldownUntilRef.current = Date.now() + SEARCH_REQUEST_COOLDOWN_MS;

    try {
      const response = await searchAccommodations(searchPayload);
      const items = Array.isArray(response?.items) ? response.items : [];
      setItems(items);
      setTotal(Number(response?.totalResultados ?? response?.total ?? items.length));
    } catch (err) {
      if (err?.response?.status === 429) {
        const cooldownMs = getRateLimitCooldownMs(err);
        const seconds = Math.ceil(cooldownMs / 1000);
        rateLimitedUntilRef.current = Date.now() + cooldownMs;
        setError(
          `El servidor está limitando temporalmente las búsquedas. Espera ${seconds} segundos e intenta nuevamente.`
        );
        if (items.length === 0) {
          setSearched(false);
          setTotal(0);
        }
      } else {
        setItems([]);
        setTotal(0);
        setError(err?.response?.data?.message || "No se pudo buscar alojamientos.");
      }
    } finally {
      searchInFlightRef.current = false;
      setLoading(false);
    }
  };

  const openDetail = (item) => {
    const id = item.sucursalGuid ?? item.id ?? item.slug;
    if (!id) return;

    setPropiedad(item);
    setFechas(form.fechaInicio, form.fechaFin);
    setHuespedes(
      parsePositiveInteger(form.numAdultos) ?? 1,
      parsePositiveInteger(form.numHabitaciones) ?? 1,
      getOptionalChildrenCount(form.numNinos)
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
            <Text style={styles.eyebrow}>Reserva móvil</Text>
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
                  <MinimalDateInput
                    value={form.fechaInicio}
                    onChange={handleFechaInicioChange}
                    minDate={todayIso}
                  />
                </View>
                <View style={styles.rowItem}>
                  <Text style={styles.label}>Salida</Text>
                  <MinimalDateInput
                    value={form.fechaFin}
                    onChange={handleFechaFinChange}
                    minDate={salidaMinDate}
                  />
                </View>
              </View>

              <View style={styles.row}>
                <View style={styles.rowItem}>
                  <Text style={styles.label}>Adultos</Text>
                  <TextInput
                    value={form.numAdultos}
                    onChangeText={(value) => updateNumericField("numAdultos", value)}
                    keyboardType="number-pad"
                    inputMode="numeric"
                    style={styles.input}
                  />
                </View>
                <View style={styles.rowItem}>
                  <Text style={styles.label}>Niños</Text>
                  <TextInput
                    value={form.numNinos}
                    onChangeText={(value) => updateNumericField("numNinos", value)}
                    keyboardType="number-pad"
                    inputMode="numeric"
                    placeholder="0"
                    style={styles.input}
                  />
                </View>
              </View>

              {error ? <Text style={styles.error}>{error}</Text> : null}

              <Pressable
                style={[styles.primaryButton, loading && styles.primaryButtonDisabled]}
                onPress={handleSearch}
                disabled={loading}
              >
                <Text style={styles.primaryButtonText}>
                  {loading ? "Buscando..." : "Buscar"}
                </Text>
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
                <Text style={styles.muted}>{formatLocation(item) || "Ubicación no disponible"}</Text>
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
            <Text style={styles.empty}>No hay resultados para esta búsqueda.</Text>
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
    backgroundColor: colors.noticeBg,
    borderWidth: 1,
    borderColor: colors.noticeBorder,
    borderRadius: 8,
    padding: 12,
  },
  configWarningText: {
    color: colors.warningText,
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
    backgroundColor: colors.surface,
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
  primaryButtonDisabled: {
    opacity: 0.65,
  },
  primaryButtonText: {
    color: colors.onPrimary,
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
    backgroundColor: colors.badgeBg,
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
    backgroundColor: colors.nav,
    color: colors.onPrimary,
    paddingHorizontal: 10,
    paddingVertical: 5,
    fontWeight: "800",
  },
  price: {
    color: colors.text,
    fontWeight: "800",
  },
  empty: {
    marginTop: 24,
    color: colors.muted,
    textAlign: "center",
  },
});

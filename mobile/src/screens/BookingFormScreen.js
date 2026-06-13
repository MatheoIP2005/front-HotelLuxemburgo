import { useEffect, useState } from "react";
import {
  KeyboardAvoidingView,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from "react-native";
import { useBooking } from "../context/BookingContext";
import {
  IDENTIFICATION_TYPE_OPTIONS,
  MAX_LENGTHS,
  normalizeTipoIdentificacion,
} from "../utils/constraints";
import {
  mapClienteErrorsToPublic,
  resolvePublicClienteFieldUpdate,
  toClienteFormFromPublic,
  validateClienteForm,
} from "../utils/clientes";
import { colors, shadow } from "../styles/theme";

export default function BookingFormScreen({ navigation }) {
  const { bookingData, setCliente } = useBooking();
  const [form, setForm] = useState({
    tipo_identificacion: "CED",
    numero_identificacion: "",
    nombres: "",
    apellidos: "",
    correo: "",
    telefono: "",
    direccion: "",
  });
  const [fieldErrors, setFieldErrors] = useState({});
  const [error, setError] = useState("");

  useEffect(() => {
    if (!bookingData.habitacion) {
      navigation.replace("Search");
    }
  }, [bookingData.habitacion, navigation]);

  const handleChange = (name, value) => {
    setForm((prev) => resolvePublicClienteFieldUpdate(prev, name, value));
    setFieldErrors((prev) => ({ ...prev, [name]: "" }));
    setError("");
  };

  const continueToPayment = () => {
    const errors = mapClienteErrorsToPublic(validateClienteForm(toClienteFormFromPublic(form)));
    setFieldErrors(errors);
    if (Object.keys(errors).length) {
      setError("Revisa los campos marcados.");
      return;
    }

    const tipoIdentificacion = normalizeTipoIdentificacion(form.tipo_identificacion);
    const payload = toClienteFormFromPublic(form);

    setError("");
    setCliente({
      ...form,
      tipo_identificacion: tipoIdentificacion,
      numero_identificacion:
        tipoIdentificacion === "PAS"
          ? payload.numeroIdentificacion.toUpperCase()
          : payload.numeroIdentificacion.trim(),
      nombres: payload.nombres.trim(),
      apellidos: payload.apellidos.trim(),
      correo: payload.correo.trim(),
      telefono: payload.telefono.trim(),
      direccion: payload.direccion.trim(),
    });
    navigation.navigate("Payment");
  };

  return (
    <KeyboardAvoidingView
      style={styles.flex}
      behavior={Platform.OS === "ios" ? "padding" : undefined}
    >
      <ScrollView contentContainerStyle={styles.page}>
        <View style={styles.summary}>
          <Text style={styles.summaryTitle}>Resumen de tu reserva</Text>
          <Row label="Propiedad" value={bookingData.propiedad?.nombre || "-"} />
          <Row label="Habitación" value={bookingData.habitacion?.nombre || "-"} />
          <Row
            label="Fechas"
            value={`${bookingData.fechaEntrada || "-"} - ${bookingData.fechaSalida || "-"}`}
          />
          <View style={styles.totalRow}>
            <Text style={styles.totalLabel}>Precio total</Text>
            <Text style={styles.totalValue}>{bookingData.precioTotal || 0}</Text>
          </View>
        </View>

        <View style={styles.card}>
          <Text style={styles.title}>Tus datos personales</Text>

          <Text style={styles.label}>Tipo de identificación</Text>
          <View style={styles.segment}>
            {IDENTIFICATION_TYPE_OPTIONS.map((option) => (
              <Pressable
                key={option.value}
                style={[
                  styles.segmentItem,
                  form.tipo_identificacion === option.value && styles.segmentItemActive,
                ]}
                onPress={() => handleChange("tipo_identificacion", option.value)}
              >
                <Text
                  style={[
                    styles.segmentText,
                    form.tipo_identificacion === option.value && styles.segmentTextActive,
                  ]}
                >
                  {option.label}
                </Text>
              </Pressable>
            ))}
          </View>

          <Field
            label="Número de identificación"
            value={form.numero_identificacion}
            onChangeText={(value) => handleChange("numero_identificacion", value)}
            keyboardType={
              normalizeTipoIdentificacion(form.tipo_identificacion) === "PAS"
                ? "default"
                : "number-pad"
            }
            autoCapitalize={
              normalizeTipoIdentificacion(form.tipo_identificacion) === "PAS"
                ? "characters"
                : "none"
            }
            maxLength={MAX_LENGTHS.cliente.numeroIdentificacion}
            error={fieldErrors.numero_identificacion}
          />
          <Field
            label="Nombres"
            value={form.nombres}
            onChangeText={(value) => handleChange("nombres", value)}
            maxLength={MAX_LENGTHS.cliente.nombres}
            error={fieldErrors.nombres}
          />
          <Field
            label="Apellidos"
            value={form.apellidos}
            onChangeText={(value) => handleChange("apellidos", value)}
            maxLength={MAX_LENGTHS.cliente.apellidos}
            error={fieldErrors.apellidos}
          />
          <Field
            label="Correo"
            value={form.correo}
            onChangeText={(value) => handleChange("correo", value)}
            keyboardType="email-address"
            autoCapitalize="none"
            maxLength={MAX_LENGTHS.cliente.correo}
            error={fieldErrors.correo}
          />
          <Field
            label="Teléfono"
            value={form.telefono}
            onChangeText={(value) => handleChange("telefono", value)}
            keyboardType="number-pad"
            maxLength={MAX_LENGTHS.cliente.telefono}
            error={fieldErrors.telefono}
          />
          <Field
            label="Dirección"
            value={form.direccion}
            onChangeText={(value) => handleChange("direccion", value)}
            maxLength={MAX_LENGTHS.cliente.direccion}
            error={fieldErrors.direccion}
          />

          {error ? <Text style={styles.error}>{error}</Text> : null}

          <Pressable style={styles.primaryButton} onPress={continueToPayment}>
            <Text style={styles.primaryButtonText}>Continuar al pago</Text>
          </Pressable>
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
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

function Field({ label, error, ...props }) {
  return (
    <View style={styles.field}>
      <Text style={styles.label}>{label}</Text>
      <TextInput
        style={[styles.input, error && styles.inputError]}
        placeholder={label}
        placeholderTextColor={colors.mutedLight}
        {...props}
      />
      {error ? <Text style={styles.fieldError}>{error}</Text> : null}
    </View>
  );
}

const styles = StyleSheet.create({
  flex: {
    flex: 1,
    backgroundColor: colors.background,
  },
  page: {
    padding: 16,
    paddingBottom: 32,
    gap: 14,
  },
  summary: {
    backgroundColor: colors.surface,
    borderRadius: 8,
    padding: 16,
    gap: 8,
    ...shadow,
  },
  summaryTitle: {
    color: colors.text,
    fontSize: 18,
    fontWeight: "800",
    marginBottom: 4,
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
  totalValue: {
    color: colors.text,
    fontWeight: "800",
  },
  muted: {
    color: colors.muted,
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
  field: {
    gap: 6,
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
  inputError: {
    borderColor: colors.danger,
  },
  fieldError: {
    color: colors.danger,
    fontSize: 12,
    fontWeight: "600",
  },
  segment: {
    flexDirection: "row",
    gap: 8,
  },
  segmentItem: {
    flex: 1,
    minHeight: 42,
    alignItems: "center",
    justifyContent: "center",
    borderRadius: 8,
    borderWidth: 1,
    borderColor: colors.border,
    backgroundColor: colors.surface,
  },
  segmentItemActive: {
    backgroundColor: colors.primary,
    borderColor: colors.primary,
  },
  segmentText: {
    color: colors.text,
    fontWeight: "800",
  },
  segmentTextActive: {
    color: colors.onPrimary,
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
  primaryButtonText: {
    color: colors.onPrimary,
    fontWeight: "800",
    fontSize: 16,
  },
});

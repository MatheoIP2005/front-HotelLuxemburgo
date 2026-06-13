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
import { colors, shadow } from "../styles/theme";

const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

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
  const [error, setError] = useState("");

  useEffect(() => {
    if (!bookingData.habitacion) {
      navigation.replace("Search");
    }
  }, [bookingData.habitacion, navigation]);

  const updateField = (name, value) => {
    setForm((prev) => ({ ...prev, [name]: value }));
  };

  const validate = () => {
    const required = [
      "numero_identificacion",
      "nombres",
      "apellidos",
      "correo",
      "telefono",
      "direccion",
    ];

    if (required.some((key) => !String(form[key] || "").trim())) {
      return "Completa todos los campos para continuar.";
    }

    if (form.tipo_identificacion === "CED" && !/^\d{10}$/.test(form.numero_identificacion)) {
      return "La cedula debe tener 10 digitos.";
    }

    if (form.tipo_identificacion === "RUC" && !/^\d{13}$/.test(form.numero_identificacion)) {
      return "El RUC debe tener 13 digitos.";
    }

    if (!emailRegex.test(form.correo.trim())) {
      return "Ingresa un correo valido.";
    }

    if (!/^\d{10}$/.test(form.telefono.trim())) {
      return "El telefono debe tener 10 digitos.";
    }

    return "";
  };

  const continueToPayment = () => {
    const validationError = validate();
    if (validationError) {
      setError(validationError);
      return;
    }

    setError("");
    setCliente({
      ...form,
      numero_identificacion: form.numero_identificacion.trim(),
      nombres: form.nombres.trim(),
      apellidos: form.apellidos.trim(),
      correo: form.correo.trim(),
      telefono: form.telefono.trim(),
      direccion: form.direccion.trim(),
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
          <Text style={styles.summaryTitle}>Resumen</Text>
          <Text style={styles.muted}>{bookingData.propiedad?.nombre || "-"}</Text>
          <Text style={styles.muted}>{bookingData.habitacion?.nombre || "-"}</Text>
          <Text style={styles.muted}>
            {bookingData.fechaEntrada || "-"} / {bookingData.fechaSalida || "-"}
          </Text>
        </View>

        <View style={styles.card}>
          <Text style={styles.title}>Datos personales</Text>

          <Text style={styles.label}>Tipo de identificacion</Text>
          <View style={styles.segment}>
            {["CED", "RUC", "PAS"].map((option) => (
              <Pressable
                key={option}
                style={[
                  styles.segmentItem,
                  form.tipo_identificacion === option && styles.segmentItemActive,
                ]}
                onPress={() => updateField("tipo_identificacion", option)}
              >
                <Text
                  style={[
                    styles.segmentText,
                    form.tipo_identificacion === option && styles.segmentTextActive,
                  ]}
                >
                  {option}
                </Text>
              </Pressable>
            ))}
          </View>

          <Field
            label="Numero de identificacion"
            value={form.numero_identificacion}
            onChangeText={(value) => updateField("numero_identificacion", value)}
            keyboardType={form.tipo_identificacion === "PAS" ? "default" : "number-pad"}
          />
          <Field
            label="Nombres"
            value={form.nombres}
            onChangeText={(value) => updateField("nombres", value)}
          />
          <Field
            label="Apellidos"
            value={form.apellidos}
            onChangeText={(value) => updateField("apellidos", value)}
          />
          <Field
            label="Correo"
            value={form.correo}
            onChangeText={(value) => updateField("correo", value)}
            keyboardType="email-address"
            autoCapitalize="none"
          />
          <Field
            label="Telefono"
            value={form.telefono}
            onChangeText={(value) => updateField("telefono", value)}
            keyboardType="number-pad"
          />
          <Field
            label="Direccion"
            value={form.direccion}
            onChangeText={(value) => updateField("direccion", value)}
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

function Field({ label, ...props }) {
  return (
    <View style={styles.field}>
      <Text style={styles.label}>{label}</Text>
      <TextInput style={styles.input} placeholder={label} {...props} />
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
    gap: 6,
    ...shadow,
  },
  summaryTitle: {
    color: colors.text,
    fontSize: 18,
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
    backgroundColor: "#fff",
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
    backgroundColor: "#fff",
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
    color: "#fff",
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
    color: "#fff",
    fontWeight: "800",
    fontSize: 16,
  },
});

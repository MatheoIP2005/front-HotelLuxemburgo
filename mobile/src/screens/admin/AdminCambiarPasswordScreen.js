import { useState } from "react";
import { Alert, StyleSheet, Text } from "react-native";
import AdminFormScreen from "../../components/admin/AdminFormScreen";
import FormField from "../../components/admin/FormField";
import useRequireAuth from "../../hooks/useRequireAuth";
import { cambiarPassword } from "../../services/auth.service";
import { extractApiErrorMessage } from "../../../../src/shared/utils/api";
import { FORM_VALIDATION_BANNER } from "../../utils/adminCollection";
import { colors } from "../../styles/theme";

const EMPTY_FORM = {
  passwordActual: "",
  passwordNuevo: "",
  confirmarPassword: "",
};

export default function AdminCambiarPasswordScreen({ navigation }) {
  const { bootstrapping, isAuthenticated } = useRequireAuth(navigation);
  const [form, setForm] = useState(EMPTY_FORM);
  const [fieldErrors, setFieldErrors] = useState({});
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  const setField = (key, value) => setForm((prev) => ({ ...prev, [key]: value }));

  const validate = () => {
    const errors = {};
    if (!form.passwordActual.trim()) {
      errors.passwordActual = "La contraseña actual es obligatoria.";
    }
    if (!form.passwordNuevo.trim()) {
      errors.passwordNuevo = "La nueva contraseña es obligatoria.";
    } else if (form.passwordNuevo.length > 200) {
      errors.passwordNuevo = "La nueva contraseña no puede exceder 200 caracteres.";
    }
    if (form.passwordNuevo !== form.confirmarPassword) {
      errors.confirmarPassword = "La confirmación no coincide.";
    }
    return errors;
  };

  const onSubmit = async () => {
    const errors = validate();
    setFieldErrors(errors);
    if (Object.keys(errors).length) {
      setError(FORM_VALIDATION_BANNER);
      return;
    }

    setSaving(true);
    setError("");
    try {
      await cambiarPassword({
        passwordActual: form.passwordActual.trim(),
        passwordNuevo: form.passwordNuevo.trim(),
      });
      setForm(EMPTY_FORM);
      setFieldErrors({});
      Alert.alert("Contraseña", "Contraseña actualizada correctamente.");
    } catch (err) {
      setError(extractApiErrorMessage(err, "No se pudo cambiar la contraseña."));
    } finally {
      setSaving(false);
    }
  };

  if (bootstrapping || !isAuthenticated) {
    return null;
  }

  return (
    <AdminFormScreen
      title="Cambiar contraseña"
      subtitle="Actualiza la contraseña del usuario autenticado."
      onSubmit={onSubmit}
      onCancel={() => navigation.goBack()}
      saving={saving}
      error={error}
      submitLabel="Actualizar contraseña"
    >
      <Text style={styles.hint}>
        La contraseña no se almacena en el dispositivo; solo se envía al servicio de auth.
      </Text>

      <FormField
        label="Contraseña actual"
        value={form.passwordActual}
        onChangeText={(value) => setField("passwordActual", value)}
        secureTextEntry
        autoCapitalize="none"
        autoCorrect={false}
        textContentType="password"
        maxLength={200}
        error={fieldErrors.passwordActual}
      />
      <FormField
        label="Nueva contraseña"
        value={form.passwordNuevo}
        onChangeText={(value) => setField("passwordNuevo", value)}
        secureTextEntry
        autoCapitalize="none"
        autoCorrect={false}
        textContentType="password"
        maxLength={200}
        error={fieldErrors.passwordNuevo}
      />
      <FormField
        label="Confirmar nueva contraseña"
        value={form.confirmarPassword}
        onChangeText={(value) => setField("confirmarPassword", value)}
        secureTextEntry
        autoCapitalize="none"
        autoCorrect={false}
        textContentType="password"
        maxLength={200}
        error={fieldErrors.confirmarPassword}
      />
    </AdminFormScreen>
  );
}

const styles = StyleSheet.create({
  error: { color: colors.danger, fontWeight: "600" },
  hint: { color: colors.muted, fontSize: 13, marginBottom: 4 },
});

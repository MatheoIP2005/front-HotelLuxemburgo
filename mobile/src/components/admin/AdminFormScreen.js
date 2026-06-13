import {
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from "react-native";
import { colors, shadow } from "../../styles/theme";

export default function AdminFormScreen({
  title,
  subtitle,
  children,
  submitLabel = "Guardar",
  cancelLabel = "Cancelar",
  onSubmit,
  onCancel,
  loading = false,
  saving = false,
  error = "",
}) {
  if (loading) {
    return (
      <View style={styles.loadingWrap}>
        <ActivityIndicator color={colors.primary} size="large" />
        <Text style={styles.loadingText}>Cargando...</Text>
      </View>
    );
  }

  const isBusy = saving;

  return (
    <KeyboardAvoidingView
      style={styles.flex}
      behavior={Platform.OS === "ios" ? "padding" : undefined}
    >
      <ScrollView contentContainerStyle={styles.content}>
        {title ? <Text style={styles.title}>{title}</Text> : null}
        {subtitle ? <Text style={styles.subtitle}>{subtitle}</Text> : null}
        {error ? <Text style={styles.error}>{error}</Text> : null}
        <View style={styles.card}>{children}</View>
        {(onCancel || onSubmit) && (
          <View style={styles.actions}>
            {onCancel ? (
              <Pressable
                style={[styles.cancelButton, isBusy && styles.disabled]}
                disabled={isBusy}
                onPress={onCancel}
              >
                <Text style={styles.cancelText}>{cancelLabel}</Text>
              </Pressable>
            ) : null}
            {onSubmit ? (
              <Pressable
                style={[styles.submitButton, isBusy && styles.disabled]}
                disabled={isBusy}
                onPress={onSubmit}
              >
                <Text style={styles.submitText}>
                  {isBusy ? "Guardando..." : submitLabel}
                </Text>
              </Pressable>
            ) : null}
          </View>
        )}
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  flex: {
    flex: 1,
    backgroundColor: colors.background,
  },
  loadingWrap: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    gap: 12,
    backgroundColor: colors.background,
  },
  loadingText: {
    color: colors.muted,
    fontWeight: "600",
  },
  content: {
    padding: 16,
    paddingBottom: 32,
    gap: 14,
  },
  title: {
    color: colors.text,
    fontSize: 24,
    fontWeight: "800",
  },
  subtitle: {
    color: colors.muted,
  },
  error: {
    color: colors.danger,
    fontWeight: "600",
  },
  card: {
    backgroundColor: colors.surface,
    borderRadius: 8,
    padding: 16,
    gap: 12,
    ...shadow,
  },
  actions: {
    gap: 10,
  },
  cancelButton: {
    minHeight: 48,
    borderRadius: 8,
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 1,
    borderColor: colors.border,
    backgroundColor: "#fff",
  },
  cancelText: {
    color: colors.text,
    fontWeight: "800",
    fontSize: 16,
  },
  submitButton: {
    minHeight: 48,
    borderRadius: 8,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: colors.primary,
  },
  disabled: {
    opacity: 0.7,
  },
  submitText: {
    color: "#fff",
    fontWeight: "800",
    fontSize: 16,
  },
});

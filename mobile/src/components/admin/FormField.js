import { StyleSheet, Text, TextInput, View } from "react-native";
import { colors } from "../../styles/theme";

const INPUT_MODE_BY_KEYBOARD = {
  "decimal-pad": "decimal",
  "number-pad": "numeric",
  numeric: "numeric",
  "phone-pad": "tel",
  "email-address": "email",
};

export default function FormField({
  label,
  value,
  onChangeText,
  placeholder,
  keyboardType,
  inputMode,
  multiline = false,
  secureTextEntry = false,
  autoCapitalize = "sentences",
  autoCorrect,
  autoComplete,
  textContentType,
  returnKeyType,
  maxLength,
  editable = true,
  disabled = false,
  error = "",
  helpText = "",
  onBlur,
  accessibilityLabel,
  accessibilityHint,
}) {
  const isDisabled = disabled || editable === false;
  const resolvedValue = value == null ? "" : String(value);
  const hasError = Boolean(error);
  const resolvedInputMode = inputMode ?? INPUT_MODE_BY_KEYBOARD[keyboardType];
  const resolvedAccessibilityLabel = accessibilityLabel || label || placeholder || "Campo";
  const resolvedAccessibilityHint =
    accessibilityHint || helpText || (hasError ? error : undefined);

  const showMeta = Boolean(helpText) || typeof maxLength === "number";

  return (
    <View style={styles.field}>
      {label ? <Text style={styles.label}>{label}</Text> : null}

      <TextInput
        style={[
          styles.input,
          multiline && styles.multiline,
          isDisabled && styles.inputDisabled,
          hasError && styles.inputError,
        ]}
        value={resolvedValue}
        onChangeText={onChangeText}
        onBlur={onBlur}
        placeholder={placeholder}
        placeholderTextColor={colors.mutedLight}
        keyboardType={keyboardType}
        inputMode={resolvedInputMode}
        multiline={multiline}
        secureTextEntry={secureTextEntry}
        autoCapitalize={autoCapitalize}
        autoCorrect={autoCorrect}
        autoComplete={autoComplete}
        textContentType={textContentType}
        returnKeyType={returnKeyType}
        maxLength={maxLength}
        editable={!isDisabled}
        accessibilityLabel={resolvedAccessibilityLabel}
        accessibilityHint={resolvedAccessibilityHint}
        accessibilityState={{ disabled: isDisabled }}
      />

      {showMeta ? (
        <View style={styles.metaRow}>
          {helpText ? (
            <Text style={styles.helpText} accessibilityRole="text">
              {helpText}
            </Text>
          ) : (
            <View style={styles.metaSpacer} />
          )}
          {typeof maxLength === "number" ? (
            <Text style={styles.counter} accessibilityRole="text">
              {resolvedValue.length}/{maxLength}
            </Text>
          ) : null}
        </View>
      ) : null}

      {hasError ? (
        <Text style={styles.error} accessibilityRole="alert">
          {error}
        </Text>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
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
    paddingVertical: 10,
    backgroundColor: colors.surface,
    color: colors.text,
  },
  multiline: {
    minHeight: 96,
    paddingTop: 12,
    textAlignVertical: "top",
  },
  inputDisabled: {
    backgroundColor: colors.background,
    color: colors.muted,
  },
  inputError: {
    borderColor: colors.danger,
  },
  metaRow: {
    flexDirection: "row",
    alignItems: "flex-start",
    justifyContent: "space-between",
    gap: 12,
  },
  metaSpacer: {
    flex: 1,
  },
  helpText: {
    flex: 1,
    color: colors.muted,
    fontSize: 12,
  },
  counter: {
    color: colors.mutedLight,
    fontSize: 12,
    fontWeight: "600",
  },
  error: {
    color: colors.danger,
    fontSize: 12,
    fontWeight: "600",
  },
});

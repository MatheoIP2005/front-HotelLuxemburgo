import { StyleSheet, Text, View } from "react-native";
import MinimalDateInput from "../public/MinimalDateInput";
import { colors } from "../../styles/theme";

export default function DateField({
  label,
  value,
  onChange,
  minDate,
  maxDate,
  error = "",
}) {
  return (
    <View style={styles.field}>
      {label ? <Text style={styles.label}>{label}</Text> : null}
      <MinimalDateInput
        value={value}
        onChange={onChange}
        minDate={minDate}
        maxDate={maxDate}
        hasError={Boolean(error)}
      />
      {error ? <Text style={styles.error}>{error}</Text> : null}
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
  error: {
    color: colors.danger,
    fontSize: 12,
    fontWeight: "600",
  },
});

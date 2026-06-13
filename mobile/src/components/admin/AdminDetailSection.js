import { StyleSheet, Text, View } from "react-native";
import { colors, shadow } from "../../styles/theme";

export default function AdminDetailSection({ title, children }) {
  return (
    <View style={styles.section}>
      {title ? <Text style={styles.title}>{title}</Text> : null}
      {children}
    </View>
  );
}

export function AdminDetailRow({ label, value }) {
  return (
    <View style={styles.row}>
      <Text style={styles.label}>{label}</Text>
      <Text style={styles.value}>{value ?? "-"}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  section: {
    backgroundColor: colors.surface,
    borderRadius: 8,
    padding: 16,
    gap: 10,
    ...shadow,
  },
  title: {
    color: colors.text,
    fontSize: 18,
    fontWeight: "800",
  },
  row: {
    flexDirection: "row",
    justifyContent: "space-between",
    gap: 12,
    alignItems: "flex-start",
  },
  label: {
    color: colors.muted,
    fontWeight: "700",
    flexShrink: 0,
    maxWidth: "45%",
  },
  value: {
    flex: 1,
    color: colors.text,
    textAlign: "right",
    fontWeight: "700",
    flexShrink: 1,
  },
});

import { StyleSheet, Text, View } from "react-native";
import { colors } from "../../styles/theme";

export default function EmptyState({ title = "Sin registros", message = "" }) {
  return (
    <View style={styles.container}>
      <Text style={styles.title}>{title}</Text>
      {message ? <Text style={styles.message}>{message}</Text> : null}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    padding: 24,
    alignItems: "center",
    gap: 8,
  },
  title: {
    color: colors.text,
    fontWeight: "800",
    fontSize: 16,
  },
  message: {
    color: colors.muted,
    textAlign: "center",
  },
});

import { Pressable, StyleSheet, Text, View } from "react-native";
import { colors } from "../../styles/theme";

export default function ErrorState({ message, onRetry }) {
  return (
    <View style={styles.container}>
      <Text style={styles.message}>{message || "Ocurrió un error."}</Text>
      {onRetry ? (
        <Pressable style={styles.button} onPress={onRetry}>
          <Text style={styles.buttonText}>Reintentar</Text>
        </Pressable>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    padding: 24,
    alignItems: "center",
    gap: 12,
  },
  message: {
    color: colors.danger,
    fontWeight: "700",
    textAlign: "center",
  },
  button: {
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 8,
    backgroundColor: colors.primary,
  },
  buttonText: {
    color: colors.onPrimary,
    fontWeight: "800",
  },
});

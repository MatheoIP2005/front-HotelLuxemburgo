import { ActivityIndicator, StyleSheet, Text, View } from "react-native";
import { colors } from "../../styles/theme";

export default function LoadingState({ message = "Cargando..." }) {
  return (
    <View style={styles.container}>
      <ActivityIndicator color={colors.primary} size="large" />
      <Text style={styles.message}>{message}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    gap: 12,
    padding: 24,
    backgroundColor: colors.background,
  },
  message: {
    color: colors.muted,
    fontWeight: "600",
  },
});

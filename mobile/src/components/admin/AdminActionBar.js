import { Pressable, StyleSheet, Text, View } from "react-native";
import { colors } from "../../styles/theme";

export default function AdminActionBar({ actions = [] }) {
  if (!actions.length) return null;

  return (
    <View style={styles.bar}>
      {actions.map((action) => (
        <Pressable
          key={action.label}
          style={[
            styles.button,
            action.variant === "danger" && styles.dangerButton,
            action.disabled && styles.disabled,
          ]}
          disabled={action.disabled}
          onPress={action.onPress}
        >
          <Text style={styles.buttonText}>{action.label}</Text>
        </Pressable>
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  bar: {
    gap: 10,
  },
  button: {
    minHeight: 48,
    borderRadius: 8,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: colors.primary,
  },
  dangerButton: {
    backgroundColor: colors.danger,
  },
  disabled: {
    opacity: 0.6,
  },
  buttonText: {
    color: colors.onPrimary,
    fontWeight: "800",
  },
});

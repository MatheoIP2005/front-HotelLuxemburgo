import { Pressable, StyleSheet, Text, View } from "react-native";
import { colors, shadow } from "../../styles/theme";

export default function AdminListCard({ title, subtitle, badge, meta, onPress, actions = [] }) {
  return (
    <View style={styles.card}>
      <Pressable onPress={onPress} disabled={!onPress}>
        <View style={styles.header}>
          <Text style={styles.title} numberOfLines={2}>
            {title}
          </Text>
          {badge ? (
            <Text style={styles.badge} numberOfLines={1}>
              {badge}
            </Text>
          ) : null}
        </View>
        {subtitle ? (
          <Text style={styles.subtitle} numberOfLines={2}>
            {subtitle}
          </Text>
        ) : null}
        {meta ? (
          <Text style={styles.meta} numberOfLines={2}>
            {meta}
          </Text>
        ) : null}
        {onPress ? <Text style={styles.link}>Editar</Text> : null}
      </Pressable>
      {actions.length > 0 ? (
        <View style={styles.actions}>
          {actions.map((action) => (
            <Pressable
              key={action.label}
              style={[
                styles.actionButton,
                action.variant === "danger" && styles.danger,
                action.variant === "warning" && styles.warning,
              ]}
              onPress={action.onPress}
            >
              <Text style={styles.actionText}>{action.label}</Text>
            </Pressable>
          ))}
        </View>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: colors.surface,
    borderRadius: 8,
    padding: 14,
    marginBottom: 12,
    gap: 10,
    ...shadow,
  },
  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    gap: 8,
  },
  title: {
    flex: 1,
    flexShrink: 1,
    color: colors.text,
    fontWeight: "800",
    fontSize: 16,
  },
  badge: {
    flexShrink: 0,
    maxWidth: "40%",
    borderRadius: 6,
    backgroundColor: "#e2e8f0",
    color: colors.text,
    paddingHorizontal: 8,
    paddingVertical: 4,
    fontWeight: "800",
    overflow: "hidden",
  },
  subtitle: {
    color: colors.muted,
    flexShrink: 1,
  },
  meta: {
    color: colors.primaryDark,
    fontWeight: "700",
    flexShrink: 1,
  },
  link: {
    color: colors.primary,
    fontWeight: "700",
    marginTop: 4,
  },
  actions: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 8,
  },
  actionButton: {
    borderRadius: 6,
    backgroundColor: colors.primary,
    paddingHorizontal: 10,
    paddingVertical: 8,
  },
  danger: {
    backgroundColor: colors.danger,
  },
  warning: {
    backgroundColor: colors.warning,
  },
  actionText: {
    color: "#fff",
    fontWeight: "700",
    fontSize: 12,
  },
});

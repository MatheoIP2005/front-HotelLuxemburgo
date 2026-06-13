import { Pressable, ScrollView, StyleSheet, Text, View } from "react-native";
import { colors } from "../../styles/theme";

export default function ScrollSelectField({
  label,
  value,
  options = [],
  onChange,
  maxHeight = 160,
  emptyLabel = "Sin opciones",
}) {
  return (
    <View style={styles.field}>
      {label ? <Text style={styles.label}>{label}</Text> : null}
      <ScrollView style={[styles.list, { maxHeight }]} nestedScrollEnabled>
        {options.length === 0 ? (
          <Text style={styles.empty}>{emptyLabel}</Text>
        ) : (
          options.map((option) => {
            const selected = option.value === value;
            return (
              <Pressable
                key={String(option.value)}
                style={[styles.option, selected && styles.optionSelected]}
                onPress={() => onChange?.(option.value)}
              >
                <Text style={[styles.optionText, selected && styles.optionTextSelected]}>
                  {option.label}
                </Text>
              </Pressable>
            );
          })
        )}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  field: { gap: 8 },
  label: { color: colors.text, fontWeight: "700" },
  list: {
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: 8,
    backgroundColor: "#fff",
  },
  empty: { padding: 12, color: colors.muted },
  option: {
    paddingHorizontal: 12,
    paddingVertical: 10,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  optionSelected: { backgroundColor: colors.primary },
  optionText: { color: colors.text, fontWeight: "600" },
  optionTextSelected: { color: "#fff" },
});

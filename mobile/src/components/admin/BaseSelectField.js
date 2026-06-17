import { useMemo, useState } from "react";
import {
  FlatList,
  Modal,
  Pressable,
  StyleSheet,
  Text,
  TextInput,
  View,
} from "react-native";
import { colors } from "../../styles/theme";

const SEARCH_THRESHOLD = 8;
const DEFAULT_LIST_MAX_HEIGHT = 360;

const isEmptyValue = (value) => value === "" || value == null;

export const isPlaceholderOption = (option, emptyOptionIsPlaceholder) => {
  if (!option || !isEmptyValue(option.value)) return false;
  if (typeof emptyOptionIsPlaceholder === "function") {
    return emptyOptionIsPlaceholder(option);
  }
  if (typeof emptyOptionIsPlaceholder === "boolean") {
    return emptyOptionIsPlaceholder;
  }
  return /^seleccionar/i.test(String(option.label ?? "").trim());
};

export default function BaseSelectField({
  label,
  value,
  options = [],
  onChange,
  placeholder = "Seleccionar",
  error = "",
  disabled = false,
  emptyLabel = "Sin opciones",
  searchable = false,
  emptyOptionIsPlaceholder,
  maxHeight,
}) {
  const [isOpen, setIsOpen] = useState(false);
  const [query, setQuery] = useState("");

  const selectableOptions = useMemo(
    () =>
      options
        .filter(Boolean)
        .filter((option) => !isPlaceholderOption(option, emptyOptionIsPlaceholder)),
    [options, emptyOptionIsPlaceholder]
  );

  const selectedOption = useMemo(
    () => options.find((option) => option.value === value),
    [options, value]
  );

  const showSearch = searchable && selectableOptions.length >= SEARCH_THRESHOLD;

  const filteredOptions = useMemo(() => {
    if (!showSearch || !query.trim()) return selectableOptions;
    const normalized = query.trim().toLowerCase();
    return selectableOptions.filter((option) =>
      String(option.label ?? "").toLowerCase().includes(normalized)
    );
  }, [selectableOptions, query, showSearch]);

  const displayText = selectedOption?.label || placeholder;
  const hasValue = useMemo(() => {
    if (!selectedOption) return false;
    if (isEmptyValue(value)) {
      return !isPlaceholderOption(selectedOption, emptyOptionIsPlaceholder);
    }
    return true;
  }, [value, selectedOption, emptyOptionIsPlaceholder]);

  const listStyle = useMemo(
    () => [
      styles.list,
      { maxHeight: maxHeight ?? DEFAULT_LIST_MAX_HEIGHT },
    ],
    [maxHeight]
  );

  const openModal = () => {
    if (disabled) return;
    setQuery("");
    setIsOpen(true);
  };

  const closeModal = () => {
    setIsOpen(false);
    setQuery("");
  };

  const handleSelect = (nextValue) => {
    onChange?.(nextValue);
    closeModal();
  };

  return (
    <View style={styles.field}>
      {label ? <Text style={styles.label}>{label}</Text> : null}

      <Pressable
        style={[
          styles.trigger,
          disabled && styles.triggerDisabled,
          Boolean(error) && styles.triggerError,
        ]}
        onPress={openModal}
        disabled={disabled}
        accessibilityRole="button"
        accessibilityState={{ disabled, expanded: isOpen }}
      >
        <Text
          style={[styles.triggerText, !hasValue && styles.triggerPlaceholder]}
          numberOfLines={1}
        >
          {displayText}
        </Text>
        <Text style={styles.chevron}>▾</Text>
      </Pressable>

      {error ? <Text style={styles.error}>{error}</Text> : null}

      <Modal
        visible={isOpen}
        transparent
        animationType="slide"
        onRequestClose={closeModal}
      >
        <View style={styles.overlay}>
          <Pressable style={styles.backdrop} onPress={closeModal} />
          <View style={styles.sheet}>
            <View style={styles.sheetHeader}>
              <View style={styles.sheetHeaderText}>
                <Text style={styles.sheetTitle}>{label || "Seleccionar"}</Text>
                {showSearch ? (
                  <Text style={styles.sheetSubtitle}>
                    {filteredOptions.length} de {selectableOptions.length} opciones
                  </Text>
                ) : null}
              </View>
              <Pressable style={styles.closeButton} onPress={closeModal}>
                <Text style={styles.closeButtonText}>Cerrar</Text>
              </Pressable>
            </View>

            {showSearch ? (
              <TextInput
                style={styles.searchInput}
                value={query}
                onChangeText={setQuery}
                placeholder="Buscar..."
                placeholderTextColor={colors.mutedLight}
                autoCorrect={false}
                autoCapitalize="none"
              />
            ) : null}

            {selectableOptions.length === 0 ? (
              <View style={styles.emptyState}>
                <Text style={styles.emptyText}>{emptyLabel}</Text>
              </View>
            ) : filteredOptions.length === 0 ? (
              <View style={styles.emptyState}>
                <Text style={styles.emptyText}>No hay resultados para esta búsqueda.</Text>
              </View>
            ) : (
              <FlatList
                data={filteredOptions}
                keyExtractor={(item, index) => `${String(item.value)}-${index}`}
                keyboardShouldPersistTaps="handled"
                style={listStyle}
                renderItem={({ item }) => {
                  if (!item) return null;
                  const selected = item.value === value;
                  return (
                    <Pressable
                      style={[styles.option, selected && styles.optionSelected]}
                      onPress={() => handleSelect(item.value)}
                    >
                      <Text
                        style={[styles.optionText, selected && styles.optionTextSelected]}
                        numberOfLines={2}
                      >
                        {item.label}
                      </Text>
                      {selected ? <Text style={styles.checkmark}>✓</Text> : null}
                    </Pressable>
                  );
                }}
              />
            )}

            <Pressable style={styles.cancelButton} onPress={closeModal}>
              <Text style={styles.cancelButtonText}>Cancelar</Text>
            </Pressable>
          </View>
        </View>
      </Modal>
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
  trigger: {
    minHeight: 46,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: 8,
    backgroundColor: colors.surface,
    paddingHorizontal: 12,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    gap: 12,
  },
  triggerDisabled: {
    opacity: 0.55,
    backgroundColor: colors.background,
  },
  triggerError: {
    borderColor: colors.danger,
  },
  triggerText: {
    flex: 1,
    color: colors.text,
    fontSize: 14,
    fontWeight: "600",
  },
  triggerPlaceholder: {
    color: colors.mutedLight,
    fontWeight: "500",
  },
  chevron: {
    color: colors.muted,
    fontSize: 16,
    lineHeight: 18,
  },
  error: {
    color: colors.danger,
    fontSize: 12,
    fontWeight: "600",
  },
  overlay: {
    flex: 1,
    justifyContent: "flex-end",
    backgroundColor: colors.overlayScrim,
  },
  backdrop: {
    flex: 1,
  },
  sheet: {
    maxHeight: "78%",
    backgroundColor: colors.surface,
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    paddingTop: 16,
    paddingHorizontal: 16,
    paddingBottom: 20,
    borderTopWidth: 1,
    borderColor: colors.border,
  },
  sheetHeader: {
    flexDirection: "row",
    alignItems: "flex-start",
    justifyContent: "space-between",
    gap: 12,
    marginBottom: 12,
  },
  sheetHeaderText: {
    flex: 1,
    gap: 2,
  },
  sheetTitle: {
    color: colors.nav,
    fontSize: 18,
    fontWeight: "800",
  },
  sheetSubtitle: {
    color: colors.muted,
    fontSize: 12,
  },
  closeButton: {
    paddingVertical: 6,
    paddingHorizontal: 4,
  },
  closeButtonText: {
    color: colors.primary,
    fontWeight: "700",
    fontSize: 14,
  },
  searchInput: {
    minHeight: 44,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: 8,
    backgroundColor: colors.background,
    paddingHorizontal: 12,
    marginBottom: 12,
    color: colors.text,
  },
  list: {},
  option: {
    minHeight: 48,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
    paddingHorizontal: 4,
    paddingVertical: 12,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    gap: 12,
  },
  optionSelected: {
    backgroundColor: colors.accentLight,
  },
  optionText: {
    flex: 1,
    color: colors.text,
    fontWeight: "600",
    fontSize: 14,
  },
  optionTextSelected: {
    color: colors.primaryDark,
    fontWeight: "800",
  },
  checkmark: {
    color: colors.primary,
    fontWeight: "900",
    fontSize: 16,
  },
  emptyState: {
    minHeight: 120,
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: 16,
  },
  emptyText: {
    color: colors.muted,
    textAlign: "center",
    lineHeight: 20,
  },
  cancelButton: {
    marginTop: 12,
    minHeight: 46,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: colors.border,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: colors.background,
  },
  cancelButtonText: {
    color: colors.text,
    fontWeight: "700",
  },
});

import { useEffect, useMemo, useState } from "react";
import {
  Modal,
  Pressable,
  StyleSheet,
  Text,
  View,
} from "react-native";
import { colors } from "../../styles/theme";
import {
  WEEK_DAYS,
  addMonths,
  formatDisplayDate,
  formatMonthLabel,
  getCalendarDays,
  isAfter,
  isBefore,
  isSameDay,
  normalizeBoundaryDate,
  parseIsoDate,
  startOfDay,
  startOfMonth,
  toIsoDate,
} from "../../utils/dates";

export default function MinimalDateInput({
  value,
  onChange,
  minDate,
  maxDate,
  placeholder = "dd/mm/aaaa",
  hasError = false,
}) {
  const selectedDate = useMemo(() => parseIsoDate(value), [value]);
  const minDateValue = useMemo(() => normalizeBoundaryDate(minDate), [minDate]);
  const maxDateValue = useMemo(() => normalizeBoundaryDate(maxDate), [maxDate]);
  const today = useMemo(() => startOfDay(new Date()), []);
  const [isOpen, setIsOpen] = useState(false);
  const [visibleMonth, setVisibleMonth] = useState(() =>
    startOfMonth(selectedDate ?? minDateValue ?? today)
  );

  useEffect(() => {
    if (!selectedDate) return;
    setVisibleMonth(startOfMonth(selectedDate));
  }, [selectedDate]);

  const canSelectDate = (date) => {
    if (minDateValue && isBefore(date, minDateValue)) return false;
    if (maxDateValue && isAfter(date, maxDateValue)) return false;
    return true;
  };

  const calendarDays = useMemo(() => getCalendarDays(visibleMonth), [visibleMonth]);

  const handleSelectDate = (date) => {
    if (!canSelectDate(date)) return;
    onChange(toIsoDate(date));
    setIsOpen(false);
  };

  const handleClear = () => {
    onChange("");
    setIsOpen(false);
  };

  const handleToday = () => {
    if (!canSelectDate(today)) return;
    onChange(toIsoDate(today));
    setVisibleMonth(startOfMonth(today));
    setIsOpen(false);
  };

  const displayValue = selectedDate ? formatDisplayDate(selectedDate) : placeholder;
  const currentMonthLabel = formatMonthLabel(visibleMonth);
  const canGoPrevMonth =
    !minDateValue ||
    !isBefore(addMonths(visibleMonth, -1), startOfMonth(minDateValue));
  const canGoNextMonth =
    !maxDateValue ||
    !isAfter(addMonths(visibleMonth, 1), startOfMonth(maxDateValue));

  return (
    <>
      <Pressable
        style={[styles.trigger, hasError && styles.triggerError]}
        onPress={() => setIsOpen(true)}
        accessibilityRole="button"
        accessibilityLabel={selectedDate ? `Fecha ${displayValue}` : placeholder}
      >
        <Text style={selectedDate ? styles.value : styles.placeholder}>{displayValue}</Text>
        <Text style={styles.icon}>📅</Text>
      </Pressable>

      <Modal
        visible={isOpen}
        transparent
        animationType="fade"
        onRequestClose={() => setIsOpen(false)}
      >
        <Pressable style={styles.backdrop} onPress={() => setIsOpen(false)}>
          <View style={styles.popover}>
            <View style={styles.header}>
              <Pressable
                style={[styles.navButton, !canGoPrevMonth && styles.navButtonDisabled]}
                onPress={() => canGoPrevMonth && setVisibleMonth((prev) => addMonths(prev, -1))}
                disabled={!canGoPrevMonth}
              >
                <Text style={styles.navButtonText}>‹</Text>
              </Pressable>
              <Text style={styles.monthLabel}>{currentMonthLabel}</Text>
              <Pressable
                style={[styles.navButton, !canGoNextMonth && styles.navButtonDisabled]}
                onPress={() => canGoNextMonth && setVisibleMonth((prev) => addMonths(prev, 1))}
                disabled={!canGoNextMonth}
              >
                <Text style={styles.navButtonText}>›</Text>
              </Pressable>
            </View>

            <View style={styles.weekdays}>
              {WEEK_DAYS.map((day) => (
                <Text key={day} style={styles.weekday}>
                  {day}
                </Text>
              ))}
            </View>

            <View style={styles.grid}>
              {calendarDays.map((day) => {
                const isCurrentMonth = day.getMonth() === visibleMonth.getMonth();
                const isSelected = isSameDay(day, selectedDate);
                const isToday = isSameDay(day, today);
                const isDisabled = !canSelectDate(day);

                return (
                  <Pressable
                    key={toIsoDate(day)}
                    style={[
                      styles.dayButton,
                      !isCurrentMonth && styles.dayMuted,
                      isSelected && styles.daySelected,
                      isToday && !isSelected && styles.dayToday,
                      isDisabled && styles.dayDisabled,
                    ]}
                    disabled={isDisabled}
                    onPress={() => handleSelectDate(day)}
                  >
                    <Text
                      style={[
                        styles.dayText,
                        !isCurrentMonth && styles.dayMutedText,
                        isSelected && styles.daySelectedText,
                        isToday && !isSelected && styles.dayTodayText,
                        isDisabled && styles.dayDisabledText,
                      ]}
                    >
                      {day.getDate()}
                    </Text>
                  </Pressable>
                );
              })}
            </View>

            <View style={styles.footer}>
              <Pressable onPress={handleClear}>
                <Text style={styles.footerButton}>Limpiar</Text>
              </Pressable>
              <Pressable onPress={handleToday} disabled={!canSelectDate(today)}>
                <Text
                  style={[
                    styles.footerButtonPrimary,
                    !canSelectDate(today) && styles.footerButtonPrimaryDisabled,
                  ]}
                >
                  Hoy
                </Text>
              </Pressable>
            </View>
          </View>
        </Pressable>
      </Modal>
    </>
  );
}

const styles = StyleSheet.create({
  trigger: {
    minHeight: 44,
    borderWidth: 1.5,
    borderColor: colors.border,
    borderRadius: 8,
    backgroundColor: colors.surface,
    paddingHorizontal: 12,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    gap: 12,
  },
  triggerError: {
    borderColor: colors.danger,
  },
  value: {
    color: colors.text,
    fontSize: 14,
  },
  placeholder: {
    color: colors.mutedLight,
    fontSize: 14,
  },
  icon: {
    fontSize: 16,
  },
  backdrop: {
    flex: 1,
    backgroundColor: colors.overlayScrimDark,
    justifyContent: "center",
    padding: 24,
  },
  popover: {
    backgroundColor: colors.surface,
    borderRadius: 20,
    padding: 16,
    borderWidth: 1,
    borderColor: colors.primaryBorderFaint,
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: 14,
    gap: 8,
  },
  monthLabel: {
    flex: 1,
    textAlign: "center",
    fontSize: 14,
    fontWeight: "700",
    color: colors.text,
    textTransform: "capitalize",
  },
  navButton: {
    width: 34,
    height: 34,
    borderWidth: 1,
    borderColor: colors.borderLight,
    borderRadius: 10,
    backgroundColor: colors.calendarNavBg,
    alignItems: "center",
    justifyContent: "center",
  },
  navButtonDisabled: {
    opacity: 0.45,
  },
  navButtonText: {
    color: colors.calendarNavText,
    fontSize: 20,
    lineHeight: 22,
  },
  weekdays: {
    flexDirection: "row",
    marginBottom: 8,
  },
  weekday: {
    flex: 1,
    textAlign: "center",
    fontSize: 11,
    fontWeight: "700",
    color: colors.calendarWeekday,
  },
  grid: {
    flexDirection: "row",
    flexWrap: "wrap",
  },
  dayButton: {
    width: "14.2857%",
    aspectRatio: 1,
    borderRadius: 12,
    alignItems: "center",
    justifyContent: "center",
  },
  dayText: {
    color: colors.text,
    fontSize: 14,
  },
  dayMuted: {
    opacity: 0.7,
  },
  dayMutedText: {
    color: colors.calendarMuted,
  },
  daySelected: {
    backgroundColor: colors.primary,
  },
  daySelectedText: {
    color: colors.onPrimary,
    fontWeight: "700",
  },
  dayToday: {
    backgroundColor: colors.accentMuted,
  },
  dayTodayText: {
    color: colors.primaryDark,
    fontWeight: "700",
  },
  dayDisabled: {
    opacity: 0.45,
  },
  dayDisabledText: {
    color: colors.calendarDisabled,
  },
  footer: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginTop: 14,
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: colors.calendarDivider,
  },
  footerButton: {
    color: colors.calendarFooter,
    fontSize: 13,
    fontWeight: "600",
  },
  footerButtonPrimary: {
    color: colors.primary,
    fontSize: 13,
    fontWeight: "600",
  },
  footerButtonPrimaryDisabled: {
    color: colors.calendarFooterDisabled,
  },
});

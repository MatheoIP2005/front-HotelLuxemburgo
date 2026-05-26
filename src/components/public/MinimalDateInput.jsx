import { useEffect, useMemo, useRef, useState } from 'react';
import styles from './MinimalDateInput.module.css';

const WEEK_DAYS = ['LU', 'MA', 'MI', 'JU', 'VI', 'SA', 'DO'];

const monthFormatter = new Intl.DateTimeFormat('es-EC', {
  month: 'long',
  year: 'numeric',
});

const dateFormatter = new Intl.DateTimeFormat('es-EC', {
  day: '2-digit',
  month: '2-digit',
  year: 'numeric',
});

const startOfDay = (date) => {
  const nextDate = new Date(date);
  nextDate.setHours(0, 0, 0, 0);
  return nextDate;
};

const parseIsoDate = (value) => {
  if (!value) return null;

  const [year, month, day] = String(value)
    .split('-')
    .map((part) => Number(part));

  if (!year || !month || !day) return null;

  const parsedDate = new Date(year, month - 1, day);
  if (
    parsedDate.getFullYear() !== year ||
    parsedDate.getMonth() !== month - 1 ||
    parsedDate.getDate() !== day
  ) {
    return null;
  }

  return startOfDay(parsedDate);
};

const toIsoDate = (date) => {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
};

const addDays = (date, amount) => {
  const nextDate = new Date(date);
  nextDate.setDate(nextDate.getDate() + amount);
  return startOfDay(nextDate);
};

const addMonths = (date, amount) =>
  startOfDay(new Date(date.getFullYear(), date.getMonth() + amount, 1));

const startOfMonth = (date) => startOfDay(new Date(date.getFullYear(), date.getMonth(), 1));

const isSameDay = (leftDate, rightDate) =>
  leftDate &&
  rightDate &&
  leftDate.getFullYear() === rightDate.getFullYear() &&
  leftDate.getMonth() === rightDate.getMonth() &&
  leftDate.getDate() === rightDate.getDate();

const isBefore = (leftDate, rightDate) =>
  leftDate && rightDate && leftDate.getTime() < rightDate.getTime();

const isAfter = (leftDate, rightDate) =>
  leftDate && rightDate && leftDate.getTime() > rightDate.getTime();

const getCalendarDays = (visibleMonth) => {
  const firstDayOfMonth = startOfMonth(visibleMonth);
  const firstDayWeekIndex = (firstDayOfMonth.getDay() + 6) % 7;
  const gridStartDate = addDays(firstDayOfMonth, -firstDayWeekIndex);

  return Array.from({ length: 42 }, (_, index) => addDays(gridStartDate, index));
};

const normalizeBoundaryDate = (value) => {
  if (!value) return null;
  if (value instanceof Date) return startOfDay(value);
  return parseIsoDate(value);
};

function CalendarIcon() {
  return (
    <svg
      className={styles.icon}
      viewBox="0 0 24 24"
      aria-hidden="true"
      focusable="false"
    >
      <path
        d="M7 2a1 1 0 0 1 1 1v1h8V3a1 1 0 1 1 2 0v1h1a3 3 0 0 1 3 3v11a3 3 0 0 1-3 3H5a3 3 0 0 1-3-3V7a3 3 0 0 1 3-3h1V3a1 1 0 0 1 1-1Zm12 8H5v8a1 1 0 0 0 1 1h12a1 1 0 0 0 1-1v-8ZM6 6a1 1 0 0 0-1 1v1h14V7a1 1 0 0 0-1-1H6Z"
        fill="currentColor"
      />
    </svg>
  );
}

export default function MinimalDateInput({
  id,
  value,
  onChange,
  minDate,
  maxDate,
  placeholder = 'dd/mm/aaaa',
}) {
  const wrapperRef = useRef(null);
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

  useEffect(() => {
    const handlePointerDown = (event) => {
      if (!wrapperRef.current?.contains(event.target)) {
        setIsOpen(false);
      }
    };

    const handleEscape = (event) => {
      if (event.key === 'Escape') {
        setIsOpen(false);
      }
    };

    document.addEventListener('mousedown', handlePointerDown);
    document.addEventListener('keydown', handleEscape);

    return () => {
      document.removeEventListener('mousedown', handlePointerDown);
      document.removeEventListener('keydown', handleEscape);
    };
  }, []);

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
    onChange('');
    setIsOpen(false);
  };

  const handleToday = () => {
    if (!canSelectDate(today)) return;
    onChange(toIsoDate(today));
    setVisibleMonth(startOfMonth(today));
    setIsOpen(false);
  };

  const displayValue = selectedDate ? dateFormatter.format(selectedDate) : placeholder;
  const currentMonthLabel = monthFormatter.format(visibleMonth);
  const canGoPrevMonth = !minDateValue || !isBefore(addMonths(visibleMonth, -1), startOfMonth(minDateValue));
  const canGoNextMonth = !maxDateValue || !isAfter(addMonths(visibleMonth, 1), startOfMonth(maxDateValue));

  return (
    <div className={styles.wrapper} ref={wrapperRef}>
      <button
        id={id}
        type="button"
        className={styles.trigger}
        onClick={() => setIsOpen((prev) => !prev)}
        aria-haspopup="dialog"
        aria-expanded={isOpen}
        aria-controls={`${id}-calendar`}
      >
        <span className={selectedDate ? styles.value : styles.placeholder}>{displayValue}</span>
        <CalendarIcon />
      </button>

      {isOpen && (
        <div className={styles.popover} id={`${id}-calendar`} role="dialog" aria-modal="false">
          <div className={styles.header}>
            <button
              type="button"
              className={styles.navButton}
              onClick={() => setVisibleMonth((prev) => addMonths(prev, -1))}
              disabled={!canGoPrevMonth}
              aria-label="Mes anterior"
            >
              ‹
            </button>
            <span className={styles.monthLabel}>{currentMonthLabel}</span>
            <button
              type="button"
              className={styles.navButton}
              onClick={() => setVisibleMonth((prev) => addMonths(prev, 1))}
              disabled={!canGoNextMonth}
              aria-label="Mes siguiente"
            >
              ›
            </button>
          </div>

          <div className={styles.weekdays}>
            {WEEK_DAYS.map((day) => (
              <span key={day}>{day}</span>
            ))}
          </div>

          <div className={styles.grid}>
            {calendarDays.map((day) => {
              const isCurrentMonth = day.getMonth() === visibleMonth.getMonth();
              const isSelected = isSameDay(day, selectedDate);
              const isToday = isSameDay(day, today);
              const isDisabled = !canSelectDate(day);

              return (
                <button
                  key={toIsoDate(day)}
                  type="button"
                  className={[
                    styles.dayButton,
                    !isCurrentMonth ? styles.dayMuted : '',
                    isSelected ? styles.daySelected : '',
                    isToday && !isSelected ? styles.dayToday : '',
                  ]
                    .filter(Boolean)
                    .join(' ')}
                  disabled={isDisabled}
                  onClick={() => handleSelectDate(day)}
                >
                  {day.getDate()}
                </button>
              );
            })}
          </div>

          <div className={styles.footer}>
            <button type="button" className={styles.footerButton} onClick={handleClear}>
              Limpiar
            </button>
            <button
              type="button"
              className={styles.footerButtonPrimary}
              onClick={handleToday}
              disabled={!canSelectDate(today)}
            >
              Hoy
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

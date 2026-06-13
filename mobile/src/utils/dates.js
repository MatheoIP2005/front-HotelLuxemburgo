const WEEK_DAYS = ["LU", "MA", "MI", "JU", "VI", "SA", "DO"];

const monthFormatter = new Intl.DateTimeFormat("es-EC", {
  month: "long",
  year: "numeric",
});

const dateFormatter = new Intl.DateTimeFormat("es-EC", {
  day: "2-digit",
  month: "2-digit",
  year: "numeric",
});

export const startOfDay = (date) => {
  const nextDate = new Date(date);
  nextDate.setHours(0, 0, 0, 0);
  return nextDate;
};

export const parseIsoDate = (value) => {
  if (!value) return null;

  const [year, month, day] = String(value)
    .split("-")
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

export const toIsoDate = (date) => {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
};

export const addDays = (date, amount) => {
  const nextDate = new Date(date);
  nextDate.setDate(nextDate.getDate() + amount);
  return startOfDay(nextDate);
};

export const addMonths = (date, amount) =>
  startOfDay(new Date(date.getFullYear(), date.getMonth() + amount, 1));

export const startOfMonth = (date) =>
  startOfDay(new Date(date.getFullYear(), date.getMonth(), 1));

export const isSameDay = (leftDate, rightDate) =>
  leftDate &&
  rightDate &&
  leftDate.getFullYear() === rightDate.getFullYear() &&
  leftDate.getMonth() === rightDate.getMonth() &&
  leftDate.getDate() === rightDate.getDate();

export const isBefore = (leftDate, rightDate) =>
  leftDate && rightDate && leftDate.getTime() < rightDate.getTime();

export const isAfter = (leftDate, rightDate) =>
  leftDate && rightDate && leftDate.getTime() > rightDate.getTime();

export const normalizeBoundaryDate = (value) => {
  if (!value) return null;
  if (value instanceof Date) return startOfDay(value);
  return parseIsoDate(value);
};

export const getCalendarDays = (visibleMonth) => {
  const firstDayOfMonth = startOfMonth(visibleMonth);
  const firstDayWeekIndex = (firstDayOfMonth.getDay() + 6) % 7;
  const gridStartDate = addDays(firstDayOfMonth, -firstDayWeekIndex);

  return Array.from({ length: 42 }, (_, index) => addDays(gridStartDate, index));
};

export const formatDisplayDate = (date) => dateFormatter.format(date);

export const formatMonthLabel = (date) => monthFormatter.format(date);

export { WEEK_DAYS };

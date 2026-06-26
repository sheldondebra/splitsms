/** Convert Date to value for `<input type="datetime-local" />` and server actions. */
export function toDatetimeLocalValue(date: Date): string {
  const d = new Date(date);
  d.setMinutes(d.getMinutes() - d.getTimezoneOffset());
  return d.toISOString().slice(0, 16);
}

export function fromDatetimeLocalValue(value: string): Date | null {
  if (!value) return null;
  const parsed = new Date(value);
  return Number.isNaN(parsed.getTime()) ? null : parsed;
}

export function isFutureSchedule(value: string): boolean {
  const parsed = fromDatetimeLocalValue(value);
  return Boolean(parsed && parsed > new Date());
}

export function combineDateAndTime(date: Date, hours: number, minutes: number): Date {
  const next = new Date(date);
  next.setHours(hours, minutes, 0, 0);
  return next;
}

export function roundUpToNextQuarterHour(from = new Date()): Date {
  const next = new Date(from);
  next.setSeconds(0, 0);
  const remainder = next.getMinutes() % 15;
  if (remainder !== 0) {
    next.setMinutes(next.getMinutes() + (15 - remainder));
  }
  if (next <= from) {
    next.setMinutes(next.getMinutes() + 15);
  }
  return next;
}

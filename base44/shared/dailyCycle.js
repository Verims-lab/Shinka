import { InternalError } from './internalAuthorization.js';
import { calendarDayNumber } from './dailySelection.js';

const fail = () => { throw new InternalError('CYCLE_DATA_INVALID', 409); };
export function cyclePhaseAtDay(length, duration, day) {
  if (!Number.isInteger(length) || length < 15 || length > 60 || !Number.isInteger(duration) || duration < 1 || duration > 10 || !Number.isInteger(day) || day < 1 || day > length) fail();
  if (day <= duration) return 'MENSTRUAL';
  const center = length - 14;
  if (day >= center - 1 && day <= center + 1) return 'OVULATION';
  return day < center - 1 ? 'FOLLICULAR' : 'LUTEAL';
}
export function estimatedCycleLength(observations, initial = null) {
  if (observations.length > 3 || observations.some(n => !Number.isInteger(n) || n < 15 || n > 60)) fail();
  if (!observations.length) {
    if (initial !== null && (!Number.isInteger(initial) || initial < 15 || initial > 60)) fail();
    return initial ?? 28;
  }
  let used = observations;
  if (observations.length === 3) {
    const outlier = observations.findIndex((n, index) => {
      const other = observations.filter((_, i) => i !== index);
      return other.every(value => Math.abs(value - n) >= 9) && Math.abs(other[0] - other[1]) <= 3;
    });
    if (outlier >= 0) used = observations.filter((_, i) => i !== outlier);
  }
  return Math.floor(used.reduce((sum, n) => sum + n, 0) / used.length + 0.5);
}
// Only today's input is derived here. No Calendar prediction/phase cache is written.
// Caller supplies the four latest real starts on/before today, after consent gates.
export function resolveDailyCycle({ day, periods, settings = null }) {
  if (!periods.length) return 'UNKNOWN';
  if (periods.length > 4) fail();
  const today = calendarDayNumber(day);
  const starts = periods.map(row => calendarDayNumber(row.period_start_date)).sort((a, b) => b - a);
  if (starts.some(n => n > today)) fail();
  const intervals = starts.slice(1).map((n, i) => starts[i] - n);
  const length = estimatedCycleLength(intervals, settings?.initial_cycle_length_days ?? null);
  const duration = settings?.period_duration_days ?? 5;
  return cyclePhaseAtDay(length, duration, (today - starts[0]) % length + 1);
}

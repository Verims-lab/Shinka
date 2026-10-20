import { InternalError } from './internalAuthorization.js';
import { isCalendarDate } from './onboardingValidation.js';
import { calendarDayNumber } from './dailySelection.js';
import { cycleEstimate, cyclePhaseAtDay } from './dailyCycle.js';

export const CALENDAR_HISTORY_LIMIT = 2500;
export const CALENDAR_DAY_LIMIT = 40000;
const fail = code => { throw new InternalError(code, 409); };
export const addCalendarDays = (day, n) => new Date((calendarDayNumber(day) + n) * 86400000).toISOString().slice(0, 10);

export function orderedPeriods(periods) {
  if (!Array.isArray(periods) || periods.length > CALENDAR_HISTORY_LIMIT) fail('CALENDAR_HISTORY_LIMIT');
  if (periods.some(row => !row || typeof row.id !== 'string' || !row.id || !isCalendarDate(row.period_start_date))) fail('CALENDAR_DATA_CONFLICT');
  const rows = [...periods].sort((a, b) => a.period_start_date.localeCompare(b.period_start_date));
  const ids = new Set();
  rows.forEach((row, i) => {
    if (ids.has(row.id)) fail('CALENDAR_DATA_CONFLICT');
    ids.add(row.id);
    if (i && calendarDayNumber(row.period_start_date) - calendarDayNumber(rows[i - 1].period_start_date) < 15) fail('PERIOD_CONFLICT');
  });
  return rows;
}

export function validatePeriodChange(periods, action, id, date, today) {
  const rows = orderedPeriods(periods);
  if (!['add', 'edit', 'delete'].includes(action)) fail('INVALID_REQUEST');
  const existing = rows.find(row => row.id === id);
  if (action !== 'add' && !existing) fail('PERIOD_NOT_FOUND');
  if (action === 'delete') return existing;
  if (!date) fail('PERIOD_DATE_REQUIRED');
  if (!isCalendarDate(date)) fail('PERIOD_DATE_INVALID');
  if (date > today) fail('PERIOD_START_FUTURE');
  for (const row of rows) {
    if (action === 'edit' && row.id === id) continue;
    const distance = Math.abs(calendarDayNumber(date) - calendarDayNumber(row.period_start_date));
    if (distance === 0) fail('PERIOD_DUPLICATE');
    if (distance < 15) fail('PERIOD_CONFLICT');
  }
  return existing;
}

// Pure source calculation. History is complete, never the visible month alone.
// No row, setting, native timestamp or daily snapshot is mutated here.
export function calculateCalendar({ periods, settings = null, today }) {
  const rows = orderedPeriods(periods);
  if (!rows.length) return { predictions: [], phases: [], observations: [], estimate: null, coverageEnd: null };
  if (!isCalendarDate(today) || rows.some(row => row.period_start_date > today)) fail('CALENDAR_DATA_CONFLICT');
  const duration = settings?.period_duration_days ?? 5;
  const observations = rows.slice(1).map((row, i) => ({
    from: rows[i].id, to: row.id,
    days: calendarDayNumber(row.period_start_date) - calendarDayNumber(rows[i].period_start_date),
  }));
  // The sources specify only a 15–60 lookup, not a rule for longer observed
  // intervals. Preserve observations and fail explicitly; never clamp/omit them.
  if (observations.some(row => row.days > 60)) fail('CYCLE_RANGE_DECISION_REQUIRED');
  const estimate = cycleEstimate(observations.slice(-3).map(row => row.days), settings?.initial_cycle_length_days ?? null);
  const latest = rows.at(-1), length = estimate.length;
  cyclePhaseAtDay(length, duration, 1);
  const currentCycle = Math.floor((calendarDayNumber(today) - calendarDayNumber(latest.period_start_date)) / length);
  const coverageEnd = addCalendarDays(latest.period_start_date, (currentCycle + 4) * length - 1);
  if (calendarDayNumber(coverageEnd) - calendarDayNumber(rows[0].period_start_date) >= CALENDAR_DAY_LIMIT) fail('CALENDAR_HISTORY_LIMIT');
  const phases = [], predictions = [];
  const appendCycle = (start, days, cycleLength, basis, reference) => {
    for (let d = 0; d < days; d++) phases.push({
      phase_date: addCalendarDays(start, d), phase_code: cyclePhaseAtDay(cycleLength, duration, d + 1),
      calculation_basis: basis, reference_period_id: reference,
    });
  };
  // Completed real cycles use their actual lengths; genuine starts take priority.
  rows.slice(0, -1).forEach((row, i) => appendCycle(row.period_start_date, observations[i].days, observations[i].days, 'RECORDED_START', row.id));
  appendCycle(latest.period_start_date, length, length, 'RECORDED_START', latest.id);
  for (let cycle = 1; cycle <= currentCycle + 3; cycle++) {
    const start = addCalendarDays(latest.period_start_date, cycle * length);
    predictions.push({ reference_period_id: latest.id, predicted_start_date: start, predicted_end_date: addCalendarDays(start, length - 1), estimated_cycle_length_days: length });
    appendCycle(start, length, length, 'PREDICTED', latest.id);
  }
  return { predictions, phases, observations, estimate, coverageEnd };
}

export function calendarMonthView(periods, settings, calculation, month) {
  const start = `${month}-01`;
  if (!isCalendarDate(start)) fail('CALENDAR_MONTH_INVALID');
  const next = addCalendarDays(start, 32).slice(0, 7) + '-01';
  const end = addCalendarDays(next, -1);
  const duration = settings?.period_duration_days ?? 5;
  const actual = new Set();
  periods.forEach(row => {
    for (let i = 0; i < duration; i++) {
      const day = addCalendarDays(row.period_start_date, i);
      if (day >= start && day <= end) actual.add(day);
    }
  });
  const predicted = calculation.phases.filter(row => row.phase_date >= start && row.phase_date <= end && row.calculation_basis === 'PREDICTED' && row.phase_code === 'MENSTRUAL' && !actual.has(row.phase_date)).map(row => row.phase_date);
  return {
    month, starts: periods.filter(row => row.period_start_date >= start && row.period_start_date <= end).map(row => ({ id: row.id, date: row.period_start_date })),
    recordedDays: [...actual], predictedDays: predicted, coverageEnd: calculation.coverageEnd,
  };
}

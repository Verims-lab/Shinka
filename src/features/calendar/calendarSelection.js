import { isCalendarDate } from '../../../base44/shared/onboardingValidation.js';

// Month projections are display data, not a complete start history. The server
// still validates both neighbours, consent, owner today and the exact revision.
export function calendarSelection(state) {
  const { value, selected, moving, editing } = state;
  if (!value || !isCalendarDate(selected)) return null;
  const inMonth = selected.slice(0, 7) === value.month;
  // A different month's projection cannot establish this date's record status.
  // An explicit move may still retain its unsaved target across month changes.
  if (!inMonth && !moving) return null;
  const start = inMonth ? value.starts.find(row => row.date === selected) : null;
  const recorded = inMonth && value.recordedDays.includes(selected);
  const predicted = inMonth && value.predictedDays.includes(selected);
  const future = selected > value.today;
  const action = moving && editing ? selected !== editing.date ? 'edit' : null : !start && !recorded ? 'add' : null;
  let error = action && future ? 'PERIOD_START_FUTURE' : null;
  if (action && !error) {
    const day = Date.parse(`${selected}T12:00:00Z`);
    const neighbours = value.starts.filter(row => !moving || row.id !== editing.id);
    if (neighbours.some(row => row.date === selected)) error = 'PERIOD_DUPLICATE';
    else if (neighbours.some(row => Math.abs(Date.parse(`${row.date}T12:00:00Z`) - day) < 15 * 86400000)) error = 'PERIOD_CONFLICT';
  }
  return { date: selected, inMonth, start, recorded, predicted, future, today: selected === value.today, action, error };
}

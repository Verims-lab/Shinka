import { InternalError } from './internalAuthorization.js';
import { isCalendarDate, validTimezone, serverLocalDate } from './onboardingValidation.js';
import { validateDomainRecord } from './domainValidation.js';
import { selectDailyCandidate } from './dailyCandidateSelection.js';
import { validateMoonIntervals } from './moonIntervals.js';

const fail = code => { throw new InternalError(code, 409); };
export function patternWindowStart(today) {
  if (!isCalendarDate(today)) fail('PATTERN_DATA_INVALID');
  return new Date(Date.parse(today) - 29 * 86400000).toISOString().slice(0, 10);
}
export function calculatePatternSummary({ rows, owner, timezone, instant, firstDay = null }) {
  const today = serverLocalDate(instant, timezone), start = patternWindowStart(today);
  const days = new Map(), ids = new Set();
  for (const row of rows) {
    if (typeof row.id !== 'string' || !row.id || ids.has(row.id) || row.user_id !== owner || !isCalendarDate(row.shinka_date) ||
      !validTimezone(row.timezone) || typeof row.category_id !== 'string' || !row.category_id.trim() ||
      !/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}(?:\.\d+)?Z$/.test(row.generated_at) ||
      !Number.isFinite(Date.parse(row.generated_at)) || new Date(row.generated_at).toISOString().slice(0, 19) !== row.generated_at.slice(0, 19)) fail('PATTERN_DATA_INVALID');
    ids.add(row.id);
    // Stored local dates stay authoritative; do not redate old snapshots.
    if (row.shinka_date < start || row.shinka_date > today) continue;
    const candidates = days.get(row.shinka_date) || [];
    candidates.push(row); days.set(row.shinka_date, candidates);
  }
  const categories = new Map();
  for (const [day, candidates] of days) {
    const row = selectDailyCandidate(candidates);
    const current = categories.get(row.category_id) || { id: row.category_id, count: 0, last: day };
    current.count++;
    if (day > current.last) current.last = day;
    categories.set(row.category_id, current);
  }
  const ranked = [...categories.values()].sort((a, b) => b.count - a.count || b.last.localeCompare(a.last));
  const summary = {
    user_id: owner, as_of_date: today, timezone,
    window_start_date: firstDay ? (firstDay < start ? start : firstDay) : days.size ? [...days.keys()].sort()[0] : today, window_end_date: today,
    calculated_at: instant.toISOString(),
    primary_category_id: ranked[0]?.id ?? null, primary_count: ranked[0]?.count ?? null,
    secondary_category_id: ranked[1]?.id ?? null, secondary_count: ranked[1]?.count ?? null,
  };
  if (firstDay && (!isCalendarDate(firstDay) || firstDay > today || [...days.keys()].some(day => day < firstDay))) fail('PATTERN_DATA_INVALID');
  validateDomainRecord('user_pattern_summary', summary);
  return summary;
}
// Restores the 021 interval projection. The WANING interval's validated end
// is the next NEW transition; no interpolated astronomical phase is invented.
export function calculateLunarTimeline(rows, instant, timezone) {
  if (!validTimezone(timezone) || !Number.isFinite(instant.getTime())) fail('PATTERN_DATA_INVALID');
  const sorted = Array.isArray(rows) && !rows.length ? [] : validateMoonIntervals(rows);
  const time = instant.getTime();
  const current = sorted.find(row => Date.parse(row.start_at_utc) <= time && time < Date.parse(row.end_at_utc));
  const interval = row => row ? { phase_code: row.phase_code, start_at_utc: row.start_at_utc, end_at_utc: row.end_at_utc } : null;
  const startIndex = sorted.findLastIndex(row => row.phase_code === 'NEW' && Date.parse(row.start_at_utc) <= time);
  const cycle = startIndex < 0 ? [] : sorted.slice(startIndex, startIndex + 4);
  let timeline = null;
  if (current && cycle.length === 4 && time < Date.parse(cycle[3].end_at_utc)) {
    const start = Date.parse(cycle[0].start_at_utc), end = Date.parse(cycle[3].end_at_utc);
    timeline = {
      today_position: (time - start) / (end - start),
      active_index: cycle.findIndex(row => Date.parse(row.start_at_utc) <= time && time < Date.parse(row.end_at_utc)),
      nodes: [...cycle, { phase_code: 'NEW', start_at_utc: cycle[3].end_at_utc }].map(row => ({
        phase_code: row.phase_code, instant: row.start_at_utc, position: (Date.parse(row.start_at_utc) - start) / (end - start),
      })),
    };
  }
  return { timezone, observed_at: instant.toISOString(), current: interval(current), timeline };
}

import { InternalError } from './internalAuthorization.js';
import { validateDomainRecord } from './domainValidation.js';

export const MOON_PHASE_ORDER = Object.freeze(['NEW', 'WAXING', 'FULL', 'WANING']);
export function validateMoonIntervals(rows, start = null, end = null) {
  if (!Array.isArray(rows) || !rows.length || rows.length > 1200) throw new InternalError('MOON_LOOKUP_NOT_READY', 503);
  const sorted = [...rows].sort((a, b) => a.start_at_utc.localeCompare(b.start_at_utc));
  sorted.forEach((row, index) => {
    validateDomainRecord('moon_phase_lookup', { phase_code: row.phase_code, start_at_utc: row.start_at_utc, end_at_utc: row.end_at_utc });
    const previous = sorted[index - 1];
    if (previous && (Date.parse(previous.end_at_utc) !== Date.parse(row.start_at_utc) || MOON_PHASE_ORDER[(MOON_PHASE_ORDER.indexOf(previous.phase_code) + 1) % 4] !== row.phase_code)) throw new InternalError('MOON_LOOKUP_CONFLICT', 409);
  });
  if (start && Date.parse(sorted[0].start_at_utc) > start.getTime() || end && Date.parse(sorted.at(-1).end_at_utc) < end.getTime()) throw new InternalError('MOON_LOOKUP_COVERAGE_REQUIRED', 503);
  return sorted;
}
export function resolveMoonPhase(rows, instant) {
  const sorted = validateMoonIntervals(rows);
  const time = instant.getTime();
  const matches = sorted.filter(row => Date.parse(row.start_at_utc) <= time && time < Date.parse(row.end_at_utc));
  if (matches.length !== 1) throw new InternalError('MOON_LOOKUP_COVERAGE_REQUIRED', 503);
  return matches[0].phase_code;
}
// The astronomy implementation is injected by the backend entry, never a browser dependency.
export function generateMoonIntervals(astronomy, now) {
  const end = new Date(now); end.setUTCFullYear(end.getUTCFullYear() + 2);
  const start = new Date(now.getTime() - 35 * 86400000);
  let current = astronomy.SearchMoonQuarter(start);
  const rows = [];
  for (let count = 0; count < 400; count++) {
    const next = astronomy.NextMoonQuarter(current);
    rows.push({ phase_code: MOON_PHASE_ORDER[current.quarter], start_at_utc: current.time.date.toISOString(), end_at_utc: next.time.date.toISOString() });
    if (next.time.date >= end) return validateMoonIntervals(rows, now, end);
    current = next;
  }
  throw new InternalError('MOON_GENERATION_FAILED', 503);
}

import { InternalError } from './internalAuthorization.js';
import { isCalendarDate } from './onboardingValidation.js';

export function calendarDayNumber(value) {
  if (!isCalendarDate(value)) throw new InternalError('DAILY_DATE_INVALID', 409);
  return Date.parse(`${value}T00:00:00Z`) / 86400000;
}
export function repeatWindowStart(day) {
  return new Date((calendarDayNumber(day) - 39) * 86400000).toISOString().slice(0, 10);
}
// First showing is day 1. Differences 0..39 are protected; difference 40 is day 41.
// The last fallback needs no unbounded history: if every candidate is protected,
// every candidate's latest showing is necessarily in this same bounded window.
export function selectDailyPair({ pairs, history, categoryId, day, random = Math.random }) {
  const today = calendarDayNumber(day);
  const active = pairs.filter(pair => pair.is_active === 'Active');
  if (!active.length) throw new InternalError('CONTENT_NOT_READY', 503);
  const latest = new Map();
  for (const row of history) {
    const n = calendarDayNumber(row.shinka_date);
    if (n > today || n < today - 39) throw new InternalError('DAILY_HISTORY_INVALID', 409);
    latest.set(row.message_pair_id, Math.max(latest.get(row.message_pair_id) ?? -Infinity, n));
  }
  const eligible = active.filter(pair => !latest.has(pair.id));
  let candidates = eligible.filter(pair => pair.category_id === categoryId);
  let stage = 'MAPPED_CATEGORY';
  if (!candidates.length) { candidates = eligible; stage = 'OTHER_CATEGORY'; }
  if (!candidates.length) {
    const oldest = Math.min(...active.map(pair => latest.get(pair.id)));
    candidates = active.filter(pair => latest.get(pair.id) === oldest);
    stage = 'LEAST_RECENT';
  }
  const sample = random();
  if (!Number.isFinite(sample) || sample < 0 || sample >= 1) throw new InternalError('RANDOM_SOURCE_INVALID', 503);
  return { pair: candidates[Math.floor(sample * candidates.length)], stage };
}

export function dailySnapshot({ owner, day, timezone, pair, now }) {
  return { user_id: owner, shinka_date: day, timezone, category_id: pair.category_id,
    message_pair_id: pair.id, message_tr_snapshot: pair.message_tr,
    suggestion_tr_snapshot: pair.suggestion_tr, message_en_snapshot: pair.message_en,
    suggestion_en_snapshot: pair.suggestion_en, generated_at: now.toISOString() };
}

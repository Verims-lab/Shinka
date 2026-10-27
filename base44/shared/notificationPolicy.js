import { InternalError } from './internalAuthorization.js';
import { serverLocalDate } from './onboardingValidation.js';

export const NOTIFICATION_TYPE = 'DAILY_SHINKA';
export const NOTIFICATION_LIMITS = Object.freeze({ pageSize: 25, budgetMs: 20000, attempts: 3, retryMinutes: [5, 15], endHour: 12 });
export const NOTIFICATION_COPY = Object.freeze({
  tr: { title: 'Shinka', message: 'Günlük Shinka içeriğin hazır' },
  en: { title: 'Shinka', message: 'Your daily Shinka is ready' },
});
export const notificationFail = (code, status = 409) => { throw new InternalError(code, status); };
export function notificationWindow(instant, timezone) {
  // Fail closed for a corrupt saved zone; never silently schedule in UTC.
  let parts;
  try { parts = new Intl.DateTimeFormat('en-GB', { timeZone: timezone, year: 'numeric', month: '2-digit', day: '2-digit', hour: '2-digit', minute: '2-digit', second: '2-digit', hourCycle: 'h23' }).formatToParts(instant); }
  catch { notificationFail('NOTIFICATION_TIMEZONE_INVALID'); }
  if (typeof timezone !== 'string' || !timezone || !Number.isFinite(+instant)) notificationFail('NOTIFICATION_TIMEZONE_INVALID');
  const p = Object.fromEntries(parts.map(part => [part.type, part.value]));
  const day = `${p.year}-${p.month}-${p.day}`, hour = Number(p.hour);
  // Find today's actual 06:00 using zone rules at that instant (not today's
  // offset extrapolated across a DST change). Bounded search also handles 45m zones.
  let target = Date.parse(`${day}T06:00:00.000Z`);
  for (let n = 0; n < 4; n++) {
    const local = Object.fromEntries(new Intl.DateTimeFormat('en-GB', { timeZone: timezone, year:'numeric',month:'2-digit',day:'2-digit',hour:'2-digit',minute:'2-digit',second:'2-digit',hourCycle:'h23' }).formatToParts(new Date(target)).map(part => [part.type, part.value]));
    const represented = Date.parse(`${local.year}-${local.month}-${local.day}T${local.hour}:${local.minute}:${local.second}.000Z`);
    const delta = Date.parse(`${day}T06:00:00.000Z`) - represented;
    if (!delta) return { day, timezone, scheduledAt: new Date(target).toISOString(), due: hour >= 6 && hour < NOTIFICATION_LIMITS.endHour };
    target += delta;
  }
  notificationFail('NOTIFICATION_LOCAL_TIME_UNRESOLVED');
}
export function notificationEligible(preferences, device) {
  if (!preferences?.notifications_enabled) return 'PREFERENCE_DISABLED';
  if (device?.support === 'UNSUPPORTED') return 'DEVICE_UNSUPPORTED';
  if (device?.permission === 'DENIED') return 'PERMISSION_DENIED';
  // Native support/permission cannot be queried through Base44. App preference,
  // owner/consent and the disabled-until-configured entry remain separate gates.
  if (device?.observation === 'NOT_EXPOSED') return null;
  if (device?.support !== 'SUPPORTED' || device?.permission !== 'GRANTED') return 'DEVICE_PERMISSION_UNKNOWN';
  return null;
}
export function retryAt(attempt, now) {
  const minutes = NOTIFICATION_LIMITS.retryMinutes[attempt - 1];
  return minutes ? new Date(+now + minutes * 60000).toISOString() : null;
}
export function currentNotificationDay(now, timezone, expectedDay) {
  return serverLocalDate(now, timezone) === expectedDay && notificationWindow(now, timezone).due;
}

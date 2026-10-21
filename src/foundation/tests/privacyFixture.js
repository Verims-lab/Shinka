import { nativeFixture } from './nativeFixture';
import { handlePrivacyRequest } from '../../../base44/shared/privacyOperation.js';
import { privacyRequest } from '@/services/privacyService';
import { createOnboardingCycleGate } from '../../../base44/shared/onboardingCycleGate.js';
export function privacyFixture() {
  const f = nativeFixture();
  f.state.time = '2026-10-21T12:00:00.000Z';
  f.tables.UserPeriodRecord.push({ id: 'privacy-period', user_id: 'ownerA', period_start_date: '2026-10-01' });
  f.tables.UserCalendarAction.push({ id: 'privacy-receipt', user_id: 'ownerA', desired_date: '2026-10-01' });
  const gate = createOnboardingCycleGate();
  const http = (body, owner = 'ownerA', options = {}) => handlePrivacyRequest(new Request('https://fixture.invalid/privacy', { method: 'POST', body: JSON.stringify(body) }), () => f.raw(owner), { now: f.now, gate, ...options });
  const request = (action, payload = {}, owner = 'ownerA') => privacyRequest(action, payload, { functions: { invoke: async (_name, body) => ({ data: await (await http(body, owner)).json() }) } });
  return { ...f, http, request };
}
export const privacyIntent = kind => ({ kind, confirmed: true, recovery_key: 'a'.repeat(64) });
export const memoryRecovery = () => { let value = null; return { read: () => value, save: input => { value = input; }, clear: () => { value = null; } }; };

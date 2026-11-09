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
  const request = (action, payload = {}, ownerOrOptions = 'ownerA') => {
    const options = ownerOrOptions && typeof ownerOrOptions === 'object' ? ownerOrOptions : {};
    const owner = ownerOrOptions && typeof ownerOrOptions === 'object' ? 'ownerA' : ownerOrOptions;
    return privacyRequest(action, payload, { functions: { invoke: async (_name, body) => {
      const response = await http(body, owner), data = await response.json();
      if (!response.ok) throw { response: { status: response.status, data } };
      return { data };
    } } }, options.timeoutMs ?? 20000, options);
  };
  return { ...f, http, request };
}
export const privacyIntent = kind => ({ kind, confirmed: true, recovery_key: 'a'.repeat(64) });
export const memoryRecovery = () => { let value = null; return { read: () => value, save: input => { value = input; }, clear: () => { value = null; } }; };

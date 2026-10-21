import { base44 } from '@/api/base44Client';
const states = ['IDLE', 'IN_PROGRESS', 'HEALTH_CLEANUP_COMPLETED', 'PLATFORM_PENDING', 'PLATFORM_REVIEW_REQUIRED'];
/** @param {string} action @param {object} payload @param {{functions:{invoke:(name:string,body:object)=>Promise<{data:any}>}}} client @param {number} timeout */
export async function privacyRequest(action, payload = {}, client = base44, timeout = 20000) {
  let timer;
  try {
    const response = await Promise.race([client.functions.invoke('accountPrivacy', { action, ...payload }), new Promise((_, reject) => { timer = setTimeout(() => reject(new Error()), timeout); })]);
    const value = response?.data;
    if (value?.error_code) throw { response: { data: value } };
    if (!states.includes(value?.state) || value.permanentDeletionVerified !== false || value.state === 'PLATFORM_PENDING' && value.activeDataRemoved !== true || value.state === 'HEALTH_CLEANUP_COMPLETED' && (value.consentWithdrawn !== true || value.healthCleanupVerified !== true)) throw new Error();
    return value;
  } catch (error) {
    const raw = error?.response?.data?.error_code;
    const code = typeof raw === 'string' && /^(PRIVACY_|AUTH_REQUIRED|ACTIVE_ACCOUNT_REQUIRED|ACCOUNT_DELETION_IN_PROGRESS|CONSENT_|HEALTH_|INVALID_REQUEST)/.test(raw) ? raw : 'PRIVACY_OUTCOME_UNCONFIRMED';
    throw Object.assign(new Error(code), { code });
  } finally { clearTimeout(timer); }
}
export function privacySecret() {
  return Array.from(crypto.getRandomValues(new Uint8Array(32)), b => b.toString(16).padStart(2, '0')).join('');
}
export const PRIVACY_SIGNAL = 'shinka-privacy-invalidation';
export function signalPrivacyChange() {
  window.dispatchEvent(new Event('shinka-health-access-changed'));
  try { localStorage.setItem(PRIVACY_SIGNAL, crypto.randomUUID()); } catch { /* Other tabs revalidate on focus; no personal payload. */ }
}
// Request-only recovery capability, never identity/health data. It grants only a
// minimal read-only result and expires server-side after 24h. Never put in URL.
export const privacyRecoveryStore = {
  read() { try { return JSON.parse(sessionStorage.getItem('shinka.privacy-recovery.v1') || 'null'); } catch { return null; } },
  save(value) { sessionStorage.setItem('shinka.privacy-recovery.v1', JSON.stringify(value)); },
  clear() { sessionStorage.removeItem('shinka.privacy-recovery.v1'); },
};

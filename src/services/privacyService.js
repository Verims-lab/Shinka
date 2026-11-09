import { base44 } from '@/api/base44Client';
import { healthReadDiagnostic } from '../../base44/shared/healthReadDiagnostics.js';
const states = ['IDLE', 'IN_PROGRESS', 'HEALTH_CLEANUP_COMPLETED', 'PLATFORM_PENDING', 'PLATFORM_REVIEW_REQUIRED'];
const failure = code => Object.assign(new Error(code), { code });
const timers = { set: (fn, ms) => setTimeout(fn, ms), clear: id => clearTimeout(id) };
// No automatic retry, including for reads. A timeout never cancels remote SDK
// work or establishes removal. Only the local wait/listeners are cancelled.
/** @param {string} action @param {any} payload @param {{functions:{invoke:Function}}} client @param {number} timeout @param {any} options */
export async function privacyRequest(action, payload = {}, client = base44, timeout = 20000, options = {}) {
  const { signal, clock = () => performance.now(), scheduler = timers } = options;
  const started = clock(), readOnly = ['read', 'status'].includes(action);
  let timer, abort;
  try {
    if (signal?.aborted) throw failure('PRIVACY_CANCELLED');
    const boundary = new Promise((_, reject) => {
      abort = () => reject(failure('PRIVACY_CANCELLED'));
      signal?.addEventListener('abort', abort, { once: true });
      timer = scheduler.set(() => reject(failure('TIMEOUT')), timeout);
    });
    const response = await Promise.race([Promise.resolve().then(() => {
      if (signal?.aborted) throw failure('PRIVACY_CANCELLED');
      return client.functions.invoke('accountPrivacy', { action, ...payload });
    }), boundary]);
    if (clock() - started >= timeout) throw failure('TIMEOUT');
    const value = response?.data;
    if (value?.error_code) throw { response };
    if (!states.includes(value?.state) || value.permanentDeletionVerified !== false
      || value.state !== 'IDLE' && !['DELETE_ACCOUNT', 'WITHDRAW_HEALTH'].includes(value.kind)
      || payload.kind && value.kind !== payload.kind
      || value.state === 'PLATFORM_PENDING' && (value.kind !== 'DELETE_ACCOUNT' || value.activeDataRemoved !== true)
      || value.state === 'HEALTH_CLEANUP_COMPLETED' && (value.kind !== 'WITHDRAW_HEALTH' || value.consentWithdrawn !== true || value.healthCleanupVerified !== true)) throw failure('PRIVACY_RESPONSE_INVALID');
    return value;
  } catch (error) {
    const raw = error?.response?.data?.error_code ?? error?.code;
    const diagnostic = healthReadDiagnostic(error);
    const known = typeof raw === 'string' && /^(PRIVACY_[A-Z_]+|AUTH_REQUIRED|ACTIVE_ACCOUNT_REQUIRED|ACCOUNT_DELETION_IN_PROGRESS|CONSENT_[A-Z_]+|HEALTH_[A-Z_]+|INVALID_REQUEST)$/.test(raw);
    const code = known && raw !== 'PRIVACY_OUTCOME_UNCONFIRMED' ? raw
      : readOnly && diagnostic.code === 'TIMEOUT' ? 'PRIVACY_STATUS_TIMEOUT'
      : readOnly && ['RATE_LIMITED', 'SERVICE_UNAVAILABLE', 'NETWORK_UNAVAILABLE'].includes(diagnostic.code) ? 'PRIVACY_STATUS_UNAVAILABLE'
      : [401, 403].includes(diagnostic.httpStatus) ? 'AUTH_REQUIRED' : 'PRIVACY_OUTCOME_UNCONFIRMED';
    // No raw exception, payload, token, identity or headers cross this boundary.
    throw failure(code);
  } finally { scheduler.clear(timer); signal?.removeEventListener('abort', abort); }
}
export const privacyAction = (action, payload, options = {}) => privacyRequest(action, payload, base44, options.timeoutMs ?? 20000, options);
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

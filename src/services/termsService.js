import { base44 } from '@/api/base44Client';
import { TERMS_URL, PRIVACY_URL, validTermsVersion, currentTerms } from '@/foundation/termsPolicy';
export { TERMS_URL, PRIVACY_URL, validTermsVersion, currentTerms } from '@/foundation/termsPolicy';

const error = (code, unknown = false) => Object.assign(new Error(code), { code, unknown });
/** @param {string} action @param {object} payload @param {{functions:{invoke:(name:string,body:object)=>Promise<{data:any}>}}} client @param {number} timeoutMs */
export async function termsRequest(action, payload = {}, client = base44, timeoutMs = 15000) {
  let timer;
  try {
    const response = await Promise.race([client.functions.invoke('termsAcceptance', { action, ...payload }), new Promise((_, reject) => { timer = setTimeout(() => reject(error('TERMS_STATE_UNAVAILABLE')), timeoutMs); })]);
    const value = response?.data;
    if (value?.error_code) throw error(value.error_code);
    const configured = validTermsVersion(value?.version);
    const valid = action === 'policy'
      ? value?.termsUrl === TERMS_URL && value?.privacyUrl === PRIVACY_URL && (value.state === 'READY' && configured || value.state === 'CONFIGURATION_REQUIRED' && value.version === null)
      : currentTerms(value) || value?.state === 'REQUIRED' && configured || value?.state === 'CONFIGURATION_REQUIRED' && value.version === null;
    if (!valid || action === 'accept' && !currentTerms(value)) throw error('TERMS_STATE_UNAVAILABLE');
    return value;
  } catch (failure) {
    const code = failure?.response?.data?.error_code || failure?.code;
    const definite = ['INVALID_REQUEST','TERMS_VERSION_CHANGED','TERMS_CONFIRMATION_REQUIRED','TERMS_CONFIGURATION_REQUIRED','AUTH_REQUIRED','ACCOUNT_DELETION_IN_PROGRESS'].includes(code);
    throw error(/^TERMS_|^AUTH_REQUIRED$|^ACCOUNT_DELETION_IN_PROGRESS$/.test(code || '') ? code : 'TERMS_STATE_UNAVAILABLE', action === 'accept' && !definite);
  } finally { clearTimeout(timer); }
}

// One-use, short-lived declaration intent, never an acceptance record or an
// identity lookup. Must match this OAuth callback's nonce before consumption.
const KEY = 'shinka.terms-intent.v1';
export function clearTermsIntent() { try { sessionStorage.removeItem(KEY); } catch { /* no browser authority */ } }
export function prepareTermsIntent(version, destination) {
  const nonce = crypto.randomUUID();
  try { sessionStorage.setItem(KEY, JSON.stringify({ nonce, version, createdAt: Date.now() })); }
  catch { throw error('TERMS_INTENT_UNAVAILABLE'); }
  const url = new URL(destination, window.location.origin);
  url.searchParams.set('terms_intent', nonce);
  return url.pathname + url.search;
}
export function takeTermsIntent() {
  try {
    const url = new URL(window.location.href), nonce = url.searchParams.get('terms_intent');
    const value = JSON.parse(sessionStorage.getItem(KEY) || 'null');
    clearTermsIntent();
    url.searchParams.delete('terms_intent');
    window.history.replaceState(window.history.state, '', url.pathname + url.search + url.hash);
    return nonce && value?.nonce === nonce && validTermsVersion(value.version) && Number.isFinite(value.createdAt) && Date.now() >= value.createdAt && Date.now() - value.createdAt <= 10 * 60 * 1000 ? value : null;
  } catch { clearTermsIntent(); return null; }
}
export function validateAuthDeclarations(ageConfirmed, { termsConfirmed = false, returning = false, version = null } = {}) {
  if (ageConfirmed !== true) return 'AGE_DECLARATION_REQUIRED';
  if (returning === true) return null; // Identity/acceptance checked AFTER OAuth; no app access yet.
  if (termsConfirmed !== true) return 'TERMS_CONFIRMATION_REQUIRED';
  return validTermsVersion(version) ? null : 'TERMS_CONFIGURATION_REQUIRED';
}

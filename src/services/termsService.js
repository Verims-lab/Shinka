import { base44 } from '@/api/base44Client';
import { TERMS_URL, PRIVACY_URL, validTermsVersion, currentTerms } from '@/foundation/termsPolicy';
export { TERMS_URL, PRIVACY_URL, validTermsVersion, currentTerms } from '@/foundation/termsPolicy';

const error = (code, unknown = false) => Object.assign(new Error(code), { code, unknown });
const CODES = new Set(['TERMS_VERSION_CHANGED','TERMS_CONFIRMATION_REQUIRED','TERMS_CONFIGURATION_REQUIRED','TERMS_STATE_UNAVAILABLE','TERMS_WRITE_UNCONFIRMED','AUTH_REQUIRED','ACCOUNT_DELETION_IN_PROGRESS','TERMS_FORBIDDEN','TERMS_RATE_LIMITED','TERMS_TEMPORARILY_UNAVAILABLE','TERMS_TIMEOUT','TERMS_INVALID_RESPONSE','TERMS_CANCELLED']);
/** @param {string} action @param {object} payload @param {{functions:{invoke:(name:string,body:object)=>Promise<{data:any}>}}} client @param {number} timeoutMs @param {{signal?:AbortSignal}} options */
export async function termsRequest(action, payload = {}, client = base44, timeoutMs = 15000, {signal} = {}) {
  let timer, abort;
  try {
    const response = await Promise.race([
      new Promise((_, reject) => {
        abort = () => reject(error('TERMS_CANCELLED'));
        if(signal?.aborted)return abort();
        signal?.addEventListener('abort',abort,{once:true});
        timer=setTimeout(()=>reject(error('TERMS_TIMEOUT')),timeoutMs);
      }),
      Promise.resolve().then(()=>{if(signal?.aborted)throw error('TERMS_CANCELLED');return client.functions.invoke('termsAcceptance',{action,...payload});}),
    ]);
    const value = response?.data;
    if (value?.error_code) throw error(value.error_code);
    const configured = validTermsVersion(value?.version);
    const valid = action === 'policy'
      ? value?.termsUrl === TERMS_URL && value?.privacyUrl === PRIVACY_URL && (value.state === 'READY' && configured || value.state === 'CONFIGURATION_REQUIRED' && value.version === null)
      : currentTerms(value) || value?.state === 'REQUIRED' && configured || value?.state === 'CONFIGURATION_REQUIRED' && value.version === null;
    if (!valid || action === 'accept' && !currentTerms(value)) throw error('TERMS_INVALID_RESPONSE');
    return value;
  } catch (failure) {
    const status=failure?.response?.status ?? failure?.status;
    const raw=failure?.response?.data?.error_code || failure?.code;
    const code=status===401?'AUTH_REQUIRED':status===403?(raw==='ACCOUNT_DELETION_IN_PROGRESS'?raw:'TERMS_FORBIDDEN'):status===429?'TERMS_RATE_LIMITED':status>=500&&!CODES.has(raw)?'TERMS_TEMPORARILY_UNAVAILABLE':CODES.has(raw)?raw:'TERMS_STATE_UNAVAILABLE';
    const definite = ['TERMS_VERSION_CHANGED','TERMS_CONFIRMATION_REQUIRED','TERMS_CONFIGURATION_REQUIRED','AUTH_REQUIRED','ACCOUNT_DELETION_IN_PROGRESS','TERMS_FORBIDDEN'].includes(code);
    throw error(code, action === 'accept' && !definite);
  } finally { clearTimeout(timer);signal?.removeEventListener('abort',abort); }
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
export function validateAuthDeclarations(ageConfirmed, { termsConfirmed = false, version = null } = {}) {
  if (ageConfirmed !== true) return 'AGE_DECLARATION_REQUIRED';
  if (termsConfirmed !== true) return 'TERMS_CONFIRMATION_REQUIRED';
  return validTermsVersion(version) ? null : 'TERMS_CONFIGURATION_REQUIRED';
}

// OAuth can identify an existing owner before a fresh acceptance is needed.
// App admission still requires current server-verified Terms for that owner.
/** @param {boolean} ageConfirmed @param {{termsConfirmed?:boolean,version?:string}} declarations */
export function validateProviderDeclarations(ageConfirmed, declarations = {}) {
  if (ageConfirmed !== true) return 'AGE_DECLARATION_REQUIRED';
  return declarations.termsConfirmed === true ? validateAuthDeclarations(ageConfirmed, declarations) : null;
}

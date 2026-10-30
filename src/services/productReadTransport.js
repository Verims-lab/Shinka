import { healthReadDiagnostic, sanitizeHealthDiagnostic } from '../../base44/shared/healthReadDiagnostics.js';
import { retryAfterMs } from '../../base44/shared/healthReadRetry.js';
export const productFailureEvidence = error => error?.diagnostic ? { ...sanitizeHealthDiagnostic(error.diagnostic), attempts: [1,2].includes(error.attempts) ? error.attempts : null } : null;
export const PRODUCT_READ_MS = 20000;
export const PRODUCT_TIMERS = { set: (fn, ms) => setTimeout(fn, ms), clear: id => clearTimeout(id) };
const failure = code => Object.assign(new Error(code), { code });
const rawCode = error => error?.data?.error_code ?? error?.response?.data?.error_code ?? error?.originalError?.response?.data?.error_code ?? error?.code;
const transportCodes = new Set(['RATE_LIMITED','SERVICE_UNAVAILABLE','TIMEOUT','NETWORK_UNAVAILABLE','ACCESS_DENIED']);
export const productPrivacyError = code => code !== 'TEST_LIFECYCLE_UNAVAILABLE' && /^(AUTH_|ACCESS_DENIED$|ACTIVE_|HEALTH_|CONSENT_|OWNER_|FORGED_|ACCOUNT_|ONBOARDING_|TEST_LIFECYCLE|TEST_OPERATION_|TEST_TARGET_|DUPLICATE_OWNER)/.test(code || '');

// The returned error is a closed, safe envelope. No raw exception/headers/body
// survives this boundary; Retry-After is a numeric scheduling hint only.
export function productReadError(error, accepts, fallback, stage, durationMs) {
  const diagnostic = healthReadDiagnostic(error, { stage, durationMs });
  const raw = rawCode(error);
  const code = diagnostic.code === 'ACCESS_DENIED' && !productPrivacyError(raw) ? 'ACCESS_DENIED'
    : accepts(raw) ? raw : transportCodes.has(diagnostic.code) ? diagnostic.code : fallback;
  const delay = error?.retryAfterMs ?? error?.data?.retry_after_ms ?? error?.response?.data?.retry_after_ms ?? error?.originalError?.response?.data?.retry_after_ms ?? retryAfterMs(error);
  return Object.assign(new Error(code), { code, diagnostic,
    retryAfterMs: Number.isFinite(delay) && delay >= 0 ? delay : null });
}

// One deadline for the entire read (including at most one paced retry).
// Cancellation only releases local timers/listeners; it does not cancel SDK IO.
/** @param {Function} invoke @param {any} options */
export async function productTransport(invoke, { readOnly, accepts, fallback, stage, timeoutMs = PRODUCT_READ_MS,
  timers = PRODUCT_TIMERS, now = () => performance.now(), signal = undefined } = {}) {
  const started = now(); let attempts = 0, deadlineTimer, pauseTimer, abort;
  const remaining = () => timeoutMs - (now() - started);
  const boundary = new Promise((_, reject) => {
    abort = () => reject(failure('READ_CANCELLED'));
    signal?.addEventListener('abort', abort, { once: true });
    deadlineTimer = timers.set(() => reject(failure('TIMEOUT')), timeoutMs);
  });
  try {
    if (signal?.aborted) throw failure('READ_CANCELLED');
    for (;;) {
      try {
        if (remaining() <= 0) throw failure('TIMEOUT');
        attempts++;
        const response = await Promise.race([Promise.resolve().then(() => { if (signal?.aborted) throw failure('READ_CANCELLED'); return invoke(); }), boundary]);
        // Timers may have been suspended while the SDK settled in background.
        if (remaining() <= 0) throw failure('TIMEOUT');
        if (response?.data?.error_code) throw { response };
        return response;
      } catch (error) {
        if (error?.code === 'READ_CANCELLED') throw error;
        const safe = productReadError(error, accepts, fallback, stage, Math.max(0, Math.round(now() - started)));
        const raw = rawCode(error);
        const wrapper = !raw || ['ERR_BAD_RESPONSE','ERR_BAD_REQUEST','CALENDAR_OPERATION_FAILED','PATTERN_READ_FAILED','TEST_LIFECYCLE_UNAVAILABLE','SESSION_UNAVAILABLE'].includes(raw);
        const status = error?.status ?? error?.response?.status ?? error?.originalError?.response?.status;
        const transient = !(status >= 400 && status < 500 && status !== 429) && wrapper && ['RATE_LIMITED','SERVICE_UNAVAILABLE'].includes(safe.diagnostic.code) && [429,503].includes(safe.diagnostic.httpStatus);
        const delay = Math.max(500, safe.retryAfterMs ?? 0);
        if (!readOnly || !transient || attempts >= 2 || remaining() <= delay + 250) {
          throw Object.assign(safe, { attempts });
        }
        await Promise.race([new Promise(resolve => { pauseTimer = timers.set(resolve, delay); }), boundary]);
        timers.clear(pauseTimer); pauseTimer = undefined;
      }
    }
  } catch (error) {
    if (error?.code === 'READ_CANCELLED') throw error;
    throw Object.assign(productReadError(error, accepts, fallback, stage, Math.max(0, Math.round(now() - started))), { attempts });
  } finally {
    timers.clear(deadlineTimer); timers.clear(pauseTimer);
    signal?.removeEventListener('abort', abort);
  }
}

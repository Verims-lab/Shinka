import { timingSafeEqual } from 'node:crypto';
import { InternalError } from './internalAuthorization.js';

// Shinka-only credential format: 32 random bytes encoded as 64 lowercase hex
// characters. No transport/header or Base44 secret-reference syntax is implied.
/** @param {unknown} value @returns {value is string} */
const valid = value => typeof value === 'string' && /^[a-f0-9]{64}$/.test(value);
/**
 * Backend-only prepared binding. The real entry does not install this callback.
 * Read on every admission, not module load; never mint a User/admin principal.
 * @param {{readSecret:()=>unknown|Promise<unknown>,readCredential:()=>unknown|Promise<unknown>}} readers
 * @returns {()=>Promise<void>}
 */
export function createNotificationMachineAdmission({ readSecret, readCredential }) {
  return async () => {
    let expected, supplied;
    try { expected = await readSecret(); } catch { /* Fail closed without raw error. */ }
    if (!valid(expected)) throw new InternalError('NOTIFICATION_AUTH_UNAVAILABLE',503);
    try { supplied = await readCredential(); } catch { /* No fallback to user auth. */ }
    if (!valid(supplied)) throw new InternalError('NOTIFICATION_MACHINE_AUTH_REQUIRED',401);
    // Public fixed-size format makes equal-length byte comparison explicit.
    if (!timingSafeEqual(new TextEncoder().encode(expected),new TextEncoder().encode(supplied)))
      throw new InternalError('NOTIFICATION_MACHINE_AUTH_REQUIRED',401);
  };
}

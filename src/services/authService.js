import { base44 } from "@/api/base44Client";
import { APPROVED_AUTH_METHODS } from "@/foundation/authPolicy";
import { AUTH_ERROR_CODES, safeAuthError } from "@/foundation/authErrors";
import { validateAuthDeclarations, prepareTermsIntent, clearTermsIntent } from './termsService';

/** @param {string} provider @param {string} returnTo @param {boolean} ageConfirmed @param {Pick<typeof base44.auth, 'loginWithProvider'>} [auth] @param {{termsConfirmed?:boolean,returning?:boolean,version?:string}} [declarations] */
export async function beginProviderAuth(provider, returnTo, ageConfirmed, auth = base44.auth, declarations = {}) {
  if (!APPROVED_AUTH_METHODS.includes(provider)) return { ok: false, code: AUTH_ERROR_CODES.UNSUPPORTED_METHOD };
  const invalid = validateAuthDeclarations(ageConfirmed, declarations);
  if (invalid) return { ok: false, code: invalid };
  try {
    clearTermsIntent();
    const destination = declarations.returning ? returnTo : prepareTermsIntent(declarations.version, returnTo);
    await auth.loginWithProvider(provider, destination);
    // Redirect initiated; this does not prove successful provider authentication.
    return { ok: true, code: null };
  } catch (error) {
    clearTermsIntent();
    return { ok: false, code: safeAuthError(error) };
  }
}

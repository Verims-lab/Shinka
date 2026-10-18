import { base44 } from "@/api/base44Client";
import { APPROVED_AUTH_METHODS } from "@/foundation/authPolicy";
import { AUTH_ERROR_CODES, safeAuthError } from "@/foundation/authErrors";

/** @param {string} provider @param {string} returnTo @param {boolean} ageConfirmed @param {Pick<typeof base44.auth, 'loginWithProvider'>} [auth] */
export async function beginProviderAuth(provider, returnTo, ageConfirmed, auth = base44.auth) {
  if (!APPROVED_AUTH_METHODS.includes(provider)) return { ok: false, code: AUTH_ERROR_CODES.UNSUPPORTED_METHOD };
  if (ageConfirmed !== true) return { ok: false, code: "AGE_DECLARATION_REQUIRED" };
  try {
    await auth.loginWithProvider(provider, returnTo);
    // Redirect initiated; this does not prove successful provider authentication.
    return { ok: true, code: null };
  } catch (error) {
    return { ok: false, code: safeAuthError(error) };
  }
}

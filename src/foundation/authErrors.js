// Auth errors cross the UI boundary only as allowlisted codes and localized copy keys.
export const AUTH_ERROR_CODES = Object.freeze({
  CANCELLED: "AUTH_CANCELLED", PROVIDER_FAILED: "AUTH_PROVIDER_FAILED",
  SESSION_FAILED: "AUTH_SESSION_FAILED", UNSUPPORTED_METHOD: "AUTH_UNSUPPORTED_METHOD",
});
// Session refresh failures: only proven invalidity ends access. Rate limits,
// 5xx, timeouts, network loss and unknown transport stay UNVERIFIED (retryable).
const INVALID_SESSION_CODES = new Set(["AUTH_REQUIRED", "ACCOUNT_DELETION_IN_PROGRESS", "APPLICATION_SESSION_UNVERIFIED", "AUTH_SESSION_REQUIRED"]);
/** @param {any} error @returns {'INVALID'|'UNVERIFIED'} */
export function classifySessionFailure(error) {
  const status = error?.status ?? error?.response?.status;
  const code = error?.response?.data?.error_code ?? error?.data?.error_code ?? error?.message;
  if (INVALID_SESSION_CODES.has(code)) return "INVALID";
  if (status === 401 || status === 403) return "INVALID";
  return "UNVERIFIED";
}
/** @param {unknown} error @param {'provider'|'session'} [phase] */
export function safeAuthError(error, phase = "provider") {
  const code = error && typeof error === "object" && "code" in error ? String(error.code) : "";
  if (["AUTH_CANCELLED", "ERR_CANCELED", "access_denied", "popup_closed_by_user"].includes(code)) return AUTH_ERROR_CODES.CANCELLED;
  if (code === AUTH_ERROR_CODES.UNSUPPORTED_METHOD) return code;
  return phase === "session" ? AUTH_ERROR_CODES.SESSION_FAILED : AUTH_ERROR_CODES.PROVIDER_FAILED;
}
// Auth errors cross the UI boundary only as allowlisted codes and localized copy keys.
export const AUTH_ERROR_CODES = Object.freeze({
  CANCELLED: "AUTH_CANCELLED", PROVIDER_FAILED: "AUTH_PROVIDER_FAILED",
  SESSION_FAILED: "AUTH_SESSION_FAILED", UNSUPPORTED_METHOD: "AUTH_UNSUPPORTED_METHOD",
});
/** @param {unknown} error @param {'provider'|'session'} [phase] */
export function safeAuthError(error, phase = "provider") {
  const code = error && typeof error === "object" && "code" in error ? String(error.code) : "";
  if (["AUTH_CANCELLED", "ERR_CANCELED", "access_denied", "popup_closed_by_user"].includes(code)) return AUTH_ERROR_CODES.CANCELLED;
  if (code === AUTH_ERROR_CODES.UNSUPPORTED_METHOD) return code;
  return phase === "session" ? AUTH_ERROR_CODES.SESSION_FAILED : AUTH_ERROR_CODES.PROVIDER_FAILED;
}

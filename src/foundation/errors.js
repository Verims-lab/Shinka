// Error taxonomy: machine-readable internal codes + safe user-facing copy. Never leak raw provider errors.
export const ERROR_CODES = {
  AUTH_REQUIRED: "AUTH_REQUIRED",
  FORBIDDEN: "FORBIDDEN",
  NOT_FOUND: "NOT_FOUND",
  TIMEOUT: "TIMEOUT",
  NETWORK: "NETWORK",
  BACKEND_FAILED: "BACKEND_FAILED",
  UNEXPECTED: "UNEXPECTED",
  HEALTH_HISTORY_PERSIST_FAILED: "HEALTH_HISTORY_PERSIST_FAILED",
};

const SAFE_COPY = {
  AUTH_REQUIRED: "Please sign in again.",
  FORBIDDEN: "You don't have access to this area.",
  NOT_FOUND: "This item could not be found.",
  TIMEOUT: "This is taking too long. Please retry.",
  NETWORK: "Connection problem. Please retry.",
  BACKEND_FAILED: "The service could not complete this request.",
  UNEXPECTED: "Something went wrong.",
};

export class ShinkaError extends Error {
  constructor(code, detail) {
    super(code);
    this.code = code;
    this.detail = detail;
  }
}

export const httpStatusOf = (e) => e?.status ?? e?.response?.status ?? null;

export function classifyError(e) {
  if (e instanceof ShinkaError) return e.code;
  const s = httpStatusOf(e);
  if (s === 401) return ERROR_CODES.AUTH_REQUIRED;
  if (s === 403) return ERROR_CODES.FORBIDDEN;
  if (s === 404) return ERROR_CODES.NOT_FOUND;
  if (s && s >= 500) return ERROR_CODES.BACKEND_FAILED;
  if (/network/i.test(e?.message || "")) return ERROR_CODES.NETWORK;
  return ERROR_CODES.UNEXPECTED;
}

export const safeMessage = (code) => SAFE_COPY[code] || SAFE_COPY.UNEXPECTED;

export function withTimeout(promise, ms) {
  let t;
  const timer = new Promise((_, rej) => { t = setTimeout(() => rej(new ShinkaError(ERROR_CODES.TIMEOUT, `>${ms}ms`)), ms); });
  return Promise.race([promise, timer]).finally(() => clearTimeout(t));
}
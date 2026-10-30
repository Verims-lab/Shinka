// Retry-After is transport metadata, never an exception message or report field.
export function retryAfterMs(error, now = Date.now()) {
  const headers = error?.response?.headers ?? error?.originalError?.response?.headers ?? error?.headers;
  const raw = headers?.get?.('retry-after') ?? headers?.['retry-after'] ?? headers?.['Retry-After'];
  if (typeof raw !== 'string' && typeof raw !== 'number') return null;
  const value = String(raw).trim();
  if (/^\d+(\.\d+)?$/.test(value)) {
    const ms = Number(value) * 1000;
    return Number.isFinite(ms) ? Math.ceil(ms) : null;
  }
  // HTTP-date is explicitly GMT; no guessed local timezone.
  if (!/ GMT$/.test(value)) return null;
  const date = Date.parse(value);
  return Number.isFinite(date) ? Math.max(0, date - now) : null;
}

export function healthReadRetryAllowed(name, body, error, diagnostic) {
  const readOnly = (name === 'contentLibrary' && ['verify', 'moonDryRun'].includes(body?.action)) ||
    (name === 'internalHealth' && ['contentCounts', 'nativeReadiness'].includes(body?.action)) ||
    (name === 'validateContentArtifacts' && body?.mode === 'live');
  const status = error?.status ?? error?.response?.status ?? error?.originalError?.response?.status;
  // Never override real authorization/client errors using an inner diagnostic.
  return readOnly && !([401, 403].includes(status) || (status >= 400 && status < 500 && status !== 429)) &&
    diagnostic.code === 'RATE_LIMITED' && diagnostic.httpStatus === 429;
}

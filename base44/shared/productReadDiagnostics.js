import { InternalError } from './internalAuthorization.js';
import { healthReadDiagnostic } from './healthReadDiagnostics.js';
import { retryAfterMs } from './healthReadRetry.js';
// Preserve the underlying read stage/status, never the SDK body or message.
export function productFailureResponse(error, fallback, status, stage, started, { rateLimited = false, requestId = null, retryDelay = null } = {}) {
  const diagnostic = healthReadDiagnostic(error, { stage, durationMs: Date.now() - started });
  diagnostic.requestId ||= requestId || crypto.randomUUID();
  const delay = error?.retryAfterMs ?? retryAfterMs(error) ?? (rateLimited && diagnostic.code === 'RATE_LIMITED' && diagnostic.httpStatus === 429 ? retryDelay : null);
  const rawStatus = error?.status ?? error?.response?.status;
  const throttled = rateLimited && ![401,403].includes(rawStatus) && diagnostic.code === 'RATE_LIMITED' && diagnostic.httpStatus === 429;
  return Response.json({ error_code: error instanceof InternalError ? error.code : fallback,
    diagnostic, ...(Number.isFinite(delay) && delay >= 0 ? { retry_after_ms: delay } : {}) },
  { status: throttled ? 429 : error instanceof InternalError ? error.status : status, ...(throttled && Number.isFinite(delay) && delay >= 0 ? { headers: { 'Retry-After': String(Math.ceil(delay / 1000)) } } : {}) });
}

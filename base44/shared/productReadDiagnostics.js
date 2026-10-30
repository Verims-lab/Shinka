import { InternalError } from './internalAuthorization.js';
import { healthReadDiagnostic } from './healthReadDiagnostics.js';
import { retryAfterMs } from './healthReadRetry.js';
// Preserve the underlying read stage/status, never the SDK body or message.
export function productFailureResponse(error, fallback, status, stage, started) {
  const diagnostic = healthReadDiagnostic(error, { stage, durationMs: Date.now() - started });
  diagnostic.requestId ||= crypto.randomUUID();
  const delay = error?.retryAfterMs ?? retryAfterMs(error);
  return Response.json({ error_code: error instanceof InternalError ? error.code : fallback,
    diagnostic, ...(Number.isFinite(delay) && delay >= 0 ? { retry_after_ms: delay } : {}) },
  { status: error instanceof InternalError ? error.status : status });
}

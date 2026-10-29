// Closed diagnostic vocabulary shared by server and Health UI. Never serialize
// messages, response bodies, URLs, query values, headers or arbitrary SDK codes.
const CODES = new Set(['UNKNOWN', 'NOT_FOUND', 'ACCESS_DENIED', 'INVALID_QUERY', 'SDK_METHOD_UNAVAILABLE', 'INVALID_RESPONSE', 'TIMEOUT', 'RATE_LIMITED', 'SERVICE_UNAVAILABLE', 'NETWORK_UNAVAILABLE', 'ARTIFACT_PARSE_FAILED', 'ARTIFACT_VALIDATION_FAILED', 'AUTH_REQUIRED', 'FORBIDDEN_INTERNAL_TOOLING', 'TEST_LIFECYCLE_UNAVAILABLE', 'PRIVACY_STATE_UNCONFIRMED', 'ACCOUNT_DELETION_IN_PROGRESS']);
const STAGES = new Set(['ONBOARDING_HYDRATE', 'DAILY_PROFILE', 'DAILY_EXISTING', 'DAILY_CONTENT_REFERENCE', 'DAILY_SELECTION', 'DAILY_PERSISTENCE', 'DAILY_READBACK', 'SESSION_AUTH_LIFECYCLE', 'SESSION_AUTH', 'LIFECYCLE_READ', 'LIFECYCLE_USER_READ', 'LIFECYCLE_PRIVACY_READ', 'LIFECYCLE_OPERATION_READ', 'OPERATION', 'ENTITY_READ', 'CONTENT_COUNT', 'ARTIFACT_DOWNLOAD', 'ARTIFACT_PARSE', 'ARTIFACT_VALIDATION', 'FUNCTION_INVOKE']);
const ADMISSION_CODES = new Set(['AUTH_REQUIRED', 'FORBIDDEN_INTERNAL_TOOLING', 'TEST_LIFECYCLE_UNAVAILABLE', 'PRIVACY_STATE_UNCONFIRMED', 'ACCOUNT_DELETION_IN_PROGRESS']);
const uuid = value => typeof value === 'string' && /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(value) ? value : null;
const status = value => Number.isInteger(value) && value >= 100 && value <= 599 ? value : null;
export function sanitizeHealthDiagnostic(value) {
  return {
    code: CODES.has(value?.code) ? value.code : 'UNKNOWN',
    httpStatus: status(value?.httpStatus),
    stage: STAGES.has(value?.stage) ? value.stage : 'FUNCTION_INVOKE',
    durationMs: Number.isSafeInteger(value?.durationMs) && value.durationMs >= 0 && value.durationMs <= 3600000 ? value.durationMs : null,
    requestId: uuid(value?.requestId),
  };
}
export function healthReadDiagnostic(error, { stage = 'FUNCTION_INVOKE', durationMs = null } = {}) {
  const data = error?.data ?? error?.response?.data ?? error?.originalError?.response?.data;
  const saved = error?.diagnostic ?? data?.diagnostic;
  const httpStatus = status(error?.status ?? error?.response?.status ?? error?.originalError?.response?.status);
  if ([401,403].includes(httpStatus)) return sanitizeHealthDiagnostic({ code:'ACCESS_DENIED', httpStatus, stage:saved?.stage ?? stage, durationMs:saved?.durationMs ?? durationMs, requestId:data?.request_id ?? saved?.requestId });
  if (saved) return sanitizeHealthDiagnostic({ ...saved, durationMs: saved.durationMs ?? durationMs, requestId: data?.request_id ?? saved.requestId });
  const rawCode = data?.error_code ?? data?.error?.code ?? data?.code ?? error?.code;
  // HTTP status is evidence of a failure class, not proof of the underlying
  // schema/policy/deployment cause. In particular, a 404 is only NOT_FOUND.
  const code = ADMISSION_CODES.has(rawCode) ? rawCode
    : httpStatus === 429 ? 'RATE_LIMITED'
    : httpStatus === 408 || httpStatus === 504 || ['ETIMEDOUT', 'ECONNABORTED', 'TIMEOUT'].includes(rawCode) || error?.name === 'TimeoutError' ? 'TIMEOUT'
    : httpStatus === 401 || httpStatus === 403 ? 'ACCESS_DENIED'
    : httpStatus === 404 ? 'NOT_FOUND'
    : httpStatus === 400 || httpStatus === 422 ? 'INVALID_QUERY'
    : httpStatus >= 500 ? 'SERVICE_UNAVAILABLE'
    : rawCode === 'ERR_NETWORK' ? 'NETWORK_UNAVAILABLE'
    : CODES.has(rawCode) ? rawCode : 'UNKNOWN';
  return sanitizeHealthDiagnostic({ code, httpStatus, stage: data?.stage ?? stage, durationMs, requestId: data?.request_id });
}
export const healthReadError = code => Object.assign(new Error(code), { code });

// Unknown/unavailable evidence cannot prove a mismatch. Explicit authorization,
// client/shape failures and artifact corruption remain failures, never transient.
export function healthReadFailureStatus(diagnostic) {
  if (diagnostic.httpStatus >= 400 && diagnostic.httpStatus < 500 && ![408,429].includes(diagnostic.httpStatus)) return 'FAIL';
  return ['ACCESS_DENIED','AUTH_REQUIRED','FORBIDDEN_INTERNAL_TOOLING','INVALID_RESPONSE','INVALID_QUERY','NOT_FOUND','SDK_METHOD_UNAVAILABLE','ARTIFACT_PARSE_FAILED','ARTIFACT_VALIDATION_FAILED'].includes(diagnostic.code) ? 'FAIL' : 'BLOCKED';
}
export function healthReadAttempt(error) {
  const value = error?.readAttempt;
  return value && [0,1,2].includes(value.attempts) && ['NOT_RETRYABLE','EXHAUSTED','BUDGET_EXHAUSTED','CANCELLED'].includes(value.state) && Number.isFinite(value.elapsedMs) && value.elapsedMs >= 0 && value.elapsedMs <= 3600000
    ? { attempts: value.attempts, state: value.state, elapsedMs: value.elapsedMs } : null;
}

import { healthReadDiagnostic, sanitizeHealthDiagnostic } from './healthReadDiagnostics.js';
import { retryAfterMs } from './healthReadRetry.js';

export const CALENDAR_BACKEND_VERSION = 'calendar-readback/093';
const entities = new Set(['AUTH', 'User', 'UserProfile', 'UserPreferences', 'UserPrivacyRequest', 'UserTermsAcceptance', 'AdminTestOperation', 'UserHealthConsent', 'UserHealthConsentEvent', 'HealthDataDeletionJob', 'UserPeriodRecord', 'UserCycleSettings', 'UserCyclePrediction', 'UserCyclePhaseDay', 'UserCalendarAction']);
const methods = new Set(['filter', 'create', 'update', 'updateMany', 'delete', 'deleteMany']);
// Request-local transport policy, not an authority/result cache. Each confirmation
// pass and every lifecycle/privacy/Terms/write guard still performs its own read.
export function createCalendarReadContext({ now = () => Date.now(), sleep = ms => new Promise(resolve => setTimeout(resolve, ms)), emit = (event, data) => console.info(event, data) } = {}) {
  const started = now(), requestId = crypto.randomUUID();
  let current = 'CALENDAR_READ', closed = false, retries = 0, reads = 0, writes = 0, cooldown = null;
  const log = (event, data = {}) => emit(event, { sourceVersion: CALENDAR_BACKEND_VERSION, requestId, stage: current, elapsedMs: Math.max(0, now() - started), reads, writes, retries, ...data });
  const stage = name => {
    const safe = sanitizeHealthDiagnostic({ stage: name }).stage;
    if (current !== safe) { log('SHINKA_CALENDAR_STAGE', { phase: 'END' }); current = safe; log('SHINKA_CALENDAR_STAGE', { phase: 'START' }); }
  };
  const invoke = async (entity, method, work, readOnly) => {
    const atStage = current;
    for (let attempt = 1; attempt <= 2; attempt++) {
      if (readOnly) reads++; else writes++;
      const write = !readOnly && entities.has(entity) && methods.has(method);
      if (write) log('SHINKA_CALENDAR_WRITE', { entity, method, phase: 'START', stage: atStage });
      try {
        const result = await work();
        if (write) log('SHINKA_CALENDAR_WRITE', { entity, method, phase: 'END', stage: atStage });
        return result;
      }
      catch (error) {
        const diagnostic = healthReadDiagnostic(error, { stage: atStage });
        const safe = { entity: entities.has(entity) ? entity : 'OTHER', method: methods.has(method) || method === 'me' ? method : 'OTHER', attempt, stage: atStage, code: diagnostic.code, httpStatus: diagnostic.httpStatus };
        log('SHINKA_CALENDAR_IO_FAILURE', safe);
        // Only a completed raw HTTP429 read rejection may be retried. SDK writes
        // run once, even if their reply is lost or any later guard/read fails.
        const status = error?.status ?? error?.response?.status;
        const hint = retryAfterMs(error, now());
        if (status === 429 && hint !== null) cooldown = Math.max(cooldown ?? 0, now() + hint);
        const delay = Math.max(500, hint ?? 0);
        if (!readOnly || status !== 429 || attempt !== 1 || retries >= 2 || closed || now() - started + delay + 1000 > 18000) throw error;
        retries++; log('SHINKA_CALENDAR_READ_RETRY', { ...safe, delayMs: delay });
        await sleep(delay);
        if (closed || now() - started + 1000 > 18000) throw error;
      }
    }
  };
  return { requestId, stage, invoke, retryDelay: () => cooldown === null ? null : Math.max(0, cooldown - now()), close: () => { if (!closed) log('SHINKA_CALENDAR_STAGE', { phase: 'END' }); closed = true; } };
}

// Install BELOW lifecycle/Terms/write wrappers so their real GETs are covered,
// without ever retrying a composite mutation or its uncertain side effects.
export function withCalendarReads(client, context) {
  if (!context) return client;
  const wrapped = new Proxy(client.asServiceRole.entities, { get(target, name) {
    const entity = target[name];
    return new Proxy(entity, { get(handler, method) {
      const work = handler[method];
      if (typeof work !== 'function') return work;
      return (...args) => context.invoke(String(name), String(method), () => work.apply(handler, args), method === 'filter');
    } });
  } });
  return { ...client, auth: { ...client.auth, me: (...args) => context.invoke('AUTH', 'me', () => client.auth.me(...args), true) }, asServiceRole: { ...client.asServiceRole, entities: wrapped } };
}

import { InternalError } from './internalAuthorization.js';

// Request-local counters. Never retain SDK arguments, records or raw exceptions.
/** @param {{clock?:()=>number, emit?:(record:object)=>void}} [options] */
export function testOperationDiagnostics({ clock = () => performance.now(), emit = () => {} } = {}) {
  const started = clock();
  let stage = 'SESSION', operationId = null, calls = 0, writes = 0, stageStart = started, stageCalls = 0;
  const snapshot = (event, extra = {}) => ({ event, operationId, stage, calls, writes,
    elapsedMs: Math.round(clock() - started), stageMs: Math.round(clock() - stageStart), stageCalls: calls - stageCalls, ...extra });
  const log = (event, extra = {}) => { try { emit(snapshot(event, extra)); } catch { /* Diagnostics cannot change an operation. */ } };
  return {
    bind(id) { operationId = typeof id === 'string' && /^[a-zA-Z0-9_-]{1,100}$/.test(id) ? id : null; },
    stage(value) { stage = value.toUpperCase(); stageStart = clock(); stageCalls = calls; log('STAGE_START'); },
    end() { log('STAGE_END'); },
    snapshot,
    wrap(client) {
      return { ...client, asServiceRole: { ...client.asServiceRole, entities: new Proxy(client.asServiceRole.entities, {
        get(entities, name) { return new Proxy(entities[name], { get(entity, method) {
          const value = entity[method];
          if (typeof value !== 'function') return value;
          return async (...args) => {
            calls++;
            const mutation = ['create', 'update', 'delete'].includes(String(method));
            if (mutation) { writes++; log('SDK_WRITE_START', { sdk: `${String(name)}.${String(method)}` }); }
            try { return await value.apply(entity, args); }
            catch (cause) {
              const error = safeTestOperationError(cause, stage);
              log('SDK_FAILURE', { sdk: `${String(name)}.${String(method)}`, code: error.code });
              throw error;
            }
          };
        } }); },
      }) } };
    },
  };
}

export function safeTestOperationError(cause, stage) {
  const status = cause?.response?.status || cause?.status;
  const code = status === 401 || status === 403 ? 'TEST_STORAGE_ACCESS_DENIED'
    : status === 404 ? 'TEST_STORAGE_NOT_FOUND'
    : status === 429 ? 'TEST_STORAGE_RATE_LIMITED'
    : 'TEST_STORAGE_UNAVAILABLE';
  const error = cause instanceof InternalError ? cause : new InternalError(code, status === 401 || status === 403 ? 403 : 503);
  error.stage ||= String(stage).toUpperCase();
  return error;
}

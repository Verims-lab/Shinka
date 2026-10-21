import { base44 } from '@/api/base44Client';
import { ShinkaError, classifyError, withTimeout } from '@/foundation/errors';
import { healthReadDiagnostic } from '../../../base44/shared/healthReadDiagnostics.js';

// One bounded invocation, no retry. Run-level memoization belongs to context.js.
export async function invokeHealthRead(name, body, invoke = (name, body) => base44.functions.invoke(name, body)) {
  const started = Date.now();
  try { return (await withTimeout(invoke(name, body), 18000)).data; }
  catch (error) {
    const failure = new ShinkaError(classifyError(error));
    Object.assign(failure, { diagnostic: healthReadDiagnostic(error, { durationMs: Date.now() - started }) });
    throw failure;
  }
}

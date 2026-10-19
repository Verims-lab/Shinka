import { InternalError } from './internalAuthorization.js';

// Explicit, bounded warm-worker coalescing only. No distributed lock, receipt,
// transaction or durable ownership is implied. Only pending requests are held.
export function createOnboardingCycleGate(limit = 256) {
  const pending = new Map();
  return {
    run(owner, requestKey, work) {
      const existing = pending.get(owner);
      if (existing) {
        if (existing.requestKey !== requestKey) throw new InternalError('ACTION_CONFLICT', 409);
        return existing.promise;
      }
      if (pending.size >= limit) throw new InternalError('ONBOARDING_BUSY', 503);
      const promise = Promise.resolve().then(work).finally(() => pending.delete(owner));
      pending.set(owner, { requestKey, promise });
      return promise;
    },
  };
}
export const onboardingCycleGate = createOnboardingCycleGate();

import { createTestRepository } from './adminTestRepository.js';
import { testToolError } from './adminTestPolicy.js';
import { InternalError } from './internalAuthorization.js';

// Additional early admission guard, NOT a distributed write fence. Destructive
// operations remain disabled until all writers share a verified coordinator.
export function withUserLifecycle(client) {
  const repository = createTestRepository(client);
  const wrapped = { ...client };
  Object.defineProperty(wrapped, 'auth', { value: {
    ...client.auth,
    async me() {
      const me = await client.auth.me();
      if (!me?.id) testToolError('AUTH_REQUIRED', 401);
      try {
        const user = await repository.user(me.id);
        if (!user) testToolError('AUTH_REQUIRED', 401);
        const current = await repository.lifecycle(me.id);
        if (current?.operation === 'DELETE_USER') testToolError('ACCOUNT_DELETION_IN_PROGRESS', 403);
        return { id: user.id, role: user.role };
      } catch (error) {
        if (error instanceof InternalError) throw error;
        testToolError('TEST_LIFECYCLE_UNAVAILABLE', 503);
      }
    },
  } });
  wrapped.shinkaLifecycle = owner => repository.lifecycle(owner);
  return wrapped;
}
export async function readUserLifecycle(client, owner) {
  return typeof client.shinkaLifecycle === 'function' ? client.shinkaLifecycle(owner) : null;
}
export const resetRoute = row => ({
  PROFILE: 'AUTHENTICATED_PROFILE_REQUIRED',
  CYCLE: 'AUTHENTICATED_CYCLE_STEP',
  FIRST_SHINKA: 'FIRST_SHINKA_DEPENDENCY',
})[row.stage];

// The durable adapter atomically commits normal validated writes + progress +
// request receipt. It must recheck current identity, ACTIVE/deletion/consent
// predicates and operation revision inside its transaction. Not implemented by
// SDK list/update. No health payload is stored in the operation journal.
export async function resetOnboardingStep({ client, reset, owner, body, coordinator, perform }) {
  if (typeof coordinator?.resetStep !== 'function') testToolError('ADMIN_TEST_DURABLE_CAPABILITY_REQUIRED', 503);
  const expected = { initialize: 'PROFILE', saveProfile: 'PROFILE', saveCycle: 'CYCLE', skipCycle: 'CYCLE', today: 'FIRST_SHINKA' }[body.action];
  if (!expected || reset.status !== 'RESET_ACTIVE') testToolError('TEST_RESET_STEP_CONFLICT');
  const nextStage = body.action === 'initialize' ? 'PROFILE' : { PROFILE: 'CYCLE', CYCLE: 'FIRST_SHINKA', FIRST_SHINKA: 'DONE' }[expected];
  const result = await coordinator.resetStep({ owner, operationId: reset.operation_id, expectedStage: expected, body }, async context => {
    const method = { initialize: 'savePreferences', saveProfile: 'saveProfile', saveCycle: 'saveCycle' }[body.action];
    if (method && typeof context?.persistence?.[method] !== 'function') testToolError('TEST_RESET_PERSISTENCE_REQUIRED', 503);
    const result = await perform(context);
    if (body.action === 'initialize' && result.state !== 'AUTHENTICATED_PROFILE_REQUIRED') testToolError('TEST_RESET_STEP_UNCONFIRMED');
    if (body.action === 'saveProfile' && result.state !== 'AUTHENTICATED_CYCLE_STEP') testToolError('PROFILE_COMPLETION_REQUIRED');
    if (['saveCycle', 'skipCycle'].includes(body.action) && result.state !== 'FIRST_SHINKA_DEPENDENCY') testToolError('TEST_RESET_STEP_UNCONFIRMED');
    if (body.action === 'today' && (!result.persisted || !result.daily?.id || result.state !== 'ACTIVE_EXISTING_USER')) testToolError('TEST_RESET_STEP_UNCONFIRMED');
    return { result, nextStage };
  });
  const repository = createTestRepository(client);
  const saved = await repository.operation(owner, reset.operation_id);
  const current = await repository.lifecycle(owner);
  if (!saved || saved.operation !== 'RESET_ONBOARDING' || saved.actor_id !== reset.actor_id || current && current.operation_id !== reset.operation_id) testToolError('TEST_RESET_STEP_UNCONFIRMED');
  const stages = ['PROFILE', 'CYCLE', 'FIRST_SHINKA', 'DONE'];
  if (!['RESET_ACTIVE', 'COMPLETED'].includes(saved.status) || stages.indexOf(saved.stage) < stages.indexOf(nextStage)) testToolError('TEST_RESET_STEP_UNCONFIRMED');
  return { ...result, state: saved.status === 'COMPLETED' ? 'ACTIVE_EXISTING_USER' : resetRoute(saved) };
}

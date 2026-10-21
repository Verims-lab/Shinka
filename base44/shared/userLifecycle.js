import { createTestRepository } from './adminTestRepository.js';
import { testToolError } from './adminTestPolicy.js';
import { InternalError } from './internalAuthorization.js';
import { nativeResetStep } from './nativeResetStep.js';
import { assertPrivacyAccess } from './privacyPolicy.js';
import { healthReadDiagnostic } from './healthReadDiagnostics.js';

// Fresh actor admission; completed DELETE remains a permanent target tombstone.
// Per-write target admission is separate and is not a distributed fence.
export function withUserLifecycle(client) {
  const repository = createTestRepository(client);
  const wrapped = { ...client };
  Object.defineProperty(wrapped, 'auth', { value: {
    ...client.auth,
    async me() {
      const me = await client.auth.me();
      if (!me?.id) testToolError('AUTH_REQUIRED', 401);
      const started = Date.now();
      try {
        const user = await repository.user(me.id);
        if (!user) testToolError('AUTH_REQUIRED', 401);
        await assertPrivacyAccess(client, me.id);
        const current = await repository.lifecycle(me.id);
        if (current?.operation === 'DELETE_USER') testToolError('ACCOUNT_DELETION_IN_PROGRESS', 403);
        return { id: user.id, role: user.role };
      } catch (error) {
        if (error instanceof InternalError) throw error;
        const failure = new InternalError('TEST_LIFECYCLE_UNAVAILABLE', 503);
        failure.diagnostic = healthReadDiagnostic(error, { stage: 'LIFECYCLE_READ', durationMs: Date.now() - started });
        throw failure;
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

// Native steps verify normal writes before advancing progress, and retain an
// intent fingerprint for recovery. The legacy coordinator remains a protocol
// test fixture only. Neither native path claims a transaction.
export async function resetOnboardingStep({ client, reset, owner, body, coordinator, perform }) {
  if (!client.shinkaNative && typeof coordinator?.resetStep !== 'function') testToolError('ADMIN_TEST_DURABLE_CAPABILITY_REQUIRED', 503);
  const expected = { initialize: 'PROFILE', saveProfile: 'PROFILE', saveCycle: 'CYCLE', skipCycle: 'CYCLE', today: 'FIRST_SHINKA' }[body.action];
  if (!expected || reset.status !== 'RESET_ACTIVE') testToolError('TEST_RESET_STEP_CONFLICT');
  const nextStage = body.action === 'initialize' ? 'PROFILE' : { PROFILE: 'CYCLE', CYCLE: 'FIRST_SHINKA', FIRST_SHINKA: 'DONE' }[expected];
  const performStep = async context => {
    const method = { initialize: 'savePreferences', saveProfile: 'saveProfile', saveCycle: 'saveCycle' }[body.action];
    if (method && typeof context?.persistence?.[method] !== 'function') testToolError('TEST_RESET_PERSISTENCE_REQUIRED', 503);
    const result = await perform(context);
    if (body.action === 'initialize' && result.state !== 'AUTHENTICATED_PROFILE_REQUIRED') testToolError('TEST_RESET_STEP_UNCONFIRMED');
    if (body.action === 'saveProfile' && result.state !== 'AUTHENTICATED_CYCLE_STEP') testToolError('PROFILE_COMPLETION_REQUIRED');
    if (['saveCycle', 'skipCycle'].includes(body.action) && result.state !== 'FIRST_SHINKA_DEPENDENCY') testToolError('TEST_RESET_STEP_UNCONFIRMED');
    if (body.action === 'today' && (!result.persisted || !result.daily?.id || result.state !== 'ACTIVE_EXISTING_USER')) testToolError('TEST_RESET_STEP_UNCONFIRMED');
    return { result, nextStage };
  };
  const result = client.shinkaNative
    ? await nativeResetStep({ client, reset, owner, body, perform: performStep, expected, nextStage })
    : await coordinator.resetStep({ owner, operationId: reset.operation_id, expectedStage: expected, body }, performStep);
  const repository = createTestRepository(client);
  const saved = await repository.operation(owner, reset.operation_id);
  const current = await repository.lifecycle(owner);
  if (!saved || saved.operation !== 'RESET_ONBOARDING' || saved.actor_id !== reset.actor_id || current && current.operation_id !== reset.operation_id) testToolError('TEST_RESET_STEP_UNCONFIRMED');
  const stages = ['PROFILE', 'CYCLE', 'FIRST_SHINKA', 'DONE'];
  if (!['RESET_ACTIVE', 'COMPLETED'].includes(saved.status) || stages.indexOf(saved.stage) < stages.indexOf(nextStage)) testToolError('TEST_RESET_STEP_UNCONFIRMED');
  return { ...result, state: saved.status === 'COMPLETED' ? 'ACTIVE_EXISTING_USER' : resetRoute(saved) };
}

import { InternalError, requireAuthenticatedUser } from './internalAuthorization.js';
import { readBoundedJson } from './boundedJson.js';
import { createTestRepository } from './adminTestRepository.js';
import { privacyRepository } from './privacyRepository.js';
import { privacyFail, PRIVACY_KINDS, readPrivacyRequests } from './privacyPolicy.js';
import { runWithdrawal, withdrawalState } from './privacyWithdrawal.js';
import { runAccountDeletion, accountRemovalState } from './privacyAccountDeletion.js';
import { createOnboardingCycleGate } from './onboardingCycleGate.js';
import { validatedOnboardingGrant } from './onboardingConsent.js';
import { HEALTH_CONSENT_VERSION } from './onboardingDependencies.js';

const warmGate = createOnboardingCycleGate(); // Warm-worker coalescing only.
const secretValid = value => typeof value === 'string' && /^[a-f0-9]{64}$/.test(value);
export async function privacyOperation(client, body, { now = () => new Date(), gate = warmGate } = {}) {
  if (!body || typeof body !== 'object' || Array.isArray(body) || !['read', 'begin', 'resume', 'status'].includes(body.action) || Object.keys(body).some(key => !['action', 'kind', 'confirmed', 'recovery_key'].includes(key))) privacyFail('INVALID_REQUEST', 400);
  if (body.action !== 'read' && !PRIVACY_KINDS.includes(body.kind)) privacyFail('INVALID_REQUEST', 400);
  if (body.recovery_key !== undefined && !secretValid(body.recovery_key)) privacyFail('INVALID_REQUEST', 400);
  const repo = privacyRepository(client, now), adminRepository = createTestRepository(client);
  const project = async request => {
    if (!request) return { state: 'IDLE', kind: body.kind || null, permanentDeletionVerified: false };
    if (request.kind === 'DELETE_ACCOUNT') {
      const result = await accountRemovalState(repo, request);
      return { kind: request.kind, state: result.activeRemoved ? 'PLATFORM_PENDING' : result.userPresent ? 'IN_PROGRESS' : 'PLATFORM_REVIEW_REQUIRED', activeDataRemoved: result.activeRemoved, permanentDeletionVerified: false };
    }
    const result = await withdrawalState(repo, request);
    return { kind: request.kind, state: result.complete ? 'HEALTH_CLEANUP_COMPLETED' : 'IN_PROGRESS', consentWithdrawn: result.withdrawn, healthCleanupVerified: result.complete, permanentDeletionVerified: false };
  };
  // Only read-only, non-identifying outcome is available through a separate
  // 256-bit receipt after auth removal. Operation IDs never authorize anything.
  if (body.action === 'status' && body.kind === 'DELETE_ACCOUNT' && body.recovery_key) return project(await repo.recover(body.recovery_key));
  const principal = await requireAuthenticatedUser(client), owner = principal.id;
  const admit = async (kind = body.kind) => {
    const fresh = await requireAuthenticatedUser(client);
    const user = await repo.user(owner);
    if (fresh.id !== owner || !user) privacyFail('AUTH_REQUIRED', 401);
    if (await adminRepository.lifecycle(owner)) privacyFail('PRIVACY_OTHER_OPERATION_PENDING');
    const requests = await readPrivacyRequests(client, owner);
    if (kind === 'WITHDRAW_HEALTH' && requests.some(row => row.kind === 'DELETE_ACCOUNT')) privacyFail('ACCOUNT_DELETION_IN_PROGRESS', 403);
    // Native role does not identify the builder-owner separately. Keep admin
    // self-removal closed rather than silently remove the owner/last admin.
    if (kind === 'DELETE_ACCOUNT' && user.role === 'admin') privacyFail('PRIVACY_ADMIN_PROTECTED', 403);
    if (kind === 'WITHDRAW_HEALTH') {
      const profile = await repo.one('UserProfile', { user_id: owner });
      if (profile?.account_status !== 'ACTIVE') privacyFail('ACTIVE_ACCOUNT_REQUIRED', 403);
    }
  };
  await admit(body.action === 'read' ? null : body.kind);
  if (body.action === 'read') {
    const rows = await readPrivacyRequests(client, owner);
    const request = rows.find(row => row.kind === 'DELETE_ACCOUNT') || rows.find(row => row.status !== 'COMPLETED') || rows[0];
    const consent = await repo.one('UserHealthConsent', { user_id: owner });
    return { ...await project(request), canWithdraw: consent?.consent_status === 'GRANTED' && !rows.some(row => row.kind === 'DELETE_ACCOUNT'), accountProtected: (await repo.user(owner))?.role === 'admin' };
  }
  if (body.action === 'status') {
    const rows = await readPrivacyRequests(client, owner);
    return project(rows.find(row => row.kind === body.kind));
  }
  if (body.action === 'begin' && (body.confirmed !== true || !secretValid(body.recovery_key))) privacyFail('PRIVACY_CONFIRMATION_REQUIRED', 400);
  return gate.run(owner, body.kind, async () => {
    await admit();
    const rows = await readPrivacyRequests(client, owner);
    let request = rows.find(row => row.kind === body.kind && (row.kind === 'DELETE_ACCOUNT' || row.status !== 'COMPLETED'));
    if (!request && body.kind === 'WITHDRAW_HEALTH') {
      const consent = await repo.one('UserHealthConsent', { user_id: owner });
      if (consent?.consent_status === 'WITHDRAWN') request = rows.find(row => row.kind === body.kind && row.grant_at === consent.granted_at && row.requested_at === consent.withdrawn_at);
    }
    if (!request && body.action === 'resume') return project(rows.find(row => row.kind === body.kind));
    if (!request) {
      const consent = body.kind === 'WITHDRAW_HEALTH' ? await repo.one('UserHealthConsent', { user_id: owner }) : null;
      if (body.kind === 'WITHDRAW_HEALTH') validatedOnboardingGrant(consent, HEALTH_CONSENT_VERSION);
      const requested_at = now().toISOString();
      if (consent && requested_at <= consent.granted_at) privacyFail('CONSENT_STATE_CHANGED');
      const request_key = body.kind === 'DELETE_ACCOUNT' ? 'DELETE_ACCOUNT' : `WITHDRAW_HEALTH:${consent.granted_at}`;
      request = rows.find(row => row.request_key === request_key);
      if (!request) {
        await repo.store.UserPrivacyRequest.create({ user_id: owner, request_key, kind: body.kind, status: 'IN_PROGRESS', requested_at, grant_at: consent?.granted_at ?? null, consent_version: consent?.consent_version ?? null, completed_at: null });
        request = await repo.request(owner, request_key);
      }
      if (!request) privacyFail('PRIVACY_WRITE_UNCONFIRMED', 503);
    }
    if (body.recovery_key && body.kind === 'DELETE_ACCOUNT') await repo.receipt(request, body.recovery_key);
    if (body.kind === 'WITHDRAW_HEALTH') {
      if (!(await withdrawalState(repo, request)).complete) await runWithdrawal(repo, request, admit, now);
    }
    else await runAccountDeletion(client, repo, request, admit);
    return project(await repo.request(owner, request.request_key));
  });
}
export async function handlePrivacyRequest(req, createClient, options = {}) {
  try {
    if (req.method !== 'POST') privacyFail('METHOD_NOT_ALLOWED', 405);
    const body = await readBoundedJson(req, 1200, privacyFail);
    return Response.json(await privacyOperation(createClient(req), body, options));
  } catch (error) {
    return Response.json({ error_code: error instanceof InternalError ? error.code : 'PRIVACY_OUTCOME_UNCONFIRMED' }, { status: error instanceof InternalError ? error.status : 503 });
  }
}
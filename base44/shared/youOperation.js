import { InternalError, requireAuthenticatedUser } from './internalAuthorization.js';
import { resolveAuthenticatedOwner } from './domainSecurity.js';
import { guardDomainOwner } from './nativeDomainGuard.js';
import { resolveTimezone, serverLocalDate, OnboardingError } from './onboardingValidation.js';
import { isOnboardingProfileReady } from './onboardingRoute.js';
import { verifiedDailyRecord } from './dailyRecord.js';
import { prepareProfileInput } from './profileInput.js';
import { youRepository, youRevision, profileFields, preferenceFields, pickFields, sameFields } from './youRepository.js';

const profileInputFields = ['display_name', 'birth_date', 'birth_time', 'birthplace_geonames_id', 'revision'];
const preferenceInputFields = ['language_code', 'notifications_enabled', 'timezone', 'revision'];
const actions = { read: [], readPreferences: [], saveProfile: profileInputFields, verifyProfile: profileInputFields, savePreferences: preferenceInputFields, verifyPreferences: preferenceInputFields };
const fail = (code, status = 409) => { throw new InternalError(code, status); };
export async function youOperation(client, body, { now = () => new Date(), geoNames = null } = {}) {
  const principal = await requireAuthenticatedUser(client), owner = resolveAuthenticatedOwner(principal, body);
  const allowed = typeof body.action === 'string' && Object.hasOwn(actions, body.action) ? actions[body.action] : null;
  if (!allowed || Object.keys(body).some(key => !['action', ...allowed].includes(key))) fail('INVALID_REQUEST', 400);
  const repository = youRepository(client, principal), store = client.asServiceRole.entities;
  const admit = async (writing = false) => {
    if ((await requireAuthenticatedUser(client)).id !== owner) fail('AUTH_REQUIRED', 401);
    await guardDomainOwner(client, owner, 'user_profile');
    if (writing) {
      const jobs = await store.HealthDataDeletionJob.filter({ user_id: owner, job_status: { $ne: 'COMPLETED' } }, 'id', 1);
      if (!Array.isArray(jobs)) fail('YOU_READ_FAILED', 503);
      if (jobs.length) fail('HEALTH_DELETION_PENDING');
    }
  };
  await admit();
  const [profile, preferences] = await Promise.all([repository.read('user_profile'), repository.read('user_preferences')]);
  const today = serverLocalDate(now(), resolveTimezone(null, preferences?.timezone));
  if (!isOnboardingProfileReady(profile, preferences, today)) fail('PROFILE_COMPLETION_REQUIRED');
  const daily = await store.UserDailyMessage.filter({ user_id: owner }, 'id', 1);
  if (!Array.isArray(daily) || daily.length !== 1) fail('PROFILE_COMPLETION_REQUIRED');
  verifiedDailyRecord(daily[0], owner);
  const project = async (row, fields) => ({ ...pickFields(row, fields), revision: await youRevision(row, fields) });
  let result;
  if (body.action === 'read' || body.action === 'readPreferences') {
    result = { preferences: await project(preferences, preferenceFields) };
    if (body.action === 'read') {
      const consent = await repository.read('user_health_consent');
      result = { ...result, profile: await project(profile, profileFields), today, consent: { status: consent?.consent_status ?? 'NOT_GIVEN' } };
    }
  } else {
    const isProfile = body.action.endsWith('Profile'), entity = isProfile ? 'user_profile' : 'user_preferences';
    const before = isProfile ? profile : preferences, fields = isProfile ? profileFields : preferenceFields;
    if (typeof body.revision !== 'string' || !/^[a-f0-9]{64}$/.test(body.revision)) fail('INVALID_REQUEST', 400);
    let desired;
    if (isProfile) desired = await prepareProfileInput(body, { today, geoNames, preservedPlace: profile });
    else {
      if (!['tr', 'en'].includes(body.language_code) || typeof body.notifications_enabled !== 'boolean') fail('INVALID_REQUEST', 400);
      desired = { language_code: body.language_code, notifications_enabled: body.notifications_enabled, notification_time: '06:00', timezone: resolveTimezone(body.timezone, preferences.timezone) };
    }
    if (sameFields(before, desired)) result = { state: 'VERIFIED', [isProfile ? 'profile' : 'preferences']: await project(before, fields) };
    else {
      if (await youRevision(before, fields) !== body.revision) fail('YOU_EDIT_CONFLICT');
      if (body.action.startsWith('verify')) result = { state: 'UNCONFIRMED' };
      else {
        const saved = await repository.update(entity, before, desired, admit);
        result = { state: 'VERIFIED', [isProfile ? 'profile' : 'preferences']: await project(saved, fields) };
      }
    }
  }
  try { await admit(); } catch(error) { throw Object.assign(error, {writeUnconfirmed:body.action.startsWith('save')}); }
  return result;
}
export async function handleYouRequest(req, createClient, dependencies = {}) {
  try {
    if (req.method !== 'POST') fail('METHOD_NOT_ALLOWED', 405);
    const text = await req.text();
    if (new TextEncoder().encode(text).length > 4000) fail('REQUEST_TOO_LARGE', 413);
    let body; try { body = JSON.parse(text); } catch { fail('INVALID_REQUEST', 400); }
    if (!body || typeof body !== 'object' || Array.isArray(body)) fail('INVALID_REQUEST', 400);
    return Response.json(await youOperation(createClient(req), body, dependencies));
  } catch (error) {
    return Response.json({ error_code: error instanceof InternalError ? error.code : 'YOU_READ_FAILED', field: error instanceof OnboardingError ? error.field : null, write_outcome: error.writeUnconfirmed ? 'UNCONFIRMED' : undefined }, { status: error instanceof InternalError ? error.status : 503 });
  }
}

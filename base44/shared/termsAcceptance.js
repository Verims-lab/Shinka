import { InternalError, requireAuthenticatedUser, assertAuthenticatedPrincipal } from './internalAuthorization.js';
import { readBoundedJson } from './boundedJson.js';

export const TERMS_URL = 'https://shinkadaily.com/terms/';
export const PRIVACY_URL = 'https://shinkadaily.com/privacy/';
const fail = (code, status = 503) => { throw new InternalError(code, status); };
const versionValid = value => typeof value === 'string' && /^[A-Za-z0-9][A-Za-z0-9._-]{0,79}$/.test(value);
const intentValid = value => typeof value === 'string' && /^[a-f0-9]{8}-[a-f0-9]{4}-4[a-f0-9]{3}-[89ab][a-f0-9]{3}-[a-f0-9]{12}$/i.test(value);

// No default legal version. The owner must configure the identifier for the
// actually approved document. Client env, timestamps and User custom fields
// are never legal or identity authorities.
export function termsPolicy(version) {
  return { state: versionValid(version) ? 'READY' : 'CONFIGURATION_REQUIRED', version: versionValid(version) ? version : null, termsUrl: TERMS_URL, privacyUrl: PRIVACY_URL };
}
export async function readTermsStatus(client, principal, policy) {
  assertAuthenticatedPrincipal(principal);
  if (policy.state !== 'READY') return { state: 'CONFIGURATION_REQUIRED', version: null };
  let rows;
  try {
    rows = await client.asServiceRole.entities.UserTermsAcceptance.filter({ user_id: principal.id, terms_version: policy.version }, 'accepted_at', 101, 0);
  } catch { fail('TERMS_STATE_UNAVAILABLE'); }
  if (!Array.isArray(rows) || rows.length > 100 || rows.some(row => !row.id || row.user_id !== principal.id || row.terms_version !== policy.version || row.status !== 'ACCEPTED' || row.document_url !== TERMS_URL || !intentValid(row.intent_id) || typeof row.accepted_at !== 'string' || !/^\d{4}-\d{2}-\d{2}T.*Z$/.test(row.accepted_at) || !Number.isFinite(Date.parse(row.accepted_at)))) fail('TERMS_STATE_UNAVAILABLE');
  // Concurrent creates may coexist: preserve all evidence and deterministically
  // use the first verified event. Native UNIQUE/transaction support is not assumed.
  const first = [...rows].sort((a, b) => a.accepted_at.localeCompare(b.accepted_at) || a.id.localeCompare(b.id))[0];
  return first ? { state: 'CURRENT', version: policy.version, acceptance: { id: first.id, acceptedAt: first.accepted_at, status: first.status } } : { state: 'REQUIRED', version: policy.version };
}
export async function sessionTermsStatus(client, principal, policy) {
  try { return await readTermsStatus(client, principal, policy); }
  catch { return { state: 'UNAVAILABLE', version: policy.version }; }
}
export function withTermsAdmission(client, readVersion) {
  const wrapped = { ...client };
  Object.defineProperty(wrapped, 'auth', { value: { ...client.auth, async me() {
    const principal = await requireAuthenticatedUser(client);
    const policy = termsPolicy(readVersion());
    const status = await readTermsStatus(client, principal, policy);
    if (status.state !== 'CURRENT') fail(status.state === 'CONFIGURATION_REQUIRED' ? 'TERMS_CONFIGURATION_REQUIRED' : 'TERMS_REQUIRED', status.state === 'CONFIGURATION_REQUIRED' ? 503 : 403);
    return { id: principal.id, role: principal.role };
  } } });
  return wrapped;
}
export async function termsOperation(client, body, { readVersion, now = () => new Date() }) {
  const fields = { policy: ['action'], status: ['action'], accept: ['action', 'version', 'confirmed', 'age_confirmed', 'intent_id'] }[body.action];
  if (!fields || Object.keys(body).some(key => !fields.includes(key))) fail('INVALID_REQUEST', 400);
  const policy = termsPolicy(readVersion());
  if (body.action === 'policy') return policy; // Public document metadata only; no user lookup.
  const principal = await requireAuthenticatedUser(client);
  if (body.action === 'status') return readTermsStatus(client, principal, policy);
  if (body.confirmed !== true || body.age_confirmed !== true || !intentValid(body.intent_id)) fail('TERMS_CONFIRMATION_REQUIRED', 400);
  if (policy.state !== 'READY') fail('TERMS_CONFIGURATION_REQUIRED');
  if (body.version !== policy.version) fail('TERMS_VERSION_CHANGED', 409);
  const existing = await readTermsStatus(client, principal, policy);
  if (existing.state === 'CURRENT') return existing; // Never update the first valid timestamp.
  // Fresh identity/lifecycle and current policy immediately before append.
  const fresh = await requireAuthenticatedUser(client);
  if (fresh.id !== principal.id) fail('AUTH_REQUIRED', 401);
  if (termsPolicy(readVersion()).version !== policy.version) fail('TERMS_VERSION_CHANGED', 409);
  const acceptedAt = now().toISOString();
  try {
    await client.asServiceRole.entities.UserTermsAcceptance.create({ user_id: principal.id, terms_version: policy.version, accepted_at: acceptedAt, status: 'ACCEPTED', document_url: TERMS_URL, intent_id: body.intent_id });
  } catch { fail('TERMS_WRITE_UNCONFIRMED'); }
  // A write acknowledgement alone grants no access. Lost/failed readback is
  // unknown; the next explicit status check is read-only, never auto-replayed.
  const admitted = await requireAuthenticatedUser(client);
  if (admitted.id !== principal.id) fail('AUTH_REQUIRED', 401);
  if (termsPolicy(readVersion()).version !== policy.version) fail('TERMS_VERSION_CHANGED', 409);
  let verified;
  try { verified = await readTermsStatus(client, principal, policy); }
  catch { fail('TERMS_WRITE_UNCONFIRMED'); }
  if (verified.state !== 'CURRENT') fail('TERMS_WRITE_UNCONFIRMED');
  return verified;
}
export async function handleTermsRequest(req, createClient, dependencies) {
  try {
    if (req.method !== 'POST') fail('METHOD_NOT_ALLOWED', 405);
    const body = await readBoundedJson(req, 1500, fail);
    return Response.json(await termsOperation(createClient(req), body, dependencies));
  } catch (error) {
    return Response.json({ error_code: error instanceof InternalError ? error.code : 'TERMS_STATE_UNAVAILABLE' }, { status: error instanceof InternalError ? error.status : 503 });
  }
}

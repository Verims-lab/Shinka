import { healthReadDiagnostic } from '../../shared/healthReadDiagnostics.js';
import { createNativeClient } from '../../shared/nativeClient.ts';
import { InternalError, requireAuthenticatedUser } from '../../shared/internalAuthorization.js';
import { readPrivacyRequests, privacyHash } from '../../shared/privacyPolicy.js';
import { readBoundedJson } from '../../shared/boundedJson.js';

export default async function (req) {
  const requestId=crypto.randomUUID(),started=Date.now();
  let stage='SESSION_AUTH_LIFECYCLE';
  try {
    if (req.method !== 'POST') throw new InternalError('METHOD_NOT_ALLOWED', 405);
    const body = await readBoundedJson(req, 1000, (code, status) => { throw new InternalError(code, status); });
    if (Object.keys(body).length) throw new InternalError('INVALID_REQUEST', 400);
    const client = createNativeClient(req), user = await requireAuthenticatedUser(client);
    stage='LIFECYCLE_READ';
    const requests = await readPrivacyRequests(client, user.id);
    const privacyRevision = await privacyHash(JSON.stringify(requests.map(row => [row.id, row.status])));
    return Response.json({ id: user.id, role: user.role, privacyRevision, authority: 'BASE44_NATIVE_V1' });
  } catch (error) {
    const diagnostic={...healthReadDiagnostic(error,{stage,durationMs:Date.now()-started}),requestId};
    console.error('SESSION_FAILURE', JSON.stringify(diagnostic));
    // Unclassified read failures (e.g. 429 on the privacy read) are retryable
    // unavailability, never session invalidity.
    return Response.json({ error_code: error instanceof InternalError ? error.code : 'SESSION_UNAVAILABLE', diagnostic },
      { status: error instanceof InternalError ? error.status : 503 });
  }
}
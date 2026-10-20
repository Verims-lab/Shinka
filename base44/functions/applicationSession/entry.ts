import { createNativeClient } from '../../shared/nativeClient.ts';
import { InternalError, requireAuthenticatedUser } from '../../shared/internalAuthorization.js';

export default async function (req) {
  try {
    if (req.method !== 'POST') throw new InternalError('METHOD_NOT_ALLOWED', 405);
    const text = await req.text();
    if (text.length > 1000) throw new InternalError('REQUEST_TOO_LARGE', 413);
    let body; try { body = JSON.parse(text); } catch { throw new InternalError('INVALID_REQUEST', 400); }
    if (!body || typeof body !== 'object' || Array.isArray(body) || Object.keys(body).length) throw new InternalError('INVALID_REQUEST', 400);
    const user = await requireAuthenticatedUser(createNativeClient(req));
    return Response.json({ id: user.id, role: user.role, authority: 'BASE44_NATIVE_V1' });
  } catch (error) {
    return Response.json({ error_code: error instanceof InternalError ? error.code : 'APPLICATION_SESSION_FAILED' },
      { status: error instanceof InternalError ? error.status : 500 });
  }
}

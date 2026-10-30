import { retryAfterMs } from './healthReadRetry.js';
import { healthReadDiagnostic } from './healthReadDiagnostics.js';
import { readBoundedJson } from './boundedJson.js';
// Only the server SDK's authenticated principal can grant internal access. Request payload roles are ignored.
export class InternalError extends Error {
  constructor(code, status = 500) { super(code); this.code = code; this.status = status; this.stage = undefined; this.uploadReceipt = undefined; this.diagnostic = undefined; this.retryAfterMs = undefined; }
}
// Trusted principals are minted only by server auth.me(), never by request data.
const authenticatedPrincipals = new WeakSet();
export async function requireAuthenticatedUser(client) {
  let me;
  try { me = await client.auth.me(); } catch (error) {
    if (error instanceof InternalError) throw error;
    const diagnostic = healthReadDiagnostic(error, { stage: 'SESSION_AUTH' });
    // 401 only on explicit invalidity evidence (HTTP 401/403 or AUTH_REQUIRED).
    // Rate limits, outages, timeouts and unclassified transport errors are 503.
    const invalid = diagnostic.httpStatus === 401 || diagnostic.httpStatus === 403 || diagnostic.code === 'AUTH_REQUIRED';
    const failure = invalid ? new InternalError("AUTH_REQUIRED", 401) : new InternalError("SESSION_UNAVAILABLE", 503);
    failure.diagnostic = diagnostic;
    throw failure;
  }
  if (!me?.id || typeof me.id !== "string") throw new InternalError("AUTH_REQUIRED", 401);
  const principal = Object.freeze({ id: me.id, role: me.role });
  authenticatedPrincipals.add(principal);
  return principal;
}
export function assertAuthenticatedPrincipal(principal) {
  if (!principal || !authenticatedPrincipals.has(principal)) throw new InternalError("AUTH_REQUIRED", 401);
}
export function assertAdmin(principal, code = "ADMIN_REQUIRED") {
  assertAuthenticatedPrincipal(principal);
  if (principal.role !== "admin") throw new InternalError(code, 403);
}
export async function requireAdmin(client) {
  const principal = await requireAuthenticatedUser(client);
  assertAdmin(principal);
  return principal;
}
export async function requireInternalAdmin(client) {
  const principal = await requireAuthenticatedUser(client);
  assertAdmin(principal, "FORBIDDEN_INTERNAL_TOOLING");
  return principal;
}
export async function handleInternalRequest(req, createClient, operation) {
  const requestId=crypto.randomUUID();
  const started = Date.now();
  let stage='SESSION_AUTH_LIFECYCLE';
  try {
    const client = createClient(req);
    const principal = await requireInternalAdmin(client);
    if (req.method !== "POST") throw new InternalError("METHOD_NOT_ALLOWED", 405);
    // Admin-only; the 1 MB limit is the existing Health report size contract.
    const body = await readBoundedJson(req, 1000000, (code, status) => { throw new InternalError(code, status); }, { allowEmpty: true });
    stage='OPERATION';
    return Response.json(await operation(client, body, principal),{headers:{'X-Shinka-Request-Id':requestId}});
  } catch (error) {
    const known = error instanceof InternalError;
    const diagnostic = healthReadDiagnostic(error, { stage, durationMs: Date.now() - started });
    const retryDelay = error?.retryAfterMs ?? retryAfterMs(error);
    const headers = diagnostic.httpStatus === 429 && Number.isFinite(retryDelay) && retryDelay >= 0 ? { 'Retry-After': String(Math.ceil(retryDelay / 1000)) } : {};
    return Response.json({ error_code: known ? error.code : "INTERNAL_OPERATION_FAILED", stage: known && error.stage || stage, request_id:requestId, diagnostic: { ...diagnostic, requestId }, ...(known && error.uploadReceipt ? {uploadReceipt:error.uploadReceipt}: {}) }, { status: known ? error.status : 500, headers });
  }
}
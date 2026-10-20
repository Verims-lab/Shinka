// Only the server SDK's authenticated principal can grant internal access. Request payload roles are ignored.
export class InternalError extends Error {
  constructor(code, status = 500) { super(code); this.code = code; this.status = status; }
}
// Trusted principals are minted only by server auth.me(), never by request data.
const authenticatedPrincipals = new WeakSet();
export async function requireAuthenticatedUser(client) {
  let me;
  try { me = await client.auth.me(); } catch (error) {
    if (error instanceof InternalError) throw error;
    throw new InternalError("AUTH_REQUIRED", 401);
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
  try {
    const client = createClient(req);
    await requireInternalAdmin(client);
    if (req.method !== "POST") throw new InternalError("METHOD_NOT_ALLOWED", 405);
    const text = await req.text();
    if (new TextEncoder().encode(text).length > 1000000) throw new InternalError("REQUEST_TOO_LARGE", 413);
    let body;
    try { body = JSON.parse(text || "{}"); } catch { throw new InternalError("INVALID_REQUEST", 400); }
    if (!body || typeof body !== "object" || Array.isArray(body)) throw new InternalError("INVALID_REQUEST", 400);
    return Response.json(await operation(client, body));
  } catch (error) {
    const known = error instanceof InternalError;
    return Response.json({ error_code: known ? error.code : "INTERNAL_OPERATION_FAILED" }, { status: known ? error.status : 500 });
  }
}

// Only the server SDK's authenticated principal can grant internal access. Request payload roles are ignored.
export class InternalError extends Error {
  constructor(code, status = 500) { super(code); this.code = code; this.status = status; }
}
export async function requireInternalAdmin(client) {
  let principal;
  try { principal = await client.auth.me(); } catch { throw new InternalError("AUTH_REQUIRED", 401); }
  if (!principal?.id) throw new InternalError("AUTH_REQUIRED", 401);
  if (principal.role !== "admin") throw new InternalError("FORBIDDEN_INTERNAL_TOOLING", 403);
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

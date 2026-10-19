// Base44 capability register (items marked DOĞRULANACAK in Teknik Analiz v1.1 / DB v1.2).
// VERIFIED requires evidence. Statuses: VERIFIED | PARTIALLY_VERIFIED | UNVERIFIED | UNSUPPORTED.
export const CAPABILITY_REGISTER = Object.freeze([
  { id: "CAP-01", capability: "Entity field types (Date, Time, Enum, Long Text, Number)", status: "PARTIALLY_VERIFIED", evidence: "InternalHealthRun schema (string/number/date-time) accepted; Date/Time/Enum semantics not measured." },
  { id: "CAP-02", capability: "Single-field UNIQUE", status: "UNSUPPORTED", evidence: "Base44 official entity-schemas documentation (2026-10-19): native unique constraints unsupported; unknown unique_fields ignored. Generic atomic adapter remains unproven. Onboarding uses SDK keyed upsert; live cross-instance uniqueness is not established." },
  { id: "CAP-03", capability: "Compound UNIQUE", status: "UNSUPPORTED", evidence: "Same official native UNIQUE limitation. Synthetic createIfAbsent protocol tests do not establish platform atomicity." },
  { id: "CAP-04", capability: "Indexes", status: "UNVERIFIED", evidence: "No declarative index mechanism proven." },
  { id: "CAP-05", capability: "FK / reference integrity", status: "UNVERIFIED", evidence: "No FK declaration proven; backend equivalent required." },
  { id: "CAP-06", capability: "Transaction / rollback (multi-record atomicity)", status: "UNVERIFIED", evidence: "Not measured." },
  { id: "CAP-07", capability: "Conditional update", status: "UNVERIFIED", evidence: "Not measured." },
  { id: "CAP-08", capability: "Concurrency safety", status: "UNVERIFIED", evidence: "Not measured." },
  { id: "CAP-09", capability: "Auth providers (Apple + Google only)", status: "PARTIALLY_VERIFIED", evidence: "Repository policy implemented (OD-003); recorded platform snapshot lists Apple/Google. Current dashboard configuration and live provider sign-in remain unverified." },
  { id: "CAP-10", capability: "Row / owner security (RLS)", status: "PARTIALLY_VERIFIED", evidence: "20 product schemas deny direct SDK CRUD; backend filters owner using auth.me().id, ACTIVE/consent gates. Synthetic cross-owner tests pass; live identities still required." },
  { id: "CAP-11", capability: "Admin role authorization (platform-native)", status: "PARTIALLY_VERIFIED", evidence: "One shared auth.me()/admin guard for tooling and domain access; read-only CLI confirms current principal role admin. Separate non-admin live 403 evidence pending." },
  { id: "CAP-12", capability: "Backend function execution", status: "VERIFIED", evidence: "validateContentArtifacts executed 2026-10-18 (live + fixture modes) returning structured results." },
  { id: "CAP-13", capability: "Scheduler (06:00 local, rolling jobs)", status: "UNVERIFIED", evidence: "Not measured." },
  { id: "CAP-14", capability: "Secrets", status: "PARTIALLY_VERIFIED", evidence: "Request-scoped backend secret binding and synthetic entry tests; user reports configured secret and Preview search HTTP 200. Secret value not inspected; independent hosted list/save verification pending." },
  { id: "CAP-15", capability: "GeoNames backend proxy", status: "PARTIALLY_VERIFIED", evidence: "Search/resolve and cascading lists implemented with synthetic boundary tests; user-reported Preview search HTTP 200 returned eight places. New hosted selection/resolve/save/readback remains unverified." },
  { id: "CAP-16", capability: "Astronomy Engine execution in backend", status: "UNVERIFIED", evidence: "Not implemented." },
  { id: "CAP-17", capability: "Native push (iOS/Android)", status: "UNVERIFIED", evidence: "Requires DEVICE evidence." },
  { id: "CAP-18", capability: "Backup", status: "UNVERIFIED", evidence: "Not measured." },
  { id: "CAP-19", capability: "Restore (deleted health data must not reappear)", status: "UNVERIFIED", evidence: "Not measured." },
  { id: "CAP-21", capability: "Backend-only writes / service-role bypass", status: "PARTIALLY_VERIFIED", evidence: "Official security docs: service role bypasses RLS/FLS. Schemas deny direct writes; specific non-serializable server grants guard future workers. No live mutation enforcement test." },
  { id: "CAP-22", capability: "Immutable / protected record enforcement", status: "PARTIALLY_VERIFIED", evidence: "Deployed enforcement pending. Repository RLS and shared guard deny protected human mutations and immutable system updates; synthetic negative tests cover all five protected entities." },
  { id: "CAP-23", capability: "Native timestamp mapping (OD-004)", status: "PARTIALLY_VERIFIED", evidence: "2026-10-19 read-only InternalHealthRun response includes created_date/updated_date. UTC offset absent; product timestamps, mutability and immutable updated timestamp semantics not live-proven." },
  { id: "CAP-24", capability: "Nullable / optional field representation", status: "PARTIALLY_VERIFIED", evidence: "Optional fields use documented types; canonical validation normalizes absent values to logical NULL. Onboarding sends explicit NULLs to clear merging SDK updates and verifies readback; native NULL storage remains unverified." },
  { id: "CAP-20", capability: "Deployment rollback", status: "UNVERIFIED", evidence: "Not measured." },
]);

export function capabilityCounts(reg = CAPABILITY_REGISTER) {
  return reg.reduce((acc, c) => ({ ...acc, [c.status]: (acc[c.status] || 0) + 1 }),
    { VERIFIED: 0, PARTIALLY_VERIFIED: 0, UNVERIFIED: 0, UNSUPPORTED: 0 });
}

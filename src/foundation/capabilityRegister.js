// Base44 capability register (items marked DOĞRULANACAK in Teknik Analiz v1.1 / DB v1.2).
// VERIFIED requires evidence. Statuses: VERIFIED | PARTIALLY_VERIFIED | UNVERIFIED | UNSUPPORTED.
export const CAPABILITY_REGISTER = Object.freeze([
  { id: "CAP-01", capability: "Entity field types (Date, Time, Enum, Long Text, Number)", status: "PARTIALLY_VERIFIED", evidence: "InternalHealthRun schema (string/number/date-time) accepted; Date/Time/Enum semantics not measured." },
  { id: "CAP-02", capability: "Single-field UNIQUE", status: "UNVERIFIED", evidence: "No declarative unique constraint proven; upsert-by-key exists in SDK docs but not measured." },
  { id: "CAP-03", capability: "Compound UNIQUE", status: "UNVERIFIED", evidence: "Not measured." },
  { id: "CAP-04", capability: "Indexes", status: "UNVERIFIED", evidence: "No declarative index mechanism proven." },
  { id: "CAP-05", capability: "FK / reference integrity", status: "UNVERIFIED", evidence: "No FK declaration proven; backend equivalent required." },
  { id: "CAP-06", capability: "Transaction / rollback (multi-record atomicity)", status: "UNVERIFIED", evidence: "Not measured." },
  { id: "CAP-07", capability: "Conditional update", status: "UNVERIFIED", evidence: "Not measured." },
  { id: "CAP-08", capability: "Concurrency safety", status: "UNVERIFIED", evidence: "Not measured." },
  { id: "CAP-09", capability: "Auth providers (Apple + Google only)", status: "PARTIALLY_VERIFIED", evidence: "Repository policy implemented (OD-003); recorded platform snapshot lists Apple/Google. Current dashboard configuration and live provider sign-in remain unverified." },
  { id: "CAP-10", capability: "Row / owner security (RLS)", status: "PARTIALLY_VERIFIED", evidence: "Admin-only RLS declared on InternalHealthRun; cross-user denial not yet measured with a non-admin account." },
  { id: "CAP-11", capability: "Admin role authorization (platform-native)", status: "PARTIALLY_VERIFIED", evidence: "validateContentArtifacts enforces role==='admin' server-side; non-admin 403 path not yet exercised live." },
  { id: "CAP-12", capability: "Backend function execution", status: "VERIFIED", evidence: "validateContentArtifacts executed 2026-10-18 (live + fixture modes) returning structured results." },
  { id: "CAP-13", capability: "Scheduler (06:00 local, rolling jobs)", status: "UNVERIFIED", evidence: "Not measured." },
  { id: "CAP-14", capability: "Secrets", status: "UNVERIFIED", evidence: "No secret configured or read yet." },
  { id: "CAP-15", capability: "GeoNames backend proxy", status: "UNVERIFIED", evidence: "Not implemented." },
  { id: "CAP-16", capability: "Astronomy Engine execution in backend", status: "UNVERIFIED", evidence: "Not implemented." },
  { id: "CAP-17", capability: "Native push (iOS/Android)", status: "UNVERIFIED", evidence: "Requires DEVICE evidence." },
  { id: "CAP-18", capability: "Backup", status: "UNVERIFIED", evidence: "Not measured." },
  { id: "CAP-19", capability: "Restore (deleted health data must not reappear)", status: "UNVERIFIED", evidence: "Not measured." },
  { id: "CAP-20", capability: "Deployment rollback", status: "UNVERIFIED", evidence: "Not measured." },
]);

export function capabilityCounts(reg = CAPABILITY_REGISTER) {
  return reg.reduce((acc, c) => ({ ...acc, [c.status]: (acc[c.status] || 0) + 1 }),
    { VERIFIED: 0, PARTIALLY_VERIFIED: 0, UNVERIFIED: 0, UNSUPPORTED: 0 });
}

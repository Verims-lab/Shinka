# SHINKA — Security & Privacy

**Document:** SHINKA_SECURITY_PRIVACY.md
**Status:** ACTIVE — principles; nothing certified
**Current BuildMarker:** Buildmarker-002
**Last Updated:** 2026-10-18
**Authoritative Source References:** SRC-01 §8/§13, SRC-04 §3.2/§9/§13/§14, SRC-05 §15
**Purpose:** Separate PRODUCT REQUIREMENT from BASE44 VERIFIED CAPABILITY.
**Scope:** Auth, ownership, admin, health data, logs, secrets, restore.
**External Verification Required:** All rows marked UNVERIFIED.

| Topic | PRODUCT REQUIREMENT | BASE44 VERIFIED CAPABILITY |
|---|---|---|
| OAuth ownership | Provider identity → one account; no duplicates | UNVERIFIED (Apple unknown, OD-003) |
| User row isolation | User sees only own rows; owner from auth context | UNVERIFIED (RLS declared on internal entity only) |
| Admin boundary | Platform role; audited; no email-based authority | PARTIALLY_VERIFIED (role check in backend + route gate) |
| Sensitive health access | Only with explicit valid consent | UNVERIFIED |
| Consent | Versioned, timestamped, event history | UNVERIFIED |
| Health-data deletion | Immediate stop, verified deletion, retries, no re-consent mid-job | UNVERIFIED |
| Protected immutable records | Admin cannot UPDATE/DELETE snapshots/events/audit (OD-009) | UNVERIFIED |
| Audit metadata minimization | No health content in audit log | UNVERIFIED |
| Log redaction | No tokens, health data, message bodies | Health reports redacted (`redact()`), T17 test |
| Secrets | Server-side only | UNVERIFIED (none configured yet) |
| INACTIVE account | No login, generation, push | UNVERIFIED |
| Restore protection | Deleted health data never reappears; INACTIVE stays INACTIVE | UNVERIFIED |

Internal tooling: `/internal/*` routes gated by `role === "admin"`; `validateContentArtifacts` returns 403 for non-admins; `InternalHealthRun` admin-only RLS. Health never stores tokens, cookies, passwords, health records, profile data or message bodies (only counts, IDs, booleans).
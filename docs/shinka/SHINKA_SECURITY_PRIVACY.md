# SHINKA — Security & Privacy

**Document:** SHINKA_SECURITY_PRIVACY.md
**Status:** ACTIVE — principles; nothing certified
**Current BuildMarker:** Buildmarker-005
**Auth policy (OD-003):** RESOLVED_BY_REPOSITORY_POLICY: Apple/Google-only shell and safe localized error mapping implemented. Recorded platform snapshot 2026-10-18 23:11 lists Google/Apple; current dashboard and live Apple/Google proof remain unverified (EXTERNAL_RELEASE).
**Last Updated:** 2026-10-19
**Authoritative Source References:** SRC-01 §8/§13, SRC-04 §3.2/§9/§13/§14, SRC-05 §15
**Purpose:** Separate PRODUCT REQUIREMENT from BASE44 VERIFIED CAPABILITY.
**Scope:** Auth, ownership, admin, health data, logs, secrets, restore.
**External Verification Required:** All rows marked UNVERIFIED.

| Topic | PRODUCT REQUIREMENT | BASE44 VERIFIED CAPABILITY |
|---|---|---|
| OAuth ownership | Provider identity → one account; no duplicates | UNVERIFIED (Apple unknown, OD-003) |
| User row isolation | User sees only own rows; owner from auth context | UNVERIFIED (RLS declared on internal entity only) |
| Admin boundary | Platform role; audited; no email-based authority | REPOSITORY_IMPLEMENTED / SYNTHETIC_TESTED; deployed two-user enforcement unverified |
| Sensitive health access | Only with explicit valid consent | UNVERIFIED |
| Consent | Versioned, timestamped, event history | UNVERIFIED |
| Health-data deletion | Immediate stop, verified deletion, retries, no re-consent mid-job | UNVERIFIED |
| Protected immutable records | Admin cannot UPDATE/DELETE snapshots/events/audit (OD-009) | UNVERIFIED |
| Audit metadata minimization | No health content in audit log | UNVERIFIED |
| Log redaction | No tokens, health data, message bodies | Health reports redacted (`redact()`), T17 test |
| Secrets | Server-side only | UNVERIFIED (none configured yet) |
| INACTIVE account | No login, generation, push | UNVERIFIED |
| Restore protection | Deleted health data never reappears; INACTIVE stays INACTIVE | UNVERIFIED |

Internal route gates are UX only. Both `validateContentArtifacts` and `internalHealth` use request-derived SDK identity and server `auth.me()` before any operation: anonymous 401, ordinary/forged-role user 403, admin allowed. InternalHealthRun RLS allows admin read and denies client create/update/delete; guarded backend writes use service role. T68/H03-009 exercise this boundary synthetically. Live two-user/direct-invocation/RLS enforcement remains required.

Reports are diagnostic counts/IDs/status/evidence, not product health records. Server save validates structure/summary/gate and strips extra top-level fields; canonical recursive redaction removes credential, email, health-record/symptom, birth/profile and message-body keys and token/email value patterns. Compact JSON is bounded and never truncated. Private file creation plus record-based, admin-only signed readback is tested synthetically (T69–T72); no final live persistence is claimed. Auth UI never renders/logs provider payloads; only AUTH_CANCELLED, AUTH_PROVIDER_FAILED, AUTH_SESSION_FAILED or AUTH_UNSUPPORTED_METHOD may cross its boundary.

## Dependency audit disposition (2026-10-19)
Baseline: 0 Critical / 8 High / 5 Moderate / 3 Low. After supported patch updates/removal of unused react-quill-new and jspdf: 0 Critical / 5 High / 4 Moderate / 0 Low. These are npm affected-package counts, not independent exploit counts.

**High remains a Foundation blocker; no waiver.** The root advisory [GHSA-vfj7-8cjw-p6xm](https://github.com/advisories/GHSA-vfj7-8cjw-p6xm) affects braces ≤3.0.3 (stack-exhaustion denial of service from deeply nested patterns). Current registry has no patched braces release; npm proposes Tailwind 4.3.3, a major migration outside this corrective package's reviewed scope.

| High package | Installed version | Dependency path | Context / unresolved reason |
|---|---|---|---|
| braces | 3.0.3 | tailwindcss → micromatch → braces; tailwindcss → chokidar → braces | Root advisory; no supported patched braces version available. |
| chokidar | 3.6.0 (Tailwind nested) | tailwindcss → chokidar → braces | Propagated advisory; Tailwind 3 constrains watcher to 3.x. Root dev chokidar 4 satisfies Nitro's separate optional peer and does not remove this path. |
| micromatch | 4.0.8 | tailwindcss → micromatch → braces | Propagated advisory; supported version still uses braces. |
| fast-glob | 3.3.3 | tailwindcss → fast-glob → micromatch → braces | Propagated advisory; transitive path remains. |
| tailwindcss | 3.4.19 | root devDependency; also peer of tailwindcss-animate | Affected parent. Migration to 4 changes build/CSS integration and requires its own reviewed work. |

These are build/watch tooling paths, not browser application code. Globs are repository configuration; ordinary app users cannot submit them to the build. A malicious/untrusted pattern entering local/CI tooling can still exhaust stack/availability. Dev context reduces current application exposure but does not permit Foundation closure.

Moderate disposition (non-blocking for this Foundation only):
- postcss-selector-parser 6.1.4 and postcss-nested 6.2.0 through Tailwind: [GHSA-rj75-hqrm-r3gf](https://github.com/advisories/GHSA-rj75-hqrm-r3gf), quadratic selector parsing. Build-time CSS is repository-controlled; no user CSS parsing surface. Supported Tailwind 3 dependency constraints retain parser 6.x; parent migration deferred.
- react-router 6.30.6 / react-router-dom 6.30.6: [GHSA-wrjc-x8rr-h8h6](https://github.com/advisories/GHSA-wrjc-x8rr-h8h6) backslash open redirect and [GHSA-337j-9hxr-rhxg](https://github.com/advisories/GHSA-337j-9hxr-rhxg) SSR error deserialization. Runtime dependency; current links/navigation use fixed internal paths, returnTo is restricted to the same origin with backslashes/double slashes rejected, and SSR hydration is unused. Patched parent is 7.x; no unreviewed major migration here. Reassess before adding user-controlled navigation or SSR.

No Critical was present. No High/Moderate is described as fixed solely because it is development-only or currently unexposed.

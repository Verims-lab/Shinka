# SHINKA — Security & Privacy

**Document:** SHINKA_SECURITY_PRIVACY.md
**Status:** ACTIVE — principles; nothing certified
**Current BuildMarker:** Buildmarker-006
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

## Dependency security policy
Every package must run `npm run security:deps` (`npm audit --audit-level=high --include=dev`). Native npm exit status blocks Critical/High and audit/registry failures without parsing or hiding findings. Moderate/Low output stays visible and requires a documented path, exposure and fix disposition. Runtime and build dependencies are both included; **no Critical/High exceptions or waivers**. Regenerate lockfiles through npm, validate with `npm ci` and full `npm ls`, preserve release-age controls, and never apply unsupported overrides or blind forced audit fixes.

## Buildmarker-006 audit — 2026-10-19
Fresh starting audit after branch synchronization: **0 Critical / 5 High / 4 Moderate / 0 Low**. Final audit: **0 Critical / 0 High / 2 Moderate / 0 Low**. npm counts affected packages, not independent advisories. Repository status: **REPO_CLOSED_PENDING_BASE44_VERIFICATION**. These results do not certify deployed Base44 behavior.

### Verified High baseline and closure
One root advisory, [GHSA-vfj7-8cjw-p6xm](https://github.com/advisories/GHSA-vfj7-8cjw-p6xm), affects braces ≤3.0.3: stack-exhaustion denial of service through deeply nested patterns. Registry/advisory inspection found no patched braces release; latest Tailwind 3.x was already 3.4.19. npm's supported parent fix was Tailwind 4.3.3.

| Affected package/version | Direct/transitive | Complete baseline path from repository | Fix disposition |
|---|---|---|---|
| tailwindcss 3.4.19 | Direct dev declaration; also production animation peer | root → tailwindcss; root → tailwindcss-animate 1.0.7 → peer tailwindcss | Parent replaced with 4.3.3. |
| chokidar 3.6.0 | Transitive | root → tailwindcss 3.4.19 → chokidar 3.6.0 → braces 3.0.3 | Tailwind 3 constrains watcher to 3.x; removed entire path. |
| micromatch 4.0.8 | Transitive | root → tailwindcss 3.4.19 → micromatch 4.0.8 → braces 3.0.3 | Current supported micromatch still uses braces; removed path. |
| fast-glob 3.3.3 | Transitive | root → tailwindcss 3.4.19 → fast-glob 3.3.3 → micromatch 4.0.8 → braces 3.0.3 | Removed parent path. |
| braces 3.0.3 | Transitive | All three terminal paths above (watcher, direct micromatch, fast-glob/micromatch) | No patched version available; eliminated from resolved tree. |

All rows share that root advisory; four are npm propagated package findings. **Baseline production/development classification:** Tailwind was declared dev-only but the production `tailwindcss-animate` peer made the resolved Tailwind/High chain production-reachable in npm's graph (lock entries were not dev-only). Actual usage was build/watch CSS tooling, not browser application code. The second animation-peer entrance applies to every path in the table. Repository patterns are not ordinary user input, but untrusted local/CI patterns could exhaust tooling; this did not justify a waiver. Root Chokidar 4.0.3 was a separate development optional-peer workaround for Nitro and did not fix Tailwind's nested 3.6.0.

Minimum-remediation decision, in order:
1. Tailwind is actively required throughout the app; removing it would remove the visual contract. The obsolete direct Chokidar workaround and CSS pipeline dependencies could be removed after migration.
2. Latest supported Tailwind 3.4.19 and braces 3.0.3 still reproduced the advisory; no patch/minor direct fix existed.
3. Tailwind 3's watcher/glob parent constraints retained braces; updating compatible parent patches could not remove the vulnerable chain.
4. No supported patched braces target existed. Forcing Chokidar 4 into a 3.x contract or overriding with unrelated packages was not semantically valid.
5. Migrate Tailwind 3.4.19 → 4.3.3 and add its native Vite plugin 4.3.3. The final tree contains no braces, micromatch, fast-glob, chokidar, postcss-selector-parser or postcss-nested. No overrides were added.

`tailwindcss-animate` 1.0.7 is still used by generic UI animation classes; it is retained via native `@plugin` as a devDependency (supported peer ≥3 includes 4). Removed direct devDependencies: Autoprefixer, PostCSS and Chokidar. PostCSS remains a valid Vite transitive dependency. Both obsolete root Tailwind/PostCSS configs were deleted. Full CSS migration details and browser targets are in TECHNICAL_ARCHITECTURE.

### Moderate findings resolved
`postcss-selector-parser` 6.1.4 and propagated `postcss-nested` 6.2.0 shared [GHSA-rj75-hqrm-r3gf](https://github.com/advisories/GHSA-rj75-hqrm-r3gf), quadratic selector parsing (fixed parser ≥7.1.6). Paths were root → Tailwind 3.4.19 → parser, and root → Tailwind → postcss-nested → parser, with the same production animation-peer entrance. CSS input was repository-controlled build input. Migration removed both packages entirely; no suppression or parser override was used.

### Remaining Moderate findings
Two npm affected packages share the runtime path **root → react-router-dom 6.30.6 (direct production) → react-router 6.30.6 (transitive production)**. React Router has two advisories; react-router-dom inherits both findings. No patched 6.x version was available in the inspected registry; both fixes require React Router ≥7.18.0 (npm proposes react-router-dom 7.18.4).

| Advisory | Application exposure | Why it remains / reassessment trigger |
|---|---|---|
| [GHSA-wrjc-x8rr-h8h6](https://github.com/advisories/GHSA-wrjc-x8rr-h8h6), backslash open redirect; affected ≥6.0.0 <7.18.0 | Current Router links/routes use fixed internal paths. `src/lib/authReturnTo.js` validates same origin and rejects protocol-relative/backslash output before provider return navigation. No attacker-supplied Link/useNavigate destination was found. This is a source assessment, not a guarantee for future callers. | A separate router major changes routing/auth integration beyond the required CSS security migration; there is no compatible 6.x patch. Reassess and migrate before adding dynamic/untrusted navigation destinations. |
| [GHSA-337j-9hxr-rhxg](https://github.com/advisories/GHSA-337j-9hxr-rhxg), SSR deserializeErrors constructor injection; affected ≥6.4.0 <7.18.0 | App uses declarative BrowserRouter and client createRoot, without SSR/manual hydration. The advisory excludes declarative mode; the vulnerable SSR error path is not used here. | The same separate major upgrade is required. Reassess before enabling SSR, data/framework routing or untrusted serialized error hydration. |

These Moderate findings remain visible in npm audit and are documented non-blocking debt under the requested Foundation policy. They are not described as patched. The guard was verified against the real High baseline (non-zero) and the remediated tree (zero); standalone `npm audit --json` still exits 1 because Moderate findings remain.

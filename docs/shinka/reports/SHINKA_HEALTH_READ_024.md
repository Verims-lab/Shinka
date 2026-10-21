# Targeted Health read closure — Buildmarker-024 / HC-024.0

Status: **LOCAL_VERIFIED; OWNER_PUBLICATION_AND_FULL_HEALTH_PENDING**. Test-only patch. Main was two commits ahead of clean Test `53a2552`; Test was fast-forwarded/pushed to `144e939` before work. No live data mutation, content import, onam/reset/delete/resume, schema push, routine hosted Full Health or main publish.

## Evidence and limits

The supplied published run `298c7142-5afd-4f5f-95e0-4bdabce7d438` remains historical NOT_READY: 144 planned, 131 PASS / 4 FAIL / 9 BLOCKED. Four readiness cases share one memoized failure; they are not four independent incidents. H05 transport failures do not prove missing content. [Sanitized evidence and source hashes](health-024/read-only-evidence.json) preserve the original counts and the separate diagnosis.

At 2026-10-21T08:43:16Z, authenticated admin reads explicitly selected this same app (`6ad5190f4845d4e3af03b420`), `functionsVersion=prod` and data environment `prod`. Native readiness returned five readable schemas with expected authority/strategy version and `hostedMutationVerified:false`. Unfiltered count aggregates returned 6/240/260. Artifact fixture and live validation succeeded; live row counts were 260/192/240 and `importPerformed:false`. These calls were sequential, no retry and no records/message bodies were printed. They do not certify exact live content-row equality, mutation safety or Full Health. This data environment is not isolated by the Git Test branch.

CLI prod logs for the two functions from 08:22:30 to 08:24:00 returned zero entries. Current CLI-pulled internalHealth (44 files) and validateContentArtifacts (30 files) source bundles match baseline `144e939`, ignoring terminal whitespace. The CLI pull has no published-version selector; this comparison must not be promoted to a byte-for-byte prod runtime attestation. The four relevant Builder main schema files also match the baseline, including closed direct-access policies; Builder source is not independent proof of deployed policy enforcement. There is no evidence justifying a schema push or re-import.

**Proven code defects:** readiness swallowed every exception and accepted any fulfilled response without checking array/ID shape; counts discarded the failure class; artifact errors lost download/parse stage; frontend artifact errors kept only a broad code and could retain a raw message. The service's 30s timeout exceeded the 20s case timeout, so case-level timeouts could lose its diagnostic. These boundaries are corrected.

**Unproven historical cause:** the incident-time platform/SDK/query/session/download failure cannot be reconstructed from booleans, BACKEND_FAILED and null counts. The narrow prod reads did not reproduce it. Rate limiting, transient service problems, query/projection incompatibility and stale deployment remain hypotheses, not findings. No automatic fallback, new query strategy or SDK bump is justified by this evidence. Upstream main's frontend SDK 0.8.55 and existing server pin 0.8.54 are recorded, not asserted incompatible.

## Patch and Health behavior

- Shared closed diagnostics preserve only code, HTTP status, stage, bounded duration and UUID request ID. SDK `data`, Axios `response.data` and nested originalError envelopes are supported. Raw messages, records, headers/tokens and URLs/query secrets are excluded. Lifecycle errors retain the original safe failure class while still refusing admission.
- Readiness validates the existing one-ID query result. A real empty array is readable with sample size 0; a positive sample is 1. Malformed responses and absent SDK methods cannot pass. Failure diagnostics distinguish NOT_FOUND (404, not a claim of missing schema), ACCESS_DENIED, INVALID_QUERY, SDK_METHOD_UNAVAILABLE, INVALID_RESPONSE, TIMEOUT, RATE_LIMITED, SERVICE_UNAVAILABLE, NETWORK_UNAVAILABLE and UNKNOWN.
- Counts stay exact unfiltered SDK aggregates; unavailable counts remain null. No row scan, fallback, retry or new query load. Admin/owner/consent/deletion rules are unchanged.
- Artifact loading is extracted to its shared responsibility. Download includes reading response bytes, then parsing and validator execution have separate stages. Validly parsed but inconsistent content still reaches the original FAIL predicates. Operational failures remain BLOCKED.
- Frontend invocation waits at most 18s, before the normal 20s case deadline; this bounds local waiting, not cancellation of remote work. One successful or rejected promise per evidence source per run remains memoized. All three fixed artifact downloads keep their 15s bounds.
- H04-019/H08-005/H09-004/H12-031, H05-001–009 and H16-007 are updated in place; no cases removed or PASS conditions weakened. H16-007 includes HD01–HD10. Inventory remains 169 total / 144 in-app / 10 local / 13 external / 2 future. Internal Build retains 020–024. Historical reports and synthetic-vs-hosted distinctions remain.

Canonical continuation, architecture, data model, security/privacy, standards, development rules, Release Health, notes and generated Build History are aligned. No schema or product timestamp/consent contract changes.

## Local verification

- Clean `npm ci`, full `npm ls --all`, typecheck, lint, build, Repo Health, diff check and generated five-package history: passed.
- Chromium **560/560** and WebKit **560/560**, zero page errors. Real artifact entry fixture/admin gate checks also pass. [Verification summary](health-024/verification.json).
- Local in-app Health: **131 PASS / 13 BLOCKED / 0 FAIL**; the 13 unavailable hosted checks stay blocked in the isolated harness. Save/list/open flow passes with the synthetic transport; this is not a hosted Full Health run.
- [Every-case audit](health-024/case-audit.md) and [machine-readable evidence](health-024/case-audit.json) preserve all 169 IDs, classifications, predicates and separate acceptance requirements.
- Dependency audit: **0 High / 0 Critical**, two existing Moderate findings in react-router/react-router-dom. No dependency changes in this patch and no unrelated major upgrade/force-fix.
- [Production/lab measurement](health-024/performance.json): byte budgets pass; initial JS 478,329 raw / 158,978 gzip; CSS 87,430 raw / 15,054 gzip. Route measurements use a stubbed SDK, not hosted timings.
- Physical Android/iOS tests were not run. Synthetic consent/deletion and save/history results are not live-user or permanent-erasure acceptance.

## Owner handoff — three actions

1. Merge **Test → main** using the existing GitHub flow, then use Base44 **Sync from GitHub** for this app. This patch has **no schema delta**: do not re-import content or run entities push.
2. In the normal Base44 publish flow, deploy the synced **backend entry + shared dependencies together**, particularly internalHealth and validateContentArtifacts and all nativeClient/userLifecycle consumers, then publish the matching frontend. Confirm **Buildmarker-024 / HC-024.0**; a frontend label alone is not backend deployment proof.
3. Sign in as admin and run **Full Health once**, then save, list and open that run. Inspect the four readiness and H05 cases. If a failure remains, share only the case's diagnostic code/status/stage/duration/request ID: use that request ID/time to ask Base44 to inspect the published function/entity request (404: schema/route inventory; 401/403: auth/service-role policy; 400/422: query/projection; 429: rate limit; 5xx/timeout: platform/download service; UNKNOWN: platform trace). No Full Health/import retry loop is prescribed.

Official contract reference: [Base44 entities SDK — filter/count and service role](https://docs.base44.com/developers/references/sdk/docs/type-aliases/entities). Current source and executed SDK behavior, not documentation alone, ground the safe query contract.

# ON-05 consent recovery — 2026-10-20

Scope: correction within Buildmarker-009, catalog HC-009.0. Status: **OPEN_PENDING_LIVE_SAVE_AND_READBACK**. No deployment or live product mutation performed.

## Evidence and limits

- User screenshot: saveCycle, valid start date, explicit consent true, optional durations null; response NATIVE_CONSENT_TIMESTAMP_REQUIRED. The placeholder 5/28 values were not submitted data.
- Repository: clean Test `9e6473d` matched origin/Test at preflight; origin/main `848e073` was two commits behind. Current adapter still checked normalized created_at after persisting current consent, before event/period. normalizeDomainRead already mapped created_date → created_at. The defect is semantic use of storage metadata as consent authority, not a missing alias or duration validation.
- Agent-observed Base44 Preview frame: Main, `_b44_commit=848e073baba5fe8161f5b7ebffa7fad241a14e57`, functions_version=preview, base44_data_env=prod. This is a Preview context, not a production backend source attestation.
- Agent-observed published `/internal/build`: PUBLISHED, Buildmarker-008 / HC-007.0; the ledger described the country-led birthplace continuation. Maintenance 009 was not yet published. Exact deployed onboarding function hash was not exposed/verified.
- Agent-observed Greenfield Data UI: UserHealthConsent (1), UserHealthConsentEvent (0), UserPeriodRecord (0). Consent table displayed nonempty granted_at and Created cells, empty withdrawn_at. These are whole-entity counts, not proof of identity linkage to the screenshot account. No owner id, exact health date, full record or token is retained here.
- The UI renders formatted date text and exposes no raw ISO value in the inspected DOM attributes. Native field presence is observed at UI level; **raw API field type and timezone shape are unverified**. No token extraction, arbitrary authenticated fetch, broad data export or new production diagnostic endpoint was used. Zone-less native timestamp is a plausible specific trigger, not established live fact. Missing/invalid metadata remain alternative triggers. A historical InternalHealthRun zone-less response is not evidence of this consent row's wire representation.
- Local regression reproduces the exact old error with valid granted_at and zone-less created_date; new code preserves the grant and completes missing records. Tests also include UTC/offset/missing/invalid native metadata.

## Corrected contract

Existing valid UTC granted_at is the durable business authority and becomes event.occurred_at unchanged. Only a new authenticated explicit grant receives backend now().toISOString(). Native created_date remains storage metadata; no suffix/fallback/rewrite is applied. Invalid business timestamps and contradictory/withdrawn/version-conflicting records fail closed. No schema or consent-copy/version change.

Preflight checks all bounded owner consent/history/settings/period rows before writes. Missing records are resumed; matching records are not rewritten. New consent/settings are insert-only to avoid replacement during races. Period remains last, and final readback confirms grant, event, optional settings and period. Hydration requires a matching grant event. Skip creates nothing and does not erase earlier partial state.

Identical requests coalesce per owner in one warm worker (256 pending maximum; conflicting payload rejected; release on settlement). This is not distributed coordination. Independent workers can still race initial inserts; duplicate current-consent state is detected and refused without overwriting saved times. The explicit race test records this limitation. No native UNIQUE, transaction, rollback or absolute concurrency guarantee is claimed; unseen cross-worker interleavings remain a release verification obligation.

## Same-account verification after user sync/publish

1. Use the existing Git → Base44 Builder workflow for the Test changes. Confirm Buildmarker-009 / HC-009.0 in the target environment and confirm both onboarding/internalHealth function revisions synced; frontend marker alone is insufficient.
2. Keep the partial account and all its records. Authorized inspection should record only counts and comparisons for the same authenticated owner: existing granted_at must be valid UTC; note it privately for equality comparison. Do not paste full health records/tokens into reports.
3. On ON-05 enter the same intended start date, leave both durations empty, explicitly check consent and Continue. Expect a successful saveCycle response (persisted=true), then the finite ON-06 dependency screen. This does not implement First Shinka or Home generation.
4. Read back that owner's rows: one current GRANTED consent with the original granted_at/version, one matching GRANTED event whose occurred_at equals it, one period with the submitted start. For this start-only account, no settings row is expected; absent durations remain logical NULL. Verify no open deletion job and ACTIVE profile.
5. Retry the same save, including duplicate click/reload in the same account. Counts and grant/event time must remain unchanged. Reload must not advance solely on a period without its event. Skip must create no additional consent/health rows.
6. Run current Full Health, save/list/open its private history report, and separately record H11-006 live evidence. If any conflict is returned, preserve records and investigate with minimized metadata; never delete/restart as a workaround. Keep ON-05 open until live saveCycle and all required readbacks succeed.

Official basis: [entity schemas and native metadata](https://docs.base44.com/developers/backend/resources/entities/entity-schemas), [SDK entity mutation semantics](https://docs.base44.com/developers/references/sdk/docs/type-aliases/entities). These do not guarantee serialized UTC offsets or distributed uniqueness.

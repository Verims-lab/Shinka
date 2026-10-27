# SHINKA — Source of Truth

**Document:** SHINKA_SOURCE_OF_TRUTH.md
**Status:** ACTIVE — governance
**Current BuildMarker:** Buildmarker-041
**Last Updated:** 2026-10-27
**Authoritative Source References:** All 10 registered LOGICAL sources (below)
**Purpose:** Define which document governs which domain, how split documents are counted, and how conflicts are handled.
**Scope:** Whole Shinka project (greenfield). Does not replace the uploaded source files.
**Open Decisions:** OD-001 … OD-012 (see register below)
**External Verification Required:** Live Apple/Google sign-in (EXTERNAL_RELEASE)


## 041 — Home language control removal

Explicit user decision (2026-10-27): remove TR/EN buttons from the Home header only. Language preference is owned by Profile/You and persisted per owner; Home consumes it. Daily content ID, selected content and snapshots are unaffected. Calendar/Pattern headers are out of scope and unchanged.

## 040 — deletion stabilization and scoped cleanup authority

Authority: explicit user request `a2e85156-40d3-4d49-b203-2ee57cc0cc2c/Pasted text.txt`, 2026-10-27. Preserve audit 039; one Buildmarker-040 / HC-040.0 package. This request exceptionally authorizes sequential removal of the initially enumerated existing users except the exact protected native admin designated in the private request. The identifier/email is not a code privilege or public report field. Before any live deletion: match tested published backend/shared/frontend, verify actual SDK app/environment, unique exact protected identity/current admin/session, freeze paginated explicit target IDs and protect that ID at every action. First target/readback/protected-data comparison precedes the rest. No new targets are inferred; conflicts stop the sequence. Same receipt resumes; no direct DB cleanup. Main merge/publish remain owner actions; authorization continues after publication without another deletion approval. Shared references, Health history and canonical retained records stay intact. Routine live Health/security scans, notification/scheduler changes and 12 deferred findings remain outside scope. [040 evidence and publication dependency](reports/SHINKA_TEST_DELETION_STABILIZATION_040.md).

## 039 — core quality milestone authority

Authority: explicit user request `a52b553b-3741-4bc1-93d0-7e6b0300526c/Pasted text.txt` (2026-10-27). One 039 package audits and fixes existing behavior; 036–038 decisions remain binding: light-only UI, automatic onboarding locale, You preference authority, A/P single search, count-free themes/current Moon/next Full date. No new feature/service/data authority or live operation is authorized. Twelve deferred backend findings remain OPEN / USER-DEFERRED. Main merge/publish and hosted Full Health belong to the owner. [Single milestone report](reports/SHINKA_CORE_QUALITY_MILESTONE_039.md) separates fresh local results, historical incidents and external acceptance.

## 038 — Calendar recovery and Pattern presentation decision

Authority: explicit user request `95da1b20-7fd7-4762-9684-53257241899e/Pasted text.txt`, SHA-256 `5c78316a4200f752235cfc8156d60342d493da77a5a1823abd8e89a46d453f43` (2026-10-27). The completed 036/037 packages remain intact. The supplied dark screenshots differ from current 037 light-only source; their deployed version and Calendar write outcome are unverified.

This decision supersedes the original five-node Lunar Timeline presentation: show only current Moon phase and the first FULL start strictly after backend now, as an IANA-local TR/EN date without time/zone/graph. At the exact FULL start, next means the following lunation. Partial coverage preserves the provable current phase; no inferred future date. Theme names/order and all count/ranking fields remain, but no visible day counters. Scoped new labels and error copy live in patternCopy; original source tables remain historical provenance.

Ordinary Pattern refresh retains verified sections, with five-minute visible freshness and coalesced return/online events. Privacy/account/logout invalidates immediately. Calendar recovers a unique saved intent for add/edit/delete using its original action ID after reload; no bulk cancellation or health-data deletion to unlock the screen. Conflicts remain explicit. Owner/ACTIVE/consent/lifecycle, future/minimum-15-day/duplicate/OD-012 rules are unchanged. [038 implementation, evidence and remaining owner acceptance](reports/SHINKA_CALENDAR_PATTERN_038.md).

## 037 — five additional corrections; light-only decision

Authority: user request `929ca633-808a-4368-8e13-3259d8212be9/Pasted text.txt`, SHA-256 `a7307d8bbde75c7df95414d1a516be789c08e62f19dfadaf271ae128c5e156f3`. This supersedes the 026 system-theme decision: Shinka always uses the approved light palette, even at dark OS startup or preference changes. No setting or second theme source. ON-02 nonblank trimmed names disable Skip and its handler; blank/whitespace may skip. ON-05 has no Account & Privacy header (already implemented in 035/036); You/direct routes and guards stay. Calendar future browsing/predictions remain, future actual add/edit/resume are rejected by server time + validated IANA zone; old future rows remain visible for explicit correction/delete. Home loses only the normal Refresh button, retaining pull/automatic load and error Retry. The 036 six fixes and historical failures remain. [Single 037 report](reports/SHINKA_ADDITIONAL_FIXES_037.md).

## 036 — explicit six-item onboarding decision, 2026-10-27

Authority: user request `9b08acc7-f978-4827-acc3-e29781663998/Pasted text.txt`, including three incident screenshots. These are the current user decisions, not claims that the original sources contained them. Preserve 035 visual concept, five main steps, unnumbered preparation and A/P single-search birthplace. Saved UserPreferences language wins; otherwise device TR/EN variant, unsupported→EN. No manual onboarding language controls or URL/storage override. Only valid adult DOB is required; time and all five place fields may be NULL. ON-04 Back now returns to an authenticated welcome with Continue and no OAuth/logout, superseding the 035 no-Back decision. ON-02/03/05 retain Back. Preparation Back hides the pending view and resumes preparation via welcome; it does not undo a server write. Birth time accepts keyboard HH:mm and an app-owned modal with explicit Set/Cancel/Clear, no timezone/default time.

The screenshots show the historical six-step/header/hierarchy variant, unlike current source. They do not identify the published asset/function/shared hashes or establish a live error code. Read-only daily log diagnosis returned API_ERROR/401; exact published cause remains unresolved. No live generation, Health, mutation/reset/delete/import/push or publish is authorized. 12 deferred backend findings remain unchanged. [036 single delivery report](reports/SHINKA_ONBOARDING_CLOSURE_036.md).

## Birthplace authority introduced in 035; navigation amended in 036

The owner’s audit/fix request (attachment 53e55c57-8889-48fd-aec8-94d443b8e4f8) adopts **Shinka_GeoNames_Birthplace_Arama_Kurallari_v1.0.docx**, SHA-256 `b2bcd76b7524831c42f7918518ab2d36777b8f69de427863337f229832beaa63`, as the current birthplace behavior. The attached document is requirements evidence; execution authorization comes from the request. This replaces the 008 country cascade / P-only selection and 026 birthplace sheet; their decisions and observations below are historical. It does not alter the original ten-source inventory, the five stored fields or existing consent/content decisions.

Current sequence: ON-01 Introduction → ON-02 optional name → ON-03 Apple/Google + separate unchecked 18+ → ON-04 profile → ON-05 optional cycle + explicit health consent → unnumbered ON-06 verified preparation → Home. Only ON-01–05 count. Back is local ON-02→01, ON-03→02, ON-05→04; ON-04 now returns to authenticated welcome/Continue under 036; the original no-Back decision is superseded. No logout/OAuth restart or automatic write is attached to Back. Same mounted screen keeps cycle drafts; durable records govern reopen. There is no new draft persistence/rollback guarantee.

One combobox searches after three characters and 350 ms debounce. Own displayed name must contain the case-insensitive literal query; no accent folding/fuzzy/parent-name-only match. A and P may be selected; typing invalidates the old ID. Server resolves that ID and saves all five canonical fields or all NULL. Four pages × 50 candidates is Shinka’s bound, not GeoNames’s provider maximum or global completeness. Errors, filtered empty pages and local limits remain distinct. [035 audit, execution and evidence](reports/SHINKA_ONBOARDING_AUDIT_035.md).

Main f52b1c3 is the preserved Base44 baseline. 034's old 649/649 evidence does not validate these changes. No live provider/OAuth/device acceptance is inferred. Onboarding header privacy access is removed; /you links and direct /account-privacy authorization remain.

## 034 — support-confirmed push field names (2026-10-26)

Evidence: the owner relayed **Dmytro / Base44 Support** in this continuation; no support ticket was independently retrieved and no hosted call was made. Alongside the earlier Base44 AI relay, this confirms only the names `user_id`, `title`, `content`, `action_label`, `action_url`. Support also warns that unknown/misnamed fields can be silently discarded while a success response is returned; success proves neither intended processing of every field nor device display.

Separately, [official built-in integration documentation](https://docs.base44.com/Integrations/built-in-integrations#sending-push-notifications), checked 2026-10-26, confirms title/message/action-label limits of 100/500/50 characters, an optional action label and in-app link, and Home opening when the link is omitted. These are documentation-level facts, not AI-only assumptions or device proof.

The full wire types/requiredness/nullability/Unicode counting, `user_id` → native User.id mapping and concrete acceptance/error/no-device JSON remain unverified. Existing narrow types/validation are retained local rules, not a newly verified platform schema. Workflow secret registration/reference/header transport, native eligibility, idempotency and logout/account rebinding remain open. The adapter stays UNKNOWN and the actual entry `enabled:false`; H14-901/H16-901 remain external. Historical 030/033 statements below must be read with this documentation/support distinction. [034 evidence and remaining acceptance](reports/SHINKA_STABILIZATION_034.md).

## 033 — accepted scheduler credential boundary

The owner relayed a new Base44 support answer and explicitly accepts a narrowly scoped scheduler shared secret (attachment e9324e5d-cdc7-4cd6-9c29-58313afe379e, reviewed 2026-10-23). This supersedes keyless/admin-session-only scheduler assumptions and any earlier rejection of a shared secret. It does not restore SHINKA_WRITE_MODE or grant general admin access. Manual calls retain fresh native-admin checks; machine calls require explicit credential verification, never null auth or service-role possession.

Support says push success means acceptance, not physical display; its exact wire representation and earlier AI-relayed input remain unverified. Official secret lifecycle documentation, relayed support, local fixture proof and missing hosted/device evidence are separately recorded in [033 delivery](reports/SHINKA_SCHEDULER_AUTHORIZATION_033.md). Real registration/transport remains unbound and entry enabled:false.

## 032 — native preparation authority (2026-10-22)

The explicit native-readiness request (attachment 2c2d181c-0497-4b43-9fa7-c587979a7202) permits independent setup guidance before the technical contracts arrive. Firebase is permitted only as the owner's Base44 Android push configuration; it is not a new Shinka identity, database or backend. This supersedes any reading of earlier “no external service” or “contracts before setup” wording that would block this preparation. The agent creates no accounts/projects/keys, starts no native build, and changes no dashboard configuration. Main merge/publish, credential entry and device actions belong to the owner.

A safe automatic caller contract is required; distinguishing the same authorized admin's manual call from a workflow is not a product requirement. Missing auth or available service-role access never establishes system authority. Existing 029 product rules/031 read budgets remain. Browser/PWA permission is not native permission, and provider acceptance is not device display. The [032 report](reports/SHINKA_NATIVE_NOTIFICATION_READINESS_032.md) separates observed non-secret settings, verified local absence and unknown platform state; all physical steps remain NOT_RUN. No new application behavior was necessary after the scoped review.

## 030 — user-relayed support correction (2026-10-22)

The continuation attachment explicitly permits direct current-native-admin starts and supersedes any workflow-only identity requirement. It relays Base44 support, not an independently retrieved support ticket: workflow auth.me identity/creator lifecycle and a verifiable workflow caller mechanism are undocumented. The earlier AI creator-admin claim is unverified; documentation gaps are not UNSUPPORTED evidence. Beta Run APIs do not authenticate incoming calls.

The same attachment relays SendPushNotification input schema (user_id/title/content, optional nullable action_label/action_url; 100/500/50 character limits), implemented with a narrow type and local validation. It supplies no verified response, recipient-ID mapping, no-device behavior or idempotency contract. These remain unknown. All original 029 product decisions and source receipts below remain authoritative within their recorded scope. The 030 report distinguishes this user-relayed input from official documentation, synthetic execution and unperformed physical acceptance.

## 029 — direct notification source reconciliation

Read the originals from the owner's Downloads on 2026-10-22: SRC-01 İş Analizi v2.5 §7.4/KK-13/14/24, SRC-02 Use Case v1.4 UC-10/20, SRC-03 UI/UX v1.1 §7.2 and error copy (also Part 3/4 and the machine-readable companion), SRC-04 Teknik Analiz v1.1 notification/retry section, SRC-05 Veritabanı Tasarımı v1.2 §4.2/7.1. Their common contract is fixed local 06:00, detected IANA zone, unchanged daily pair, app preference separate from OS permission, existing delivery row retry, ACTIVE account, and SENT not guaranteed device display. Original physical atomic/unique expectations remain superseded by the explicitly accepted 016 native limitations, not magically proven in 029. Original INACTIVE-only account deletion was already superseded by 023 owner erasure.

New scoped 029 decisions: neutral bilingual lock-screen copy, 06:00–12:00 same-day window, next-pass intent settlement, three attempts with 5/15-minute delays, uncertain-result suppression and five optional delivery fields plus a global checkpoint. These are implementation/product decisions authorized by this request, not quotations from original documents. Missing authoritative platform integration/authentication contracts are recorded openly; no fabricated SDK/bridge is added.

## 027 user-authorized quality milestone

The user's 2026-10-22 “Bildirim Öncesi Kalite Milestone’u” request authorizes the current audit/fixes and reviewed Router major upgrade. It does not alter approved content, category decisions, date/consent authority, Base44 data authority or notification scope. The repository started clean at 1cd93e1; main's two-commit lead was fast-forwarded into Test before work, yielding baseline 860c2d74e48e399e30d0448a998b637a3644314f. Only Test receives this delivery. Local synthetic/browser evidence, prior user-reported live success and outstanding hosted/device acceptance remain distinct; [027 report](reports/SHINKA_PRE_NOTIFICATION_QUALITY_027.md).

## Mobile interaction and theme decision — 026, 2026-10-21

Authority: explicit user request in attachment `d425bafc-2da2-4a48-9edc-a7e39dc561da/Pasted text.txt`; SHA-256 `c19174f7d4d5539a4506248b2bf0124de4c607dd25f9e8c0deba175a2bf35942`. Historical 026 decision (its system-theme portion superseded by 037 above) replaced the then-current light-only and mobile native-select presentation decisions, including those historical statements below. It is not an eleventh logical source. System light/dark, mobile birthplace bottom sheet, safe-area/scroll ownership, browser layer/back behavior, short reduced-motion-aware transitions and guarded Home/Calendar refresh are authorized. New helper copy is centralized in `mobileCopy.js`; source content, exact consent copy, five birthplace fields and backend authority are unchanged.

The light brand remains; secondary text darkens from #87757D to #77636C and interactive boundaries use #95848D for contrast. Separate dark semantic values live in designTokens/dark.css; primary labels have their own on-primary token. No notification delivery, new theme setting, external infrastructure, native project or store build is authorized. Existing 025 timeout/cancellation/progress behavior remains. [Single mobile evidence report](reports/SHINKA_ANDROID_IOS_COMPATIBILITY.md) separates executed browser evidence from native/device acceptance.


## Current privacy decision — 023 (2026-10-21)

The explicit owner request (attachment `ea5c5169-9fba-4e63-9d4e-527f9f20dca9`, SHA-256 `e256b56eac98d7ef50010c63eff06284fdd9dfea7652a2af90fec343cbcf565c`) supersedes the original SRC-01/SRC-03 **Delete Account → INACTIVE with all records retained** product decision. Self-service Delete Account now means a durable owner-confirmed request, denial of new target activity, bounded removal of active personal records and native User, followed by separately pending platform/provider erasure. INACTIVE alone is never completion. Historical source text and delivery evidence are preserved below; their deactivation and admin-test retention descriptions do not govern the new self-service flow.

Withdrawal is now implemented, including health-bearing Calendar receipts, stable server time/events, verified cleanup and fresh explicit Calendar regrant. Existing account/profile/daily history retention applies only to withdrawal, not owner account erasure. Legal destinations remain unpublished by the user's explicit 022 reply. New scoped privacy TR/EN copy comes from this requested implementation, not from original source tables; old deactivation copy remains historical and unused by erasure.

No approved legal retention period exists for owner-related audit, consent or erasure metadata. Account erasure removes associated active product/audit records; the minimal current erasure request and hashed recovery receipts remain visibly pending for platform work, not granted indefinite legal retention. See [the complete matrix and open decisions](reports/SHINKA_PRIVACY_023.md). Base44 remains the only identity/data authority. No live user mutation, live Full Health, external service, main merge or publish is authorized in 023.


## You/Profile authority — 022

User request `3dd6f189-011e-4fc0-865c-12957dad45a1/Pasted text.txt`, SHA-256 `3be20ad4c06ef0bb1d79040b06d57b43105e84bb7dd3787567e94886225761b8`, authorizes You/profile/preferences, read-only consent status, approved legal destinations, Sign Out and current native-admin entry. It explicitly excludes new withdrawal, deactivation, notification delivery/scheduler, live Health/user writes and main publish. Pattern 021 remains implemented. No schema, content, Sun, consent version or identity authority changes.

Original EN success/error/cancel strings are imported from `uiuxTables.APPROVED_COPY.you`; shared onboarding validation/copy remains canonical. New scoped labels/status and TR translations live in `youCopy` and are attributed to this implementation request, not original-source verbatim text. Terms of Service remains untranslated. No approved Privacy Policy/Terms destination or body was found in repository sources; the UI presents unpublished status, with no invented URL, legal text or empty button. Owner-provided approved destinations remain a content acceptance item.

## Pattern authority — 021

User request `37ea216e-3297-448f-bd6c-9d783b518ece/Pasted text.txt` authorizes Pattern backend/calculation/UI/local tests/Health/docs with Test-only delivery. UC-16/17 and KK-21/22/34 remain the rules. The request explicitly clarifies **30 calendar days**, one logical day selected by the current Home reconciliation, independent section errors and no generation/snapshot changes on entry. No new content/category/psychological interpretation or external service is authorized.

Implementation decision: use the existing UserPatternSummary field contract as a freshly calculated read-only projection. Stored summaries are not a second authority and are neither read nor written by Pattern; no new schema/cache is added. Original EN state strings come verbatim from `uiuxTables.APPROVED_COPY.pattern`; approved category TR/EN names remain OD-002. Scoped TR state translations and phase/section labels are centralized in `patternCopy`, attributable to this feature implementation, not claimed verbatim original-source text. Historical SQL/atomic-only prerequisites and future Pattern labels below describe earlier checkpoints; current native Pattern supersedes them. Hosted/device/ON-05 acceptance stays open.

## 020 user instruction and evidence provenance

The 2026-10-21 request (attachment 36363fdb-e3c6-4b3d-a8e2-95777d79bc1e) authorizes only the readiness type correction and removal/result consistency fix with selected-target read-only diagnosis. It authorizes accurate TR/EN removal copy, not a retention change or permanent erasure workflow. Published HC-019.0 133/4/0 is user-supplied evidence; local RG/RM/AU regressions and the scoped live query are separate. The target ID exists only in private diagnostic input, never source or fixtures. Official SDK and dashboard wording are distinguished in the [020 report](reports/SHINKA_TARGETED_CLOSURE_020.md).

## 019 authority and evidence provenance

User request `c5b380d7-656a-4a92-a6d6-3151cc35bb8a/Pasted text.txt` authorizes audit/fixes of implemented features, bounded same-operation continuation, executable Health scope, local mobile/performance checks, and Test-only delivery. It prohibits live deletion/reset/resume/new operation and routine hosted Full Health in this task. This changes no content, Moon, Sun, consent, OD-012 or retention decision.

The user-supplied published 018 run `780aebf1-ff0b-4a6d-8c20-12b746509d53` remains **131 PASS / 1 FAIL / 0 BLOCKED / 19 NOT_APPLICABLE, 5250 ms**; H03-008 failed. This later observation supersedes the earlier PASS observation for current status without rewriting it. Git `68efa0c` shows Base44 bot auth-template regeneration after the prior fix. The reintroduction trigger is unproven. A fresh read-only Dashboard → Settings → Authentication inspection on 2026-10-21 observed Google/Apple ON and email/password/Microsoft/Facebook OFF. No settings were changed; this is configuration evidence, not provider-login proof. Reserved Register/ForgotPassword/ResetPassword modules now forward to the approved onboarding page, contain no password UI/operation, and are not registered routes. Unreferenced OAuthConsent/AuthLayout were removed. The unchanged H03-008 scanner still rejects password code even in reserved files; future platform overwrite remains detectable.

Current source-to-case and runtime evidence mapping is [019 case audit](reports/audit-019/case-audit.md). Historical package descriptions below are evidence of those deliveries, not current release instructions.

## 018 explicit product decision provenance

User attachment f9781bea-8339-4732-8f2e-aabb006cd97b/Pasted text.txt approves the separation of local browser regressions from normal in-app Health, removes terminal/JSON prerequisites, and requires visible confirmed/partial/unknown deletion and save outcomes. This is a new product operation decision, not text attributed to original source documents. Existing content and Moon approvals remain unchanged; H03-008/H09-004 are user-reported PASS. Exact case migration and diagnostic boundaries are in reports/SHINKA_HEALTH_USABILITY_018.md.

## Authoritative corrective decision — 017

The user's request `32a2a68b-8223-45ea-8285-56d4e91cafdb/Pasted text.txt` supersedes operator-maintenance deletion and routine agent-run hosted Health. Base44 sole authority, approved shared app/prod, content/Moon/OD-012 and retention stay. Test is code, not a separate database. New active contract: explicit target preview + single confirmation, durable target tombstone, bounded resumable cleanup; unrelated users remain admitted. Existing per-operation owner/ACTIVE/consent/open-job validation remains mandatory. Manual hosted acceptance does not block Test delivery. See DEVELOPMENT_RULES and [017 delivery](reports/SHINKA_HEALTH_RECOVERY_017.md).

Git proves password templates were reintroduced by `base44-builder[bot]` in `ac3e7e9` (2026-10-20T18:58:47Z, “chore: add boilerplate auth templates”) after prior removal. No active route/import registers these files. Removal retains the unmodified auth scanner and Apple/Google policy. This demonstrates regeneration occurred, but not which platform event/settings caused it. No fresh Authentication dashboard observation was made; OD-003's old timestamp is unchanged. User must inspect the next synced diff and current platform provider settings; no claim that deleting files permanently disables platform template generation.

## Historical authority — Base44 continuation (016)

The latest user instruction replaces the 015 SQL approval. Base44 is the sole product/identity/admin authority; existing OAuth/User IDs stay. The user explicitly confirmed no SQL installation or transfer occurred. Independent read-only inspection found no SQL secrets or SQL session/admin endpoints in the known Base44 app; account-wide Supabase inspection was unavailable. No reconciliation, remote deletion, provisioning or migration occurred. Historical 014/015 decisions are superseded, not erased.

The user approves simpler Entity workflows: immutable Home candidates with explicit reconciliation; actual Calendar dates plus read-time calculation and retry; verified-step reset; operator-maintenance deletion. These replace the old universal atomicity prerequisites, not owner/ACTIVE/consent/retention controls. [Current decision, evidence and recovery contract](SHINKA_BASE44_CONTINUATION.md) governs conflicts with historical package descriptions below. No main merge/publish, live user destruction, external service or spend. Approved category/text/Moon and OD-012 decisions remain unchanged.

## 1. Logical vs physical sources
- A **logical source** is one authoritative document (one version, one domain authority).
- A **physical attachment** is an uploaded file. A logical source may be transported in several physical parts **only** because of the Base44 attachment size limit (5 MB). The split is transport-only: parts never create separate domains, design systems, document records, rules or precedence.
- **Authoritative logical source count: 10.** Physical artifacts: **14**, validated by role (UI/UX = 4 transport parts + 1 machine-readable table companion; the other nine = 1 file each).
- A **supporting artifact** (e.g. the machine-readable companion) mirrors a logical source for ingestion only; it is never a new source.

## 2. Registered logical sources (set `SRC-2026-10-18`)

| ID | Logical file | Version | Date | Domain | Authority | Physical files | Status |
|---|---|---|---|---|---|---|---|
| SRC-01 | Shinka_Is_Analizi_v2.5_Tutarli.docx | 2.5 | 2026-10-18 | Business behavior | PRIMARY | 1 | READ |
| SRC-02 | Shinka_Use_Case_v1.4_Tutarli.docx | 1.4 | 2026-10-18 | User/system flows | PRIMARY | 1 | READ |
| SRC-03 | Shinka_UI_UX_Tasarim_v1.1_Tutarli.docx | 1.1 | 2026-10-18 | UI/UX/copy/design | PRIMARY | 4 (split) | READ |
| SRC-04 | Shinka_Teknik_Analiz_v1.1_Tutarli.docx | 1.1 | 2026-10-18 | Technical architecture | PRIMARY | 1 | READ |
| SRC-05 | Shinka_Veritabani_Tasarim_v1.2_Tutarli.docx | 1.2 | 2026-10-18 | Data model | PRIMARY | 1 | READ |
| SRC-06 | Shinka_DB_v1_1.docx | 1.1 | 2026-10-18 | Data model | SUPPORTING — superseded by SRC-05 | 1 | READ |
| SRC-07 | Shinka_Veritabani_Entity_Iliskiler_v1.2.xlsx | 1.2 | 2026-10-18 | Data model | PRIMARY | 1 | READ |
| SRC-08 | Shinka_Free_260_YS_Suggestion_TR_EN.xlsx | — | 2026-10-18 | Content copy | PRIMARY | 1 | READ |
| SRC-09 | Shinka_Free_240_Eslestirme_40Gun_Test_Sade.xlsx | — | 2026-10-18 | Content mapping | PRIMARY | 1 | READ |
| SRC-10 | Shinka_Free_192_Kategori_Eslestirme.xlsx | — | 2026-10-18 | Content mapping | SUPPORTING (subset of SRC-09) | 1 | READ |

### SRC-03 — split logical source
**Logical Source:** Shinka_UI_UX_Tasarim_v1.1_Tutarli.docx (v1.1, 18 October 2026)
**Logical source count:** 1
**Physical attachments:** 4 (transport-only, Base44 attachment-size constraint)

| Part | Physical file | Original pages | First section | Last section | Status |
|---|---|---|---|---|---|
| 1 of 4 | Shinka_UI_UX_v1.1_Part_1_of_4.docx | 1–5 | Title, usage note, ToC, §1, §2, §3 | ON-02 | READ |
| 2 of 4 | Shinka_UI_UX_v1.1_Part_2_of_4.docx | 6–9 | ON-03 | ON-06 | READ |
| 3 of 4 | Shinka_UI_UX_v1.1_Part_3_of_4.docx | 10–16 | §4 Home | §7.3 Account & Privacy | READ |
| 4 of 4 | Shinka_UI_UX_v1.1_Part_4_of_4.docx | 17–21 | §7.4 Withdraw consent | §9 Checklist | READ |

Continuity (read in order 1→2→3→4): P1 ends ON-02 → P2 starts ON-03; P2 ends ON-06 → P3 starts §4; P3 ends §7.3 → P4 starts §7.4. No duplicated or missing section; sections 1–9 all present. Tables/visual-reference notes are exposed by the supporting artifact **Shinka_UI_UX_v1.1_Machine_Readable_Tables_Companion.docx** (mirrors SRC-03; all 11 tables read; no conflict with the written parts) → OD-010 resolved.

## 3. Domain precedence

| Domain | Primary Source | Supporting Source | Implementation Notes |
|---|---|---|---|
| Business behavior | SRC-01 | — | İK/KK codes are binding acceptance criteria. |
| User / system flows | SRC-02 | SRC-01 | UC-01…UC-27. |
| UI / UX / copy / design | SRC-03 (combined Part 1–4) | — | Screen inventory, navigation, visible copy, tokens, typography, icons, spacing, components, interaction, loading/error/empty/validation states, accessibility, EN/TR UI behavior. |
| Technical architecture | SRC-04 | SRC-05 | DOĞRULANACAK → UNVERIFIED_PLATFORM_CAPABILITY. |
| Data model | SRC-05 + SRC-07 | SRC-06 | v1.2 wins over v1.1 on conflict. |
| Content copy | SRC-08 | — | Exact repository manifest; approved 016 hosted import verified 260 pairs (historical receipt). No 019 import. |
| Content mapping | SRC-09 + SRC-10 | — | 240 = 192 + 48 UNKNOWN; approved 016 exact import verification retained; new deployment checks remain separate. |

Illustrative UI mockups never override written business/data rules; the written UI specification overrides mockups.

## 4. Rules
- **Legacy firewall:** NO LEGACY SHINKA CONTRACT MAY ENTER THIS PROJECT WITHOUT AN EXPLICIT CHANGE REQUEST.
- **Conflict handling:** contradictions become OPEN_DECISION entries; never silently reconciled.
- **RESOLVED_*** statuses must cite a resolution rule.

## 5. OPEN_DECISION register (mirror of `src/foundation/openDecisions.js`)
| ID | Status | Summary |
|---|---|---|
| OD-001 | RESOLVED_BY_SOURCE_RECEIPT | UI/UX v1.1 received as 4 transport parts; continuity verified; tokens reconciled. |
| OD-002 | RESOLVED_BY_PRODUCT_DECISION | User approval in this conversation, 2026-10-20: six codes and EN names approved exactly; source TR names preserved. No mapping/copy changes or live closure. |
| OD-003 | RESOLVED_BY_REPOSITORY_POLICY | Apple/Google-only repository surface implemented; historical platform snapshot preserved. Current dashboard configuration observed in 019; live provider sign-in remains external verification. |
| OD-004 | PARTIALLY_VERIFIED — EXTERNAL_RELEASE | Native created_date/updated_date observed read-only; aliases implemented without duplicate fields. UTC/update/immutable behavior remains unverified. |
| OD-005 | NOTED | "Büyüyen Ay (Hilal)" label mapped to WAXING; UI/UX v1.1 does not redefine it. |
| OD-006 | RESOLVED_BY_PRECEDENCE | notification_delivery uniqueness → DB v1.2. |
| OD-007 | NOTED | Stale version references (Use Case v1.4, Teknik v1.1, UI/UX v1.1 header cites Teknik/DB v1.0). |
| OD-008 | NOTED | Probable typo "dakikeleri" in SHF-002 (TR). |
| OD-009 | PARTIALLY_VERIFIED — EXTERNAL_RELEASE | RLS and shared protected guards implemented with synthetic negative tests; deployed multi-identity enforcement required (H12-901). |
| OD-010 | RESOLVED_BY_SOURCE_RECEIPT | Machine-readable companion exposes all 11 UI/UX tables. |
| OD-012 | RESOLVED_BY_PRODUCT_DECISION | Explicit closure request, 2026-10-20: supported observations within the last-three window; no backfill/clamping; unavailable phase is distinct from missing history. |
| OD-011 | NOTED | Onboarding step names (§3 "Welcome/Login", "Cycle Details") vs screen titles; screen titles canonical. |

## Evidence provenance
Inventory READ/continuity/table records mean **SOURCE_RECEIVED_AND_RECORDED**. The original DOCX/XLSX artifacts are external and are not versioned/hash-verified in this repository. This package does not claim **SOURCE_ARTIFACT_HASH_VERIFIED_IN_REPO**. Build-time SHA-256 values cover current repository code/config/canonical Markdown only; they do not authenticate original external files. External artifact hashing is not an additional Foundation blocker.

OD-003 closes repository policy implementation only. The 019 panel inspection updates configuration evidence but proves no successful Apple/Google sign-in. OD-002 is RESOLVED_BY_PRODUCT_DECISION by the separately recorded user approval below. OD-004 and OD-009 are PARTIALLY_VERIFIED — EXTERNAL_RELEASE; neither is resolved.

## Historical checkpoint — Data-model source receipt — Buildmarker-007
SRC-05 v1.2 and SRC-07 v1.2 were reread directly from the supplied local DOCX/XLSX bytes. The backend source-field receipt contains all 20 exact entity field lists from SRC-07 entity sheets. SRC-06 remains subordinate. Business/technical/use-case text was inspected for ownership, nulls, protected records and future workflow boundaries. Attached documents provide source facts; task/implementation instructions come from the user's pasted request.

SHA-256 receipts (2026-10-19): SRC-05 `2e9a99d21309999641d246b0a66bad6c90570ce50afdfd03beb3ee154db94a29`; SRC-07 `db4348c165d61c20527a3dc2903e623486f788f383bcce85196e7aed213bdd69`. This scoped receipt does not change the global original-artifact verification flag: all ten source originals are not versioned/hash-verified in Git. No source count or precedence changed and no content workbook rows were imported.

## Authentication/onboarding approved product decisions — current package

Authority: the user's explicit “Shinka Greenfield — Buildmarker-008 Final Closure” request, followed by the approved helper-copy reply. These decisions supersede the earlier missing-source findings and conflicting Sun-time fallback in SRC-03; they do not add an eleventh source document to the original inventory. Request SHA-256: `a00eee2a8e22e74a1dc645e342b6baca7bd7ed17b6006520faa160cd8c2bedf2`. An independent copy receipt is stored in `src/foundation/tests/onboardingCopyReceipt.json`; approved runtime copy remains centralized in `onboardingCopy.js`.

| Previous finding | Current resolution |
|---|---|
| SUN_SIGN_CALCULATION_RULE_SOURCE_GAP | RESOLVED_BY_PRODUCT_DECISION |
| TR_ONBOARDING_COPY_SOURCE_GAP | RESOLVED_BY_PRODUCT_DECISION |
| HEALTH_CONSENT_VERSION_SOURCE_GAP | RESOLVED_BY_PRODUCT_DECISION |
| ONBOARDING_DURABLE_COMPLETION_MARKER_SOURCE_GAP | RESOLVED_BY_PRODUCT_DECISION |

The canonical pure backend Sun resolver is `base44/shared/sunSign.js`. It uses birth_date alone, independent of locale/timezone/time/place, with no API or UNCERTAIN. Missing birth_time remains NULL; the previous 00:00 Sun-calculation fallback is explicitly superseded. Other future astrology calculations require a separate decision.

| Sun code | Inclusive birth-date range |
|---|---|
| CAPRICORN | 22 December – 19 January |
| AQUARIUS | 20 January – 18 February |
| PISCES | 19 February – 20 March |
| ARIES | 21 March – 19 April |
| TAURUS | 20 April – 20 May |
| GEMINI | 21 May – 20 June |
| CANCER | 21 June – 22 July |
| LEO | 23 July – 22 August |
| VIRGO | 23 August – 22 September |
| LIBRA | 23 September – 22 October |
| SCORPIO | 23 October – 21 November |
| SAGITTARIUS | 22 November – 21 December |

Durable completion is the authenticated owner's first REAL user_daily_message, alongside a valid ACTIVE profile. Profile readiness requires adult valid DOB, the derived Sun, optional valid time/structured place and initialized preferences. Before that daily record exists, Skip can reach ON-06 for the current session and restart may safely return to ON-05. No extra product entity/field/flag is authorized; existing records determine state. Package 008 did not generate daily messages; current implementation and remaining production blockers are documented in the 011 section.

TR onboarding catalog status is APPROVED_PRODUCT_COPY. Exact EN/TR values, including the separately approved helper strings, are recorded in UI_UX_STANDARDS and tested against the independent receipt. Terms of Service is intentionally untranslated in both languages. Existing EN validation text retains its original short-copy punctuation; only explicitly approved title, age, consent and helper replacements change onboarding EN.

Canonical consent version: `health-consent-v1.0`. EN: “I consent to Shinka processing my cycle data to provide cycle-based features and personalization.” TR: “Shinka’nın döngü verilerimi döngüye dayalı özellikler ve kişiselleştirme sunmak amacıyla işlemesine açık rıza veriyorum”. The checkbox is explicit, unchecked, and separate from 18+, auth, Privacy Policy and Terms of Service. No cycle input creates no consent record/event. Valid cycle input plus consent uses the authenticated backend owner and writes the exact version to current consent and immutable grant history.

At the package-008 checkpoint FIRST_SHINKA_ENGINE_REQUIRED was a next-package dependency. In 011 the implementation exists, but production atomic persistence remains blocked; the dependency is retained on that failed path. Production SDK persistence is implemented with verified readback. Cross-instance enforcement/native metadata and deployed Full Health remain external verification; no native transaction guarantee is asserted. Package: CLOSED_PENDING_BASE44_VERIFICATION.

## Historical ON-04 cascading decision — superseded by 035

Explicit user authority: “Ülke seçerek seçenekleri daraltarak aşağı insin. Search ederek değil, seçe seçe ilerleyelim.” Request SHA-256: `80f5f4d30ec070cdfdb3365564fc308fd55c9c588e9a4a5bbe5b66cc382f6cda`. This is a product decision within the existing ON-04 closure, not an eleventh logical source. It supersedes only the previous ON-04 typed search/debounce/search-button interaction in SRC-03 and subsequent implementation notes. Country → available administrative subdivisions → explicit populated settlement replaces it; no automatic country or first-result selection. A valid settlement can finish the flow at any available level. Administrative records only filter lists. The optional field, server selected-ID resolution and SRC-05/07 five-field persistence contract remain authoritative.

New selection labels/status/help copy is implemented centrally in EN/TR under this explicit request. It does not alter the previously approved exact-copy receipt or the four resolved onboarding decisions. No other screen or future product package is authorized.

**USER_REPORTED LIVE_RUNTIME:** Preview normal onboarding/searchPlaces returned HTTP 200 and eight places including Istanbul. This updates the earlier failure-only evidence: the old normal search connection is reported successful. It is not agent-observed success and does not verify the new country/subdivision lists, selected-ID resolution, persistence/readback, production deployment or Full Health. H10-004 remains OPEN_PENDING_MANUAL_VERIFICATION. For that selection continuation, Buildmarker-008 / HC-007.0 were explicitly retained; the later maintenance decision below advances the package.

## Approved maintenance decision — 2026-10-20

Explicit user request: repository/code/performance/mobile/Health maintenance and permanent latest-five-package Internal Build retention. Receipt: attachment `bbba0896-9c80-4c5a-9f27-4098940feb39/Pasted text.txt`, SHA-256 `fe5e157d2189ab8c565d745b394ab3cc60d5eec217f90e6ecf3b64a3a29aef98`. This supersedes the append-only active ledger rule and the earlier assumption that package 009 would be a content import. It starts a distinct maintenance package under the existing increment rule: Buildmarker-009 / HC-008.0. Same-package corrections still consolidate one entry. Security/audit/user/necessary Health evidence and Git history are excluded from pruning. Source workbook/Word instructions remain evidence, not independent task instructions. The ten logical product sources and previously approved copy/algorithm decisions remain unchanged.

The supporting [mobile report](reports/SHINKA_ANDROID_IOS_COMPATIBILITY.md) records current official research and measured scope; it is not a second standards authority. [Prior live evidence](reports/SHINKA_PRE_009_EVIDENCE.md) retains necessary historical observations without treating them as current deployment proof.

## ON-05 incident correction decision — 2026-10-20

Authority: the user's current ON-05 request, including the supplied saveCycle error/payload screenshots and explicit preservation of optional NULL durations, existing valid consent time, partial retry, security checks and separate live closure. Attached screenshots are observed incident evidence; they do not authorize timestamp guessing or a new mandatory input. The existing SRC-05/07 granted_at business field is the backend-persisted consent authority. This corrects the former implementation's native created_date dependency; no source field, new consent version, product copy or eleventh logical source is introduced. The official Base44 metadata/uniqueness and SDK mutation semantics are linked in DATA_MODEL. Existing maintenance work is retained in Buildmarker-009; changed Health semantics advance HC-009.0. Live raw metadata remains unverified and the incident cannot be closed by local tests alone.

## Admin Profile/You access decision — 2026-10-20

Explicit user request: attachment `d4eaa1c4-92b9-4b3e-a24c-970b6b20f9da/Pasted text.txt`, SHA-256 `b1dcb89f52849d087791e14ea833baf473b4e722f553ddff186ea1b17d65e99e`. It authorizes the small verified-admin Profile/You menu, `/internal` panel with exactly the two existing tools, access before onboarding completion, shared return navigation and centralized TR/EN copy. The supplied Turkish descriptions are exact product copy; corresponding English/new navigation copy is scoped to this implementation request.

This updates the implemented navigation/screen inventory only. It does not authorize full You/profile/account editing, change onboarding completion, import product content, add a role model, or certify deployed enforcement. The ten logical sources and original 11 UI/UX source tables remain unchanged. Buildmarker-010 is expressly pre-content, so its live zero-row expectation remains; the next unapproved marker cannot inherit that rule automatically.


## Historical checkpoint — First Shinka / Home request and source receipt — Buildmarker-011

Authority: current user attachment `cc51dad9-1fa5-423f-a865-3be824e53172/Pasted text.txt`. It explicitly authorizes controlled content preparation/import tooling, the necessary phase/selection backend, ON-06/Home, tests/Health/docs, and honest production blocking if durable uniqueness cannot be proven. Original workbook/Word statements remain source evidence, not separate operational instructions.

SRC-01/02/03/04/05 originals and SRC-07 were reread for this scope. SRC-08/09/10 exact bytes were read and hashed; the manifest preserves punctuation and bilingual pairing. The 011 report records hashes/counts and the six-row OD-002 decision. Category codes and EN names are absent from the original documents; the explicit user approval on 2026-10-20 supplies them. TR names and content/mapping source bytes remain unchanged. This does not change the original ten logical sources or the global original-files-in-Git flag.

Approved astronomy authority is Astronomy Engine JavaScript; Moon phase boundaries and cycle/outlier rules come directly from SRC-01 §§4–6 and SRC-04 §§4–6. The earlier user-approved birth-date-only Sun resolver still overrides legacy source time fallbacks. No legacy implementation or AI product text is introduced. New Home TR/helper presentation copy is scoped to this request; original English state/preparation text is retained. No hosted first Shinka or live import has been observed.

## OD-002 product approval receipt — 2026-10-20

Status: **RESOLVED_BY_PRODUCT_DECISION**. Authority is the user's explicit reply to the OD-002 question in this conversation: “Evet, sunduğun altı satırlık tabloyu aynen ürün kararı olarak onaylıyorum.” The user approved all six proposed category_code values and all six EN visible names, required the original TR names to remain exact, and expressly excluded changes to category mappings, 260 Pairs or their text. This is a product decision, not content discovered in SRC-01…10; the logical-source inventory remains ten.

| Source category | Approved category_code | Preserved TR name | Approved EN name |
|---|---|---|---|
| Dinlenme & Yavaşlama | REST_AND_SLOW_DOWN | Kendine Bir Nefes | Take a Breath |
| Öz Bakım & İyi Hissetme | SELF_CARE_AND_WELLBEING | Kendine İyi Gel | Be Kind to Yourself |
| Yenilik & Keşif | NOVELTY_AND_DISCOVERY | Yeniye Yer Aç | Make Room for the New |
| Odaklanma & İlerleme | FOCUS_AND_PROGRESS | Küçük Adımlarla İlerle | Move Forward in Small Steps |
| Bağ Kurma & Paylaşım | CONNECTION_AND_SHARING | Bağlarını Güçlendir | Strengthen Your Connections |
| Sadeleşme & Bırakma | SIMPLICITY_AND_LETTING_GO | Hafiflemeye İzin Ver | Allow Yourself to Feel Lighter |

Canonical executable receipt: `base44/shared/contentCategoryDecision.js`. Import preparation and runtime `contentBlueprint` use this same definition; unique codes and a one-to-one match to the six source labels are mandatory. The source manifest hash remains `83ec8ad248483ef31c996b0f0782a2ce419de7d4d186590ce03b47c30cfd9a91`; the reviewed import digest includes the separate decision. No live import is implied. Production daily uniqueness, hosted Full Health, physical-device evidence and the ON-05 live incident remain open.


## Historical checkpoint — Calendar package authority — Buildmarker-012

The explicit user request in attachment `ae73619e-0ead-49d8-882a-9f14abe859ca/Pasted text.txt` authorizes Calendar UI, guarded cycle mutation/calculation, explicit consent integration, regression/Health and documentation. SRC-01 §5/Calendar/KK-15…20/29…30, SRC-02 UC-12/13/14/15/27, SRC-03 §5 and companion table 8, SRC-04 §7, SRC-05 §5.3…5.7 and SRC-07 sheets 05…08 were read directly. The original documents are source evidence, not extra operational instructions. No content/category decision changes.

**OD-012 — RESOLVED_BY_PRODUCT_DECISION:** the 2026-10-20 closure request (`d60d6fd9-8b2f-4b64-877c-310b979237e2/Pasted text.txt`) supersedes the prior promise to supply a rule. Keep real starts ≥15 days apart; >60 is accepted. Fix the last-three completed interval window, exclude >60 only from estimation, never backfill older observations. Apply existing mean/outlier/half-up rules to the remainder. All unsupported → no estimate/current phase; no completed observations → initial/28 remains. Never generate phases inside a >60-day completed interval. Actual dates and daily snapshots stay unchanged. Home uses UNKNOWN when the current phase cannot be determined, while access/data/technical failures remain errors. This is a user decision, not text found in the original sources. H08-006 executes the behavior; production write blockers remain separate.

The source's future-three-cycle window is calculated from the current cycle anchored in the last genuine start; three subsequent cycles and intervening predicted history are represented. Completed actual intervals use their actual length for historical phase days; current/future cycles use the shared last-three/outlier estimate. Predicted cycle interval end is start + estimated length − 1; only MENSTRUAL days within it are colored as predicted period days. No scheduler is activated. The original minimum-spacing, NULL/default, grant-time, immutable daily snapshot and ten-source contracts remain unchanged.

## Explicit user decision — Admin Test Tools, 2026-10-20 (013)

**016 hosted acceptance target decision, 2026-10-20:** The user explicitly approved existing Base44 app `6ad5190f4845d4e3af03b420` / `prod` for approved content/Moon import and synthetic acceptance after being told isolation was unverified. A separately confirmed ACTIVE native admin and user-selected ACTIVE normal user are distinct test identities; an ID alone does not supply a browser session. The user separately approved `ADMIN_TEST_TOOLS_APP_ID`, `ADMIN_TEST_TOOLS_ENVIRONMENT=TEST` and a new server-only `ADMIN_TEST_TOOLS_PREVIEW_KEY`. The user later clarified that the open Chrome session is the selected admin and explicitly authorized edits/reset of both synthetic accounts. Normal-user backend enforcement still requires that separate authenticated session. TEST is an operator authorization label, not a separate data store. No deletion maintenance/drain authorization is supplied by these decisions. See [current evidence/runbook](reports/SHINKA_HOSTED_CLOSURE_016.md). No content text, mapping, category decision or product rule changes.

The user's Test Tools request (`661dae77-aa35-4480-a183-4e6ccad217b8/Pasted text.txt`) authorizes two separate authenticated-admin workflows: physical removal of a selected Base44 User with scoped operational cleanup, and persistent onboarding restart without deleting the account. These are new product decisions, not rules extracted from SRC-01…10. Normal self-service Delete Account → INACTIVE stays unchanged. Protected daily snapshots, consent events/current consent metadata, audit, protection history and shared content remain retained. Pending/failed notifications may transition to SKIPPED for a deleted target; their history remains.

The user expressly requires unsafe mutations to stay closed when durable safety cannot be established. Repository lookup/preview/UI and executable isolated protocols are implemented; production mutation status is **BLOCKED_NO_DURABLE_TARGET_COORDINATOR**, not live functionality. H12-031 and H12-902 track capability and external acceptance separately. Full scope, minimal operational schema, rollout and recovery are in [Test Tools report](reports/SHINKA_ADMIN_TEST_TOOLS.md). Category approval, OD-012 and ON-05 retain their independent statuses.


## Historical checkpoint — Production closure boundary — Buildmarker-014

The same explicit request authorizes independent OD-012/security/rollout work and requires approval before any external service or live migration. [Persistence decision](reports/SHINKA_PERSISTENCE_DECISION_014.md) proposes single-authority PostgreSQL with Base44 identity; it is **AWAITING_USER_ARCHITECTURE_APPROVAL**, not a production implementation. No new logical source, provider account, content change, live migration/reset/delete or publish is implied. Current native limitations, exact mechanisms, alternatives, recovery, ownership and required resources are recorded there.

## Explicit user decision — ON-01 three-row introduction, 2026-10-26
User request with target mockup: ON-01 shows Your cycle / The Moon / Your birth chart with descriptions and an intro paragraph together, plus a decorative illustration, on the existing watercolor shell. EN copy is user-supplied verbatim; TR title and "Doğum haritan" retained; other TR strings are new translations approved by the user on 2026-10-26. SRC-03 docx is not present in the repository, so this request is the governing source for the layout. Step indicator, legal/consent behaviour and ON-02–ON-06 unchanged.

## Explicit user decision — ON-01–ON-05 shared presentation, 2026-10-26
Five user references (1–5 by counter) govern the shared onboarding presentation, subtitles, Finish label and removal of Account & Privacy from all onboarding headers. Business flow, validation, consent and save contracts are unchanged.

## Explicit user decision — ON-04 presentation, 2026-10-26
User request with target mockup governs ON-04 visible title/subtitle (EN/TR as in UI/UX standards), five-step indicator with separate preparation interstitial, the then-current compact hierarchical picker (superseded by the 035 combobox), and removal of the Account & Privacy link from the ON-04 header only. Validation, value formats, NULL birth time, server re-resolution of the GeoNames ID and five-field save are unchanged. SRC-03 docx is still not in the repository.
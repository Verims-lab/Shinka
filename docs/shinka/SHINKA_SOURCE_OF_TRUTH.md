# SHINKA — Source of Truth

**Document:** SHINKA_SOURCE_OF_TRUTH.md
**Status:** ACTIVE — governance
**Current BuildMarker:** Buildmarker-011
**Last Updated:** 2026-10-20
**Authoritative Source References:** All 10 registered LOGICAL sources (below)
**Purpose:** Define which document governs which domain, how split documents are counted, and how conflicts are handled.
**Scope:** Whole Shinka project (greenfield). Does not replace the uploaded source files.
**Open Decisions:** OD-001 … OD-011 (see register below)
**External Verification Required:** Live Apple/Google sign-in (EXTERNAL_RELEASE)

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
| Content copy | SRC-08 | — | Exact repository manifest prepared; no live import performed. |
| Content mapping | SRC-09 + SRC-10 | — | 240 = 192 + 48 UNKNOWN (prior recorded validation; final deployed validator must be rerun). |

Illustrative UI mockups never override written business/data rules; the written UI specification overrides mockups.

## 4. Rules
- **Legacy firewall:** NO LEGACY SHINKA CONTRACT MAY ENTER THIS PROJECT WITHOUT AN EXPLICIT CHANGE REQUEST.
- **Conflict handling:** contradictions become OPEN_DECISION entries; never silently reconciled.
- **RESOLVED_*** statuses must cite a resolution rule.

## 5. OPEN_DECISION register (mirror of `src/foundation/openDecisions.js`)
| ID | Status | Summary |
|---|---|---|
| OD-001 | RESOLVED_BY_SOURCE_RECEIPT | UI/UX v1.1 received as 4 transport parts; continuity verified; tokens reconciled. |
| OD-002 | OPEN — CURRENT_IMPORT_BLOCKER | TR display mapping confirmed (SRC-03 table 4); category_code values + EN display names undefined. |
| OD-003 | RESOLVED_BY_REPOSITORY_POLICY | Apple/Google-only repository surface implemented; historical platform snapshot preserved. Current dashboard configuration and live sign-in remain external verification. |
| OD-004 | PARTIALLY_VERIFIED — EXTERNAL_RELEASE | Native created_date/updated_date observed read-only; aliases implemented without duplicate fields. UTC/update/immutable behavior remains unverified. |
| OD-005 | NOTED | "Büyüyen Ay (Hilal)" label mapped to WAXING; UI/UX v1.1 does not redefine it. |
| OD-006 | RESOLVED_BY_PRECEDENCE | notification_delivery uniqueness → DB v1.2. |
| OD-007 | NOTED | Stale version references (Use Case v1.4, Teknik v1.1, UI/UX v1.1 header cites Teknik/DB v1.0). |
| OD-008 | NOTED | Probable typo "dakikeleri" in SHF-002 (TR). |
| OD-009 | PARTIALLY_VERIFIED — EXTERNAL_RELEASE | RLS and shared protected guards implemented with synthetic negative tests; deployed multi-identity enforcement required (H12-901). |
| OD-010 | RESOLVED_BY_SOURCE_RECEIPT | Machine-readable companion exposes all 11 UI/UX tables. |
| OD-011 | NOTED | Onboarding step names (§3 "Welcome/Login", "Cycle Details") vs screen titles; screen titles canonical. |

## Evidence provenance
Inventory READ/continuity/table records mean **SOURCE_RECEIVED_AND_RECORDED**. The original DOCX/XLSX artifacts are external and are not versioned/hash-verified in this repository. This package does not claim **SOURCE_ARTIFACT_HASH_VERIFIED_IN_REPO**. Build-time SHA-256 values cover current repository code/config/canonical Markdown only; they do not authenticate original external files. External artifact hashing is not an additional Foundation blocker.

OD-003 closes repository policy implementation only. The recorded Authentication panel snapshot is historical evidence, not a fresh panel inspection or successful Apple/Google sign-in. OD-002 remains OPEN — CURRENT_IMPORT_BLOCKER. OD-004 and OD-009 are PARTIALLY_VERIFIED — EXTERNAL_RELEASE; neither is resolved.

## Data-model source receipt — Buildmarker-007
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

## ON-04 cascading birthplace decision — 2026-10-20

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


## First Shinka / Home request and source receipt — Buildmarker-011

Authority: current user attachment `cc51dad9-1fa5-423f-a865-3be824e53172/Pasted text.txt`. It explicitly authorizes controlled content preparation/import tooling, the necessary phase/selection backend, ON-06/Home, tests/Health/docs, and honest production blocking if durable uniqueness cannot be proven. Original workbook/Word statements remain source evidence, not separate operational instructions.

SRC-01/02/03/04/05 originals and SRC-07 were reread for this scope. SRC-08/09/10 exact bytes were read and hashed; the manifest preserves punctuation and bilingual pairing. The 011 report records hashes/counts and the concrete six-row OD-002 proposal. Category codes and EN names are absent from approved originals/receipts; they remain unapproved until an explicit reply. This does not change the original ten logical sources or the global original-files-in-Git flag.

Approved astronomy authority is Astronomy Engine JavaScript; Moon phase boundaries and cycle/outlier rules come directly from SRC-01 §§4–6 and SRC-04 §§4–6. The earlier user-approved birth-date-only Sun resolver still overrides legacy source time fallbacks. No legacy implementation or AI product text is introduced. New Home TR/helper presentation copy is scoped to this request; original English state/preparation text is retained. No hosted first Shinka or live import has been observed.

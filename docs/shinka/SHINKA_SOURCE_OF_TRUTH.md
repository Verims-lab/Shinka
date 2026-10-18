# SHINKA — Source of Truth

**Document:** SHINKA_SOURCE_OF_TRUTH.md
**Status:** ACTIVE — governance
**Current BuildMarker:** Buildmarker-008
**Last Updated:** 2026-10-19
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
| Content copy | SRC-08 | — | Not imported. |
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
| OD-002 | OPEN — FUTURE_PACKAGE | TR display mapping confirmed (SRC-03 table 4); category_code values + EN display names undefined. |
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

OD-003 closes repository policy implementation only. The recorded Authentication panel snapshot is historical evidence, not a fresh panel inspection or successful Apple/Google sign-in. OD-002 remains OPEN — FUTURE_PACKAGE. OD-004 and OD-009 are PARTIALLY_VERIFIED — EXTERNAL_RELEASE; neither is resolved.

## Data-model source receipt — Buildmarker-007
SRC-05 v1.2 and SRC-07 v1.2 were reread directly from the supplied local DOCX/XLSX bytes. The backend source-field receipt contains all 20 exact entity field lists from SRC-07 entity sheets. SRC-06 remains subordinate. Business/technical/use-case text was inspected for ownership, nulls, protected records and future workflow boundaries. Attached documents provide source facts; task/implementation instructions come from the user's pasted request.

SHA-256 receipts (2026-10-19): SRC-05 `2e9a99d21309999641d246b0a66bad6c90570ce50afdfd03beb3ee154db94a29`; SRC-07 `db4348c165d61c20527a3dc2903e623486f788f383bcce85196e7aed213bdd69`. This scoped receipt does not change the global original-artifact verification flag: all ten source originals are not versioned/hash-verified in Git. No source count or precedence changed and no content workbook rows were imported.

## Authentication/onboarding source findings — current package

The Oct 18 source set remains the sole product authority. Written SRC-03 ON-01…06 order controls. The user confirmed on 2026-10-19 that no additional approved Sun resolver or TR onboarding copy source exists. Existing Foundation TR text marked PENDING_COPY_REVIEW is not promoted to approved onboarding copy.

| Finding | Affected capability | Current resolution |
|---|---|---|
| SUN_SIGN_CALCULATION_RULE_SOURCE_GAP | Backend profile Sun sign | OPEN. No boundary algorithm exists in the sources/repository. Resolver is null; no inferred zodiac dates and no UNCERTAIN. |
| SOURCE_COPY_GAP | TR onboarding | OPEN. Key parity exists, approved EN values retained; TR values deliberately null. UI shows the Test source-gap state and allows explicit EN selection. |
| HEALTH_CONSENT_VERSION_SOURCE_GAP | Durable consent grant | OPEN. A version is required by the model, but approved grant text/version was not supplied. No fabricated v1. |
| ONBOARDING_DURABLE_COMPLETION_MARKER_SOURCE_GAP | Exact cross-session resume after cycle skip | OPEN. No schema field/entity added. Existing persisted profile/preferences/period/daily state determines safe resumption; skipped ON-05 may reappear after reload. |

These findings are recorded in `base44/shared/onboardingDependencies.js` and Health H07/H11. `ATOMIC_CAPABILITY_REQUIRED` is an implementation capability dependency, not a missing product rule. `FIRST_SHINKA_ENGINE_REQUIRED` is an expected next-package dependency. They keep the package OPEN without preventing implementation/testing of independent contracts.

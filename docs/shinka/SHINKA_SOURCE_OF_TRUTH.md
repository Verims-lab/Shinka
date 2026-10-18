# SHINKA — Source of Truth

**Document:** SHINKA_SOURCE_OF_TRUTH.md
**Status:** ACTIVE — governance
**Current BuildMarker:** Buildmarker-002
**Last Updated:** 2026-10-18
**Authoritative Source References:** All 10 registered LOGICAL sources (below)
**Purpose:** Define which document governs which domain, how split documents are counted, and how conflicts are handled.
**Scope:** Whole Shinka project (greenfield). Does not replace the uploaded source files.
**Open Decisions:** OD-001 … OD-011 (see register below)
**External Verification Required:** OD-010 (UI/UX copy tables as text)

## 1. Logical vs physical sources
- A **logical source** is one authoritative document (one version, one domain authority).
- A **physical attachment** is an uploaded file. A logical source may be transported in several physical parts **only** because of the Base44 attachment size limit (5 MB). The split is transport-only: parts never create separate domains, design systems, document records, rules or precedence.
- **Authoritative logical source count: 10.** Physical attachment count: **13** (UI/UX = 4 parts; the other nine = 1 file each).

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

Continuity (read in order 1→2→3→4): P1 ends ON-02 → P2 starts ON-03; P2 ends ON-06 → P3 starts §4; P3 ends §7.3 → P4 starts §7.4. No duplicated or missing section; sections 1–9 all present. Tables/images inside sections (§2 token tables, §8 copy tables, §9 checklist) are not text-extractable → OD-010.

## 3. Domain precedence

| Domain | Primary Source | Supporting Source | Implementation Notes |
|---|---|---|---|
| Business behavior | SRC-01 | — | İK/KK codes are binding acceptance criteria. |
| User / system flows | SRC-02 | SRC-01 | UC-01…UC-27. |
| UI / UX / copy / design | SRC-03 (combined Part 1–4) | — | Screen inventory, navigation, visible copy, tokens, typography, icons, spacing, components, interaction, loading/error/empty/validation states, accessibility, EN/TR UI behavior. |
| Technical architecture | SRC-04 | SRC-05 | DOĞRULANACAK → UNVERIFIED_PLATFORM_CAPABILITY. |
| Data model | SRC-05 + SRC-07 | SRC-06 | v1.2 wins over v1.1 on conflict. |
| Content copy | SRC-08 | — | Not imported. |
| Content mapping | SRC-09 + SRC-10 | — | 240 = 192 + 48 UNKNOWN (validated live). |

Illustrative UI mockups never override written business/data rules; the written UI specification overrides mockups.

## 4. Rules
- **Legacy firewall:** NO LEGACY SHINKA CONTRACT MAY ENTER THIS PROJECT WITHOUT AN EXPLICIT CHANGE REQUEST.
- **Conflict handling:** contradictions become OPEN_DECISION entries; never silently reconciled.
- **RESOLVED_*** statuses must cite a resolution rule.

## 5. OPEN_DECISION register (mirror of `src/foundation/openDecisions.js`)
| ID | Status | Summary |
|---|---|---|
| OD-001 | RESOLVED_BY_SOURCE_RECEIPT | UI/UX v1.1 received as 4 transport parts; continuity verified; tokens reconciled. |
| OD-002 | OPEN | category_code values + EN display names undefined. |
| OD-003 | OPEN | Apple/Google-only auth vs platform email/password + Google; Apple unverified. |
| OD-004 | OPEN | Explicit created_at/updated_at vs Base44 built-ins. |
| OD-005 | NOTED | "Büyüyen Ay (Hilal)" label mapped to WAXING; UI/UX v1.1 does not redefine it. |
| OD-006 | RESOLVED_BY_PRECEDENCE | notification_delivery uniqueness → DB v1.2. |
| OD-007 | NOTED | Stale version references (Use Case v1.4, Teknik v1.1, UI/UX v1.1 header cites Teknik/DB v1.0). |
| OD-008 | NOTED | Probable typo "dakikeleri" in SHF-002 (TR). |
| OD-009 | OPEN | Platform-native enforcement of admin-immutable records unverified. |
| OD-010 | OPEN | UI/UX §2/§8/§9 tables not text-extractable; copy dictionary + TR copy unverifiable string-by-string. |
| OD-011 | NOTED | Onboarding step names (§3 "Welcome/Login", "Cycle Details") vs screen titles; screen titles canonical. |
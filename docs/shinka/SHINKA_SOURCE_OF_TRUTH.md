# SHINKA — Source of Truth

**Document:** SHINKA_SOURCE_OF_TRUTH.md
**Status:** ACTIVE — governance
**Current BuildMarker:** Buildmarker-001
**Last Updated:** 2026-10-18
**Authoritative Source References:** All 10 registered source files (below)
**Purpose:** Define which uploaded document governs which domain, and how conflicts are handled.
**Scope:** Whole Shinka project (greenfield). Does not replace the uploaded source files.
**Open Decisions:** OD-001 … OD-009 (see register below)
**External Verification Required:** UI/UX v1.1 receipt (OD-001)

## 1. Registered sources (set `SRC-2026-10-18`)

| ID | File | Version | Date | Domain | Authority | Status |
|---|---|---|---|---|---|---|
| SRC-01 | Shinka_Is_Analizi_v2.5_Tutarli.docx | 2.5 | 2026-10-18 | Business behavior | PRIMARY | READ |
| SRC-02 | Shinka_Use_Case_v1.4_Tutarli.docx | 1.4 | 2026-10-18 | User/system flows | PRIMARY | READ |
| SRC-03 | Shinka_UI_UX_Tasarim_v1.1_Tutarli.docx | 1.1 | 2026-10-18 | UI/UX/copy/design | PRIMARY | **NOT RECEIVED** |
| SRC-04 | Shinka_Teknik_Analiz_v1.1_Tutarli.docx | 1.1 | 2026-10-18 | Technical architecture | PRIMARY | READ |
| SRC-05 | Shinka_Veritabani_Tasarim_v1.2_Tutarli.docx | 1.2 | 2026-10-18 | Data model | PRIMARY | READ |
| SRC-06 | Shinka_DB_v1_1.docx | 1.1 | 2026-10-18 | Data model | SUPPORTING — superseded by SRC-05 | READ |
| SRC-07 | Shinka_Veritabani_Entity_Iliskiler_v1.2.xlsx (23 sheets) | 1.2 | 2026-10-18 | Data model | PRIMARY | READ |
| SRC-08 | Shinka_Free_260_YS_Suggestion_TR_EN.xlsx (260 rows, 6 cols) | — | 2026-10-18 | Content copy | PRIMARY | READ |
| SRC-09 | Shinka_Free_240_Eslestirme_40Gun_Test_Sade.xlsx (240 rows) | — | 2026-10-18 | Content mapping | PRIMARY | READ |
| SRC-10 | Shinka_Free_192_Kategori_Eslestirme.xlsx (192 rows) | — | 2026-10-18 | Content mapping | SUPPORTING (subset of SRC-09) | READ |

## 2. Domain precedence

| Domain | Primary Source | Supporting Source | Implementation Notes |
|---|---|---|---|
| Business behavior | SRC-01 | — | İK/KK codes are binding acceptance criteria. |
| User / system flows | SRC-02 | SRC-01 | UC-01…UC-27. |
| UI / UX / copy / design | SRC-03 | — | Not received → tokens PROVISIONAL. |
| Technical architecture | SRC-04 | SRC-05 | DOĞRULANACAK → UNVERIFIED_PLATFORM_CAPABILITY. |
| Data model | SRC-05 + SRC-07 | SRC-06 | v1.2 wins over v1.1 on conflict. |
| Content copy | SRC-08 | — | Not imported in Buildmarker-001. |
| Content mapping | SRC-09 | SRC-10 | 240 = 192 + 48 UNKNOWN (validated live). |

## 3. Rules
- **Legacy firewall:** NO LEGACY SHINKA CONTRACT MAY ENTER THIS PROJECT WITHOUT AN EXPLICIT CHANGE REQUEST. No entities, code, Health cases, engines, translations or docs from any earlier Shinka app.
- **Conflict handling:** contradictory statements are never silently reconciled. A material conflict becomes an OPEN_DECISION with sources, conflict, impact and recommendation; only unaffected work continues.
- **RESOLVED_BY_PRECEDENCE** is allowed only when a documented precedence rule decides it (e.g. DB v1.2 > v1.1).

## 4. OPEN_DECISION register (mirror of `src/foundation/openDecisions.js`)
| ID | Status | Summary |
|---|---|---|
| OD-001 | OPEN (blocking) | UI/UX v1.1 not uploaded; exact design/copy unverifiable. |
| OD-002 | OPEN | category_code values + EN display names undefined; workbook labels vs DB v1.2 TR display names need explicit mapping. |
| OD-003 | OPEN | Apple/Google-only auth vs platform email/password + Google; Apple unverified. |
| OD-004 | OPEN | Explicit created_at/updated_at vs Base44 built-in created_date/updated_date. |
| OD-005 | NOTED | "Büyüyen Ay (Hilal)" label mapped to WAXING (First Quarter→Full). |
| OD-006 | RESOLVED_BY_PRECEDENCE | notification_delivery uniqueness → DB v1.2 UNIQUE(daily_message_id, notification_type). |
| OD-007 | NOTED | Stale version references in Use Case v1.4 / Teknik v1.1. |
| OD-008 | NOTED | Probable typo "dakikeleri" in SHF-002 (TR). |
| OD-009 | OPEN | Platform-native enforcement of admin-immutable records unverified. |
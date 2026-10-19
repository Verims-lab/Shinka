# SHINKA — Content Model

**Document:** SHINKA_CONTENT_MODEL.md
**Status:** ACTIVE — validated contract, no import
**Current BuildMarker:** Buildmarker-008
**Last Updated:** 2026-10-19
**Authoritative Source References:** SRC-08 (copy), SRC-09 + SRC-10 (mapping), SRC-01 §6
**Purpose:** Pair/category/mapping contract for the deterministic daily content engine.
**Scope:** Content artifacts and selection rules. No live import in this package.
**Implemented:** Read-only live validator `validateContentArtifacts` + H05 cases; empty content entity schema definitions.
**Not Implemented:** Import, selection engine.
**Open Decisions:** OD-002, OD-005, OD-008

## Pair model
One Pair ID (`SHF-001`…`SHF-260`) = Your Shinka + Today's Suggestion, TR and EN. Never selected one-sided. 260 is the starting library, not a cap. All pairs Active; no deactivate/delete in this version.

## Six categories (validated 2026-10-18)
| Workbook label | Count | DB v1.2 TR display (proposed, OD-002) |
|---|---|---|
| Dinlenme & Yavaşlama | 30 | Kendine Bir Nefes |
| Öz Bakım & İyi Hissetme | 66 | Kendine İyi Gel |
| Yenilik & Keşif | 56 | Yeniye Yer Aç |
| Odaklanma & İlerleme | 32 | Küçük Adımlarla İlerle |
| Bağ Kurma & Paylaşım | 44 | Bağlarını Güçlendir |
| Sadeleşme & Bırakma | 32 | Hafiflemeye İzin Ver |

## Mapping
- 192 base = 12 signs × 4 moon phases (Yeni Ay, Büyüyen Ay (Hilal), Dolunay, Küçülen Ay) × 4 cycle phases (Menstrüel, Foliküler, Ovulasyon, Luteal).
- 48 UNKNOWN rows ("Bilinmiyor").
- 240 total. Live validation: 240 file = 192 file row-for-row (same categories) + 48 UNKNOWN; 0 duplicates; 0 missing combinations; 0 missing TR/EN cells.

## Selection rules (future H09)
Existing local-day record → return. Else mapping category → random Active pair not shown in last 40 days (first show day counts; day 41 eligible) → other categories → least-recently-shown Active (ties random; only here 40-day rule may be exceeded). Store actual category_id; TR/EN snapshots immutable; language switch shows the other snapshot of the same pair.

## Ownership
Workbooks are the content authority; any edit to copy/mapping is a source change and requires a new package.

## Mandatory integrity propagation
The shared validator returns missingCategory for content and both mappings. H05-003 fails missing/unknown categories or missing six-category coverage; H05-004/005 fail missing category cells, missing combinations, invalid values or duplicate mappings; H05-006 also requires valid base/extended mappings. H05-007 checks duplicate/malformed IDs and mappings; H05-008 checks every required TR/EN cell. T61–T67 generate synthetic 260/192/240 fixtures (no product copy) and run the actual H05 decisions for valid and invalid inputs. OD-002 remains a future content-import decision.

## Empty data foundation — Buildmarker-007
MessageCategoryLookup, MessageCategoryMapping, MessagePair and immutable UserDailyMessage are physically represented in repository JSONC. No 260/192/240 data was imported and no daily engine was implemented. Category codes remain text until OD-002 is authoritatively closed; no guessed EN names or categories are seeded. MessagePair is_active has only the approved Active state. Required TR/EN strings have no invented editorial length cap. Only a future trusted importer may author shared content through the guarded backend path; normal users cannot write it. No Moon/Cycle lookup population was performed.

## First-Shinka boundary — current package

Authentication/onboarding introduces only the ON-06 preparation/dependency screen. FIRST_SHINKA_ENGINE_REQUIRED remains open. No content/category/mapping workbook is imported, no Moon or cycle phase is calculated, no Pair is chosen, and no user_daily_message is generated. Existing legitimate daily data may route an authenticated active user to the unchanged Home shell. UC-06 and the complete Daily Content Engine belong to the next package.

## HC-007.0 pre-content live-state contract

Physical content schemas were intentionally established in 007; the previous H05-009 ABSENT-schema expectation is obsolete. Schema presence is distinct from seeded/imported rows. For 008, H05-009 requires live unfiltered counts of 0 for MessageCategoryLookup, MessageCategoryMapping and MessagePair, together with the read-only validator's importPerformed=false. Admin Data panel measurements on 2026-10-19 confirmed all three at 0; no data was changed. The new admin-only server aggregate returns counts/measurement metadata, never row contents. Missing or invalid measurements block; positive rows fail with UNEXPECTED_PRODUCT_CONTENT_PRESENT and are not automatically removed.

This is a staged package policy, not a permanent empty-content requirement. From 009 onward the case requires a new approved imported-count/content-validation policy and blocks until it exists. H05-001…008 retain all workbook integrity checks. No content import, category/mapping/pair population or Daily Content Engine is added by this closure.

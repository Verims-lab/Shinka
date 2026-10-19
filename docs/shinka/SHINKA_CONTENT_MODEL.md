# SHINKA — Content Model

**Document:** SHINKA_CONTENT_MODEL.md
**Status:** ACTIVE — source prepared; controlled import and engine implemented; production daily persistence blocked
**Current BuildMarker:** Buildmarker-011
**Last Updated:** 2026-10-19
**Authoritative Source References:** SRC-08 (copy), SRC-09 + SRC-10 (mapping), SRC-01 §6
**Purpose:** Pair/category/mapping contract for the deterministic daily content engine.
**Scope:** Source preparation, controlled import, daily selection and Home. No live import has been executed.
**Implemented:** Workbook validator, exact backend manifest, dry-run/apply/verify importer, Moon preparation, daily selection and snapshot protocol, ON-06/Home integration.
**Not Implemented:** Verified production daily create-if-absent adapter; live import/generation proof; scheduled lookup renewal.
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

## Selection rules (implemented H09; production persistence blocked)
Existing local-day record → return. Else mapping category → random Active pair not shown in last 40 days (first show day counts; day 41 eligible) → other categories → least-recently-shown Active (ties random; only here 40-day rule may be exceeded). Store actual category_id; TR/EN snapshots immutable; language switch shows the other snapshot of the same pair.

## Ownership
Workbooks are the content authority; any edit to copy/mapping is a source change and requires a new package.

## Mandatory integrity propagation
The shared validator returns missingCategory for content and both mappings. H05-003 fails missing/unknown categories or missing six-category coverage; H05-004/005 fail missing category cells, missing combinations, invalid values or duplicate mappings; H05-006 also requires valid base/extended mappings. H05-007 checks duplicate/malformed/missing/out-of-range IDs and mappings; H05-008 checks every required TR/EN cell. T61–T67 generate synthetic 260/192/240 fixtures (no product copy) and run the actual H05 decisions for valid and invalid inputs. OD-002 is now a current content-import blocker.

## Empty data foundation — Buildmarker-007
MessageCategoryLookup, MessageCategoryMapping, MessagePair and immutable UserDailyMessage are physically represented in repository JSONC. No 260/192/240 data was imported and no daily engine was implemented. Category codes remain text until OD-002 is authoritatively closed; no guessed EN names or categories are seeded. MessagePair is_active has only the approved Active state. Required TR/EN strings have no invented editorial length cap. Only a future trusted importer may author shared content through the guarded backend path; normal users cannot write it. No Moon/Cycle lookup population was performed.

## Historical First-Shinka boundary — packages 008–010

Authentication/onboarding introduces only the ON-06 preparation/dependency screen. FIRST_SHINKA_ENGINE_REQUIRED remains open. No content/category/mapping workbook is imported, no Moon or cycle phase is calculated, no Pair is chosen, and no user_daily_message is generated. Existing legitimate daily data may route an authenticated active user to the unchanged Home shell. UC-06 and the complete Daily Content Engine belong to the next package.

## Historical HC-008.0 pre-content live-state contract

Physical content schemas were intentionally established in 007; the previous H05-009 ABSENT-schema expectation is obsolete. Schema presence is distinct from seeded/imported rows. For the explicitly pre-content 007/008/009 packages, H05-009 requires live unfiltered counts of 0 for MessageCategoryLookup, MessageCategoryMapping and MessagePair, together with the read-only validator's importPerformed=false. Admin Data panel measurements on 2026-10-19 confirmed all three at 0; no data was changed. The new admin-only server aggregate returns counts/measurement metadata, never row contents. Missing or invalid measurements block; positive rows fail with UNEXPECTED_PRODUCT_CONTENT_PRESENT and are not automatically removed.

This is a staged package policy, not a permanent empty-content requirement. Package 009 is explicitly maintenance-only, so it retains zero-row/no-import enforcement. Other future packages require an approved policy and block until one exists; no future package is automatically treated as imported content. H05-001…008 retain all workbook integrity checks. No content import, category/mapping/pair population or Daily Content Engine is added by this closure.


## Buildmarker-011 source and import contract

The three original workbook files were read and hash-verified locally. `firstContentSource.js` contains the exact 260 Pair IDs/four text cells and 240 mappings; `contentSourceReceipt.js` contains only the digest. `prepareFirstContent.mjs` reuses the canonical XLSX reader/validators, requires SHF-001…SHF-260 exactly, six approved category counts, no missing texts/duplicate identity tuples, and 240 = identical 192 + 48 UNKNOWN. No punctuation correction is made, including OD-008. Sources, SHA-256 values and operational steps are in [the 011 handoff](reports/SHINKA_FIRST_SHINKA_011.md). This is repository preparation, not live data insertion.

OD-002 remains a current import blocker until category codes/EN names are explicitly approved. The proposed table is not executable reference data. The importer accepts no caller-supplied source/content/category definitions. Admin-only `contentLibrary` supports dryRun, verify and applyBatch, plus moonDryRun/moonApplyBatch. Dry-run/verify write nothing. Apply requires the exact freshly observed digest, rejects any conflict, creates at most 25 missing rows, then re-reads the full bounded set. Full-value keys prevent changed text from being silently overwritten. Lost responses can leave rows durable; sequential retry re-inspects them and reuses exact matches. Concurrent import operators are unsupported because Base44 has no native uniqueness; duplicates fail readiness, never delete/reload or silently repair.

No source Pair ID field was added to the 20-entity contract. Exact category plus all four text cells uniquely identify each original pair. Verification returns its SHF ID → native MessagePair.id crosswalk. An edited/unrecognized/duplicated row or broken relationship is a conflict. Initial-package bounds are 6 categories, 240 mappings and 260 pairs, with one extra row queried to detect overflow. A later source expansion requires a new manifest/package; 260 is not a permanent domain limit.

H05-009 now distinguishes PRE_IMPORT (or SOURCE_DECISION_REQUIRED) with verified zero counts from VERIFIED_IMPORTED with exact expected source hash, counts, every relation/text and a complete one-to-one crosswalk. Partial/conflicting data fails; absent evidence blocks. Pre-import PASS does not mean production-ready. H09-004 remains BLOCKED until production persistence is verified.

The pure engine implements mapped-category random selection, other-category fallback, then least-recent active/ties random. History query is only [today−39,today], at most 41 rows to detect duplicate-day overflow. A showing on day 1 is eligible on day 41 (difference 40). Final fallback needs no older history: when every active pair is protected, each latest showing is necessarily in the bounded window. Saved category is the chosen pair's category. Both language snapshots are immutable.

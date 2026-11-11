# SHINKA — Content Model

**Document:** SHINKA_CONTENT_MODEL.md
**Status:** ACTIVE — approved references imported; native daily snapshot observed; hosted acceptance remains partial
**Current BuildMarker:** Buildmarker-069
**Last Updated:** 2026-10-26
**Authoritative Source References:** SRC-08 (copy), SRC-09 + SRC-10 (mapping), SRC-01 §6
**Purpose:** Pair/category/mapping contract for the deterministic daily content engine.
**Scope:** Source preparation, controlled import, daily selection and Home; shared app/prod explicitly authorized for synthetic acceptance.
**Implemented:** Workbook validator, exact backend manifest, dry-run/apply/verify importer, Moon preparation, daily selection and snapshot protocol, ON-06/Home integration.
**Not Implemented:** Distributed physical uniqueness guarantee; scheduled lookup renewal. Remaining hosted/device evidence is tracked separately.
**Open Decisions:** OD-005, OD-008 (noted); OD-002 RESOLVED_BY_PRODUCT_DECISION


## 059 — Pattern presentation source boundary

Exactly one primary assigned category is presented; the six approved codes/names, 240 mappings, 260 Pair texts and daily ID references are unchanged. No daily message is repurposed as category explanation. The six TR/EN explanation pairs and category-specific illustration associations were not found in accessible authoritative sources; they remain SOURCE_REQUIRED and are not imported/generated/inferred from the sample mockup. See [059](reports/SHINKA_PATTERN_NAVIGATION_059.md).


## 058 — Narrow core closure (2026-11-01)

Monthly Moon maintenance is a deliberate operator task at each UTC month boundary and before a release crossing that boundary. The fixed astronomy-engine 2.1.19 generator uses the first day of the next UTC month and requires two forward years from that horizon. Compare current-phase coverage separately from the expected future tail; neither an old row count nor current-day availability proves full readiness. Use admin moonDryRun → inspect fresh digest/missing/same/conflicts → sequential moonApplyBatch (maximum 25) → independent moonDryRun and full inventory verification. Stop on conflict/gap/overlap; preserve existing IDs/boundaries. Immediate post-write reads may lag: an attempted count is not completion, and an uncertain write requires a fresh read before any retry. Never auto-import from Health/Home or enable a scheduler. November 058 added four tail rows, preserving 103 existing rows; complete current set 107 / expected matches 103 / missing 0. Approved six categories/240 mappings/260 pairs and all copy remain unchanged. [Actual receipts](reports/core-closure-058/moon-hosted.json).


## 051 — Core Reliability & Performance

051 preserves approved 6 categories, 240 mappings, 260 content pairs and Moon rules; no import or copy rewrite. New daily writes remain ID-only and reads resolve current MessagePair. Reviewed hosted snapshot cleanup may remove only the four legacy fields, preserving assignment/native IDs and NotificationDelivery links. A lifecycle-blocked target remains unchanged; do not advance final schema/generator/inspector/D23 before complete verify.

051 hosted four-field cleanup removed 48 redundant fields from 12 rows; 24 remain on six lifecycle-blocked rows. All 18 assignments and source-content references remain; current MessagePair text lookup and approved 6/240/260 content are unchanged. Final physical field removal is still gated on complete hosted verify.

## 045 — MessagePair authority (current)

Current text is resolved by the existing message_pair_id, never by a source row number, old text match or guessed replacement. Four response `_snapshot` names are compatibility DTO fields, not persisted copies. Changed text appears on the next read; kept-mounted Home reactivation performs that read. Existing inactive Pair assignments remain readable; new selection still chooses Active. Missing/invalid Pair text is a safe error, never random reassignment. Selection metadata reads only IDs/category/eligibility; selected text uses bounded ID batches. Category/mapping manifest checks, 40-day exclusion, all-candidate history and Pattern's assigned-category counting remain. Source importer still refuses text conflicts/overwrites; an approved catalog edit may therefore produce an import conflict, not an excuse to restore source text. This package changes no reference texts or source hash. Historical immutable-text rules below are superseded by the explicit 045 owner decision; source provenance is retained.


## 030 — notification continuation preserves daily content

Only the explicit staged-content package allowlist advances to 030. No source pair/category/mapping/Moon bytes, import predicates or daily algorithm changes. Home and admitted job still share produceDailyForOwner; preference off, denied/unknown device support and unknown provider result do not create replacement content. NC07/08 extend the existing daily-ID preservation assertions. No import performed.

## 029 — notification content independence

Scheduler and Home call the same produceDailyForOwner engine with distinct authorization. Notification preference/OS permission never change pair selection, snapshots, 40-day history or health-consent rules. Retry only changes NotificationDelivery. Current-day canonical candidates are reconciled through nativeDailyPersistence; original rows are retained, never overwritten. No content import, text change or second generation algorithm is introduced. Lock-screen copy is neutral 029 wording, not a user_daily_message snapshot. Production scheduling remains blocked by platform bindings.

## 028 verification correction

The marker advanced to 028 while the explicit staged-content allowlist still ended at 027. Local Chromium/WebKit exposed HC08/DM23 failures and H05-010 failure. Add only 028 to the existing VERIFIED_CONTENT_IMPORT_STAGES policy. Source hashes, exact 6/240/260 counts, Pair-ID bijection, partial/conflict rejection and pre-import distinction are unchanged; HC12 still rejects the next unapproved package (029). No content bytes, importer, provider or live data changes. Initial failed runs remain in the [028 report](reports/SHINKA_SECURITY_CLOSURE_028.md).

## 027 preservation

No source text, pair, category/mapping, Moon reference, importer or daily selection change. The explicit VERIFIED_CONTENT_IMPORT_STAGES package allowlist advances to 027; imports are not run. Product route continuity preserves only owner-bound resolver state, never a new daily record or a reference cache. Existing daily immutable readback and published-versus-local evidence distinctions remain.

## Privacy lifecycle and historical content — 023

Withdrawal preserves existing daily bilingual snapshots and assigned Pattern categories. These contain no period dates, cycle settings or calculated phases, and they are never used to recreate withdrawn health input. New daily selection uses UNKNOWN without a current valid grant; an open withdrawal fence cannot read/process cycle inputs. Pattern remains a read-only historical category projection. Account erasure removes the owner's UserDailyMessage, UserPatternSummary and NotificationDelivery records through the narrow confirmed erasure path; normal content/admin mutations remain immutable-denied. Re-registration with a new native identity does not match the removed owner's history. The six categories, 240 mappings, 260 source pairs, Moon references and source hashes are unchanged; 023 continues the approved import-validation policy without an import.


## You preservation — 022

No content, category mapping, text, Moon reference or import changes. Profile/name/language/preference edits never update or regenerate an existing daily snapshot or reassign historical Pattern categories. Language selects current linked Pair text (045). A changed birth date/Sun affects only the existing selection inputs for a future ungenerated day; the current-day reuse rule is unchanged. Tests compare all protected fixture tables before/after actual owner updates.

## Pattern historical assignment — 021

Pattern counts assigned native category IDs from immutable daily candidates. It never consults present Sun/Moon/cycle mapping to reconstruct history, does not import or select a new Pair, and does not rewrite snapshots. Shared dailyCandidateSelection chooses the same observed user/day winner as Home; unlike Home's repeat exclusion (all candidates), Pattern counts each logical day once. Current lookup must match all six OD-002 codes and exact TR/EN names. Locale changes only presentation, never counts/rank.

Package 021 explicitly continues VERIFIED_CONTENT_IMPORT_STAGES without changing six categories, 240 mappings, 260 pairs or source hash. No live content/Moon import or fresh reference acceptance is claimed.

## 020 package continuity

Package 020 retains the approved VERIFIED_CONTENT_IMPORT_STAGES policy (6 categories / 240 mappings / 260 content pairs) with unchanged source hashes and readiness checks. It only advances the explicit package allowlist; no content generation, import or override is performed.

## 019 audit — content unchanged

No category, mapping, bilingual content, Moon reference or import operation changes in this package. The approved import policy now explicitly includes package 019, continuing exact source/hash/relation verification. The 016 hosted receipt records 6 categories, 240 mappings and 260 pairs; it is historical, not a fresh live verification. Home preserves existing immutable snapshots and the accepted native candidate reconciliation/40-day exclusion contract. H05/H09 retain actual reference verification prerequisites; missing measurements cannot become PASS. Health placeholders are separated without deleting content acceptance IDs.

## Base44 reference readiness and snapshots — 016

The six approved category codes/TR/EN names, 240 mappings, 260 bilingual pairs and source hash remain unchanged. Native admin dry-run/reviewed digest/bounded apply/readback is the current import path; operator serializes imports. Home never imports or overwrites content. Ordinary keyed upsert is not unique under independent workers.

Historical read-only check 2026-10-20T17:02:37.305Z found missing 6/260/240 and 103 planned Moon intervals. Following explicit target approval, serial bounded reviewed-digest imports completed. At 18:20:41.517Z, full verify is VERIFIED_IMPORTED: same=6/260/240, missing/conflicts=0, source hash unchanged and all 260 source/native Pair IDs bijective. Moon ready=true with stored validated coverage 2026-10-03T13:25:33.710Z → 2028-11-02T09:17:57.674Z, beyond the current required 2028-11-01 horizon; 103 is observed, not a fixed target. Initial 500/502 attempts and resumed import journals are preserved in [hosted closure evidence](reports/SHINKA_HOSTED_CLOSURE_016.md).

Explicit content-phase policy includes 016 and LIVE_BASE44_COUNT only. Daily candidates are immutable; earliest persisted generated_at then ID wins, conflicting candidates trigger notice and all candidates remain in the repeat window. The selected synthetic admin's daily ID/full snapshot stayed identical across concurrent authenticated requests; this does not prove global physical uniqueness under independent workers.

## Pair model
One Pair ID (`SHF-001`…`SHF-260`) = Your Shinka + Today's Suggestion, TR and EN. Never selected one-sided. 260 is the starting library, not a cap. All pairs Active; no deactivate/delete in this version.

## Six categories (validated 2026-10-18)
| Workbook label | Count | Source TR display (preserved by OD-002 approval) |
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

## Selection rules (implemented H09; native acceptance evidence bounded above)
Existing local-day record → return. Else mapping category → random Active pair not shown in last 40 days (first show day counts; day 41 eligible) → other categories → least-recently-shown Active (ties random; only here 40-day rule may be exceeded). Store actual category_id; Assignment immutable; language switch shows the other current language of the same Pair (045).

## Ownership
Workbooks are the content authority; any edit to copy/mapping is a source change and requires a new package.

## Mandatory integrity propagation
The shared validator returns missingCategory for content and both mappings. H05-003 fails missing/unknown categories or missing six-category coverage; H05-004/005 fail missing category cells, missing combinations, invalid values or duplicate mappings; H05-006 also requires valid base/extended mappings. H05-007 checks duplicate/malformed/missing/out-of-range IDs and mappings; H05-008 checks every required TR/EN cell. T61–T67 generate synthetic 260/192/240 fixtures (no product copy) and run the actual H05 decisions for valid and invalid inputs. OD-002 is RESOLVED_BY_PRODUCT_DECISION; the category definition gap is closed by the user approval of 2026-10-20.

## Historical checkpoint — Empty data foundation — Buildmarker-007
MessageCategoryLookup, MessageCategoryMapping, MessagePair and immutable UserDailyMessage are physically represented in repository JSONC. No 260/192/240 data was imported and no daily engine was implemented. Category codes remain text until OD-002 is authoritatively closed; no guessed EN names or categories are seeded. MessagePair is_active has only the approved Active state. Required TR/EN strings have no invented editorial length cap. Only a future trusted importer may author shared content through the guarded backend path; normal users cannot write it. No Moon/Cycle lookup population was performed.

## Historical First-Shinka boundary — packages 008–010

Authentication/onboarding introduces only the ON-06 preparation/dependency screen. FIRST_SHINKA_ENGINE_REQUIRED remains open. No content/category/mapping workbook is imported, no Moon or cycle phase is calculated, no Pair is chosen, and no user_daily_message is generated. Existing legitimate daily data may route an authenticated active user to the unchanged Home shell. UC-06 and the complete Daily Content Engine belong to the next package.

## Historical HC-008.0 pre-content live-state contract

Physical content schemas were intentionally established in 007; the previous H05-009 ABSENT-schema expectation is obsolete. Schema presence is distinct from seeded/imported rows. For the explicitly pre-content 007/008/009 packages, H05-009 requires live unfiltered counts of 0 for MessageCategoryLookup, MessageCategoryMapping and MessagePair, together with the read-only validator's importPerformed=false. Admin Data panel measurements on 2026-10-19 confirmed all three at 0; no data was changed. The new admin-only server aggregate returns counts/measurement metadata, never row contents. Missing or invalid measurements block; positive rows fail with UNEXPECTED_PRODUCT_CONTENT_PRESENT and are not automatically removed.

This is a staged package policy, not a permanent empty-content requirement. Package 009 is explicitly maintenance-only, so it retains zero-row/no-import enforcement. Other future packages require an approved policy and block until one exists; no future package is automatically treated as imported content. H05-001…008 retain all workbook integrity checks. No content import, category/mapping/pair population or Daily Content Engine is added by this closure.


## Historical checkpoint — Buildmarker-011 source and import contract

The three original workbook files were read and hash-verified locally. `firstContentSource.js` contains the exact 260 Pair IDs/four text cells and 240 mappings; `contentSourceReceipt.js` contains only the digest. `prepareFirstContent.mjs` reuses the canonical XLSX reader/validators, requires SHF-001…SHF-260 exactly, six approved category counts, no missing texts/duplicate identity tuples, and 240 = identical 192 + 48 UNKNOWN. No punctuation correction is made, including OD-008. Sources, SHA-256 values and operational steps are in [the 011 handoff](reports/SHINKA_FIRST_SHINKA_011.md). This is repository preparation, not live data insertion.

OD-002 is resolved by the explicit user approval of 2026-10-20. `contentCategoryDecision.js` now contains that exact approved table; codes and EN names are attributed to the user, with original TR display names preserved. The importer accepts no caller-supplied source/content/category definitions. Admin-only `contentLibrary` supports dryRun, verify and applyBatch, plus moonDryRun/moonApplyBatch. Dry-run/verify write nothing. Apply requires the exact freshly observed digest, rejects any conflict, creates at most 25 missing rows, then re-reads the full bounded set. Full-value keys prevent changed text from being silently overwritten. Lost responses can leave rows durable; sequential retry re-inspects them and reuses exact matches. Concurrent import operators are unsupported because Base44 has no native uniqueness; duplicates fail readiness, never delete/reload or silently repair.

No source Pair ID field was added to the 20-entity contract. Exact category plus all four text cells uniquely identify each original pair. Verification returns its SHF ID → native MessagePair.id crosswalk. An edited/unrecognized/duplicated row or broken relationship is a conflict. Initial-package bounds are 6 categories, 240 mappings and 260 pairs, with one extra row queried to detect overflow. A later source expansion requires a new manifest/package; 260 is not a permanent domain limit.

H05-009 now distinguishes PRE_IMPORT (or SOURCE_DECISION_REQUIRED) with verified zero counts from VERIFIED_IMPORTED with exact expected source hash, counts, every relation/text and a complete one-to-one crosswalk. Partial/conflicting data fails; absent evidence blocks. Pre-import PASS does not mean production-ready. Current native H09-004 verifies read-only reference prerequisites and now passes on the approved target; hosted mutation acceptance remains separate.

The pure engine implements mapped-category random selection, other-category fallback, then least-recent active/ties random. History query is only [today−39,today], at most 41 rows to detect duplicate-day overflow. A showing on day 1 is eligible on day 41 (difference 40). Final fallback needs no older history: when every active pair is protected, each latest showing is necessarily in the bounded window. Saved category is the chosen pair's category. Both languages resolve the current assigned Pair (045); assignment identity remains immutable.

## Approved category definition — OD-002 continuation

| Source category | Approved category_code | Preserved TR name | Approved EN name |
|---|---|---|---|
| Dinlenme & Yavaşlama | REST_AND_SLOW_DOWN | Kendine Bir Nefes | Take a Breath |
| Öz Bakım & İyi Hissetme | SELF_CARE_AND_WELLBEING | Kendine İyi Gel | Be Kind to Yourself |
| Yenilik & Keşif | NOVELTY_AND_DISCOVERY | Yeniye Yer Aç | Make Room for the New |
| Odaklanma & İlerleme | FOCUS_AND_PROGRESS | Küçük Adımlarla İlerle | Move Forward in Small Steps |
| Bağ Kurma & Paylaşım | CONNECTION_AND_SHARING | Bağlarını Güçlendir | Strengthen Your Connections |
| Sadeleşme & Bırakma | SIMPLICITY_AND_LETTING_GO | Hafiflemeye İzin Ver | Allow Yourself to Feel Lighter |

Source and scope: explicit user approval in this conversation on 2026-10-20, recorded in SOURCE_OF_TRUTH. All 260 four-cell Pair tuples and all 240 source mapping rows remain byte-identical in the manifest. No category reassignment or text edit is authorized. Import validation rejects duplicate codes, duplicate/unknown/missing source labels and missing TR/EN names. Sequential admin dry-run/apply/readback uses these same six definitions; a source approval does not execute live import or close the production atomic-storage blocker.


## Historical checkpoint — Calendar integration — Buildmarker-012

> Historical contract (superseded by the current 016 native contract above):
> No Pair text, mapping, category, manifest hash or import behavior changes. Explicit staged content validation now covers packages 011 and 012 at that checkpoint; later explicit 013/014 policy follows. Calendar mutation never reads/writes daily snapshots. Shared `dailyCycle` supplies both Home and Calendar estimation/phase rules; an empty real history remains UNKNOWN even when settings survive last-start deletion. Daily generation accepts the matching current grant event after a completed withdrawal/regrant history rather than incorrectly requiring only one lifetime event. Production daily atomic persistence and live import/readback remain open.

## Package 013 preservation

Test Tools is an explicit non-content feature. The staged content validation policy extends to 013; 014 receives its separate scoped policy below. The six approved category decisions, 260 Pairs, 240 mappings and source manifest hash remain unchanged. Delete/reset never mutate shared content or immutable user daily snapshots; completed reset reuses an existing same-day snapshot. No content import or live Pair generation was performed for this package.


## Historical checkpoint — Closure readiness — 014

Staged PRE_IMPORT/VERIFIED_IMPORTED validation explicitly includes 014; 015+ requires its own scope. Manifest/source hash, six category definitions, 260 four-cell Pairs and 240 mapping rows are unchanged. Live read-only `contentLibrary.verify` on 2026-10-20 reports PRE_IMPORT: missing 6/260/240, zero same/conflicts. `moonDryRun` reports 103 missing intervals, zero same/conflicts, planned coverage 2026-10-03T13:25:33.710Z through 2028-11-02T09:17:57.674Z. These are planned intervals, **not stored coverage**. Data UI independently shows all four tables at zero. No import was run.

Home requires both a verified immutable writer and verified content/Moon readiness. OD-012 changes only the cycle input choice: no supported estimate → UNKNOWN mapping, never a different Pair text/category mapping. Existing daily snapshots stay exact. Controlled single-operator dryRun/applyBatch/readback and Moon dryRun/applyBatch remain the existing import mechanism; concurrent operators are unsupported. [014 rollout](reports/SHINKA_RELEASE_ROLLOUT_014.md) provides executable inspection and release steps.
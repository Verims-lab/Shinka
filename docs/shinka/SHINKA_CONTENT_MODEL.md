# SHINKA — Content Model

**Document:** SHINKA_CONTENT_MODEL.md
**Status:** ACTIVE — validated contract, no import
**Current BuildMarker:** Buildmarker-004
**Last Updated:** 2026-10-18
**Authoritative Source References:** SRC-08 (copy), SRC-09 + SRC-10 (mapping), SRC-01 §6
**Purpose:** Pair/category/mapping contract for the deterministic daily content engine.
**Scope:** Content artifacts and selection rules. No live import in this package.
**Implemented:** Read-only live validator `validateContentArtifacts` + H05 cases.
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
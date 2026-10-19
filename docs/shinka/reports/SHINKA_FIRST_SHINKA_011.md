# First Shinka / Home — implementation and handoff

Repository package: Buildmarker-011 / HC-011.0. **Production creation remains blocked.** No live content import or daily creation/readback has been executed. ON-05 still needs its separate same-account save/readback verification. Local tests and captures are isolated, not hosted/device evidence.

## Sources and decisions

The original business v2.5, use case v1.4, UI/UX v1.1, technical v1.1, DB v1.2 and entity-relationships v1.2 files were inspected directly. The approved birth-date-only Sun decision remains authoritative. Astronomy Engine JS is explicitly approved in business §4/technical §4.2. Current-day cycle rules are business §5 and technical §6. Selection is business §6/UC-09.

| Original workbook | SHA-256 | Verified rows |
|---|---|---:|
| Shinka_Free_260_YS_Suggestion_TR_EN.xlsx | 34e37e6edbc57d603d8cb3836dfccbc5645451501963649629b17931f4320dcb | 260 |
| Shinka_Free_240_Eslestirme_40Gun_Test_Sade.xlsx | dff0c919b58cd7daf678f9d18cb3af3d72c9173e147680bd80d1e0158acb35d4 | 240 |
| Shinka_Free_192_Kategori_Eslestirme.xlsx | 76c99ac217945889f5245aa0470ef2bdee7c024d049f60745bccc48aadc3d31d | 192 |

Exact SHF-001…SHF-260; four nonempty language cells per ID; six category counts 30/66/56/32/44/32; 0 duplicate IDs/identity tuples; 0 unknown categories; 0 missing/duplicate combinations; 192 matching base rows + 48 UNKNOWN. Original punctuation and the noted SHF-002 spelling remain unchanged. The generated backend manifest and lightweight digest receipt are reproducible with `node scripts/prepareFirstContent.mjs /absolute/workbook-directory`.

OD-002 is still **unapproved**. The following proposal was sent once for a product decision; no response has been recorded. Production category data is empty in `contentCategoryDecision.js` until explicit approval.

| Workbook category | Proposed code | Source TR display | Proposed EN display |
|---|---|---|---|
| Dinlenme & Yavaşlama | REST_AND_SLOW_DOWN | Kendine Bir Nefes | Take a Breath |
| Öz Bakım & İyi Hissetme | SELF_CARE_AND_WELLBEING | Kendine İyi Gel | Be Kind to Yourself |
| Yenilik & Keşif | NOVELTY_AND_DISCOVERY | Yeniye Yer Aç | Make Room for the New |
| Odaklanma & İlerleme | FOCUS_AND_PROGRESS | Küçük Adımlarla İlerle | Move Forward in Small Steps |
| Bağ Kurma & Paylaşım | CONNECTION_AND_SHARING | Bağlarını Güçlendir | Strengthen Your Connections |
| Sadeleşme & Bırakma | SIMPLICITY_AND_LETTING_GO | Hafiflemeye İzin Ver | Allow Yourself to Feel Lighter |

## Durable persistence blocker

The [official entity schema contract](https://docs.base44.com/developers/backend/resources/entities/entity-schemas#uniqueness) explicitly says UNIQUE is unsupported and read-before-create does not close the race. The [SDK entity contract](https://docs.base44.com/developers/references/sdk/docs/type-aliases/entities#upsert) and installed 0.8.54 declarations/implementation expose keyed upsert with field merging, not immutable create-if-absent or documented cross-instance serializability. No production adapter satisfies `domainAtomic.createOnce`. Actor persistence examples also do not prove atomic insertion into a separate Entity plus crash-safe commit/readback; no speculative Actor/lock was introduced.

`dailyMessage` therefore reads an existing same-day row normally but returns DAILY_ATOMIC_CAPABILITY_REQUIRED before any new daily/content/health operation when no verified adapter exists. The engine behind that boundary is implemented and tested with an explicitly synthetic durable-store protocol. The fixture's single-winner result is not Base44 enforcement evidence.

Concrete closure choices: obtain a documented, deployed Base44 conditional insert primitive keyed by `(user_id, shinka_date)` with immutable winner readback and required account/reference/consent predicates; or approve a transactional authoritative daily store (for example PostgreSQL with `UNIQUE(user_id, shinka_date)`, insert-on-conflict-return-existing, guarded server auth and explicit crash/recovery semantics). The latter changes the storage contract and needs an integration decision/credentials. A second unguarded Base44 projection would reintroduce the duplicate risk; it must not be called the authoritative daily record. No external service was created or connected by this task.

## Controlled admin import after sync/publish

These are concrete function invocations in Base44's authenticated function test surface. Do not paste tokens into chat or console logs. Ordinary users/Home cannot import. Only a single operator runs apply batches; concurrent imports are unsupported and duplicates will fail verification.

1. Publish the reviewed Test code through the existing Git/Builder workflow. Confirm Buildmarker-011/HC-011.0 and the new contentLibrary/dailyMessage functions and updated onboarding/validateContentArtifacts bundles. Resolve OD-002 in the repository before expecting content application to work. Publish does **not** run import.
2. Invoke `contentLibrary` with `{"action":"dryRun"}`. Current unapproved state returns SOURCE_DECISION_REQUIRED and ready=false. After approval, inspect sourceHash, create/same/conflicts and digest. Expect 6/260/240 creates for an empty library; no writes occur.
3. If there are zero conflicts, invoke `{"action":"applyBatch","reviewed_digest":"<exact digest from the latest dryRun>"}`. At most 25 missing rows are inserted/reused. Inspect the new result, then request a fresh dryRun before every next batch. Never replay an expired digest. Lost response: start again with dryRun; never delete/reset data. Stop on any conflict.
4. Invoke `{"action":"verify"}`. Require VERIFIED_IMPORTED, ready=true, 6 categories/240 mappings/260 pairs all `same`, zero creates/conflicts, matching source hash and all 260 source/native ID mappings. Partial positive counts are not ready.
5. Invoke `{"action":"moonDryRun"}`. Inspect Astronomy Engine 2.1.19, continuous coverage through at least two future years and digest. Apply reviewed batches using `{"action":"moonApplyBatch","reviewed_digest":"<latest digest>"}`, refreshing moonDryRun between batches, until ready=true. No automatic renewal job is claimed; repeat the controlled extension before coverage expires.
6. New daily creation remains blocked until the durable persistence choice above is implemented and separately verified. Do not remove the guard simply to finish onboarding. H09-004 intentionally stays BLOCKED.

Apply uses full-value insert-or-identical keys; it cannot silently edit an existing source row. Fresh full verification detects changed, duplicated, extra or broken-reference records. Matching is exact, not fuzzy. Source Pair ID maps to native ID through a unique exact-content identity; no source/product schema field was added. Apply is audited with minimal existing metadata; dry-run/verify are fully read-only. No transaction or rollback is claimed.

## First content verification after blockers are closed

With the same intended test account, finish ON-05 or choose Skip with no inputs. ON-06 should show approved preparation text, then Home only after successful daily creation and readback. If preparation fails, Retry must retain the pending state without a fake completion flag. An already completed account must stay on Home with its retry state.

Read the owner-scoped UserDailyMessage result through the guarded backend: one row for backend-derived local day, actual chosen category/pair IDs, validated timezone, all four nonempty snapshots and UTC generated_at. Record only minimized IDs/counts/status as evidence; do not log health inputs or tokens. Reload twice and retry, switch TR/EN, then re-read: the same day must retain the same id/pair and unchanged four snapshots. Test independent concurrent clients against the real durable mechanism, including lost response/restart, not just a single warm worker. Repeat near UTC/local-midnight and a DST boundary.

Run deployed Full Health and save/list/open its private report. H05-009 must prove the correct source/import phase; H09-004 must only be updated after real capability closure; H09-901 requires live first/reopen/locale/readback evidence. Retain ON-05 H11-006, owner A/B/admin/anonymous enforcement, provider and physical-device external requirements.

## Implementation inventory

- Source/import: `prepareFirstContent.mjs`, `firstContentSource`, `contentSourceReceipt`, `contentCategoryDecision`, `contentImportPlan`, `base44ContentLibrary`, `contentLibraryOperation`, contentLibrary function.
- Phases/selection/persistence: `dailyCycle`, `moonIntervals`, `moonImport`, `dailySelection`, `dailyMessageOperation`, dailyMessage function. Existing `domainAtomic` protocol is reused, not replaced.
- UI: daily service/hook/status/preparation, Home snapshot cards and localization; onboarding hydration/transition integration. Existing admin/GeoNames/consent paths remain.
- Regressions/Health: DM/DU canonical tests, CLI daily-flow captures, staged H05, scoped H08/H09/H10/H12/H07 cases. Historical pre-content tests remain for older packages; no failed security case is deleted.

Final verification: Chromium/WebKit each 346/346 canonical tests, 54 general + 21 onboarding + 9 daily synthetic Health, 17 admin, 8 routing/Preview, 5 mobile and 5 daily-flow scenarios; zero page exceptions. Clean install/tree/security/type/lint/build, Repo Health 16/16, five-package retention and existing byte budgets passed. Audit has no High/Critical and two existing Moderate findings. Initial JS is 459,519 raw / 149,604 gzip bytes (+5,006 / +1,500 versus 010); CSS 84,916 / 14,553. Astronomy Engine 2.1.19 is the sole new pinned dependency. [Structured evidence](first-shinka-011/verification.json), [captures/device limits](SHINKA_ANDROID_IOS_COMPATIBILITY.md) and [Development Notes](../SHINKA_DEVELOPMENT_NOTES.md) record the details. No repository result certifies hosted execution or a physical device; deployed Full Health is not reported PASS.

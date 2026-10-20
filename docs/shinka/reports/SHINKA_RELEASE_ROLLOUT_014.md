# Release readiness and staged rollout — 014

No commands below that mutate Git main, Base44 schemas, imports or users were executed by this package. Test delivery does not publish. The local preparation/read-only checks were actually run; the outcomes are recorded below.

## Observed destination

Base44 app `6ad5190f4845d4e3af03b420`. Preview identifies main commit `29a64d3c3d400090c1cd3081dcf54141de24e57b` and prod data. Data UI shows `AdminTestOperation (0)` and zero rows in category/mapping/Pair/Moon tables. Official CLI read-only invocation confirms the lifecycle table is readable; `contentLibrary.verify` returns PRE_IMPORT, 6 categories + 240 mappings + 260 Pairs missing, no conflicts. `moonDryRun` returns 103 missing, no conflicts, planned coverage October 2026–November 2028. Neither result is a successful import or writable Home.

The repository has 23 schemas: 20 product, two tooling and built-in User extension. The management Data list shows the 22 non-User tables; App Users is separate. This observation is not direct-user RLS proof.

## Normal Git-first path

The [official integration](https://docs.base44.com/developers/app-code/local-development/github) syncs `main`; Publish is a separate user action. It does not promise schema/function transaction ordering.

1. In a clean checkout, prepare a schema stage against the **reviewed current main**:

   ```bash
   node scripts/prepareSchemaStage.mjs /private/tmp/shinka-schema-014 origin/main
   ```

   The directory must be new and outside the checkout. It contains all 23 schemas with SHA-256 inventory, minimal config, `schema-stage.patch`, and a read-only readiness script. No credentials, app pointer, functions or site are copied. Nothing is pushed.

2. Review `manifest.json`, the patch and the full remote inventory. For the observed current main, **schemaDelta=false**: main already includes the additive 013 schema, and the live read confirms it is present. There is no missing-schema rollout action required for this app before 014's calculation-only code update. Do not republish schemas merely because a report says to.

3. For an older installation, pass its verified code baseline instead. This was exercised against real pre-013 commit `e8afd7b`; the generated delta contains only `AdminTestOperation`. In a clean release checkout at that baseline, run `git apply --check` then apply the reviewed `schema-stage.patch`, commit only the schema delta, merge that schema-only stage into main and let Base44 sync/publish **before merging lifecycle-aware code**. These main/publish steps are performed by the user. The full snapshot is not the patch; do not replace the entire release checkout with it.

4. Verify the schema in Data, deny rules in Permissions and SDK readability using the operator script below. Only then merge the code stage and publish. Recheck current Buildmarker-014 / HC-014.0, admission, read-only tools and content readiness. A successful schema check does not enable Home/Calendar/Admin mutations.

## Executable read-only verification

The Base44 CLI requires authenticated owner/editor access and Deno. `whoami` is read-only; it must succeed first. From the repository:

```bash
npx base44 whoami
npx base44 exec --privileged --data-env prod --app-id 6ad5190f4845d4e3af03b420 < scripts/base44ReleaseReadiness.ts
```

If Deno is not installed, the verified temporary-runtime equivalent is:

```bash
npm exec --yes --package=deno --package=base44 -- base44 exec --privileged --data-env prod --app-id 6ad5190f4845d4e3af03b420 < scripts/base44ReleaseReadiness.ts
```

This was executed successfully. It reads one operation ID at most without printing it, then calls only `verify` and `moonDryRun`. It returns counts/readiness/hash/coverage metadata, no profile, health, email, token or raw error. An unavailable schema stops subsequent checks; it is not ignored. `repositoryExpectation` is a declared code expectation, not a live concurrency probe. Neither `--privileged` nor success proves ordinary-user RLS.

## Missing-schema or interrupted-deployment recovery

Keep lifecycle admission fail-closed. AT17 verifies missing schema denies onboarding/daily/admin before writes and that restoring the additive schema restores reads without modifying user records.

* Old code + new empty schema is compatible because the schema is additive and direct CRUD denied. Do not enable lifecycle jobs while any old writer can bypass them.
* New code + missing schema is unavailable by design. Stop further rollout; restore the schema stage and verify it. Do not add a “schema not found → allow” fallback.
* If main already contains the schema but hosted sync failed to create it, prefer re-sync of the reviewed complete Git state through Builder. If that fails, the documented **schema-only CLI repair** is an operator exception to normal Git-first release, not whole-app CLI deploy:
  1. Compare the full remote schema inventory with all 23 local files and their hashes. Any unexpected remote entity stops repair; reconcile it in Git first.
  2. From the reviewed full-schema stage directory, link to the existing app with `npx base44 link --app-id 6ad5190f4845d4e3af03b420` (never `--create`).
  3. After explicit operator review, `npx base44 entities push` with its interactive confirmation updates schemas only. **Never run this command from a directory containing just AdminTestOperation.** It fully synchronizes schemas and removes remote entities absent locally, per [official CLI behavior](https://docs.base44.com/developers/references/cli/commands/entities-push).
  4. Run readiness again, compare the deployed schema to Git, then resume the ordinary Git/publish code stage.
* If code publishing fails after schema success, retain the additive schema and repair/revert code through Git. Do not delete operation/tombstone history. Once a real lifecycle job exists, reverting to pre-guard code is unsafe; resume/forward-fix with the fence enforced.

The prepared snapshot has no functions/site and **must never be passed to `base44 deploy`**. No repair/publish was performed in this task.

## Home data preparation after user approval

The current three content schemas and Moon table are empty. The existing authenticated admin `contentLibrary` endpoint implements strict actions:

1. Invoke `dryRun`; review exact manifest hash `83ec8ad248483ef31c996b0f0782a2ce419de7d4d186590ce03b47c30cfd9a91`, six approved codes/names, expected 6/240/260 and zero conflicts.
2. One operator invokes `applyBatch` with the **latest returned digest** in `reviewed_digest`, at most 25 rows per call. Reread the result and repeat sequentially with a fresh reviewed digest until `verify` returns VERIFIED_IMPORTED, exact counts, all relations/texts and the complete SHF→native-ID crosswalk. A timeout requires dryRun/verify reconciliation, never a blind parallel retry. Conflict stops the import; no delete-and-reload.
3. Invoke `moonDryRun`; review its current planned interval coverage and digest. Sequential `moonApplyBatch` with the latest digest until ready. Verify stored UTC intervals are contiguous and cover now plus at least two future years. The recorded October dry-run horizon is not valid forever; recompute it at import time.
4. Re-run read-only readiness. Import readiness alone does not close H09-004. If the proposed SQL migration is approved before import, import once into the approved authoritative destination instead of creating an unnecessary second copy.

The existing 011 handoff supplies the exact SDK invocation examples. Home never triggers an import; no default/placeholder content or Moon row is generated as a fallback.

## Feature acceptance after authority implementation

Open independently in order Home, Calendar, reset, delete. For each, exercise independent authenticated clients/workers, response loss, process restart and safe retry against the **actual store**. Calendar must expose one coherent revision; daily UNIQUE must retain one immutable row; reset/delete must fence competing writes. Test owner/admin/INACTIVE/consent/deletion boundaries and unchanged protected history. Delete/reset requires the user's explicit disposable target; never include real destructive actions in automatic Full Health.

Current expected application behavior after 014 sync: shared long-interval calculation/information is corrected; existing daily and Calendar reads work if their normal access prerequisites hold; new daily creation, Calendar writes and Admin mutations remain visibly blocked pending the separately reviewed architecture. Run deployed Full Health and save/list/open its report; expect H09-004, H08-005 and H12-031 BLOCKED. This is an honest release state, not feature closure.

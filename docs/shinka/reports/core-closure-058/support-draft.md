# Ready-to-send Base44 Customer Care draft — NOT SENT

Subject: Shinka — erase 49 unreferenced private Health report files

App: Shinka, `6ad5190f4845d4e3af03b420`.

Our authorized Health retention removed 49 historical report rows in 051. The stored files were not erased. On 2026-11-01 the official complete export contains 15 current report rows and 15 unique file references; none reference the 49 historical candidates. Please provide the supported private-file erasure route, or erase only the 49 `delete_candidates` in the privately supplied manifest, after checking current references. Preserve every `preserve` entry and any file referenced by another retained record. Please return per-file outcomes and distinguish active-store removal from permanent/backup erasure.

Private attachment prepared locally: `shinka-058-health-files.local` (0600, Git ignored), 49 candidates / 15 current protected references. Original `shinka-051-health-files.local` remains unchanged. Attach through the trusted support channel only; this Git draft contains no file URL or token. Recheck references at execution time; this manifest is dated evidence, not a writer lock.

The [official media guidance](https://docs.base44.com/Building-your-app/Using-media) directs stored live-upload deletion to Customer Care; removing the data row does not remove the file. No unsupported endpoint, support message or file deletion was executed here.

Separate platform question (no production counter experiment): how can the existing web operator surface run an isolated single-ID/revision conditional-update contention check against a synthetic counter? The [documented updateMany contract](https://docs.base44.com/developers/references/sdk/docs/type-aliases/entities) checks single-ID predicates at write time. We retain that contract and fail-closed acknowledgements, but do not count local SDK fixtures as hosted enforcement proof or reset the real GeoNames counter to test it.

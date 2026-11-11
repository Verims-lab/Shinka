// Read-only operator script for: npx base44 exec --privileged --data-env prod --app-id <reviewed-app>
// The CLI supplies base44. Never print SDK clients, tokens, raw errors or user rows.
declare const base44: {
  getConfig(): { appId: string; serverUrl: string };
  entities: Record<string, { filter(query: object, sort: string, limit: number, skip: number, fields: string[]): Promise<unknown[]> }>;
  functions: { invoke(name: string, body: object): Promise<{ data: any }> };
};
const report: Record<string, unknown> = {
  schema: 'shinka.release-readiness/1', measuredAt: new Date().toISOString(),
  evidence: 'LIVE_SCHEMA_AND_IMPORT_READS_ONLY', appId: base44.getConfig().appId,
  // Readiness is deliberately separate from permission to enable writers.
  repositoryExpectation: { home: 'NATIVE_CANDIDATES_REQUIRES_REFERENCES', calendar: 'NATIVE_OBSERVATIONS_RECEIPTS', reset: 'LEGACY_PROGRESS_ONLY', deletion: 'TEST_OPERATOR_MAINTENANCE' },
};
try {
  const rows = await base44.entities.AdminTestOperation.filter({}, 'id', 1, 0, ['id']);
  report.lifecycleSchema = Array.isArray(rows) ? 'READABLE' : 'INVALID_RESPONSE';
} catch { report.lifecycleSchema = 'UNAVAILABLE'; }
try {
  const rows = await base44.entities.UserCalendarAction.filter({}, 'id', 1, 0, ['id']);
  report.calendarReceiptSchema = Array.isArray(rows) ? 'READABLE' : 'INVALID_RESPONSE';
} catch { report.calendarReceiptSchema = 'UNAVAILABLE'; }
try {
  const { data } = await base44.functions.invoke('internalHealth', { action: 'nativeReadiness' });
  report.nativeRuntime = data?.authority === 'BASE44_NATIVE_V1'
    ? { authority: data.authority, strategyVersion: data.strategyVersion, schemas: data.schemas, hostedMutationVerified: false }
    : { state: 'UNCONFIRMED' };
} catch { report.nativeRuntime = { state: 'UNAVAILABLE' }; }
if (report.lifecycleSchema === 'READABLE') {
  for (const action of ['verify', 'moonDryRun']) {
    try {
      const { data } = await base44.functions.invoke('contentLibrary', { action });
      report[action] = action === 'verify'
        ? { ready: data?.ready === true, phase: data?.phase, sourceHash: data?.sourceHash, counts: data?.counts }
        : { ready: data?.ready === true, missing: data?.create, same: data?.same, conflictCount: Array.isArray(data?.conflicts) ? data.conflicts.length : null, coverageStart: data?.coverageStart, coverageEnd: data?.coverageEnd };
    } catch { report[action] = { ready: false, state: 'READ_FAILED' }; }
  }
}
console.log(JSON.stringify(report));

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
  repositoryExpectation: { home: 'BLOCKED', calendar: 'BLOCKED', admin: 'BLOCKED' },
};
try {
  const rows = await base44.entities.AdminTestOperation.filter({}, 'id', 1, 0, ['id']);
  report.lifecycleSchema = Array.isArray(rows) ? 'READABLE' : 'INVALID_RESPONSE';
} catch { report.lifecycleSchema = 'UNAVAILABLE'; }
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

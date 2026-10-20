// A completed measurement survives every persistence outcome. Shared by UI and regression tests.
export async function persistCompletedRun(report, save, refresh) {
  try { await save(report); await refresh(); return { report, saveError:null }; }
  catch (error) { return { report, saveError:error?.code || "HEALTH_HISTORY_PERSIST_FAILED", detail:error?.detail || null }; }
}

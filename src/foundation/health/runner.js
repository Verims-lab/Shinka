import { STATUS, CLASS, APPLICABILITY, RUNNER, CASE_TIMEOUT_MS } from "./constants";
import { ev, enforceEvidence } from "./evidence";
import { summarize, computeGate } from "./aggregate";
import { checkCatalog } from "./integrity";
import { buildReport, toCaseRecord } from "./report";
import { createHealthContext } from "./context";
import { SUITES } from "./suites";
import { HEALTH_CASES } from "./catalog";
import { classifyError, withTimeout, ERROR_CODES } from "@/foundation/errors";

const INTEGRITY_CASES = ["H16-001", "H16-002", "H16-003", "H16-004"];

async function executeCase(def, ctx) {
  const meta = toCaseRecord(def);
  if (def.applicability !== APPLICABILITY.CURRENT) {
    const reason = def.applicability === APPLICABILITY.FUTURE ? "FUTURE_PACKAGE — not active for current BuildMarker" : "EXTERNAL_RELEASE — tracked separately, not a fake PASS";
    return { ...meta, status: STATUS.NOT_APPLICABLE, attempted: false, executed: false, durationMs: 0,
      evidence: ev(CLASS.RECORDED_DECISION, "Health catalog applicability", def.applicability, APPLICABILITY.CURRENT, reason) };
  }
  const t0 = performance.now();
  try {
    const r = await withTimeout(Promise.resolve().then(() => def.run(ctx)), def.timeoutMs || CASE_TIMEOUT_MS);
    return enforceEvidence({ ...meta, ...r, attempted: true, executed: true, durationMs: Math.round(performance.now() - t0) });
  } catch (e) {
    const code = classifyError(e);
    const timedOut = code === ERROR_CODES.TIMEOUT;
    return { ...meta, status: timedOut ? STATUS.BLOCKED : STATUS.FAIL, attempted: true, executed: !timedOut,
      durationMs: Math.round(performance.now() - t0),
      evidence: ev(def.classification, def.id, code, "runner completes within bound", timedOut ? `TIMEOUT after ${def.timeoutMs || CASE_TIMEOUT_MS}ms` : `RUNNER_ERROR:${code}`) };
  }
}

export async function runHealth({ suiteId = null, onProgress } = {}) {
  const scope = suiteId ? `SUITE:${suiteId}` : "FULL";
  const started = new Date();
  const ctx = createHealthContext();
  const selected = HEALTH_CASES.filter((c) => !suiteId || c.suiteId === suiteId);
  const ordered = [...selected.filter((c) => c.runnerType !== RUNNER.META), ...selected.filter((c) => c.runnerType === RUNNER.META)];
  const results = [];
  for (const def of ordered) {
    ctx.results = results.slice();
    results.push(await executeCase(def, ctx));
    onProgress?.(results.length, ordered.length);
  }
  const completed = new Date();
  const summary = summarize(results);
  const integrityOk = suiteId
    ? checkCatalog(SUITES, HEALTH_CASES).ok
    : INTEGRITY_CASES.every((id) => results.find((r) => r.id === id)?.status === STATUS.PASS);
  const gate = computeGate(results, { fullScope: !suiteId, integrityOk });
  return buildReport({ scope, suiteId, started, completed, results, summary, gate });
}
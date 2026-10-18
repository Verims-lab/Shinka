import { hasEvidence } from "./healthEvidence.js";
import { STATUS, APPLICABILITY, GATE } from "./healthConstants.js";

export function summarize(cases) {
  const s = { totalCatalog: cases.length, planned: 0, attempted: 0, executed: 0, passed: 0, failed: 0, warnings: 0,
    blocked: 0, notRun: 0, notApplicable: 0, applicableBlockers: 0, durationMs: 0 };
  for (const c of cases) {
    const applicable = c.applicability === APPLICABILITY.CURRENT;
    if (applicable) s.planned++;
    if (applicable && c.blocker) s.applicableBlockers++;
    if (c.attempted) s.attempted++;
    if (c.executed) s.executed++;
    if (c.status === STATUS.PASS) s.passed++;
    else if (c.status === STATUS.FAIL) s.failed++;
    else if (c.status === STATUS.WARNING) s.warnings++;
    else if (c.status === STATUS.BLOCKED) s.blocked++;
    else if (c.status === STATUS.NOT_RUN) s.notRun++;
    else if (c.status === STATUS.NOT_APPLICABLE) s.notApplicable++;
    s.durationMs += c.durationMs || 0;
  }
  s.durationMs = Math.round(s.durationMs);
  return s;
}

// Gate considers ONLY current-package (applicable) cases. Future/external cases never block or pass the gate.
export function computeGate(cases, { fullScope = true, integrityOk = true } = {}) {
  const applicable = cases.filter((c) => c.applicability === APPLICABILITY.CURRENT);
  const blockers = applicable.filter((c) => c.blocker);
  const failing = blockers.filter((c) => c.status === STATUS.FAIL || c.status === STATUS.WARNING).map((c) => c.id);
  const blocked = blockers.filter((c) => c.status === STATUS.BLOCKED).map((c) => c.id);
  const invalidPass = applicable.filter((c) => c.status === STATUS.PASS &&
    (c.attempted !== true || c.executed !== true || !hasEvidence(c.evidence))).map((c) => c.id);
  const invalidState = applicable.filter((c) => !Object.values(STATUS).includes(c.status) || c.status === STATUS.NOT_APPLICABLE || (c.executed && !c.attempted)).map((c) => c.id);
  const notRun = applicable.filter((c) => c.attempted !== true || c.executed !== true || c.status === STATUS.NOT_RUN).map((c) => c.id);
  const reasons = [];
  if (invalidPass.length) reasons.push("INVALID_PASS_EXECUTION_OR_EVIDENCE");
  if (invalidState.length) reasons.push("INVALID_CURRENT_CASE_STATE");
  if (!integrityOk) reasons.push("CATALOG_INTEGRITY_FAILED");
  if (applicable.length === 0) reasons.push("NO_APPLICABLE_CASES");
  let status;
  if (!integrityOk || failing.length || invalidPass.length || invalidState.length) status = GATE.NOT_READY;
  else if (blocked.length) status = GATE.BLOCKED;
  else if (notRun.length || applicable.length === 0) status = GATE.INCOMPLETE;
  else status = fullScope ? GATE.READY : GATE.SCOPE_PASS;
  return { status, failing, blocked, notRun, invalidPass, invalidState, reasons, applicableBlockerCount: blockers.length };
}
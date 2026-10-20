import { STATUS, CLASS } from "./healthConstants.js";

export const ev = (classification, source, actual, expected, reason) =>
  ({ classification, source, actual, expected, reason, timestamp: new Date().toISOString() });

export const verdict = (ok, evidence, failStatus = STATUS.FAIL) => ({
  status: ok === true ? STATUS.PASS : failStatus, evidence,
  assertion: { evaluated: typeof ok === 'boolean', passed: ok === true },
});
export const blockedResult = (evidence) => ({ status: STATUS.BLOCKED, evidence });

export const hasEvidence = (e) =>
  !!e && Object.values(CLASS).includes(e.classification) && typeof e.source === "string" && !!e.source.trim() &&
  e.actual !== undefined && e.expected !== undefined && typeof e.reason === "string" && !!e.reason.trim() &&
  typeof e.timestamp === "string" && Number.isFinite(Date.parse(e.timestamp));

// PASS without actual evidence is never allowed.
export function enforceEvidence(result) {
  if (result.status === STATUS.PASS && (!hasEvidence(result.evidence) || result.attempted === false || result.executed === false)) {
    return { ...result, status: STATUS.FAIL, evidence: { ...(result.evidence || {}), reason: "INVALID_PASS_EVIDENCE_OR_EXECUTION", timestamp: new Date().toISOString() } };
  }
  return result;
}

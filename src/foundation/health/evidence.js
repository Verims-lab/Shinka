import { STATUS } from "./constants";

export const ev = (classification, source, actual, expected, reason) =>
  ({ classification, source, actual, expected, reason, timestamp: new Date().toISOString() });

export const verdict = (ok, evidence, failStatus = STATUS.FAIL) => ({ status: ok ? STATUS.PASS : failStatus, evidence });
export const blockedResult = (evidence) => ({ status: STATUS.BLOCKED, evidence });

export const hasEvidence = (e) =>
  !!e && !!e.classification && !!e.source && e.actual !== undefined && e.expected !== undefined && !!e.timestamp;

// PASS without actual evidence is never allowed.
export function enforceEvidence(result) {
  if (result.status === STATUS.PASS && !hasEvidence(result.evidence)) {
    return { ...result, status: STATUS.FAIL, evidence: { ...(result.evidence || {}), reason: "PASS_WITHOUT_EVIDENCE", timestamp: new Date().toISOString() } };
  }
  return result;
}
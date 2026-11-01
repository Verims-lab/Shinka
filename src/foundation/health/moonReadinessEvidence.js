// Closed read-only reference summary. Never copy a digest, raw conflict or record.
const count = value => Number.isSafeInteger(value) && value >= 0;
const instant = value => typeof value === 'string' && /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}\.\d{3}Z$/.test(value) && Number.isFinite(Date.parse(value)) && new Date(value).toISOString() === value;
const phases = ['NEW', 'WAXING', 'FULL', 'WANING'];
export function moonReadinessEvidence(value) {
  /** @type {Record<string, any>} */
  const summary = {
    missing: count(value?.create) ? value.create : null,
    same: count(value?.same) ? value.same : null,
    conflicts: Array.isArray(value?.conflicts) ? value.conflicts.length : null,
    astronomyVersion: value?.astronomyVersion === '2.1.19' ? '2.1.19' : null,
    coveragePolicy: value?.coveragePolicy === 'MONTHLY_FORWARD_2Y_V1' ? value.coveragePolicy : null,
    actualCount: count(value?.actualCount) ? value.actualCount : null,
    currentCovered: typeof value?.currentCovered === 'boolean' ? value.currentCovered : null,
    currentPhase: phases.includes(value?.currentPhase) ? value.currentPhase : null,
    ...Object.fromEntries(['generatedAt','coverageStart','coverageEnd','horizon','requiredCoverageEnd','actualCoverageStart','actualCoverageEnd','nextFullMoonAt'].map(key => [key, instant(value?.[key]) ? value[key] : null])),
  };
  // Older deployed summaries remain readable during paired backend/frontend rollout.
  // Their absent detail is null, never inferred from expected coverage.
  let valid = !!value && typeof value.ready === 'boolean' && count(value.create) && Array.isArray(value.conflicts);
  if (value?.astronomyVersion !== undefined) valid = valid && summary.astronomyVersion !== null;
  if (value?.same !== undefined) valid = valid && count(value.same);
  if (value?.coveragePolicy !== undefined) {
    valid = valid && summary.coveragePolicy !== null && summary.astronomyVersion !== null && count(value.same) && count(value.actualCount)
      && ['generatedAt','coverageStart','coverageEnd','horizon','requiredCoverageEnd'].every(key => summary[key] !== null)
      && typeof value.currentCovered === 'boolean'
      && (value.actualCount === 0 ? value.actualCoverageStart === null && value.actualCoverageEnd === null : summary.actualCoverageStart !== null && summary.actualCoverageEnd !== null)
      && (value.currentCovered ? summary.currentPhase !== null : value.currentPhase === null)
      && (value.nextFullMoonAt === null || summary.nextFullMoonAt !== null)
      && value.actualCount >= value.same
      && Date.parse(summary.coverageStart) < Date.parse(summary.coverageEnd)
      && (value.actualCount === 0 || Date.parse(summary.actualCoverageStart) < Date.parse(summary.actualCoverageEnd))
      && (!value.currentCovered || Date.parse(summary.actualCoverageStart) <= Date.parse(summary.generatedAt) && Date.parse(summary.generatedAt) < Date.parse(summary.actualCoverageEnd))
      && (value.nextFullMoonAt === null || value.currentCovered && Date.parse(summary.nextFullMoonAt) > Date.parse(summary.generatedAt))
      && (!value.ready || value.currentCovered && Date.parse(summary.actualCoverageEnd) >= Date.parse(summary.requiredCoverageEnd));
  }
  return { valid, summary };
}

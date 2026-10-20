import { hasEvidence } from './healthEvidence.js';

export const EXECUTION_CONTRACT = 'shinka.health.execution/1';
const measured = value => value != null && value !== '' &&
  (typeof value !== 'object' || Array.isArray(value) || Object.keys(value).length > 0);
export function checkExecutionResults(results, expectedIds, identity) {
  const ids = results.map(row => row.id);
  const missing = expectedIds.filter(id => !ids.includes(id));
  const unexpected = ids.filter(id => !expectedIds.includes(id));
  const duplicate = ids.filter((id, index) => ids.indexOf(id) !== index);
  const invalid = results.filter(row => row.status === 'PASS' && (
    row.attempted !== true || row.executed !== true || !hasEvidence(row.evidence) ||
    !measured(row.evidence.actual) ||
    row.assertion?.evaluated !== true || row.assertion?.passed !== true ||
    row.execution?.contract !== EXECUTION_CONTRACT || row.execution?.caseId !== row.id ||
    ['buildMarker','healthCatalogVersion','sourceSetVersion'].some(key => row.execution?.[key] !== identity[key])
  )).map(row => row.id);
  return { ok: !missing.length && !unexpected.length && !duplicate.length && !invalid.length, missing, unexpected, duplicate, invalid };
}

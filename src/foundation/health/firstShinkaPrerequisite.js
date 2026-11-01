import { exactImportedLibrary } from '../../../base44/shared/contentStateContract.js';
import { CONTENT_SOURCE_SHA256 } from '../../../base44/shared/contentSourceReceipt.js';
import { healthReadDiagnostic, healthReadFailureStatus, healthReadAttempt } from '../../../base44/shared/healthReadDiagnostics.js';
import { nativePrerequisite } from './nativeReadinessContract';
import { moonReadinessEvidence } from './moonReadinessEvidence';
import { CLASS } from './constants';
import { ev, verdict } from './evidence';

export async function firstShinkaPrerequisite(ctx) {
  const diagnostics = {}, readAttempts = {};
  async function read(key) {
    try { return await ctx[key](); }
    catch (error) { diagnostics[key] = healthReadDiagnostic(error); readAttempts[key] = healthReadAttempt(error); return null; }
  }
  // Sequential shared reads, including failures. No independent per-case retry.
  const library = await read('contentLibrary');
  const prerequisite = await nativePrerequisite(ctx, 'daily');
  const moon = await read('moonReadiness');
  const contentStatus = diagnostics.contentLibrary ? healthReadFailureStatus(diagnostics.contentLibrary)
    : exactImportedLibrary(library) ? 'PASS'
    : library?.ready === false && library.sourceHash === CONTENT_SOURCE_SHA256 && ['SOURCE_DECISION_REQUIRED','PRE_IMPORT'].includes(library.phase) ? 'BLOCKED' : 'FAIL';
  const moonEvidence = moonReadinessEvidence(moon);
  const moonShape = moonEvidence.valid;
  const moonStatus = diagnostics.moonReadiness ? healthReadFailureStatus(diagnostics.moonReadiness)
    : !moonShape || moon.conflicts.length || (moon.ready && moon.create !== 0) ? 'FAIL'
    : moon.ready ? 'PASS' : moon.create > 0 ? 'BLOCKED' : 'FAIL';
  const statuses = [contentStatus, prerequisite.status, moonStatus];
  const status = statuses.includes('FAIL') ? 'FAIL' : statuses.every(s=>s==='PASS') ? 'PASS' : 'BLOCKED';
  return verdict(status === 'PASS', ev(CLASS.LIVE_RUNTIME, 'Base44 exact content + native contract + Moon verification', {
    state: prerequisite.evidence.actual?.state ?? status,
    contentReady: library?.ready === true, moonReady: moon?.ready === true,
    contentStatus, moonStatus, moon: moonEvidence.summary, native: prerequisite.evidence.actual,
    diagnostics, readAttempts,
  }, 'verified source/hash/relations, native strategy and current Moon coverage',
  'Read-only prerequisites; missing coverage remains BLOCKED, malformed/conflicting evidence FAIL. H09-901 still requires hosted mutations.'), status);
}

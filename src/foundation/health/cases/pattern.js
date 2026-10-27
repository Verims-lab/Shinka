import { PATTERN_TESTS } from '../../tests/patternTests';
import { makeCase, localCase } from '../caseFactory';
import { CLASS, RUNNER } from '../constants';
import { syntheticProbe } from './domainProbe';
const probe = ids => syntheticProbe(PATTERN_TESTS.filter(([id]) => ids.includes(id)));
const runtime = { runnerType: RUNNER.RUNTIME, classification: CLASS.SYNTHETIC_RUNTIME };
export const PATTERN_HEALTH_CASES = [
  makeCase('H10', runtime)('H10-001', 'Assigned recurring themes, current phase and next full moon', 'UC-16/17 KK-21/22/34: bounded calendar window, latest tie, Home candidate selection, approved lookup, Moon intervals, strict future FULL boundary, partial coverage and IANA date. Executes real calculations/reader/handler; no live writes.', probe(['PT01','PT02','PT03','PT04','PT05','PT06','PT07','PT08','PT09','PT10','PT13','PT17','PT18','PT19'])),
  makeCase('H12', runtime)('H12-037', 'Pattern owner, lifecycle and safe read transport', 'Backend session owner, active account/reset/deletion checks before and after read; actual successful HTTP and rejected/malformed/timeout responses.', probe(['PT10','PT11','PT12','PT14'])),
  localCase('H13', 'H13-017', 'Pattern component, navigation and mobile labels', 'PU01–PU07 and checkPatternFlow: TR/EN selection, independent retry, late unmount, 120s/300s controlled refresh, count-free themes and 320px/200% lunar fields, actual routes. Local Chromium/WebKit only; physical/hosted acceptance remains separate.'),
];

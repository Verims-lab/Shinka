import { SEVERITY, APPLICABILITY, RUNNER, CLASS } from "./constants";

// Builds case definitions with explicit defaults: blocker, current-package, static.
export const makeCase = (suiteId, defaults = {}) => (id, title, description, run, opts = {}) => ({
  suiteId, severity: SEVERITY.HIGH, blocker: true, applicability: APPLICABILITY.CURRENT,
  executionLocation: 'IN_APP', runnerType: RUNNER.STATIC, classification: CLASS.STATIC, ...defaults, ...opts, id, title, description, run,
});

export const futureCase = (suiteId, id, title, description, applicability = APPLICABILITY.FUTURE, classification = CLASS.SYNTHETIC_RUNTIME) => ({
  suiteId, id, title, description, severity: SEVERITY.HIGH, blocker: applicability === APPLICABILITY.FUTURE,
  executionLocation: 'EXTERNAL', applicability, runnerType: RUNNER.NONE, classification, run: null,
});
// Kept in the catalog/acceptance list, never executed or marked PASS/N/A in-app.
export const localCase = (suiteId, id, title, description) => makeCase(suiteId, {runnerType:RUNNER.RUNTIME, classification:CLASS.SYNTHETIC_RUNTIME})(id,title,description,null,{executionLocation:'LOCAL_BROWSER'});

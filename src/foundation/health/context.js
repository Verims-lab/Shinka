import { loadStaticEvidence } from "@/foundation/inspection/sourceScanner";
import { fetchArtifactValidation } from "@/services/internal/artifactService";
import { verifyLiveMoon, probeNativeReadiness, probeDomainEntities, countLiveContentRows, verifyLiveContentLibrary } from "@/services/internal/entityProbeService";

const memo = fn => { let p; return function () {
  // The first consumer owns the shared deadline/cancellation. Rejections stay
  // shared too: another case cannot restart an exhausted read in this run.
  return p ??= Promise.resolve().then(() => fn({ remainingMs: this?.remainingMs, signal: this?.signal }));
}; };

// Per-run shared, memoized evidence sources. Each loader is invoked at most once per run.
export function createHealthContext(loaders = {}) {
  return {
    moonReadiness: memo(loaders.moonReadiness ?? verifyLiveMoon),
    nativeReadiness: memo(loaders.nativeReadiness ?? probeNativeReadiness),
    inspection: memo(loaders.inspection ?? loadStaticEvidence),
    artifacts: memo(loaders.artifacts ?? (options => fetchArtifactValidation("live", options))),
    entityProbe: memo(loaders.entityProbe ?? probeDomainEntities),
    contentCounts: memo(loaders.contentCounts ?? countLiveContentRows),
    contentLibrary: memo(loaders.contentLibrary ?? verifyLiveContentLibrary),
    results: [], expectedCaseIds: [], executionIdentity: {}, testResults: new Map(),
  };
}

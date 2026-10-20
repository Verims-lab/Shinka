import { loadStaticEvidence } from "@/foundation/inspection/sourceScanner";
import { fetchArtifactValidation } from "@/services/internal/artifactService";
import { verifyLiveMoon, probeNativeReadiness, probeDomainEntities, countLiveContentRows, verifyLiveContentLibrary } from "@/services/internal/entityProbeService";

const memo = (fn) => { let p; return () => (p ??= fn()); };

// Per-run shared, memoized evidence sources. Each loader is invoked at most once per run.
export function createHealthContext() {
  return {
    moonReadiness: memo(verifyLiveMoon),
    nativeReadiness: memo(probeNativeReadiness),
    inspection: memo(loadStaticEvidence),
    artifacts: memo(() => fetchArtifactValidation("live")),
    entityProbe: memo(probeDomainEntities),
    contentCounts: memo(countLiveContentRows),
    contentLibrary: memo(verifyLiveContentLibrary),
    results: [],
  };
}

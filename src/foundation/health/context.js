import { loadStaticEvidence } from "@/foundation/inspection/sourceScanner";
import { fetchArtifactValidation } from "@/services/internal/artifactService";
import { probeSqlAuthority, probeDomainEntities, countLiveContentRows, verifyLiveContentLibrary } from "@/services/internal/entityProbeService";

const memo = (fn) => { let p; return () => (p ??= fn()); };

// Per-run shared, memoized evidence sources. Each loader is invoked at most once per run.
export function createHealthContext() {
  return {
    inspection: memo(loadStaticEvidence),
    artifacts: memo(() => fetchArtifactValidation("live")),
    entityProbe: memo(probeDomainEntities),
    contentCounts: memo(countLiveContentRows),
    sqlAuthority: memo(probeSqlAuthority),
    contentLibrary: memo(verifyLiveContentLibrary),
    results: [],
  };
}

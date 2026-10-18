import { loadSources, loadDocs } from "@/foundation/inspection/sourceScanner";
import { fetchArtifactValidation } from "@/services/internal/artifactService";
import { probeDomainEntities } from "@/services/internal/entityProbeService";

const memo = (fn) => { let p; return () => (p ??= fn()); };

// Per-run shared, memoized evidence sources. Each loader is invoked at most once per run.
export function createHealthContext() {
  return {
    sources: memo(loadSources),
    docs: memo(loadDocs),
    artifacts: memo(() => fetchArtifactValidation("live")),
    entityProbe: memo(probeDomainEntities),
    results: [],
  };
}
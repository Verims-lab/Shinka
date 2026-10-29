import ShinkaCard from "@/components/shinka/ShinkaCard";
import { BUILD_LEDGER } from "@/foundation/buildLedger";
import { buildEvidence } from '@/foundation/buildMarkerRules';

export default function LedgerList() {
  return (
    <ShinkaCard title="Build history (ledger)">
      <ul className="space-y-3">
        {[...BUILD_LEDGER].reverse().map((e) => (
          <li key={e.build_marker} className="text-sm space-y-1 min-w-0">
            <div className="flex flex-wrap gap-2 items-baseline">
              <span className="font-mono text-shinka-plum">{e.build_marker}</span>
              <span className="font-medium">{e.package_name}</span>
              <span className="text-xs text-shinka-muted">{e.package_type} · {e.created_at} · {e.health_catalog_version}</span>
            </div>
            <p className="text-shinka-muted break-words">{e.short_summary}</p>
            <p className="text-xs text-shinka-muted break-words">
              source {buildEvidence(e,'source_changed','source_of_truth_updated')} · tests {buildEvidence(e,'tests_changed','tests_updated')} · health {buildEvidence(e,'health_changed','health_cases_updated')} · docs aligned {buildEvidence(e,'docs_aligned')} — {e.notes}
            </p>
          </li>
        ))}
      </ul>
    </ShinkaCard>
  );
}

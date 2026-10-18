import { useEffect, useState } from "react";
import ShinkaCard from "@/components/shinka/ShinkaCard";
import StatusBadge from "@/components/shinka/StatusBadge";
import StatePanel from "@/components/shinka/StatePanel";
import KeyValueGrid from "@/components/shinka/KeyValueGrid";
import { listHealthRuns } from "@/services/internal/healthRunStore";
import { classifyError } from "@/foundation/errors";

export default function LatestHealthCard() {
  const [state, setState] = useState({ s: "LOADING" });
  const load = async () => {
    setState({ s: "LOADING" });
    try {
      const runs = await listHealthRuns(20);
      const full = runs.find((r) => r.scope === "FULL");
      setState(full ? { s: "SUCCESS", run: full } : { s: "EMPTY" });
    } catch (e) { setState({ s: "ERROR", code: classifyError(e) }); }
  };
  useEffect(() => { load(); }, []);
  const r = state.run;
  return (
    <ShinkaCard title="Latest Full Health">
      {state.s === "LOADING" && <StatePanel state="LOADING" message="Loading…" />}
      {state.s === "EMPTY" && <StatePanel state="EMPTY" message="No Full Health run recorded yet." />}
      {state.s === "ERROR" && <StatePanel state="LOAD_FAILURE" message="Could not load Health history." code={state.code} onRetry={load} />}
      {r && (
        <>
          <div className="mb-3"><StatusBadge status={r.status} /></div>
          <KeyValueGrid items={[["Run time", r.completed_at], ["Build", r.build_marker], ["Catalog", r.health_catalog_version],
            ["PASS / FAIL", `${r.passed} / ${r.failed}`], ["WARNING / BLOCKED", `${r.warnings} / ${r.blocked}`], ["NOT_APPLICABLE", r.not_applicable]]} />
        </>
      )}
    </ShinkaCard>
  );
}
import ShinkaCard from "@/components/shinka/ShinkaCard";
import StatusBadge from "@/components/shinka/StatusBadge";
import StatePanel from "@/components/shinka/StatePanel";

export default function RunHistory({ history, onRetry }) {
  return (
    <ShinkaCard title="Run history">
      {history.state === "LOADING" && <StatePanel state="LOADING" message="Loading runs…" />}
      {history.state === "EMPTY" && <StatePanel state="EMPTY" message="No Health runs recorded yet." />}
      {history.state === "ERROR" && <StatePanel state="LOAD_FAILURE" message="Run history could not be loaded." code={history.code} onRetry={onRetry} />}
      {history.state === "SUCCESS" && (
        <ul className="space-y-2">
          {history.items.map((r) => (
            <li key={r.id} className="flex flex-wrap items-center gap-x-3 gap-y-1 text-xs border-t border-shinka-line pt-2 first:border-t-0">
              <span className="font-mono">{r.build_marker}</span>
              <span>{r.scope}</span>
              <StatusBadge status={r.status} />
              <span className="text-shinka-muted">P{r.passed} F{r.failed} W{r.warnings} B{r.blocked} NA{r.not_applicable}</span>
              <span className="text-shinka-muted break-all">{r.completed_at}</span>
            </li>
          ))}
        </ul>
      )}
    </ShinkaCard>
  );
}
import ShinkaCard from "@/components/shinka/ShinkaCard";
import StatusBadge from "@/components/shinka/StatusBadge";
import KeyValueGrid from "@/components/shinka/KeyValueGrid";

export default function HealthSummary({ report }) {
  const s = report.summary;
  const g = report.gate;
  const counts = [["Planned", s.planned], ["Attempted", s.attempted], ["Executed", s.executed], ["PASS", s.passed], ["FAIL", s.failed],
    ["WARNING", s.warnings], ["BLOCKED", s.blocked], ["NOT_RUN", s.notRun], ["NOT_APPLICABLE", s.notApplicable]];
  return (
    <ShinkaCard>
      <div className="flex flex-wrap items-center justify-between gap-2 mb-4">
        <h2 className="font-heading text-2xl text-shinka-plum-deep">Gate</h2>
        <StatusBadge status={g.status} />
      </div>
      <div className="grid grid-cols-3 sm:grid-cols-9 gap-2 mb-4">
        {counts.map(([k, v]) => (
          <div key={k} className="rounded-xl bg-shinka-ivory p-2 text-center min-w-0">
            <div className="text-lg font-semibold">{v}</div>
            <div className="text-[9px] tracking-wide text-shinka-muted break-all">{k}</div>
          </div>
        ))}
      </div>
      <KeyValueGrid items={[["Scope", report.scope], ["Environment", report.environment], ["Catalog", report.healthCatalogVersion],
        ["Started", report.startedAt], ["Completed", report.completedAt], ["Duration", `${report.durationMs} ms`],
        ["Blocking cases", [...g.failing, ...g.blocked].join(", ") || "none"], ["Not run", g.notRun.join(", ") || "none"]]} />
    </ShinkaCard>
  );
}
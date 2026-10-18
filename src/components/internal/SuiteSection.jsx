import ShinkaCard from "@/components/shinka/ShinkaCard";
import CaseRow from "@/components/internal/CaseRow";

export default function SuiteSection({ suite, cases }) {
  const pass = cases.filter((c) => c.status === "PASS").length;
  return (
    <ShinkaCard>
      <div className="flex flex-wrap items-baseline justify-between gap-2 mb-2">
        <h3 className="font-heading text-xl text-shinka-plum-deep">{suite.id} — {suite.name}</h3>
        <span className="text-xs text-shinka-muted">{suite.active ? `${pass}/${cases.length} pass` : "FUTURE_PACKAGE"}</span>
      </div>
      <ul>{cases.map((c) => <CaseRow key={c.id} c={c} />)}</ul>
    </ShinkaCard>
  );
}
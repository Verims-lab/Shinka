import ShinkaCard from "@/components/shinka/ShinkaCard";
import StatusBadge from "@/components/shinka/StatusBadge";
import { CAPABILITY_REGISTER, capabilityCounts } from "@/foundation/capabilityRegister";

export default function CapabilityList() {
  const counts = capabilityCounts();
  return (
    <ShinkaCard title="Base44 capability register">
      <p className="text-xs text-shinka-muted mb-3">{Object.entries(counts).map(([k, v]) => `${k} ${v}`).join(" · ")}</p>
      <ul className="space-y-2">
        {CAPABILITY_REGISTER.map((c) => (
          <li key={c.id} className="flex flex-wrap items-start gap-2 text-xs min-w-0">
            <StatusBadge status={c.status} />
            <span className="font-medium">{c.capability}</span>
            <span className="text-shinka-muted basis-full break-words">{c.evidence}</span>
          </li>
        ))}
      </ul>
    </ShinkaCard>
  );
}
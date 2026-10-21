import { useState } from "react";
import { ChevronDown } from "lucide-react";
import StatusBadge from "@/components/shinka/StatusBadge";

export default function CaseRow({ c }) {
  const [open, setOpen] = useState(false);
  return (
    <li className="border-t border-shinka-line first:border-t-0">
      <button type="button" onClick={() => setOpen(!open)} aria-expanded={open} aria-label={`${c.id} ${c.title}: ${c.status}`}
        className="w-full min-h-11 py-2 grid grid-cols-[minmax(0,1fr)_auto] items-center gap-2 text-left">
        <span className="font-mono text-xs text-shinka-muted shrink-0">{c.id}</span>
        <span className="flex items-center gap-2"><StatusBadge status={c.status} />
        <ChevronDown className={`h-4 w-4 shrink-0 transition-transform ${open ? "rotate-180" : ""}`} aria-hidden="true" /></span>
        <span className="col-span-2 min-w-0 text-sm break-words">{c.title}{c.blocker && <span className="text-shinka-muted"> · blocker</span>}</span>
      </button>
      {open && (
        <div className="pb-3 space-y-2 text-xs min-w-0">
          <p className="text-shinka-muted">{c.description}</p>
          <p className="text-shinka-muted">{c.applicability} · {c.runnerType} · {c.severity} · {c.durationMs} ms · attempted {String(c.attempted)} · executed {String(c.executed)}</p>
          <pre className="bg-shinka-ivory rounded-xl p-3 overflow-x-auto whitespace-pre-wrap break-all max-w-full">
            {c.evidence ? JSON.stringify(c.evidence, null, 2) : "No evidence yet — not run."}
          </pre>
        </div>
      )}
    </li>
  );
}
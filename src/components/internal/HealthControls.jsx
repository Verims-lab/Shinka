import { useState, useEffect, useRef } from "react";
import ShinkaSelect from "@/components/shinka/ShinkaSelect";
import { Play, ListChecks, Copy, Download } from "lucide-react";
import ShinkaButton from "@/components/shinka/ShinkaButton";
import { SUITES } from "@/foundation/health/suites";
import { copyReport, downloadReport } from "@/foundation/health/reportExport";

export default function HealthControls({ running, report, onRun }) {
  const [suite, setSuite] = useState("H01");
  const [copied, setCopied] = useState(false);
  const [copyError, setCopyError] = useState(false);
  const timer = useRef(null),
    mounted = useRef(false);
  useEffect(() => {
    mounted.current = true;
    return () => {
      mounted.current = false;
      clearTimeout(timer.current);
    };
  }, []);
  const copy = async () => {
    try {
      await copyReport(report);
      if (!mounted.current) return;
      setCopyError(false);
      setCopied(true);
      clearTimeout(timer.current);
      timer.current = setTimeout(() => setCopied(false), 1500);
    } catch {
      if (mounted.current) setCopyError(true);
    }
  };
  return (
    <div className="flex flex-wrap items-end gap-2">
      <ShinkaButton
        onClick={() => onRun(null)}
        disabled={running}
        aria-label="Run Full Health"
      >
        <Play className="h-4 w-4" />
        Run Full Health
      </ShinkaButton>
      <div className="flex items-end gap-2">
        <div className="flex flex-col">
          <label
            htmlFor="suite-select"
            className="text-[11px] uppercase tracking-wider text-shinka-muted"
          >
            Suite
          </label>
          <ShinkaSelect
            id="suite-select"
            value={suite}
            onChange={(e) => setSuite(e.target.value)}
            disabled={running}
            className="max-w-[11rem]"
          >
            {SUITES.map((s) => (
              <option key={s.id} value={s.id}>
                {s.id} {s.name}
              </option>
            ))}
          </ShinkaSelect>
        </div>
        <ShinkaButton
          variant="secondary"
          onClick={() => onRun(suite)}
          disabled={running}
          aria-label="Run selected suite"
        >
          <ListChecks className="h-4 w-4" />
          Run suite
        </ShinkaButton>
      </div>
      <ShinkaButton
        variant="ghost"
        onClick={copy}
        disabled={!report}
        aria-label="Copy report JSON"
      >
        <Copy className="h-4 w-4" />
        {copied ? "Copied" : "Copy JSON"}
      </ShinkaButton>
      <ShinkaButton
        variant="ghost"
        onClick={() => downloadReport(report)}
        disabled={!report}
        aria-label="Download report JSON"
      >
        <Download className="h-4 w-4" />
        Export
      </ShinkaButton>
      {copyError && (
        <p role="alert">Copy failed. Retry or export the report.</p>
      )}
    </div>
  );
}

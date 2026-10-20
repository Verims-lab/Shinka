import { healthCopy } from '@/foundation/i18n/healthCopy';
import { useState, useEffect, useRef } from "react";
import ShinkaSelect from "@/components/shinka/ShinkaSelect";
import { Play, ListChecks, Copy, Download } from "lucide-react";
import ShinkaButton from "@/components/shinka/ShinkaButton";
import { SUITES } from "@/foundation/health/suites";
import { copyReport, downloadReport } from "@/foundation/health/reportExport";

export default function HealthControls({ running, report, onRun, language = 'en' }) {
  const text=key=>healthCopy(key,language);
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
        aria-label={text('run')}
      >
        <Play className="h-4 w-4" />
        {text('run')}
      </ShinkaButton>
      <div className="flex items-end gap-2">
        <div className="flex flex-col">
          <label
            htmlFor="suite-select"
            className="text-[11px] uppercase tracking-wider text-shinka-muted"
          >
            {text('suite')}
          </label>
          <ShinkaSelect
            id="suite-select"
            value={suite}
            onChange={(e) => setSuite(e.target.value)}
            disabled={running}
            className="max-w-[11rem]"
          >
            {SUITES.filter(s=>s.active).map((s) => (
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
          aria-label={text('runSuite')}
        >
          <ListChecks className="h-4 w-4" />
          {text('runSuite')}
        </ShinkaButton>
      </div>
      <ShinkaButton
        variant="ghost"
        onClick={copy}
        disabled={!report}
        aria-label={text('copy')}
      >
        <Copy className="h-4 w-4" />
        {text(copied?'copied':'copy')}
      </ShinkaButton>
      <ShinkaButton
        variant="ghost"
        onClick={() => downloadReport(report)}
        disabled={!report}
        aria-label={text('export')}
      >
        <Download className="h-4 w-4" />
        {text('export')}
      </ShinkaButton>
      {copyError && (
        <p role="alert">{text('copyFailed')}</p>
      )}
    </div>
  );
}

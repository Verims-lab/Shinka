import { useEffect, useRef, useState } from "react";
import { beginPrivateReport } from '@/foundation/health/privateReportOpening';
import ShinkaButton from "@/components/shinka/ShinkaButton";
import { fullReportUrl } from "@/services/internal/healthRunStore";
import ShinkaCard from "@/components/shinka/ShinkaCard";
import StatusBadge from "@/components/shinka/StatusBadge";
import StatePanel from "@/components/shinka/StatePanel";

export default function RunHistory({ history, onRetry }) {
  const [reportError,setReportError]=useState(false);
  const [opening,setOpening]=useState(false);
  const pending=useRef(null);
  useEffect(()=>{
    const clear=()=>{pending.current?.cancel();pending.current=null;};
    const invalidate=()=>{clear();setOpening(false);setReportError(false);};
    window.addEventListener('shinka-session-ended',invalidate);
    window.addEventListener('shinka-health-access-changed',invalidate);
    return()=>{clear();window.removeEventListener('shinka-session-ended',invalidate);window.removeEventListener('shinka-health-access-changed',invalidate);};
  },[]);
  const openReport=async(run)=>{
    if(pending.current)return;
    setReportError(false);setOpening(true);
    const operation=beginPrivateReport(()=>fullReportUrl(run));pending.current=operation;
    try {await operation.result;}
    catch {if(pending.current===operation)setReportError(true);}
    finally {if(pending.current===operation){pending.current=null;setOpening(false);}}
  };
  return (
    <ShinkaCard title="Run history">
      {reportError && <StatePanel state="LOAD_FAILURE" message="The private report could not be opened." code="HEALTH_HISTORY_READ_FAILED" />}
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
              {r.report_file_uri && <ShinkaButton variant="secondary" disabled={opening} onClick={()=>openReport(r)}>Open private report</ShinkaButton>}
            </li>
          ))}
        </ul>
      )}
    </ShinkaCard>
  );
}

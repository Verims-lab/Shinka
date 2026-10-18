import { Loader2, Inbox, AlertTriangle, CheckCircle2, Ban } from "lucide-react";
import ShinkaButton from "@/components/shinka/ShinkaButton";

// Reusable state pattern: LOADING | EMPTY | ERROR (+RETRY) | SUCCESS | DISABLED. `code` keeps the machine cause.
const ICONS = { LOADING: Loader2, EMPTY: Inbox, ERROR: AlertTriangle, SUCCESS: CheckCircle2, DISABLED: Ban };

export default function StatePanel({ state, message, code, onRetry }) {
  const Icon = ICONS[state] || Inbox;
  return (
    <div role={state === "ERROR" ? "alert" : "status"} data-state={state} data-error-code={code || undefined}
      className="flex flex-col items-center gap-3 py-8 text-center text-sm text-shinka-muted">
      <Icon className={`h-6 w-6 ${state === "LOADING" ? "animate-spin" : ""}`} aria-hidden="true" />
      <p>{message}</p>
      {code && <p className="text-[11px] font-mono">{code}</p>}
      {state === "ERROR" && onRetry && <ShinkaButton variant="secondary" onClick={onRetry}>Retry</ShinkaButton>}
    </div>
  );
}
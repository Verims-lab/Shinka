import { Loader2, Inbox, AlertTriangle, AlertCircle, CheckCircle2, Ban, WifiOff, Hourglass, RotateCw } from "lucide-react";
import ShinkaButton from "@/components/shinka/ShinkaButton";
import { t } from "@/foundation/i18n/strings";

// Centralized UI states (uiContract.UI_STATES). Each state stays distinct; `code` keeps the machine cause.
// Icon + text always accompany color (state never communicated by color alone).
const STATES = {
  LOADING: { Icon: Loader2, alert: false }, OFFLINE: { Icon: WifiOff, alert: true, retry: true },
  LOAD_FAILURE: { Icon: AlertTriangle, alert: true, retry: true }, NOT_READY: { Icon: Hourglass, alert: false, retry: true },
  VALIDATION_ERROR: { Icon: AlertCircle, alert: true }, ACTION_ERROR: { Icon: AlertTriangle, alert: true, retry: true },
  SUCCESS: { Icon: CheckCircle2, alert: false }, RETRY: { Icon: RotateCw, alert: false, retry: true },
  DISABLED: { Icon: Ban, alert: false }, EMPTY: { Icon: Inbox, alert: false },
};

export default function StatePanel({ state, message, code, onRetry }) {
  const s = STATES[state] || STATES.EMPTY;
  return (
    <div role={s.alert ? "alert" : "status"} data-state={state} data-error-code={code || undefined}
      className="flex flex-col items-center gap-3 py-8 text-center text-shinka-body text-shinka-taupe">
      <s.Icon className={`h-6 w-6 ${state === "LOADING" ? "animate-spin" : ""}`} aria-hidden="true" />
      <p>{message}</p>
      {code && <p className="text-[11px] font-mono">{code}</p>}
      {s.retry && onRetry && <ShinkaButton variant="secondary" onClick={onRetry}>{t("state.retry")}</ShinkaButton>}
    </div>
  );
}
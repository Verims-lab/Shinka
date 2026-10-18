const STYLES = {
  PASS: "bg-emerald-50 text-emerald-800 border-emerald-200",
  READY: "bg-emerald-50 text-emerald-800 border-emerald-200",
  SCOPE_PASS: "bg-emerald-50 text-emerald-800 border-emerald-200",
  VERIFIED: "bg-emerald-50 text-emerald-800 border-emerald-200",
  FAIL: "bg-red-50 text-red-800 border-red-200",
  NOT_READY: "bg-red-50 text-red-800 border-red-200",
  UNSUPPORTED: "bg-red-50 text-red-800 border-red-200",
  WARNING: "bg-amber-50 text-amber-800 border-amber-200",
  PARTIALLY_VERIFIED: "bg-amber-50 text-amber-800 border-amber-200",
  BLOCKED: "bg-violet-50 text-violet-800 border-violet-200",
  INCOMPLETE: "bg-violet-50 text-violet-800 border-violet-200",
};
const NEUTRAL = "bg-shinka-ivory text-shinka-muted border-shinka-line";

export default function StatusBadge({ status }) {
  return (
    <span className={`inline-flex items-center rounded-full border px-2.5 py-0.5 text-[11px] font-semibold tracking-wide whitespace-nowrap ${STYLES[status] || NEUTRAL}`}>
      {status}
    </span>
  );
}
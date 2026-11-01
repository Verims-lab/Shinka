import { Loader2 } from "lucide-react";

export const placeLabel = (p) =>
  p.place_path ? [...p.place_path, p.birthplace_name].join(" — ") : [p.birthplace_name, p.birthplace_country_code].filter(Boolean).join(" — ");

// Popup content: listbox options plus separate, live-announced status/actions.
// Buttons keep input focus (mousedown prevented) so mobile keyboards stay open.
export default function BirthplaceResults({ t, search, active, onPick, onMore, onRetry }) {
  const { status, results, next_page, limited, loadingMore, error } = search;
  const keep = (event) => event.preventDefault();
  const action = (label, fn, attr) => (
    <button type="button" onMouseDown={keep} onClick={fn} className="min-h-11 rounded-shinka-md px-3 font-medium text-shinka-plum underline-offset-4 hover:underline" {...{ [attr]: true }}>{label}</button>
  );
  const message = status === "SHORT" ? t("placeMinChars")
    : status === "LOADING" ? t("placeSearching")
    : error ? t(["GEONAMES_RATE_LIMITED", "GEONAMES_QUOTA_NOT_READY"].includes(error) ? error : "placeError")
    : status === "READY" && !results.length && !limited ? t(next_page != null ? "placeNoMatchYet" : "placeEmpty")
    : null;
  return (
    <div className="absolute inset-x-0 top-full z-30 mt-2 max-h-80 overflow-y-auto rounded-shinka-md border border-shinka-line bg-shinka-white p-1 shadow-lg" data-place-popup>
        <ul id="birthplace-listbox" role="listbox" aria-label={t("birthplace")} aria-busy={status === "LOADING" || loadingMore}>
          {results.map((p, i) => (
            <li key={p.birthplace_geonames_id} id={`birthplace-option-${p.birthplace_geonames_id}`} role="option" aria-selected={i === active}
              data-place-option={p.birthplace_geonames_id} onMouseDown={keep} onClick={() => onPick(p)}
              className={`flex min-h-11 cursor-pointer items-center gap-2 rounded-shinka-sm px-3 py-2 text-shinka-ink ${i === active ? "bg-shinka-blush" : ""}`}>
              <span className="min-w-0 flex-1 break-words">{placeLabel(p)}</span>
              {p.place_kind && <span className="shrink-0 text-shinka-caption text-shinka-taupe">{t(`placeKind${p.place_kind}`)}</span>}
            </li>
          ))}
        </ul>
      <div role="status" aria-live="polite" className="px-3 py-2 text-shinka-small text-shinka-taupe" data-place-status={status}>
        {status === "LOADING" && <Loader2 aria-hidden="true" className="mr-2 inline h-4 w-4 animate-spin" />}
        {message}
        {limited && <span className="block" data-place-limited>{t("placeNarrow")}</span>}
      </div>
      {error && action(t("placeRetry"), onRetry, "data-place-retry")}
      {!error && status === "READY" && next_page != null && (loadingMore ? <p className="px-3 py-2 text-shinka-small text-shinka-taupe">{t("placeLoadingMore")}</p> : action(t("placeMore"), onMore, "data-place-more"))}
    </div>
  );
}

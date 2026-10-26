import { useRef, useState } from "react";
import { MapPin } from "lucide-react";
import ShinkaButton from "@/components/shinka/ShinkaButton";

// ON-04 compact birthplace: one summary field opens an inline panel (not a modal,
// so the existing per-list sheets never nest) that reuses the shared picker.
export default function BirthplaceCompact({ t, state, picker, disabled, error, editor }) {
  const [open, setOpen] = useState(false);
  const before = useRef(null);
  const summary = state.selection
    ? [state.selection.birthplace_name, ...state.path.map((p) => p.name), state.selection.birthplace_country_code]
        .filter(Boolean)
        .join(" · ")
    : null;
  const begin = () => {
    before.current = state.selection;
    setOpen(true);
    if (!state.editing) void picker.edit();
  };
  const cancel = () => {
    picker.restore(before.current);
    setOpen(false);
  };
  return (
    <div id="birthplace" tabIndex={-1} aria-invalid={error} aria-describedby={error ? "birthplace-error" : undefined} className="min-w-0 space-y-3 outline-none" data-birthplace-picker data-birthplace-compact>
      <button type="button" data-place-open aria-expanded={open} aria-controls="birthplace-panel" disabled={disabled} onClick={open ? undefined : begin} className="shinka-framed-field flex w-full items-center gap-3 text-left">
        <span className="min-w-0 flex-1">
          <span className="block text-shinka-small text-shinka-plum">
            {t("birthplace")} <span className="text-shinka-taupe">{t("placeOptional")}</span>
          </span>
          {summary ? (
            <span className="block break-words text-shinka-ink" data-place-summary>{summary}</span>
          ) : (
            <span className="block text-shinka-taupe">{t("placeChoose")}</span>
          )}
        </span>
        <MapPin aria-hidden="true" className="h-5 w-5 shrink-0 text-shinka-taupe" />
      </button>
      {open && (
        <div id="birthplace-panel" role="group" aria-label={t("birthplace")} className="min-w-0 space-y-4 rounded-shinka-md border border-shinka-line bg-shinka-white p-4">
          <p className="text-shinka-small text-shinka-taupe">{t("placeHelp")}</p>
          {editor}
          <div className="flex flex-wrap gap-2">
            <ShinkaButton className="flex-1" disabled={disabled} onClick={() => setOpen(false)} data-place-done>{t("placeDone")}</ShinkaButton>
            <ShinkaButton variant="secondary" disabled={disabled} onClick={cancel} data-place-cancel>{t("placeCancel")}</ShinkaButton>
            <ShinkaButton variant="ghost" disabled={disabled} onClick={picker.clear} data-place-clear>{t("placeClear")}</ShinkaButton>
          </div>
        </div>
      )}
    </div>
  );
}
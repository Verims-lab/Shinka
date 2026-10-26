import { useEffect, useMemo, useRef, useState, useSyncExternalStore } from "react";
import { MapPin, X } from "lucide-react";
import { onboardingCopy } from "@/foundation/i18n/onboardingCopy";
import { createBirthplaceSearch } from "./birthplaceSearch";
import BirthplaceResults, { placeLabel } from "./BirthplaceResults";

// Single editable combobox (WAI-ARIA APG). Typing/opening/closing never saves;
// only an explicit pick sets a selection, and editing the text drops the old ID.
export default function BirthplaceCombobox({ language, request, selection = null, onChange, disabled = false, error = false }) {
  const t = (key) => onboardingCopy(key, language);
  const callback = useRef(onChange);
  callback.current = onChange;
  const search = useMemo(() => createBirthplaceSearch({ request, language }), [request]);
  const state = useSyncExternalStore(search.subscribe, search.getSnapshot);
  const [text, setText] = useState(selection ? placeLabel(selection) : "");
  const [open, setOpen] = useState(false);
  const [active, setActive] = useState(-1);
  const input = useRef(null);
  useEffect(() => search.dispose, [search]);
  useEffect(() => { search.setLanguage(language); }, [search, language]);
  useEffect(() => { setActive(-1); }, [state.results.length, state.query]);
  const report = (value) => callback.current(value);
  const type = (value) => {
    setText(value);
    setOpen(true);
    report({ selection: null, incomplete: value.trim() !== "" });
    search.setQuery(value);
  };
  const pick = (place) => {
    setText(placeLabel(place));
    setOpen(false);
    search.cancel();
    report({ selection: place, incomplete: false });
  };
  const clear = () => {
    setText("");
    setOpen(false);
    search.cancel();
    report({ selection: null, incomplete: false });
    input.current?.focus();
  };
  const keyDown = (event) => {
    const count = state.results.length;
    if (event.key === "ArrowDown" || event.key === "ArrowUp") {
      event.preventDefault();
      if (!open) { setOpen(true); return; }
      if (count) setActive((i) => (event.key === "ArrowDown" ? (i + 1) % count : i <= 0 ? count - 1 : i - 1));
    } else if (event.key === "Enter" && open && active >= 0 && state.results[active]) {
      event.preventDefault();
      pick(state.results[active]);
    } else if (event.key === "Escape" && open) {
      event.preventDefault();
      setOpen(false);
    }
  };
  const showPopup = open && state.status !== "IDLE";
  const activeId = showPopup && state.results[active] ? `birthplace-option-${state.results[active].birthplace_geonames_id}` : undefined;
  return (
    <div className="relative min-w-0" data-birthplace-picker data-birthplace-combobox>
      <div className="shinka-framed-field flex items-center gap-3">
        <span className="min-w-0 flex-1">
          <label htmlFor="birthplace" className="block text-shinka-small text-shinka-plum">
            {t("birthplace")} <span className="text-shinka-taupe">{t("placeOptional")}</span>
          </label>
          <input ref={input} id="birthplace" type="text" role="combobox" autoComplete="off" autoCapitalize="words" spellCheck={false} enterKeyHint="search"
            aria-autocomplete="list" aria-expanded={showPopup} aria-controls="birthplace-listbox" aria-activedescendant={activeId}
            aria-invalid={error} aria-describedby={error ? "birthplace-error" : undefined} disabled={disabled}
            placeholder={t("placeSearchPlaceholder")} value={text} maxLength={80}
            onChange={(e) => type(e.target.value)} onKeyDown={keyDown} onBlur={() => setOpen(false)} onFocus={() => text && !selection && setOpen(true)}
            className="block min-h-8 w-full min-w-0 bg-transparent text-shinka-ink outline-none placeholder:text-shinka-taupe" />
        </span>
        {text ? (
          <button type="button" onClick={clear} disabled={disabled} aria-label={t("placeClear")} className="-mr-2 flex h-11 w-11 shrink-0 items-center justify-center rounded-full text-shinka-taupe" data-place-clear>
            <X aria-hidden="true" className="h-5 w-5" />
          </button>
        ) : (
          <MapPin aria-hidden="true" className="h-5 w-5 shrink-0 text-shinka-taupe" />
        )}
      </div>
      {showPopup && <BirthplaceResults t={t} search={state} active={active} onPick={pick} onMore={() => void search.more()} onRetry={() => void search.retry()} />}
    </div>
  );
}
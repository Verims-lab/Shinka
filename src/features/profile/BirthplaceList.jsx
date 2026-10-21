import { lazy, Suspense, useLayoutEffect, useRef, useState } from "react";
const BirthplaceSheet = lazy(() => import("./BirthplaceSheet"));
import ShinkaButton from "@/components/shinka/ShinkaButton";
import ShinkaSelect from "@/components/shinka/ShinkaSelect";

const optionText = (option) =>
  `${option.name}${option.context ? ` · ${option.context}` : ""}`;

// One paged resource: presentation and accessible feedback only. The picker owns requests.
export default function BirthplaceList({
  resourceKey,
  label,
  placeholder,
  data,
  selected,
  choose,
  unavailable = false,
  disabled,
  picker,
  t,
  language,
}) {
  const container = useRef(null);
  const [mobile, setMobile] = useState(false), [open, setOpen] = useState(false);
  useLayoutEffect(() => {
    const media = container.current.ownerDocument.defaultView.matchMedia('(max-width: 767px), (pointer: coarse)');
    const update = () => { setMobile(media.matches); if (!media.matches) setOpen(false); };
    update(); media.addEventListener('change', update);
    return () => media.removeEventListener('change', update);
  }, []);
  const options = selected && !data.options.some(x => x.id === selected.id) ? [selected, ...data.options] : data.options;
  const selectedOption = options.find(option => option.id === selected?.id);
  const ids = `place-${resourceKey}`;
  const counts = new Map();
  for (const option of options) counts.set(optionText(option), (counts.get(optionText(option)) || 0) + 1);
  const text = option => `${optionText(option)}${counts.get(optionText(option)) > 1 ? ` · #${option.id}` : ''}`;
  const inactive = disabled || unavailable || data.status !== 'READY' || !data.options.length;
  const feedback = <>
      {selectedOption?.context && (
        <p className="break-words text-shinka-small text-shinka-taupe">
          {optionText(selectedOption)}
        </p>
      )}
      <div
        id={`${ids}-status`}
        className="space-y-2 text-shinka-small text-shinka-taupe"
        role="status"
        aria-live="polite"
      >
        {data.status === "LOADING" && <p>{t("placeLoading")}</p>}
        {data.status === "ERROR" && (
          <>
            <p>{t(data.error)}</p>
            <ShinkaButton
              variant="secondary"
              disabled={disabled}
              onClick={() => picker.retry(resourceKey)}
            >
              {t("retry")}
            </ShinkaButton>
          </>
        )}
        {data.status === "READY" && !data.options.length && (
          <p>
            {t(
              data.hierarchy_status === "NO_SUBDIVISIONS"
                ? "placeNoRegions"
                : "placeEmpty",
            )}
          </p>
        )}
        {data.status === "READY" && data.total > 0 && (
          <p>
            {t("placePage")
              .replace("{from}", String(data.offset + 1))
              .replace("{to}", String(data.offset + data.options.length))
              .replace("{total}", String(data.total))}
          </p>
        )}
        {data.limited && <p>{t("placeLimit")}</p>}
      </div>
      {(data.previous_offset !== null || data.next_offset !== null) && (
        <div className="flex flex-wrap gap-2" aria-label={t("placePages")}>
          <ShinkaButton
            variant="secondary"
            disabled={
              disabled ||
              data.status === "LOADING" ||
              data.previous_offset === null
            }
            onClick={() => picker.page(resourceKey, data.previous_offset)}
          >
            {t("placePrevious")}
          </ShinkaButton>
          <ShinkaButton
            variant="secondary"
            disabled={
              disabled || data.status === "LOADING" || data.next_offset === null
            }
            onClick={() => picker.page(resourceKey, data.next_offset)}
          >
            {t("placeNext")}
          </ShinkaButton>
        </div>
      )}
  </>;
  return <div ref={container} className="min-w-0 space-y-2">
    <label htmlFor={ids} className="block text-shinka-body">{label}</label>
    {mobile ? <ShinkaButton id={ids} value={selected?.id ?? ''} variant="secondary" className="w-full justify-between min-h-[52px] text-[17px] leading-[calc(25/17*1em)] text-left" data-place-control disabled={inactive} aria-haspopup="dialog" aria-expanded={open} aria-describedby={`${ids}-status`} onClick={event => { event.currentTarget.focus(); setOpen(true); }}>{selectedOption ? text(selectedOption) : placeholder}<span aria-hidden="true">⌄</span></ShinkaButton> :
      <ShinkaSelect id={ids} data-place-control value={selected?.id ?? ''} disabled={inactive} onChange={e => choose(Number(e.target.value))} aria-busy={data.status === 'LOADING'} aria-describedby={`${ids}-status`}>
        <option value="" disabled>{placeholder}</option>
        {options.map(option => <option key={option.id} value={option.id}>{text(option)}</option>)}
      </ShinkaSelect>}
    {open && mobile ? <Suspense fallback={feedback}><BirthplaceSheet label={label} options={options} selected={selected} text={text} choose={choose} close={() => setOpen(false)} language={language} disabled={inactive}>{feedback}</BirthplaceSheet></Suspense> : feedback}
  </div>;
}

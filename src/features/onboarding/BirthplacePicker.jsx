import { useEffect, useMemo, useRef, useSyncExternalStore } from "react";
import ShinkaButton from "@/components/shinka/ShinkaButton";
import BirthplaceList from "./BirthplaceList";
import { onboardingCopy } from "@/foundation/i18n/onboardingCopy";
import { createBirthplacePicker } from "./birthplaceSelection";

/** @param {{language:string,request:Function,selection?:any,onChange:Function,disabled?:boolean,error?:boolean}} props */
export default function BirthplacePicker({
  language,
  request,
  selection = null,
  onChange,
  disabled = false,
  error = false,
}) {
  const callback = useRef(onChange);
  callback.current = onChange;
  const picker = useMemo(
    () =>
      createBirthplacePicker({
        request,
        selection,
        onChange: (value) => callback.current(value),
      }),
    [request],
  );
  const state = useSyncExternalStore(picker.subscribe, picker.getSnapshot);
  const t = (key) => onboardingCopy(key, language);
  useEffect(() => {
    void picker.start(language);
    return picker.dispose;
  }, [picker]);
  useEffect(() => {
    void picker.language(language);
  }, [picker, language]);
  const list = (
    key,
    label,
    placeholder,
    data,
    selected,
    choose,
    unavailable = false,
  ) => (
    <BirthplaceList
      key={key}
      resourceKey={key}
      label={label}
      placeholder={placeholder}
      data={data}
      selected={selected}
      choose={choose}
      unavailable={unavailable}
      disabled={disabled}
      picker={picker}
      t={t}
    />
  );
  return (
    <fieldset
      id="birthplace"
      tabIndex={-1}
      aria-invalid={error}
      aria-describedby={error ? "birthplace-error" : "birthplace-help"}
      className="min-w-0 space-y-4 rounded-shinka-md focus-visible:outline focus-visible:outline-2 focus-visible:outline-shinka-plum"
      data-birthplace-picker
    >
      <legend className="mb-2 text-shinka-body font-medium">
        {t("birthplace")}{" "}
        <span className="font-normal text-shinka-taupe">
          {t("placeOptional")}
        </span>
      </legend>
      <p id="birthplace-help" className="text-shinka-small text-shinka-taupe">
        {t("placeHelp")}
      </p>
      {state.selection && (
        <div
          className="space-y-1 rounded-shinka-sm bg-shinka-lavender p-4"
          role="status"
          data-place-summary
        >
          <p className="text-shinka-small text-shinka-plum">
            {t("placeSelected")}
          </p>
          <p className="break-words font-medium">
            {state.selection.birthplace_name} ·{" "}
            {state.selection.birthplace_country_code}
          </p>
        </div>
      )}
      {!state.editing ? (
        <ShinkaButton
          variant="secondary"
          disabled={disabled}
          onClick={picker.edit}
        >
          {t("placeChange")}
        </ShinkaButton>
      ) : (
        <>
          {list(
            "countries",
            t("placeCountry"),
            t("placeChooseCountry"),
            state.countries,
            state.country,
            picker.country,
          )}
          {!state.country &&
            list(
              "region",
              t("placeRegion"),
              t("placeChooseCountryFirst"),
              {
                status: "IDLE",
                options: [],
                previous_offset: null,
                next_offset: null,
              },
              null,
              () => {},
              true,
            )}
          {state.country &&
            state.regions.map((data, index) => {
              const level =
                data.level ??
                state.path[index]?.level ??
                (state.path[index - 1]?.level || 0) + 1;
              return list(
                String(index),
                t(
                  level === 1
                    ? "placeRegion"
                    : level === 2
                      ? "placeDistrict"
                      : "placeSubregion",
                ),
                t("placeChooseRegion"),
                data,
                state.path[index],
                (id) => picker.region(index, id),
              );
            })}
          {list(
            "places",
            t("placeSettlement"),
            t(
              state.country
                ? "placeChooseSettlement"
                : "placeChooseCountryFirst",
            ),
            state.places,
            state.selection
              ? {
                  id: state.selection.birthplace_geonames_id,
                  name: state.selection.birthplace_name,
                  context: state.selection.birthplace_country_code,
                }
              : null,
            picker.place,
            !state.country,
          )}
          {state.incomplete && (
            <p className="text-shinka-small text-shinka-taupe">
              {t("PLACE_SELECTION_INCOMPLETE")}
            </p>
          )}
        </>
      )}
      <ShinkaButton
        variant="ghost"
        disabled={disabled}
        onClick={picker.clear}
        data-place-clear
      >
        {t("placeClear")}
      </ShinkaButton>
    </fieldset>
  );
}

import ShinkaButton from "@/components/shinka/ShinkaButton";
import ShinkaInput from "@/components/shinka/ShinkaInput";
import BirthplacePicker from "../profile/BirthplacePicker";
import FramedDateField from "./FramedDateField";
import {
  optionalName,
  optionalBirthTime,
  validateBirthDate,
  validateCycleInput,
  OnboardingError,
} from "../../../base44/shared/onboardingValidation.js";

export function FieldError({ name, error, t }) {
  return error?.field === name ? (
    <p
      id={`${name}-error`}
      role="alert"
      className="text-shinka-small text-shinka-ink"
    >
      {t(error.code)}
    </p>
  ) : null;
}

function Field({ name, type, form, update, error, busy, t, ...inputProps }) {
  return (
    <div className="space-y-2">
      <label htmlFor={name}>{t(name)}</label>
      <ShinkaInput
        id={name}
        type={type}
        value={form[name]}
        onChange={(e) => update(name, e.target.value)}
        aria-invalid={error?.field === name}
        aria-describedby={error?.field === name ? `${name}-error` : undefined}
        disabled={busy}
        {...inputProps}
      />
      <FieldError name={name} error={error} t={t} />
    </div>
  );
}

// Screen owns request serialization and idempotency. Forms own field presentation
// and invoke the same shared validation contract that the server enforces.
export function ProfileForm({
  form,
  update,
  error,
  busy,
  t,
  today,
  name,
  birthplace,
  onPlaceChange,
  language,
  request,
  run,
  submit,
}) {
  const save = async () => {
    validateBirthDate(form.birth_date, today);
    optionalBirthTime(form.birth_time);
    if (birthplace.incomplete)
      throw new OnboardingError("PLACE_SELECTION_INCOMPLETE", "birthplace");
    await submit("saveProfile", {
      display_name: optionalName(name),
      birth_date: form.birth_date,
      birth_time: form.birth_time || null,
      birthplace_geonames_id:
        birthplace.selection?.birthplace_geonames_id ?? null,
    });
  };
  const fields = { form, update, error, busy, t };
  return (
    <form
      className="space-y-5"
      noValidate
      onSubmit={(e) => {
        e.preventDefault();
        void run(save);
      }}
    >
      <FramedDateField
        {...fields}
        name="birth_date"
        type="date"
        required
        max={today || undefined}
      />
      <FramedDateField {...fields} name="birth_time" type="time" optional />
      <BirthplacePicker
        compact
        language={language}
        request={request}
        selection={birthplace.selection}
        disabled={busy}
        error={error?.field === "birthplace"}
        onChange={onPlaceChange}
      />
      <FieldError name="birthplace" error={error} t={t} />
      <ShinkaButton type="submit" className="w-full" disabled={busy}>
        {t("continue")}
      </ShinkaButton>
    </form>
  );
}

export function CycleForm({
  form,
  update,
  error,
  busy,
  t,
  today,
  run,
  submit,
  onSkip,
}) {
  const save = async () => {
    validateCycleInput(form, today);
    await submit("saveCycle", {
      period_start_date: form.period_start_date || null,
      period_duration_days: form.period_duration_days || null,
      initial_cycle_length_days: form.initial_cycle_length_days || null,
      health_consent: form.health_consent,
    });
  };
  const fields = { form, update, error, busy, t };
  return (
    <form
      className="space-y-5"
      noValidate
      onSubmit={(e) => {
        e.preventDefault();
        void run(save);
      }}
    >
      <Field
        {...fields}
        name="period_start_date"
        type="date"
        max={today || undefined}
      />
      <Field
        {...fields}
        name="period_duration_days"
        type="number"
        placeholder="5"
        min={1}
        max={10}
        step={1}
      />
      <Field
        {...fields}
        name="initial_cycle_length_days"
        type="number"
        placeholder="28"
        min={15}
        max={60}
        step={1}
      />
      <label
        className="flex min-h-11 items-center gap-3"
        htmlFor="health_consent"
      >
        <input
          id="health_consent"
          type="checkbox"
          checked={form.health_consent}
          onChange={(e) => update("health_consent", e.target.checked)}
          disabled={busy}
          className="h-6 w-6 shrink-0 accent-shinka-plum"
          aria-describedby={
            error?.field === "health_consent"
              ? "health_consent-error"
              : undefined
          }
        />
        {t("health_consent")}
      </label>
      <FieldError name="health_consent" error={error} t={t} />
      <ShinkaButton type="submit" className="w-full" disabled={busy}>
        {t("continue")}
      </ShinkaButton>
      <ShinkaButton
        variant="ghost"
        className="w-full"
        disabled={busy}
        onClick={() => run(onSkip)}
      >
        {t("skip")}
      </ShinkaButton>
    </form>
  );
}
import { CalendarDays, Clock } from "lucide-react";
import { FieldError } from "./OnboardingForms";

// ON-04 date/time field: label inside a soft frame; native control kept (values,
// validation and formats unchanged). The decorative icon never intercepts taps.
export default function FramedDateField({ name, type, form, update, error, busy, t, required = false, optional = false, ...rest }) {
  const Icon = type === "time" ? Clock : CalendarDays;
  return (
    <div className="min-w-0 space-y-2">
      <div className="shinka-framed-field relative">
        <label htmlFor={name} className="block text-shinka-small text-shinka-plum">
          {t(name)}
          {required && <span aria-hidden="true"> *</span>}
          {optional && <span className="text-shinka-taupe"> {t("placeOptional")}</span>}
        </label>
        <input
          id={name}
          type={type}
          value={form[name]}
          onChange={(e) => update(name, e.target.value)}
          required={required}
          aria-invalid={error?.field === name}
          aria-describedby={error?.field === name ? `${name}-error` : undefined}
          disabled={busy}
          className="shinka-datetime block w-full min-w-0 max-w-full bg-transparent pr-10 text-[17px] text-shinka-ink outline-none"
          {...rest}
        />
        <Icon aria-hidden="true" className="pointer-events-none absolute bottom-3 right-4 h-5 w-5 text-shinka-taupe" />
      </div>
      <FieldError name={name} error={error} t={t} />
    </div>
  );
}
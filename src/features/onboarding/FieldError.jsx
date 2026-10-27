export default function FieldError({ name, error, t }) {
  return error?.field === name ? (
    <p id={`${name}-error`} role="alert" className="text-shinka-small text-shinka-ink">
      {t(error.code)}
    </p>
  ) : null;
}

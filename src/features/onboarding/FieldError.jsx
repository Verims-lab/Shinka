export default function FieldError({ name, error, t, focusTarget = false }) {
  return error?.field === name ? (
    <p id={`${name}-error`} role="alert" tabIndex={focusTarget ? -1 : undefined} className={focusTarget ? 'text-shinka-body font-medium text-shinka-ink' : 'text-shinka-small text-shinka-ink'}>
      {t(error.code)}
    </p>
  ) : null;
}

export default function KeyValueGrid({ items }) {
  return (
    <dl className="grid grid-cols-1 sm:grid-cols-2 gap-x-6 gap-y-3">
      {items.map(([k, v]) => (
        <div key={k} className="min-w-0">
          <dt className="text-[11px] uppercase tracking-wider text-shinka-muted">{k}</dt>
          <dd className="text-sm text-shinka-ink break-words">{v}</dd>
        </div>
      ))}
    </dl>
  );
}
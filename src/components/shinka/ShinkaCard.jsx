// UI/UX v1.1 card: white, radius 20, padding 20, 1px divider border, subtle shadow.
export default function ShinkaCard({ title = undefined, children, className = "", surface = 'card', padded = true }) {
  return (
    <section className={`${surface === 'plain' ? 'bg-transparent' : 'bg-shinka-white border border-shinka-line rounded-shinka-lg shadow-shinka-card'}${padded ? ' p-5' : ''} min-w-0 break-words ${className}`}>
      {title && <h2 className="font-heading font-medium text-shinka-h3 text-shinka-plum-deep mb-4">{title}</h2>}
      {children}
    </section>
  );
}

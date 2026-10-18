// UI/UX v1.1 card: white, radius 20, padding 20, 1px divider border, subtle shadow.
export default function ShinkaCard({ title = undefined, children, className = "" }) {
  return (
    <section className={`bg-shinka-white border border-shinka-line rounded-shinka-lg shadow-shinka-card p-5 min-w-0 ${className}`}>
      {title && <h2 className="font-heading font-medium text-shinka-h3 text-shinka-plum-deep mb-4">{title}</h2>}
      {children}
    </section>
  );
}
export default function ShinkaCard({ title, children, className = "" }) {
  return (
    <section className={`bg-shinka-surface border border-shinka-line rounded-[20px] p-5 min-w-0 ${className}`}>
      {title && <h2 className="font-heading text-2xl text-shinka-plum-deep mb-4">{title}</h2>}
      {children}
    </section>
  );
}
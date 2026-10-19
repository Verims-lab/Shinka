export default function PageContainer({ children, ...props }) {
  return (
    <div className="shinka-viewport bg-shinka-ivory text-shinka-ink font-body" data-probe-root="" {...props}>
      <div className="shinka-safe-content max-w-5xl mx-auto space-y-5 min-w-0">{children}</div>
    </div>
  );
}

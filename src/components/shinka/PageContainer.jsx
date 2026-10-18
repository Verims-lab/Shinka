export default function PageContainer({ children, ...props }) {
  return (
    <div className="min-h-screen bg-shinka-ivory text-shinka-ink font-body" data-probe-root="" {...props}>
      <div className="max-w-5xl mx-auto px-4 sm:px-6 py-6 space-y-5 min-w-0">{children}</div>
    </div>
  );
}
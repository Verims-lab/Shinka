// "section" is transparent even in isolated fixtures. In the app the shared
// backdrop also shows through default page containers on user-facing routes.
export default function PageContainer({ children, className = "", surface = "ivory", ...props }) {
  const bg = surface === "section" ? "" : "bg-shinka-ivory ";
  return (
    <div className={`shinka-viewport ${bg}text-shinka-ink font-body ${className}`.trim()} data-probe-root="" {...props}>
      <div className="shinka-safe-content max-w-5xl mx-auto space-y-5 min-w-0">{children}</div>
    </div>
  );
}

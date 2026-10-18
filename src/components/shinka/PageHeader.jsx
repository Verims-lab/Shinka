import { BUILD_MARKER } from "@/foundation/buildMarker";

export default function PageHeader({ eyebrow, title, children }) {
  return (
    <header className="space-y-3">
      <div className="flex flex-wrap items-center gap-2 text-[11px] uppercase tracking-[0.25em] text-shinka-muted">
        <span>{eyebrow}</span>
        <span aria-hidden="true">·</span>
        <span data-build-marker className="font-mono normal-case tracking-normal text-shinka-plum">{BUILD_MARKER}</span>
      </div>
      <h1 className="font-heading text-4xl sm:text-5xl text-shinka-plum-deep leading-tight">{title}</h1>
      {children}
    </header>
  );
}
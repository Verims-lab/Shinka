import { BUILD_MARKER } from "@/foundation/buildMarker";

export default function PageHeader({ eyebrow, title, children = undefined }) {
  return (
    <header className="space-y-3">
      <div className="flex flex-wrap items-center gap-2 text-[11px] uppercase tracking-[0.25em] text-shinka-muted">
        <span>{eyebrow}</span>
        <span aria-hidden="true">·</span>
        <span data-build-marker className="font-mono normal-case tracking-normal text-shinka-plum">{BUILD_MARKER}</span>
      </div>
      <h1 className="font-heading font-medium text-shinka-h2 sm:text-shinka-h1 text-shinka-plum-deep leading-tight sm:leading-[40px]">{title}</h1>
      {children}
    </header>
  );
}

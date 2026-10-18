const VARIANTS = {
  primary: "min-h-[52px] rounded-shinka-md bg-shinka-plum text-shinka-white hover:bg-shinka-plum-deep",
  secondary: "min-h-11 rounded-shinka-sm bg-shinka-white text-shinka-plum border border-shinka-line hover:bg-shinka-lavender",
  ghost: "min-h-11 rounded-shinka-sm text-shinka-plum hover:bg-shinka-lavender",
};

// UI/UX v1.1: primary CTA ≥52px, radius 16, disabled ≈.45; every control ≥44×44; transition 200ms.
export default function ShinkaButton({ variant = "primary", className = "", children, ...props }) {
  return (
    <button
      type="button"
      data-variant={variant}
      className={`min-w-11 px-4 text-shinka-body font-body font-medium inline-flex items-center justify-center gap-2 transition-colors duration-200 disabled:opacity-45 disabled:cursor-not-allowed focus-visible:outline focus-visible:outline-2 focus-visible:outline-shinka-plum ${VARIANTS[variant]} ${className}`}
      {...props}
    >
      {children}
    </button>
  );
}
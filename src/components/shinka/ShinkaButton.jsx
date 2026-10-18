const VARIANTS = {
  primary: "bg-shinka-plum text-shinka-surface hover:bg-shinka-plum-deep",
  secondary: "bg-shinka-surface text-shinka-plum border border-shinka-line hover:bg-shinka-plum-soft",
  ghost: "text-shinka-plum hover:bg-shinka-plum-soft",
};

// 44×44 minimum touch target enforced via min-h-11/min-w-11.
export default function ShinkaButton({ variant = "primary", className = "", children, ...props }) {
  return (
    <button
      type="button"
      className={`min-h-11 min-w-11 px-4 rounded-xl text-sm font-medium inline-flex items-center justify-center gap-2 transition-colors duration-150 disabled:opacity-50 disabled:cursor-not-allowed focus-visible:outline focus-visible:outline-2 focus-visible:outline-shinka-plum ${VARIANTS[variant]} ${className}`}
      {...props}
    >
      {children}
    </button>
  );
}
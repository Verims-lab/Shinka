import { forwardRef } from "react";

// UI/UX v1.1 input: white, radius 16, min height 52, horizontal padding 16. Callers must supply a label.
const ShinkaInput = forwardRef(function ShinkaInput({ className = "", ...props }, ref) {
  return (
    <input
      ref={ref}
      className={`min-h-[52px] w-full rounded-shinka-md bg-shinka-white border border-shinka-line px-4 text-shinka-body text-shinka-ink placeholder:text-shinka-taupe transition-colors duration-200 focus-visible:outline focus-visible:outline-2 focus-visible:outline-shinka-plum ${className}`}
      {...props}
    />
  );
});

export default ShinkaInput;
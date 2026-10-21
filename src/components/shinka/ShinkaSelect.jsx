import { ChevronDown } from "lucide-react";
// Native selection keeps touch, keyboard and screen-reader behavior without a
// searchable combobox or another dependency. Matches the shared input tokens.
/** @param {import('react').SelectHTMLAttributes<HTMLSelectElement>} props */
export default function ShinkaSelect({ className = "", children, ...props }) {
  return (
    <div className="relative min-w-0">
      <select
        className={`appearance-none min-h-[52px] w-full min-w-0 max-w-full rounded-shinka-md border border-shinka-control bg-shinka-white px-4 pr-10 text-[17px] leading-[calc(25/17*1em)] text-shinka-ink focus-visible:outline focus-visible:outline-2 focus-visible:outline-shinka-plum disabled:opacity-45 ${className}`}
        {...props}
      >
        {children}
      </select>
      <ChevronDown
        aria-hidden="true"
        className="pointer-events-none absolute right-4 top-1/2 h-4 w-4 -translate-y-1/2 text-shinka-plum"
      />
    </div>
  );
}

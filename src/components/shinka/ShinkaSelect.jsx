// Native selection keeps touch, keyboard and screen-reader behavior without a
// searchable combobox or another dependency. Matches the shared input tokens.
/** @param {import('react').SelectHTMLAttributes<HTMLSelectElement>} props */
export default function ShinkaSelect({className='',children,...props}) {
  return <select className={`min-h-[52px] w-full min-w-0 max-w-full rounded-shinka-md border border-shinka-line bg-shinka-white px-4 pr-8 text-[17px] leading-[25px] text-shinka-ink focus-visible:outline focus-visible:outline-2 focus-visible:outline-shinka-plum disabled:opacity-45 ${className}`} {...props}>{children}</select>;
}

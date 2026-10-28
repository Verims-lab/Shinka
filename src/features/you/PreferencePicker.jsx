import { useState } from 'react';
import { ChevronDown } from 'lucide-react';
import PreferenceSheet from './PreferenceSheet';

// Visible label + selected value trigger. `data-value` mirrors the draft value.
export default function PreferencePicker({ id, label, options, value, disabled, cancelLabel, onChange, ...rest }) {
  const [open, setOpen] = useState(false);
  const selected = options.find(option => option.value === value) || options[0];
  return <div className="space-y-2">
    <span id={`${id}-label`}>{label}</span>
    <button id={id} type="button" {...rest} data-value={selected.value} disabled={disabled} aria-haspopup="dialog" aria-expanded={open} aria-labelledby={`${id}-label ${id}`} onClick={() => setOpen(true)}
      className="flex min-h-[52px] w-full items-center justify-between gap-3 rounded-shinka-md border border-shinka-control bg-shinka-white px-4 text-left text-shinka-ink break-words disabled:opacity-60 focus-visible:outline-2 focus-visible:outline-shinka-plum">
      <span>{selected.label}</span><ChevronDown className="h-5 w-5 shrink-0" aria-hidden="true"/>
    </button>
    {open && <PreferenceSheet id={id} title={label} options={options} value={selected.value} cancelLabel={cancelLabel} onPick={onChange} onClose={() => setOpen(false)}/>}
  </div>;
}
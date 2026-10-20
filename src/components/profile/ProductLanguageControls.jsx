import { useEffect, useRef, useState } from 'react';
import ShinkaButton from '@/components/shinka/ShinkaButton';
import { youCopy } from '@/foundation/i18n/youCopy';
// Production delegates to the owner's persisted preference boundary. Standalone
// component fixtures may provide a display-only callback, as before.
export default function ProductLanguageControls({ language, onChange }) {
  const [busy, setBusy] = useState(false), [error, setError] = useState('');
  const pending = useRef(false), active = useRef(true);
  useEffect(() => () => { active.current = false; }, []);
  const change = async next => {
    if (pending.current || next === language) return;
    pending.current = true; setBusy(true); setError('');
    try { await onChange(next); } catch (failure) { if (active.current) setError(failure?.unknown ? 'languageUnknown' : 'languageError'); }
    finally { pending.current = false; if (active.current) setBusy(false); }
  };
  return <div className="flex flex-wrap items-center gap-1" aria-busy={busy}>
    {['tr','en'].map(lang => <ShinkaButton key={lang} variant="ghost" disabled={busy} aria-pressed={lang === language} onClick={() => change(lang)}>{lang.toUpperCase()}</ShinkaButton>)}
    {error && <p role="alert" className="basis-full max-w-64 text-shinka-caption">{youCopy(error, language)}</p>}
  </div>;
}

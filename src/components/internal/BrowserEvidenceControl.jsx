import { useEffect, useState } from 'react';
import { probeIdentity, acceptBrowserEvidence } from '@/foundation/probes/browserEvidence';
import { internalLanguage } from '@/foundation/internalNavigation';
import { useLocation } from 'react-router-dom';
import { healthCopy } from '@/foundation/i18n/healthCopy';
export default function BrowserEvidenceControl() {
  const [identity,setIdentity]=useState(null),[state,setState]=useState('');
  const lang=internalLanguage(useLocation().state);
  useEffect(()=>{let active=true;probeIdentity().then(value=>{if(active)setIdentity(value);});return()=>{active=false;};},[]);
  const read=async event=>{
    try {const file=event.target.files?.[0];if(!file||file.size>50000)throw new Error();await acceptBrowserEvidence(JSON.parse(await file.text()));setState('evidenceLoaded');}
    catch {setState('evidenceInvalid');}
  };
  return <section className="my-4 space-y-2">
    <p>{healthCopy('evidenceHelp',lang)}</p>
    <label className="block" htmlFor="browser-evidence">{healthCopy('evidenceLabel',lang)}</label>
    <input id="browser-evidence" type="file" accept="application/json" onChange={read} className="min-h-11 max-w-full" />
    <p role="status">{state&&healthCopy(state,lang)}</p>
    <span hidden data-probe-identity>{identity&&JSON.stringify(identity)}</span>
  </section>;
}

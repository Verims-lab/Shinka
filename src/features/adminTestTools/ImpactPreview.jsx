import { useEffect, useRef } from 'react';
import ShinkaButton from '@/components/shinka/ShinkaButton';
import { testToolsCopy as copy } from '@/foundation/i18n/testToolsCopy';

export default function ImpactPreview({ preview, language, execute, cancel, busy }) {
  const heading = useRef(null);
  useEffect(() => { heading.current?.focus(); }, [preview]);
  const text = key => copy(key, language);
  const deleting = preview.operation === 'DELETE_USER';
  return <section data-test-preview className="space-y-4 border-t border-shinka-line pt-5">
    <h2 ref={heading} tabIndex={-1} className="text-shinka-h2">{text('preview')}: {text(preview.operation)}</h2>
    <p className="break-all">{preview.target.id} · {preview.target.full_name || '—'} · {preview.target.email || '—'}</p>
    <p>{text(deleting ? 'deleteDescription' : 'resetDescription')}</p>
    {deleting && <div className="space-y-4">
      {[['deleted', preview.scope.deleted], ['retained', preview.scope.retained]].map(([kind, entities]) => <div key={kind}>
        <h3 className="font-medium">{text(kind)}</h3>
        <dl className="space-y-2">{entities.map(entity => <div key={entity} className="flex justify-between gap-4 text-sm">
          <dt>{text(entity)}</dt><dd>{entity === 'User' ? 1 : preview.counts[entity] ?? text('unknownCount')}</dd>
        </div>)}</dl>
      </div>)}
      <p>{text('notifications')} ({preview.pending_notifications})</p>
    </div>}
    <p>{text('consent')}</p><p>{text('shared')}</p>
    {!!preview.blockers.length && <div role="status" className="rounded-xl bg-shinka-lavender p-4">
      <h3 className="font-medium">{text('blocked')}</h3>
      <ul className="list-disc pl-5">{preview.blockers.map(code => <li key={code}>{text(code)}</li>)}</ul>
    </div>}
    <div className="flex flex-wrap gap-3">
      <ShinkaButton onClick={execute} disabled={busy || !preview.enabled || Date.parse(preview.expires_at) <= Date.now()}>{text(deleting ? 'DELETE_USER' : 'execute')}</ShinkaButton>
      <ShinkaButton variant="secondary" onClick={cancel} disabled={busy}>{text('cancel')}</ShinkaButton>
    </div>
  </section>;
}

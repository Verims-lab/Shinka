import { useLocation } from 'react-router-dom';
import { useRef } from 'react';
import PageContainer from '@/components/shinka/PageContainer';
import PageHeader from '@/components/shinka/PageHeader';
import ShinkaCard from '@/components/shinka/ShinkaCard';
import ShinkaInput from '@/components/shinka/ShinkaInput';
import ShinkaButton from '@/components/shinka/ShinkaButton';
import InternalNav from '@/components/internal/InternalNav';
import { internalLanguage } from '@/foundation/internalNavigation';
import { testToolsCopy as copy } from '@/foundation/i18n/testToolsCopy';
import { ADMIN_TEST_TOOLS } from '@/features/adminTestTools/catalog';
import { useTestTools } from '@/features/adminTestTools/useTestTools';
import ImpactPreview from '@/features/adminTestTools/ImpactPreview';

export default function TestTools({ request = undefined, wait = undefined, clock = undefined }) {
  const language = internalLanguage(useLocation().state), text = key => copy(key, language);
  const tools = useTestTools(request, wait, clock);
  const target = tools.value?.target, environment = tools.preview?.environment || tools.value?.environment;
  const lookupButton = useRef(null);
  return <PageContainer>
    <InternalNav /><PageHeader eyebrow="Shinka" title={text('title')} />
    <main data-test-tools data-test-phase={tools.phase} data-test-busy={tools.busy} className="space-y-5">
      <ShinkaCard title={text('target')}>
        <form className="space-y-4" onSubmit={e => { e.preventDefault(); tools.lookup(); }}>
          <label className="block space-y-2" htmlFor="test-user-id"><span>{text('userId')}</span>
            <ShinkaInput ref={lookupButton} id="test-user-id" autoComplete="off" spellCheck={false} maxLength={100} disabled={tools.busy && !!tools.pendingId} value={tools.input} onChange={e => tools.changeInput(e.target.value)} />
          </label>
          <ShinkaButton id="test-lookup-button" type="submit" disabled={tools.busy || !/^[a-zA-Z0-9_-]{1,100}$/.test(tools.input.trim())}>{tools.busy ? text('busy') : text('lookup')}</ShinkaButton>
        </form>
        {target && <dl className="mt-5 space-y-2" data-test-target>
          {[[text('userId'), target.id], [text('identity'), [target.full_name, target.email].filter(Boolean).join(' · ') || '—'], [text('role'), text(target.role)], [text('account'), text(target.account_status)]].map(([label, value]) => <div key={label} className="min-w-0"><dt className="font-medium">{label}</dt><dd className="break-all">{value}</dd></div>)}
        </dl>}
      </ShinkaCard>
      {environment && <ShinkaCard title={text('environment')}>
        <p className="break-all">{environment.app_id}</p><p className="break-all">{environment.server}</p>
        <p>{text(environment.label)}</p><p className="mt-3">{text('sharedDatabase')}</p>
      </ShinkaCard>}
      <div className="grid gap-5 md:grid-cols-2">
        {ADMIN_TEST_TOOLS.map(tool => <ShinkaCard key={tool.operation} title={text(tool.operation)}>
          <p className="mb-4">{text(tool.description)}</p>
          <ShinkaButton variant="secondary" data-destructive={tool.destructive} disabled={!target || tools.busy || !!tools.job} onClick={() => tools.inspect(tool.operation)}>{text(tool.operation)}</ShinkaButton>
        </ShinkaCard>)}
      </div>
      {tools.preview && <ImpactPreview {...tools} language={language} cancel={() => { tools.cancel(); lookupButton.current?.focus(); }} />}
      {tools.error && <div role="alert">
        <p>{text(tools.phase==='MISSING'?'missing':tools.phase==='UNKNOWN'?'unknownResult':text(tools.error.code)!==tools.error.code?tools.error.code:'error')}</p>
        <details><summary className="min-h-11 cursor-pointer">{text('details')}</summary><p className="break-all text-sm">{[tools.error.code,tools.error.stage,tools.error.requestId].filter(Boolean).join(' · ')}</p></details>
      </div>}
      {(tools.job || tools.pendingId) && <ShinkaCard title={text('result')}>
        <div role="status">
          <p>{text(tools.phase==='DELETING'?'deleting':tools.phase==='UNKNOWN'?'unknownResult':tools.job?.operation==='RESET_ONBOARDING'?(tools.job.status==='COMPLETED'?'legacyResetCompleted':'legacyResetPending'):tools.phase==='COMPLETED'?'deletedResult':tools.job?'deletePending':'unknownResult')}</p>
          {tools.job && ['PARTIAL','DELETING'].includes(tools.phase) && <p>{text('stage')}: {text(tools.job.stage)}</p>}
          {tools.phase==='COMPLETED'&&tools.job?.operation==='DELETE_USER'&&<p>{text('removalScope')}</p>}
          {tools.phase==='PARTIAL'&&tools.value?.progress?.madeProgress===false&&<p>{text('noProgress')}</p>}
          <details><summary className="min-h-11 cursor-pointer">{text('details')}</summary><p className="break-all">{text('operationId')}: {tools.job?.operation_id || tools.pendingId}</p>
            {tools.value?.progress&&<p data-test-progress className="break-all">{text('processed')}: {tools.value.progress.processed} · {text('remaining')}: {tools.value.progress.remainingExact??(tools.value.progress.remainingAtLeast===1?'≥1':text('notCounted'))} · {tools.value.progress.elapsedMs} ms · {tools.value.progress.reason} · {tools.value.progress.checkpoints.join(', ')}</p>}
          </details>
        </div>
        <div className="mt-4 flex flex-wrap gap-3">
          {tools.job?.operation==='DELETE_USER'&&tools.phase==='PARTIAL'&&tools.value?.resume_enabled
            ? <ShinkaButton variant="secondary" data-test-resume onClick={tools.resume} disabled={tools.busy}>{text('retry')}</ShinkaButton>
            : <ShinkaButton variant="secondary" onClick={tools.status} disabled={tools.busy}>{text('check')}</ShinkaButton>}
        </div>
        {tools.job && ['RETRY_REQUIRED', 'AUDIT_PENDING', 'RUNNING'].includes(tools.job.status) && tools.value?.mutation_blocker && <p className="mt-3">{text(tools.value.mutation_blocker)}</p>}
      </ShinkaCard>}
    </main>
  </PageContainer>;
}

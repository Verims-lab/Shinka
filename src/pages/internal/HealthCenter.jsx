import ShinkaButton from '@/components/shinka/ShinkaButton';
import { useLocation } from 'react-router-dom';
import { internalLanguage } from '@/foundation/internalNavigation';
import { healthCopy } from '@/foundation/i18n/healthCopy';
import PageContainer from "@/components/shinka/PageContainer";
import PageHeader from "@/components/shinka/PageHeader";
import StatePanel from "@/components/shinka/StatePanel";
import InternalNav from "@/components/internal/InternalNav";
import HealthControls from "@/components/internal/HealthControls";
import HealthSummary from "@/components/internal/HealthSummary";
import SuiteSection from "@/components/internal/SuiteSection";
import RunHistory from "@/components/internal/RunHistory";
import { useHealthRunner } from "@/foundation/health/useHealthRunner";
import { SUITES } from "@/foundation/health/suites";
import { ACCEPTANCE_REQUIREMENTS, IN_APP_HEALTH_CASES } from "@/foundation/health/catalog";
import { HEALTH_CATALOG_VERSION } from "@/foundation/health/constants";
import { pendingCase } from "@/foundation/health/reportExport";
import { resolveEnvironment } from "@/foundation/environment";

export default function HealthCenter() {
  const language=internalLanguage(useLocation().state);
  const { report, running, progress, saveError, saveState, checkSaved, history, run, loadHistory, retrySave } = useHealthRunner();
  const cases = report ? report.cases : IN_APP_HEALTH_CASES.map(pendingCase);
  const suites = report ? SUITES.filter((s) => report.suites.some((x) => x.id === s.id)) : SUITES.filter(s=>s.active);
  return (
    <PageContainer data-health-root>
      <InternalNav />
      <PageHeader eyebrow="Internal · Health Center" title="Health Center">
        <p className="text-sm text-shinka-muted">Catalog {HEALTH_CATALOG_VERSION} · {IN_APP_HEALTH_CASES.length} cases · {resolveEnvironment().id}</p>
      </PageHeader>
      <p className="my-4">{healthCopy('scope',language)}</p>
      <HealthControls language={language} running={running} report={report} onRun={run} />
      {running && <StatePanel state="LOADING" message={`${healthCopy('running',language)} ${progress[0]}/${progress[1]}…`} />}
      {report && saveState!=='IDLE' && <div className="my-4 space-y-3" role="status" data-save-state={saveState}>
        <p>{healthCopy(saveState,language)}</p>
        {saveError && <details><summary className="min-h-11 cursor-pointer">{healthCopy('details',language)}</summary><p className="break-all">{saveError}</p></details>}
        {['FAILED','UNKNOWN'].includes(saveState) && <ShinkaButton onClick={retrySave} disabled={running}>{healthCopy('retrySave',language)}</ShinkaButton>}
        {saveState==='UNKNOWN' && <ShinkaButton variant="secondary" onClick={checkSaved} disabled={running}>{healthCopy('checkSaved',language)}</ShinkaButton>}
      </div>}
      {report && !running && <HealthSummary report={report} />}
      {suites.map((s) => <SuiteSection key={s.id} suite={s} cases={cases.filter((c) => c.suiteId === s.id)} />)}
      <section className="my-5 space-y-3" data-health-acceptance>
        <h2 className="text-shinka-h2">{healthCopy('separateAcceptance',language)}</h2>
        <p>{healthCopy('localAcceptance',language)}</p>
        <ul>{ACCEPTANCE_REQUIREMENTS.map(c=><li key={c.id}>{c.id} · {c.title} · {healthCopy(c.executionLocation==='LOCAL_BROWSER'?'localOnly':c.applicability==='FUTURE_PACKAGE'?'futureOnly':'externalOnly',language)}</li>)}</ul>
      </section>
      <RunHistory history={history} onRetry={loadHistory} />
    </PageContainer>
  );
}

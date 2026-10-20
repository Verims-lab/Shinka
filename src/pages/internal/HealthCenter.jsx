import BrowserEvidenceControl from '@/components/internal/BrowserEvidenceControl';
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
import TestsPanel from "@/components/internal/TestsPanel";
import { useHealthRunner } from "@/foundation/health/useHealthRunner";
import { SUITES } from "@/foundation/health/suites";
import { HEALTH_CASES } from "@/foundation/health/catalog";
import { HEALTH_CATALOG_VERSION } from "@/foundation/health/constants";
import { pendingCase } from "@/foundation/health/reportExport";
import { resolveEnvironment } from "@/foundation/environment";

export default function HealthCenter() {
  const language=internalLanguage(useLocation().state);
  const { report, running, progress, saveError, history, run, loadHistory, retrySave } = useHealthRunner();
  const cases = report ? report.cases : HEALTH_CASES.map(pendingCase);
  const suites = report ? SUITES.filter((s) => report.suites.some((x) => x.id === s.id)) : SUITES;
  return (
    <PageContainer data-health-root>
      <InternalNav />
      <PageHeader eyebrow="Internal · Health Center" title="Health Center">
        <p className="text-sm text-shinka-muted">Catalog {HEALTH_CATALOG_VERSION} · {HEALTH_CASES.length} cases · {resolveEnvironment().id}</p>
      </PageHeader>
      <BrowserEvidenceControl />
      <HealthControls running={running} report={report} onRun={run} />
      {running && <StatePanel state="LOADING" message={`Running ${progress[0]}/${progress[1]}…`} />}
      {saveError && <StatePanel state="ACTION_ERROR" message={healthCopy('saveFailed',language)} code={saveError} />}
      {saveError && report && <ShinkaButton onClick={retrySave} disabled={running}>{healthCopy('retrySave',language)}</ShinkaButton>}
      {report && !running && <HealthSummary report={report} />}
      {suites.map((s) => <SuiteSection key={s.id} suite={s} cases={cases.filter((c) => c.suiteId === s.id)} />)}
      <TestsPanel />
      <RunHistory history={history} onRetry={loadHistory} />
    </PageContainer>
  );
}
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
  const { report, running, progress, saveError, history, run, loadHistory } = useHealthRunner();
  const cases = report ? report.cases : HEALTH_CASES.map(pendingCase);
  const suites = report ? SUITES.filter((s) => report.suites.some((x) => x.id === s.id)) : SUITES;
  return (
    <PageContainer data-health-root>
      <InternalNav />
      <PageHeader eyebrow="Internal · Health Center" title="Health Center">
        <p className="text-sm text-shinka-muted">Catalog {HEALTH_CATALOG_VERSION} · {HEALTH_CASES.length} cases · {resolveEnvironment().id}</p>
      </PageHeader>
      <HealthControls running={running} report={report} onRun={run} />
      {running && <StatePanel state="LOADING" message={`Running ${progress[0]}/${progress[1]}…`} />}
      {saveError && <StatePanel state="ACTION_ERROR" message="Run finished but could not be saved to history." code={saveError} />}
      {report && !running && <HealthSummary report={report} />}
      {suites.map((s) => <SuiteSection key={s.id} suite={s} cases={cases.filter((c) => c.suiteId === s.id)} />)}
      <TestsPanel />
      <RunHistory history={history} onRetry={loadHistory} />
    </PageContainer>
  );
}
import { useEffect, useRef, useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import AppBackdrop from '@/components/shinka/AppBackdrop';
import PageContainer from '@/components/shinka/PageContainer';
import ShinkaButton from '@/components/shinka/ShinkaButton';
import OnboardingScreen from '@/features/onboarding/OnboardingScreen';
import { createOnboardingSimulation, SIMULATION_STEPS } from '@/features/adminTestTools/onboardingSimulation';
import { internalLanguage } from '@/foundation/internalNavigation';
import { testToolsCopy } from '@/foundation/i18n/testToolsCopy';
import '@/styles/onboardingTest.css';

const LEGAL_LINKS = Object.freeze({ terms: '#simulation-terms', privacy: '#simulation-privacy' });

// Mounted only inside the existing ProtectedRoute + AdminGate. The actual
// AuthProvider stays intact; "authenticated" below belongs solely to this UI.
function SimulationRun({ language, exit, restart, initialStep }) {
  const [simulation, setSimulation] = useState(null);
  const [step, setStep] = useState(initialStep);
  const [ready, setReady] = useState(false);
  const [complete, setComplete] = useState(false);
  const [legal, setLegal] = useState(false);
  const [toolbarHeight, setToolbarHeight] = useState(0);
  const toolbar = useRef(null);
  const text = key => testToolsCopy(key, language);
  useEffect(() => {
    const adapter = createOnboardingSimulation();
    setSimulation(adapter);
    return () => adapter.dispose();
  }, []);
  useEffect(() => {
    const update = () => setToolbarHeight(toolbar.current?.getBoundingClientRect().height || 0);
    const observer = new ResizeObserver(update);
    observer.observe(toolbar.current);
    update();
    return () => observer.disconnect();
  }, []);
  const index = SIMULATION_STEPS.indexOf(step);
  const move = next => {
    if (next === 'ACTIVE_EXISTING_USER') { setReady(true); return; }
    if (!SIMULATION_STEPS.includes(next)) return;
    setReady(false); setLegal(false); setComplete(false); setStep(next);
  };
  const leave = () => { simulation?.dispose(); exit(); };
  const repeat = () => { simulation?.dispose(); restart(); };
  const signOut = () => { simulation?.dispose(); restart(SIMULATION_STEPS[1]); };
  return <PageContainer className="shinka-onboarding-test-page" surface="section" data-onboarding-test lang={language}
    style={/** @type {import('react').CSSProperties} */ ({ '--shinka-onboarding-viewport-height': `calc(100dvh - ${toolbarHeight}px)` })}>
    <header ref={toolbar} className="shinka-onboarding-test-toolbar">
      <div className="flex flex-wrap items-center justify-between gap-x-3">
        <strong data-simulation-indicator>{text('simulationMode')}</strong>
        <ShinkaButton variant="ghost" data-simulation-exit onClick={leave}>{text('simulationExit')}</ShinkaButton>
      </div>
      <p className="text-shinka-small">{text('simulationNotice')}</p>
      <div className="flex flex-wrap gap-x-3">
        <ShinkaButton variant="ghost" data-simulation-back disabled={index === 0 && !complete}
          onClick={() => complete ? setComplete(false) : move(SIMULATION_STEPS[index - 1])}>{text('simulationBack')}</ShinkaButton>
        <ShinkaButton variant="ghost" data-simulation-restart onClick={repeat}>{text('simulationRestart')}</ShinkaButton>
        {step === 'FIRST_SHINKA_DEPENDENCY' && !complete && <ShinkaButton variant="secondary"
          data-simulation-prepare disabled={!ready} onClick={() => setComplete(true)}>{text('simulationPrepare')}</ShinkaButton>}
      </div>
      {legal && <p role="status" data-simulation-legal>{text('simulationLegal')}</p>}
    </header>
    <div className="shinka-onboarding-test-stage" onClickCapture={event => {
      if (event.target instanceof Element && event.target.closest('a[href^="#simulation-"]')) {
        event.preventDefault(); event.stopPropagation(); setLegal(true);
      }
    }}>
      <AppBackdrop />
      <div className="shinka-route-clip">
        <div className="shinka-onboarding-test-content">
        {complete && <main data-simulation-complete className="mx-auto max-w-md space-y-5 p-5">
          <h1 tabIndex={-1} ref={node => node?.focus()} className="shinka-unframed-title font-heading text-shinka-h1">{text('simulationComplete')}</h1>
          <p>{text('simulationNotice')}</p>
          <ShinkaButton onClick={repeat}>{text('simulationRestart')}</ShinkaButton>
        </main>}
        <div hidden={complete}>
        {simulation && <OnboardingScreen state={step} initialLanguage={language}
          authenticated={index >= 2} today={simulation.today}
          request={simulation.request} dailyRequest={simulation.dailyRequest}
          authenticate={simulation.authenticate} legalPolicy={simulation.policy} legalLinks={LEGAL_LINKS}
          onAuthenticated={() => move(SIMULATION_STEPS[2])} onState={move} onSignOut={signOut}
          backTarget={index > 0 ? SIMULATION_STEPS[index - 1] : null} />}
        </div>
        </div>
      </div>
    </div>
  </PageContainer>;
}

export default function OnboardingTest() {
  const language = internalLanguage(useLocation().state);
  const navigate = useNavigate();
  const [run, setRun] = useState({ id: 0, initialStep: SIMULATION_STEPS[0] });
  return <SimulationRun key={run.id} language={language} initialStep={run.initialStep}
    restart={(initialStep = SIMULATION_STEPS[0]) => setRun(value => ({ id: value.id + 1, initialStep }))}
    exit={() => navigate('/internal/test-tools', { replace: true, state: { language } })} />;
}

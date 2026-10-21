import { runHealthTiming } from './healthTiming';
import { LOCAL_HEALTH_IDS } from '../../base44/shared/healthExecutionScope.js';
import { probeIdentity, acceptBrowserEvidence } from '@/foundation/probes/browserEvidence';
import { ADMIN_TEST_HEALTH_CASES } from '@/foundation/health/cases/adminTestTools';
import React from "react";
import { createRoot } from "react-dom/client";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import HealthCenter from "@/pages/internal/HealthCenter";
import BuildEnvironment from "@/pages/internal/BuildEnvironment";
import OnboardingFixture from './OnboardingFixture';
import App from '@/App';
import { authFixture } from './fakeBase44';
import AdminPanel from '@/pages/internal/AdminPanel';
import { isAuthProbePath, waitForAuthProbe, measureAuthShell } from '@/foundation/probes/authProbeContract';
import { runFoundationTests } from "@/foundation/tests/foundationTests";
import { ONBOARDING_HEALTH_CASES } from '@/foundation/health/cases/onboarding';
import { H01_CASES } from "@/foundation/health/cases/h01";
import { H04_CASES } from "@/foundation/health/cases/h04";
import { H12_CASES } from "@/foundation/health/cases/h12";
import { H03_CASES } from "@/foundation/health/cases/h03";
import {NATIVE_HEALTH_CASES} from '@/foundation/health/cases/native';
import { H13_CASES } from '@/foundation/health/cases/h13';
import { createHealthContext } from "@/foundation/health/context";
import { HEALTH_CASES, IN_APP_HEALTH_CASES } from "@/foundation/health/catalog";
import { DAILY_HEALTH_CASES } from '@/foundation/health/cases/daily';
import { CALENDAR_HEALTH_CASES } from '@/foundation/health/cases/calendar';
import { SUITES } from "@/foundation/health/suites";
import { HEALTH_CATALOG_VERSION, APPLICABILITY as A } from "@/foundation/health/constants";
import "@/index.css";

// The harness mounts real pages without claiming that a synthetic admin is a live login.
const productionRoute=isAuthProbePath(window.location.pathname)||window.location.pathname==='/login'||new URLSearchParams(location.search).has('appFixture');
createRoot(document.getElementById("root")).render(productionRoute?<App/>:<BrowserRouter><Routes>
  <Route path="/internal" element={<AdminPanel/>}/>
  <Route path="/internal/health" element={<HealthCenter/>}/>
  <Route path="/internal/build" element={<BuildEnvironment/>}/>
  <Route path="/onboarding-fixture" element={<OnboardingFixture/>}/>
  <Route path="*" element={<div>Intentionally missing probe root</div>}/>
</Routes></BrowserRouter>);
window.__authFixture = authFixture;
window.__runFoundationTests = runFoundationTests;
window.__runHealthTiming = runHealthTiming;
window.__healthAuditRegistry = HEALTH_CASES.map(c=>({id:c.id,title:c.title,description:c.description,runnerType:c.runnerType,classification:c.classification,applicability:c.applicability,executionLocation:c.executionLocation,active:IN_APP_HEALTH_CASES.includes(c),hasRunner:typeof c.run==='function'}));
window.__authProbeTools = {waitForAuthProbe,measureAuthShell};
window.__foundationCatalog = {version:HEALTH_CATALOG_VERSION,suites:SUITES.length,cases:HEALTH_CASES.length,
  localRegression:HEALTH_CASES.filter(c=>LOCAL_HEALTH_IDS.has(c.id)).length,
  current:HEALTH_CASES.filter(c=>c.applicability===A.CURRENT&&!LOCAL_HEALTH_IDS.has(c.id)).length,
  future:HEALTH_CASES.filter(c=>c.applicability===A.FUTURE).length,
  external:HEALTH_CASES.filter(c=>c.applicability===A.EXTERNAL).length};
window.__staticHealthEvidence = async () => {
  const context = createHealthContext();
  return Promise.all([...NATIVE_HEALTH_CASES.filter(c=>c.runnerType==='RUNTIME'),...H01_CASES.filter(c=>c.id==="H01-006"),...H03_CASES.filter((c)=>["H03-001","H03-004","H03-006","H03-008","H03-009","H03-010"].includes(c.id)),...H04_CASES.filter(c=>c.applicability===A.CURRENT&&!LOCAL_HEALTH_IDS.has(c.id)),...H12_CASES.filter(c=>c.applicability===A.CURRENT&&!LOCAL_HEALTH_IDS.has(c.id)),...H13_CASES.filter(c=>c.applicability===A.CURRENT&&!LOCAL_HEALTH_IDS.has(c.id))].map(async(c)=>({id:c.id,...await c.run(context)})));
};

window.__onboardingHealthEvidence = async () => Promise.all(ONBOARDING_HEALTH_CASES.filter(c=>c.applicability===A.CURRENT&&!LOCAL_HEALTH_IDS.has(c.id)).map(async c=>({id:c.id,...await c.run({})})));
window.__dailyHealthEvidence = async () => {
  const out=[];
  // Only synthetic cases here. H09-004 needs hosted evidence and remains blocked.
  for(const c of DAILY_HEALTH_CASES.filter(c=>c.applicability===A.CURRENT&&!LOCAL_HEALTH_IDS.has(c.id)&&c.runnerType==='RUNTIME'))out.push({id:c.id,...await c.run({})});
  return out;
};
window.__calendarHealthEvidence = async () => {
  const out=[];
  for(const c of CALENDAR_HEALTH_CASES.filter(c=>c.applicability===A.CURRENT&&!LOCAL_HEALTH_IDS.has(c.id)&&c.runnerType==='RUNTIME'))out.push({id:c.id,...await c.run({})});
  return out;
};

window.__adminTestHealthEvidence = async () => { const out=[]; for (const c of ADMIN_TEST_HEALTH_CASES.filter(c=>c.applicability===A.CURRENT&&!LOCAL_HEALTH_IDS.has(c.id)&&c.runnerType==='RUNTIME')) out.push({id:c.id,...await c.run({})}); return out; };

window.__probeIdentity = probeIdentity;
window.__acceptBrowserEvidence = acceptBrowserEvidence;

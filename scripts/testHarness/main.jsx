import React from "react";
import { createRoot } from "react-dom/client";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import HealthCenter from "@/pages/internal/HealthCenter";
import BuildEnvironment from "@/pages/internal/BuildEnvironment";
import OnboardingFixture from './OnboardingFixture';
import App from '@/App';
import { isAuthProbePath, createAuthProbeFrame, waitForAuthProbe, measureAuthShell } from '@/foundation/probes/authProbeContract';
import { runFoundationTests } from "@/foundation/tests/foundationTests";
import { ONBOARDING_HEALTH_CASES } from '@/foundation/health/cases/onboarding';
import { H04_CASES } from "@/foundation/health/cases/h04";
import { H12_CASES } from "@/foundation/health/cases/h12";
import { H03_CASES } from "@/foundation/health/cases/h03";
import { H13_CASES } from '@/foundation/health/cases/h13';
import { createHealthContext } from "@/foundation/health/context";
import { HEALTH_CASES } from "@/foundation/health/catalog";
import { SUITES } from "@/foundation/health/suites";
import { HEALTH_CATALOG_VERSION, APPLICABILITY as A } from "@/foundation/health/constants";
import "@/index.css";

// The harness mounts real pages without claiming that a synthetic admin is a live login.
const productionRoute=isAuthProbePath(window.location.pathname)||window.location.pathname==='/login';
createRoot(document.getElementById("root")).render(productionRoute?<App/>:<BrowserRouter><Routes>
  <Route path="/internal/health" element={<HealthCenter/>}/>
  <Route path="/internal/build" element={<BuildEnvironment/>}/>
  <Route path="/onboarding-fixture" element={<OnboardingFixture/>}/>
  <Route path="*" element={<div>Intentionally missing probe root</div>}/>
</Routes></BrowserRouter>);
window.__runFoundationTests = runFoundationTests;
window.__authProbeTools = {createAuthProbeFrame,waitForAuthProbe,measureAuthShell};
window.__foundationCatalog = {version:HEALTH_CATALOG_VERSION,suites:SUITES.length,cases:HEALTH_CASES.length,
  current:HEALTH_CASES.filter(c=>c.applicability===A.CURRENT).length,
  future:HEALTH_CASES.filter(c=>c.applicability===A.FUTURE).length,
  external:HEALTH_CASES.filter(c=>c.applicability===A.EXTERNAL).length};
window.__staticHealthEvidence = async () => {
  const context = createHealthContext();
  return Promise.all([...H03_CASES.filter((c)=>["H03-001","H03-004","H03-008","H03-009"].includes(c.id)),...H04_CASES.filter(c=>c.applicability===A.CURRENT),...H12_CASES.filter(c=>c.applicability===A.CURRENT),...H13_CASES.filter(c=>c.applicability===A.CURRENT)].map(async(c)=>({id:c.id,...await c.run(context)})));
};

window.__onboardingHealthEvidence = async () => Promise.all(ONBOARDING_HEALTH_CASES.filter(c=>c.applicability===A.CURRENT).map(async c=>({id:c.id,...await c.run({})})));

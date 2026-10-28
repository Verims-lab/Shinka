import { checkPreferenceSheets } from './checkPreferenceSheets.mjs';
import { verifyDailyEntitySdk } from './verifyDailyEntitySdk.mjs';
import { verifyTestDeletionEntry } from './verifyTestDeletionEntry.mjs';
import { checkOnboardingClosure } from './checkOnboardingClosure.mjs';
import { checkOnboardingPresentation } from './checkOnboardingPresentation.mjs';
import { verifyNotifications } from './verifyNotifications.mjs';
import { checkMobileExperience } from "./checkMobileExperience.mjs";
import { checkStartupRoutes } from './checkStartupRoutes.mjs';
import { checkProductNavigation } from './checkProductNavigation.mjs';
import { checkHealthTiming } from './checkHealthTiming.mjs';
import { checkPrivacyFlow } from './checkPrivacyFlow.mjs';
import { checkAppTheme } from './checkAppTheme.mjs';
import { checkYouFlow } from './checkYouFlow.mjs';
import { checkPatternFlow } from './checkPatternFlow.mjs';
import { checkInAppHealth } from './verifyHealthFlow.mjs';
import { writeHealthAudit } from './auditHealthCatalog.mjs';
import { collectBrowserMeasurements } from './browserMeasurements.mjs';
import { verifyNativeEntries } from './verifyNativeEntries.mjs';
import { verifySecurity028 } from './verifySecurity028.mjs';
import { checkAdminTestTools } from './checkAdminTestTools.mjs';
import { checkAdminNavigation } from './checkAdminNavigation.mjs';
import { checkDailyFlow } from './checkDailyFlow.mjs';
import { checkCalendarFlow, checkCalendarContinuity } from './checkCalendarFlow.mjs';
import { verifyDependencyRules } from './verifyDependencyRules.mjs';
import { checkMobile } from './checkMobile.mjs';
// One canonical test set, executed in a real browser for the existing DOM probes.
// No Base44 credentials, platform calls, or live enforcement claims.
import { build } from "vite";
import react from "@vitejs/plugin-react";
import tailwindcss from "@tailwindcss/vite";
import { chromium, webkit } from "playwright";
import { createServer } from "node:http";
import { mkdtemp, readFile, rm } from "node:fs/promises";
import { tmpdir } from "node:os";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { staticEvidencePlugin } from "./staticEvidence.mjs";
import { captureFoundationVisuals } from "./captureFoundationVisuals.mjs";
import { verifyGeoNamesEntry, verifyGeoNamesRuntimeProbeEntry } from "./verifyGeoNamesEntry.mjs";

const root=path.resolve(path.dirname(fileURLToPath(import.meta.url)),"..");
const output=await mkdtemp(path.join(tmpdir(),"shinka-foundation-tests-"));
const browserName = process.env.FOUNDATION_BROWSER || 'chromium';
const engine = { chromium, webkit }[browserName];
if (!engine) throw new Error('FOUNDATION_BROWSER must be chromium or webkit');
let server,browser;
try {
  verifyDependencyRules();
  console.log(JSON.stringify(await verifyDailyEntitySdk()));
  const notifications030 = await verifyNotifications(root);
  const nativeEntries = await verifyNativeEntries(root);
  nativeEntries.deletion=await verifyTestDeletionEntry(root);
  const geoNamesEntry=await verifyGeoNamesEntry(root);
  const geoNamesRuntimeProbeEntry=await verifyGeoNamesRuntimeProbeEntry(root);
  const security028=await verifySecurity028();if(!security028.passed)throw new Error(`SECURITY_028_FAILED ${JSON.stringify(security028.results.filter(r=>r.status!=='PASS'))}`);
  await build({root,configFile:false,plugins:[staticEvidencePlugin(root),tailwindcss(),react()],logLevel:"warn",
    resolve:{alias:[{find:"@/lib/AuthContext",replacement:path.join(root,"scripts/testHarness/ObservedAuth.jsx")},{find:"@/api/base44Client",replacement:path.join(root,"scripts/testHarness/fakeBase44.js")},{find:"@",replacement:path.join(root,"src")}]},
    build:{outDir:output,emptyOutDir:true,rollupOptions:{input:path.join(root,"scripts/testHarness/index.html")}}});
  const html=await readFile(path.join(output,"scripts/testHarness/index.html"));
  server=createServer(async(req,res)=>{
    try {
      const pathname=new URL(req.url,"http://localhost").pathname;
      if(!pathname.startsWith("/assets/")){res.setHeader("Content-Type","text/html");res.setHeader("X-Frame-Options","DENY");res.end(html);return;}
      const file=path.resolve(output,`.${pathname}`);
      if(!file.startsWith(`${output}${path.sep}`)){res.writeHead(403).end();return;}
      res.setHeader("Content-Type",file.endsWith(".js")?"application/javascript":file.endsWith(".css")?"text/css":"application/octet-stream");
      res.end(await readFile(file));
    } catch {res.writeHead(404).end();}
  });
  await new Promise((resolve,reject)=>{server.once("error",reject);server.listen(0,"127.0.0.1",resolve);});
  const origin=`http://127.0.0.1:${server.address().port}`;
  // Preserve normal Chromium background/frame scheduling, which Playwright otherwise disables.
  browser=await engine.launch({headless:true,ignoreDefaultArgs:['--disable-background-timer-throttling','--disable-backgrounding-occluded-windows','--disable-renderer-backgrounding']});
  const page=await browser.newPage({viewport:{width:1280,height:900}});
  await page.emulateMedia({colorScheme:"dark"}); // Verify unresolved light default despite a dark OS preference; explicit saved-theme matrix is separate.
  await page.route("**/*",route=>new URL(route.request().url()).origin===origin?route.continue():route.abort());
  const pageErrors=[];page.on("pageerror",error=>pageErrors.push(error.message));
  await page.goto(`${origin}/internal/health`);
  await page.waitForFunction(()=>!!window.__probeIdentity);
  const identity = await page.evaluate(()=>window.__probeIdentity());
  const probeBundle = await collectBrowserMeasurements(browser, origin, identity, browserName);
  await page.addInitScript(bundle=>sessionStorage.setItem('shinka.browser-evidence.v1',JSON.stringify(bundle)),probeBundle);
  await page.evaluate(bundle=>window.__acceptBrowserEvidence(bundle),probeBundle);
  if (process.env.FOUNDATION_CALENDAR_CONTINUITY_ONLY === '1') {
    const calendarContinuity=await checkCalendarContinuity(page,origin);
    console.log(JSON.stringify({calendarContinuity,pageErrors},null,2));
  } else if (process.env.FOUNDATION_PREFERENCES_ONLY === '1') {
    const preferenceSheets=await checkPreferenceSheets(browser,origin,process.env.FOUNDATION_PREFERENCES_DIR);
    console.log(JSON.stringify({preferenceSheets,pageErrors},null,2));
  } else if (process.env.FOUNDATION_NAVIGATION_ONLY === '1') {
    const productNavigation=await checkProductNavigation(page,origin);
    console.log(JSON.stringify({productNavigation,pageErrors},null,2));
    if(pageErrors.length)process.exitCode=1;
  } else if (process.env.FOUNDATION_MOBILE_EXPERIENCE_ONLY === '1') {
    const mobileExperience=await checkMobileExperience(browser,origin,process.env.FOUNDATION_MOBILE_DIR);
    console.log(JSON.stringify({mobileExperience,pageErrors},null,2));
    if(mobileExperience.some(r=>!r.passed)||pageErrors.length)process.exitCode=1;
  } else if (process.env.FOUNDATION_TIMING_ONLY === '1') {
    const timing = await checkHealthTiming(browser, origin);
    console.log(JSON.stringify({scope:'LOCAL_SYNTHETIC_TIMER_FAULT_INJECTION',timing},null,2));
  } else if (process.env.FOUNDATION_ONBOARDING_PRESENTATION_ONLY === '1') {
    const onboardingPresentation=await checkOnboardingPresentation(browser,origin,process.env.FOUNDATION_ONBOARDING_PRESENTATION_DIR);
    console.log(JSON.stringify({onboardingPresentation,pageErrors},null,2));
  } else if (process.env.FOUNDATION_ONBOARDING_ONLY === '1') {
    const onboardingClosure=await checkOnboardingClosure(browser,origin,process.env.FOUNDATION_ONBOARDING_DIR);
    console.log(JSON.stringify({onboardingClosure,pageErrors},null,2));
  } else if (process.env.FOUNDATION_HEALTH_ONLY === '1') {
    console.log(JSON.stringify({diagnosticOnly:true,inAppHealth:await checkInAppHealth(page,origin),pageErrors},null,2));
    if(pageErrors.length)process.exitCode=1;
  } else if (process.env.FOUNDATION_STARTUP_ONLY === '1') {
    console.log(JSON.stringify({diagnosticOnly:true,startupRoutes:await checkStartupRoutes(page,origin),pageErrors},null,2));
    if(pageErrors.length)process.exitCode=1;
  } else if (process.env.FOUNDATION_MOBILE_ONLY === '1') {
    const mobile=await checkMobile(browser,origin,process.env.FOUNDATION_MOBILE_DIR);
    console.log(JSON.stringify({diagnosticOnly:true,mobile,pageErrors},null,2));
    if(mobile.some(row=>!row.passed)||pageErrors.length)process.exitCode=1;
  } else if (process.env.FOUNDATION_PRIVACY_ONLY === '1') {
    const privacyFlow = await checkPrivacyFlow(page, origin, process.env.FOUNDATION_PRIVACY_DIR);
    console.log(JSON.stringify({diagnosticOnly:true,privacyFlow,pageErrors},null,2));
    if(pageErrors.length)process.exitCode=1;
  } else if (process.env.FOUNDATION_THEME_ONLY === '1') {
    const appTheme=await checkAppTheme(browser,origin);
    console.log(JSON.stringify({appTheme,pageErrors},null,2));
    if(appTheme.some(r=>!r.passed)||pageErrors.length)process.exitCode=1;
  } else if (process.env.FOUNDATION_YOU_ONLY === '1') {
    const appTheme = await checkAppTheme(browser,origin);
  const youFlow = await checkYouFlow(page, origin, process.env.FOUNDATION_YOU_DIR);
    console.log(JSON.stringify({diagnosticOnly:true,youFlow,pageErrors},null,2));
    if(pageErrors.length)process.exitCode=1;
  } else if (process.env.FOUNDATION_PATTERN_ONLY === '1') {
    const patternFlow = await checkPatternFlow(page, origin, process.env.FOUNDATION_PATTERN_DIR);
    console.log(JSON.stringify({diagnosticOnly:true,patternFlow,pageErrors},null,2));
    if(pageErrors.length)process.exitCode=1;
  } else if (process.env.FOUNDATION_ADMIN_ONLY === '1') {
    const adminNavigation = await checkAdminNavigation(page, origin, process.env.FOUNDATION_ADMIN_DIR);
    console.log(JSON.stringify({ diagnosticOnly: true, adminNavigation, pageErrors }, null, 2));
    if (pageErrors.length) process.exitCode = 1;
  } else {
  if(process.env.FOUNDATION_VISUAL_DIR){await captureFoundationVisuals(page,origin,path.resolve(process.env.FOUNDATION_VISUAL_DIR));await page.setViewportSize({width:1280,height:900});}
  await page.goto(`${origin}/internal/health`);
  await page.waitForSelector("[data-health-root]");
  const results=await page.evaluate(ids=>window.__runFoundationTests({ids}),process.env.FOUNDATION_TEST_IDS?.split(','));
  for(const result of results) console.log(`${result.passed?"PASS":"FAIL"} ${result.id} ${result.name}${result.passed?"":` — ${result.detail}`}`);
  if (process.env.FOUNDATION_TEST_IDS) {
    console.log(JSON.stringify({focused:true,security028,notifications030,results,pageErrors},null,2));
    if(results.some(r=>!r.passed)||!results.length||pageErrors.length)process.exitCode=1;
  } else {
  const onboardingClosure=await checkOnboardingClosure(browser,origin,process.env.FOUNDATION_ONBOARDING_DIR);
  const onboardingPresentation=await checkOnboardingPresentation(browser,origin,process.env.FOUNDATION_ONBOARDING_PRESENTATION_DIR);
  const health=await page.evaluate(()=>window.__staticHealthEvidence());
  const onboardingHealth=await page.evaluate(()=>window.__onboardingHealthEvidence());
  const dailyHealth=await page.evaluate(()=>window.__dailyHealthEvidence());
  const calendarHealth=await page.evaluate(()=>window.__calendarHealthEvidence());
  const adminTestHealth=await page.evaluate(()=>window.__adminTestHealthEvidence());
  const catalog=await page.evaluate(()=>window.__foundationCatalog);
  // Exercise the real App -> AuthProvider -> Onboarding route with only SDK transport substituted.
  const productionRouting=[];
  for(const session of ['anonymous','admin']) {
    await page.goto(`${origin}/login?probe=1&sdkSession=${session}`);
    const expected=session==='admin'?'AUTHENTICATED_PROFILE_REQUIRED':'UNAUTHENTICATED_SIGN_IN';
    await page.waitForSelector(`[data-onboarding-state="${expected}"]`);
    const state=await page.locator('[data-onboarding-state]').getAttribute('data-onboarding-state');
    productionRouting.push({session,state,passed:state===expected&&await page.locator('[data-auth-probe]').count()===0});
  }
  const fromAdmin=await page.evaluate(()=>window.__authProbeTools.measureAuthShell(360));
  productionRouting.push({session:'admin-session-preserved-with-external-evidence',probe:fromAdmin,passed:fromAdmin.state==='READY'&&await page.locator('[data-onboarding-state]').getAttribute('data-onboarding-state')==='AUTHENTICATED_PROFILE_REQUIRED'});
  for(const session of ['anonymous','admin']){
    await page.goto(`${origin}/auth-shell-probe?sdkSession=${session}`);
    await page.waitForSelector('[data-auth-probe][data-probe-status="READY"]');
    productionRouting.push({session:`${session}-top-level-probe`,passed:await page.locator('[data-onboarding-state]').getAttribute('data-onboarding-state')==='UNAUTHENTICATED_SIGN_IN'});
  }
  const previewProbes = probeBundle.measurements.map(probe=>({probe,passed:['READY','MEASURED'].includes(probe.state)}));
  const startupRoutes = await checkStartupRoutes(page, origin);
  const productNavigation = await checkProductNavigation(page, origin);
  const adminNavigation = await checkAdminNavigation(page, origin, process.env.FOUNDATION_ADMIN_DIR);
  const mobileExperience = await checkMobileExperience(browser,origin,process.env.FOUNDATION_MOBILE_DIR);
  const mobile = await checkMobile(browser, origin, process.env.FOUNDATION_MOBILE_DIR);
  const dailyFlow = await checkDailyFlow(page, origin, process.env.FOUNDATION_DAILY_DIR);
  const patternFlow = await checkPatternFlow(page, origin, process.env.FOUNDATION_PATTERN_DIR);
  const appTheme = await checkAppTheme(browser,origin);
  const youFlow = await checkYouFlow(page, origin, process.env.FOUNDATION_YOU_DIR);
  const preferenceSheets = await checkPreferenceSheets(browser,origin,process.env.FOUNDATION_PREFERENCES_DIR);
  const privacyFlow = await checkPrivacyFlow(page, origin, process.env.FOUNDATION_PRIVACY_DIR);
  const calendarFlow = await checkCalendarFlow(page, origin, process.env.FOUNDATION_CALENDAR_DIR);
  const calendarContinuity = await checkCalendarContinuity(page,origin);
  const adminTestFlow = await checkAdminTestTools(page, origin, process.env.FOUNDATION_TEST_TOOLS_DIR);
  const inAppHealth=await checkInAppHealth(page,origin);
  const healthTiming=await checkHealthTiming(browser,origin);
  if(process.env.FOUNDATION_AUDIT_DIR) {
    const audit=await page.evaluate(()=>({registry:window.__healthAuditRegistry,report:window.__savedHealthReport}));
    await writeHealthAudit(root,process.env.FOUNDATION_AUDIT_DIR,audit.registry,audit.report,results);
  }
  console.log(JSON.stringify({calendarContinuity,preferenceSheets,appTheme,onboardingPresentation,onboardingClosure,startupRoutes,productNavigation,healthTiming,privacyFlow,youFlow,inAppHealth,adminNavigation,mobileExperience,mobile,dailyFlow,patternFlow,calendarFlow,adminTestFlow,evidenceScope:"LOCAL_BROWSER_SYNTHETIC_AND_BUILD_TIME_STATIC",browser:{engine:browserName,version:browser.version(),physicalDevice:false},catalog,nativeEntries,security028,notifications030,tests:results.length,passed:results.filter(r=>r.passed).length,failed:results.filter(r=>!r.passed).length,geoNamesEntry,geoNamesRuntimeProbeEntry,authProbe:results.find(r=>r.id==='T74')?.evidence,productionRouting,previewProbes,health,onboardingHealth,dailyHealth,calendarHealth,adminTestHealth,pageErrors},null,2));
  if(appTheme.some(r=>!r.passed)||mobileExperience.some(r=>!r.passed)||mobile.some(r=>!r.passed)||results.length===0||results.some(r=>!r.passed)||productionRouting.some(r=>!r.passed)||previewProbes.some(r=>!r.passed)||health.some(c=>c.status!=="PASS")||onboardingHealth.some(c=>c.status!=="PASS")||dailyHealth.some(c=>c.status!=="PASS")||calendarHealth.some(c=>c.status!=="PASS")||adminTestHealth.some(c=>c.status!=="PASS")||pageErrors.length) process.exitCode=1;
  }
  }
} catch(error){console.error(error);process.exitCode=1;}
finally {await browser?.close();if(server) await new Promise(resolve=>server.close(resolve));await rm(output,{recursive:true,force:true});}

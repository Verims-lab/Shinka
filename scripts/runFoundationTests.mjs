// One canonical test set, executed in a real browser for the existing DOM probes.
// No Base44 credentials, platform calls, or live enforcement claims.
import { build } from "vite";
import react from "@vitejs/plugin-react";
import tailwindcss from "@tailwindcss/vite";
import { chromium } from "playwright";
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
let server,browser;
try {
  const geoNamesEntry=await verifyGeoNamesEntry(root);
  const geoNamesRuntimeProbeEntry=await verifyGeoNamesRuntimeProbeEntry(root);
  await build({root,configFile:false,plugins:[staticEvidencePlugin(root),tailwindcss(),react()],logLevel:"warn",
    resolve:{alias:[{find:"@/api/base44Client",replacement:path.join(root,"scripts/testHarness/fakeBase44.js")},{find:"@",replacement:path.join(root,"src")}]},
    build:{outDir:output,emptyOutDir:true,rollupOptions:{input:path.join(root,"scripts/testHarness/index.html")}}});
  const html=await readFile(path.join(output,"scripts/testHarness/index.html"));
  server=createServer(async(req,res)=>{
    try {
      const pathname=new URL(req.url,"http://localhost").pathname;
      if(pathname==='/preview-frame-fixture'){
        res.setHeader('Content-Type','text/html');
        res.end(`<iframe title="Cross-site Preview fixture" style="width:1200px;height:850px" src="http://127.0.0.1:${server.address().port}/internal/health"></iframe>`);return;
      }
      if(!pathname.startsWith("/assets/")){res.setHeader("Content-Type","text/html");res.end(html);return;}
      const file=path.resolve(output,`.${pathname}`);
      if(!file.startsWith(`${output}${path.sep}`)){res.writeHead(403).end();return;}
      res.setHeader("Content-Type",file.endsWith(".js")?"application/javascript":file.endsWith(".css")?"text/css":"application/octet-stream");
      res.end(await readFile(file));
    } catch {res.writeHead(404).end();}
  });
  await new Promise((resolve,reject)=>{server.once("error",reject);server.listen(0,"127.0.0.1",resolve);});
  const origin=`http://127.0.0.1:${server.address().port}`;
  const previewOrigin=`http://localhost:${server.address().port}`;
  // Preserve normal Chromium background/frame scheduling, which Playwright otherwise disables.
  browser=await chromium.launch({headless:true,ignoreDefaultArgs:['--disable-background-timer-throttling','--disable-backgrounding-occluded-windows','--disable-renderer-backgrounding']});
  const page=await browser.newPage({viewport:{width:1280,height:900}});
  await page.emulateMedia({colorScheme:"dark"}); // Product stays light even when the OS prefers dark.
  await page.route("**/*",route=>[origin,previewOrigin].includes(new URL(route.request().url()).origin)?route.continue():route.abort());
  const pageErrors=[];page.on("pageerror",error=>pageErrors.push(error.message));
  if(process.env.FOUNDATION_VISUAL_DIR){await captureFoundationVisuals(page,origin,path.resolve(process.env.FOUNDATION_VISUAL_DIR));await page.setViewportSize({width:1280,height:900});}
  await page.goto(`${origin}/internal/health`);
  await page.waitForSelector("[data-health-root]");
  const results=await page.evaluate(()=>window.__runFoundationTests());
  for(const result of results) console.log(`${result.passed?"PASS":"FAIL"} ${result.id} ${result.name}${result.passed?"":` — ${result.detail}`}`);
  const health=await page.evaluate(()=>window.__staticHealthEvidence());
  const onboardingHealth=await page.evaluate(()=>window.__onboardingHealthEvidence());
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
  productionRouting.push({session:'admin-outside-iframe',probe:fromAdmin,passed:fromAdmin.state==='READY'&&await page.locator('[data-onboarding-state]').getAttribute('data-onboarding-state')==='AUTHENTICATED_PROFILE_REQUIRED'});
  for(const session of ['anonymous','admin']){
    await page.goto(`${origin}/auth-shell-probe?sdkSession=${session}`);
    await page.waitForSelector('[data-auth-probe][data-probe-status="READY"]');
    productionRouting.push({session:`${session}-top-level-probe`,passed:await page.locator('[data-onboarding-state]').getAttribute('data-onboarding-state')==='UNAUTHENTICATED_SIGN_IN'});
  }
  // Preview embeds the application cross-site; Health then creates a hidden same-origin child.
  await page.goto(`${previewOrigin}/preview-frame-fixture`);
  const app=page.frames().find(frame=>frame.url().startsWith(`${origin}/internal/health`));
  await app.waitForFunction(()=>!!window.__authProbeTools);
  const previewProbes=await app.evaluate(async()=>{
    const {measureAuthShell,createAuthProbeFrame,waitForAuthProbe}=window.__authProbeTools,results=[];
    for(const width of [360,1024]){const probe=await measureAuthShell(width);results.push({scenario:`nested-hidden-${width}`,probe,passed:probe.state==='READY'&&probe.frameState.visibility==='hidden'});}
    const late=createAuthProbeFrame(360);
    try {
      const deadline=performance.now()+15000;
      while(performance.now()<deadline&&late.read().ready!=='READY')await new Promise(r=>setTimeout(r,50));
      const before=late.read(),probe=await waitForAuthProbe(late.read);
      results.push({scenario:'nested-late-parent',readinessBeforeObservation:before.ready,probe,passed:before.ready==='READY'&&probe.state==='READY'});
    }finally{late.dispose();}
    return results;
  });
  console.log(JSON.stringify({evidenceScope:"LOCAL_BROWSER_SYNTHETIC_AND_BUILD_TIME_STATIC",catalog,tests:results.length,passed:results.filter(r=>r.passed).length,failed:results.filter(r=>!r.passed).length,geoNamesEntry,geoNamesRuntimeProbeEntry,authProbe:results.find(r=>r.id==='T74')?.evidence,productionRouting,previewProbes,health,onboardingHealth,pageErrors},null,2));
  if(results.length===0||results.some(r=>!r.passed)||productionRouting.some(r=>!r.passed)||previewProbes.some(r=>!r.passed)||health.some(c=>c.status!=="PASS")||onboardingHealth.some(c=>c.status!=="PASS")||pageErrors.length) process.exitCode=1;
} catch(error){console.error(error);process.exitCode=1;}
finally {await browser?.close();if(server) await new Promise(resolve=>server.close(resolve));await rm(output,{recursive:true,force:true});}

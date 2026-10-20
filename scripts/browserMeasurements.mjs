import { inspectAuthShell } from '../src/foundation/probes/inspectAuthShell.js';
// Reused by local regression and explicit operator-requested hosted measurement.
// A separate page with real viewport preserves the calling Health/admin session.
export async function collectBrowserMeasurements(browser, origin, identity, engine, context = null) {
  const measurements = [];
  for (const [kind,path,width] of [['layout','/internal/health',360],['layout','/internal/build',360],['auth','/auth-shell-probe',360],['auth','/auth-shell-probe',1024]]) {
    const page = context ? await context.newPage() : await browser.newPage();
    const start = Date.now();
    try {
      await page.setViewportSize({width,height:800});
      if (!context) await page.route('**/*',route=>new URL(route.request().url()).origin===origin?route.continue():route.abort());
      await page.goto(origin+path, {timeout:15000});
      await page.waitForSelector(kind==='auth'?'[data-auth-probe][data-probe-status="READY"]':'[data-probe-root]',{timeout:15000});
      const envelope = await page.evaluate(()=>({width:innerWidth,viewport:{width:innerWidth,height:innerHeight},topLevel:window===window.top,landedPath:location.pathname}));
      if(kind==='auth') {
        const inspected = await page.locator('[data-auth-probe]').evaluate(inspectAuthShell);
        measurements.push({kind,path,...envelope,state:inspected.rendered?'READY':'ERROR',route:path,screen:inspected.screen,geometry:inspected.geometry,elapsedMs:Date.now()-start});
      } else {
        const scrollWidth = await page.evaluate(()=>Math.max(document.documentElement.scrollWidth,document.body.scrollWidth));
        measurements.push({kind,path,...envelope,state:'MEASURED',scrollWidth,overflow:scrollWidth>width+1,ms:Date.now()-start});
      }
    } catch {
      measurements.push({kind,path,width,state:'BLOCKED',code:'BROWSER_PROBE_TIMEOUT',elapsedMs:Date.now()-start});
    } finally { await page.close(); } // Navigation, timers and listeners die with this isolated page.
  }
  return {...identity,engine,browserVersion:browser.version(),measuredAt:new Date().toISOString(),measurements};
}

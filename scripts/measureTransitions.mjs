// Production assets + real SDK, synthetic HTTP responses only. No hosted traffic.
// Same deterministic latency/CPU profile before/after; this is not field INP.
import { build, createServer as createViteServer } from 'vite';
import { chromium } from 'playwright';
import { createServer } from 'node:http';
import { readFile, writeFile, mkdir } from 'node:fs/promises';
import path from 'node:path';
import { execFileSync } from 'node:child_process';
import { createHash } from 'node:crypto';
import { staticEvidencePlugin } from './staticEvidence.mjs';
import { BACKGROUND_ASSETS } from '../src/foundation/sectionBackgrounds.js';

const root = path.resolve(process.env.MEASUREMENT_SOURCE || process.cwd()), directory = path.resolve(process.argv[2] || '/tmp/shinka-transitions');
if (directory === root || directory.startsWith(root + path.sep)) throw new Error('Output must be outside checkout');
// A fixture SSR server otherwise sets NODE_ENV=development before build().
// Set it first, so emitted React/JSX and application code are production too.
process.env.NODE_ENV = 'production';
process.env.VITE_BASE44_APP_ID = 'shinka-local-performance';
await mkdir(directory, { recursive: true });
const loader = await createViteServer({ configFile: false, root, plugins: [staticEvidencePlugin(root)], resolve: { alias: { '@': path.join(root, 'src') } }, server: { middlewareMode: true }, appType: 'custom' });
let fixtures;
try { fixtures = await (await loader.ssrLoadModule('/scripts/testHarness/transitionFixtures.js')).transitionFixtures(); }
finally { await loader.close(); }
await build({ root, logLevel: 'warn', build: { outDir: path.join(directory, 'production'), emptyOutDir: true } });
const server = createServer(async (req, res) => {
  try {
    const pathname = new URL(req.url, 'http://localhost').pathname;
    const file = pathname.startsWith('/assets/') ? path.join(directory, 'production', pathname) : path.join(directory, 'production/index.html');
    const body = await readFile(file);
    res.setHeader('Content-Type', file.endsWith('.js') ? 'application/javascript' : file.endsWith('.css') ? 'text/css' : 'text/html');
    res.end(body);
  } catch { res.writeHead(404).end(); }
});
await new Promise(resolve => server.listen(0, '127.0.0.1', resolve));
const origin = `http://127.0.0.1:${server.address().port}`;
const sleep = ms => new Promise(resolve => setTimeout(resolve, ms));
const watercolor=process.env.SHINKA_LAB_WATERCOLOR?await readFile(process.env.SHINKA_LAB_WATERCOLOR):null;
const profile = { apiLatencyMs: 200, assetLatencyMs: 40, cpuSlowdown: 4, viewport: { width: 390, height: 844 }, samples: 5, bandwidthLimit: null, externalFonts: 'BLOCKED_IN_BOTH_RUNS', background:watercolor?{bytes:watercolor.length,sha256:createHash('sha256').update(watercolor).digest('hex'),source:'PINNED_EXISTING_PUBLIC_CDN_ASSET'}:'EXCLUDED_NOT_ASSET_COMPLETE' };
const ready = { home: '[data-daily-id]', calendar: '#calendar-start-date', pattern: '[data-lunar-timeline]', you: '[data-you-consent]' };
const routeOf = screen => screen === 'home' ? '/' : `/${screen}`;
const rows = [], openings=[], errors = [], blocked = new Set(), excludedAssets=new Set();
const browser = await chromium.launch({ headless: true });
try {
  for (let sample = 0; sample < profile.samples; sample++) {
    const context = await browser.newContext({ viewport: profile.viewport });
    const page = await context.newPage(), calls = [];
    page.on('pageerror', e => errors.push(e.message));
    const cdp = await context.newCDPSession(page);
    await cdp.send('Emulation.setCPUThrottlingRate', { rate: profile.cpuSlowdown });
    await page.route('**/*', async route => {
      const request = route.request(), url = new URL(request.url());
      const name = url.pathname.match(/\/functions\/([^/]+)$/)?.[1];
      if (name || url.pathname.includes('/public-settings/')) {
        const action = name ? request.postDataJSON()?.action : null;
        const key = action ? `${name}.${action}` : name || 'publicSettings';
        const value = key === 'publicSettings' ? {} : fixtures[key];
        if (!value) { blocked.add(key); await route.fulfill({ status: 400, json: { error_code: 'LAB_UNEXPECTED_ACTION' } }); return; }
        const start = await page.evaluate(() => performance.now());
        const call={key,start,end:null,bytes:Buffer.byteLength(JSON.stringify(value))};calls.push(call);
        await sleep(profile.apiLatencyMs);
        await route.fulfill({ json: value });
        call.end=await page.evaluate(() => performance.now());
      } else if (url.origin === origin) { if (url.pathname.startsWith('/assets/')) await sleep(profile.assetLatencyMs); await route.continue(); }
      else if(Object.values(BACKGROUND_ASSETS).includes(url.href)) {
        if(watercolor&&url.href===BACKGROUND_ASSETS.watercolor){await sleep(profile.assetLatencyMs);await route.fulfill({contentType:'image/jpeg',body:watercolor});}
        else {excludedAssets.add(url.href);await route.abort();}
      }
      else { blocked.add(url.origin); await route.abort(); }
    });
    await page.addInitScript(() => {
      window.__tasks = [];
      window.__vitals={lcp:null,cls:0,eventMax:null};window.__feedback=null;
      new PerformanceObserver(list=>{window.__vitals.lcp=list.getEntries().at(-1).startTime;}).observe({type:'largest-contentful-paint',buffered:true});
      new PerformanceObserver(list=>{for(const e of list.getEntries())if(!e.hadRecentInput)window.__vitals.cls+=e.value;}).observe({type:'layout-shift',buffered:true});
      new PerformanceObserver(list=>{for(const e of list.getEntries())if(e.interactionId)window.__vitals.eventMax=Math.max(window.__vitals.eventMax||0,e.duration);}).observe({type:'event',buffered:true,durationThreshold:16});
      const feedback=()=>{if(document.querySelector('[role="status"], [data-home-root]'))window.__feedback=performance.now();else requestAnimationFrame(feedback);};requestAnimationFrame(feedback);
      new PerformanceObserver(list => window.__tasks.push(...list.getEntries().map(e => ({ start: e.startTime, duration: e.duration })))).observe({ type: 'longtask', buffered: true });
    });
    await page.goto(origin + '/?lang=tr');
    await page.locator(ready.home).waitFor();
    openings.push({sample:sample+1,...await page.evaluate(()=>({feedbackMs:window.__feedback,contentReadyMs:performance.now(),dailyId:document.querySelector('[data-daily-id]').getAttribute('data-daily-id'),lcpMs:window.__vitals.lcp,cls:window.__vitals.cls})),scope:'COLD_CONTEXT_LOCAL_SYNTHETIC_HTTP'});
    const visited = new Set(['home']);
    let from = 'home';
    for (const to of ['calendar', 'pattern', 'you', 'home', 'pattern', 'calendar', 'home', 'you', 'calendar', 'you', 'pattern', 'home']) {
      await page.evaluate(({ to, ready }) => {
        const result = window.__transition = { to, start: null, feedback: null, visible: null, usable: null };
        document.addEventListener('click', () => {
          result.start = performance.now();
          const tick = () => {
            const elapsed = performance.now() - result.start;
            const candidate = document.querySelector(`[data-${to}-root]`);
            const target = candidate?.getClientRects().length ? candidate : null;
            if (result.feedback === null && (target || document.querySelector('[aria-busy="true"], [role="status"]'))) result.feedback = elapsed;
            if (result.visible === null && target) result.visible = elapsed;
            if (target && document.querySelector(ready)?.getClientRects().length) { requestAnimationFrame(() => { result.usable = performance.now() - result.start; }); return; }
            requestAnimationFrame(tick);
          };
          requestAnimationFrame(tick);
        }, { once: true, capture: true });
      }, { to, ready: ready[to] });
      const selector = to === 'you' ? 'a[data-profile-trigger]:visible' : `nav a:visible[href^="${routeOf(to)}?lang="]`;
      await page.locator(selector).first().click();
      await page.waitForFunction(() => window.__transition.usable !== null);
      // A retained card may paint before fresh IO completes. Record both and
      // never label the first visible old value a confirmed fresh response.
      const drainDeadline=Date.now()+30000;
      while(calls.some(call=>call.end===null)){if(Date.now()>drainDeadline)throw new Error('LAB_TRANSPORT_DID_NOT_SETTLE');await sleep(10);}
      await page.evaluate(()=>new Promise(resolve=>requestAnimationFrame(()=>requestAnimationFrame(resolve))));
      const measured = await page.evaluate(() => {
        const t = window.__transition, end = t.start + t.usable;
        const resources = performance.getEntriesByType('resource').filter(r => r.startTime >= t.start && r.startTime <= end && r.name.includes('/assets/'));
        return { ...t, freshSettledMs:performance.now()-t.start, labVitals:{...window.__vitals,inpScope:"Observed EventTiming maximum in this small lab interaction set; not field INP"}, jsBytes: resources.filter(r => r.name.endsWith('.js')).reduce((sum, r) => sum + r.decodedBodySize, 0), longTasks: window.__tasks.filter(task => task.start >= t.start && task.start < end) };
      });
      rows.push({ sample: sample + 1, from, to, visit: visited.has(to) ? 'revisit' : 'first', ...measured, calls: calls.filter(c => c.start >= measured.start && c.start < measured.start + measured.usable) });
      visited.add(to); from = to;
    }
    // Kept tabs may paint a retained value before their fresh read finishes.
    // Drain routed work before closing; do not discard callback failures.
    await page.unrouteAll({behavior:'wait'});
    await context.close();
  }
} finally { await browser.close(); await new Promise(resolve => server.close(resolve)); }
const result = { scope: 'LOCAL_PRODUCTION_BUILD_REAL_SDK_SYNTHETIC_HTTP_NO_HOSTED_NO_FIELD_INP', nodeEnv: process.env.NODE_ENV, commit: process.env.MEASUREMENT_REVISION || execFileSync('git', ['rev-parse', 'HEAD'], { encoding: 'utf8' }).trim(), browser: 'Chromium', profile, openings, rows, errors, blocked: [...blocked], excludedAssets:[...excludedAssets] };
await writeFile(path.join(directory, 'transitions.json'), JSON.stringify(result, null, 2) + '\n');
console.log(JSON.stringify({ output: path.join(directory, 'transitions.json'), transitions: rows.length, errors, blocked: [...blocked] }));
if (errors.length || [...blocked].some(value => value !== 'https://fonts.googleapis.com')) process.exitCode = 1;

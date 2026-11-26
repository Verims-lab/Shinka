import assert from 'node:assert/strict';
import { mkdir, readFile, writeFile } from 'node:fs/promises';
import path from 'node:path';
import { FIRST_CONTENT_SOURCE } from '../base44/shared/firstContentSource.js';
import { loadAppBackdrop, readBackdrop } from './checkAppBackdrop.mjs';
import { doubleText } from './mobileSurfaceMeasurements.mjs';

// Real App with isolated SDK, immutable bilingual source text and a fixed name.
// Baseline capture is explicitly unasserted visual evidence, never a test PASS.
export async function checkHomePresentation(browser, origin, directory, baseline = false, comparison = undefined) {
  if (directory) await mkdir(directory, { recursive: true });
  const before = comparison ? JSON.parse(await readFile(comparison, 'utf8')) : [];
  const pair = FIRST_CONTENT_SOURCE.pairs[0], results = [];
  const fixture = { state: 'ACTIVE_EXISTING_USER', persisted: true, profile: { display_name: 'Ayd' }, timezone: 'Europe/Istanbul',
    daily: { id: 'home-ui-fixture', shinka_date: '2026-11-26', message_pair_id: pair[0], message_tr_snapshot: pair[2], suggestion_tr_snapshot: pair[3], message_en_snapshot: pair[4], suggestion_en_snapshot: pair[5] } };
  for (const [width,height] of [[320,568],[360,740],[390,844],[430,932],[768,1024],[1280,900]]) {
    for (const language of ['tr','en']) for (const theme of ['light','dark']) for (const scale of [1,2]) {
      const context = await browser.newContext({ viewport: { width,height }, locale: language, reducedMotion: 'reduce' });
      const page = await context.newPage(), errors = [];
      page.on('pageerror', error => errors.push(error.message));
      await page.route('**/*', route => new URL(route.request().url()).origin === origin ? route.continue() : route.abort());
      await page.addInitScript(value => { window.__dailyFixture = value; }, fixture);
      const key = [width,language,theme,scale].join('-');
      try {
        await page.goto(`${origin}/?appFixture=1&homePresentation=1&sdkSession=user&onboardingState=ACTIVE_EXISTING_USER&language=${language}`);
        await page.locator('[data-daily-id="home-ui-fixture"]').waitFor();
        await loadAppBackdrop(page);
        // CSS-only theme/inset simulation; actual verified preference behavior
        // remains covered separately by checkAppTheme, never changed here.
        await page.evaluate(({ theme, inset }) => {
          document.documentElement.classList.toggle('dark', theme === 'dark');
          document.documentElement.style.setProperty('--safe-bottom', inset + 'px');
        }, { theme, inset: width === 390 ? 34 : 0 });
        if (scale === 2) await doubleText(page);
        await page.evaluate(() => new Promise(resolve => requestAnimationFrame(() => requestAnimationFrame(resolve))));
        const metrics = await page.locator('[data-home-root]').evaluate(root => {
          const box = node => { const r=node.getBoundingClientRect();return { x:r.x,y:r.y,width:r.width,height:r.height,bottom:r.bottom }; };
          const style = node => { const s=getComputedStyle(node);return { font:s.fontSize,line:s.lineHeight,weight:s.fontWeight,family:s.fontFamily,color:s.color,background:s.backgroundColor,radius:s.borderRadius,padding:s.padding,border:s.borderTopWidth,shadow:s.boxShadow }; };
          const heading=root.querySelector('h1'), profile=root.querySelector('[data-profile-trigger]');
          const nav=root.querySelector('.shinka-product-nav'), dock=nav.closest('.shinka-nav-dock');
          return { heading:box(heading),headingStyle:style(heading),profile:box(profile),profileStyle:style(profile),
            nav:{ box:box(nav),style:style(nav),dock:box(dock),dockPadding:getComputedStyle(dock).paddingBottom,
              links:[...nav.querySelectorAll('a')].map(node=>({box:box(node),style:style(node),text:node.textContent,active:node.getAttribute('aria-current'),icon:box(node.querySelector('svg'))})) },
            cards:[...root.querySelectorAll('[data-home-card]')].map(node=>({box:box(node),style:style(node),headingStyle:style(node.querySelector('h2')),textStyle:style(node.querySelector('p'))})),
            scrollWidth:document.documentElement.scrollWidth };
        });
        const paint = await readBackdrop(page);
        const artwork = Object.fromEntries(['artWidth','artHeight','artLeft','artTop','inset','logo','position','pointerEvents','ariaHidden','outsideMotion','overlay','filter','opacity','mask','documentTop','readingSurface'].map(key=>[key,paint[key]]));
        // Capture before visiting You, whose verified preference may legitimately
        // replace this matrix's temporary CSS-only theme.
        if (directory && scale===1 && [320,390,1280].includes(width)) await page.screenshot({ path:path.join(directory,key+'.png'),fullPage:true });
        if (!baseline) {
          assert(metrics.scrollWidth <= width+1, key+' horizontal overflow');
          assert.equal(metrics.cards.length,2);
          assert.equal(metrics.headingStyle.font,28*scale+'px');
          assert.deepEqual(metrics.cards[0].headingStyle,metrics.cards[1].headingStyle);
          for (const card of metrics.cards) {
            assert.equal(card.style.radius,'20px'); assert.equal(card.style.border,'0px'); assert.equal(card.style.shadow,'none');
            assert.equal(card.style.background,theme==='light'?'rgba(255, 255, 255, 0.8)':'rgba(43, 29, 38, 0.8)');
            assert.equal(card.textStyle.font,15*scale+'px');
          }
          assert(metrics.heading.y >= paint.logo.bottom, 'greeting must clear the original logo');
          assert(Math.abs(metrics.profile.y+metrics.profile.height/2-metrics.heading.y-metrics.heading.height/2)<1, 'greeting/profile group alignment');
          assert(metrics.profile.width>=44&&metrics.profile.height>=44);
          assert(metrics.heading.x+metrics.heading.width <= metrics.profile.x+1);
          const prior=before.find(row=>row.key===key);
          if (comparison) {
            assert(prior,'missing baseline '+key);
            assert.deepEqual(metrics.nav,prior.metrics.nav,'navigation must be unchanged '+key);
            assert.deepEqual(artwork,prior.artwork,'artwork must be unchanged '+key);
            assert.deepEqual(metrics.profileStyle,prior.metrics.profileStyle,'profile styling must be unchanged');
            assert(metrics.heading.y < prior.metrics.heading.y,'Home gap must be reduced');
          }
          assert.equal(await page.locator('[data-daily-message]').textContent(),language==='tr'?pair[2]:pair[4]);
          assert.equal(await page.locator('[data-daily-suggestion]').textContent(),language==='tr'?pair[3]:pair[5]);
          await page.evaluate(()=>window.scrollTo(0,document.documentElement.scrollHeight));
          const bottom=await page.locator('[data-home-root] .shinka-product-nav').boundingBox();
          assert(Math.abs(bottom.y+bottom.height-metrics.nav.box.bottom)<1,'fixed navigation must not move on scroll');
          await page.evaluate(()=>window.scrollTo(0,0));
          await page.locator('[data-profile-trigger]').click(); await page.locator('[data-you-root]').waitFor();
          await page.goBack(); await page.locator('[data-home-root]:visible').waitFor();
          assert.equal(await page.locator('[data-home-root]:visible [data-daily-id]').getAttribute('data-daily-id'),'home-ui-fixture');
          const calls=await page.evaluate(()=>window.__authFixture.calls);
          assert(!calls.some(call=>['saveProfile','saveCycle','skipCycle','accept','begin','execute'].includes(call.action)), 'presentation must not write data');
        }
        assert.deepEqual(errors,[]);
        results.push({key,scope:baseline?'BASELINE_CAPTURE':'LOCAL_REAL_APP_SYNTHETIC_SDK',passed:baseline?undefined:true,metrics,artwork});
      } finally { await context.close(); }
    }
  }
  if(directory)await writeFile(path.join(directory,'measurements.json'),JSON.stringify(results,null,2));
  return { scope:baseline?'BASELINE_CAPTURE':'LOCAL_REAL_APP_SYNTHETIC_SDK', scenarios:results.length, passed:baseline?undefined:true };
}

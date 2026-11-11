import assert from 'node:assert/strict';
import { inspectMobileSurface } from './mobileSurfaceMeasurements.mjs';
import { mkdir, readFile } from 'node:fs/promises';
import path from 'node:path';
import { backdropSelector, loadAppBackdrop } from './checkAppBackdrop.mjs';
export async function checkPatternFlow(page, origin, directory) {
  if (directory) await mkdir(directory, { recursive: true });
  const visualAssets = Boolean(directory && process.env.FOUNDATION_PATTERN_ASSETS === '1');
  const fontCss = (await readFile('index.html','utf8')).match(/href="(https:\/\/fonts.googleapis.com\/css2[^"]+)"/)[1];
  const publicAssets = route => {
    const url = new URL(route.request().url());
    const allowed = route.request().method() === 'GET' && (url.href===fontCss || url.origin === 'https://fonts.gstatic.com' && url.pathname.startsWith('/s/'));
    return allowed ? route.continue() : route.fallback();
  };
  if (visualAssets) await page.route('**/*', publicAssets);
  const results = [];
  for (const width of [320,360,390,430,844]) for (const language of ['tr','en']) for (const theme of ['light','dark']) {
    await page.setViewportSize({width,height:width===844?390:900});
    await page.goto(`${origin}/pattern?appFixture=1&themeFixture=1&sdkSession=admin&onboardingState=ACTIVE_EXISTING_USER&language=${language}&theme=${theme}`);
    await page.waitForSelector('[data-theme-id]');
    assert.equal(await page.evaluate(()=>document.documentElement.classList.contains('dark')),theme==='dark');await page.waitForSelector('[data-lunar-timeline]');
    assert.equal(await page.locator('nav a[aria-current="page"]').getAttribute('href'),`/pattern?lang=${language}`);
    if (visualAssets) {
      await page.evaluate(href=>{const link=document.createElement('link');link.rel='stylesheet';link.href=href;link.dataset.patternFont='true';document.head.append(link);},fontCss);
      await page.waitForFunction(()=>document.querySelector('link[data-pattern-font]')?.sheet);
      await page.evaluate(()=>document.fonts.ready);
      await loadAppBackdrop(page);
    }
    for (const scale of [1,2]) {
      if(scale===2)await page.evaluate(()=>{const sizes=[...document.querySelectorAll('[data-lunar-layout],[data-pattern-root] h1,[data-pattern-root] h2,[data-pattern-root] h3,[data-pattern-root] p,[data-pattern-root] li,[data-pattern-root] time,[data-pattern-root] button,[data-pattern-root] a,[data-pattern-root] span,[data-pattern-root] dt,[data-pattern-root] dd')].map(el=>({el,size:parseFloat(getComputedStyle(el).fontSize)}));for(const {el,size} of sizes)el.style.fontSize=`${size*2}px`;});
      const geometry=await page.evaluate(()=>{
        const rect=el=>{const r=el.getBoundingClientRect();return {left:r.left,right:r.right,top:r.top,bottom:r.bottom,width:r.width};};
        const layout=document.querySelector('[data-lunar-layout]'),scroller=layout.parentElement;
        return {width:innerWidth,scroll:document.documentElement.scrollWidth,layout:rect(layout),scroller:rect(scroller),scrollWidth:scroller.scrollWidth,labels:[...document.querySelectorAll('[data-lunar-label]')].map(rect),badText:[...layout.querySelectorAll('time,.lunar-phase')].filter(el=>el.scrollWidth>el.clientWidth+1).map(el=>({text:el.textContent,scroll:el.scrollWidth,width:el.clientWidth,font:getComputedStyle(el).fontSize})),textFits:[...layout.querySelectorAll('time,.lunar-phase')].every(el=>el.scrollWidth<=el.clientWidth+1)};
      });
      if(directory)await page.screenshot({path:path.join(directory,`pattern-${width}-${language}-${theme}-${scale}x.png`),fullPage:true});
      assert(geometry.scroll<=width+1 && geometry.scroller.left>=0 && geometry.scroller.right<=width && geometry.textFits && geometry.labels.length===5 && geometry.labels.every((r,i)=>r.left>=geometry.layout.left-1&&r.right<=geometry.layout.right+1&&geometry.labels.every((other,j)=>j===i||r.right<=other.left+1||r.left>=other.right-1||r.bottom<=other.top+1||r.top>=other.bottom-1)),JSON.stringify({width,language,theme,scale,geometry}));
      if(width>=360 && scale===1)assert(geometry.scrollWidth<=geometry.scroller.width+1,'normal mobile must show all five nodes');
      assert.equal(await page.locator('[data-lunar-halo]').count(),1);
      assert.equal(await page.locator('[data-theme-id]').count(),1);
      assert.equal(await page.locator('[data-lunar-node]').count(),5);
      assert.equal(await page.locator(backdropSelector).count(),1);
      if(geometry.scrollWidth>geometry.scroller.width+1) {
        const scroller=page.locator('.lunar-scroll');
        await scroller.focus();await page.keyboard.press('ArrowRight');
        await page.waitForFunction(()=>document.querySelector('.lunar-scroll').scrollLeft>0);
        await page.keyboard.press('End');
        assert(await page.locator('[data-lunar-node]').last().evaluate(el=>{const r=el.getBoundingClientRect(),s=el.closest('.lunar-scroll').getBoundingClientRect();return r.left>=s.left-1&&r.right<=s.right+1;}),'last phase must be reachable');
        await page.keyboard.press('Home');
        assert.equal(await scroller.evaluate(el=>el.scrollLeft),0,'Home must restore the start');
        await scroller.evaluate(el=>el.blur());
      }
      if(width===320 && language==='tr' && theme==='light' && scale===1) {
        const label=page.locator('.lunar-phase').nth(1),scroller=page.locator('.lunar-scroll');
        await label.evaluate(el=>{el.style.whiteSpace='nowrap';});
        assert((await inspectMobileSurface(page)).textOverflow.length>0,'negative clipped-label fixture escaped');
        await label.evaluate(el=>{el.style.whiteSpace='';});
        await scroller.evaluate(el=>{el.style.width='800px';el.style.maxWidth='none';});
        assert((await inspectMobileSurface(page)).uncontainedScrollRegions.length>0,'negative page overflow fixture escaped');
        await scroller.evaluate(el=>{el.style.width='';el.style.maxWidth='';});
      }
      results.push({scenario:`pattern-${width}-${language}-${theme}-${scale}x`,passed:true,geometry,publicAssets:visualAssets?'LOADED':'BLOCKED_BY_FIXTURE',scope:'LOCAL_BROWSER_SYNTHETIC'});
    }
    assert.equal(await page.evaluate(()=>window.__sdkLabCalls.filter(c=>c.name==='dailyMessage').length),0);
    assert(await page.evaluate(()=>window.__patternLab.state.calls.every(c=>c.method==='filter')));
    await page.locator('nav a:visible').nth(1).click();await page.waitForSelector('[data-calendar-root]');
    await page.locator('nav a:visible').nth(2).click();await page.waitForSelector('[data-pattern-root]');
  }
  for(const session of ['anonymous','user']) {
    await page.goto(`${origin}/pattern?appFixture=1&sdkSession=${session}`);
    await page.waitForSelector('[data-onboarding-state]');
    assert.equal(await page.locator('[data-pattern-root]').count(),0);
    assert.equal(await page.evaluate(()=>window.__sdkLabCalls.filter(c=>c.name==='pattern').length),0);
    results.push({scenario:`pattern-route-${session}-incomplete-denied`,passed:true,scope:'LOCAL_BROWSER_SYNTHETIC'});
  }
  if (visualAssets) await page.unroute('**/*', publicAssets);
  return results;
}

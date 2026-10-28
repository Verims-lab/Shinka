import assert from 'node:assert/strict';
import { mkdir } from 'node:fs/promises';
import path from 'node:path';
export async function checkPatternFlow(page, origin, directory) {
  if (directory) await mkdir(directory, { recursive: true });
  const results = [];
  for (const width of [320,360,390,430,844]) for (const language of ['tr','en']) {
    await page.setViewportSize({width,height:width===844?390:900});
    await page.goto(`${origin}/pattern?appFixture=1&sdkSession=user&onboardingState=ACTIVE_EXISTING_USER&language=${language}`);
    await page.waitForSelector('[data-theme-id]');await page.waitForSelector('[data-lunar-summary]');
    assert.equal(await page.locator('nav a[aria-current="page"]').getAttribute('href'),`/pattern?lang=${language}`);
    for (const scale of [1,2]) {
      if(scale===2)await page.evaluate(()=>{const sizes=[...document.querySelectorAll('[data-pattern-root] h1,[data-pattern-root] h2,[data-pattern-root] p,[data-pattern-root] li,[data-pattern-root] time,[data-pattern-root] button,[data-pattern-root] a,[data-pattern-root] span,[data-pattern-root] dt,[data-pattern-root] dd')].map(el=>({el,size:parseFloat(getComputedStyle(el).fontSize)}));for(const {el,size} of sizes)el.style.fontSize=`${size*2}px`;});
      const geometry=await page.evaluate(()=>({width:innerWidth,scroll:document.documentElement.scrollWidth,labels:[...document.querySelectorAll('[data-lunar-summary] > div')].map(el=>{const r=el.getBoundingClientRect();return {left:r.left,right:r.right,top:r.top,bottom:r.bottom};})}));
      assert(geometry.scroll<=width+1 && geometry.labels.length===2 && geometry.labels.every((r,i)=>r.left>=0&&r.right<=width&&(!i||r.top>=geometry.labels[i-1].bottom)));
      if(directory)await page.screenshot({path:path.join(directory,`pattern-${width}-${language}-${scale}x.png`),fullPage:true});
      results.push({scenario:`pattern-${width}-${language}-${scale}x`,passed:true,geometry,scope:'LOCAL_BROWSER_SYNTHETIC'});
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
  return results;
}

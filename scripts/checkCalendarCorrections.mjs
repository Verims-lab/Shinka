import assert from 'node:assert/strict';
import { mkdir, writeFile } from 'node:fs/promises';
import path from 'node:path';
import { doubleText } from './mobileSurfaceMeasurements.mjs';

// Full retained App + actual Calendar/native handler over synthetic SDK. No
// physical keyboard/safe-area or hosted write acceptance is inferred here.
export async function checkCalendarCorrections(browser, origin, directory) {
  if(directory)await mkdir(directory,{recursive:true});const results=[];
  for(const language of ['tr','en'])for(const [width,height] of [[320,568],[360,740],[390,844],[430,740],[740,320]])for(const scale of [1,2]){
    const context=await browser.newContext({viewport:{width,height},locale:language,hasTouch:true}),page=await context.newPage(),errors=[];
    page.on('pageerror',e=>errors.push(e.message));await page.route('**/*',r=>new URL(r.request().url()).origin===origin?r.continue():r.abort());
    const capture=async name=>{if(directory&&[320,390].includes(width))await page.screenshot({path:path.join(directory,`${name}-${language}-${width}-${scale}.png`),fullPage:true});};
    const fit=async()=>{
      const g=await page.locator('#calendar-start-date').evaluate(e=>{const r=e.getBoundingClientRect(),p=e.parentElement.getBoundingClientRect(),s=getComputedStyle(e);return {left:r.left,right:r.right,parentLeft:p.left,parentRight:p.right,box:s.boxSizing,appearance:s.appearance,labels:e.labels.length,font:parseFloat(s.fontSize),max:e.max,overflow:getComputedStyle(e.closest('section')).overflowX,doc:document.documentElement.scrollWidth,viewport:innerWidth};});
      assert(g.left>=g.parentLeft-1&&g.right<=g.parentRight+1&&g.doc<=g.viewport+1);assert.equal(g.labels,1);assert.equal(g.box,'border-box');assert.equal(g.appearance,'none');assert.equal(g.overflow,'visible');assert.equal(g.max,'2026-10-20');assert(g.font>=17*scale);return g;
    };
    const writes=()=>page.evaluate(()=>window.__nativeCalendarLab.state.calls.filter(c=>c.name==='UserPeriodRecord'&&c.method!=='filter').length);
    try {
      await page.goto(`${origin}/calendar?appFixture=1&sdkSession=admin&onboardingState=ACTIVE_EXISTING_USER&nativeCalendar=1&language=${language}`);
      await page.locator('[data-calendar-date="2026-10-01"]').waitFor();if(scale===2)await doubleText(page);
      assert.equal(await page.getByRole('button',{name:language==='tr'?'Yenile':'Refresh',exact:true}).count(),0);
      assert.equal(await page.locator('[data-refresh-control]').count(),1);
      await fit();await page.locator('#calendar-start-date').fill('2026-10-02');await page.locator('#calendar-start-date').focus();const geometry=await fit();
      await page.keyboard.press('Tab');await page.keyboard.press('Shift+Tab');
      assert(await page.locator('#calendar-start-date').evaluate(e=>e.matches(':focus')));
      assert.equal(await page.locator('#calendar-start-date').evaluate(e=>getComputedStyle(e).outlineStyle),'solid');await capture('date');
      // Selection and gesture are read-only and keep the exact draft/month.
      const readCount=await page.evaluate(()=>window.__authFixture.calls.filter(c=>c.name==='calendar').length);
      await page.evaluate(()=>{scrollTo(0,0);const target=document.querySelector('[data-calendar-root] h1');for(const [type,y] of [['touchstart',0],['touchmove',90],['touchend',90]]){const e=new Event(type,{bubbles:true});Object.defineProperty(e,'touches',{value:type==='touchend'?[]:[{clientX:50,clientY:y}]});target.dispatchEvent(e);}});
      await page.waitForFunction(n=>window.__authFixture.calls.filter(c=>c.name==='calendar').length>n,readCount);
      await page.waitForFunction(()=>document.querySelector('[data-refresh-control]').getAttribute('aria-busy')==='false');
      assert.equal(await page.locator('#calendar-start-date').inputValue(),'2026-10-02');assert.equal(await writes(),1);
      await page.locator('#calendar-start-date').fill('2026-10-01');
      const remove=language==='tr'?'Regl başlangıcını sil':'Delete period start';await page.getByRole('button',{name:remove,exact:true}).click();
      await page.locator('dialog[open]').waitFor();await page.keyboard.press('Escape');await page.locator('dialog').waitFor({state:'detached'});
      await page.waitForFunction(label=>document.activeElement?.textContent===label,remove);
      await page.getByRole('button',{name:remove,exact:true}).click();await page.locator('dialog[open]').waitFor();
      await page.evaluate(()=>window.__nativeCalendarLab.once('after',c=>c.name==='UserPeriodRecord'&&c.method==='deleteMany'));
      await page.locator('dialog').getByRole('button',{name:remove,exact:true}).click();
      await page.locator('dialog [data-calendar-error]').waitFor();assert.equal(await page.locator('[data-calendar-error]').count(),1);
      assert.equal(await page.locator('dialog').getByRole('button',{name:remove,exact:true}).count(),0);assert.equal(await writes(),2);
      if(scale===2){await page.evaluate(()=>document.querySelectorAll('body *').forEach(e=>{if(e instanceof HTMLElement)e.style.removeProperty('font-size');}));await doubleText(page);}
      await capture('unknown-delete');const dialog=await page.locator('dialog').evaluate(e=>({width:e.getBoundingClientRect().width,scroll:e.scrollWidth,client:e.clientWidth,height:e.getBoundingClientRect().height}));assert(dialog.scroll<=dialog.client+1&&dialog.width<=width&&dialog.height<=height);
      await page.locator('dialog').getByRole('button',{name:language==='tr'?'Durumu kontrol et':'Check status',exact:true}).click();
      await page.locator('dialog').waitFor({state:'detached'});await page.getByText(language==='tr'?'Regl başlangıcı silindi':'Period start deleted',{exact:true}).waitFor();assert.equal(await writes(),2);
      assert.equal(await page.locator('[data-calendar-root] button[type=submit]').isDisabled(),false);
      // Future input has an actual linked field error and cannot call the backend.
      await page.locator('#calendar-start-date').fill('2026-10-21');await page.locator('#calendar-date-error').waitFor();assert.equal(await page.locator('#calendar-start-date').getAttribute('aria-describedby'),'calendar-date-error');assert(await page.locator('[data-calendar-root] button[type=submit]').isDisabled());
      await page.locator('#calendar-start-date').fill('2026-10-05');await page.locator('#calendar-date-error').waitFor({state:'detached'});assert.equal(await writes(),2);
      // Retained refresh failure still offers one explicit Retry after removal of Refresh.
      await page.evaluate(()=>window.__authFixture.failOperation('calendar.read'));await page.evaluate(()=>{window.dispatchEvent(new Event('offline'));window.dispatchEvent(new Event('online'));});
      await page.waitForFunction(()=>document.querySelector('[data-refresh-control]')?.textContent.trim());
      await page.getByRole('button',{name:language==='tr'?'Tekrar dene':'Retry',exact:true}).click();
      await page.waitForFunction(()=>!document.querySelector('[data-refresh-control]')?.textContent.trim());assert.equal(await page.locator('#calendar-start-date').inputValue(),'2026-10-05');
      assert.equal(errors.length,0);results.push({language,width,height,scale,geometry,dialog,passed:true,scope:'LOCAL_REAL_APP_NATIVE_SYNTHETIC',physicalDevice:false});
    } finally {await context.close();}
  }
  if(directory)await writeFile(path.join(directory,'execution.json'),JSON.stringify(results,null,2));return results;
}

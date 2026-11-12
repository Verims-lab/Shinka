import assert from 'node:assert/strict';
import { mkdir, writeFile } from 'node:fs/promises';
import path from 'node:path';
import { doubleText } from './mobileSurfaceMeasurements.mjs';

// Actual retained App + native Calendar handler, isolated SDK only. Physical
// safe-area/keyboard/wrapper and hosted writes are deliberately not inferred.
export async function checkCalendarCorrections(browser, origin, directory) {
  if(directory)await mkdir(directory,{recursive:true});const results=[];
  for(const language of ['tr','en'])for(const [width,height] of [[320,568],[360,740],[390,844],[430,740],[740,320]])for(const scale of [1,2])for(const theme of ['light','dark']){
    const record=directory&&language==='en'&&width===390&&scale===1&&theme==='light';
    const context=await browser.newContext({viewport:{width,height},locale:language,hasTouch:true,...(record?{recordVideo:{dir:directory,size:{width,height}}}:{})}),page=await context.newPage(),errors=[];
    page.on('pageerror',e=>errors.push(e.message));await page.route('**/*',r=>new URL(r.request().url()).origin===origin?r.continue():r.abort());
    const capture=async name=>{if(directory&&[320,390].includes(width))await page.screenshot({path:path.join(directory,`${name}-${language}-${width}-${scale}-${theme}.png`),fullPage:true});if(record)await page.waitForTimeout(1200);};
    const day=date=>page.locator(`[data-calendar-date="${date}"]`),save=page.locator('[data-calendar-save]'),edit=page.locator('[data-calendar-edit]');
    const rows=()=>page.evaluate(()=>window.__nativeCalendarLab.tables.UserPeriodRecord.map(r=>({id:r.id,date:r.period_start_date})));
    const writes=()=>page.evaluate(()=>window.__authFixture.calls.filter(c=>c.name==='calendar'&&c.action!=='read').length);
    const scaleText=async()=>{if(scale===2){await page.evaluate(()=>document.querySelectorAll('body *').forEach(e=>{if(e instanceof HTMLElement)e.style.removeProperty('font-size');}));await doubleText(page);}};
    const fit=()=>page.evaluate(()=>({document:document.documentElement.scrollWidth,viewport:innerWidth,days:[...document.querySelectorAll('[data-calendar-date]')].map(e=>({width:e.getBoundingClientRect().width,height:e.getBoundingClientRect().height})),form:!!document.querySelector('[data-calendar-root] form,input[type=date]')}));
    try {
      await page.goto(`${origin}/calendar?appFixture=1&sdkSession=admin&onboardingState=ACTIVE_EXISTING_USER&nativeCalendar=1&themeFixture=1&language=${language}&theme=${theme}`);
      await day('2026-10-01').waitFor();await page.waitForFunction(t=>document.documentElement.classList.contains('dark')===(t==='dark'),theme);await scaleText();await capture('normal');
      assert.equal(await page.getByRole('button',{name:language==='tr'?'Yenile':'Refresh',exact:true}).count(),0);assert.equal(await page.locator('[data-refresh-control]').count(),1);
      assert.equal(await writes(),0);const original=await rows();await edit.click();await scaleText();assert(await save.isDisabled());
      await day('2026-10-20').click();assert.equal(await day('2026-10-20').getAttribute('data-draft'),'add');await day('2026-10-20').click();assert(await save.isDisabled());
      await day('2026-10-08').click();assert(await save.isDisabled());await page.locator('#calendar-draft-error').waitFor();
      assert(await day('2026-10-21').isDisabled());assert.equal(await day('2026-10-29').getAttribute('data-start'),'false');assert.equal(await day('2026-10-29').getAttribute('data-predicted'),'true');
      await page.locator('[data-calendar-cancel]').click();assert.deepEqual(await rows(),original);assert.equal(await writes(),0);
      await edit.click();await day('2026-10-20').focus();await page.keyboard.press('Enter');await scaleText();
      assert.equal(await day('2026-10-20').getAttribute('data-draft'),'add');const geometry=await fit();assert(!geometry.form&&geometry.document<=width+1&&geometry.days.every(r=>r.width>=44&&r.height>=44));await capture('add-draft');
      await save.click();await edit.waitFor();assert.equal((await rows()).length,2);assert.equal(await writes(),1);
      const added=(await rows()).find(r=>r.date==='2026-10-20');await capture('added');
      await edit.click();await day('2026-10-20').click();await day('2026-10-19').click();assert.equal(await day('2026-10-20').getAttribute('data-draft'),'from');await scaleText();await capture('move-draft');
      // Start on the artwork header. Pull refresh keeps the unsaved draft.
      const reads=await page.evaluate(()=>window.__authFixture.calls.filter(c=>c.name==='calendar').length);
      await page.evaluate(()=>scrollTo({top:0,behavior:'instant'}));
      await page.waitForFunction(()=>scrollY===0);
      await page.evaluate(()=>{
        const x=50,y=16,target=document.elementFromPoint(x,y);
        if (!target?.closest('.shinka-route-clip') || target.closest('.shinka-viewport')) throw new Error('Expected the reserved artwork area above the Calendar viewport');
        for (const [type,dy] of [['touchstart',0],['touchmove',90],['touchend',90]]) {
          const event=new Event(type,{bubbles:true});
          Object.defineProperty(event,'touches',{value:type==='touchend'?[]:[{clientX:x,clientY:y+dy}]});
          target.dispatchEvent(event);
        }
      });
      await page.waitForFunction(n=>window.__authFixture.calls.filter(c=>c.name==='calendar').length>n,reads);await page.locator('[data-refresh-control][aria-busy=false]').waitFor({state:'attached'});assert.equal(await day('2026-10-19').getAttribute('data-draft'),'edit');assert.equal(await writes(),1);
      await save.click();await edit.waitFor();assert.deepEqual((await rows()).find(r=>r.id===added.id),{id:added.id,date:'2026-10-19'});assert.equal(await writes(),2);await capture('moved');
      await edit.click();await day('2026-10-19').click();await save.click();await page.locator('dialog[open]').waitFor();await page.keyboard.press('Escape');await page.locator('dialog').waitFor({state:'detached'});await page.waitForFunction(()=>document.activeElement?.hasAttribute('data-calendar-save'));assert.equal(await writes(),2);
      await save.click();await page.locator('dialog[open]').waitFor();await scaleText();await capture('delete-confirm');const dialog=await page.locator('dialog').evaluate(e=>({width:e.getBoundingClientRect().width,height:e.getBoundingClientRect().height,scroll:e.scrollWidth,client:e.clientWidth}));assert(dialog.width<=width&&dialog.height<=height&&dialog.scroll<=dialog.client+1);
      await page.evaluate(()=>window.__nativeCalendarLab.once('after',c=>c.name==='UserPeriodRecord'&&c.method==='deleteMany'));
      await page.locator('dialog').getByRole('button',{name:language==='tr'?'Regl başlangıcını sil':'Delete period start',exact:true}).click();await page.locator('dialog [data-calendar-error]').waitFor();assert.equal(await page.locator('[data-calendar-error]').count(),1);assert.equal(await writes(),3);
      const check=page.locator('dialog').getByRole('button',{name:language==='tr'?'Durumu kontrol et':'Check status',exact:true});await check.click();await page.locator('dialog').getByRole('button',{name:language==='tr'?'Aynı işleme devam et':'Continue the same change',exact:true}).waitFor();assert.equal(await writes(),3);await check.click();assert.equal(await writes(),3);
      await page.locator('dialog').getByRole('button',{name:language==='tr'?'Aynı işleme devam et':'Continue the same change',exact:true}).click();await page.locator('dialog').waitFor({state:'detached'});await edit.waitFor();assert.equal(await writes(),4);assert.deepEqual(await rows(),original);await capture('deleted');
      assert.equal(await page.evaluate(()=>window.__nativeCalendarLab.state.calls.filter(c=>c.name==='UserPeriodRecord'&&c.method==='deleteMany').length),1);
      await edit.click();await day('2026-10-02').click();await day('2026-10-01').click();await day('2026-10-02').click();
      await page.evaluate(()=>window.__authFixture.failOperation('calendar.read'));await page.evaluate(()=>{window.dispatchEvent(new Event('offline'));window.dispatchEvent(new Event('online'));});await page.waitForFunction(()=>document.querySelector('[data-refresh-control]')?.textContent.trim());
      await page.getByRole('button',{name:language==='tr'?'Tekrar dene':'Retry',exact:true}).click();await page.waitForFunction(()=>!document.querySelector('[data-refresh-control]')?.textContent.trim());assert.equal(await day('2026-10-02').getAttribute('data-draft'),'edit');assert.equal(errors.length,0);
      results.push({language,width,height,scale,theme,geometry,dialog,passed:true,scope:'LOCAL_REAL_APP_NATIVE_SYNTHETIC',physicalDevice:false});
    } finally {await context.close();if(record)await page.video().saveAs(path.join(directory,'add-move-delete.webm'));}
  }
  if(directory)await writeFile(path.join(directory,'execution.json'),JSON.stringify(results,null,2));return results;
}

import assert from 'node:assert/strict';
import { mkdir, writeFile } from 'node:fs/promises';
import path from 'node:path';
import { doubleText, inspectMobileSurface } from './mobileSurfaceMeasurements.mjs';
import { loadAppBackdrop, readBackdrop } from './checkAppBackdrop.mjs';

// Real App/guards and native Calendar handler; only SDK IO is substituted.
export async function checkCalendarCorrections(browser, origin, directory) {
  const results=[];if(directory)await mkdir(directory,{recursive:true});
  for(const language of ['tr','en'])for(const[width,height]of[[320,568],[360,740],[390,844],[430,932],[740,320]])for(const scale of[1,2])for(const theme of['light','dark']){
    const context=await browser.newContext({viewport:{width,height},locale:language,hasTouch:true,reducedMotion:'reduce'}),page=await context.newPage(),errors=[];
    page.on('pageerror',error=>errors.push(error.message));await page.route('**/*',r=>new URL(r.request().url()).origin===origin?r.continue():r.abort());
    const day=date=>page.locator(`[data-calendar-date="${date}"]`),save=()=>page.locator('[data-calendar-save]'),remove=()=>page.locator('[data-calendar-delete]');
    const rows=()=>page.evaluate(()=>window.__nativeCalendarLab.tables.UserPeriodRecord.map(r=>({id:r.id,date:r.period_start_date})));
    const writes=()=>page.evaluate(()=>window.__authFixture.calls.filter(c=>c.name==='calendar'&&c.action!=='read').length);
    const scaleText=async()=>{if(scale===2){await page.evaluate(()=>document.querySelectorAll('body *').forEach(e=>{if(e instanceof HTMLElement)e.style.removeProperty('font-size');}));await doubleText(page);}};
    const capture=async label=>{if(directory&&scale===1&&[320,390].includes(width))await page.screenshot({path:path.join(directory,`${label}-${language}-${width}-${theme}.png`),fullPage:true});};
    const chrome=()=>page.evaluate(()=>{
      const root=document.querySelector('[data-calendar-root]'),icon=root.querySelector('[data-profile-trigger]'),nav=root.querySelector('.shinka-product-nav');
      const box=(n,document=false)=>{const b=n.getBoundingClientRect();return{x:b.x,y:b.y+(document?scrollY:0),width:b.width,height:b.height,bottom:b.bottom+(document?scrollY:0)};};
      const style=n=>{const s=getComputedStyle(n);return{color:s.color,bg:s.backgroundColor,border:s.border,font:s.font,fontStyle:s.fontStyle,padding:s.padding};};
      return{icon:box(icon,true),iconStyle:style(icon),href:icon.getAttribute('href'),heading:box(root.querySelector('h1'),true),headingStyle:style(root.querySelector('h1')),nav:box(nav),navStyle:style(nav),links:[...nav.querySelectorAll('a')].map(n=>({box:box(n),style:style(n),html:n.innerHTML,href:n.getAttribute('href')}))};
    });
    try{
      await page.goto(`${origin}/calendar?appFixture=1&sdkSession=admin&onboardingState=ACTIVE_EXISTING_USER&nativeCalendar=1&themeFixture=1&theme=${theme}&language=${language}`);
      await day('2026-10-01').waitFor();await page.waitForFunction(dark=>document.documentElement.classList.contains('dark')===dark,theme==='dark');await loadAppBackdrop(page);await scaleText();
      const original=await rows(),protectedChrome=await chrome(),paint=await readBackdrop(page);
      assert.equal(await page.locator('[data-calendar-edit],input[type=date],[data-calendar-root] form').count(),0);assert.equal(await page.locator('[data-calendar-legend] li').count(),2);assert.equal(await writes(),0);
      assert.equal(await page.getByRole('button',{name:/^(Tarihleri düzenle|Edit dates)$/}).count(),0);
      await day('2026-10-01').click();await scaleText();assert.equal(await page.locator('[data-calendar-day-status]').textContent(),language==='tr'?'Regl başlangıcı kaydedilmiş':'Period start recorded');assert(await page.locator('[data-calendar-move]').isEnabled());assert(await remove().isEnabled());await capture('recorded');
      assert.equal(await day('2026-10-01').locator('[data-calendar-start-marker]').count(),1);
      await day('2026-10-03').click();await scaleText();assert.equal(await day('2026-10-03').getAttribute('data-start'),'false');assert.equal(await page.locator('[data-calendar-add]').count(),0);assert.match(await page.locator('[data-calendar-day-status]').textContent(),language==='tr'?/aralığında/:/interval/);
      await day('2026-10-08').click();assert(await save().isDisabled());await page.locator('#calendar-draft-error').waitFor();assert.equal(await writes(),0);
      await day('2026-10-29').click();await scaleText();assert.equal(await day('2026-10-29').getAttribute('data-predicted'),'true');assert.equal(await day('2026-10-29').getAttribute('data-start'),'false');assert(await day('2026-10-29').isEnabled());assert.equal(await page.locator('[data-calendar-add]').count(),0);assert(!/predicted start|tahmini başlangıç/i.test(await day('2026-10-29').getAttribute('aria-label')));await capture('predicted-future');
      await day('2026-10-20').focus();await page.keyboard.press('Enter');await scaleText();assert.equal(await day('2026-10-20').getAttribute('aria-current'),'date');assert.equal(await day('2026-10-20').getAttribute('data-start'),'false');assert.equal(await page.locator('[data-calendar-selection]').getAttribute('data-selected-date'),'2026-10-20');
      assert.equal(await page.locator('[data-calendar-day-status]').isVisible(),false);assert.equal(await page.locator('[data-calendar-day-status]').textContent(),'');assert.equal(await page.locator('[data-calendar-selection]').textContent(),(await page.locator('#calendar-selected-date').textContent())+(language==='tr'?'Regl başlangıcı olarak kaydet':'Save as period start'));
      const geometry=await inspectMobileSurface(page,true);assert(geometry.scrollWidth<=width+1);assert.deepEqual(geometry.small,[]);assert.deepEqual(geometry.textOverflow,[]);assert.deepEqual(geometry.contrastFailures,[]);
      const header=await page.locator('[data-calendar-month-header]').evaluate(e=>{const title=e.querySelector('h2').getBoundingClientRect(),buttons=e.querySelectorAll('button');return{left:title.left,right:title.right,previous:buttons[0].getBoundingClientRect().right,next:buttons[1].getBoundingClientRect().left};});assert(header.left>=header.previous&&header.right<=header.next,'month title overlaps navigation');await capture('today-unrecorded');
      await page.locator('[data-calendar-add]').click();await page.locator('[data-calendar-move]').waitFor();assert.equal((await rows()).length,2);assert.equal(await writes(),1);const added=(await rows()).find(r=>r.date==='2026-10-20');
      await page.locator('[data-calendar-move]').click();await page.waitForFunction(()=>document.activeElement?.getAttribute('data-calendar-date')==='2026-10-20');await page.keyboard.press('ArrowLeft');await page.keyboard.press('Enter');await scaleText();assert.equal(await day('2026-10-20').getAttribute('data-draft'),'from');assert.equal(await day('2026-10-19').getAttribute('data-draft'),'edit');await capture('move-preview');
      // RefreshControl intentionally declines custom gestures when native
      // overscroll containment is unavailable. Exercise that negative branch
      // without fabricating CSS support (Windows WebKit has no such support).
      const pullSupported=await page.evaluate(()=>CSS.supports('overscroll-behavior-y','contain'));
      const reads=await page.evaluate(()=>window.__authFixture.calls.filter(c=>c.name==='calendar').length);await page.evaluate(()=>scrollTo({top:0,behavior:'instant'}));
      await page.waitForFunction(()=>scrollY===0);
      await page.evaluate(()=>{const target=document.elementFromPoint(50,16);if(!target?.closest('.shinka-route-clip')||target.closest('.shinka-viewport'))throw new Error('Pull must start in the reserved artwork area');for(const[type,y]of[['touchstart',16],['touchmove',106],['touchend',106]]){const e=new Event(type,{bubbles:true});Object.defineProperty(e,'touches',{value:type==='touchend'?[]:[{clientX:50,clientY:y}]});target.dispatchEvent(e);}});
      if(pullSupported)await page.waitForFunction(n=>window.__authFixture.calls.filter(c=>c.name==='calendar').length>n,reads);
      else{await page.evaluate(()=>new Promise(resolve=>requestAnimationFrame(()=>requestAnimationFrame(resolve))));assert.equal(await page.evaluate(()=>window.__authFixture.calls.filter(c=>c.name==='calendar').length),reads,'unsupported gesture unexpectedly refreshed');}
      await page.locator('[data-refresh-control][aria-busy=false]').waitFor({state:'attached'});assert.equal(await day('2026-10-19').getAttribute('data-draft'),'edit');assert.equal(await writes(),1);
      await save().click();await page.locator('[data-calendar-move]').waitFor();assert.deepEqual((await rows()).find(r=>r.id===added.id),{id:added.id,date:'2026-10-19'});assert.equal(await writes(),2);
      await remove().click();await page.locator('dialog[open]').waitFor();await page.keyboard.press('Escape');await page.locator('dialog').waitFor({state:'detached'});assert(await remove().evaluate(el=>document.activeElement===el));assert.equal(await writes(),2);
      await remove().click();await page.locator('dialog[open]').waitFor();await scaleText();await capture('delete-confirm');const dialog=await page.locator('dialog').evaluate(e=>({width:e.getBoundingClientRect().width,height:e.getBoundingClientRect().height,scroll:e.scrollWidth,client:e.clientWidth}));assert(dialog.width<=width&&dialog.height<=height&&dialog.scroll<=dialog.client+1);
      await page.evaluate(()=>window.__nativeCalendarLab.once('after',c=>c.name==='UserPeriodRecord'&&c.method==='deleteMany'));await page.locator('dialog').getByRole('button',{name:language==='tr'?'Regl başlangıcını sil':'Delete period start',exact:true}).click();await page.locator('dialog [data-calendar-error]').waitFor();assert.equal(await page.locator('[data-calendar-error]').count(),1);assert.equal(await writes(),3);
      const check=page.locator('dialog').getByRole('button',{name:language==='tr'?'Durumu kontrol et':'Check status',exact:true});await check.click();const continuation=page.locator('dialog').getByRole('button',{name:language==='tr'?'Aynı işleme devam et':'Continue the same change',exact:true});await continuation.waitFor();await check.click();assert.equal(await writes(),3);await continuation.click();await page.locator('dialog').waitFor({state:'detached'});await page.getByText(language==='tr'?'Regl başlangıcı silindi':'Period start deleted',{exact:true}).waitFor();assert.equal(await writes(),4);assert.deepEqual(await rows(),original);assert.equal(await page.locator('[data-calendar-error]').count(),0);
      assert.equal(await page.evaluate(()=>window.__nativeCalendarLab.state.calls.filter(c=>c.name==='UserPeriodRecord'&&c.method==='deleteMany').length),1);
      await day('2026-10-01').click();await page.locator('[data-calendar-move]').click();await day('2026-10-02').click();await page.evaluate(()=>window.__authFixture.failOperation('calendar.read'));await page.evaluate(()=>{window.dispatchEvent(new Event('offline'));window.dispatchEvent(new Event('online'));});await page.waitForFunction(()=>document.querySelector('[data-refresh-control]')?.textContent.trim());await page.getByRole('button',{name:language==='tr'?'Tekrar dene':'Retry',exact:true}).click();await page.waitForFunction(()=>!document.querySelector('[data-refresh-control]')?.textContent.trim());assert.equal(await day('2026-10-02').getAttribute('data-draft'),'edit');await page.locator('[data-calendar-cancel]').click();await scaleText();
      assert.deepEqual(await chrome(),protectedChrome,'profile, heading and bottom navigation changed');const afterPaint=await readBackdrop(page);for(const key of['artWidth','artHeight','artLeft','artTop','inset','logo','position','filter','opacity','documentTop'])assert.deepEqual(afterPaint[key],paint[key],'protected artwork '+key);assert.deepEqual(errors,[]);
      // A fresh SDK fixture owns the empty-state check; prior action history is not erased or rewritten.
      await page.reload();await day('2026-10-01').waitFor();await loadAppBackdrop(page);await scaleText();
      await day('2026-10-01').click();await remove().click();await page.locator('dialog[open]').waitFor();await page.locator('dialog').getByRole('button',{name:language==='tr'?'Regl başlangıcını sil':'Delete period start',exact:true}).click();await page.locator('dialog').waitFor({state:'detached'});assert.deepEqual(await rows(),[]);
      await day('2026-10-20').click();await scaleText();assert(await page.locator('[data-calendar-add]').isEnabled());assert.equal(await page.locator('[data-calendar-day-status]').isVisible(),false);
      assert.equal(await page.locator('[data-calendar-selection]').textContent(),(await page.locator('#calendar-selected-date').textContent())+(language==='tr'?'Regl başlangıcı olarak kaydet':'Save as period start'));
      assert(!/No period predictions yet|Henüz regl tahmini yok|No period start is recorded|Bu tarihte kayıtlı bir regl başlangıcı yok/.test(await page.locator('[data-calendar-root]').textContent()));assert.equal(await page.locator('[data-predicted=true]').count(),0);await capture('empty-concise');
      results.push({language,width,height,scale,theme,geometry,dialog,pullSupported,pullRefresh:pullSupported?'READ_AND_DRAFT_RETAINED':'UNSUPPORTED_CAPABILITY_GESTURE_IGNORED_DRAFT_RETAINED',passed:true,scope:'LOCAL_REAL_APP_NATIVE_SYNTHETIC',physicalDevice:false});
    }finally{await context.close();}
  }
  if(directory)await writeFile(path.join(directory,'execution.json'),JSON.stringify(results,null,2));return results;
}

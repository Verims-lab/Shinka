import assert from 'node:assert/strict';
import { mkdir, readFile, writeFile } from 'node:fs/promises';
import path from 'node:path';
import { loadAppBackdrop, readBackdrop } from './checkAppBackdrop.mjs';
import { inspectMobileSurface } from './mobileSurfaceMeasurements.mjs';

// Real App/native handler with CLI-only isolated SDK. No hosted IO.
export async function checkCalendarRecovery(browser, origin, directory) {
  const baseline=process.env.FOUNDATION_CALENDAR_SPACING_BASELINE==='1';
  if(baseline&&process.env.FOUNDATION_CALENDAR_RECOVERY_ONLY!=='1')throw new Error('Spacing baseline is measurement-only; use the dedicated recovery command');
  const comparison=process.env.FOUNDATION_CALENDAR_SPACING_COMPARISON;
  const before=comparison?JSON.parse(await readFile(comparison,'utf8')):null,rows=[];
  if(directory)await mkdir(directory,{recursive:true});
  for(const [width,height] of [[320,568],[360,740],[390,844],[430,932],[768,1024],[1280,900]])for(const language of ['tr','en'])for(const safe of width<500?['android','ios']:['desktop']){
    const context=await browser.newContext({viewport:{width,height},hasTouch:true,locale:language,reducedMotion:'reduce'}),page=await context.newPage(),errors=[];
    page.on('pageerror',e=>errors.push(e.message));
    await page.route('**/*',r=>new URL(r.request().url()).origin===origin?r.continue():r.abort());
    const day=date=>page.locator('[data-calendar-date="'+date+'"]');
    const writes=()=>page.evaluate(()=>window.__authFixture.calls.filter(c=>c.name==='calendar'&&c.action!=='read').length);
    const insets=async()=>{if(safe==='ios')await page.evaluate(()=>{document.documentElement.style.setProperty('--safe-top','24px');document.documentElement.style.setProperty('--safe-bottom','34px');window.dispatchEvent(new Event('resize'));});};
    const fixtureUrl=origin+'/calendar?appFixture=1&sdkSession=admin&onboardingState=ACTIVE_EXISTING_USER&nativeCalendar=1&calendarRecovery090=1&language='+language;
    try{
      await page.goto(fixtureUrl);
      await day('2026-11-11').waitFor();await loadAppBackdrop(page);
      await insets();
      const paint=await readBackdrop(page);
      const geometry=await page.evaluate(()=>{
        const root=document.querySelector('[data-calendar-root]'),rect=e=>{const r=e.getBoundingClientRect();return{top:r.top+scrollY,left:r.left,right:r.right,bottom:r.bottom+scrollY,width:r.width,height:r.height};};
        return{title:rect(root.querySelector('h1')),profile:rect(root.querySelector('[data-profile-trigger]')),bar:rect(root.querySelector('.shinka-product-nav')),dock:rect(root.querySelector('.shinka-nav-dock'))};
      });
      const gap=geometry.title.top-paint.logo.bottom,key=[width,height,language,safe].join('-');
      if(!baseline){
        assert(gap>=24&&gap<=54,'Calendar title must retain clearance and the approved approximately half-size gap');
        assert(geometry.profile.bottom<=geometry.title.top,'profile overlaps Calendar heading');
        if(before){const old=before.find(r=>r.key===key);assert(old,'missing spacing baseline');assert(Math.abs(gap/old.gap-.5)<=.08,'Calendar gap not reduced by approximately half');assert.deepEqual(geometry.profile,old.geometry.profile);for(const field of ['logo','artWidth','artHeight','artLeft','artTop','inset','position','opacity','filter'])assert.deepEqual(paint[field],old.paint[field],'protected artwork '+field);assert.deepEqual(geometry.bar,old.geometry.bar);assert.deepEqual(geometry.dock,old.geometry.dock);}
        assert.equal(await day('2026-11-11').getAttribute('data-start'),'false');
        assert(await day('2026-11-15').isEnabled());await day('2026-11-15').click();
        assert.equal(await page.locator('[data-calendar-selection]').getAttribute('data-selected-date'),'2026-11-15');
        assert.equal(await page.locator('[data-calendar-day-status]').textContent(),language==='tr'?'Bu tarihte kayıtlı bir regl başlangıcı yok':'No period start is recorded on this date');
        assert.equal(await page.locator('[data-calendar-add],[data-calendar-move],[data-calendar-delete]').count(),0);
        const receipt=await page.evaluate(()=>structuredClone(window.__nativeCalendarLab.tables.UserCalendarAction.find(r=>r.status==='PENDING')));
        await page.locator('[data-calendar-check]').click();await page.locator('[data-calendar-continue]').waitFor();await page.locator('[data-calendar-check]').click();await page.locator('[data-calendar-check]:enabled').waitFor();
        assert.equal(await writes(),0);assert.equal(await page.locator('[data-calendar-recovery]').count(),1);
        await page.getByRole('button',{name:language==='tr'?'Sonraki ay':'Next month',exact:true}).click();await day('2026-12-01').waitFor();await day('2026-12-01').click();
        await page.locator('[data-calendar-check]').click();await page.locator('[data-calendar-check]:enabled').waitFor();assert.equal(await page.locator('[data-calendar-selection]').getAttribute('data-selected-date'),'2026-12-01');
        await page.locator('nav a:visible').first().click();await page.locator('[data-home-root]').waitFor();await page.locator('nav a:visible').nth(1).click();await day('2026-12-01').waitFor();assert.equal(await page.locator('[data-calendar-selection]').getAttribute('data-selected-date'),'2026-12-01');
        // Product tab links intentionally omit CLI-only bootstrap flags. Restore
        // this harness URL before a real reload; no product state is injected.
        await page.evaluate(url=>history.replaceState(history.state,'',url),fixtureUrl);
        await page.reload();await day('2026-11-11').waitFor();await insets();await day('2026-11-15').click();assert.equal(await writes(),0);
        assert.deepEqual(await page.evaluate(()=>window.__nativeCalendarLab.tables.UserCalendarAction.find(r=>r.status==='PENDING')),receipt);
        await page.locator('[data-calendar-check]').click();await page.locator('[data-calendar-continue]').waitFor();await page.locator('[data-calendar-continue]').click();
        await page.getByText(language==='tr'?'Regl başlangıcı kaydedildi':'Period start saved',{exact:true}).waitFor();
        assert.equal(await writes(),1);assert.equal(await page.locator('[data-calendar-selection]').getAttribute('data-selected-date'),'2026-11-15');assert.equal(await day('2026-11-11').getAttribute('data-start'),'true');
        assert.equal(await page.locator('[data-calendar-recovery]').count(),0);await day('2026-11-27').click();await page.locator('[data-calendar-add]').click();await page.locator('[data-calendar-move]').waitFor();assert.equal(await writes(),2);
        const measured=await inspectMobileSurface(page,true);assert(measured.scrollWidth<=width+1);assert.deepEqual(measured.small,[]);assert.deepEqual(measured.textOverflow,[]);assert.deepEqual(measured.contrastFailures,[]);
      }
      if(directory&&width===360&&language==='tr')await page.screenshot({path:path.join(directory,key+'.png'),fullPage:true});
      assert.deepEqual(errors,[]);rows.push({key,width,height,language,safe,paint,geometry,gap,baseline,passed:baseline?undefined:true,scope:'LOCAL_SYNTHETIC_NOT_PHYSICAL'});
    }finally{await context.close();}
  }
  if(directory)await writeFile(path.join(directory,'execution.json'),JSON.stringify(rows,null,2));return rows;
}

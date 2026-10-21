import assert from 'node:assert/strict';
import path from 'node:path';
import { selectBirthplace } from './selectBirthplace.mjs';
import { inspectMobileSurface, doubleText } from './mobileSurfaceMeasurements.mjs';
const count = (page, name) => page.evaluate(name=>window.__authFixture.calls.filter(c=>c.name===name).length,name);
async function pull(page, {distance=90,multi=false}={}) {
  await page.evaluate(({distance,multi})=>{
    const target=document.querySelector('main h1');
    for(const [type,y] of [['touchstart',80],['touchmove',80+distance],['touchend',80+distance]]){
      const event=new Event(type,{bubbles:true,cancelable:true});
      Object.defineProperty(event,'touches',{value:type==='touchend'?[]:[{clientX:100,clientY:y},...(multi?[{clientX:140,clientY:y}]:[])]});
      target.dispatchEvent(event);
    }
  },{distance,multi});
}
export async function checkMobileInteractions(page,origin,directory){
  const rows=[];
  await page.setViewportSize({width:390,height:600}); await page.emulateMedia({colorScheme:'dark'});
  await page.goto(`${origin}/mobile-sheet-fixture`);
  await selectBirthplace(page,'place-countries',100);
  const started=performance.now(); await page.locator('#place-places').click(); await page.locator('[data-place-option]').first().waitFor();
  const openMs=performance.now()-started;
  assert.equal(await page.locator('[data-place-option]').count(),50);
  assert.equal(await page.locator('dialog').getAttribute('aria-labelledby'),'place-sheet-title');
  await page.locator('[data-place-option]').first().focus();await page.keyboard.press('ArrowDown');
  assert.equal(await page.evaluate(()=>document.activeElement?.getAttribute('data-place-option')),'1001');
  await page.keyboard.press('Tab');assert(await page.evaluate(()=>!!document.activeElement?.closest('dialog')));
  await doubleText(page);
  const measured=await inspectMobileSurface(page);
  const scrolling=await page.evaluate(()=>{const list=document.querySelector('.shinka-place-options');list.scrollTop=list.scrollHeight;return {list:list.scrollTop,page:scrollY,count:list.childElementCount,height:list.clientHeight};});
  assert(scrolling.list>0&&scrolling.page===0&&scrolling.height>0);
  assert.equal(await page.locator('[data-place-option="1000"]').textContent().then(t=>t.includes('#1000')),true);
  if(directory)await page.screenshot({path:path.join(directory,'birthplace-dark-long-list-200percent.png')});
  await page.goBack();await page.locator('dialog').waitFor({state:'detached'});
  assert.equal(await page.evaluate(()=>document.activeElement?.id),'place-places');
  const calls=await page.evaluate(()=>window.__sheetCalls.length);
  await page.locator('#place-places').click();await page.locator('[data-place-option]').first().waitFor();
  await page.getByRole('button',{name:'Sonraki sayfa',exact:true}).click();
  await page.locator('[data-place-option="1050"]').waitFor();
  assert.equal(await page.locator('[data-place-option]').count(),50);
  assert.equal(await page.evaluate(()=>window.__sheetCalls.length),calls+1);
  await page.locator('[data-place-option="1050"]').click();await page.locator('dialog').waitFor({state:'detached'});
  assert(await page.locator('[data-place-summary]').count());
  rows.push({scenario:'sheet-long-list-keyboard-back-focus-page-selection',openMs,scrolling,measured,passed:!measured.contrastFailures.length&&measured.scrollWidth<=391});

  const query='appFixture=1&sdkSession=admin&onboardingState=ACTIVE_EXISTING_USER&language=en';
  await page.goto(`${origin}/?${query}`);await page.locator('[data-daily-id]').waitFor();
  await page.evaluate(()=>{for(const [edge,n] of Object.entries({top:24,left:28,right:28,bottom:34}))document.documentElement.style.setProperty(`--safe-${edge}`,`${n}px`);});
  const inset=await page.evaluate(()=>({nav:getComputedStyle(document.querySelector('.shinka-product-nav')).paddingBottom,shell:getComputedStyle(document.querySelector('.shinka-safe-shell')).paddingBottom,left:getComputedStyle(document.querySelector('.shinka-safe-shell')).paddingLeft,right:getComputedStyle(document.querySelector('.shinka-safe-shell')).paddingRight,overflow:document.documentElement.scrollWidth>innerWidth}));
  assert.deepEqual(inset,{nav:'34px',shell:'0px',left:'28px',right:'28px',overflow:false});
  rows.push({scenario:'simulated-insets-single-bottom-owner',inset,passed:true,physicalInsets:false});
  await page.evaluate(()=>{for(const edge of ['top','left','right','bottom'])document.documentElement.style.removeProperty(`--safe-${edge}`);window.scrollTo(0,0);});
  const daily=await page.locator('[data-daily-id]').getAttribute('data-daily-id'), before=await count(page,'dailyMessage');
  await pull(page,{distance:25});await pull(page,{multi:true});assert.equal(await count(page,'dailyMessage'),before);
  await page.evaluate(()=>window.__authFixture.holdOperation('dailyMessage'));await pull(page);
  await page.getByRole('button',{name:'Refreshing',exact:true}).waitFor();
  await pull(page);assert.equal(await count(page,'dailyMessage'),before+1);
  assert.equal(await page.locator('[data-daily-id]').getAttribute('data-daily-id'),daily);
  await page.evaluate(()=>window.__authFixture.releaseOperation('dailyMessage'));await page.getByRole('button',{name:'Refresh',exact:true}).waitFor();
  await page.evaluate(()=>window.__authFixture.failOperation('dailyMessage'));await page.getByRole('button',{name:'Refresh',exact:true}).click();
  await page.locator('[data-refresh-control] [role=status]').filter({hasText:'Couldn’t refresh'}).waitFor();
  assert.equal(await page.locator('[data-daily-id]').getAttribute('data-daily-id'),daily);
  rows.push({scenario:'home-pull-threshold-multitouch-coalescing-offline-retention',passed:true});

  await page.locator('nav a').nth(1).click();await page.locator('[data-calendar-date]').first().waitFor();
  await page.locator('[data-calendar-date="2026-10-01"]').click();await page.locator('#calendar-start-date').fill('2026-10-02');
  const writes=await page.evaluate(()=>window.__authFixture.calls.filter(c=>c.name==='calendar'&&c.action!=='read').length);
  await page.getByRole('button',{name:'Refresh',exact:true}).click();await page.getByRole('button',{name:'Refresh',exact:true}).waitFor();
  assert.equal(await page.locator('#calendar-start-date').inputValue(),'2026-10-02');
  assert.equal(await page.evaluate(()=>window.__authFixture.calls.filter(c=>c.name==='calendar'&&c.action!=='read').length),writes);
  await page.locator('#calendar-start-date').fill('2026-10-01');await page.getByRole('button',{name:'Delete period start',exact:true}).click();await page.locator('dialog[open]').waitFor();
  const pathBefore=new URL(page.url()).pathname;await page.goBack();await page.locator('dialog').waitFor({state:'detached'});
  assert.equal(new URL(page.url()).pathname,pathBefore);
  await page.goBack();await page.locator('[data-home-root]').waitFor();await page.goForward();await page.locator('[data-calendar-root]').waitFor();
  rows.push({scenario:'calendar-read-refresh-draft-and-layer-before-route-back-forward',passed:true});

  await page.emulateMedia({reducedMotion:'reduce'});await page.locator('nav a').nth(0).click();await page.locator('[data-home-root]').waitFor();
  assert.equal(await page.locator('[data-route-motion]').evaluate(el=>getComputedStyle(el).transform),'none');
  await page.locator('[data-profile-trigger]').click();await page.locator('[data-you-heading]').waitFor();
  await page.getByRole('button',{name:'Sign Out',exact:true}).click();await page.locator('[data-onboarding-state]').waitFor();
  await page.goBack();await page.locator('[data-onboarding-state]').waitFor();
  assert.equal(await page.locator('[data-daily-id],[data-calendar-date],[data-you-root]').count(),0);
  rows.push({scenario:'reduced-motion-and-signout-back-no-private-exit-tree',passed:true});
  return rows;
}

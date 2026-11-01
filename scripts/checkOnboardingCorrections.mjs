import assert from 'node:assert/strict';
import { mkdir, readFile, writeFile } from 'node:fs/promises';
import path from 'node:path';
import { BACKGROUND_ASSETS } from '../src/foundation/sectionBackgrounds.js';
import { FIRST_CONTENT_SOURCE } from '../base44/shared/firstContentSource.js';
import { doubleText } from './mobileSurfaceMeasurements.mjs';

// Real App, services, routes and forms; only SDK IO is synthetic. The full backend
// quota/guard/adapter/HTTP chain is independently exercised by GQ10/GQ11.
export async function checkOnboardingCorrections(browser, origin, directory) {
  if(directory)await mkdir(directory,{recursive:true});
  const font=(await readFile('index.html','utf8')).match(/href="(https:\/\/fonts.googleapis.com\/css2[^\"]+)"/)[1], results=[];
  const pair=FIRST_CONTENT_SOURCE.pairs[0];
  const daily={state:'ACTIVE_EXISTING_USER',persisted:true,profile:{display_name:'Ada'},timezone:'Europe/Istanbul',daily:{id:'local-ui-daily',shinka_date:'2026-10-20',message_pair_id:'local-ui-pair',message_tr_snapshot:pair[2],suggestion_tr_snapshot:pair[3],message_en_snapshot:pair[4],suggestion_en_snapshot:pair[5]}};
  for(const language of ['tr','en'])for(const [width,height] of [[320,568],[390,844]])for(const scale of [1,2]) {
    const context=await browser.newContext({locale:language,viewport:{width,height},colorScheme:'dark'}),page=await context.newPage(),errors=[];
    page.on('pageerror',e=>errors.push(e.message));const copy=language==='tr'?{AGE_UNDER_18:'Shinka yalnızca 18 yaş ve üzeri kullanıcılar içindir',GEONAMES_QUOTA_NOT_READY:'Yer araması henüz kullanıma hazır değil.'}:{AGE_UNDER_18:'Shinka is available for users aged 18 and over',GEONAMES_QUOTA_NOT_READY:'Place search is not set up yet.'};
    await page.route('**/*',r=>{const u=new URL(r.request().url());const visual=directory&&r.request().method()==='GET'&&([BACKGROUND_ASSETS.onboardingMoon,BACKGROUND_ASSETS.watercolor,font].includes(u.href)||u.origin==='https://fonts.gstatic.com');return u.origin===origin||visual?r.continue():r.abort();});
    const scaleText=async()=>{await page.evaluate(()=>document.querySelectorAll('body *').forEach(el=>{if(el instanceof HTMLElement)el.style.removeProperty('font-size');}));if(scale===2)await doubleText(page);};
    const prepare=async()=>{
      if(directory){await page.evaluate(href=>{const l=document.createElement('link');l.rel='stylesheet';l.href=href;document.head.append(l);},font);await page.waitForFunction(()=>[...document.querySelectorAll('link')].some(l=>l.href.includes('fonts.googleapis')&&l.sheet));await page.evaluate(()=>document.fonts.ready);await page.evaluate(url=>new Promise((ok,no)=>{const i=new Image();i.onload=()=>ok(true);i.onerror=()=>no(Error('BACKGROUND_LOAD'));i.src=url;}),BACKGROUND_ASSETS.onboardingMoon);}
      await scaleText();
    };
    const capture=async name=>{if(directory)await page.screenshot({path:path.join(directory,`${name}-${language}-${width}-${scale}.png`)});};
    const fits=async()=>assert(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth+1));
    const plain=async selector=>{
      const styles=await page.locator(selector).evaluateAll(elements=>elements.map(el=>{const s=getComputedStyle(el);return {background:s.backgroundColor,border:parseFloat(s.borderTopWidth),shadow:s.boxShadow};}));
      assert(styles.length>0);assert(styles.every(s=>s.background==='rgba(0, 0, 0, 0)'&&s.border===0&&s.shadow==='none'));return styles;
    };
    try {
      await page.goto(`${origin}/?appFixture=1&sdkSession=user&language=${language}&onboardingVisual=1&placeScenario=retry`);
      await page.locator('#birth_time').waitFor();await prepare();
      for(const id of ['birth_time','birthplace']){
        await page.locator('#'+id).focus();const style=await page.locator('#'+id).evaluate(el=>{const s=getComputedStyle(el),f=getComputedStyle(el.closest('.shinka-framed-field'));return {inner:s.outlineStyle,shadow:s.boxShadow,border:parseFloat(s.borderTopWidth),outer:f.outlineStyle,label:el.labels.length};});
        assert.deepEqual(style,{inner:'none',shadow:'none',border:0,outer:'solid',label:1});await fits();await capture(id);
      }
      await page.locator('#birth_time').fill('23:59');await page.locator('[data-time-open]').click();await page.locator('[name=hour]').selectOption('01');await page.locator('[data-time-cancel]').click();assert.equal(await page.locator('#birth_time').inputValue(),'23:59');
      await page.locator('[data-time-open]').click();await page.locator('[name=hour]').selectOption('00');await page.locator('[name=minute]').selectOption('30');await page.locator('[data-time-set]').click();assert.equal(await page.locator('#birth_time').inputValue(),'00:30');
      await page.locator('[data-time-open]').click();await page.locator('[data-time-clear]').click();assert.equal(await page.locator('#birth_time').inputValue(),'');
      await page.locator('#birthplace').fill('Ka');assert.equal(await page.evaluate(()=>window.__sdkLabCalls.filter(c=>c.action==='searchPlaces').length),0);
      await page.locator('#birthplace').fill('Kan');await page.locator('[data-place-retry]').waitFor();assert((await page.locator('[data-place-status]').innerText()).includes(copy.GEONAMES_QUOTA_NOT_READY));await capture('place-setup');
      await page.locator('[data-place-retry]').click();await page.locator('[data-place-option]').first().waitFor();await page.locator('#birthplace').press('ArrowDown');await page.locator('#birthplace').press('Enter');assert.equal(await page.locator('[data-place-popup]').count(),0);
      await page.locator('[data-place-clear]').click();assert.equal(await page.locator('#birthplace').inputValue(),'');
      await page.locator('#birth_date').fill('2011-10-31');await page.locator('#birth_time').focus();await page.locator('#birth_date-error').waitFor();assert.equal(await page.locator('#birth_date-error').innerText(),copy.AGE_UNDER_18);
      await page.evaluate(()=>{window.__dateRefocus=0;document.querySelector('#birth_date').addEventListener('focus',()=>window.__dateRefocus++);});
      await page.locator('form button[type=submit]').click();await page.waitForFunction(()=>document.activeElement?.id==='birth_date-error');
      assert.equal(await page.evaluate(()=>window.__dateRefocus),0);assert.equal(await page.evaluate(()=>window.__sdkLabCalls.filter(c=>c.action==='saveProfile').length),0);
      assert.equal(await page.locator('#birth_date').getAttribute('aria-invalid'),'true');assert.equal(await page.locator('#birth_date').getAttribute('aria-describedby'),'birth_date-error');await scaleText();await fits();await capture('underage');
      await page.setViewportSize({width,height:360});await page.locator('#birth_date').fill('1990-01-01');await page.locator('#birth_date-error').waitFor({state:'detached'});await fits();await page.setViewportSize({width,height});
      await page.locator('form button[type=submit]').click();await page.locator('[data-onboarding-step="5"]').waitFor();assert.equal(await page.evaluate(()=>window.__sdkLabCalls.filter(c=>c.action==='saveProfile').length),1);
      await page.locator('[data-onboarding-back]').click();await page.locator('#birth_date').waitFor();assert.equal(await page.locator('#birth_date').inputValue(),'1990-01-01');assert.equal(await page.locator('#birth_time').inputValue(),'');
      await page.goto(`${origin}/?appFixture=1&sdkSession=user&language=${language}&onboardingState=FIRST_SHINKA_DEPENDENCY&holdDaily=1&dailyScenario=retry`);
      await page.locator('[data-daily-state=loading]').waitFor();await prepare();await plain('main > section');await fits();await capture('preparing');
      await page.evaluate(()=>window.__authFixture.releaseOperation('dailyMessage'));await page.locator('[data-daily-state=notReady]').waitFor();await plain('main > section');await capture('preparation');
      await page.evaluate(value=>{window.__dailyFixture=value;},daily);await page.locator('[data-daily-state] button').click();await page.locator('[data-daily-id="local-ui-daily"]').waitFor();
      await scaleText();await plain('[data-daily-id] > section');assert.equal(await page.locator('[data-daily-message]').textContent(),language==='tr'?pair[2]:pair[4]);assert.equal(await page.locator('[data-daily-suggestion]').textContent(),language==='tr'?pair[3]:pair[5]);await fits();await capture('home');
      assert.equal(errors.length,0);results.push({language,width,height,scale,passed:true,physicalDevice:false,scope:'LOCAL_REAL_APP_SYNTHETIC_SDK',pageErrors:errors});
    } finally {await context.close();}
  }
  if(directory)await writeFile(path.join(directory,'execution.json'),JSON.stringify(results,null,2));return results;
}

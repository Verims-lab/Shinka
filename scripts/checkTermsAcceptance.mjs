import assert from 'node:assert/strict';
import { mkdir, writeFile } from 'node:fs/promises';
import path from 'node:path';
import { doubleText } from './mobileSurfaceMeasurements.mjs';

const urls=['https://shinkadaily.com/terms/','https://shinkadaily.com/privacy/'];
export async function checkTermsAcceptance(browser,origin,directory){
  const results=[];
  if(directory)await mkdir(directory,{recursive:true});
  for(const language of ['tr','en'])for(const [width,height] of [[320,568],[360,640],[390,844],[430,932],[768,1024],[844,390]])for(const scale of [1,2]){
    const context=await browser.newContext({locale:language==='tr'?'tr-TR':'en-US',viewport:{width,height},colorScheme:scale===1?'light':'dark',hasTouch:true}),page=await context.newPage();
    const errors=[];page.on('pageerror',error=>errors.push(error.message));
    await page.route('**/*',route=>new URL(route.request().url()).origin===origin?route.continue():route.abort());
    try{
      await page.goto(`${origin}/login?appFixture=1&sdkSession=anonymous&language=${language}`);
      await page.locator('[data-auth-shell]').waitFor();
      if(scale===2)await doubleText(page);
      const measurements=await page.evaluate(()=>{
        const panel=document.querySelector('[data-auth-shell]'),age=panel.querySelector('#age-declaration'),terms=panel.querySelector('#terms-declaration');
        const texts=[...panel.querySelectorAll('.shinka-declaration-copy')],heading=panel.closest('main').querySelector('h1'),description=heading.nextElementSibling;
        const box=element=>{const r=element.getBoundingClientRect(),s=getComputedStyle(element);return {x:r.x,y:r.y+scrollY,width:r.width,height:r.height,font:s.fontSize,family:s.fontFamily,weight:s.fontWeight,align:s.textAlign,text:element.textContent};};
        const before={heading:box(heading),description:box(description),age:box(age.labels[0]),fonts:texts.map(text=>parseFloat(getComputedStyle(text).fontSize)),checkbox:box(age)};
        const originalFont=texts[0].style.fontSize;
        panel.style.paddingBlockStart='0px';texts[0].style.fontSize='1em';
        const baseline={heading:box(heading),description:box(description),age:box(age.labels[0]),font:parseFloat(getComputedStyle(texts[0]).fontSize)};
        panel.style.removeProperty('padding-block-start');texts[0].style.fontSize=originalFont;
        return {before,baseline,checked:[age.checked,terms.checked],names:[age.labels[0].textContent,terms.labels[0].textContent],privacy:panel.querySelector('.shinka-privacy-information').textContent,links:[...panel.querySelectorAll('a')].map(link=>({url:link.href,text:link.textContent,height:link.getBoundingClientRect().height})),checkboxCount:panel.querySelectorAll('[type=checkbox]').length,overflow:document.documentElement.scrollWidth>innerWidth+1,light:!document.documentElement.classList.contains('dark')};
      });
      assert.deepEqual(measurements.before.heading,measurements.baseline.heading,'Welcome geometry and type do not move');
      assert.deepEqual(measurements.before.description,measurements.baseline.description,'description stays unchanged');
      assert(Math.abs(measurements.before.age.y-measurements.baseline.age.y-height*.05)<.6,'only the consent section moves five viewport units');
      for(const font of measurements.before.fonts)assert(Math.abs(font-measurements.baseline.font*.7)<.05,'both declaration labels are exactly 70%');
      assert.equal(measurements.before.checkbox.width,24);assert.equal(measurements.before.checkbox.height,24);
      assert.deepEqual(measurements.checked,[false,false]);assert.equal(measurements.checkboxCount,2);assert(!measurements.overflow&&measurements.light);
      assert.deepEqual(measurements.links.map(link=>link.url),urls);assert(measurements.links.every(link=>link.height>=44));
      assert.equal(measurements.names[1],language==='tr'?'Kullanım Koşullarını kabul ediyorum':'I agree to the Terms of Use');
      assert.equal(await page.getByRole('checkbox',{name:measurements.names[1],exact:true}).count(),1,'full Terms sentence labels the checkbox for assistive technology');
      assert.equal(measurements.privacy,language==='tr'?'Kişisel verilerinizi Gizlilik Politikamız kapsamında koruyoruz.':'We handle your personal information in our Privacy Policy.');
      for(const selector of ['label[for=age-declaration]','label[for=terms-declaration]','.shinka-legal-link','[data-provider=apple]','[data-provider=google]']){
        for(const control of await page.locator(selector).all()){
          await control.scrollIntoViewIfNeeded();
          assert(await control.evaluate(element=>{const r=element.getBoundingClientRect(),hit=document.elementFromPoint(r.left+r.width/2,r.top+r.height/2);return r.height>=44&&element.contains(hit);}),`${selector} is reachable and unobscured`);
        }
      }
      // Interactive descendants of a label must open their link without label activation.
      const termsLink=page.getByRole('link',{name:language==='tr'?'Kullanım Koşullarını':'Terms of Use',exact:true});
      const popupPromise=context.waitForEvent('page');await termsLink.click();const popup=await popupPromise;await popup.close();
      assert.equal(await page.locator('#terms-declaration').isChecked(),false);
      await termsLink.focus();assert(await termsLink.evaluate(el=>document.activeElement===el));
      await page.locator('#terms-declaration').focus();await page.keyboard.press('Space');assert(await page.locator('#terms-declaration').isChecked());
      await page.locator('#terms-declaration').uncheck();
      if(directory&&width===390&&scale===1)await page.screenshot({path:path.join(directory,`welcome-${language}.png`),fullPage:true});
      assert.deepEqual(errors,[]);results.push({language,width,height,scale,measurements,passed:true});
    }finally{await context.close();}
  }
  for(const language of ['tr','en']){
    const context=await browser.newContext({locale:language==='tr'?'tr-TR':'en-US',viewport:{width:390,height:844}}),page=await context.newPage();
    await page.route('**/*',route=>new URL(route.request().url()).origin===origin?route.continue():route.abort());
    const open=async()=>{await page.goto(`${origin}/login?appFixture=1&sdkSession=user&termsFixture=1&authFirst=new&language=${language}`);await page.locator('[data-terms-gate]').waitFor();await page.locator('[data-terms-accept]:not(:disabled)').waitFor();};
    const confirm=async()=>{await page.locator('#age-declaration').check();await page.locator('#terms-declaration').check();};
    const privateCalls=()=>page.evaluate(()=>window.__sdkLabCalls.filter(call=>['onboarding','dailyMessage','you','pattern','calendar','adminTestTools','internalHealth'].includes(call.name)));
    try{
      // All combinations for both actual SDK dispatch paths.
      await page.goto(`${origin}/login?appFixture=1&sdkSession=anonymous&language=${language}`);await page.locator('[data-auth-shell]').waitFor();
      for(const provider of ['apple','google'])for(const age of [false,true])for(const terms of [false,true]){
        await page.locator('#age-declaration').setChecked(age);await page.locator('#terms-declaration').setChecked(terms);
        const count=await page.evaluate(()=>window.__authFixture.providerCalls.length);
        await page.locator(`[data-provider=${provider}]`).click();
        await page.locator(age&&terms?'[data-error-code=AUTH_PROVIDER_FAILED]':age?'#terms-error':'#age-error').waitFor();
        assert.equal(await page.evaluate(()=>window.__authFixture.providerCalls.length),count+Number(age&&terms));
      }
      await page.locator('[data-auth-returning]').click();assert.equal(await page.locator('#terms-declaration').count(),0);assert(!await page.locator('#age-declaration').isChecked());
      await page.locator('[data-provider=apple]').click();await page.locator('#age-error').waitFor();await page.locator('#age-declaration').check();await page.locator('[data-provider=apple]').click();await page.locator('[data-error-code=AUTH_PROVIDER_FAILED]').waitFor();
      assert.equal(await page.evaluate(()=>window.__authFixture.providerCalls.at(-1).returnTo),'/login');
      // New-user declaration crosses only the matching callback; it is recorded
      // after native identity and server policy are read, before personal hydration.
      await page.goto(`${origin}/login?appFixture=1&sdkSession=anonymous&termsFixture=1&authFirst=new&language=${language}`);await page.locator('[data-auth-shell]').waitFor();
      await page.evaluate(()=>window.__authFixture.providerMode('redirect'));await confirm();await page.locator('[data-provider=google]').click();
      await page.waitForFunction(()=>window.__authFixture.providerCalls.length===1);
      await page.evaluate(async()=>{const callback=new URL(window.__authFixture.providerCalls[0].returnTo,location.origin);callback.searchParams.set('appFixture','1');history.pushState(history.state,'',callback);window.__authFixture.setSession('user');await window.__appAuth.checkAppState();});
      await page.locator('#display_name').waitFor();assert.equal(await page.evaluate(()=>window.__authFixture.termsEvents.length),1);assert.equal(new URL(page.url()).searchParams.has('terms_intent'),false);
      assert.equal(await page.evaluate(()=>sessionStorage.getItem('shinka.terms-intent.v1')),null);
      await open();assert.deepEqual(await privateCalls(),[]);assert(!await page.locator('#age-declaration').isChecked()&&!await page.locator('#terms-declaration').isChecked());
      await confirm();await page.locator('[data-terms-accept]').click();await page.locator('#display_name').waitFor();
      const initial=await page.evaluate(()=>structuredClone(window.__authFixture.termsEvents));assert.equal(initial.length,1);
      await page.evaluate(()=>window.__appAuth.checkAppState());await page.locator('#display_name').waitFor();assert.deepEqual(await page.evaluate(()=>window.__authFixture.termsEvents),initial);assert.equal(await page.locator('[data-terms-gate]').count(),0);
      // Passive session verification detects a changed version before granting any new route.
      await page.evaluate(async()=>{window.__authFixture.termsVersion('test-terms-v2');await window.__appAuth.checkUserAuth();});await page.locator('[data-terms-gate]').waitFor();await page.locator('[data-terms-accept]:not(:disabled)').waitFor();assert(!await page.locator('#terms-declaration').isChecked());
      await confirm();await page.locator('[data-terms-accept]').click();await page.locator('#display_name').waitFor();assert.equal(await page.evaluate(()=>window.__authFixture.termsEvents.length),2);
      // Lost acknowledgement: no onboarding request until a separate read confirms persistence.
      await open();await page.evaluate(()=>window.__authFixture.termsWriteFailure('after'));await confirm();await page.locator('[data-terms-accept]').click();await page.locator('[data-terms-error=TERMS_WRITE_UNCONFIRMED]').waitFor();assert.deepEqual(await privateCalls(),[]);
      assert.equal(await page.locator('[data-terms-retry]').count(),0);await page.locator('[data-terms-check]').click();await page.locator('#display_name').waitFor();assert.equal(await page.evaluate(()=>window.__authFixture.termsEvents.length),1);
      // Failed-before-write: failed read cannot enable retry; successful absent read enables only the same intent.
      await open();await page.evaluate(()=>window.__authFixture.termsWriteFailure('before'));await confirm();await page.locator('[data-terms-accept]').click();await page.locator('[data-terms-error=TERMS_WRITE_UNCONFIRMED]').waitFor();
      await page.evaluate(()=>window.__authFixture.termsReadFailure(true));await page.locator('[data-terms-check]').click();await page.locator('[data-terms-error=TERMS_STATE_UNAVAILABLE]').waitFor();assert.equal(await page.locator('[data-terms-retry]').count(),0);assert.deepEqual(await privateCalls(),[]);
      await page.evaluate(()=>{window.__authFixture.termsReadFailure(false);window.__authFixture.termsWriteFailure(null);});await page.locator('[data-terms-check]').click();await page.locator('[data-terms-retry]').waitFor();await page.locator('[data-terms-retry]').click();await page.locator('#display_name').waitFor();
      // Configuration and owner privacy exceptions fail/operate independently.
      await open();await page.evaluate(async()=>{window.__authFixture.termsVersion(null);await window.__appAuth.checkUserAuth();});await page.locator('[data-terms-error=TERMS_CONFIGURATION_REQUIRED]').waitFor();assert.deepEqual(await privateCalls(),[]);
      await page.goto(`${origin}/account-privacy?appFixture=1&sdkSession=user&termsFixture=1&language=${language}`);await page.locator('[data-privacy-actions]').waitFor();assert.equal(await page.locator('[data-terms-gate]').count(),0);
      results.push({language,flow:'both-provider-matrix-returning-current-outdated-failed-unknown-config-privacy',passed:true});
    }finally{await context.close();}
  }
  const receipt={scope:'LOCAL_REAL_APP_SYNTHETIC_SDK',hostedVerified:false,results};
  if(directory)await writeFile(path.join(directory,'terms.json'),JSON.stringify(receipt,null,2));
  return receipt;
}

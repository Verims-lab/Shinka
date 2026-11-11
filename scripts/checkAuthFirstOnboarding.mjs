import assert from 'node:assert/strict';
import { doubleText } from './mobileSurfaceMeasurements.mjs';
import { checkSignInLayout } from './checkOnboardingLayers.mjs';
import { BUILD_MARKER } from '../src/foundation/buildMarker.js';

// Actual App/AuthProvider/controller and real onboarding + daily handlers. Only
// transport/provider is isolated; no credential, hosted user or real OAuth.
export async function checkAuthFirstOnboarding(browser, origin) {
 const results=[];
 for(const language of ['tr','en'])for(const width of [360,390]) {
  const context=await browser.newContext({locale:language==='tr'?'tr-TR':'en-US',viewport:{width,height:844}}),page=await context.newPage();
  await page.route('**/*',r=>new URL(r.request().url()).origin===origin?r.continue():r.abort());
  await page.addInitScript(() => {
   const attr = 'data-onboarding-state', selector = `[${attr}]`;
   const seen = [];
   window.__seenOnboarding = seen;
   const record = state => { if (state && !seen.includes(state)) seen.push(state); };
   new MutationObserver(changes => {
    for (const change of changes) {
     if (change.type === 'attributes') {
      record(change.oldValue);
      record(change.target.getAttribute(attr));
     } else {
      for (const node of change.addedNodes) {
       if (!(node instanceof Element)) continue;
       record(node.getAttribute(attr));
       for (const screen of node.querySelectorAll(selector)) record(screen.getAttribute(attr));
      }
     }
    }
   }).observe(document, { childList: true, subtree: true, attributes: true, attributeFilter: [attr], attributeOldValue: true });
  });
  const next=()=>page.getByRole('button',{name:language==='tr'?'Devam et':'Continue',exact:true});
  const back=page.locator('[data-onboarding-back]');
  const nameStep='AUTHENTICATED_NAME_REQUIRED', profileStep='AUTHENTICATED_PROFILE_REQUIRED';
  const cycleStep='AUTHENTICATED_CYCLE_STEP', preparation='FIRST_SHINKA_DEPENDENCY';
  const state=s=>page.locator(`[data-onboarding-state="${s}"]`).waitFor();
  const home=page.locator('[data-home-root] [data-daily-id]');
  const observed=()=>page.evaluate(()=>window.__seenOnboarding);
  const pending=async()=>{
   await page.waitForFunction(()=>window.__sdkLabCalls.some(c=>c.name==='onboarding'&&c.action==='hydrate'));
   assert.equal(await page.locator('[data-onboarding-state],[data-home-root]').count(),0,'progress must be verified before opening a screen');
  };
  const assertReadOnly=async()=>{
   assert.equal(await page.evaluate(()=>window.__sdkLabCalls.filter(c=>c.name==='onboarding'&&c.action!=='hydrate').length),0);
   assert.deepEqual(await page.evaluate(()=>window.__authFixture.providerCalls),[]);
  };
  const errors=[];page.on('pageerror',e=>errors.push(e.message));
  try {
   await page.goto(`${origin}/?appFixture=1&sdkSession=anonymous&authFirst=new&language=${language}`);
   await state('UNAUTHENTICATED_INTRO');await page.getByRole('button',{name:language==='tr'?'Başla':'Begin',exact:true}).click();await state('UNAUTHENTICATED_SIGN_IN');
   const welcome = await checkSignInLayout(page);
   assert.equal(welcome.buildMarker, BUILD_MARKER);
   const age=page.locator('#age-declaration');
   assert.equal(await page.locator('#display_name,#birth_date').count(),0);
   assert.equal(await page.evaluate(()=>window.__sdkLabCalls.filter(c=>c.name==='onboarding').length),0);
   const providerCalls = () => page.evaluate(() => window.__authFixture.providerCalls);
   const providerButton = provider => page.locator(`[data-provider="${provider}"]`);
   for (const provider of welcome.providers) {
    await providerButton(provider).click();
    await page.locator('#age-error').waitFor();
    assert.deepEqual(await providerCalls(), [], 'unchecked age cannot start either OAuth flow');
   }
   await age.check();
   const expectedCalls = [];
   for (const provider of welcome.providers) {
    await providerButton(provider).click();
    await page.locator('[data-error-code="AUTH_PROVIDER_FAILED"]').waitFor();
    expectedCalls.push({ provider, returnTo: '/login' });
    assert.deepEqual(await providerCalls(), expectedCalls);
   }
   // Model the provider's /login return entry with the real App admission path.
   await page.evaluate(async()=>{
    const callback=new URL(location.href);
    callback.pathname='/login';
    history.pushState(history.state,'',callback);
    window.dispatchEvent(new PopStateEvent('popstate'));
    window.__authFixture.setSession('user');
    await window.__appAuth.checkAppState();
   });
   await state(nameStep);
   await page.evaluate(()=>{window.__seenOnboarding.length=0;});
   await page.goBack();
   await page.waitForURL(url=>url.pathname==='/');
   await state(nameStep);
   assert.equal(await back.count(),0,'no earlier authenticated step before name');
   assert(await page.getByRole('button',{name:language==='tr'?'Çıkış yap':'Sign out',exact:true}).isVisible());
   await doubleText(page);
   const name=page.getByRole('textbox',{name:language==='tr'?'Adın':'Name',exact:true});
   await name.fill('Shinka Ada');await next().click();await state(profileStep);
   await back.click();await state(nameStep);assert.equal(await name.inputValue(),'Shinka Ada');
   await name.fill('');
   await page.getByRole('button',{name:language==='tr'?'Belirtmek istemiyorum':'Prefer not to say',exact:true}).click();
   await state(profileStep);
   await page.locator('#birth_date').fill('1990-01-01');await next().click();await state(cycleStep);
   await back.click();await state(profileStep);
   assert.equal(await back.count(),0,'saved NULL name must not reopen the name step');
   assert.equal(await page.locator('#birth_date').inputValue(),'1990-01-01');
   await next().click();await state(cycleStep);
   await page.evaluate(()=>window.__authFixture.holdOperation('dailyMessage'));
   await page.getByRole('button',{name:language==='tr'?'Şimdilik geç':'Skip for now',exact:true}).click();
   await state(preparation);
   assert.equal(await back.count(),0,'preparation must not send a signed-in user back to Welcome or cycle');
   await page.evaluate(()=>window.__authFixture.releaseOperation('dailyMessage'));
   await home.waitFor();
   assert.deepEqual(await page.evaluate(()=>{
    const rows=window.__authFirstLab.rows;
    return [rows.user_profile[0].display_name,rows.user_period_record.length,rows.user_health_consent.length,rows.user_daily_message.length];
   }),[null,0,0,1]);
   await page.evaluate(async()=>{await window.__appAuth.checkAppState();});await home.waitFor();
   assert.deepEqual(await observed(),[nameStep,profileStep,cycleStep,preparation]);
   assert.deepEqual(await providerCalls(),expectedCalls);
   assert.equal(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth+1),true);
   results.push({language,width,textScale:2,scenario:'intro-oauth-history-back-optional-name-cycle-home-reopen',
    providerDispatch:expectedCalls,passed:true});

   const openVerified=(route,scenario)=>page.goto(`${origin}${route}?appFixture=1&sdkSession=user&authFirst=${scenario}&language=${language}&holdHydration=1${scenario==='preparation'?'&holdDaily=1':''}`);
   for(const [scenario,route,target] of [
    ['new','/onboarding',nameStep],
    ['partial','/login',profileStep],
    ['cycle','/',cycleStep],
    ['preparation','/login',preparation],
    ['complete','/onboarding',null],
    ['null-name','/login',null],
   ]) {
    await openVerified(route,scenario);
    for (const reopen of [false,true]) {
     if(reopen) await page.reload();
     await pending();
     await page.evaluate(()=>window.__authFixture.releaseHydration());
     if(target) await state(target); else await home.waitFor();
     assert.deepEqual(await observed(),target?[target]:[],'fresh admission must open only the verified step');
     assert.equal(await back.count(),target===cycleStep?1:0);
     await assertReadOnly();
    }
    results.push({language,width,scenario:`${scenario}-held-hydrate-and-reload`,passed:true});
   }

   await openVerified('/login','cycle');
   await pending();
   await page.evaluate(()=>{
    window.__authFixture.overrideNextHydration({state:'ACTIVE_EXISTING_USER',completionReady:true,
     profile:null,preferences:{timezone:'UTC',language_code:'en'},today:'2026-10-20'});
    window.__authFixture.releaseHydration();
   });
   await page.getByText('ONBOARDING_READBACK_CONFLICT',{exact:true}).waitFor();
   assert.deepEqual(await observed(),[]);
   assert.equal(await page.locator('[data-home-root]').count(),0);
   const retry=page.getByRole('button',{name:/Retry|Tekrar dene/i});
   await page.evaluate(()=>window.__authFixture.failOperation('onboarding.hydrate'));
   await retry.click();
   await page.getByText('ONBOARDING_OPERATION_FAILED',{exact:true}).waitFor();
   assert.deepEqual(await observed(),[]);
   assert.equal(await page.locator('[data-home-root]').count(),0);
   await retry.click();await state(cycleStep);
   assert.deepEqual(await observed(),[cycleStep]);
   await assertReadOnly();
   results.push({language,width,scenario:'invalid-then-unavailable-progress-retry',passed:true});
   assert.deepEqual(errors,[]);
  }catch(error){
   console.error(JSON.stringify({authFirstFailure:{language,width,state:await page.evaluate(()=>document.querySelector('[data-onboarding-state]')?.getAttribute('data-onboarding-state')),alerts:await page.locator('[role=alert]').allTextContents(),calls:await page.evaluate(()=>window.__sdkLabCalls)}}));throw error;
  }finally{await context.close();}
 }
 return results;
}

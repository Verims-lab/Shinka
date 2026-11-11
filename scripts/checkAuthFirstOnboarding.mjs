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
   const seen = { name: false, signIn: false };
   window.__seenOnboarding = seen;
   new MutationObserver(() => {
    seen.name ||= !!document.querySelector('#display_name');
    seen.signIn ||= !!document.querySelector('#age-declaration,[data-provider]');
   }).observe(document, { childList: true, subtree: true });
  });
  const next=()=>page.getByRole('button',{name:language==='tr'?'Devam et':'Continue',exact:true});
  const state=s=>page.locator(`[data-onboarding-state="${s}"]`).waitFor();
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
   // Synthetic provider callback: use the unchanged real admission path once.
   await page.evaluate(async()=>{window.__authFixture.setSession('user');await window.__appAuth.checkAppState();});
   await state('AUTHENTICATED_NAME_REQUIRED');
   await page.locator('[data-onboarding-back]').click();await state('UNAUTHENTICATED_SIGN_IN');
   assert.equal(await page.locator('#age-declaration,[data-provider]').count(),0);
   assert(await next().isVisible());
   await next().click();await state('AUTHENTICATED_NAME_REQUIRED');
   await doubleText(page);
   const name=page.getByRole('textbox',{name:language==='tr'?'Adın':'Name',exact:true});await name.fill('Shinka Ada');await next().click();await state('AUTHENTICATED_PROFILE_REQUIRED');
   await page.locator('[data-onboarding-back]').click();await state('AUTHENTICATED_NAME_REQUIRED');assert.equal(await name.inputValue(),'Shinka Ada');await next().click();await state('AUTHENTICATED_PROFILE_REQUIRED');
   await page.locator('#birth_date').fill('1990-01-01');await next().click();await state('AUTHENTICATED_CYCLE_STEP');
   await page.getByRole('button',{name:language==='tr'?'Şimdilik geç':'Skip for now',exact:true}).click();
   await page.locator('[data-home-root] [data-daily-id]').waitFor();
   assert.equal(await page.evaluate(()=>window.__authFirstLab.rows.user_profile[0].display_name),'Shinka Ada');
   assert.equal(await page.evaluate(()=>window.__authFirstLab.rows.user_daily_message.length),1);
   await page.evaluate(async()=>{await window.__appAuth.checkAppState();});await page.locator('[data-home-root] [data-daily-id]').waitFor();
   assert.equal(await page.locator('#display_name').count(),0);assert.equal(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth+1),true);
   results.push({language,width,textScale:2,scenario:'intro-login-name-profile-cycle-home-reopen',
    providerDispatch:expectedCalls,authenticatedWelcome:'CONTINUE',passed:true});
   for(const scenario of ['complete','null-name','partial']) {
    await page.goto(`${origin}/login?appFixture=1&sdkSession=user&authFirst=${scenario}&language=${language}&holdHydration=1`);
    await page.waitForFunction(()=>window.__sdkLabCalls.some(c=>c.name==='onboarding'));
    assert.equal(await page.locator('#display_name,#age-declaration,[data-provider]').count(),0);
    await page.evaluate(()=>window.__authFixture.releaseHydration());
    if(scenario==='partial')await state('AUTHENTICATED_PROFILE_REQUIRED');else await page.locator('[data-home-root] [data-daily-id]').waitFor();
    assert.deepEqual(await page.evaluate(()=>window.__seenOnboarding),{name:false,signIn:false});
    assert.equal(await page.locator('[data-provider],#age-declaration,#display_name').count(),0);
    assert.equal(await page.evaluate(()=>window.__sdkLabCalls.filter(c=>c.name==='onboarding'&&c.action!=='hydrate').length),0);
    await page.reload();if(scenario==='partial'){await page.waitForFunction(()=>window.__sdkLabCalls.some(c=>c.name==='onboarding'));await page.evaluate(()=>window.__authFixture.releaseHydration());await state('AUTHENTICATED_PROFILE_REQUIRED');}else {await page.waitForFunction(()=>window.__sdkLabCalls.some(c=>c.name==='onboarding'));await page.evaluate(()=>window.__authFixture.releaseHydration());await page.locator('[data-home-root] [data-daily-id]').waitFor();}
    assert.deepEqual(await page.evaluate(()=>window.__seenOnboarding),{name:false,signIn:false});
    results.push({language,width,scenario:`${scenario}-held-callback-no-name-reload`,passed:true});
   }
   assert.deepEqual(errors,[]);
  }catch(error){
   console.error(JSON.stringify({authFirstFailure:{language,width,state:await page.evaluate(()=>document.querySelector('[data-onboarding-state]')?.getAttribute('data-onboarding-state')),alerts:await page.locator('[role=alert]').allTextContents(),calls:await page.evaluate(()=>window.__sdkLabCalls)}}));throw error;
  }finally{await context.close();}
 }
 return results;
}

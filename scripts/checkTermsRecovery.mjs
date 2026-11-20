import assert from 'node:assert/strict';
import { doubleText } from './mobileSurfaceMeasurements.mjs';

// Real App/auth gate; isolated transport, no legal agreement on a live account.
export async function checkTermsRecovery(browser, origin) {
 const results=[];
 for(const language of ['tr','en']) {
  const context=await browser.newContext({locale:language==='tr'?'tr-TR':'en-US',viewport:{width:360,height:780}}),page=await context.newPage();
  await page.route('**/*',r=>new URL(r.request().url()).origin===origin?r.continue():r.abort());
  const open=async()=>{await page.goto(`${origin}/login?appFixture=1&sdkSession=user&termsFixture=1&authFirst=new&language=${language}`);await page.locator('[data-terms-accept]:not(:disabled)').waitFor();};
  const confirm=async()=>{await page.locator('#age-declaration').check();await page.locator('#terms-declaration').check();};
  const writes=()=>page.evaluate(()=>window.__sdkLabCalls.filter(c=>c.name==='termsAcceptance'&&c.action==='accept').length);
  try {
   await open();
   await page.evaluate(()=>window.__authFixture.termsVersion(null));
   await page.locator('[data-terms-check]').click();await page.locator('[data-terms-error=TERMS_CONFIGURATION_REQUIRED]').waitFor();
   await confirm();
   assert.equal(await page.locator('[data-terms-error=TERMS_CONFIGURATION_REQUIRED]').count(),1,'checking declarations must not erase the configuration blocker');
   assert.equal(await page.locator('[data-terms-accept]').count(),0);assert.equal(await writes(),0);
   // Opening the legal document does not accept it. Return refreshes readiness only.
   const popupWait=context.waitForEvent('page');await page.getByRole('link',{name:language==='tr'?'Kullanım Koşullarını':'Terms of Use',exact:true}).click();const popup=await popupWait;await popup.close();
   await page.evaluate(()=>{window.__authFixture.termsVersion('test-terms-v2');window.dispatchEvent(new Event('focus'));});
   await page.locator('[data-terms-accept]:not(:disabled)').waitFor();
   assert(!await page.locator('#terms-declaration').isChecked(),'a newly available version requires explicit review');assert.equal(await writes(),0);
   await confirm();await doubleText(page);assert(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth+1));
   await page.locator('[data-terms-accept]').click();await page.locator('#display_name').waitFor();assert.equal(await writes(),1);
   // A changed version before the first write also invalidates the checked draft.
   await open();await confirm();await page.evaluate(()=>window.__authFixture.termsVersion('test-terms-v2'));
   await page.locator('[data-terms-check]').click();await page.locator('[data-terms-error=TERMS_VERSION_CHANGED]').waitFor();
   assert(!await page.locator('#terms-declaration').isChecked());assert.equal(await writes(),0);
   results.push({language,scenario:'video-config-blocker-document-return-new-version-explicit-accept',passed:true});
   for(const [status,code] of [[401,'AUTH_REQUIRED'],[403,'TERMS_FORBIDDEN'],[429,'TERMS_RATE_LIMITED'],[503,'TERMS_TEMPORARILY_UNAVAILABLE']]){
    await open();await confirm();await page.evaluate(status=>window.__authFixture.termsReadFailure(status),status);
    await page.locator('[data-terms-check]').click();await page.locator(`[data-terms-error=${code}]`).waitFor();
    assert.equal(await page.locator('[data-terms-accept]').count(),0);assert.equal(await writes(),0);
    await page.evaluate(()=>window.__authFixture.termsReadFailure(false));await page.locator('[data-terms-check]').click();await page.locator('[data-terms-accept]:not(:disabled)').waitFor();
    results.push({language,scenario:`read-${status}-no-accept-recovery`,passed:true});
   }
   await open();await confirm();await page.evaluate(()=>window.__authFixture.holdOperation('termsAcceptance'));
   await page.locator('[data-terms-accept]').evaluate(button=>{button.click();button.click();});
   await page.waitForFunction(()=>window.__sdkLabCalls.some(c=>c.name==='termsAcceptance'&&c.action==='accept'));assert.equal(await writes(),1);
   await page.evaluate(()=>window.__authFixture.releaseOperation('termsAcceptance'));await page.locator('#display_name').waitFor();assert.equal(await writes(),1);
   results.push({language,scenario:'double-confirm-single-write',passed:true});
   await open();await confirm();
   await page.evaluate(()=>window.__authFixture.termsSession({state:'REQUIRED',version:'test-terms-v1'}));
   await page.locator('[data-terms-accept]').click();await page.locator('[data-terms-error=TERMS_SESSION_UNCONFIRMED]').waitFor();
   assert.equal(await page.locator('#display_name').count(),0);assert.equal(await writes(),1);
   await page.evaluate(()=>window.__authFixture.termsSession(null));await page.locator('[data-terms-check]').click();await page.locator('#display_name').waitFor();assert.equal(await writes(),1);
   results.push({language,scenario:'saved-acceptance-lagging-session-no-remount-loop',passed:true});
   await open();await page.clock.install();await page.evaluate(()=>window.__authFixture.holdOperation('termsAcceptance'));
   await page.locator('[data-terms-check]').evaluate(button=>{button.click();button.click();});
   await page.clock.runFor(15001);await page.locator('[data-terms-error=TERMS_TIMEOUT]').waitFor();
   assert(await page.locator('[data-terms-check]').isEnabled());assert.equal(await writes(),0);
   await page.evaluate(()=>window.__authFixture.releaseOperation('termsAcceptance'));assert.equal(await page.locator('[data-terms-accept]').count(),0);
   await page.locator('[data-terms-check]').click();await page.locator('[data-terms-accept]:not(:disabled)').waitFor();
   // A held old-owner result is discarded on account switch and after unmount.
   await page.evaluate(()=>window.__authFixture.holdOperation('termsAcceptance'));await page.locator('[data-terms-check]').click();
   await page.evaluate(async()=>{window.__authFixture.setSession('anonymous');await window.__appAuth.checkAppState();});await page.locator('[data-auth-shell]').waitFor();
   await page.evaluate(()=>window.__authFixture.releaseOperation('termsAcceptance'));assert.equal(await page.locator('[data-terms-gate],#display_name').count(),0);assert.equal(await writes(),0);
   results.push({language,scenario:'bounded-status-coalescing-late-old-owner-unmount',passed:true});
   await page.clock.resume();
   await page.goto(`${origin}/login?appFixture=1&sdkSession=anonymous&language=${language}`);await page.locator('[data-auth-shell]').waitFor();
   await page.evaluate(()=>{window.__authFixture.termsVersion(null);window.dispatchEvent(new Event('focus'));});await page.locator('[data-policy-error=TERMS_CONFIGURATION_REQUIRED]').waitFor();
   await confirm();assert.equal(await page.evaluate(()=>window.__authFixture.providerCalls.length),0);
   await page.evaluate(()=>window.__authFixture.termsVersion('test-terms-v2'));await page.locator('[data-policy-check]').click();await page.locator('[data-policy-check]').waitFor({state:'detached'});
   assert(!await page.locator('#terms-declaration').isChecked());assert.equal(await page.evaluate(()=>window.__authFixture.providerCalls.length),0);
   results.push({language,scenario:'anonymous-policy-retry-ready-without-provider-or-accept',passed:true});

  } finally {await context.close();}
 }
 return results;
}

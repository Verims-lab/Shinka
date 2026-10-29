import assert from 'node:assert/strict';
import { FIRST_CONTENT_SOURCE } from '../base44/shared/firstContentSource.js';
// Real App/router/controllers. Only SDK transport is synthetic. No live data.
export async function checkProductNavigation(page, origin) {
  const pair = FIRST_CONTENT_SOURCE.pairs[0];
  await page.addInitScript(pair => { window.__dailyFixture = { state: 'ACTIVE_EXISTING_USER', persisted: true, profile: { display_name: 'Synthetic navigation' }, daily: { id: 'navigation-day', shinka_date: '2026-10-20', message_tr_snapshot: pair[2], suggestion_tr_snapshot: pair[3], message_en_snapshot: pair[4], suggestion_en_snapshot: pair[5] } }; }, pair);
  await page.goto(`${origin}/?appFixture=1&sdkSession=user&onboardingState=ACTIVE_EXISTING_USER&language=tr`);
  await page.locator('[data-daily-id]').waitFor();
  const calls = () => page.evaluate(() => window.__authFixture.calls);
  const initial = await calls();
  await page.locator('nav a:visible').nth(1).hover();
  await page.locator('nav a:visible').nth(2).focus();
  assert.deepEqual(await calls(), initial, 'navigation focus/hover triggered backend prefetch');
  const ready = { calendar: '#calendar-start-date', pattern: '[data-lunar-summary]', you: '[data-you-consent]', home: '[data-daily-id]' };
  for (const to of ['calendar','pattern','you','home','pattern','calendar','home','you']) {
    await page.locator(to === 'you' ? 'a[data-profile-trigger]:visible' : `nav a:visible[href^="${to === 'home' ? '/' : '/' + to}?lang="]`).first().click();
    await page.locator(ready[to]).waitFor();
  }
  assert.equal((await calls()).filter(c => c.name === 'onboarding' && c.action === 'hydrate').length, 1, 'product navigation remounted resolver');
  assert.equal((await calls()).filter(c => c.name === 'applicationSession').length, 1);
  await page.goBack(); await page.locator(ready.home).waitFor();
  await page.goForward(); await page.locator(ready.you).waitFor();
  assert.equal((await calls()).filter(c => c.name === 'onboarding').length, 1);
  // Synthetic session controls live in the harness URL, not real auth storage.
  await page.evaluate(()=>history.replaceState(history.state,'','/you?appFixture=1&sdkSession=user&onboardingState=ACTIVE_EXISTING_USER&language=tr'));
  await page.reload(); await page.locator(ready.you).waitFor();
  assert.equal((await calls()).filter(c => c.name === 'onboarding').length, 1, 'fresh document did not hydrate once');
  await page.evaluate(() => window.__authFixture.holdOperation('calendar'));
  await page.locator('nav a:visible').nth(1).click();
  await page.locator('[data-calendar-root]').waitFor();
  await page.locator('nav a:visible').nth(2).click(); await page.locator(ready.pattern).waitFor();
  await page.evaluate(() => window.__authFixture.releaseOperation('calendar'));
  assert.equal(await page.locator('[data-calendar-root]:visible').count(), 0, 'late response revealed the kept-hidden Calendar');
  await page.evaluate(() => { window.__authFixture.holdOperation('onboarding'); window.dispatchEvent(new Event('shinka-health-access-changed')); });
  await page.waitForFunction(() => !document.querySelector('[data-pattern-root]'));
  await page.evaluate(() => window.__authFixture.releaseOperation('onboarding'));
  await page.locator(ready.pattern).waitFor();
  const beforeSwitch=(await calls()).filter(c=>c.name==='applicationSession').length;
  await page.evaluate(() => { window.__authFixture.holdOperation('onboarding'); window.__authFixture.setSession('admin'); window.dispatchEvent(new Event('focus')); });
  assert.equal((await calls()).filter(c=>c.name==='applicationSession').length,beforeSwitch,'recent passive focus bypassed throttle');
  // A restored document is an explicit re-verification boundary. SS08 separately
  // advances an injected clock to cover passive focus after the throttle expires.
  await page.evaluate(() => window.dispatchEvent(new PageTransitionEvent('pageshow',{persisted:true})));
  await page.waitForFunction(() => !document.querySelector('[data-pattern-root]'));
  await page.evaluate(() => window.__authFixture.releaseOperation('onboarding'));
  await page.locator(ready.pattern).waitFor();
  await page.locator('a[data-profile-trigger]:visible').click(); await page.locator(ready.you).waitFor();
  await page.getByRole('button', { name: 'Çıkış yap', exact: true }).click();
  await page.locator('[data-onboarding-state="UNAUTHENTICATED_SIGN_IN"]').waitFor();
  await page.goBack();
  await page.waitForFunction(() => document.querySelector('[data-onboarding-state]') && !document.querySelector('[data-home-root],[data-you-root],[data-calendar-root],[data-pattern-root]'));
  // Real cross-document navigation, not a dispatched PageTransitionEvent.
  await page.addInitScript(()=>{window.__realRestores=[];window.addEventListener('pageshow',event=>window.__realRestores.push(event.persisted));});
  await page.goto(`${origin}/?appFixture=1&sdkSession=user&onboardingState=ACTIVE_EXISTING_USER&language=en`);
  await page.locator('[data-daily-id]').waitFor();
  await page.evaluate(()=>window.__authFixture.setSession('admin'));
  await page.goto('about:blank');await page.goBack();await page.locator('[data-daily-id]').waitFor();
  const restored=await page.evaluate(()=>window.__realRestores.includes(true));
  if(restored) {
    await page.waitForFunction(()=>window.__authFixture.calls.filter(c=>c.name==='applicationSession').length>=2);
    await page.locator('a[data-profile-trigger]:visible').click();await page.locator('[data-you-consent]').waitFor();
    assert.equal(await page.locator('a[href="/internal"]').count(),1,'BFCache returned stale role');
  }
  const realBfcache={status:restored?'PASS':'NOT_RUN',persistedPageShowObserved:restored,syntheticEvent:false,reason:restored?'Actual cached document reverified changed synthetic server role':'This browser/automation run reloaded the document; no cached restoration was observed'};
  return { passed: true, scope: 'LOCAL_REAL_APP_SYNTHETIC_SDK', hydrationPerProductSession: 1, noBackendPrefetch: true, backForwardReload: true, rapidNavigationLateResponse: true, privacyAndAccountSwitchInvalidate: true, logoutBackConcealsData: true, realBfcache };
}

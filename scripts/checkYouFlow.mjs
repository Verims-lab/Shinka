import assert from 'node:assert/strict';
import { mkdir } from 'node:fs/promises';
import path from 'node:path';
export async function checkYouFlow(page, origin, directory) {
  if(directory)await mkdir(directory,{recursive:true});
  const results=[];
  for(const width of [320,360,390,430,844]) for(const language of ['tr','en']) {
    await page.setViewportSize({width,height:width===844?390:900});
    await page.goto(`${origin}/you?appFixture=1&sdkSession=user&onboardingState=ACTIVE_EXISTING_USER&language=${language}`);
    await page.waitForSelector('[data-you-consent]');
    assert.equal(await page.locator('[data-you-root]').getAttribute('lang'),language);
    assert.equal(await page.locator('a[href="/internal"]').count(),0);
    assert.equal(await page.locator('nav a').count(),3);
    await page.getByRole('button',{name:language==='tr'?'Profili düzenle':'Edit profile',exact:true}).click();
    await page.waitForSelector('[data-you-profile-form]');
    await page.waitForFunction(()=>document.activeElement?.id==='display_name');
    await page.keyboard.press('Tab');assert.equal(await page.evaluate(()=>document.activeElement?.id),'birth_date');
    for(const scale of [1,2]) {
      if(scale===2)await page.evaluate(()=>{const sizes=[...document.querySelectorAll('[data-you-root] h1,[data-you-root] h2,[data-you-root] p,[data-you-root] dt,[data-you-root] dd,[data-you-root] button,[data-you-root] a,[data-you-root] span,[data-you-root] label,[data-you-root] input,[data-you-root] select,[data-you-root] legend')].map(el=>({el,size:parseFloat(getComputedStyle(el).fontSize)}));for(const {el,size} of sizes)el.style.fontSize=`${size*2}px`;});
      const geometry=await page.evaluate(()=>({width:innerWidth,scroll:document.documentElement.scrollWidth,controls:[...document.querySelectorAll('[data-you-root] button,[data-you-root] a,[data-you-root] select,[data-you-root] input:not([type="checkbox"])')].map(el=>{const r=el.getBoundingClientRect();return {width:r.width,height:r.height};})}));
      assert(geometry.scroll<=width+1&&geometry.controls.every(r=>r.width>=44&&r.height>=44));
      if(directory)await page.screenshot({path:path.join(directory,`you-${width}-${language}-${scale}x.png`),fullPage:true});
      results.push({scenario:`you-${width}-${language}-${scale}x`,passed:true,geometry,scope:'LOCAL_BROWSER_SYNTHETIC'});
    }
    assert.equal(await page.evaluate(()=>window.__sdkLabCalls.filter(c=>c.name==='dailyMessage').length),0);
    assert(await page.evaluate(()=>window.__youLab.state.calls.every(c=>c.method==='filter')));
  }
  await page.goto(`${origin}/you?appFixture=1&sdkSession=user&onboardingState=ACTIVE_EXISTING_USER&language=en`);
  await page.waitForSelector('[data-you-consent]');
  const dailyBefore=await page.evaluate(()=>JSON.stringify(window.__youLab.tables.UserDailyMessage));
  await page.getByRole('button',{name:'Edit profile',exact:true}).click();
  await page.locator('#display_name').fill('Synthetic updated name');
  await page.locator('[data-you-profile-form] button[type="submit"]').click();
  await page.getByText('Your profile has been updated',{exact:true}).waitFor();
  await page.locator('#you-language').selectOption('tr');
  await page.locator('[data-you-preferences-form] button[type="submit"]').click();
  await page.getByText('Tercihlerin güncellendi',{exact:true}).waitFor();
  await page.locator('nav a').nth(0).click();await page.waitForSelector('[data-daily-id]');
  assert((await page.locator('h1').innerText()).includes('Synthetic updated name'));
  assert.equal(await page.locator('[data-home-root]').getAttribute('lang'),'tr');
  assert.equal(await page.evaluate(()=>JSON.stringify(window.__youLab.tables.UserDailyMessage)),dailyBefore);
  await page.locator('nav a').nth(1).click();await page.waitForSelector('[data-calendar-root]');
  assert.equal(await page.locator('[data-calendar-root]').getAttribute('lang'),'tr');
  await page.locator('nav a').nth(2).click();await page.waitForSelector('[data-pattern-root]');
  assert.equal(await page.locator('[data-pattern-root]').getAttribute('lang'),'tr');
  await page.locator('[data-profile-trigger]').click();await page.waitForSelector('[data-you-consent]');
  assert.equal(await page.locator('[data-you-root]').getAttribute('lang'),'tr');
  assert((await page.locator('main').innerText()).includes('Synthetic updated name'));
  await page.getByRole('button',{name:'Çıkış yap',exact:true}).click();await page.waitForSelector('[data-onboarding-state]');
  assert.equal(await page.locator('[data-you-root],[data-home-root]').count(),0);
  results.push({scenario:'you-save-reopen-all-product-locales-name-snapshot-and-logout',passed:true,scope:'LOCAL_BROWSER_SYNTHETIC'});
  await page.goto(`${origin}/you?appFixture=1&sdkSession=admin&onboardingState=ACTIVE_EXISTING_USER&language=en`);
  await page.waitForSelector('[data-you-consent]');await page.waitForSelector('a[href="/internal"]');
  await page.clock.setSystemTime(await page.evaluate(()=>Date.now()+16000));
  try {
    await page.evaluate(()=>window.__authFixture.setSession('user'));
    await page.evaluate(()=>window.dispatchEvent(new Event('focus')));
    await page.waitForFunction(()=>!document.querySelector('a[href="/internal"]'));
  } finally { await page.clock.setSystemTime(Date.now()); }
  results.push({scenario:'you-current-admin-revoke',passed:true,scope:'LOCAL_BROWSER_SYNTHETIC'});
  for(const session of ['anonymous','user']) {
    await page.goto(`${origin}/you?appFixture=1&sdkSession=${session}`);await page.waitForSelector('[data-onboarding-state]');
    assert.equal(await page.locator('[data-you-root]').count(),0);
    assert.equal(await page.evaluate(()=>window.__sdkLabCalls.filter(c=>c.name==='you').length),0);
    results.push({scenario:`you-route-${session}-incomplete`,passed:true,scope:'LOCAL_BROWSER_SYNTHETIC'});
  }
  return results;
}

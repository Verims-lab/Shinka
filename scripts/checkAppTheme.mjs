import assert from 'node:assert/strict';
import { doubleText, inspectMobileSurface } from './mobileSurfaceMeasurements.mjs';
import { pickPreference, preferenceValue } from './preferencePicker.mjs';
import { readBackdrop } from './checkAppBackdrop.mjs';

// Real App/AuthProvider/Onboarding/You; only SDK IO is replaced by native fixtures.
// All external requests are denied. No physical-device or hosted claim.
export async function checkAppTheme(browser, origin) {
  const context=await browser.newContext({viewport:{width:360,height:800}}), page=await context.newPage();
  const rows=[],errors=[];
  page.on('pageerror',e=>errors.push(e.message));
  await page.route('**/*',r=>new URL(r.request().url()).origin===origin?r.continue():r.abort());
  const url=(theme,language='en')=>`${origin}/you?appFixture=1&themeFixture=1&sdkSession=admin&onboardingState=ACTIVE_EXISTING_USER&theme=${theme}&language=${language}`;
  const theme=expected=>page.waitForFunction(value=>document.documentElement.classList.contains('dark')===(value==='dark')&&getComputedStyle(document.documentElement).colorScheme===value,expected);
  const save=()=>page.locator('[data-you-preferences-form] button[type=submit]').click();
  const saved=()=>page.getByText('Your preferences have been updated',{exact:true}).waitFor();
  const current=()=>page.evaluate(()=>getComputedStyle(document.documentElement).colorScheme);
  try {
    for(const os of ['light','dark'])for(const app of ['light','dark'])for(const language of ['tr','en'])for(const width of [360,390]) {
      await page.setViewportSize({width,height:800});await page.emulateMedia({colorScheme:os});
      await page.goto(url(app,language));await page.locator('#you-theme').waitFor();await theme(app);
      for(const section of ['you','home','calendar','pattern']) {
        await page.emulateMedia({colorScheme:os});
        assert.equal(await page.evaluate(()=>matchMedia('(prefers-color-scheme: dark)').matches),os==='dark');
        if(section!=='you'){await page.locator('nav a:visible').nth(['home','calendar','pattern'].indexOf(section)).click();await page.locator(`[data-${section}-root]`).waitFor();}
        await theme(app);
        const before=await readBackdrop(page);
        assert.equal(new URL(before.source).origin,origin);
        assert.equal(before.size,'contain');
        const measurement=await inspectMobileSurface(page,true);
        rows.push({scenario:`theme-${os}-${app}-${language}-${width}-${section}`,measurement,passed:measurement.scheme===app&&!measurement.contrastFailures.length&&measurement.scrollWidth<=width+1});
        await page.emulateMedia({colorScheme:os==='dark'?'light':'dark'});assert.equal(await current(),app);assert.deepEqual(await readBackdrop(page),before);
      }
      await page.locator('[data-profile-trigger]:visible').click();await page.locator('#you-theme').waitFor();await doubleText(page);
      const measured=await inspectMobileSurface(page,true);
      rows.push({scenario:`theme-${os}-${app}-${language}-${width}-you-200percent`,measurement:measured,passed:measured.scrollWidth<=width+1&&!measured.textOverflow.length&&!measured.contrastFailures.length&&!measured.small.length&&measured.boundaries.every(r=>r.focus>=3&&r.input>=3)});
    }
    await page.goto(url('light'));await page.locator('#you-theme').waitFor();
    await pickPreference(page,'you-theme','dark');assert.equal(await current(),'light');
    await save();await saved();await theme('dark');
    await page.locator('nav a:visible').first().click();await page.locator('[data-home-root]').waitFor();await theme('dark');
    await page.locator('[data-profile-trigger]:visible').click();await page.locator('#you-theme').waitFor();
    assert.equal(await preferenceValue(page,'you-theme'),'dark');await theme('dark');
    await page.emulateMedia({colorScheme:'light'});assert.equal(await current(),'dark');
    rows.push({scenario:'draft-save-verified-reopen-os-change',passed:true});
    for(const when of ['before','after']) {
      await pickPreference(page,'you-theme','light');
      await page.evaluate(when=>window.__youLab.once(when,c=>c.name==='UserPreferences'&&c.method==='updateMany'),when);
      await save();await page.getByRole('button',{name:'Check saved result',exact:true}).waitFor();
      assert.equal(await current(),'dark');assert.equal(await preferenceValue(page,'you-theme'),'light');
      await page.getByRole('button',{name:'Check saved result',exact:true}).click();
      if(when==='before'){await page.getByRole('button',{name:'Retry the same save',exact:true}).waitFor();assert.equal(await current(),'dark');await page.getByRole('button',{name:'Retry the same save',exact:true}).click();}
      await saved();await theme('light');
      assert.equal(await page.evaluate(()=>window.__youLab.tables.UserPreferences[0].theme_code),'light');
      rows.push({scenario:`${when}-write-response-check-retry-theme-boundary`,passed:true});
      await pickPreference(page,'you-theme','dark');await save();await saved();await theme('dark');
    }
    // Pending dark save must not apply to the next account's verified light choice.
    await pickPreference(page,'you-theme','light');await save();await saved();await theme('light');
    await pickPreference(page,'you-theme','dark');
    await page.evaluate(()=>window.__authFixture.holdOperation('you'));await save();
    await page.waitForFunction(()=>document.querySelector('#you-theme').disabled);
    await page.evaluate(async()=>{window.__authFixture.setSession('user');await window.__appAuth.checkAppState();});
    await theme('light');await page.evaluate(()=>window.__authFixture.releaseOperation('you'));
    await page.locator('#you-theme:not(:disabled)').waitFor();assert.equal(await current(),'light');assert.equal(await preferenceValue(page,'you-theme'),'light');
    rows.push({scenario:'account-change-old-pending-save-discarded',passed:true});
    // Test reset from a route that has no Onboarding theme effect mounted.
    await page.goto(url('dark'));await page.locator('#you-theme').waitFor();await theme('dark');
    await page.locator('a[href="/internal"]').click();await page.locator('[data-admin-panel]').waitFor();await theme('dark');
    await page.evaluate(()=>window.__appAuth.logout(false));await theme('light');
    rows.push({scenario:'logout-from-admin-route-clears-account-theme',passed:true});
    await page.goto(url('dark'));await page.locator('#you-theme').waitFor();await theme('dark');
    await page.evaluate(()=>{window.__authFixture.hold();void window.__appAuth.checkAppState();});
    await theme('light');await page.evaluate(()=>window.__authFixture.release());await page.locator('#you-theme').waitFor();await theme('dark');
    rows.push({scenario:'unverified-identity-default-before-rehydrate',passed:true});
    await page.goto(url('dark').replace('ACTIVE_EXISTING_USER','AUTHENTICATED_PROFILE_REQUIRED'));
    await page.locator('[data-onboarding-state]').waitFor();await theme('light');
    rows.push({scenario:'onboarding-keeps-light-despite-stored-dark',passed:true});
    await page.goto(url('dark')+'&holdHydration=1');
    await page.waitForFunction(()=>window.__appAuth?.isAuthenticated);
    assert.equal(await current(),'light');
    await page.evaluate(()=>window.__authFixture.releaseHydration());await page.locator('#you-theme').waitFor();await theme('dark');
    rows.push({scenario:'unverified-preference-light-until-readback',passed:true});
    rows.push({scenario:'theme-page-errors',errors,passed:errors.length===0});
    return rows;
  } catch(error) { console.error(JSON.stringify({completedThemeChecks:rows},null,2));throw error; } finally {await context.close();}
}

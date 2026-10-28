import assert from 'node:assert/strict';
import { mkdir } from 'node:fs/promises';
import path from 'node:path';
import { doubleText } from './mobileSurfaceMeasurements.mjs';
import { pickPreference, preferenceValue } from './preferencePicker.mjs';

// Real App/router/You/controllers; only external SDK transport is synthetic.
export async function checkPreferenceSheets(browser, origin, directory) {
  if (directory) await mkdir(directory,{recursive:true});
  const context=await browser.newContext(),page=await context.newPage(),rows=[],errors=[];
  page.on('pageerror',e=>errors.push(e.message));
  await page.route('**/*',r=>new URL(r.request().url()).origin===origin?r.continue():r.abort());
  const url=(language='en')=>`${origin}/you?appFixture=1&themeFixture=1&sdkSession=admin&onboardingState=ACTIVE_EXISTING_USER&theme=light&language=${language}`;
  const notice=()=>page.locator('[data-you-pref-draft]');
  const save=()=>page.locator('[data-you-preferences-form] button[type=submit]').click();
  const writes=()=>page.evaluate(()=>window.__youLab.state.calls.filter(c=>c.method!=='filter').length);
  const sheet=id=>page.locator(`[data-pref-sheet="${id}"]`);
  const closed=id=>sheet(id).waitFor({state:'detached'});
  try {
    for(const language of ['tr','en'])for(const width of [320,360,390])for(const scale of [1,2])for(const id of ['you-language','you-theme']) {
      await page.setViewportSize({width,height:700});await page.goto(url(language));await page.locator('#you-theme').waitFor();
      assert.equal(await notice().count(),0,'initial false dirty notice');
      await page.getByRole('button',{name:language==='tr'?'Profili düzenle':'Edit profile',exact:true}).click();
      await page.locator('#display_name').fill('Preserved draft');
      const previous=await preferenceValue(page,id),next=id==='you-language'?(previous==='tr'?'en':'tr'):'dark';
      const trigger=page.locator(`#${id}`);await trigger.click();await sheet(id).waitFor();
      await page.evaluate(()=>{for(const [edge,n] of Object.entries({top:24,left:28,right:28,bottom:34}))document.documentElement.style.setProperty(`--safe-${edge}`,`${n}px`);});
      if(scale===2)await doubleText(page);
      assert.equal(await page.evaluate(()=>document.activeElement?.getAttribute('data-option')),previous,'selected option initial focus');
      assert.equal(await sheet(id).getByRole('radio',{checked:true}).getAttribute('data-option'),previous);
      const geometry=await sheet(id).evaluate(el=>{const cs=getComputedStyle(el),r=el.getBoundingClientRect();el.scrollTop=el.scrollHeight;const cancel=el.querySelector(':scope > button:last-child').getBoundingClientRect();return {x:r.x,right:r.right,bottom:r.bottom,height:r.height,width:innerWidth,viewport:innerHeight,scrollWidth:document.documentElement.scrollWidth,paddingBottom:cs.paddingBottom,paddingLeft:cs.paddingLeft,paddingRight:cs.paddingRight,shellBottom:getComputedStyle(document.querySelector('.shinka-safe-shell')).paddingBottom,cancelBottom:cancel.bottom,small:[...el.querySelectorAll('button')].filter(b=>{const r=b.getBoundingClientRect();return r.height<44||r.width<44;}).length,textOverflow:[...el.querySelectorAll('h2,button span')].filter(e=>e.scrollWidth>e.clientWidth+1).length};});
      assert(geometry.x>=0&&geometry.right<=width+1&&geometry.bottom<=geometry.viewport+1&&geometry.height<=geometry.viewport*.85+1&&geometry.scrollWidth<=width+1&&geometry.small===0&&geometry.textOverflow===0,'sheet overflow/touch');
      assert.equal(geometry.paddingBottom,'34px');assert.equal(geometry.paddingLeft,'28px');assert.equal(geometry.paddingRight,'28px');assert.equal(geometry.shellBottom,'0px');assert(geometry.cancelBottom<=geometry.bottom-33);
      if(directory&&width===360&&scale===2)await page.screenshot({path:path.join(directory,`${id}-${language}-200.png`)});
      await page.keyboard.press('ArrowDown');
      assert.equal(await page.evaluate(()=>document.activeElement?.getAttribute('data-option')),next,'radio arrow did not move focus');
      assert.equal(await sheet(id).getByRole('radio',{checked:true}).getAttribute('data-option'),next);
      assert.equal(await preferenceValue(page,id),previous,'navigation committed parent draft');
      for(const [key,expected] of [['ArrowUp',previous],['ArrowRight',next],['ArrowLeft',previous],['End',id==='you-language'?'en':'dark'],['Home',id==='you-language'?'tr':'light']]) {
        await page.keyboard.press(key);assert.equal(await page.evaluate(()=>document.activeElement?.getAttribute('data-option')),expected);
        assert.equal(await sheet(id).getByRole('radio',{checked:true}).getAttribute('data-option'),expected);
      }
      if(next!==(id==='you-language'?'tr':'light'))await page.keyboard.press('ArrowDown');

      await page.keyboard.press('Tab');assert.equal(await page.evaluate(()=>document.activeElement?.textContent),language==='tr'?'Vazgeç':'Cancel');
      await page.keyboard.press('Tab');assert.equal(await page.evaluate(()=>document.activeElement?.getAttribute('data-option')),next);
      await page.keyboard.press('Shift+Tab');await page.keyboard.press('Enter');await closed(id);
      assert.equal(await page.evaluate(()=>document.activeElement?.id),id);assert.equal(await preferenceValue(page,id),previous);assert.equal(await notice().count(),0);
      for(const dismiss of ['escape','back']) {
        await trigger.click();await sheet(id).waitFor();const before=page.url();
        if(dismiss==='escape')await page.keyboard.press('Escape');else await page.goBack();
        await closed(id);assert.equal(page.url(),before);assert.equal(await page.evaluate(()=>document.activeElement?.id),id);
        assert.equal(await page.locator('#display_name').inputValue(),'Preserved draft');assert.equal(await notice().count(),0);
      }
      await trigger.click();await sheet(id).waitFor();await page.keyboard.press('ArrowDown');await page.keyboard.press('Space');await closed(id);
      assert.equal(await preferenceValue(page,id),next);await notice().waitFor();
      assert.equal(await page.locator('[data-you-root]').getAttribute('lang'),language);assert.equal(await page.evaluate(()=>getComputedStyle(document.documentElement).colorScheme),'light');
      assert.equal(await page.locator('#display_name').inputValue(),'Preserved draft');assert.equal(await writes(),0);
      await trigger.click();await page.keyboard.press('Escape');await closed(id);assert.equal(await preferenceValue(page,id),next);await notice().waitFor();
      await pickPreference(page,id,previous);assert.equal(await notice().count(),0,'reverting choice stays dirty');
      rows.push({scenario:`sheet-${id}-${language}-${width}-${scale}x`,geometry,passed:true,physicalInsets:false});
    }
    await page.goto(url());await page.locator('#you-theme').waitFor();
    await pickPreference(page,'you-theme','dark');await notice().waitFor();
    await page.evaluate(()=>window.__authFixture.holdOperation('you'));await save();
    await page.waitForFunction(()=>document.querySelector('#you-theme').disabled);assert.equal(await notice().count(),0);assert.equal(await page.getByText('Your preferences have been updated',{exact:true}).count(),0);
    assert.equal(await page.evaluate(()=>getComputedStyle(document.documentElement).colorScheme),'light');
    await page.evaluate(()=>window.__authFixture.releaseOperation('you'));await page.getByText('Your preferences have been updated',{exact:true}).waitFor();assert.equal(await notice().count(),0);
    await page.locator('nav a:visible').first().click();await page.locator('[data-home-root]').waitFor();await page.locator('[data-profile-trigger]:visible').click();await page.locator('#you-theme').waitFor();
    assert.equal(await preferenceValue(page,'you-theme'),'dark');assert.equal(await notice().count(),0);assert.equal(await page.getByText('Your preferences have been updated',{exact:true}).count(),0);
    // A known conflict keeps the draft and the old applied theme; reopen clears the intent.
    await pickPreference(page,'you-theme','light');
    await page.evaluate(()=>{window.__youLab.tables.UserPreferences[0].notifications_enabled=true;});
    await save();await page.getByRole('button',{name:'Reopen saved values',exact:true}).waitFor();
    assert.equal(await preferenceValue(page,'you-theme'),'light');assert.equal(await page.evaluate(()=>getComputedStyle(document.documentElement).colorScheme),'dark');
    await page.getByRole('button',{name:'Reopen saved values',exact:true}).click();await page.locator('#you-theme:not(:disabled)').waitFor();assert.equal(await preferenceValue(page,'you-theme'),'dark');assert.equal(await notice().count(),0);
    // Account invalidation with an open layer removes its old draft, focus and history token.
    await page.locator('#you-theme').click();await sheet('you-theme').waitFor();
    await page.evaluate(async()=>{window.__authFixture.setSession('user');await window.__appAuth.checkAppState();});
    await closed('you-theme');await page.locator('#you-theme:not(:disabled)').waitFor();
    assert.equal(await preferenceValue(page,'you-theme'),'light');assert.equal(await notice().count(),0);assert.equal(await page.evaluate(()=>!!history.state?.shinkaLayer),false);
    rows.push({scenario:'pending-verified-reopen-conflict-and-open-layer-account-change',passed:true});
    assert.equal(errors.length,0);return {scope:'LOCAL_REAL_APP_SYNTHETIC_SDK',rows,pageErrors:errors,physicalDevice:false};
  } catch(error) {console.error(JSON.stringify({completedPreferenceChecks:rows},null,2));throw error;} finally {await context.close();}
}

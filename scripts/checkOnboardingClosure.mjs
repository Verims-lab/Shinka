import assert from 'node:assert/strict';
import { mkdir } from 'node:fs/promises';
import path from 'node:path';
import { doubleText } from './mobileSurfaceMeasurements.mjs';

// Actual browser locale, actual App/auth/hydrate and field/dialog; synthetic SDK
// at the transport boundary only. No hidden locale controls or hosted requests.
export async function checkOnboardingClosure(browser, origin, directory) {
 const results=[];
 for(const [locale,expected] of [['tr-TR','tr'],['en-US','en'],['en-GB','en'],['de-DE','en']]) {
  const context=await browser.newContext({locale,viewport:{width:320,height:568}});
  const page=await context.newPage();
  await page.route('**/*',route=>new URL(route.request().url()).origin===origin?route.continue():route.abort());
  try {
   await page.addInitScript(()=>{sessionStorage.setItem('shinka.language','tr');localStorage.setItem('shinka.language','tr');});
   await page.goto(`${origin}/?appFixture=1&sdkSession=anonymous&lang=tr`);
   await page.locator(`[data-onboarding-state] [data-intro-row]`).first().waitFor();
   assert.equal(await page.locator('[data-onboarding-state]').getAttribute('lang'),expected);
   assert.equal(await page.getByRole('button',{name:/^(TR|EN)$/}).count(),0);
   const saved=expected==='tr'?'en':'tr';
   await page.goto(`${origin}/?appFixture=1&sdkSession=user&language=${saved}&lang=${expected}`);
   await page.locator('#birth_date').waitFor();assert.equal(await page.locator('[data-onboarding-state]').getAttribute('lang'),saved);
   await page.reload();await page.locator('#birth_date').waitFor();assert.equal(await page.locator('[data-onboarding-state]').getAttribute('lang'),saved);
   results.push({scenario:`locale-${locale}-saved-${saved}-reopen`,passed:true});
  } finally {await context.close();}
 }
 const context=await browser.newContext({locale:'tr-TR',viewport:{width:320,height:568},hasTouch:true,isMobile:true});
 const page=await context.newPage();const errors=[];page.on('pageerror',e=>errors.push(e.message));
 await page.route('**/*',r=>new URL(r.request().url()).origin===origin?r.continue():r.abort());
 try {
  await page.goto(`${origin}/onboarding-fixture?step=AUTHENTICATED_PROFILE_REQUIRED&language=tr`);
  const field=page.locator('#birth_time'),open=page.locator('[data-time-open]');await field.waitFor();
  await field.fill('00:00');await field.selectText();await page.keyboard.insertText('23:59');assert.equal(await field.inputValue(),'23:59');
  for(let i=0;i<3;i++){await open.click();await page.locator('dialog[open]').waitFor();await page.locator('[name=hour]').selectOption('00');await page.locator('[data-time-cancel]').click();await page.locator('dialog').waitFor({state:'detached'});assert.equal(await field.inputValue(),'23:59');}
  await open.click();await page.locator('dialog[open]').waitFor();await page.goBack();await page.locator('dialog').waitFor({state:'detached'});assert.equal(await field.inputValue(),'23:59');assert.equal(await page.locator('[data-onboarding-state]').getAttribute('data-onboarding-state'),'AUTHENTICATED_PROFILE_REQUIRED');
  await open.click();await page.locator('dialog[open]').waitFor();await page.locator('[name=hour]').selectOption('00');await page.locator('[name=minute]').selectOption('00');await page.locator('[data-time-set]').click();await page.locator('dialog').waitFor({state:'detached'});assert.equal(await field.inputValue(),'00:00');
  assert.equal(new URL(page.url()).pathname,'/onboarding-fixture');results.push({scenario:'keyboard-paste-select-cancel-reopen-history-back-no-submit',passed:true});
  await page.setViewportSize({width:320,height:400});await open.click();await page.locator('dialog[open]').waitFor();await doubleText(page);
  for(const action of ['set','cancel','clear']){
   const button=page.locator(`[data-time-${action}]`);await button.scrollIntoViewIfNeeded();
   const r=await button.boundingBox(),d=await page.locator('dialog').boundingBox();assert(r.x>=d.x&&r.x+r.width<=d.x+d.width+1&&r.y>=d.y&&r.y+r.height<=d.y+d.height+1);
  }
  if(directory){await mkdir(directory,{recursive:true});await page.screenshot({path:path.join(directory,'time-picker-tr-320-200percent.png')});}
  await page.locator('[data-time-clear]').click();await page.locator('dialog').waitFor({state:'detached'});assert.equal(await field.inputValue(),'');
  assert.equal(errors.length,0);results.push({scenario:'time-actions-320-200percent-reduced-height-clear',passed:true});
 } finally {await context.close();}
 return results;
}

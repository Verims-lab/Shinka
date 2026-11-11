import assert from 'node:assert/strict';
import { mkdir, readFile } from 'node:fs/promises';
import path from 'node:path';
import { loadAppBackdrop } from './checkAppBackdrop.mjs';
import { doubleText } from './mobileSurfaceMeasurements.mjs';
import { checkOnboardingLayers } from './checkOnboardingLayers.mjs';

// Real App/pages, synthetic SDK only. The bundled art loads locally.
// Optional captures also allow the app fonts.
export async function checkOnboardingPresentation(browser, origin, directory) {
 const html=await readFile('index.html','utf8');
 const fontCss=html.match(/href="(https:\/\/fonts.googleapis.com\/css2[^\"]+)"/)[1];
 const results=[];
 if(directory)await mkdir(directory,{recursive:true});
 for(const language of ['tr','en'])for(const width of [360,390])for(const textScale of [1,2]){
  const context=await browser.newContext({locale:language==='tr'?'tr-TR':'en-US',viewport:{width,height:844}});
  const page=await context.newPage(),errors=[];
  page.on('pageerror',e=>errors.push(e.message));
  await page.route('**/*',route=>{
   const url=new URL(route.request().url());
   const visual=directory&&route.request().method()==='GET'&&(url.href===fontCss||(url.origin==='https://fonts.gstatic.com'&&url.pathname.startsWith('/s/')));
   return url.origin===origin||visual?route.continue():route.abort();
  });
  const prepare=async()=>{
   if(directory){
    await page.evaluate(href=>{if(!document.querySelector('link[data-capture-font]')){const link=document.createElement('link');link.rel='stylesheet';link.href=href;link.dataset.captureFont='true';document.head.append(link);}},fontCss);
    await page.waitForFunction(()=>document.querySelector('link[data-capture-font]')?.sheet);
    await page.evaluate(()=>document.fonts.ready);
    await loadAppBackdrop(page);
   }
   if(textScale===2)await doubleText(page);
  };
  const capture=async step=>{if(directory)await page.screenshot({path:path.join(directory,`${step}-${language}-${width}-${textScale*100}.png`),fullPage:true});};
  const title=async()=>{
   const value=await page.locator('h1').evaluate(el=>{el.focus();const s=getComputedStyle(el);return {focused:document.activeElement===el,outline:s.outlineStyle,border:parseFloat(s.borderTopWidth),shadow:s.boxShadow,align:s.textAlign,font:s.fontFamily};});
   assert(value.focused&&value.outline==='none'&&value.border===0&&value.shadow==='none'&&value.align==='center');
   return value;
  };
  const noOverflow=async()=>assert(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth+1));
  const nameState=async()=>{
   const value=await page.locator('#display_name').evaluate(input=>{
    const label=input.labels[0],frame=input.closest('.shinka-framed-field'),a=label.getBoundingClientRect(),b=input.getBoundingClientRect(),c=frame.getBoundingClientRect(),s=getComputedStyle(frame);
    return {label:label.textContent,linked:label.control===input,inside:frame.contains(label),labelCount:input.labels.length,overlap:a.bottom>b.top+0.5,fits:a.left>=c.left&&a.right<=c.right+0.5&&b.left>=c.left&&b.right<=c.right+0.5,border:parseFloat(s.borderTopWidth),focus:s.outlineStyle,focused:document.activeElement===input,empty:input.value==='',inputFont:parseFloat(getComputedStyle(input).fontSize)};
   });
   assert(value.linked&&value.inside&&value.labelCount===1&&!value.overlap&&value.fits&&value.border>0);
   assert.equal(value.label,language==='tr'?'Adın':'Name');
   await noOverflow();return value;
  };
  try {
   await page.goto(`${origin}/?appFixture=1&sdkSession=anonymous`);await page.locator('[data-onboarding-step="1"]').waitFor();await prepare();
   const intro=await title();await noOverflow();await capture('on-01');
   await page.getByRole('button',{name:language==='tr'?'Başla':'Begin',exact:true}).click();await page.locator('[data-provider]').first().waitFor();
   assert.equal(await page.locator('#display_name').count(),0);
   await page.goto(`${origin}/?appFixture=1&sdkSession=user&language=${language}&onboardingState=AUTHENTICATED_NAME_REQUIRED`);await page.locator('#display_name').waitFor();await prepare();
   const empty=await nameState();assert(empty.empty);assert.equal(await page.getByRole('textbox',{name:language==='tr'?'Adın':'Name',exact:true}).count(),1);await capture('on-03');
   await page.locator('h1').focus();await page.keyboard.press('Tab');assert.equal(await page.locator('#display_name').evaluate(el=>document.activeElement===el),true);
   const focused=await nameState();assert.equal(focused.focus,'solid');assert(focused.inputFont>=17*textScale);
   await page.locator('#display_name').fill('Ada');const filled=await nameState();assert(!filled.empty&&filled.focused);await capture('on-03-filled-focus');
   await page.locator('#display_name').fill('Ada '.repeat(12).trim());const longFilled=await nameState();assert(!longFilled.empty);await page.locator('#display_name').fill('Ada');
   await page.getByRole('button',{name:language==='tr'?'Devam et':'Continue',exact:true}).click();await page.locator('[data-onboarding-step="4"]').waitFor();
   await page.locator('[data-onboarding-back]').click();await page.locator('#display_name').waitFor();assert.equal(await page.locator('#display_name').inputValue(),'Ada');
   await page.goto(`${origin}/?appFixture=1&sdkSession=user&language=${language}`);await page.locator('#birth_date').waitFor();await prepare();
   const profile=await title();await noOverflow();await capture('on-04');
   await page.locator('#birth_date').focus();assert(await page.locator('#birth_date').evaluate(el=>getComputedStyle(el.closest('.shinka-framed-field')).outlineStyle==='solid'));
   assert.equal(errors.length,0);
   results.push({language,width,textScale,passed:true,intro,profile,name:{empty,focused,filled,longFilled},publicAssets:directory?'LOADED':'BLOCKED_OFFLINE',pageErrors:errors});
  } finally {await context.close();}
 }
 return [...results,{layers:await checkOnboardingLayers(browser,origin,directory?path.join(directory,'layers'):undefined)}];
}

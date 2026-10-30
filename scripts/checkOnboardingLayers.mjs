import assert from 'node:assert/strict';
import { mkdir, readFile, writeFile } from 'node:fs/promises';
import { createHash } from 'node:crypto';
import path from 'node:path';
import { BACKGROUND_ASSETS } from '../src/foundation/sectionBackgrounds.js';
import { doubleText } from './mobileSurfaceMeasurements.mjs';

// Real App + Onboarding + backdrop together. SDK transport is synthetic. Public
// artwork/fonts load only for an explicit visual capture; no hosted app API.
export async function checkOnboardingLayers(browser, origin, directory) {
  const fontCss = (await readFile('index.html','utf8')).match(/href="(https:\/\/fonts.googleapis.com\/css2[^\"]+)"/)[1];
  const allowed = new Set([BACKGROUND_ASSETS.onboardingMoon, fontCss]);
  const assets = new Map(), results = [];
  if (directory) await mkdir(directory,{recursive:true});
  const sizes = [[320,568],[360,640],[390,844],[430,932],[844,390]];
  for (const language of ['tr','en']) for (const [width,height] of sizes) for (const scale of [1,2]) {
    const context = await browser.newContext({locale:language==='tr'?'tr-TR':'en-US',viewport:{width,height},colorScheme:'dark'});
    const page = await context.newPage(), errors = [];
    page.on('pageerror',error=>errors.push(error.message));
    await page.route('**/*',async route=>{
      const url = new URL(route.request().url());
      if (url.origin === origin) return route.continue();
      if (!directory || route.request().method()!=='GET' || !(allowed.has(url.href) || url.origin==='https://fonts.gstatic.com' && url.pathname.startsWith('/s/'))) return route.abort();
      if (!assets.has(url.href)) {
        const response = await route.fetch(); assert(response.ok(),`PUBLIC_ASSET_${response.status()}`);
        const body = await response.body();
        assets.set(url.href,{body,contentType:response.headers()['content-type'],sha256:createHash('sha256').update(body).digest('hex')});
      }
      const asset=assets.get(url.href); return route.fulfill({status:200,contentType:asset.contentType,body:asset.body});
    });
    const resetText = () => page.evaluate(()=>document.querySelectorAll('body *').forEach(el=>{if(el instanceof HTMLElement)el.style.removeProperty('font-size');}));
    const prepare = async () => {
      if (directory) {
        await page.evaluate(href=>{if(!document.querySelector('[data-layer-font]')){const link=document.createElement('link');link.rel='stylesheet';link.href=href;link.dataset.layerFont='true';document.head.append(link);}},fontCss);
        await page.waitForFunction(()=>document.querySelector('[data-layer-font]')?.sheet);
        await page.evaluate(()=>document.fonts.ready);
        await page.evaluate(url=>new Promise((resolve,reject)=>{const image=new Image();image.onload=()=>resolve(true);image.onerror=()=>reject(new Error('ONBOARDING_BACKGROUND_NOT_LOADED'));image.src=url;}),BACKGROUND_ASSETS.onboardingMoon);
      }
      await resetText(); if(scale===2)await doubleText(page);
    };
    const inspect = async () => page.evaluate(()=>{
      const box = el=>{const r=el.getBoundingClientRect();return {x:r.x,y:r.y+scrollY,width:r.width,height:r.height};};
      const bitmaps=[];
      // Check every element and both pseudo-elements: distinct URLs can contain
      // the same composition. SVG row/field icons are intentionally not bitmaps.
      for (const el of document.querySelectorAll('body *')) {
        if(el.tagName==='IMG')bitmaps.push({kind:'img',source:el.getAttribute('src')});
        for(const pseudo of [null,'::before','::after']){
          const css=getComputedStyle(el,pseudo);
          if(css.backgroundImage.includes('url('))bitmaps.push({kind:pseudo||'background',source:css.backgroundImage});
        }
      }
      const layer=document.querySelector('[data-section-backdrop]'),css=getComputedStyle(layer),art=getComputedStyle(layer,'::before');
      const space=document.querySelector('.shinka-onboarding-art-space');
      return {bitmaps,images:document.querySelectorAll('.shinka-onboarding img').length,layers:document.querySelectorAll('[data-section-backdrop]').length,
        background:{section:layer.dataset.sectionBackdrop,position:css.position,y:layer.getBoundingClientRect().y,height:layer.getBoundingClientRect().height,image:art.backgroundImage,repeat:art.backgroundRepeat,size:art.backgroundSize,mask:art.maskImage},
        light:!document.documentElement.classList.contains('dark'),width:innerWidth,scrollWidth:document.documentElement.scrollWidth,scrollY,maxScroll:document.documentElement.scrollHeight-innerHeight,
        title:box(document.querySelector('h1')),card:box(document.querySelector('.shinka-intro-shell')),space:space?box(space):null,
        rowIcons:document.querySelectorAll('[data-intro-row] svg').length,
        controls:[...document.querySelectorAll('main input,main button,main label')].map(el=>({key:el.id||el.getAttribute('aria-label')||el.textContent.trim(),...box(el)}))};
    });
    const verify = value => {
      assert.equal(value.layers,1);assert.equal(value.images,0);assert.equal(value.bitmaps.length,1,'one bitmap composition across the complete page');
      assert(value.bitmaps[0].source.includes(BACKGROUND_ASSETS.onboardingMoon));assert(value.light,'onboarding remains light under dark OS');
      assert.equal(value.background.section,'onboarding');assert.equal(value.background.position,'fixed');assert.equal(value.background.y,0);
      assert.equal(value.background.repeat,'no-repeat');assert(value.scrollWidth<=value.width+1,'no horizontal overflow');
      assert(value.space && Math.abs(value.space.width-240)<1 && Math.abs(value.space.height-240)<1,'former 240px square layout slot preserved');
    };
    const visit = async step => {
      if(step===1)await page.goto(`${origin}/?appFixture=1&sdkSession=anonymous`);
      if(step===2)await page.getByRole('button',{name:language==='tr'?'Başla':'Begin',exact:true}).click();
      if(step===3){await page.locator('#display_name').fill('Ada');await page.getByRole('button',{name:language==='tr'?'Devam et':'Continue',exact:true}).click();}
      if(step===4)await page.goto(`${origin}/?appFixture=1&sdkSession=user&language=${language}&onboardingVisual=1`);
      if(step===5)await page.getByRole('button',{name:language==='tr'?'Devam et':'Continue',exact:true}).click();
      await page.locator(`[data-onboarding-step="${step}"]`).waitFor();await prepare();
    };
    try {
      for(const step of [1,2,3,4,5]) {
        await resetText();await visit(step);
        const views=[];
        for(const [label,fraction] of [['top',0],['middle',0.5],['bottom',1]]) {
          await page.evaluate(f=>scrollTo(0,(document.documentElement.scrollHeight-innerHeight)*f),fraction);
          await page.evaluate(()=>new Promise(resolve=>requestAnimationFrame(()=>requestAnimationFrame(resolve))));
          const value=await inspect();verify(value);if(step===1)assert.equal(value.rowIcons,3);
          views.push({label,...value});
          // Representative matched viewport captures; every matrix cell is measured.
          if(directory && (scale===1 && language==='tr'&&width===360 || language==='en'&&width===390 || scale===2 && language==='tr'&&width===320))await page.screenshot({path:path.join(directory,`on-${step}-${language}-${width}-${height}${scale===2?'-200':''}-${label}.png`)});
        }
        for(const value of views) {
          assert.equal(value.background.height,views[0].background.height);
          assert(Math.abs(value.title.y-views[0].title.y)<1,'scroll does not move document layout');
        }
        if(step===2 || step===4) {
          const field=page.locator(step===2?'#display_name':'#birth_date');await field.focus();
          if(step===2)await field.fill('Ada');else await field.fill('1990-01-01');
          await page.setViewportSize({width,height:Math.min(height,400)});verify(await inspect());
          await field.blur();await page.setViewportSize({width,height});verify(await inspect());
          if(step===4){await page.locator('#birth_time').focus();await page.locator('#birth_time').fill('10:30');verify(await inspect());await page.locator('#birth_time').blur();}
        }
        if(step>1) {
          await resetText();await page.locator('[data-onboarding-back]').click();await page.locator(`[data-onboarding-step="${step-1}"]`).waitFor();await prepare();verify(await inspect());
          if(step===2) {await page.getByRole('button',{name:language==='tr'?'Başla':'Begin',exact:true}).click();await page.locator('#display_name').waitFor();assert.equal(await page.locator('#display_name').inputValue(),'Ada');}
          if(step===3) {assert.equal(await page.locator('#display_name').inputValue(),'Ada');await page.getByRole('button',{name:language==='tr'?'Devam et':'Continue',exact:true}).click();await page.locator('[data-onboarding-step="3"]').waitFor();}
          if(step===4) {await page.getByRole('button',{name:language==='tr'?'Devam et':'Continue',exact:true}).click();await page.locator('#birth_date').waitFor();assert.equal(await page.locator('#birth_date').inputValue(),'1990-01-01');assert.equal(await page.locator('#birth_time').inputValue(),'10:30');}
        }
        results.push({language,width,height,textScale:scale,step,passed:true,views,keyboard:'FOCUS_AND_REDUCED_VIEWPORT_ONLY'});
      }
      await page.setViewportSize({width:height,height:width});verify(await inspect());
      await page.setViewportSize({width,height});verify(await inspect());
      assert.equal(errors.length,0);
    } finally { await context.close(); }
  }
  const receipt={scope:'LOCAL_REAL_APP_SYNTHETIC_SDK',publicAssets:directory?'LOADED':'BLOCKED_OFFLINE',physicalDevice:false,results,
    assets:[...assets].map(([url,a])=>({url,bytes:a.body.length,sha256:a.sha256}))};
  if(directory)await writeFile(path.join(directory,'layers.json'),JSON.stringify(receipt,null,2));
  return receipt;
}

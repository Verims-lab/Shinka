import assert from 'node:assert/strict';
import { mkdir, readFile, writeFile } from 'node:fs/promises';
import path from 'node:path';
import { FIRST_CONTENT_SOURCE } from '../base44/shared/firstContentSource.js';
import { loadAppBackdrop, readBackdrop } from './checkAppBackdrop.mjs';
import { doubleText } from './mobileSurfaceMeasurements.mjs';

const routes=[['home','/','[data-daily-id]'],['calendar','/calendar','[data-calendar-date]'],['pattern','/pattern','[data-lunar-timeline]'],['you','/you','[data-you-preferences-form]']];
// Actual App/guards/profile controls; every data response is an isolated CLI
// fixture. Baseline mode records evidence without claiming a passed test.
export async function checkProfilePosition(browser, origin, directory, baseline=false, comparison=undefined) {
  if(directory)await mkdir(directory,{recursive:true});
  const before=comparison?JSON.parse(await readFile(comparison,'utf8')):[], results=[];
  if(comparison)assert.equal(before.length,112,'comparison requires the complete baseline capture');
  const pair=FIRST_CONTENT_SOURCE.pairs[0];
  const daily={state:'ACTIVE_EXISTING_USER',persisted:true,profile:{display_name:'Ayd'},timezone:'Europe/Istanbul',daily:{id:'profile-position-daily',shinka_date:'2026-11-26',message_pair_id:pair[0],message_tr_snapshot:pair[2],suggestion_tr_snapshot:pair[3],message_en_snapshot:pair[4],suggestion_en_snapshot:pair[5]}};
  for(const[width,height]of[[320,568],[360,740],[390,844],[430,932],[768,1024],[1280,900]])for(const language of['tr','en'])for(const theme of['light','dark'])for(const scale of(width===320?[1,2]:[1])){
    const context=await browser.newContext({viewport:{width,height},locale:language,reducedMotion:'reduce'}),page=await context.newPage(),errors=[];
    page.on('pageerror',error=>errors.push(error.message));
    await page.route('**/*',route=>new URL(route.request().url()).origin===origin?route.continue():route.abort());
    const safe={top:width===390?24:width===430?47:0,right:width===390?12:0,bottom:width===390||width===430?34:0};
    await page.addInitScript(({daily,safe})=>{window.__dailyFixture=daily;document.addEventListener('DOMContentLoaded',()=>{for(const[side,value]of Object.entries(safe))document.documentElement.style.setProperty('--safe-'+side,value+'px');});},{daily,safe});
    try{
      for(const[name,route,ready]of routes){
        const key=[name,width,language,theme,scale].join('-');
        await page.goto(`${origin}${route}?appFixture=1&homePresentation=1&themeFixture=1&theme=${theme}&sdkSession=admin&onboardingState=ACTIVE_EXISTING_USER&language=${language}`);
        await page.locator(ready).first().waitFor();await loadAppBackdrop(page);
        await page.waitForFunction(dark=>document.documentElement.classList.contains('dark')===dark,theme==='dark');
        if(scale===2)await doubleText(page);
        await page.evaluate(()=>new Promise(resolve=>requestAnimationFrame(()=>requestAnimationFrame(resolve))));
        assert.equal(await page.locator('[data-profile-trigger]:visible').count(),1);
        const metrics=await page.locator('[data-'+name+'-root]:visible').evaluate(root=>{
          const box=node=>{const b=node.getBoundingClientRect();return{x:b.x,y:b.y+scrollY,width:b.width,height:b.height,right:b.right,bottom:b.bottom+scrollY};};
          const style=node=>{const s=getComputedStyle(node);return{font:s.fontSize,line:s.lineHeight,weight:s.fontWeight,color:s.color,background:s.backgroundColor,border:s.border,borderRadius:s.borderRadius,outline:s.outline,padding:s.padding,gap:s.gap,shadow:s.boxShadow};};
          const icon=root.querySelector('[data-profile-trigger]'),nav=root.querySelector('.shinka-product-nav'),heading=root.querySelector('h1');
          return{icon:box(icon),iconStyle:style(icon),svg:box(icon.querySelector('svg')),iconHref:icon.getAttribute('href'),
            heading:box(heading),headingStyle:style(heading),headingHtml:heading.outerHTML,
            cards:[...root.querySelectorAll('[data-home-card]')].map(node=>({box:box(node),html:node.outerHTML})),
            nav:{box:box(nav),style:style(nav),links:[...nav.querySelectorAll('a')].map(node=>({box:box(node),style:style(node),html:node.innerHTML,href:node.getAttribute('href'),current:node.getAttribute('aria-current')}))},scrollWidth:document.documentElement.scrollWidth};
        });
        const paint=await readBackdrop(page);
        const artwork=Object.fromEntries(['artWidth','artHeight','artLeft','artTop','inset','logo','position','opacity','filter','mask','overlay','documentTop','readingSurface'].map(key=>[key,paint[key]]));
        if(!baseline){
          const slot=await page.locator('[data-'+name+'-root]:visible [data-profile-logo-slot]').boundingBox();
          assert.equal(slot.width,44);assert.equal(slot.height,44);
          assert(metrics.scrollWidth<=width+1,key+' overflow');
          assert.equal(metrics.icon.width,44);assert.equal(metrics.icon.height,44);
          assert.equal(metrics.svg.width,20);assert.equal(metrics.svg.height,20);
          assert(Math.abs(metrics.icon.y-safe.top-16)<1,key+' safe top');
          assert(Math.abs(width-metrics.icon.right-Math.max(20,safe.right))<1,key+' consistent right edge');
          assert(metrics.icon.x>=paint.logo.right+8,key+' logo collision');
          assert(metrics.icon.y<paint.logo.bottom&&metrics.icon.bottom>paint.logo.top,key+' must be beside logo');
          const old=before.find(row=>row.key===key);
          if(comparison){
            assert(old,'missing baseline '+key);
            assert.deepEqual(artwork,old.artwork,'background must not change '+key);
            assert.deepEqual(metrics.nav,old.metrics.nav,'bottom navigation must not change '+key);
            assert.deepEqual(metrics.heading,old.metrics.heading,'page heading must not move '+key);
            assert.deepEqual(metrics.headingStyle,old.metrics.headingStyle);
            assert.equal(metrics.headingHtml,old.metrics.headingHtml);
            assert.deepEqual(metrics.cards,old.metrics.cards,'086 Home cards/layout must not change '+key);
            assert.deepEqual(metrics.iconStyle,old.metrics.iconStyle,'icon design must not change '+key);
            assert.equal(metrics.iconHref,old.metrics.iconHref);
          }
          await page.evaluate(()=>window.scrollTo(0,document.documentElement.scrollHeight));
          const iconDocumentY=await page.locator('[data-profile-trigger]:visible').evaluate(node=>node.getBoundingClientRect().top+scrollY);
          assert(Math.abs(iconDocumentY-metrics.icon.y)<1,'icon must scroll with the unchanged artwork');
          await page.evaluate(()=>window.scrollTo(0,0));
          await page.locator('[data-profile-trigger]:visible').focus();
          assert(await page.locator('[data-profile-trigger]:visible').evaluate(node=>node===document.activeElement));
          await page.locator('[data-profile-trigger]:visible').press('Enter');
          await page.locator('[data-you-preferences-form]').waitFor();
          assert.equal(await page.locator('[data-profile-trigger]:visible').count(),1);
          assert((await page.evaluate(()=>window.__authFixture.calls)).every(call=>!['accept','saveProfile','saveCycle','begin','execute','updateProfile','updatePreferences'].includes(call.action)));
        }
        if(directory&&scale===1&&language==='tr'&&[320,390,1280].includes(width)){
          // Return to the measured route; no account preference is changed.
          if(!baseline&&name!=='you'){await page.goBack();await page.locator('[data-'+name+'-root]:visible').waitFor();await page.evaluate(()=>window.scrollTo(0,0));}
          await page.screenshot({path:path.join(directory,key+'.png'),fullPage:true});
        }
        results.push({key,metrics,artwork});
      }
      if(!baseline)for(const[index,[name]]of routes.slice(0,3).entries()){
        await page.locator('nav a:visible').nth(index).click();
        await page.locator('[data-'+name+'-root]:visible').waitFor();
        assert.equal(await page.locator('[data-profile-trigger]:visible').count(),1,'retained tabs must not duplicate the icon');
        const top=await page.locator('[data-profile-trigger]:visible').evaluate(node=>node.getBoundingClientRect().top+scrollY);
        assert(Math.abs(top-safe.top-16)<1,'retained tab must use the same logo anchor');
      }
      assert.deepEqual(errors,[]);
    }finally{await context.close();}
  }
  if(directory)await writeFile(path.join(directory,'measurements.json'),JSON.stringify(results,null,2));
  return{scope:baseline?'BASELINE_CAPTURE':'LOCAL_REAL_APP_SYNTHETIC_SDK',scenarios:results.length,passed:baseline?undefined:true};
}

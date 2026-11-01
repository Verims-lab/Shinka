import { BACKGROUND_ASSETS } from '../src/foundation/sectionBackgrounds.js';
import assert from 'node:assert/strict';
import { mkdir, writeFile, readFile } from 'node:fs/promises';
import { doubleText } from './mobileSurfaceMeasurements.mjs';
import { FIRST_CONTENT_SOURCE } from '../base44/shared/firstContentSource.js';

export const navGeometry = page => page.locator('nav.shinka-product-nav:visible').evaluate(nav => {
  const box = e => { const r=e.getBoundingClientRect();return {x:r.x,y:r.y,width:r.width,height:r.height}; };
  const style=getComputedStyle(nav);
  return {nav:box(nav),paddingBottom:parseFloat(style.paddingBottom),border:parseFloat(style.borderTopWidth),
    viewport:innerWidth,overflow:document.documentElement.scrollWidth,
    links:[...nav.children].map(a=>{const icon=a.querySelector('svg'),range=document.createRange();
      const label=a.querySelector('span')||[...a.childNodes].find(n=>n.nodeType===Node.TEXT_NODE&&n.textContent.trim());
      range.selectNodeContents(label);const text=label instanceof Element?label.getBoundingClientRect():range.getBoundingClientRect(),r=box(a),i=box(icon);
      return {box:r,icon:i,label:{x:text.x,y:text.y,width:text.width,height:text.height},groupTop:i.y,groupBottom:text.bottom};})};
});

// Actual App, isolated transport; env() and injected inset measurements are
// separate. No inference about Android system bars or a native wrapper.
export async function checkReopenNavigation(browser,origin,directory,{baseline=false,visualAssets=false}={}) {
  const fontCss=(await readFile('index.html','utf8')).match(/href="(https:\/\/fonts.googleapis.com\/css2[^"]+)"/)[1];
  if(directory)await mkdir(directory,{recursive:true});const rows=[];
  for(const language of ['tr','en'])for(const [width,height] of [[320,568],[390,844],[740,320]])for(const scale of [1,2]){
    const context=await browser.newContext({viewport:{width,height},locale:language,hasTouch:true}),page=await context.newPage();
    const errors=[];page.on('pageerror',e=>errors.push(e.message));
    await page.route('**/*',r=>{const url=new URL(r.request().url());const asset=visualAssets&&r.request().method()==='GET'&&([fontCss,BACKGROUND_ASSETS.watercolor].includes(url.href)||url.origin==='https://fonts.gstatic.com'&&url.pathname.startsWith('/s/'));return url.origin===origin||asset?r.continue():r.abort();});
    await page.addInitScript(pair=>{window.__dailyFixture={state:'ACTIVE_EXISTING_USER',persisted:true,profile:{display_name:'Ada'},daily:{id:'navigation-existing',shinka_date:'2026-10-20',message_tr_snapshot:pair[2],suggestion_tr_snapshot:pair[3],message_en_snapshot:pair[4],suggestion_en_snapshot:pair[5]}};},FIRST_CONTENT_SOURCE.pairs[0]);
    try {
      for(const [surface,url,ready] of [['home','/','[data-daily-id]'],['calendar','/calendar','[data-calendar-date]'],['pattern','/pattern','[data-lunar-summary]']]){
        await page.goto(`${origin}${url}?appFixture=1&sdkSession=admin&onboardingState=ACTIVE_EXISTING_USER&language=${language}`);
        await page.locator(ready).first().waitFor();
        // A baseline component supplied by the temporary Vite transform is outside Tailwind source scanning. Reproduce its original min-h-14 utility exactly.
        if(baseline)await page.addStyleTag({content:'.shinka-product-nav > a { min-height: 3.5rem; }'});
        if(visualAssets){await page.evaluate(href=>{const link=document.createElement('link');link.rel='stylesheet';link.href=href;link.dataset.captureFont='true';document.head.append(link);},fontCss);await page.waitForFunction(()=>document.querySelector('link[data-capture-font]')?.sheet);await page.evaluate(()=>document.fonts.ready);await page.evaluate(src=>new Promise((resolve,reject)=>{const img=new Image();img.onload=()=>resolve(true);img.onerror=()=>reject(new Error('ASSET_UNAVAILABLE'));img.src=src;}),BACKGROUND_ASSETS.watercolor);}
        if(scale===2)await doubleText(page);
        for(const inset of [null,0,34]){
          await page.evaluate(inset=>inset===null?document.documentElement.style.removeProperty('--safe-bottom'):document.documentElement.style.setProperty('--safe-bottom',`${inset}px`),inset);
          const measured=await navGeometry(page),links=measured.links;
          assert.equal(links.length,3);assert(measured.overflow<=width+1);
          assert(links.every(l=>l.box.width>=44&&l.box.height>=44));
          assert(Math.max(...links.map(l=>l.box.width))-Math.min(...links.map(l=>l.box.width))<1);
          assert(Math.abs(measured.nav.height-measured.border-measured.paddingBottom-links[0].box.height)<1,'extra nav row/gap');
          if(inset!==null)assert.equal(measured.paddingBottom,inset,'inset missing/doubled');
          if(!baseline)for(const l of links){assert(Math.abs((l.box.y+l.box.height/2)-(l.groupTop+l.groupBottom)/2)<1);assert(Math.abs(l.icon.x+l.icon.width/2-l.box.x-l.box.width/2)<1);assert(Math.abs(l.label.x+l.label.width/2-l.box.x-l.box.width/2)<1);assert(l.label.width<=l.box.width+1,JSON.stringify({language,width,height,scale,surface,inset,label:l.label,link:l.box}));}
          if(!baseline&&scale===1)assert.equal(links[0].box.height,44);
          rows.push({language,width,height,scale,surface,inset:inset===null?'env':inset,...measured,passed:true,physicalDevice:false,publicAssets:visualAssets?'LOADED':'BLOCKED_OFFLINE'});
          if(directory&&surface==='home'&&width===390&&scale===1)await page.screenshot({path:`${directory}/home-${language}-${inset===null?'env':inset}.png`,fullPage:true});
        }
      }
      assert.equal(errors.length,0);
    } finally {await context.close();}
  }
  if(directory)await writeFile(`${directory}/navigation.json`,JSON.stringify(rows,null,2));return rows;
}

// Optional local QA artifacts from the existing runner; no independent assertions/test suite.
import { mkdir, writeFile } from "node:fs/promises";
import path from "node:path";
export async function captureFoundationVisuals(page, origin, directory) {
  await mkdir(directory,{recursive:true});
  const measurements=[];
  for(const width of [360,1280]) for(const route of ["/internal/health","/internal/build","/login"]){
    await page.setViewportSize({width,height:900});await page.goto(`${origin}${route}`);await page.waitForSelector("[data-probe-root]");
    await page.waitForFunction(()=>!document.querySelector('[data-state="LOADING"]'));
    const key=`${route.split("/").filter(Boolean).join("-")}-${width}`;
    await page.screenshot({path:path.join(directory,`${key}.png`),animations:"disabled"});
    const layout=await page.locator("[data-probe-root]").evaluate(root=>Array.from(root.querySelectorAll("h1,h2,button,input,section")).slice(0,30).map(el=>{
      const r=el.getBoundingClientRect(),s=getComputedStyle(el);return {tag:el.tagName,text:el.textContent?.slice(0,80),x:r.x,y:r.y,width:r.width,height:r.height,color:s.color,background:s.backgroundColor,font:s.fontFamily,size:s.fontSize,weight:s.fontWeight,radius:s.borderRadius};
    }));
    measurements.push({key,layout});
  }
  for(const language of ['en','tr']) for(const width of [360,430]) for(const step of ['UNAUTHENTICATED_INTRO','UNAUTHENTICATED_NAME','UNAUTHENTICATED_SIGN_IN','AUTHENTICATED_PROFILE_REQUIRED','AUTHENTICATED_CYCLE_STEP','FIRST_SHINKA_DEPENDENCY']){
    await page.setViewportSize({width,height:740});await page.goto(`${origin}/onboarding-fixture?step=${step}&language=${language}`);await page.waitForSelector('[data-onboarding-state]');
    await page.screenshot({path:path.join(directory,`${step}-${language}-${width}.png`),fullPage:true,animations:'disabled'});
  }
  // Current ON-04 selection flow using real components and isolated fixtures.
  // selectOption exercises selection; native popup keyboard navigation needs device QA.
  for(const language of ['en','tr'])for(const width of [360,1280]){
    await page.setViewportSize({width,height:900});
    await page.goto(`${origin}/onboarding-fixture?step=AUTHENTICATED_PROFILE_REQUIRED&language=${language}`);
    await page.waitForFunction(()=>document.querySelector('#place-countries option[value="100"]'));
    await page.screenshot({path:path.join(directory,`birthplace-empty-${language}-${width}.png`),fullPage:true,animations:'disabled'});
    await page.locator('#place-countries').selectOption('100');
    await page.waitForFunction(()=>document.querySelector('#place-countries').value==='100');
    for(const [id,value] of [['place-0','1001'],['place-1','1002'],['place-places','123']]){
      await page.waitForFunction(({id,value})=>!!document.querySelector(`#${id} option[value="${value}"]`)&&!document.getElementById(id).disabled,{id,value});
      await page.locator(`#${id}`).selectOption(value);
      await page.waitForFunction(({id,value})=>document.getElementById(id).value===value,{id,value});
    }
    await page.waitForSelector('[data-place-summary]');
    await page.locator('#place-places').focus();await page.keyboard.press('Tab');
    const metrics=await page.locator('[data-birthplace-picker]').evaluate(root=>({width:innerWidth,scrollWidth:document.documentElement.scrollWidth,selects:[...root.querySelectorAll('select')].map(el=>({id:el.id,value:el.value,height:el.getBoundingClientRect().height,label:!!root.querySelector(`label[for="${el.id}"]`)})),focused:document.activeElement?.id,focusStyle:getComputedStyle(document.activeElement).outlineStyle}));
    if(metrics.scrollWidth>width+1||metrics.selects.some(s=>s.height<44||!s.label))throw new Error('ON04_VISUAL_LAYOUT_FAILURE');
    measurements.push({key:`birthplace-selection-${language}-${width}`,metrics});
    await page.screenshot({path:path.join(directory,`birthplace-selected-${language}-${width}.png`),fullPage:true,animations:'disabled'});
  }
  await writeFile(path.join(directory,"layouts.json"),JSON.stringify(measurements,null,2));
}

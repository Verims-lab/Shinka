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
  await writeFile(path.join(directory,"layouts.json"),JSON.stringify(measurements,null,2));
}

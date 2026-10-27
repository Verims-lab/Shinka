import assert from 'node:assert/strict';
import { mkdir, writeFile } from 'node:fs/promises';
import path from 'node:path';
import { inspectMobileSurface, doubleText } from './mobileSurfaceMeasurements.mjs';
import { checkMobileInteractions } from './checkMobileInteractions.mjs';
import { FIRST_CONTENT_SOURCE } from '../base44/shared/firstContentSource.js';

export async function checkMobileExperience(browser, origin, directory) {
  const context=await browser.newContext({viewport:{width:320,height:568},hasTouch:true,isMobile:true});
  const page=await context.newPage(), errors=[], rows=[];
  page.on('pageerror',error=>errors.push(error.message));
  await page.route('**/*',route=>new URL(route.request().url()).origin===origin?route.continue():route.abort());
  await page.addInitScript(()=>{const language=new URL(location.href).searchParams.get('language');if(language)history.replaceState({usr:{language}},'',location.href);});
  const pair=FIRST_CONTENT_SOURCE.pairs[0];
  await page.addInitScript(pair=>{window.__dailyFixture={state:'ACTIVE_EXISTING_USER',persisted:true,profile:{display_name:'Ada'},daily:{id:'mobile-existing',shinka_date:'2026-10-20',message_tr_snapshot:pair[2],suggestion_tr_snapshot:pair[3],message_en_snapshot:pair[4],suggestion_en_snapshot:pair[5]}};},pair);
  if(directory)await mkdir(directory,{recursive:true});
  const query='appFixture=1&sdkSession=admin&onboardingState=ACTIVE_EXISTING_USER';
  const surfaces=[
    ['onboarding','/onboarding-fixture?step=AUTHENTICATED_PROFILE_REQUIRED','#birthplace'],
    ['cycle','/onboarding-fixture?step=AUTHENTICATED_CYCLE_STEP','input[type=date]'],
    ['home',`/?${query}`,'[data-daily-id]'], ['calendar',`/calendar?${query}`,'[data-calendar-date]'],
    ['pattern',`/pattern?${query}`,'[data-lunar-timeline]'], ['you',`/you?${query}`,'#you-language'],
    ['privacy',`/account-privacy?${query}`,'[data-privacy-actions] button'],
    ['admin',`/internal?${query}`,'[data-admin-panel]'], ['health',`/internal/health?${query}`,'[data-health-root]'],
  ];
  const selectedSurfaces=process.env.FOUNDATION_MOBILE_SURFACE?surfaces.filter(([name])=>name===process.env.FOUNDATION_MOBILE_SURFACE):surfaces;
  try {
    for(const scheme of ['light','dark'])for(const language of ['tr','en'])for(const [width,height] of [[320,568],[844,390]])for(const [surface,url,ready] of selectedSurfaces){
      await page.emulateMedia({colorScheme:scheme});await page.setViewportSize({width,height});
      await page.goto(`${origin}${url}&language=${language}&lang=${language}`);await page.locator(ready).first().waitFor();
      await page.waitForFunction(scheme=>getComputedStyle(document.documentElement).colorScheme===scheme,scheme);
      for(const scale of [1,2]){
        if(scale===2)await doubleText(page);
        const measured=await inspectMobileSurface(page);
        const passed=measured.scrollWidth<=width+1&&!measured.small.length&&!measured.textOverflow.length&&!measured.contrastFailures.length&&measured.boundaries.every(r=>r.focus>=3&&r.input>=3)&&measured.documentScroll&&measured.overscrollY==='contain';
        rows.push({scenario:`${surface}-${scheme}-${language}-${width}-${scale}x`,...measured,passed});
        if(directory&&width===320&&language==='tr'&&scale===2)await page.screenshot({path:path.join(directory,`${surface}-${scheme}-320-200percent.png`),fullPage:surface!=='health'});
      }
      // Change the OS preference while the same page remains mounted.
      const other=scheme==='dark'?'light':'dark';await page.emulateMedia({colorScheme:other});
      await page.waitForFunction(other=>getComputedStyle(document.documentElement).colorScheme===other,other);
    }
    if(!process.env.FOUNDATION_MOBILE_SURFACE)rows.push(...await checkMobileInteractions(page,origin,directory));
    rows.push({scenario:'mobile-page-errors',errors,passed:!errors.length});
    assert(rows.length>=selectedSurfaces.length*16,'missing matrix');
    return rows;
  } finally { if(directory)await writeFile(path.join(directory,'mobile-measurements.json'),JSON.stringify({rows,errors},null,2)); await context.close(); }
}

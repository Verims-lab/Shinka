import { loadAppBackdrop } from './checkAppBackdrop.mjs';
import assert from 'node:assert/strict';
import { mkdir, writeFile, readFile } from 'node:fs/promises';
import { doubleText } from './mobileSurfaceMeasurements.mjs';
import { FIRST_CONTENT_SOURCE } from '../base44/shared/firstContentSource.js';

const surfaces = [['home','/','[data-daily-id]'],['calendar','/calendar','[data-calendar-date]'],['pattern','/pattern','[data-lunar-timeline]']];
const seed = async page => page.addInitScript(pair => {
  window.__dailyFixture = {state:'ACTIVE_EXISTING_USER',persisted:true,profile:{display_name:'Ada'},daily:{id:'navigation-existing',shinka_date:'2026-10-20',message_tr_snapshot:pair[2],suggestion_tr_snapshot:pair[3],message_en_snapshot:pair[4],suggestion_en_snapshot:pair[5]}};
}, FIRST_CONTENT_SOURCE.pairs[0]);
const open = async (page, origin, route, ready, language = 'tr') => {
  await page.goto(origin+route+'?appFixture=1&sdkSession=admin&onboardingState=ACTIVE_EXISTING_USER&language='+language);
  await page.locator(ready).first().waitFor();
};
const settled = async page => page.waitForFunction(() => {
  const nav = [...document.querySelectorAll('nav.shinka-product-nav')].find(el => el.getClientRects().length);
  if(!nav)return false;
  const dock=nav.closest('.shinka-nav-dock'),covered=parseFloat(dock.style.getPropertyValue('--shinka-viewport-bottom'))||0;
  return Math.abs(nav.closest('.shinka-nav-safe-area').getBoundingClientRect().height-dock.getBoundingClientRect().height-covered)<.5;
});
const scroll = async (page, stage) => page.evaluate(async stage => {
  const maximum = document.documentElement.scrollHeight - innerHeight;
  scrollTo(0, stage === 'initial' ? 0 : stage === 'middle' ? maximum / 2 : maximum);
  await new Promise(requestAnimationFrame);
}, stage);

export const navGeometry = page => page.locator('nav.shinka-product-nav:visible').evaluate(nav => {
  const box = element => { const r = element.getBoundingClientRect(); return {x:r.x,y:r.y,width:r.width,height:r.height}; };
  const dock = nav.closest('.shinka-nav-dock'), space = nav.closest('.shinka-nav-safe-area'), shell = nav.closest('.shinka-safe-shell'), main = shell.querySelector('main');
  const style = getComputedStyle(nav), dockStyle = getComputedStyle(dock), root = getComputedStyle(document.documentElement);
  const navBox = nav.getBoundingClientRect(), spaceBox = space.getBoundingClientRect(), mainBox = main.getBoundingClientRect();
  const viewport = window.visualViewport, visibleBottom = viewport ? viewport.height + viewport.offsetTop : innerHeight;
  return {
    nav:box(nav), dock:box(dock), space:box(space), position:style.position, dockPosition:dockStyle.position,
    paddingBottom:parseFloat(style.paddingBottom), safePaddingBottom:parseFloat(dockStyle.paddingBottom), safeBackground:dockStyle.backgroundColor,
    border:parseFloat(style.borderTopWidth), marginBottom:parseFloat(style.marginBottom), dockMarginBottom:parseFloat(dockStyle.marginBottom),
    shellPaddingBottom:parseFloat(getComputedStyle(shell).paddingBottom), spacePaddingBottom:parseFloat(getComputedStyle(space).paddingBottom),
    contentPaddingBottom:parseFloat(getComputedStyle(main).paddingBottom), contentSpaceGap:spaceBox.top-mainBox.bottom,
    shellTail:shell.getBoundingClientRect().bottom-spaceBox.bottom, documentTail:document.documentElement.scrollHeight-(spaceBox.bottom+scrollY),
    contentOverlap:Math.max(0,main.lastElementChild.getBoundingClientRect().bottom-navBox.top),
    safeBottom:parseFloat(root.getPropertyValue('--safe-bottom'))||0, safeLeft:parseFloat(root.getPropertyValue('--safe-left'))||0, safeRight:parseFloat(root.getPropertyValue('--safe-right'))||0,
    viewport:innerWidth, viewportHeight:innerHeight, visibleBottom, covered:Math.max(0,innerHeight-visibleBottom), overflow:document.documentElement.scrollWidth,
    scrollY, motionTransform:getComputedStyle(nav.closest('[data-route-motion]') || shell).transform,
    links:[...nav.children].map(link => {
      const icon=box(link.querySelector('svg')),label=box(link.querySelector('span')),rect=box(link),css=getComputedStyle(link);
      const hit=document.elementFromPoint(rect.x+rect.width/2,rect.y+rect.height/2);
      return {box:rect,icon,label,groupTop:icon.y,groupBottom:label.y+label.height,paddingTop:parseFloat(css.paddingTop),paddingBottom:parseFloat(css.paddingBottom),receivesInput:!!hit&&link.contains(hit)};
    }),
  };
});

// Viewport anchoring and document reservation are independent invariants.
function assertBottomOwnership(measured, {end=false} = {}) {
  assert.equal(measured.dockPosition,'fixed','navigation dock must stay fixed to the viewport');
  assert.equal(measured.motionTransform,'none','a transformed ancestor captures fixed positioning');
  assert.equal(measured.paddingBottom,0,'painted nav must not consume the system inset');
  for (const key of ['marginBottom','dockMarginBottom','shellPaddingBottom','spacePaddingBottom','contentSpaceGap','shellTail'])
    assert(Math.abs(measured[key])<1,key+': duplicate footer space');
  assert.equal(measured.safeBackground,'rgba(0, 0, 0, 0)','system inset must remain separate from the painted bar');
  const remainingSafe=Math.max(0,measured.safeBottom-measured.covered);
  assert(Math.abs(measured.safePaddingBottom-remainingSafe)<1,'system inset missing/doubled');
  assert(Math.abs(measured.dock.y+measured.dock.height-measured.visibleBottom)<1,'dock bottom differs from the visible viewport');
  assert(Math.abs(measured.nav.y+measured.nav.height-(measured.visibleBottom-remainingSafe))<1,'blank gap below the painted navigation');
  assert(Math.abs(measured.dock.height-measured.nav.height-remainingSafe)<1,'extra dock row/gap');
  assert(Math.abs(measured.space.height-measured.dock.height-measured.covered)<1,'content reservation differs from navigation and occluded viewport height');
  assert(Math.abs(measured.nav.x-measured.safeLeft)<1&&Math.abs(measured.nav.x+measured.nav.width-(measured.viewport-measured.safeRight))<1,'horizontal safe areas missing/doubled');
  assert(Math.abs(measured.documentTail)<1,'extra document space after the reserved footer');
  assert(measured.overflow<=measured.viewport+1,'horizontal overflow');
  if(end)assert(measured.contentOverlap<1,'last content is hidden behind the fixed navigation');
  const links=measured.links;
  assert.equal(links.length,3);
  assert(Math.max(...links.map(link=>link.box.width))-Math.min(...links.map(link=>link.box.width))<1,'unequal columns');
  assert(Math.abs(measured.nav.height-measured.border-links[0].box.height)<1,'extra navigation row');
  for(const link of links){
    assert(link.box.width>=44&&link.box.height>=44&&link.receivesInput,'navigation target is clipped, covered or too small');
    assert(link.paddingTop>=12&&link.paddingBottom>=12,'internal padding is below 12px');
    assert(link.groupTop-link.box.y>=12-.5&&link.box.y+link.box.height-link.groupBottom>=12-.5,'icon/label touches an edge');
    assert(Math.abs(measured.nav.y+measured.border+(measured.nav.height-measured.border)/2-(link.groupTop+link.groupBottom)/2)<1,'icon and label group is not centered');
    assert.equal(link.icon.width,20);assert.equal(link.icon.height,20);
    assert(Math.abs(link.label.y-link.icon.y-link.icon.height-4)<1,'icon/label gap changed');
    assert(Math.abs(link.icon.x+link.icon.width/2-link.box.x-link.box.width/2)<1);
    assert(Math.abs(link.label.x+link.label.width/2-link.box.x-link.box.width/2)<1);
    assert(link.label.width<=link.box.width+1,'label overflow');
  }
}

async function rejectExtraSpace(page) {
  for(const [css,message] of [
    ['.shinka-safe-shell {padding-bottom:34px!important}',/shellPaddingBottom/],
    ['.shinka-product-nav {padding-bottom:34px!important}',/system inset/],
    ['.shinka-nav-dock {margin-bottom:40px!important}',/dockMarginBottom/],
    ['.shinka-nav-dock {bottom:40px!important}',/visible viewport/],
    ['.shinka-nav-dock {position:static!important}',/stay fixed/],
    ['.shinka-nav-safe-area {height:0!important}',/content reservation/],
  ]) {
    const injected=await page.addStyleTag({content:css});
    const measured=await navGeometry(page);
    assert.throws(()=>assertBottomOwnership(measured),message);
    await injected.evaluate(node=>node.remove());
  }
}

export async function checkVisibleViewport(browser,origin) {
  const rows=[],context=await browser.newContext({viewport:{width:390,height:844},locale:'tr-TR'}),page=await context.newPage();
  const errors=[];page.on('pageerror',error=>errors.push(error.message));
  await page.route('**/*',route=>new URL(route.request().url()).origin===origin?route.continue():route.abort());
  await seed(page);
  await page.addInitScript(()=>{
    // Only metrics/events are synthetic; the real App and fixed CSS are measured.
    const viewport=new EventTarget();Object.assign(viewport,{height:innerHeight,offsetTop:0,scale:1});
    Object.defineProperty(window,'visualViewport',{configurable:true,value:viewport});
  });
  try {
    for(const [surface,route,ready] of surfaces){
      await open(page,origin,route,ready);
      await page.evaluate(()=>document.documentElement.style.setProperty('--safe-bottom','34px'));
      for(const [height,offsetTop,scenario] of [[564,0,'visual-only-shrink'],[544,20,'visual-offset-scroll'],[844,0,'visual-restore']]){
        await page.evaluate(({height,offsetTop})=>{Object.assign(window.visualViewport,{height,offsetTop});window.visualViewport.dispatchEvent(new Event('resize'));window.visualViewport.dispatchEvent(new Event('scroll'));},{height,offsetTop});
        await settled(page);await scroll(page,'end');const measured=await navGeometry(page);assertBottomOwnership(measured,{end:true});
        rows.push({surface,scenario,...measured,passed:true,physicalDevice:false,scope:'SYNTHETIC_VISUAL_VIEWPORT_METRICS_NOT_OS_KEYBOARD'});
      }
    }
    assert.equal(errors.length,0);return rows;
  } finally {await context.close();}
}

export async function checkNavigationEntryRoutes(browser,origin) {
  const rows=[],context=await browser.newContext({viewport:{width:390,height:664},locale:'tr-TR'}),page=await context.newPage(),errors=[];
  page.on('pageerror',error=>errors.push(error.message));
  await page.route('**/*',route=>new URL(route.request().url()).origin===origin?route.continue():route.abort());
  await seed(page);
  try{
    for(const entry of ['/login','/onboarding']){
      await open(page,origin,'/account-privacy','[data-privacy-actions]');
      await page.evaluate(entry=>{
        history.pushState({...history.state,idx:(history.state?.idx||0)+1,key:crypto.randomUUID()},'',entry+'?appFixture=1&sdkSession=admin&onboardingState=ACTIVE_EXISTING_USER&language=tr');
        dispatchEvent(new PopStateEvent('popstate',{state:history.state}));
      },entry);
      await page.locator('[data-daily-id]').waitFor();await settled(page);
      for(const stage of ['initial','end']){
        await scroll(page,stage);const measured=await navGeometry(page);assertBottomOwnership(measured,{end:stage==='end'});
        rows.push({entry,stage,...measured,passed:true,physicalDevice:false,scope:'REAL_APP_SPA_HISTORY_WITH_VERIFIED_SYNTHETIC_PROGRESS'});
      }
    }
    assert.equal(errors.length,0);return rows;
  }finally{await context.close();}
}

// Real App, isolated SDK transport. No inference about native system bars.
export async function checkReopenNavigation(browser,origin,directory,{visualAssets=false}={}) {
  const fontCss=(await readFile('index.html','utf8')).match(/href="(https:\/\/fonts.googleapis.com\/css2[^"]+)"/)[1];
  if(directory)await mkdir(directory,{recursive:true});const rows=[];
  const viewports=[[320,480],[320,740],[360,568],[360,800],[390,664],[390,844],[430,740],[430,932],[740,320]];
  for(const language of ['tr','en'])for(const [width,height] of viewports)for(const scale of [1,2]){
    const context=await browser.newContext({viewport:{width,height},locale:language,hasTouch:true}),page=await context.newPage(),errors=[];
    page.on('pageerror',error=>errors.push(error.message));
    await page.route('**/*',route=>{const url=new URL(route.request().url()),asset=visualAssets&&route.request().method()==='GET'&&(url.href===fontCss||url.origin==='https://fonts.gstatic.com'&&url.pathname.startsWith('/s/'));return url.origin===origin||asset?route.continue():route.abort();});
    await seed(page);
    try {
      for(const [surface,url,ready] of surfaces){
        await open(page,origin,url,ready,language);
        if(visualAssets){await page.evaluate(href=>{const link=document.createElement('link');link.rel='stylesheet';link.href=href;link.dataset.captureFont='true';document.head.append(link);},fontCss);await page.waitForFunction(()=>document.querySelector('link[data-capture-font]')?.sheet);await page.evaluate(()=>document.fonts.ready);await loadAppBackdrop(page);}
        if(scale===2)await doubleText(page);
        for(const inset of [null,0,24,34]){
          // 0: native-consumed inset; 24/34: Android/iOS gesture simulations.
          await page.evaluate(inset=>{inset===null?document.documentElement.style.removeProperty('--safe-bottom'):document.documentElement.style.setProperty('--safe-bottom',inset+'px');},inset);
          await settled(page);
          for(const stage of ['initial','middle','end']){
            await scroll(page,stage);const measured=await navGeometry(page);assertBottomOwnership(measured,{end:stage==='end'});
            rows.push({language,width,height,scale,surface,inset:inset===null?'env':inset,stage,...measured,passed:true,physicalDevice:false});
            if(directory&&width===390&&height===844&&scale===1&&inset===34&&stage!=='middle')await page.screenshot({path:directory+'/'+surface+'-'+language+'-'+stage+'.png'});
          }
        }
        if(surface==='home'&&width===320&&height===480&&language==='tr'&&scale===1){
          await rejectExtraSpace(page);await settled(page);assertBottomOwnership(await navGeometry(page));
          rows.push({scenario:'duplicate-insets-static-footer-offset-and-missing-reservation-rejected',passed:true,physicalDevice:false});
        }
        if(surface==='calendar'&&height>width){
          const input=page.locator('[data-calendar-date]').first(),value=await input.getAttribute('data-calendar-date'),before=await navGeometry(page);
          await input.focus();await page.setViewportSize({width,height:320});await settled(page);await scroll(page,'end');assertBottomOwnership(await navGeometry(page),{end:true});
          assert.equal(await input.getAttribute('data-calendar-date'),value);
          await page.setViewportSize({width,height});await input.blur();await settled(page);
          const restored=await navGeometry(page);assertBottomOwnership(restored);assert.equal(restored.nav.height,before.nav.height);
          rows.push({language,width,height,scale,surface,scenario:'keyboard-viewport-shrink-restore',passed:true,physicalDevice:false,scope:'SIMULATED_RESIZE_AND_FOCUS_NOT_OS_KEYBOARD'});
        }
      }
      assert.equal(errors.length,0);
    } finally {await context.close();}
  }
  rows.push(...await checkVisibleViewport(browser,origin));
  rows.push(...await checkNavigationEntryRoutes(browser,origin));
  if(directory)await writeFile(directory+'/navigation.json',JSON.stringify(rows,null,2));return rows;
}

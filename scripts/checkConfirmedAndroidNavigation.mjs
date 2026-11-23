import assert from 'node:assert/strict';
import { readFile, mkdir, writeFile } from 'node:fs/promises';
import { FIRST_CONTENT_SOURCE } from '../base44/shared/firstContentSource.js';
import { createNavigationInsetResolver } from '../src/features/mobile/navigationInset.js';

const fixture=JSON.parse(await readFile(new URL('./fixtures/androidNavigation082.json',import.meta.url),'utf8'));
const android='Mozilla/5.0 (Linux; Android 16) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/144.0.0.0 Mobile Safari/537.36';
const ios='Mozilla/5.0 (iPhone; CPU iPhone OS 18_0 like Mac OS X) AppleWebKit/605.1.15 Version/18.0 Mobile/15E148 Safari/604.1';
const surfaces=[['home','/','[data-daily-id]'],['calendar','/calendar','[data-calendar-date]'],['pattern','/pattern','[data-lunar-timeline]']];

const measure = page => page.locator('nav.shinka-product-nav:visible').evaluate(nav=>{
  const dock=nav.closest('.shinka-nav-dock'),box=nav.getBoundingClientRect(),outer=dock.getBoundingClientRect(),css=getComputedStyle(dock),viewport=window.visualViewport;
  const visibleBottom=viewport?.scale===1?Math.min(document.documentElement.clientHeight,viewport.height+viewport.offsetTop):document.documentElement.clientHeight;
  return {barBottom:box.bottom,dockBottom:outer.bottom,height:box.height,dockPadding:parseFloat(css.paddingBottom),dockInset:parseFloat(css.bottom),visibleBottom,visibleBottomToBar:visibleBottom-box.bottom,viewportOcclusion:parseFloat(dock.style.getPropertyValue('--shinka-viewport-occlusion'))||0,policy:dock.dataset.insetPolicy,viewportConsumedBottom:parseFloat(css.getPropertyValue('--shinka-viewport-consumed-bottom'))||0,space:nav.closest('.shinka-nav-safe-area').getBoundingClientRect().height,metrics:{android:/\bAndroid\b/i.test(navigator.userAgent),touch:navigator.maxTouchPoints,browserMode:matchMedia('(display-mode: browser)').matches,width:document.documentElement.clientWidth,layoutHeight:document.documentElement.clientHeight,screenWidth:screen.availWidth,screenHeight:screen.availHeight,visualHeight:viewport?.height,scale:viewport?.scale}};
});
const waitPosition = async (page, expected) => {
  await page.waitForFunction(expected=>{
    const nav=Array.from(document.querySelectorAll('nav.shinka-product-nav')).find(el=>el.getClientRects().length);
    if(!nav)return false;const dock=nav.closest('.shinka-nav-dock'),bounds=dock.getBoundingClientRect();
    return Math.abs(nav.getBoundingClientRect().bottom-expected)<.5&&Math.abs(bounds.bottom-expected)<.5&&Math.abs(nav.closest('.shinka-nav-safe-area').getBoundingClientRect().height-bounds.height-Math.max(0,document.documentElement.clientHeight-bounds.bottom))<.5;
  },expected).catch(async error=>{console.error(JSON.stringify({navigationPositionFailure:{expected,...await measure(page)}}));throw error;});
};
const scroll = (page,stage) => page.evaluate(async stage=>{const maximum=document.documentElement.scrollHeight-document.documentElement.clientHeight;scrollTo(0,stage==='initial'?0:stage==='middle'?maximum/2:maximum);await new Promise(requestAnimationFrame);await new Promise(requestAnimationFrame);},stage);
const seed = async (page,width,available=fixture.screenAvailableHeight,options={}) => page.addInitScript(({width,available,fixture,pair,options})=>{
  if(options.nonBrowser){const nativeMatch=matchMedia.bind(window);window.matchMedia=query=>{const media=nativeMatch(query);if(query==='(display-mode: browser)')Object.defineProperty(media,'matches',{value:false});return media;};}
  const state={width,available,height:null,offsetTop:0,scale:options.scale??1},native=window.visualViewport,viewport=new EventTarget();
  Object.defineProperties(screen,{availWidth:{configurable:true,get:()=>state.width},availHeight:{configurable:true,get:()=>state.available}});
  Object.defineProperties(viewport,{height:{get:()=>state.height??native.height},width:{get:()=>native.width},offsetTop:{get:()=>state.offsetTop},scale:{get:()=>state.scale}});
  for(const event of ['resize','scroll'])native.addEventListener(event,()=>viewport.dispatchEvent(new Event(event)));
  Object.defineProperty(window,'visualViewport',{configurable:true,value:options.noVisual?undefined:viewport});
  window.__confirmedNavigationViewport=patch=>{Object.assign(state,patch);viewport.dispatchEvent(new Event('resize'));viewport.dispatchEvent(new Event('scroll'));dispatchEvent(new Event('resize'));};
  window.__dailyFixture={state:'ACTIVE_EXISTING_USER',persisted:true,profile:{display_name:'Ada'},daily:{id:'navigation-083',shinka_date:'2026-10-20',message_tr_snapshot:pair[2],suggestion_tr_snapshot:pair[3],message_en_snapshot:pair[4],suggestion_en_snapshot:pair[5]}};
  document.addEventListener('DOMContentLoaded',()=>{document.documentElement.style.setProperty('--safe-bottom',fixture.safeBottom+'px');if(options.declared)document.documentElement.style.setProperty('--shinka-native-consumed-bottom',options.declared+'px');});
},{width,available,fixture,pair:FIRST_CONTENT_SOURCE.pairs[0],options});

export async function checkConfirmedAndroidNavigation(browser,origin,directory) {
  const rows=[];
  if(directory)await mkdir(directory,{recursive:true});
  try {
    for(const width of [fixture.width,320,390,430]) {
      const context=await browser.newContext({viewport:{width,height:fixture.viewportBottom},screen:{width,height:fixture.screenAvailableHeight},isMobile:true,hasTouch:true,userAgent:android}),page=await context.newPage(),errors=[];
      page.on('pageerror',error=>errors.push(error.message));
      await page.route('**/*',route=>new URL(route.request().url()).origin===origin?route.continue():route.abort());
      await seed(page,width);
      try {
        for(const [surface,path,ready] of surfaces) {
          await page.goto(origin+path+'?appFixture=1&sdkSession=admin&onboardingState=ACTIVE_EXISTING_USER&language=tr');
          await page.locator(ready).first().waitFor();
          for(const [phase,layoutHeight,visualHeight,offsetTop] of [['recorded',724,null,0],['stale-visual',724,772,0],['keyboard-visual',724,400,0],['keyboard-layout',400,null,0],['keyboard-pan',724,380,20],['restored',724,null,0]]) {
            await page.setViewportSize({width,height:layoutHeight});
            await page.evaluate(({visualHeight,offsetTop})=>window.__confirmedNavigationViewport({height:visualHeight,offsetTop}),{visualHeight,offsetTop});
            const expectedBottom=Math.min(layoutHeight,(visualHeight??layoutHeight)+offsetTop);
            await waitPosition(page,expectedBottom);
            for(const stage of ['initial','middle','end']) {
              await scroll(page,stage);const measured=await measure(page);
              rows.push({surface,width,phase,stage,expectedBottom,...measured,physicalDevice:false,source:fixture.source});
              assert(Math.abs(measured.barBottom-expectedBottom)<1&&Math.abs(measured.dockBottom-expectedBottom)<1,JSON.stringify({failure:'CONFIRMED_ANDROID_082_POSITION',...rows.at(-1)}));
              assert.equal(measured.height,fixture.expected.normalHeight);assert.equal(measured.dockPadding,0);assert.equal(measured.visibleBottomToBar,0);
              assert.equal(measured.viewportConsumedBottom,fixture.safeBottom);assert.equal(measured.policy,'ANDROID_CLAMPED_VIEWPORT');
              if(stage==='end')assert(await page.locator('nav.shinka-product-nav:visible').evaluate(nav=>nav.closest('.shinka-safe-shell').querySelector('main').lastElementChild.getBoundingClientRect().bottom<=nav.getBoundingClientRect().top+1),'last content hidden behind fixed navigation');
              rows.at(-1).passed=true;
              if(directory&&width===fixture.width&&phase==='recorded'&&stage==='initial')await page.screenshot({path:`${directory}/${surface}-724.png`});
            }
          }
          // Changing into genuine edge-to-edge geometry invalidates the match.
          await page.setViewportSize({width,height:fixture.screenAvailableHeight});
          await page.evaluate(()=>window.__confirmedNavigationViewport({height:null,offsetTop:0}));
          await waitPosition(page,fixture.screenAvailableHeight-fixture.safeBottom);
          assert.equal((await measure(page)).viewportConsumedBottom,0,'genuine system overlap was suppressed');
          rows.push({surface,width,scenario:'restore-genuine-edge-to-edge',...await measure(page),passed:true,physicalDevice:false});
          await page.setViewportSize({width,height:fixture.viewportBottom});await waitPosition(page,fixture.viewportBottom);
          if(width===fixture.width&&surface==='home') {
            const oldRule=await page.addStyleTag({content:'.shinka-nav-safe-area { --shinka-viewport-consumed-bottom:0px!important; }'});
            await waitPosition(page,fixture.before.barBottom);const before=await measure(page);
            assert.equal(before.barBottom,fixture.before.barBottom);assert.equal(before.dockBottom,fixture.before.dockBottom);assert.equal(before.visibleBottomToBar,fixture.before.gap);
            await oldRule.evaluate(node=>node.remove());await page.evaluate(()=>dispatchEvent(new Event('resize')));await waitPosition(page,fixture.expected.barBottom);
            rows.push({scenario:'082-css-position-regression-rejected',before,after:await measure(page),passed:true,physicalDevice:false});
          }
        }
        assert.equal(errors.length,0);
      }finally{await context.close();}
    }
    rows.push(...await checkProtectedNavigationInsets(browser,origin));
    return rows;
  }finally{if(directory)await writeFile(directory+'/confirmed-android.json',JSON.stringify(rows,null,2));}
}

export async function checkProtectedNavigationInsets(browser,origin) {
  const rows=[];
  for(const scenario of [
    {name:'ios-identical-geometry',ua:ios,available:772},
    {name:'android-genuine-edge-to-edge',ua:android,available:724},
    {name:'android-unmatched-screen-gap',ua:android,available:820},
    {name:'android-unavailable-screen',ua:android,available:0},
    {name:'android-zoomed',ua:android,available:772,scale:2},
    {name:'android-no-visual-viewport',ua:android,available:772,noVisual:true},
    {name:'android-not-full-width',ua:android,available:772,screenWidth:400},
    {name:'android-pointer-independent',ua:android,available:772,touch:false,expected:724,consumed:48},
    {name:'android-non-browser-mode',ua:android,available:772,nonBrowser:true},
    {name:'explicit-native-partial',ua:android,available:772,declared:12,expected:688},
    ...[568,664,844].map(height=>({name:'android-clamped-height-'+height,ua:android,height,available:height+48,expected:height,consumed:48})),
  ]) {
    const height=scenario.height??724,expected=scenario.expected??676;
    const context=await browser.newContext({viewport:{width:360,height},screen:{width:scenario.screenWidth??360,height:Math.max(820,scenario.available)},isMobile:true,hasTouch:scenario.touch!==false,userAgent:scenario.ua}),page=await context.newPage(),errors=[];
    page.on('pageerror',error=>errors.push(error.message));
    await page.route('**/*',route=>new URL(route.request().url()).origin===origin?route.continue():route.abort());
    await seed(page,scenario.screenWidth??360,scenario.available,scenario);
    try {
      for(const [surface,path,ready] of surfaces) {
        const url=origin+path+'?appFixture=1&sdkSession=admin&onboardingState=ACTIVE_EXISTING_USER&language=tr';
        await page.goto(url);
        await page.locator(ready).first().waitFor();await waitPosition(page,expected);
        const measured=await measure(page);assert.equal(measured.viewportConsumedBottom,scenario.consumed??0);assert.equal(measured.barBottom,expected);assert.equal(measured.height,67);
        rows.push({surface,scenario:scenario.name,...measured,passed:true,physicalDevice:false});
      }
      assert.equal(errors.length,0);
    }catch(error){console.error(JSON.stringify({navigationFallbackFailure:scenario.name,errors}));throw error;}
    finally{await context.close();}
  }
  // The canonical server intentionally denies iframe rendering. Keep that
  // protection; exercise the conservative frame guard on the pure policy.
  const framePolicy=createNavigationInsetResolver()({android:true,topLevel:false,browserMode:true,touch:true,scale:1,width:360,screenWidth:360,screenHeight:772,nativeBottom:724,layoutBottom:724,visualBottom:724,safeBottom:48,declaredConsumed:0,dockBottom:676,barBottom:676,dockPadding:0,cssBottom:48,pixelRatio:2});
  assert.equal(framePolicy.consumed,0);
  rows.push({scenario:'framed-policy-fallback',scope:'PURE_POLICY_NOT_IFRAME_UI',...framePolicy,passed:true,physicalDevice:false});
  return rows;
}

import { loadAppBackdrop } from './checkAppBackdrop.mjs';
import { checkConfirmedAndroidNavigation } from './checkConfirmedAndroidNavigation.mjs';
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
  const dock=nav.closest('.shinka-nav-dock'),box=dock.getBoundingClientRect();
  return Math.abs(nav.closest('.shinka-nav-safe-area').getBoundingClientRect().height-box.height-Math.max(0,document.documentElement.clientHeight-box.bottom))<.5;
}).catch(async error => {
  console.error(JSON.stringify({navigationSettlementFailure:await navGeometry(page),dockStyles:await page.locator('.shinka-nav-dock:visible').getAttribute('style')}));
  throw error;
});
const scroll = async (page, stage) => page.evaluate(async stage => {
  const maximum = document.documentElement.scrollHeight - document.documentElement.clientHeight;
  scrollTo(0, stage === 'initial' ? 0 : stage === 'middle' ? maximum / 2 : maximum);
  await new Promise(requestAnimationFrame);
}, stage);

export const navGeometry = page => page.locator('nav.shinka-product-nav:visible').evaluate(nav => {
  const box = element => { const r = element.getBoundingClientRect(); return {x:r.x,y:r.y,width:r.width,height:r.height}; };
  const dock = nav.closest('.shinka-nav-dock'), space = nav.closest('.shinka-nav-safe-area'), shell = nav.closest('.shinka-safe-shell'), main = shell.querySelector('main');
  const style = getComputedStyle(nav), dockStyle = getComputedStyle(dock), root = getComputedStyle(document.documentElement);
  const navBox = nav.getBoundingClientRect(), spaceBox = space.getBoundingClientRect(), mainBox = main.getBoundingClientRect();
  const layoutHeight=document.documentElement.clientHeight;
  const viewport = window.visualViewport, visibleBottom = viewport?.scale===1 ? Math.min(layoutHeight,viewport.height+viewport.offsetTop) : layoutHeight;
  return {
    nav:box(nav), dock:box(dock), space:box(space), position:style.position, dockPosition:dockStyle.position,
    paddingBottom:parseFloat(style.paddingBottom), safePaddingBottom:parseFloat(dockStyle.paddingBottom), safeBackground:dockStyle.backgroundColor,
    border:parseFloat(style.borderTopWidth), marginBottom:parseFloat(style.marginBottom), dockMarginBottom:parseFloat(dockStyle.marginBottom),
    shellPaddingBottom:parseFloat(getComputedStyle(shell).paddingBottom), spacePaddingBottom:parseFloat(getComputedStyle(space).paddingBottom),
    contentPaddingBottom:parseFloat(getComputedStyle(main).paddingBottom), contentSpaceGap:spaceBox.top-mainBox.bottom,
    shellTail:shell.getBoundingClientRect().bottom-spaceBox.bottom, documentTail:document.documentElement.scrollHeight-(spaceBox.bottom+scrollY),
    contentOverlap:Math.max(0,main.lastElementChild.getBoundingClientRect().bottom-navBox.top),
    safeBottom:parseFloat(root.getPropertyValue('--safe-bottom'))||0, safeLeft:parseFloat(root.getPropertyValue('--safe-left'))||0, safeRight:parseFloat(root.getPropertyValue('--safe-right'))||0,
    nativeConsumedBottom:parseFloat(root.getPropertyValue('--shinka-native-consumed-bottom'))||0,
    viewportConsumedBottom:parseFloat(dockStyle.getPropertyValue('--shinka-viewport-consumed-bottom'))||0,
    viewport:innerWidth, viewportHeight:innerHeight, layoutHeight, visibleBottom, covered:Math.max(0,layoutHeight-visibleBottom), overflow:document.documentElement.scrollWidth,
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
  const remainingSafe=Math.max(0,measured.safeBottom-Math.max(measured.nativeConsumedBottom,measured.viewportConsumedBottom)-measured.covered);
  assert(Math.abs(measured.dock.y+measured.dock.height-(measured.visibleBottom-remainingSafe))<1,'dock bottom differs from the usable visible viewport');
  assert.equal(measured.safePaddingBottom,0,'system inset must not create transparent dock padding');
  assert(Math.abs(measured.nav.y+measured.nav.height-(measured.visibleBottom-remainingSafe))<1,'blank gap below the painted navigation');
  assert(Math.abs(measured.dock.height-measured.nav.height)<1,'extra dock row/gap');
  assert(Math.abs(measured.space.height-measured.dock.height-measured.covered-remainingSafe)<1,'content reservation differs from navigation and occluded viewport height');
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

export async function rejectExtraSpace(page) {
  for(const [css,message] of [
    ['.shinka-safe-shell {padding-bottom:34px!important}',/shellPaddingBottom/],
    ['.shinka-product-nav {padding-bottom:34px!important}',/system inset/],
    ['.shinka-nav-dock {padding-bottom:30px!important}',/usable visible viewport|transparent dock padding|blank gap/],
    ['.shinka-nav-dock {margin-bottom:40px!important}',/dockMarginBottom/],
    ['.shinka-nav-dock {bottom:40px!important}',/visible viewport/],
    ['.shinka-nav-dock {position:static!important}',/stay fixed/],
    ['.shinka-nav-safe-area {height:0!important}',/content reservation/],
  ]) {
    const injected=await page.addStyleTag({content:css});
    const measured=await navGeometry(page);
    assert.throws(()=>assertBottomOwnership(measured),message);
    await injected.evaluate(node=>node.remove());
    // Each intentionally invalid CSS configuration must leave a fresh native
    // measurement before the next independent negative fixture.
    await page.evaluate(()=>dispatchEvent(new Event('resize')));
    await settled(page);assertBottomOwnership(await navGeometry(page));
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

export async function checkAndroidViewportGeometry(browser,origin,directory) {
  const rows=[];
  if(directory)await mkdir(directory,{recursive:true});
  const phases=[
    ['native-resized-stale-inner',640,740,null,0],
    ['normal',800,null,null,0],
    ['visual-only-toolbar',800,null,700,0],
    ['native-toolbar-resize',700,800,null,0],
    ['keyboard-visual-only',800,null,480,0],
    ['keyboard-native-resized',480,800,null,0],
    ['visual-pan',800,null,460,20],
    ['restored',800,null,null,0],
  ];
  try{
    for(const width of [320,360,390,430]){
      const context=await browser.newContext({viewport:{width,height:800},locale:'tr-TR',isMobile:true,hasTouch:true}),page=await context.newPage(),errors=[];
      page.on('pageerror',error=>errors.push(error.message));
      await page.route('**/*',route=>new URL(route.request().url()).origin===origin?route.continue():route.abort());
      await seed(page);
      await page.addInitScript(()=>{
        // CSS and clientHeight retain real browser geometry. Only the exposed
        // JS height and visual metrics can vary, independently of that geometry.
        const native=window.visualViewport,innerGetter=Object.getOwnPropertyDescriptor(window,'innerHeight')?.get;
        const state={inner:null,height:null,offsetTop:0},viewport=new EventTarget();
        Object.defineProperty(window,'innerHeight',{configurable:true,get:()=>state.inner??(innerGetter?innerGetter.call(window):document.documentElement.clientHeight)});
        Object.defineProperties(viewport,{
          height:{get:()=>state.height??native?.height??document.documentElement.clientHeight},
          width:{get:()=>native?.width??document.documentElement.clientWidth},
          offsetTop:{get:()=>state.offsetTop},scale:{get:()=>1},
        });
        for(const name of ['resize','scroll'])native?.addEventListener(name,()=>viewport.dispatchEvent(new Event(name)));
        Object.defineProperty(window,'visualViewport',{configurable:true,value:viewport});
        window.__navigationViewportFixture=patch=>{Object.assign(state,patch);viewport.dispatchEvent(new Event('resize'));viewport.dispatchEvent(new Event('scroll'));};
      });
      try{
        for(const [surface,route] of surfaces){
          await open(page,origin,route,`[data-${surface}-root]`);
          for(const inset of [0,24,34])for(const [phase,cssHeight,reportedInner,visualHeight,offsetTop] of phases){
            await page.setViewportSize({width,height:cssHeight});
            await page.evaluate(({inset,reportedInner,visualHeight,offsetTop})=>{
              document.documentElement.style.setProperty('--safe-bottom',inset+'px');
              window.__navigationViewportFixture({inner:reportedInner,height:visualHeight,offsetTop});
            },{inset,reportedInner,visualHeight,offsetTop});
            // The oracle is Playwright's actual CSS viewport, not innerHeight or
            // the application offset. Real CSS fixed positioning is not mocked.
            const expectedBottom=Math.min(cssHeight,(visualHeight??cssHeight)+offsetTop),expectedInset=Math.max(0,inset-(cssHeight-expectedBottom));
            for(const stage of ['initial','end']){
              await page.evaluate(async stage=>{scrollTo(0,stage==='end'?document.documentElement.scrollHeight-document.documentElement.clientHeight:0);await new Promise(requestAnimationFrame);await new Promise(requestAnimationFrame);},stage);
              const measured=await navGeometry(page),dockBottom=measured.dock.y+measured.dock.height;
              const actualGap=expectedBottom-dockBottom-expectedInset,paintedGap=expectedBottom-(measured.nav.y+measured.nav.height)-expectedInset;
              const row={surface,width,phase,inset,stage,cssHeight,reportedInner,visualHeight,offsetTop,expectedBottom,expectedInset,actualGap,paintedGap,visibleBottomToBar:expectedBottom-(measured.nav.y+measured.nav.height),...measured,physicalDevice:false};
              rows.push(row);
              assert(Math.abs(actualGap)<1&&Math.abs(paintedGap)<1,JSON.stringify({failure:'ANDROID_VIEWPORT_GAP',surface,width,phase,inset,stage,actualGap,paintedGap,cssHeight,innerHeight:measured.viewportHeight,visualBottom:measured.visibleBottom,appliedOffset:await page.locator('.shinka-nav-dock:visible').evaluate(el=>el.style.getPropertyValue('--shinka-viewport-bottom'))}));
              assertBottomOwnership(measured,{end:stage==='end'});row.passed=true;
              if(directory&&width===390&&inset===0&&stage==='initial'&&['native-resized-stale-inner','keyboard-native-resized'].includes(phase))await page.screenshot({path:`${directory}/${surface}-${phase}.png`});
            }
          }
        }
        assert.equal(errors.length,0);
      }finally{await context.close();}
    }
    return rows;
  }finally{if(directory)await writeFile(`${directory}/android-viewport.json`,JSON.stringify(rows,null,2));}
}

// The native-consumed inset is an explicit host contract, not an Android/UA
// guess. A browser cannot observe the external native view's window bounds.
export async function checkSafeAreaOwnership(browser,origin,directory) {
  const rows=[];
  if(directory)await mkdir(directory,{recursive:true});
  try {
    for(const width of [320,360,390,430]) {
      const context=await browser.newContext({viewport:{width,height:800},isMobile:true,hasTouch:true}),page=await context.newPage(),errors=[];
      page.on('pageerror',error=>errors.push(error.message));
      await page.route('**/*',route=>new URL(route.request().url()).origin===origin?route.continue():route.abort());
      await seed(page);
      try {
        for(const [surface,route,ready] of surfaces) {
          await open(page,origin,route,ready);
          for(const [mode,inset,consumed] of [['native-consumed',30,30],['edge-to-edge',30,0],['partly-consumed',30,12],['no-inset',0,0],['native-consumed-48',48,48],['edge-to-edge-48',48,0]]) {
            await page.evaluate(({inset,consumed})=>{
              document.documentElement.style.setProperty('--safe-bottom',inset+'px');
              document.documentElement.style.setProperty('--shinka-native-consumed-bottom',consumed+'px');
              dispatchEvent(new Event('resize'));
            },{inset,consumed});
            for(const [phase,height] of [['normal',800],['keyboard-resize',480],['restored',800]]) {
              await page.setViewportSize({width,height});
              for(const stage of ['initial','end']) {
                await scroll(page,stage);await settled(page);
                const measured=await navGeometry(page),navBottom=measured.nav.y+measured.nav.height,dockBottom=measured.dock.y+measured.dock.height;
                // Independent native bounds: a 30/48px external system bar is
                // outside the usable viewport in consumed mode, inside in edge
                // mode. Neither dock padding nor app offsets define this edge.
                const expectedBottom=height-Math.max(0,inset-consumed);
                const row={surface,width,mode,inset,consumed,phase,stage,expectedBottom,navBottom,dockBottom,visibleGap:expectedBottom-navBottom,...measured,physicalDevice:false};rows.push(row);
                assert(Math.abs(row.visibleGap)<1,JSON.stringify({failure:'VISIBLE_BAR_SAFE_AREA_GAP',surface,width,mode,phase,stage,expectedBottom,navBottom,dockBottom,padding:measured.safePaddingBottom,gap:row.visibleGap}));
                assert.equal(measured.nav.height,67,'the bar height must remain unchanged');
                assert.equal(measured.safePaddingBottom,0,'dock must not add a second transparent safe-area row');
                assert(Math.abs(navBottom-dockBottom)<1,'bar and dock bottom must agree');
                assertBottomOwnership(measured,{end:stage==='end'});row.passed=true;
                if(directory&&width===390&&stage==='initial'&&phase==='normal')await page.screenshot({path:`${directory}/${surface}-${mode}.png`});
              }
            }
          }
        }
        assert.equal(errors.length,0);
      }finally{await context.close();}
    }
    rows.push(...await checkNavigationDiagnostic(browser,origin));
    return rows;
  }finally{if(directory)await writeFile(directory+'/safe-area.json',JSON.stringify(rows,null,2));}
}

export async function checkNavigationDiagnostic(browser,origin) {
  const context=await browser.newContext({viewport:{width:390,height:800}}),page=await context.newPage(),errors=[],rows=[];
  page.on('pageerror',error=>errors.push(error.message));
  await page.route('**/*',route=>new URL(route.request().url()).origin===origin?route.continue():route.abort());
  await seed(page);
  try {
    await open(page,origin,'/','[data-daily-id]');
    assert.equal(await page.locator('[data-navigation-diagnostics]').count(),0,'diagnostic must be opt-in');
    await page.goto(origin+'/?appFixture=1&sdkSession=admin&onboardingState=ACTIVE_EXISTING_USER&navDiagnostics=1&holdHydration=1');
    const panel=page.locator('[data-navigation-diagnostics]');await panel.waitFor();
    const sample=async()=>JSON.parse(await panel.locator('pre').innerText());
    const waiting=await sample();
    assert.equal(waiting.bar,null,'held hydration must not invent navigation bounds');
    assert.equal(waiting.measurementState,'WAITING_FOR_NAVIGATION');
    assert.equal(waiting.dockPaddingBottom,null,'an unmounted dock is unmeasured, not zero padding');
    await page.evaluate(()=>window.__authFixture.releaseHydration());
    await page.locator('[data-daily-id]').waitFor();
    await page.waitForFunction(()=>JSON.parse(document.querySelector('[data-navigation-diagnostics] pre').textContent).bar!==null,null,{timeout:5000});
    const mounted=await sample();
    assert.equal(mounted.measurementState,'MEASURED');
    assert.equal(mounted.navigationSource,'REGISTERED_ELEMENT_REFERENCES');
    assert(mounted.bar&&mounted.dock&&mounted.placeholder,'automatically measure all mounted references');
    rows.push({scenario:'diagnostic-after-held-mount',sample:mounted,passed:true,physicalDevice:false});
    for(const [mode,inset,consumed] of [['unverified',30,0],['declared-consumed',30,30],['unverified-48',48,0],['declared-consumed-48',48,48]]) {
      await page.evaluate(({inset,consumed})=>{
        document.documentElement.style.setProperty('--safe-bottom',inset+'px');
        document.documentElement.style.setProperty('--shinka-native-consumed-bottom',consumed+'px');
        dispatchEvent(new Event('resize'));
      },{inset,consumed});
      await settled(page);
      await page.waitForFunction(expected=>JSON.parse(document.querySelector('[data-navigation-diagnostics] pre').textContent).visibleBottomToBar===expected,inset-consumed);
      const before=await navGeometry(page),calls=await page.evaluate(()=>window.__authFixture.calls.length);
      await panel.getByRole('button',{name:'Ölçümü yenile'}).click();
      const sample=JSON.parse(await panel.locator('pre').innerText());
      assert.match(sample.build,/^Buildmarker-\d{3}$/);
      assert.equal(sample.nativeConsumptionVerified,false,'web metrics cannot prove native consumption');
      assert.equal(sample.nativeWindowBounds,'NOT_OBSERVABLE_FROM_WEB');
      assert.equal(sample.dockPaddingBottom,0);assert.equal(sample.dockToBar,0);
      assert.equal(sample.nativeConsumedBottomDeclaration,consumed);
      assert.equal(sample.visibleBottomToBar,inset-consumed);
      assert.deepEqual(Object.keys(sample).sort(),['build','measurementState','navigationSource','physicalVerification','nativeWindowBounds','viewport','screen','standalone','viewportFit','safeBottom','nativeConsumedBottomDeclaration','nativeConsumptionVerified','viewportConsumedBottom','insetPolicy','bar','dock','placeholder','dockPaddingBottom','dockBottomInset','residualViewportOffset','viewportOcclusion','visibleBottomToBar','visibleBottomToDock','dockToBar'].sort(),'diagnostic field whitelist changed');
      assert(!JSON.stringify(sample).includes('Ada'),'diagnostic exposed fixture identity');
      assert.equal(await page.evaluate(()=>window.__authFixture.calls.length),calls,'sampling must not call a service');
      const after=await navGeometry(page);assert.deepEqual(after.nav,before.nav,'sampling moved the navigation');
      rows.push({scenario:'read-only-opt-in-diagnostic',mode,sample,passed:true,physicalDevice:false});
    }
    await page.locator('nav.shinka-product-nav:visible a[href^="/calendar"]').click();await page.locator('[data-calendar-date]').first().waitFor();
    await page.waitForFunction(()=>JSON.parse(document.querySelector('[data-navigation-diagnostics] pre').textContent).placeholder.top===document.querySelector('[data-calendar-root] .shinka-nav-safe-area').getBoundingClientRect().top);
    assert((await sample()).bar,'retained hidden Home must not hide the active Calendar reference');
    assert.equal(await panel.count(),1,'retained tabs duplicated the diagnostic');
    await page.locator('nav.shinka-product-nav:visible a[href^="/pattern"]').click();await page.locator('[data-lunar-timeline]').waitFor();
    await page.waitForFunction(()=>JSON.parse(document.querySelector('[data-navigation-diagnostics] pre').textContent).placeholder.top===document.querySelector('[data-pattern-root] .shinka-nav-safe-area').getBoundingClientRect().top);
    const beforeResize=await sample();await page.setViewportSize({width:390,height:600});
    await page.waitForFunction(()=>JSON.parse(document.querySelector('[data-navigation-diagnostics] pre').textContent).viewport.clientHeight===600);
    assert.notEqual((await sample()).bar.bottom,beforeResize.bar.bottom,'resize did not update the registered bar');
    await panel.locator('pre').evaluate(pre=>{pre.scrollTop=pre.scrollHeight;});
    assert(await panel.getByRole('button',{name:'Ölçümü yenile'}).isVisible(),'diagnostic actions must remain visible while JSON scrolls');
    const panelBounds=await panel.boundingBox(),buttonBounds=await panel.getByRole('button',{name:'Ölçümü yenile'}).boundingBox();
    assert(buttonBounds.y>=panelBounds.y&&buttonBounds.y+buttonBounds.height<=panelBounds.y+panelBounds.height);
    await page.evaluate(()=>{const original=document.querySelectorAll.bind(document);window.__navSelectorCalls=0;window.__restoreNavigationSelectors=()=>{document.querySelectorAll=original;};document.querySelectorAll=function(selector){if(selector==='nav.shinka-product-nav'){window.__navSelectorCalls++;return [];}return original(selector);};});
    await panel.getByRole('button',{name:'Ölçümü yenile'}).click();
    assert((await sample()).bar,'refresh must use actual registered elements, not a fragile selector');
    assert.equal(await page.evaluate(()=>window.__navSelectorCalls),0);
    await page.evaluate(()=>window.__restoreNavigationSelectors());
    rows.push({scenario:'diagnostic-direct-references-retained-tabs-resize-and-accessible-actions',passed:true,physicalDevice:false});
    await page.evaluate(()=>{window.__authFixture.holdOperation('onboarding');dispatchEvent(new Event('shinka-health-access-changed'));});
    await page.waitForFunction(()=>!document.querySelector('[data-pattern-root]'));
    await page.waitForFunction(()=>JSON.parse(document.querySelector('[data-navigation-diagnostics] pre').textContent).measurementState==='WAITING_FOR_NAVIGATION');
    const unmounted=await sample();assert.equal(unmounted.bar,null);assert.equal(unmounted.dock,null);assert.equal(unmounted.dockPaddingBottom,null);
    await page.evaluate(()=>window.__authFixture.releaseOperation('onboarding'));
    await page.locator('[data-lunar-timeline]').waitFor();
    await page.waitForFunction(()=>JSON.parse(document.querySelector('[data-navigation-diagnostics] pre').textContent).measurementState==='MEASURED');
    rows.push({scenario:'diagnostic-cleans-unmounted-references-and-remeasures-on-return',passed:true,physicalDevice:false});
    await panel.getByRole('button',{name:'Kapat'}).click();assert.equal(await panel.count(),0);
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
  rows.push(...await checkAndroidViewportGeometry(browser,origin,directory ? `${directory}/android` : undefined));
  rows.push(...await checkSafeAreaOwnership(browser,origin,directory ? `${directory}/safe-area` : undefined));
  rows.push(...await checkConfirmedAndroidNavigation(browser,origin,directory ? `${directory}/confirmed-android` : undefined));
  if(directory)await writeFile(directory+'/navigation.json',JSON.stringify(rows,null,2));return rows;
}

import assert from 'node:assert/strict';
import { mkdir, readFile, writeFile } from 'node:fs/promises';
import path from 'node:path';
import { FIRST_CONTENT_SOURCE } from '../base44/shared/firstContentSource.js';
import { loadAppBackdrop, readBackdrop } from './checkAppBackdrop.mjs';
import { doubleText } from './mobileSurfaceMeasurements.mjs';

// Real App with isolated SDK, immutable bilingual source text and a fixed name.
// Baseline capture is explicitly unasserted visual evidence, never a test PASS.
export async function checkHomePresentation(browser, origin, directory, baseline = false, comparison = undefined) {
  if (directory) await mkdir(directory, { recursive: true });
  const before = comparison ? JSON.parse(await readFile(comparison, 'utf8')) : [];
  if (comparison) assert.equal(before.length,80,'complete current Home baseline required');
  const results = [];
  for (const [width,height] of [[320,568],[360,740],[390,844],[430,932],[768,1024],[1280,900]]) {
    for (const language of ['tr','en']) for (const theme of ['light','dark']) for (const scale of [1,2]) for (const copyCase of (width<=430?['standard','longest']:['standard'])) {
      const suggestionIndex=language==='tr'?3:5;
      const pair=copyCase==='standard'?FIRST_CONTENT_SOURCE.pairs[0]:FIRST_CONTENT_SOURCE.pairs.reduce((longest,row)=>row[suggestionIndex].length>longest[suggestionIndex].length?row:longest);
      const fixture = { state: 'ACTIVE_EXISTING_USER', persisted: true, profile: { display_name: 'Ayd' }, timezone: 'Europe/Istanbul',
        daily: { id: 'home-ui-fixture', shinka_date: '2026-11-26', message_pair_id: pair[0], message_tr_snapshot: pair[2], suggestion_tr_snapshot: pair[3], message_en_snapshot: pair[4], suggestion_en_snapshot: pair[5] } };
      const context = await browser.newContext({ viewport: { width,height }, locale: language, reducedMotion: 'reduce' });
      const page = await context.newPage(), errors = [];
      page.on('pageerror', error => errors.push(error.message));
      await page.route('**/*', route => new URL(route.request().url()).origin === origin ? route.continue() : route.abort());
      await page.addInitScript(value => { window.__dailyFixture = value; }, fixture);
      const key = [width,language,theme,scale,copyCase].join('-');
      try {
        await page.goto(`${origin}/?appFixture=1&homePresentation=1&themeFixture=1&theme=${theme}&sdkSession=admin&onboardingState=ACTIVE_EXISTING_USER&language=${language}`);
        await page.locator('[data-daily-id="home-ui-fixture"]').waitFor();
        await loadAppBackdrop(page);
        await page.waitForFunction(dark=>document.documentElement.classList.contains('dark')===dark,theme==='dark');
        // The verified account theme is supplied only by the isolated SDK. The
        // safe-area fixture does not change any account preference.
        await page.evaluate(inset=>document.documentElement.style.setProperty('--safe-bottom',inset+'px'),width===390?34:0);
        if (scale === 2) await doubleText(page);
        await page.evaluate(() => new Promise(resolve => requestAnimationFrame(() => requestAnimationFrame(resolve))));
        const metrics = await page.locator('[data-home-root]').evaluate(root => {
          const box = node => { const r=node.getBoundingClientRect();return { x:r.x,y:r.y,width:r.width,height:r.height,right:r.right,bottom:r.bottom }; };
          const style = node => { const s=getComputedStyle(node);return { font:s.fontSize,line:s.lineHeight,weight:s.fontWeight,family:s.fontFamily,fontStyle:s.fontStyle,color:s.color,background:s.backgroundColor,radius:s.borderRadius,padding:s.padding,border:s.borderTopWidth,borderLeft:s.borderLeftWidth,borderColor:s.borderLeftColor,shadow:s.boxShadow }; };
          const heading=root.querySelector('h1'), profile=root.querySelector('[data-profile-trigger]');
          const nav=root.querySelector('.shinka-product-nav'), dock=nav.closest('.shinka-nav-dock');
          const suggestion=root.querySelector('[data-home-card="suggestion"]'),body=suggestion.querySelector('p'),title=suggestion.querySelector('h2'),section=suggestion.querySelector('section'),textRects=[];
          // pre-wrap can hang trailing spaces past a line edge. Measure each
          // non-space word/punctuation range to detect visible text overflow.
          const walker=document.createTreeWalker(body,NodeFilter.SHOW_TEXT);let textNode;
          while((textNode=walker.nextNode()))for(const match of textNode.textContent.matchAll(/\S+/g)){const range=document.createRange();range.setStart(textNode,match.index);range.setEnd(textNode,match.index+match[0].length);textRects.push(...[...range.getClientRects()].map(r=>({left:r.left,right:r.right,bottom:r.bottom})));}
          const rgb=color=>color.match(/[\d.]+/g).map(Number),bg=rgb(getComputedStyle(suggestion).backgroundColor),fg=rgb(getComputedStyle(body).color);
          const luminance=rgb=>rgb.slice(0,3).map(v=>{v/=255;return v<=.04045?v/12.92:((v+.055)/1.055)**2.4;}).reduce((sum,v,i)=>sum+v*[.2126,.7152,.0722][i],0);
          const contrast=[0,255].map(under=>{const l=luminance(bg.slice(0,3).map(v=>v*(bg[3]??1)+under*(1-(bg[3]??1)))),f=luminance(fg);return (Math.max(l,f)+.05)/(Math.min(l,f)+.05);});
          return { heading:box(heading),headingStyle:style(heading),profile:box(profile),profileStyle:style(profile),
            nav:{ box:box(nav),style:style(nav),dock:box(dock),dockPadding:getComputedStyle(dock).paddingBottom,
              links:[...nav.querySelectorAll('a')].map(node=>({box:box(node),style:style(node),text:node.textContent,active:node.getAttribute('aria-current'),icon:box(node.querySelector('svg'))})) },
            cards:[...root.querySelectorAll('[data-home-card]')].map(node=>({box:box(node),style:style(node),html:node.outerHTML,headingStyle:style(node.querySelector('h2')),textStyle:style(node.querySelector('p'))})),
            note:{box:box(body),paddingLeft:parseFloat(getComputedStyle(body).paddingLeft),paddingBottom:getComputedStyle(body).paddingBottom,minHeight:getComputedStyle(body).minHeight,maxHeight:getComputedStyle(body).maxHeight,headingGap:body.getBoundingClientRect().top-title.getBoundingClientRect().bottom,sectionPadding:getComputedStyle(section).padding,children:[...section.children].map(n=>n.tagName),controls:section.querySelectorAll('button,input,[role="checkbox"]').length,plum:getComputedStyle(document.documentElement).getPropertyValue('--shinka-plum').trim().split(/\s+/).map(Number),minContrast:Math.min(...contrast),rects:textRects},
            scrollWidth:document.documentElement.scrollWidth };
        });
        const paint = await readBackdrop(page);
        const artwork = Object.fromEntries(['artWidth','artHeight','artLeft','artTop','inset','logo','position','pointerEvents','ariaHidden','outsideMotion','overlay','filter','opacity','mask','documentTop','readingSurface'].map(key=>[key,paint[key]]));
        // Capture before visiting You, whose verified preference may legitimately
        // replace this matrix's temporary CSS-only theme.
        if (directory && scale===1 && [320,390,1280].includes(width)) await page.screenshot({ path:path.join(directory,key+'.png'),fullPage:true });
        if (!baseline) {
          assert(metrics.scrollWidth <= width+1, key+' horizontal overflow');
          assert.equal(metrics.cards.length,2);
          assert.equal(metrics.headingStyle.font,28*scale+'px');
          assert.equal(metrics.cards[0].headingStyle.font,24*scale+'px');
          assert.equal(metrics.cards[1].headingStyle.font,20*scale+'px');
          assert.equal(metrics.cards[1].headingStyle.family,metrics.cards[0].headingStyle.family);
          assert.equal(metrics.cards[0].textStyle.fontStyle,'normal');
          assert.equal(metrics.cards[1].textStyle.fontStyle,'italic');
          assert.equal(metrics.cards[1].textStyle.family,metrics.cards[0].textStyle.family);
          for (const card of metrics.cards) {
            assert.equal(card.style.radius,'20px'); assert.equal(card.style.border,'0px'); assert.equal(card.style.shadow,'none');
            assert.equal(card.style.background,theme==='light'?'rgba(255, 255, 255, 0.8)':'rgba(43, 29, 38, 0.8)');
            assert.equal(card.textStyle.font,15*scale+'px');
          }
          assert.equal(metrics.cards[1].textStyle.borderLeft,'1px');
          assert.equal(metrics.cards[1].textStyle.borderColor,`rgba(${metrics.note.plum.join(', ')}, 0.3)`);
          assert.equal(metrics.note.sectionPadding,'20px');assert.equal(metrics.note.paddingLeft,16);assert.equal(metrics.note.headingGap,12);
          assert.equal(metrics.note.paddingBottom,'0px');assert.equal(metrics.note.minHeight,'0px');assert.equal(metrics.note.maxHeight,'none');
          assert.deepEqual(metrics.note.children,['H2','P']);assert.equal(metrics.note.controls,0,'no completion UI or reserved footer');
          assert(metrics.note.minContrast>=4.5,'body contrast must cover any artwork under the translucent surface');
          assert(metrics.note.rects.length>0&&metrics.note.rects.every(r=>r.left>=metrics.note.box.x+16&&r.right<=metrics.note.box.right+1&&r.bottom<=metrics.note.box.bottom+1),`complete text must wrap inside the note ${key}: ${JSON.stringify(metrics.note)}`);
          assert(metrics.heading.y >= paint.logo.bottom, 'greeting must clear the original logo');
          assert(Math.abs(metrics.profile.y-paint.inset.top-16)<1, 'profile must be in the safe logo area');
          assert(metrics.profile.x>=paint.logo.right+8, 'profile must clear the original logo');
          assert(metrics.profile.width>=44&&metrics.profile.height>=44);
          assert(metrics.heading.x+metrics.heading.width <= metrics.profile.x+1);
          const prior=before.find(row=>row.key===key);
          if (comparison) {
            assert(prior,'missing baseline '+key);
            assert.deepEqual(metrics.nav,prior.metrics.nav,'navigation must be unchanged '+key);
            assert.deepEqual(artwork,prior.artwork,'artwork must be unchanged '+key);
            assert.deepEqual(metrics.profileStyle,prior.metrics.profileStyle,'profile styling must be unchanged');
            assert.deepEqual(metrics.profile,prior.metrics.profile,'087 profile position must not change');
            assert.deepEqual(metrics.heading,prior.metrics.heading,'greeting geometry must not change');
            assert.deepEqual(metrics.headingStyle,prior.metrics.headingStyle);
            assert.deepEqual(metrics.cards[0],prior.metrics.cards[0],'Your Shinka must remain exactly unchanged');
            assert.deepEqual(metrics.cards[1].style,prior.metrics.cards[1].style,'outer suggestion surface must not change');
            for(const key of ['x','y','width'])assert.equal(metrics.cards[1].box[key],prior.metrics.cards[1].box[key]);
          }
          assert.equal(await page.locator('[data-daily-message]').textContent(),language==='tr'?pair[2]:pair[4]);
          assert.equal(await page.locator('[data-daily-suggestion]').textContent(),language==='tr'?pair[3]:pair[5]);
          await page.evaluate(()=>window.scrollTo(0,document.documentElement.scrollHeight));
          const bottom=await page.locator('[data-home-root] .shinka-product-nav').boundingBox();
          assert(Math.abs(bottom.y+bottom.height-metrics.nav.box.bottom)<1,'fixed navigation must not move on scroll');
          await page.evaluate(()=>window.scrollTo(0,0));
          await page.locator('[data-profile-trigger]').click(); await page.locator('[data-you-root]').waitFor();
          await page.goBack(); await page.locator('[data-home-root]:visible').waitFor();
          assert.equal(await page.locator('[data-home-root]:visible [data-daily-id]').getAttribute('data-daily-id'),'home-ui-fixture');
          const calls=await page.evaluate(()=>window.__authFixture.calls);
          assert(!calls.some(call=>['saveProfile','saveCycle','skipCycle','accept','begin','execute'].includes(call.action)), 'presentation must not write data');
        }
        assert.deepEqual(errors,[]);
        results.push({key,scope:baseline?'BASELINE_CAPTURE':'LOCAL_REAL_APP_SYNTHETIC_SDK',passed:baseline?undefined:true,metrics,artwork});
      } finally { await context.close(); }
    }
  }
  if(directory)await writeFile(path.join(directory,'measurements.json'),JSON.stringify(results,null,2));
  return { scope:baseline?'BASELINE_CAPTURE':'LOCAL_REAL_APP_SYNTHETIC_SDK', scenarios:results.length, passed:baseline?undefined:true };
}

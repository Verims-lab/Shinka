import assert from 'node:assert/strict';
import { mkdir, readFile, writeFile } from 'node:fs/promises';
import { createHash } from 'node:crypto';
import path from 'node:path';
import { loadAppBackdrop } from './checkAppBackdrop.mjs';
import { doubleText } from './mobileSurfaceMeasurements.mjs';

async function checkIntroLayout(page, scale) {
  await loadAppBackdrop(page);
  const result = await page.evaluate(() => {
    const intro = document.querySelector('[data-onboarding-intro]');
    const screen = intro.closest('main');
    const backdrop = document.querySelector('[data-app-backdrop]');
    const art = getComputedStyle(backdrop, '::before');
    const root = getComputedStyle(document.documentElement);
    const shell = getComputedStyle(screen.closest('.shinka-safe-content'));
    const title = screen.querySelector('h1').getBoundingClientRect();
    const copy = intro.querySelector('p').getBoundingClientRect();
    const cta = intro.querySelector('button');
    const button = cta.getBoundingClientRect();
    const rows = [...intro.querySelectorAll('[data-intro-row]')].map(row => {
      const text = row.querySelector('[data-intro-description]');
      const bounds = row.getBoundingClientRect();
      const range = document.createRange();
      range.selectNodeContents(text);
      const lines = new Set([...range.getClientRects()].map(rect => Math.round(rect.top))).size;
      return {
        id: row.dataset.introRow, lines, height: bounds.height, top: bounds.top, bottom: bounds.bottom,
        titleFont: parseFloat(getComputedStyle(text.previousElementSibling).fontSize),
        descriptionFont: parseFloat(getComputedStyle(text).fontSize),
      };
    });
    const topPadding = parseFloat(shell.paddingTop);
    const bottomPadding = parseFloat(shell.paddingBottom);
    const safeTop = parseFloat(root.getPropertyValue('--safe-top')) || 0;
    const originalTitleTop = 8 + Math.min(innerWidth * .375, innerHeight * .212) + safeTop;
    return {
      width: innerWidth, height: innerHeight, scrollY, scrollHeight: document.documentElement.scrollHeight,
      safeTop, bottomPadding, originalTitleTop,
      usableHeight: Math.max(0, innerHeight - topPadding - bottomPadding - button.height),
      safeLeft: parseFloat(root.getPropertyValue('--safe-left')) || 0,
      artTop: parseFloat(art.top), artLeft: parseFloat(art.left), artHeight: parseFloat(art.height),
      opacity: getComputedStyle(backdrop).opacity, filter: art.filter,
      wash: getComputedStyle(backdrop, '::after').content,
      duplicateWordmark: [...screen.querySelectorAll('span')].some(span => span.textContent.trim() === 'Shinka'),
      counterPresent: !!screen.querySelector('p[data-onboarding-step]'),
      titleTop: title.top, headingGap: copy.top - title.bottom, copyBottom: copy.bottom,
      ctaTop: button.top, ctaBottom: button.bottom,
      ctaHeight: button.height, ctaDisabled: cta.disabled, rows,
    };
  });
  assert.equal(result.duplicateWordmark, false);
  assert.equal(result.counterPresent, false);
  assert.equal(result.artTop, result.safeTop);
  assert.equal(result.artLeft, result.safeLeft);
  assert.equal(result.opacity, '1');
  assert.equal(result.filter, 'none');
  assert.equal(result.wash, 'none');
  assert(result.titleTop + result.scrollY >= result.artTop + result.artHeight * 347 / 1670 + 4, 'title clears the original logo');
  assert.equal(result.rows.length, 3);
  assert(result.ctaHeight >= 52 && !result.ctaDisabled, 'Begin keeps its primary touch target');
  if (scale === 1 && result.width < result.height) {
    const closeTo = (value, expected, label) => assert(Math.abs(value - expected) < .5, `${label}: ${value} vs ${expected}`);
    assert(result.scrollY === 0 && result.scrollHeight <= result.height + 1, 'intro fits at first paint');
    const safeBottom = result.height - result.bottomPadding;
    assert(result.copyBottom <= result.ctaTop && result.ctaBottom <= safeBottom + 1, 'copy and Begin are inside the safe content area');
    closeTo(result.headingGap, result.usableHeight * .025, 'heading to intro copy is 2.5 units');
    const room = safeBottom - result.originalTitleTop - (result.ctaBottom - result.titleTop);
    const target = result.usableHeight * .10;
    closeTo(result.titleTop - result.originalTitleTop, Math.max(0, Math.min(target, room)), 'heading moves down 10 units or available room');
    const [first, second, third] = result.rows;
    for (const gap of [second.top - first.bottom, third.top - second.bottom, result.ctaTop - third.bottom]) {
      closeTo(gap, 12, 'gap is 1.5 times the previous 8px');
    }
    assert(result.rows.every(row => row.height <= 60 && row.titleFont === 20 && Math.abs(row.descriptionFont - 13.6) < .1), 'compact row dimensions');
    for (const id of ['introMoon', 'birthChart']) {
      assert.equal(result.rows.find(row => row.id === id).lines, 1, id + ' description');
    }
  }
  if (scale === 2) {
    assert(result.rows.every(row => row.descriptionFont >= 27.1), 'descriptions scale with text enlargement');
    assert(result.ctaBottom + result.scrollY <= result.scrollHeight + 1, 'Begin remains reachable with enlarged text');
  }
  return result;
}

export async function checkSignInLayout(page, scale = 1) {
  const result = await page.evaluate(() => {
    const panel = document.querySelector('[data-auth-shell]');
    const age = panel?.querySelector('#age-declaration');
    if (!(age instanceof HTMLInputElement) || age.type !== 'checkbox' || !age.labels.length) return null;
    const main = panel.closest('main');
    const viewport = window.visualViewport;
    const providers = [...panel.querySelectorAll('[data-provider]')];
    const shell = getComputedStyle(panel.closest('.shinka-safe-content'));
    const controls = [age.labels[0], ...providers].map(element => {
      const rect = element.getBoundingClientRect();
      const css = getComputedStyle(element);
      const hit = document.elementFromPoint(rect.left + rect.width / 2, rect.top + rect.height / 2);
      return {
        top: rect.top, bottom: rect.bottom, left: rect.left, right: rect.right, height: rect.height,
        visible: css.display !== 'none' && css.visibility === 'visible' &&
          (element.checkVisibility?.({ checkOpacity: true, checkVisibilityCSS: true }) ?? true),
        receivesInput: element.contains(hit),
      };
    });
    return {
      state: main?.dataset.onboardingState,
      step: main?.querySelector('p[data-onboarding-step]')?.dataset.onboardingStep,
      buildMarker: main?.dataset.shinkaBuild ?? null,
      providers: providers.map(element => element.dataset.provider),
      enabled: !age.disabled && providers.every(element => element instanceof HTMLButtonElement && !element.disabled),
      checked: age.checked, controls, scrollY,
      width: viewport?.width ?? innerWidth, height: viewport?.height ?? innerHeight,
      viewportLeft: viewport?.offsetLeft ?? 0, viewportTop: viewport?.offsetTop ?? 0,
      scrollHeight: document.documentElement.scrollHeight,
      paddingTop: parseFloat(shell.paddingTop), paddingBottom: parseFloat(shell.paddingBottom),
      artSpace: main?.querySelector('.shinka-onboarding-art-space')?.getBoundingClientRect().height ?? 0,
    };
  });
  assert(result, 'sign-in renders a labelled 18+ checkbox');
  assert.equal(result.state, 'UNAUTHENTICATED_SIGN_IN');
  assert.equal(result.step, '2');
  assert.deepEqual(result.providers, ['apple', 'google']);
  assert(result.enabled && !result.checked, 'age confirmation starts unchecked with accessible provider actions');
  assert(result.controls.every(control => control.visible && control.height >= 44), 'visible controls retain their touch targets');
  // Regression guard for the 068/070 defect: the unpainted artwork slot must never
  // reserve a tall gap that pushes the three sign-in controls below the fold.
  assert(result.artSpace <= 48, 'the empty ON-02 artwork slot stays capped above the sign-in controls');
  const last = result.controls.at(-1);
  assert(last.bottom + result.scrollY + result.paddingBottom <= result.scrollHeight + 1, 'Google remains reachable above the bottom safe padding');
  if (scale === 1 && result.width < result.height) {
    const { viewportTop, viewportLeft, width, height } = result;
    assert.equal(result.scrollY, 0, 'Welcome opens at the top of the document');
    for (const control of result.controls) {
      assert(control.top >= viewportTop + result.paddingTop - 1 &&
        control.bottom <= viewportTop + height - result.paddingBottom + 1 &&
        control.left >= viewportLeft - 1 && control.right <= viewportLeft + width + 1,
      '18+ confirmation and both provider actions fit the initial safe viewport');
      assert(control.receivesInput, 'no overlapping or clipped layer covers the sign-in controls');
    }
  }
  return result;
}

// Real App + Onboarding + bundled backdrop together. SDK transport is synthetic.
// Public fonts load only for an explicit visual capture.
export async function checkOnboardingLayers(browser, origin, directory) {
  const fontCss = (await readFile('index.html','utf8')).match(/href="(https:\/\/fonts.googleapis.com\/css2[^\"]+)"/)[1];
  const assets = new Map(), results = [];
  if (directory) await mkdir(directory,{recursive:true});
  const sizes = [[320,568],[320,640],[360,640],[390,844],[430,932],[844,390]];
  for (const language of ['tr','en']) for (const [width,height] of sizes) for (const scale of [1,2]) {
    const context = await browser.newContext({locale:language==='tr'?'tr-TR':'en-US',viewport:{width,height},colorScheme:'dark'});
    const page = await context.newPage(), errors = [];
    page.on('pageerror',error=>errors.push(error.message));
    await page.route('**/*',async route=>{
      const url = new URL(route.request().url());
      if (url.origin === origin) return route.continue();
      if (!directory || route.request().method()!=='GET' || !(url.href===fontCss || url.origin==='https://fonts.gstatic.com' && url.pathname.startsWith('/s/'))) return route.abort();
      if (!assets.has(url.href)) {
        const response = await route.fetch(); assert(response.ok(),`PUBLIC_ASSET_${response.status()}`);
        const body = await response.body();
        assets.set(url.href,{body,contentType:response.headers()['content-type'],sha256:createHash('sha256').update(body).digest('hex')});
      }
      const asset=assets.get(url.href); return route.fulfill({status:200,contentType:asset.contentType,body:asset.body});
    });
    const resetText = () => page.evaluate(() => {
      for (const element of document.querySelectorAll('[data-layer-font-size]')) {
        element.style.fontSize = element.dataset.layerFontSize;
        delete element.dataset.layerFontSize;
      }
    });
    const prepare = async () => {
      if (directory) {
        await page.evaluate(href=>{if(!document.querySelector('[data-layer-font]')){const link=document.createElement('link');link.rel='stylesheet';link.href=href;link.dataset.layerFont='true';document.head.append(link);}},fontCss);
        await page.waitForFunction(()=>document.querySelector('[data-layer-font]')?.sheet);
        await page.evaluate(()=>document.fonts.ready);
        await loadAppBackdrop(page);
      }
      if (scale === 2) {
        // Restore authored inline sizes when leaving a zoomed step.
        await page.evaluate(() => {
          for (const element of document.querySelectorAll('body *')) {
            if (element instanceof HTMLElement) element.dataset.layerFontSize = element.style.fontSize;
          }
        });
        await doubleText(page);
      }
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
      const layer=document.querySelector('[data-app-backdrop]'),css=getComputedStyle(layer),art=getComputedStyle(layer,'::before');
      const space=document.querySelector('.shinka-onboarding-art-space');
      return {bitmaps,images:document.querySelectorAll('.shinka-onboarding img').length,layers:document.querySelectorAll('[data-app-backdrop]').length,
        background:{position:css.position,y:layer.getBoundingClientRect().y,height:layer.getBoundingClientRect().height,image:art.backgroundImage,repeat:art.backgroundRepeat,size:art.backgroundSize,mask:art.maskImage},
        light:!document.documentElement.classList.contains('dark'),width:innerWidth,scrollWidth:document.documentElement.scrollWidth,scrollY,maxScroll:document.documentElement.scrollHeight-innerHeight,
        title:box(document.querySelector('h1')),card:box(document.querySelector('.shinka-intro-shell')),space:space?box(space):null,
        intro:!!document.querySelector('[data-onboarding-intro]'),signIn:!!document.querySelector('[data-auth-shell]'),
        rowIcons:document.querySelectorAll('[data-intro-row] svg').length,
        controls:[...document.querySelectorAll('main input,main button,main label')].map(el=>({key:el.id||el.getAttribute('aria-label')||el.textContent.trim(),...box(el)}))};
    });
    const verify = value => {
      assert.equal(value.layers,1);assert.equal(value.images,0);assert.equal(value.bitmaps.length,1,'one bitmap composition across the complete page');
      assert(value.bitmaps[0].source.includes(`${origin}/assets/shinka-background-`));assert(value.light,'onboarding remains light under dark OS');
      assert.equal(value.background.position,'fixed');assert.equal(value.background.y,0);
      assert.equal(value.background.size,'contain');assert.equal(value.background.repeat,'no-repeat');
      assert(value.scrollWidth<=value.width+1,'no horizontal overflow');
      if(value.intro)assert.equal(value.space,null,'intro reserves only the logo height');
      else {
        assert(value.space && Math.abs(value.space.width-240)<1,'empty artwork slot retains its width');
        assert(value.signIn ? value.space.height<=240.5 : Math.abs(value.space.height-240)<1,'only anonymous sign-in can shrink the artwork slot');
      }
    };
    const visit = async step => {
      if(step===1)await page.goto(`${origin}/?appFixture=1&sdkSession=anonymous`);
      if(step===2)await page.getByRole('button',{name:language==='tr'?'Başla':'Begin',exact:true}).click();
      if(step===3)await page.goto(`${origin}/?appFixture=1&sdkSession=user&language=${language}&onboardingState=AUTHENTICATED_NAME_REQUIRED`);
      if(step===4)await page.goto(`${origin}/?appFixture=1&sdkSession=user&language=${language}&onboardingVisual=1`);
      if(step===5)await page.getByRole('button',{name:language==='tr'?'Devam et':'Continue',exact:true}).click();
      await page.locator(`[data-onboarding-step="${step}"]`).waitFor();await prepare();
    };
    try {
      for(const step of [1,2,3,4,5]) {
        await resetText();await visit(step);
        const checkLayout = step === 1 ? checkIntroLayout : step === 2 ? checkSignInLayout : null;
        const layout = checkLayout ? await checkLayout(page, scale) : null;
        let safeArea;
        if (checkLayout && language === 'tr' && width === 390 && scale === 1) {
          await page.evaluate(() => {
            document.documentElement.style.setProperty('--safe-top', '47px');
            document.documentElement.style.setProperty('--safe-bottom', '34px');
          });
          try {
            safeArea = await checkLayout(page, scale);
          } finally {
            await page.evaluate(() => {
              document.documentElement.style.removeProperty('--safe-top');
              document.documentElement.style.removeProperty('--safe-bottom');
            });
          }
        }
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
        if(step===3 || step===4) {
          const field=page.locator(step===3?'#display_name':'#birth_date');await field.focus();
          if(step===3)await field.fill('Ada');else await field.fill('1990-01-01');
          await page.setViewportSize({width,height:Math.min(height,400)});verify(await inspect());
          await field.blur();await page.setViewportSize({width,height});verify(await inspect());
          if(step===4){await page.locator('#birth_time').focus();await page.locator('#birth_time').fill('10:30');verify(await inspect());await page.locator('#birth_time').blur();}
        }
        const back = page.locator('[data-onboarding-back]');
        if(step===2 || step===5) {
          await resetText();await back.click();await page.locator(`[data-onboarding-step="${step-1}"]`).waitFor();await prepare();verify(await inspect());
          if(step===2) {await page.getByRole('button',{name:language==='tr'?'Başla':'Begin',exact:true}).click();await page.locator('#age-declaration').waitFor();assert.equal(await page.locator('#display_name').count(),0);}
          if(step===5) {assert.equal(await back.count(),0);assert.equal(await page.locator('#birth_date').inputValue(),'1990-01-01');assert.equal(await page.locator('#birth_time').inputValue(),'10:30');}
        } else {
          assert.equal(await back.count(),0);
        }
        results.push({language,width,height,textScale:scale,step,passed:true,views,
          ...(step===1?{intro:layout,safeAreaIntro:safeArea}:step===2?{signIn:layout,safeAreaSignIn:safeArea}:{}),
          keyboard:'FOCUS_AND_REDUCED_VIEWPORT_ONLY'});
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

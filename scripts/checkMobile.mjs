import { selectBirthplace } from "./selectBirthplace.mjs";
import { mkdir } from "node:fs/promises";
import path from "node:path";
import { FIRST_CONTENT_SOURCE } from '../base44/shared/firstContentSource.js';

// Actual browser viewports, synthetic SDK/provider. Never labels this a physical
// keyboard, Safari, Android OS, bfcache guarantee, or background eviction test.
export async function checkMobile(browser, origin, directory) {
  const context = await browser.newContext({
    viewport: { width: 390, height: 844 },
    isMobile: true,
    hasTouch: true,
  });
  const page = await context.newPage(),
    rows = [],
    errors = [];
  page.on("pageerror", (error) => errors.push(error.message));
  await page.route("**/*", (route) =>
    new URL(route.request().url()).origin === origin
      ? route.continue()
      : route.abort(),
  );
  try {
    for (const [width, height] of [
      [320, 568],
      [360, 740],
      [390, 844],
      [430, 900],
      [844, 390],
    ]) {
      await page.setViewportSize({ width, height });
      await page.goto(
        `${origin}/onboarding-fixture?step=AUTHENTICATED_PROFILE_REQUIRED&language=tr`,
      );
      await selectBirthplace(page, "Fixture", "123");
      await page.locator("#birth_date").fill("1990-01-01");
      await page.locator("#birth_time").fill("08:30");
      await page.locator("button[type=submit]").scrollIntoViewIfNeeded();
      const layout = await page.evaluate(() => ({
        width: innerWidth,
        scrollWidth: document.documentElement.scrollWidth,
        controls: [
          ...document.querySelectorAll(
            "select,input:not([type=checkbox]),button",
          ),
        ].map((el) => ({
          id: el.id,
          height: el.getBoundingClientRect().height,
        })),
        date: document.querySelector("#birth_date").value,
        time: document.querySelector("#birth_time").value,
        viewport: document.querySelector("meta[name=viewport]")?.content,
      }));
      rows.push({
        scenario: `touch-viewport-${width}x${height}`,
        ...layout,
        passed:
          layout.scrollWidth <= width + 1 &&
          layout.controls.every((c) => c.height >= 44) &&
          layout.date === "1990-01-01" &&
          layout.time === "08:30",
      });
      if (directory) {
        await mkdir(directory, { recursive: true });
        await page.screenshot({
          path: path.join(directory, `mobile-tr-${width}x${height}.png`),
          fullPage: true,
        });
      }
    }
    await page.goto(`${origin}/login?sdkSession=admin`);
    await page.waitForSelector(
      '[data-onboarding-state="AUTHENTICATED_PROFILE_REQUIRED"]',
    );
    await page.goto(`${origin}/login?sdkSession=anonymous`);
    await page.waitForSelector(
      '[data-onboarding-state="UNAUTHENTICATED_SIGN_IN"]',
    );
    await page.goBack();
    await page.waitForSelector(
      '[data-onboarding-state="AUTHENTICATED_PROFILE_REQUIRED"]',
    );
    await page.goForward();
    await page.waitForSelector(
      '[data-onboarding-state="UNAUTHENTICATED_SIGN_IN"]',
    );
    await page.reload();
    await page.waitForSelector(
      '[data-onboarding-state="UNAUTHENTICATED_SIGN_IN"]',
    );
    rows.push({
      scenario: "back-forward-reload-session-routing",
      passed: true,
    });
    rows.push(...await auditMobileSurfaces(page,origin,directory));
    rows.push({
      scenario: "javascript-errors",
      passed: errors.length === 0,
      errors,
    });
    return rows;
  } finally {
    await context.close();
  }
}

async function auditMobileSurfaces(page, origin, directory) {
  const pair=FIRST_CONTENT_SOURCE.pairs[0], rows=[];
  await page.addInitScript(pair=>{window.__dailyFixture={state:'ACTIVE_EXISTING_USER',persisted:true,profile:{display_name:'Uzun Sentetik Görünür Ad'},timezone:'Europe/Istanbul',daily:{id:'mobile-snapshot',shinka_date:'2026-10-20',message_pair_id:'mobile-pair',message_tr_snapshot:pair[2],suggestion_tr_snapshot:pair[3],message_en_snapshot:pair[4],suggestion_en_snapshot:pair[5]}};},pair);
  await page.addInitScript(()=>{const language=new URL(location.href).searchParams.get('language');if(language)history.replaceState({usr:{language}},'',location.href);});
  const surfaces=[
    ['profile','/onboarding-fixture?step=AUTHENTICATED_PROFILE_REQUIRED','input[type=date]'],
    ['cycle','/onboarding-fixture?step=AUTHENTICATED_CYCLE_STEP','input[type=date]'],
    ['home','/?appFixture=1&sdkSession=admin&onboardingState=ACTIVE_EXISTING_USER','[data-daily-id]'],
    ['calendar','/calendar?appFixture=1&sdkSession=admin&onboardingState=ACTIVE_EXISTING_USER','[data-calendar-date]'],
    ['admin','/internal?appFixture=1&sdkSession=admin','[data-admin-panel]'],
    ['test-tools','/internal/test-tools?appFixture=1&sdkSession=admin','[data-test-tools]'],
  ];
  for(const language of ['tr','en'])for(const [width,height] of [[320,568],[360,740],[390,844],[430,900],[844,390]])for(const [surface,url,ready] of surfaces){
    await page.setViewportSize({width,height});await page.goto(`${origin}${url}&language=${language}`);await page.waitForSelector(ready);
    // Resize actual rendered text once per element, keeping all product spacing
    // and touch minima. This is WCAG text-resize lab evidence, not OS font scaling.
    await resizeText(page);
    const geometry=await page.evaluate(()=>({
      width:innerWidth,scrollWidth:document.documentElement.scrollWidth,
      tightText:[...document.querySelectorAll('body *')].filter(el=>el instanceof HTMLElement&&[...el.childNodes].some(n=>n.nodeType===3&&n.textContent.trim())&&el.getBoundingClientRect().height>0&&parseFloat(getComputedStyle(el).lineHeight)<parseFloat(getComputedStyle(el).fontSize)).map(el=>({tag:el.tagName,font:getComputedStyle(el).fontSize,line:getComputedStyle(el).lineHeight})),
      small:[...document.querySelectorAll('button,select,input:not([type=checkbox]),nav a')].filter(el=>{const r=el.getBoundingClientRect();return r.width>0&&r.height>0&&(r.width<43.9||r.height<43.9);}).map(el=>({tag:el.tagName,width:el.getBoundingClientRect().width,height:el.getBoundingClientRect().height})),
    }));
    rows.push({scenario:`${surface}-${language}-${width}x${height}-200percent`,...geometry,passed:geometry.scrollWidth<=width+1&&!geometry.small.length&&!geometry.tightText.length});
    if(directory && width===320 && language==='tr')await page.screenshot({path:path.join(directory,`${surface}-tr-320-200percent.png`),fullPage:true});
    if(surface==='calendar'){
      await page.locator('[data-calendar-date="2026-10-01"]').click();
      await page.getByRole('button',{name:language==='tr'?'Regl başlangıcını sil':'Delete period start',exact:true}).click();
      await page.locator('dialog[open]').waitFor();
      await resizeText(page);
      if(directory && width===320 && language==='tr')await page.screenshot({path:path.join(directory,'calendar-modal-tr-320-200percent.png'),fullPage:true});
      await page.keyboard.press('Tab');
      const modal=await page.evaluate(()=>({focusInside:!!document.activeElement?.closest('dialog'),width:document.querySelector('dialog').getBoundingClientRect().width,scrollWidth:document.querySelector('dialog').scrollWidth}));
      await page.keyboard.press('Escape');
      const restored=await page.getByRole('button',{name:language==='tr'?'Regl başlangıcını sil':'Delete period start',exact:true}).evaluate(el=>!document.querySelector('dialog[open]')&&document.activeElement===el);
      rows.push({scenario:`modal-focus-${language}-${width}`, ...modal,restored,passed:modal.focusInside&&restored&&modal.scrollWidth<=modal.width+1});
    }
    if(surface==='home'){
      await page.locator('[data-profile-trigger]:visible').focus();await page.keyboard.press('Enter');await page.locator('[data-you-heading]').waitFor();
      await page.waitForFunction(()=>document.activeElement?.matches('[data-you-heading]'));
      rows.push({scenario:`profile-you-keyboard-focus-${language}-${width}`,passed:await page.evaluate(()=>document.activeElement?.matches('[data-you-heading]')&&!document.querySelector('[role=menu]'))});
    }
  }
  return rows;
}

// Re-measure base styles before resizing newly opened content, so inherited sizes
// are never accidentally doubled twice when a modal is added.
async function resizeText(page) {
  await page.evaluate(()=>{
    window.__textResizeOriginal ||= new WeakMap();
    const nodes=[...document.querySelectorAll('body *')].filter(el=>el instanceof HTMLElement);
    for(const el of nodes){
      if(!window.__textResizeOriginal.has(el))window.__textResizeOriginal.set(el,el.style.fontSize);
      el.style.fontSize=window.__textResizeOriginal.get(el);
    }
    const sizes=nodes.map(el=>parseFloat(getComputedStyle(el).fontSize));
    nodes.forEach((el,i)=>{el.style.fontSize=`${sizes[i]*2}px`;});
  });
}

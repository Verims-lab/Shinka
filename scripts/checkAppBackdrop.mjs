import assert from 'node:assert/strict';
import { createHash } from 'node:crypto';
import { mkdir } from 'node:fs/promises';
import path from 'node:path';

export const backdropSelector = '[data-app-backdrop]';
export const artwork = Object.freeze({ width: 941, height: 1672, logoLeft: 321, logoRight: 620, logoTop: 28, logoBottom: 314 });
const artworkHash = 'b9a3ac496e0b4fff814b10d19273cb3b7027f23577b3fe76d387975709cb2440';

export function readBackdrop(page) {
  return page.locator(backdropSelector).evaluate((layer, artwork) => {
    const shell = getComputedStyle(layer);
    const art = getComputedStyle(layer, '::before');
    const rect = layer.getBoundingClientRect();
    const source = /^url\("([^"]+)"\)$/.exec(art.backgroundImage)?.[1];
    const root = getComputedStyle(document.documentElement);
    const inset = Object.fromEntries(['top','right','bottom','left'].map(side=>[side,parseFloat(root.getPropertyValue(`--safe-${side}`))||0]));
    const artLeft = parseFloat(art.left)+(parseFloat(art.marginLeft)||0);
    const artTop = parseFloat(art.top), artWidth = parseFloat(art.width);
    const scale = artWidth/artwork.width;
    const route = layer.nextElementSibling;
    const body = route?.firstElementChild;
    const content = body?.getBoundingClientRect();
    const contentTop = content ? content.top+scrollY : null;
    const logo = { left: artLeft+scale*artwork.logoLeft, right: artLeft+scale*artwork.logoRight,
      top: artTop+scale*artwork.logoTop, bottom: artTop+scale*artwork.logoBottom };
    return {
      source, repeat: art.backgroundRepeat, size: art.backgroundSize,
      artWidth, artHeight: parseFloat(art.height), artLeft, artTop, inset, logo,
      position: shell.position, pointerEvents: shell.pointerEvents,
      ariaHidden: layer.getAttribute('aria-hidden'),
      outsideMotion: !layer.closest('[data-route-motion]'),
      overlay: getComputedStyle(layer, '::after').content,
      filter: art.filter, opacity: art.opacity, mask: art.maskImage,
      top: rect.top, left: rect.left, width: rect.width,
      documentTop: rect.top+scrollY, contentTop, scrollY,
      readingSurface: body ? getComputedStyle(body).backgroundImage : 'none',
      wordmarks: body ? [...body.querySelectorAll('span,h1')].filter(el=>el.getBoundingClientRect().height>0&&el.textContent.trim()==='Shinka').length : 0,
      viewportWidth: document.documentElement.clientWidth,
      viewportHeight: innerHeight, scrollWidth: document.documentElement.scrollWidth,
    };
  }, artwork);
}

export async function loadAppBackdrop(page) {
  const { source } = await readBackdrop(page);
  assert(source, 'the backdrop must contain a single image URL');
  const image = await page.evaluate(async source => {
    const url = new URL(source, location.href);
    if (url.origin !== location.origin) throw new Error('BACKDROP_NOT_BUNDLED');
    const bitmap = new Image();
    bitmap.src = url.href;
    await bitmap.decode();
    return { width: bitmap.naturalWidth, height: bitmap.naturalHeight };
  }, source);
  assert.deepEqual(image, { width: artwork.width, height: artwork.height });
}

async function verifyBackdrop(page, origin, expectedTheme) {
  const paint = await readBackdrop(page);
  assert.equal(new URL(paint.source).origin, origin);
  assert.match(paint.source, /\/shinka-background(?:-[\w-]+)?\.png$/);
  assert.equal(paint.size, 'contain');
  assert.equal(paint.repeat, 'no-repeat');
  assert.equal(paint.position, 'absolute');
  assert.equal(paint.pointerEvents, 'none');
  assert.equal(paint.ariaHidden, 'true');
  assert(paint.outsideMotion && paint.documentTop === 0 && paint.left === 0);
  assert.equal(paint.overlay, 'none');
  assert.equal(paint.filter, 'none');
  assert.equal(paint.opacity, '1');
  assert.equal(paint.mask, 'none');
  assert.equal(paint.wordmarks, 0);
  assert(paint.width >= paint.viewportWidth);
  assert(paint.scrollWidth <= paint.viewportWidth + 1, 'no horizontal document overflow');
  const { inset } = paint;
  const expectedWidth = Math.min(paint.width-inset.left-inset.right, (paint.viewportHeight-inset.top-inset.bottom)*artwork.width/artwork.height);
  assert(Math.abs(paint.artWidth - expectedWidth) < 1);
  assert(Math.abs(paint.artHeight - expectedWidth*artwork.height/artwork.width) < 1);
  assert.equal(paint.artTop,inset.top);
  const center=(paint.width+inset.left-inset.right)/2;
  assert(Math.abs(paint.artLeft+paint.artWidth/2-center)<1,'original logo centers in the safe viewport');
  assert(paint.contentTop>=paint.logo.bottom+4,'route content starts below the original logo');
  if (expectedTheme) {
    assert.equal(await page.evaluate(() => getComputedStyle(document.documentElement).colorScheme), expectedTheme);
    assert.equal(paint.readingSurface==='none',expectedTheme==='light');
  }
  return paint;
}

// Real App routes with the existing synthetic SDK fixture.
export async function checkAppBackdrop(browser, origin, directory) {
  const context = await browser.newContext({ reducedMotion: 'reduce' });
  const page = await context.newPage();
  const results = [], errors = [];
  let verifiedAsset = false;
  let lightLogo;
  page.on('pageerror', error => errors.push(error.message));
  await page.route('**/*', route => new URL(route.request().url()).origin === origin ? route.continue() : route.abort());
  if (directory) await mkdir(directory, { recursive: true });
  const capture = async label => {
    if (directory) {
      await loadAppBackdrop(page);
      await page.screenshot({ path: path.join(directory, `${label}.png`) });
    }
  };

  try {
    for (const [width, height] of [[320,568], [360,740], [390,844], [430,932], [768,1024], [1280,900], [844,390]]) {
      await page.setViewportSize({ width, height });
      for (const theme of ['light', 'dark']) {
        await page.goto(`${origin}/?appFixture=1&themeFixture=1&sdkSession=admin&onboardingState=ACTIVE_EXISTING_USER&theme=${theme}`);
        await page.locator('[data-daily-id]').waitFor();
        await page.locator(backdropSelector).evaluate(layer => { window.__appBackdropFixture = layer; });
        await loadAppBackdrop(page);
        if (!verifiedAsset) {
          const source=(await readBackdrop(page)).source;
          assert.equal(new URL(source).origin,origin);
          const response=await page.request.get(source);
          assert(response.ok());
          assert.equal(createHash('sha256').update(await response.body()).digest('hex'),artworkHash,'bundled PNG matches the supplied image');
          verifiedAsset=true;
        }
        for (const [index, screen] of ['home', 'calendar', 'pattern', 'you'].entries()) {
          if (screen === 'you') await page.locator('[data-profile-trigger]:visible').click();
          else if (index) await page.locator('nav.shinka-product-nav:visible a').nth(index).click();
          await page.locator(`[data-${screen}-root]`).waitFor();
          if (screen === 'pattern') await page.locator('[data-lunar-timeline]').waitFor();
          if (screen === 'you') await page.locator('#you-theme').waitFor();
          const paint = await verifyBackdrop(page, origin, theme);
          if (directory && width===390 && screen==='home') {
            await page.evaluate(()=>scrollTo(0,0));
            const { logo }=paint;
            const clip={x:Math.ceil(logo.left),y:Math.ceil(logo.top),width:Math.floor(logo.right-logo.left)-2,height:Math.floor(logo.bottom-logo.top)-2};
            const sample=await page.screenshot({clip,path:path.join(directory,`logo-390-${theme}.png`)});
            if(theme==='light') lightLogo=sample;
            else assert(sample.equals(lightLogo),'light and dark screenshots keep the exact logo pixels');
          }
          assert(await page.locator(backdropSelector).evaluate(layer => window.__appBackdropFixture === layer), 'the shared layer survives navigation');
          if (index < 3) {
            const nav = page.locator('nav.shinka-product-nav:visible');
            await page.evaluate(() => document.documentElement.style.setProperty('--safe-bottom', '34px'));
            const insetPaint=await verifyBackdrop(page,origin,theme);
            await nav.scrollIntoViewIfNeeded();
            const surface = await nav.evaluate(el => {
              const css = getComputedStyle(el);
              return { position: css.position, padding: css.paddingBottom, background: css.backgroundColor };
            });
            assert.equal(surface.position, 'static');
            assert.equal(surface.padding, '34px');
            assert.match(surface.background, /^rgba\(.+, 0\.8\)$/);
            const scrolled=await readBackdrop(page);
            assert.equal(scrolled.documentTop,0);
            assert(Math.abs(scrolled.top+scrolled.scrollY)<.5,'art scrolls with its document anchor');
            assert.equal(scrolled.artWidth,insetPaint.artWidth);
            await page.evaluate(() => {
              document.documentElement.style.removeProperty('--safe-bottom');
              scrollTo(0, 0);
            });
          }
          results.push({ screen, width, height, theme, passed: true });
          if (width === 390 || screen === 'home') await capture(`${screen}-${width}-${theme}`);
        }
        if (width === 390) {
          await page.locator('a[href^="/account-privacy"]').first().click();
          await page.locator('[data-privacy-actions]').waitFor();
          await verifyBackdrop(page, origin, theme);
          assert(await page.locator(backdropSelector).evaluate(layer => window.__appBackdropFixture === layer));
          await capture(`privacy-${width}-${theme}`);
          results.push({ screen: 'privacy after profile', width, height, theme, passed: true });
        }
      }
    }
    await page.setViewportSize({ width: 390, height: 844 });
    for (const [route, query, ready] of [
      ['/onboarding', 'sdkSession=anonymous', '[data-onboarding-step="1"]'],
      ['/login', 'sdkSession=anonymous', '[data-auth-shell]'],
      ['/onboarding', 'sdkSession=user&onboardingState=FIRST_SHINKA_DEPENDENCY&holdDaily=1', '[data-onboarding-state="FIRST_SHINKA_DEPENDENCY"]'],
      ['/onboarding', 'sdkSession=user&holdHydration=1', 'main[aria-busy="true"]'],
      ['/account-privacy', 'sdkSession=anonymous', 'main h1'],
      ['/delete-account', 'sdkSession=anonymous', 'main h1'],
      ['/register', 'sdkSession=anonymous', 'h1'],
    ]) {
      await page.goto(`${origin}${route}?appFixture=1&${query}`);
      await page.locator(ready).waitFor();
      await verifyBackdrop(page, origin, 'light');
      assert.equal(await page.locator('[data-probe-root].bg-shinka-ivory').evaluateAll(roots => roots.every(root => getComputedStyle(root).backgroundColor === 'rgba(0, 0, 0, 0)')), true);
      results.push({ route, ready, passed: true });
      if (route === '/login' || route === '/delete-account' || route === '/register') await capture(route.slice(1));
    }
    await page.goto(`${origin}/login?appFixture=1&startupFixture=1`);
    await page.waitForFunction(() => window.__authFixture?.startupStarted.settings === 1);
    await verifyBackdrop(page, origin, 'light');
    await page.evaluate(() => {
      window.__authFixture.settleStartup('settings', 0, null, true);
      window.__authFixture.settleStartup('session', 0, {});
    });
    await page.getByRole('heading', { name: 'Access Restricted' }).waitFor();
    await verifyBackdrop(page, origin, 'light');
    results.push({ screen: 'startup and access refusal', passed: true });

    await page.goto(`${origin}/internal?appFixture=1&sdkSession=admin`);
    await page.locator('[data-admin-panel]').waitFor();
    assert.equal(await page.locator(backdropSelector).count(), 0);
    assert.notEqual(await page.locator('[data-probe-root]').evaluate(el => getComputedStyle(el).backgroundColor), 'rgba(0, 0, 0, 0)');
    results.push({ screen: 'internal surface', passed: true });
    assert.deepEqual(errors, []);
    return results;
  } finally {
    await context.close();
  }
}

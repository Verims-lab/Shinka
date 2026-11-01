import assert from 'node:assert/strict';
import { mkdir } from 'node:fs/promises';
import path from 'node:path';

export async function checkCalendarFlow(page, origin, directory) {
  if (directory) await mkdir(directory, { recursive: true });
  const results = [];
  for (const width of [360, 1280]) for (const language of ['en','tr']) {
    await page.setViewportSize({ width, height: 900 });
    await page.goto(`${origin}/calendar?appFixture=1&sdkSession=admin&onboardingState=ACTIVE_EXISTING_USER&language=${language}`);
    await page.waitForSelector('[data-calendar-date="2026-10-01"]');
    await page.locator('[data-calendar-date="2026-10-01"]').click();
    assert.equal(await page.evaluate(() => window.__authFixture.calls.filter(c=>c.name==='calendar'&&c.action!=='read').length),0);
    await page.locator('[data-calendar-date="2026-10-01"]').focus();
    await page.keyboard.press('ArrowRight');
    assert.equal(await page.evaluate(()=>document.activeElement?.getAttribute('data-calendar-date')),'2026-10-02');
    const geometry = await page.evaluate(() => ({ width: innerWidth, scrollWidth: document.documentElement.scrollWidth,
      days: [...document.querySelectorAll('[data-calendar-date]')].map(e=>({width:e.getBoundingClientRect().width,height:e.getBoundingClientRect().height})),
      dateFont:getComputedStyle(document.querySelector('input[type=date]')).fontSize,
    }));
    assert(geometry.scrollWidth <= width + 1 && geometry.days.every(d=>d.width>=44&&d.height>=44));
    assert.equal(geometry.dateFont,'17px');
    if (directory) await page.screenshot({ path:path.join(directory,`calendar-${width}-${language}.png`),fullPage:true });
    const remove=page.getByRole('button',{name:language==='tr'?'Regl başlangıcını sil':'Delete period start',exact:true});
    await remove.click();
    await page.waitForSelector('dialog[open]');
    if (directory) await page.screenshot({path:path.join(directory,`calendar-delete-${width}-${language}.png`),fullPage:true});
    await page.getByRole('button',{name:language==='tr'?'İptal':'Cancel',exact:true}).click();
    assert.equal(await page.evaluate(()=>window.__calendarLab.rows.user_period_record.length),1);
    const id = await page.evaluate(()=>window.__calendarLab.rows.user_period_record[0].id);
    await page.locator('input[type=date]').fill('2026-10-02');
    await page.getByRole('button',{name:language==='tr'?'Regl başlangıcını işaretle':'Mark period start',exact:true}).click();
    await page.waitForFunction(id=>window.__calendarLab.rows.user_period_record[0].id===id&&window.__calendarLab.rows.user_period_record[0].period_start_date==='2026-10-02',id);
    await page.locator('[data-calendar-date="2026-10-02"]').click();
    await remove.click();
    await page.locator('dialog').getByRole('button',{name:language==='tr'?'Regl başlangıcını sil':'Delete period start',exact:true}).click();
    await page.waitForFunction(()=>window.__calendarLab.rows.user_period_record.length===0);
    await page.waitForSelector('dialog',{state:'detached'});
    assert.equal(await page.evaluate(()=>window.__calendarLab.rows.user_cycle_phase_day.length),0);
    if (directory) await page.screenshot({path:path.join(directory,`calendar-empty-${width}-${language}.png`),fullPage:true});
    await page.locator('nav a:visible').first().click();
    await page.waitForSelector('[data-home-root]');
    await page.waitForSelector('[data-daily-id="local-ui-daily"]');
    await page.locator('nav a:visible').nth(1).click();
    await page.waitForSelector('[data-calendar-date="2026-10-01"]');
    assert.equal(await page.evaluate(()=>window.__calendarLab.rows.user_period_record.length),0);
    results.push({scenario:`calendar-edit-cancel-last-delete-home-${width}-${language}`,passed:true,geometry,scope:'LOCAL_BROWSER_SYNTHETIC'});
  }
  for(const scenario of ['blocked','consent']) {
    await page.setViewportSize({width:360,height:740});
    await page.goto(`${origin}/calendar?appFixture=1&sdkSession=admin&onboardingState=ACTIVE_EXISTING_USER&language=tr&calendarScenario=${scenario}`);
    await page.waitForSelector('[data-calendar-date="2026-10-01"]');
    if(scenario==='blocked') assert(await page.locator('button[type=submit]').isDisabled());
    else assert(!(await page.locator('input[type=checkbox]').isChecked()));
    if(directory)await page.screenshot({path:path.join(directory,`calendar-${scenario}-360-tr.png`),fullPage:true});
    results.push({scenario:`calendar-${scenario}`,passed:true,scope:'LOCAL_BROWSER_SYNTHETIC'});
  }
  for (const language of ['tr', 'en']) {
    await page.goto(`${origin}/calendar?appFixture=1&sdkSession=admin&onboardingState=ACTIVE_EXISTING_USER&language=${language}&calendarScenario=unsupported`);
    await page.waitForSelector('[data-calendar-estimate-unavailable]');
    assert.equal(await page.locator('[data-calendar-estimate-unavailable]').getAttribute('role'), 'status');
    assert.equal(await page.locator('button[type=submit]').isDisabled(), false);
    assert.equal(await page.evaluate(() => window.__calendarLab.rows.user_cycle_phase_day.length), 0);
    assert.equal(await page.evaluate(() => window.__calendarLab.rows.user_cycle_prediction.length), 0);
    assert(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth + 1));
    if (directory) await page.screenshot({ path: path.join(directory, `calendar-unsupported-360-${language}.png`), fullPage: true });
    results.push({ scenario: `calendar-unsupported-${language}`, passed: true, scope: 'LOCAL_BROWSER_SYNTHETIC' });
  }
  return results;
}

// Real retained tabs and Calendar controller; the fixture is transport-only.
// Native same-action persistence is separately exercised by CU08/RC/NA fixtures.
export async function checkCalendarContinuity(page, origin) {
  const rows=[];
  await page.setViewportSize({width:390,height:700});
  for(const language of ['tr','en']) {
    await page.goto(`${origin}/calendar?appFixture=1&sdkSession=admin&onboardingState=ACTIVE_EXISTING_USER&language=${language}`);
    await page.locator('[data-calendar-date="2026-10-01"]').waitFor();
    await page.getByRole('button',{name:language==='tr'?'Önceki ay':'Previous month',exact:true}).click();
    await page.locator('[data-calendar-date="2026-09-01"]').waitFor();
    await page.locator('[data-calendar-date="2026-09-01"]').click();await page.locator('[data-calendar-feedback="draft"]').waitFor();
    const target=await page.evaluate(()=>{const y=Math.min(300,document.documentElement.scrollHeight-innerHeight);window.scrollTo({top:y,behavior:'instant'});return y;});
    assert(target>0,'Calendar fixture is not scrollable');await page.waitForFunction(y=>Math.abs(scrollY-y)<=1,target);
    const scroll=await page.evaluate(()=>scrollY);
    await page.locator('nav a:visible').nth(2).click();await page.locator('[data-lunar-summary]').waitFor();
    await page.locator('nav a:visible').nth(1).click();await page.locator('[data-calendar-feedback="draft"]:visible').waitFor();
    await page.waitForFunction(y=>Math.abs(scrollY-y)<=1,scroll);
    assert.equal(await page.locator('#calendar-start-date').inputValue(),'2026-09-01');
    assert.equal(await page.locator('[data-calendar-date="2026-09-01"]:visible').count(),1);
    const writes=()=>page.evaluate(()=>window.__authFixture.calls.filter(c=>c.name==='calendar'&&c.action!=='read').length);
    assert.equal(await writes(),0);
    await page.evaluate(()=>{window.__authFixture.holdOperation('calendar');window.__calendarLab.fault('lostResponse');});
    await page.locator('[data-calendar-root] button[type=submit]').click();await page.locator('[data-calendar-feedback="pending"]').waitFor();
    assert.equal(await page.locator('[data-calendar-root] form').getAttribute('aria-busy'),'true');
    assert.equal(await page.evaluate(()=>window.__calendarLab.rows.user_period_record.length),1);
    await page.locator('nav a:visible').nth(2).click();await page.locator('[data-pattern-root]:visible').waitFor();
    await page.locator('nav a:visible').nth(1).click();await page.locator('[data-calendar-feedback="pending"]:visible').waitFor();assert.equal(await writes(),1);
    await page.evaluate(()=>window.__authFixture.releaseOperation('calendar'));
    await page.locator('[data-calendar-error]').waitFor();
    assert.equal(await page.locator('[data-calendar-feedback]').count(),0);assert.equal(await page.locator('#calendar-start-date').inputValue(),'2026-09-01');
    assert.equal(await page.evaluate(()=>window.__calendarLab.rows.user_period_record.length),2);
    assert.equal(await page.getByText(language==='tr'?'Regl başlangıcı kaydedildi':'Period start saved',{exact:true}).count(),0);
    await page.evaluate(()=>window.__calendarLab.fault(null));
    await page.getByRole('button',{name:language==='tr'?'Kontrol et / aynı işlemi tekrar dene':'Check / retry the same change',exact:true}).click();
    await page.getByText(language==='tr'?'Regl başlangıcı kaydedildi':'Period start saved',{exact:true}).waitFor();
    assert.equal(await page.evaluate(()=>window.__calendarLab.rows.user_period_record.length),2);assert.equal(await writes(),1);
    await page.locator('[data-calendar-date="2026-09-01"]').click();
    await page.getByRole('button',{name:language==='tr'?'Regl başlangıcını sil':'Delete period start',exact:true}).click();await page.locator('dialog[open]').waitFor();
    const before=page.url();await page.goBack();await page.locator('dialog').waitFor({state:'detached'});
    assert.equal(page.url(),before);assert.equal(await writes(),1);assert.equal(await page.locator('#calendar-start-date').inputValue(),'2026-09-01');
    rows.push({scenario:`calendar-scroll-month-draft-pending-unknown-retry-layer-back-${language}`,passed:true,scroll,scope:'LOCAL_REAL_APP_SYNTHETIC_PROTOCOL_TRANSPORT'});
  }
  return rows;
}

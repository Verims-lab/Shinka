import assert from 'node:assert/strict';
export async function checkHealthTiming(browser, origin) {
  const results = [];
  for (const slow of [false,true]) for (const id of ['H10-003','H13-014']) {
    const page = await browser.newPage(); let externalRequests = 0;
    await page.route('**/*', route => {
      const request = route.request();
      if (new URL(request.url()).origin === origin) return route.continue();
      if (['fetch','xhr'].includes(request.resourceType())) externalRequests++;
      return route.abort();
    });
    try {
      await page.goto(`${origin}/internal/health`);
      await page.waitForFunction(() => !!window.__runHealthTiming);
      const result = await page.evaluate(({id,slow}) => window.__runHealthTiming(id,slow), {id,slow});
      results.push({...result,externalRequests});
      assert.equal(externalRequests,0,'Synthetic helper attempted external IO');
      assert.equal(result.status,'PASS',`${id} slow=${slow}: ${JSON.stringify(result.evidence.actual)}`);
    } finally { await page.close(); }
  }
  return results;
}

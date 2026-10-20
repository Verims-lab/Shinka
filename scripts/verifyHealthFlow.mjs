import assert from 'node:assert/strict';
export async function checkInAppHealth(page, origin) {
  await page.goto(`${origin}/internal/health`);
  await page.evaluate(()=>sessionStorage.removeItem('shinka.browser-evidence.v1'));
  assert.equal(await page.locator('input[type=file]').count(),0);
  const started=Date.now();
  await page.getByRole('button',{name:'Run Health',exact:true}).click();
  await page.locator('[data-save-state=SAVED]').waitFor({timeout:30000});
  const result=await page.evaluate(()=>{
    const r=window.__savedHealthReport;
    return {scope:r.assessmentScope,runIdPresent:!!r.runId,transfers:r.localRegressionRequirements.map(x=>x.id),cases:r.cases.map(c=>({id:c.id,status:c.status,reason:c.evidence?.reason,actual:c.id==='H13-004'?c.evidence.actual:undefined})),frames:document.querySelectorAll('[data-onboarding-fixture]').length};
  });
  assert.equal(result.scope,'IN_APP_HEALTH');assert.equal(result.frames,0);
  for(const id of ['H03-007','H13-012']){assert(!result.cases.some(c=>c.id===id));assert(result.transfers.includes(id));}
  assert.equal(result.cases.find(c=>c.id==='H10-003').status,'PASS');
  assert.equal(result.cases.find(c=>c.id==='H13-004').actual.width,page.viewportSize().width);
  assert(!result.cases.some(c=>/TIMEOUT/.test(c.reason||'')));
  return {scope:'LOCAL_REAL_UI_SYNTHETIC_TRANSPORT',passed:true,durationMs:Date.now()-started,requiresJson:false,saveState:'SAVED',frames:result.frames,cases:result.cases,physicalDevice:false};
}

import assert from 'node:assert/strict';
export async function checkInAppHealth(page, origin) {
  await page.goto(`${origin}/internal/health`);
  await page.evaluate(()=>sessionStorage.removeItem('shinka.browser-evidence.v1'));
  assert.equal(await page.locator('input[type=file]').count(),0);
  const started=Date.now();
  await page.evaluate(()=>window.__authFixture.failOperation('internalHealth.save'));
  await page.getByRole('button',{name:'Run Health',exact:true}).click();
  await page.locator('[data-save-state=UNKNOWN]').waitFor({timeout:30000});
  const beforeRetry=await page.evaluate(()=>window.__authFixture.calls.filter(c=>c.name==='internalHealth'&&c.action==='save').length);
  await page.locator('[data-save-state] button').first().click();
  await page.locator('[data-save-state=SAVED]').waitFor({timeout:30000});
  assert.equal(await page.evaluate(()=>window.__authFixture.calls.filter(c=>c.name==='internalHealth'&&c.action==='save').length),beforeRetry+1);
  await page.getByRole('button',{name:'Open private report',exact:true}).waitFor();
  assert.equal(await page.getByRole('button',{name:'Open private report',exact:true}).count(),1);
  await page.context().route('https://health-report.example.invalid/**',route=>route.fulfill({contentType:'application/json',body:'{"synthetic":true}'}));
  const popupEvent=page.waitForEvent('popup');
  await page.getByRole('button',{name:'Open private report',exact:true}).click();
  const popup=await popupEvent;
  await popup.waitForURL('https://health-report.example.invalid/synthetic-report.json');
  assert.equal(await popup.evaluate(()=>window.opener),null);
  await popup.close();
  const result=await page.evaluate(()=>{
    const r=window.__savedHealthReport;
    return {scope:r.assessmentScope,runIdPresent:!!r.runId,transfers:r.localRegressionRequirements.map(x=>x.id),cases:r.cases.map(c=>({id:c.id,status:c.status,reason:c.evidence?.reason,actual:c.id==='H13-004'||c.status==='FAIL'?c.evidence.actual:undefined})),frames:document.querySelectorAll('[data-onboarding-fixture]').length};
  });
  const unavailable=new Set(['H04-019','H08-005','H09-004','H12-031',...Array.from({length:9},(_,i)=>`H05-${String(i+1).padStart(3,'0')}`)]);
  for(const row of result.cases)assert.equal(row.status,unavailable.has(row.id)?'BLOCKED':'PASS',`${row.id}: ${row.reason}; ${JSON.stringify(row.actual)}`);
  assert.equal(result.scope,'IN_APP_HEALTH');assert.equal(result.frames,0);
  for(const id of ['H03-007','H13-012']){assert(!result.cases.some(c=>c.id===id));assert(result.transfers.includes(id));}
  for(const id of ['H06-006','H07-012','H13-021'])assert.equal(result.cases.find(c=>c.id===id)?.status,'PASS',`${id} is required in the in-app Health plan`);
  assert.equal(result.cases.find(c=>c.id==='H10-003').status,'PASS');
  assert.equal(result.cases.find(c=>c.id==='H13-004').actual.width,page.viewportSize().width);
  assert(!result.cases.some(c=>/TIMEOUT/.test(c.reason||'')));
  return {scope:'LOCAL_REAL_UI_SYNTHETIC_TRANSPORT',passed:true,durationMs:Date.now()-started,requiresJson:false,saveState:'SAVED',retrySave:true,historyListed:true,privateReportOpened:true,frames:result.frames,cases:result.cases,physicalDevice:false};
}

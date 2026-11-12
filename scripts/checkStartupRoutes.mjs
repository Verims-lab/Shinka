import assert from 'node:assert/strict';
const id=(name='A',role='admin')=>({id:`synthetic-${name}`,role,authority:'BASE44_NATIVE_V1',terms:{state:'CURRENT',version:'test-terms-v1',acceptance:{id:'synthetic-acceptance',status:'ACCEPTED',acceptedAt:'2026-11-01T12:00:00Z'}}});
// Real App, real provider/routes/controllers; only SDK IO and deferred gates substituted.
export async function checkStartupRoutes(page,origin) {
  const results=[];
  const start=async(path='/')=>{
    await page.goto(`${origin}${path}?appFixture=1&startupFixture=1&sdkSession=user&onboardingState=ACTIVE_EXISTING_USER`);
    await page.waitForFunction(()=>window.__authFixture?.startupStarted.settings===1&&window.__authFixture.startupStarted.session===1);
  };
  const settle=(name,index,value,refused=false)=>page.evaluate(({name,index,value,refused})=>window.__authFixture.settleStartup(name,index,value,refused),{name,index,value,refused});
  const noProduct=async()=>{
    assert.equal(await page.locator('[data-home-root],[data-you-root],[data-calendar-root],[data-pattern-root],[data-test-tools-root]').count(),0);
    assert.deepEqual(await page.evaluate(()=>window.__authFixture.calls.filter(c=>c.name!=='applicationSession')),[],'product/backend work before admission');
  };
  for(const path of ['/','/calendar','/pattern','/you','/internal/test-tools']) for(const sessionFirst of [false,true]){
    await start(path);await noProduct();
    if(sessionFirst){await settle('session',0,id());await page.waitForFunction(()=>window.__appAuth?.user?.id==='synthetic-A');await noProduct();}
    await settle('settings',0,null,true);
    await page.getByRole('heading',{name:'Access Restricted'}).waitFor();
    if(!sessionFirst)await settle('session',0,id());
    await page.evaluate(()=>window.__appAuth.checkUserAuth());
    await noProduct();assert.equal(await page.evaluate(()=>window.__appAuth.isAuthenticated),false);
    results.push({path,order:sessionFirst?'session-first':'settings-first',passed:true});
  }
  // Start a new account check while both old reads pend. Old refusal/success
  // must not override the new role or open the admin route.
  await start('/internal/test-tools');
  await page.evaluate(()=>{window.__authFixture.holdStartup('settings');window.__authFixture.holdStartup('session');void window.__appAuth.checkAppState();});
  await page.waitForFunction(()=>window.__authFixture.startupStarted.session===2);
  await settle('session',1,id('user','user'));await settle('settings',1,{});
  await page.waitForFunction(()=>window.__appAuth?.user?.id==='synthetic-user'&&!window.__appAuth.isLoadingPublicSettings);
  await settle('settings',0,null,true);await settle('session',0,id('A','admin'));
  await page.locator('[data-error-code="FORBIDDEN"]').waitFor();
  assert.equal(await page.evaluate(()=>window.__appAuth.user.id),'synthetic-user');await noProduct();
  results.push({scenario:'old-refusal-and-admin-result-after-new-normal-account',passed:true});
  await start();await page.evaluate(()=>window.__appAuth.logout(false));
  await settle('settings',0,{});await settle('session',0,id());
  await page.locator('[data-onboarding-state^="UNAUTHENTICATED_"]').waitFor();
  assert.ok(['UNAUTHENTICATED_INTRO','UNAUTHENTICATED_SIGN_IN'].includes(await page.locator('[data-onboarding-state]').getAttribute('data-onboarding-state')));
  assert.equal(await page.evaluate(()=>window.__appAuth.isAuthenticated),false);
  await noProduct();assert.equal(await page.evaluate(()=>window.__appAuth.user),null);
  results.push({scenario:'logout-during-both-startup-reads',passed:true});
  return {scope:'LOCAL_REAL_APP_SYNTHETIC_SDK_NO_EXTERNAL_IO',results};
}

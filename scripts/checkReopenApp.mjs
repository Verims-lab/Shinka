import assert from 'node:assert/strict';
import { FIRST_CONTENT_SOURCE } from '../base44/shared/firstContentSource.js';
const identity={id:'synthetic-user',role:'user',authority:'BASE44_NATIVE_V1'};
export async function checkReopenApp(browser,origin){
  const context=await browser.newContext({viewport:{width:390,height:744}}),page=await context.newPage(),rows=[],errors=[];
  page.on('pageerror',e=>errors.push(e.message));
  await page.route('**/*',r=>new URL(r.request().url()).origin===origin?r.continue():r.abort());
  await page.addInitScript(pair=>{
    window.__dailyFixture={persisted:true,state:'ACTIVE_EXISTING_USER',daily:{id:'reopen-day',shinka_date:'2026-10-20',message_tr_snapshot:pair[2],suggestion_tr_snapshot:pair[3],message_en_snapshot:pair[4],suggestion_en_snapshot:pair[5]}};
    window.__pageRestores=[];window.addEventListener('pageshow',e=>window.__pageRestores.push(e.persisted));
  },FIRST_CONTENT_SOURCE.pairs[0]);
  const url=`${origin}/?appFixture=1&startupFixture=1&sdkSession=user&onboardingState=ACTIVE_EXISTING_USER`;
  const settle=(name,index,value)=>page.evaluate(({name,index,value})=>window.__authFixture.settleStartup(name,index,value),{name,index,value});
  try{
    for(const order of ['settings-first','session-first']){
      await page.goto(url);await page.waitForFunction(()=>window.__authFixture?.startupStarted.session===1);
      const first=order==='settings-first'?'settings':'session',second=first==='session'?'settings':'session';
      await settle(first,0,first==='session'?identity:{});
      assert.equal(await page.locator('[data-home-root]').count(),0);
      assert.equal(await page.evaluate(()=>window.__sdkLabCalls.filter(c=>c.name!=='applicationSession').length),0);
      await settle(second,0,second==='session'?identity:{});await page.locator('[data-daily-id]').waitFor();
      rows.push({scenario:order,passed:true});
    }
    // Explicit re-admission seals old mounted scopes synchronously. New product
    // calls are not made while either new authority read remains unresolved.
    await page.evaluate(()=>{window.__authFixture.holdStartup('settings');window.__authFixture.holdStartup('session');window.__beforeCold=window.__sdkLabCalls.filter(c=>c.name!=='applicationSession').length;void window.__appAuth.checkAppState();});
    await page.waitForFunction(()=>window.__authFixture.startupStarted.session===2);
    assert.equal(await page.locator('[data-home-root]').count(),0);
    assert.equal(await page.evaluate(()=>window.__sdkLabCalls.filter(c=>c.name!=='applicationSession').length-window.__beforeCold),0);
    await settle('session',1,identity);await settle('settings',1,{});await page.locator('[data-daily-id]').waitFor();
    rows.push({scenario:'cold-readmission-no-early-product',passed:true});
    for(const [name,ready] of [['Calendar','[data-calendar-date]'],['Pattern','[data-lunar-summary]'],['Home','[data-daily-id]']]){
      await page.getByRole('link',{name,exact:true}).filter({visible:true}).click();await page.locator(ready).filter({visible:true}).first().waitFor();
      rows.push({scenario:`tab-return-${name}`,passed:true});
    }
    await page.getByRole('link',{name:'You',exact:true}).filter({visible:true}).click();await page.locator('[data-you-root]').waitFor();
    await page.goBack();await page.locator('[data-daily-id]').waitFor();rows.push({scenario:'you-and-back',passed:true});
    // Actual history navigation: recorded separately from injected pageshow.
    await page.goto(`${origin}/fixture-away`);await page.goBack();
    await page.waitForFunction(()=>Array.isArray(window.__pageRestores));
    const persisted=await page.evaluate(()=>window.__pageRestores.includes(true));
    if(persisted){await page.locator('[data-daily-id]').waitFor();rows.push({scenario:'real-bfcache',status:'OBSERVED',passed:true});}
    else rows.push({scenario:'real-bfcache',status:'NOT_OBSERVED',passed:null});
    assert.deepEqual(errors,[]);return {scope:'LOCAL_REAL_APP_SYNTHETIC_SDK',rows};
  }finally{await context.close();}
}

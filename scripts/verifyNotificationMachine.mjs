import assert from 'node:assert/strict';
import { createNotificationMachineAdmission } from '../base44/shared/notificationMachineAuth.js';
import { handleNotificationSchedule } from '../base44/shared/notificationScheduler.js';
import { assertAdmin, requireAdmin } from '../base44/shared/internalAuthorization.js';

// Deliberately non-random fixtures, never platform credentials. Values are not
// returned in evidence/errors. Real node:crypto implementation is exercised.
const fixture = 'a'.repeat(64), replacement = 'b'.repeat(64);
export async function verifyNotificationMachine() {
  const results=[];
  const test=async(id,assertion,fn)=>{await fn();results.push({id,status:'PASS',assertion});};
  const denied=async(readSecret,readCredential,status)=>{
    let clients=0,providers=0;
    const response=await handleNotificationSchedule(new Request('https://fixture.invalid/schedule',{method:'POST',body:'{"action":"tick"}'}),{
      createClient:()=>{clients++;throw new Error('UNEXPECTED_CLIENT');},enabled:true,
      createProvider:()=>{providers++;throw new Error('UNEXPECTED_PROVIDER');},
      admitMachine:createNotificationMachineAdmission({readSecret,readCredential}),
    });
    assert.equal(response.status,status);assert.equal(clients,0);assert.equal(providers,0);
    const output=await response.text();assert.ok(!output.includes(fixture)&&!output.includes('private'));
  };
  await test('SM01','Missing, blank, malformed and unreadable configuration: no client/work/provider',async()=>{
    for(const value of [undefined,null,'',' ',false,{},'a'.repeat(63),'g'.repeat(64),'a'.repeat(65)])await denied(()=>value,()=>fixture,503);
    await denied(()=>{throw new Error('private config');},()=>fixture,503);
  });
  await test('SM02','Missing, malformed, unreadable and equal-length wrong credential: no client/work/provider',async()=>{
    for(const value of [undefined,null,'',' ',{},fixture+' ',replacement,'b'+fixture.slice(1),fixture.slice(0,-1)+'b'])await denied(()=>fixture,()=>value,401);
    await denied(()=>fixture,()=>{throw new Error('private credential');},401);
  });
  await test('SM03','Factory performs no reads; every admission rereads configuration and credential',async()=>{
    let expected=fixture,provided=fixture,reads=0,credentials=0;
    const admit=createNotificationMachineAdmission({readSecret:()=>{reads++;return expected;},readCredential:()=>{credentials++;return provided;}});
    assert.equal(reads,0);assert.equal(await admit(),undefined);expected=replacement;
    await assert.rejects(admit,{code:'NOTIFICATION_MACHINE_AUTH_REQUIRED'});provided=replacement;await admit();
    expected=undefined;await assert.rejects(admit,{code:'NOTIFICATION_AUTH_UNAVAILABLE'});
    assert.equal(reads,4);assert.equal(credentials,3);
  });
  await test('SM04','Request-local callbacks share no authorization or configuration cache',async()=>{
    const a=createNotificationMachineAdmission({readSecret:()=>fixture,readCredential:()=>fixture});
    const b=createNotificationMachineAdmission({readSecret:()=>replacement,readCredential:()=>fixture});
    await a();await assert.rejects(b,{code:'NOTIFICATION_MACHINE_AUTH_REQUIRED'});await a();
  });
  await test('SM05','Successful comparison returns no User/admin authority and leaves common guards closed',async()=>{
    const value=await createNotificationMachineAdmission({readSecret:()=>fixture,readCredential:()=>fixture})();
    assert.equal(value,undefined);assert.throws(()=>assertAdmin(value),{code:'AUTH_REQUIRED'});
    assert.throws(()=>assertAdmin({id:'synthetic',role:'admin'}),{code:'AUTH_REQUIRED'});
    await assert.rejects(()=>requireAdmin({auth:{me:async()=>null}}),{code:'AUTH_REQUIRED'});
  });
  await test('SM06','Valid credential still returns DISABLED with zero service access/work/provider',async()=>{
    let service=0,auth=0,provider=0;
    const response=await handleNotificationSchedule(new Request('https://fixture.invalid/schedule',{method:'POST',body:'{"action":"tick"}'}),{
      createClient:()=>({auth:{me:async()=>{auth++;return null;}},get asServiceRole(){service++;throw new Error('UNEXPECTED_SERVICE');}}),
      enabled:false,createProvider:()=>{provider++;},admitMachine:createNotificationMachineAdmission({readSecret:()=>fixture,readCredential:()=>fixture}),
    });
    assert.equal(response.status,200);assert.deepEqual(await response.json(),{state:'DISABLED',processed:0});
    assert.equal(service+auth+provider,0);
  });
  await test('SM07','Unavailable reader callbacks fail closed; no native identity fallback',async()=>{
    await denied(undefined,()=>fixture,503);await denied(()=>fixture,undefined,401);
  });
  return {scope:'LOCAL_NODE_CRYPTO_REAL_COMPARISON_SYNTHETIC_READERS',passed:true,results,hostedVerified:false};
}

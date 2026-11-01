import assert from 'node:assert/strict';
import { createServer } from 'node:http';
import { createClient as installedClient } from '@base44/sdk';
// Actual SDK over loopback HTTP, not a hand-written entity method mock. The
// optional factory exercises the exact backend-pinned SDK without changing it.
export async function verifyCalendarEntitySdk(createClient = installedClient, version = 'installed') {
  const calls=[];let result;
  const server=createServer(async(req,res)=>{
    let raw='';for await(const chunk of req)raw+=chunk;
    calls.push({method:req.method,path:new URL(req.url,'http://fixture.invalid').pathname,body:JSON.parse(raw)});
    res.writeHead(200,{'Content-Type':'application/json'});res.end(JSON.stringify(result));
  });
  await new Promise((ok,no)=>{server.once('error',no);server.listen(0,'127.0.0.1',ok);});
  try {
    const sdk=createClient({serverUrl:`http://127.0.0.1:${server.address().port}`,appId:'synthetic',serviceToken:'synthetic'});
    const entity=sdk.asServiceRole.entities.UserPeriodRecord, query={id:'period',user_id:'owner',period_start_date:'2026-10-01'},patch={$set:{period_start_date:'2026-10-02'}};
    for(const response of [{success:true,updated:1,has_more:false},{success:true,updated:0,has_more:false},{success:false,updated:0,has_more:true}]) {
      result=response;assert.deepEqual(await entity.updateMany(query,patch),response);
      assert.deepEqual(calls.at(-1),{method:'PATCH',path:'/api/apps/synthetic/entities/UserPeriodRecord/update-many',body:{query,data:patch}});
    }
    for(const response of [{success:true,deleted:1},{success:true,deleted:0},{success:false,deleted:0}]) {
      result=response;assert.deepEqual(await entity.deleteMany(query),response);
      assert.deepEqual(calls.at(-1),{method:'DELETE',path:'/api/apps/synthetic/entities/UserPeriodRecord',body:query});
    }
    return {id:'SDK03',status:'PASS',version,requests:calls.length,scope:'ACTUAL_SDK_LOOPBACK_TRANSPORT_ONLY',hostedMutationVerified:false};
  } finally {await new Promise(ok=>server.close(ok));}
}

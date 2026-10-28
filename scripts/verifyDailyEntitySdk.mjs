import assert from 'node:assert/strict';
import { createServer } from 'node:http';
import { createClient } from '@base44/sdk';
export async function verifyDailyEntitySdk() {
  const calls=[];
  const server=createServer(async(req,res)=>{
    let raw='';for await(const chunk of req) raw+=chunk;
    calls.push({url:new URL(req.url,'http://loopback.invalid'),method:req.method,body:raw?JSON.parse(raw):null});
    res.writeHead(200,{'Content-Type':'application/json'});res.end(JSON.stringify(req.method==='GET'?[]:{success:true,updated:1,has_more:false}));
  });
  await new Promise((ok,fail)=>{server.once('error',fail);server.listen(0,'127.0.0.1',ok);});
  try {
    const client=createClient({serverUrl:`http://127.0.0.1:${server.address().port}`,appId:'synthetic',serviceToken:'synthetic-service'});
    const fields=['id','message_tr','suggestion_tr','message_en','suggestion_en'];
    await client.asServiceRole.entities.MessagePair.filter({id:{$in:['a','b']}},'id',3,0,fields);
    await client.asServiceRole.entities.UserDailyMessage.updateMany({id:'daily',user_id:'synthetic-owner'},{$unset:{message_tr_snapshot:''}});
    assert.equal(calls.length,2);assert.equal(calls[0].method,'GET');
    assert.deepEqual(JSON.parse(calls[0].url.searchParams.get('q')),{id:{$in:['a','b']}});
    assert.equal(calls[0].url.searchParams.get('fields'),fields.join(','));
    assert.deepEqual(calls[1].body,{query:{id:'daily',user_id:'synthetic-owner'},data:{$unset:{message_tr_snapshot:''}}});
    return {id:'SDK02',status:'PASS',scope:'INSTALLED_SDK_LOOPBACK_ONLY',projection:true,idBatch:true,unsetEnvelope:true,hostedCleanupVerified:false};
  } finally {await new Promise(ok=>server.close(ok));}
}

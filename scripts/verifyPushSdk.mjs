import assert from 'node:assert/strict';
import { createServer } from 'node:http';
import { createClient } from '@base44/sdk';
import { base44PushProvider } from '../base44/shared/base44PushProvider.js';

export async function verifyPushSdk() {
  // Entire SDK transport terminates at loopback. Fixture credentials are not real.
  const calls=[];let body={status:'sent',successful_channels:['opaque'],failed_channels:[]};
  const server=createServer(async(req,res)=>{
    let text='';for await(const chunk of req)text+=chunk;
    calls.push({path:req.url,method:req.method,input:JSON.parse(text),serviceRole:req.headers.authorization==='Bearer synthetic-service'});
    res.writeHead(200,{'Content-Type':'application/json'});res.end(JSON.stringify(body));
  });
  await new Promise((resolve,reject)=>{server.once('error',reject);server.listen(0,'127.0.0.1',resolve);});
  try {
    const client=createClient({serverUrl:`http://127.0.0.1:${server.address().port}`,appId:'synthetic-app',serviceToken:'synthetic-service'});
    const adapter=base44PushProvider(client);
    assert.deepEqual(await adapter.send({owner:'synthetic-owner',language:'en'}),{kind:'accepted'});
    body={data:{status:'sent',successful_channels:[],failed_channels:[]}};
    assert.deepEqual(await adapter.send({owner:'synthetic-owner',language:'en'}),{kind:'unknown'});
    assert.equal(calls.length,2);
    for(const c of calls){assert.equal(c.path,'/api/apps/synthetic-app/integration-endpoints/Core/SendPushNotification');assert.equal(c.method,'POST');assert.equal(c.serviceRole,true);assert.deepEqual(c.input,{user_id:'synthetic-owner',title:'Shinka',content:'Your daily Shinka is ready'});}
    return {id:'SDK01',status:'PASS',scope:'INSTALLED_SDK_LOOPBACK_HTTP_ONLY',integrationEnvelope:'UNWRAPPED_JSON_BODY',optionalFieldsOmitted:true,providerCalls:0};
  } finally {await new Promise(resolve=>server.close(resolve));}
}

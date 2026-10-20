import fs from 'node:fs/promises';
import {makePool,makeRuntime} from './fixture.mjs';
// Child input stays on stdin. Neither credentials nor synthetic records are logged.
let input='';for await(const part of process.stdin)input+=part;
const request=JSON.parse(input),pool=makePool(request.url);
try {
  const runtime=makeRuntime(pool,request.actor,request.identities,request.options);
  const result=await runtime.execute(request.route,request.body);
  if(request.dropResponse)await fs.writeFile(request.ack,'committed');
  else process.stdout.write(JSON.stringify({ok:true,result}));
} catch(error) {process.stdout.write(JSON.stringify({ok:false,code:error.code||error.message}));process.exitCode=1;}
finally {await pool.end();}

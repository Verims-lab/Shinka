import { handleInternalRequest } from "../../../base44/shared/internalAuthorization.js";
import { internalHealthOperation } from "../../../base44/shared/internalHealthOperations.js";
// Shared synthetic scenario; request body privileges never become server authority.
export async function guardScenarios() {
  const statuses=[]; let calls=0;
  for(const principal of [null,{id:"user-fixture",role:"user"},{id:"admin-fixture",role:"admin"}]) {
    const response=await handleInternalRequest(new Request("https://example.test/internal",{method:"POST",body:JSON.stringify({action:"list",role:"admin",isAdmin:true})}),
      ()=>({auth:{me:async()=>principal},asServiceRole:{entities:{InternalHealthRun:{list:async()=>{calls++;return [];}}}}}),internalHealthOperation);
    statuses.push(response.status);
  }
  return {ok:statuses.join() === "401,403,200"&&calls===1,statuses,operationCalls:calls};
}

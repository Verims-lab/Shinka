// CLI/browser harness only: importing the complete regression catalog must not
// be a side effect of an in-app Health helper. The stable CL10 ID is retained.
const assert=(ok)=>{if(!ok)throw new Error('Cancelled run produced results');};
/** @type {import('./testTypes').FoundationTest[]} */
export const LOCAL_RUNNER_TESTS=[
 ['CL10','Cancelled Foundation run starts no tests and cannot append stale results',async()=>{
  const {runFoundationTests}=await import('./foundationTests');
  const controller=new AbortController();controller.abort();assert((await runFoundationTests({signal:controller.signal})).length===0);
 }],
];

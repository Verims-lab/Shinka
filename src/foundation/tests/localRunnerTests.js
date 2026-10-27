import { assertUniqueTestIds } from '../testExecution';
// CLI/browser harness only: importing the complete regression catalog must not
// be a side effect of an in-app Health helper. The stable CL10 ID is retained.
const assert=(ok)=>{if(!ok)throw new Error('Cancelled run produced results');};
/** @type {import('./testTypes').FoundationTest[]} */
export const LOCAL_RUNNER_TESTS=[
 ['CL10','Canonical registry rejects duplicate IDs; cancelled run starts no tests or stale results',async()=>{
  let rejected=false;
  try{assertUniqueTestIds([['FIX01'],['FIX01']]);}catch(error){rejected=error.message==='DUPLICATE_TEST_ID';}
  assert(rejected);assertUniqueTestIds([['FIX01'],['FIX02']]);
  const {runFoundationTests}=await import('./foundationTests');
  const controller=new AbortController();controller.abort();assert((await runFoundationTests({signal:controller.signal})).length===0);
 }],
];

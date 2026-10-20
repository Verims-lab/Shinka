import {makeCase} from '../caseFactory';
import {CLASS,RUNNER} from '../constants';
import {ev,verdict} from '../evidence';
const recorded=(suite,id,title,ids)=>makeCase(suite,{runnerType:RUNNER.STATIC,classification:CLASS.STATIC})(id,title,
  'Executed real local PostgreSQL with synthetic Base44 identities; report digest must match current server/migration/tests. Never hosted proof.',async ctx=>{
    const result=(await ctx.inspection()).postgres;
    const passed=result?.fresh&&ids.every(id=>result.results.some(r=>r.id===id&&r.status==='PASS'));
    return verdict(passed,ev(CLASS.STATIC,'postgres-015/local-postgres.json + current source digest',
      {scope:result?.scope,fresh:result?.fresh,required:ids,hostedVerified:false},'matching executed local PostgreSQL tests','Local DB evidence only; provider identity is a synthetic fixture.'));
  });
export const POSTGRES_HEALTH_CASES=[
  recorded('H04','H04-016','PostgreSQL schema, manifest and identity authority',['PG01','PG02','PG03','PG04','PG10','PG19','PG23','PG24']),
  recorded('H07','H07-014','PostgreSQL onboarding rollback and consent',['PG05','PG06','PG07','PG20','PG21','PG22']),
  recorded('H09','H09-005','PostgreSQL immutable day across independent processes',['PG08','PG13','PG15']),
  recorded('H08','H08-007','PostgreSQL coherent Calendar and retry',['PG09','PG16']),
  recorded('H12','H12-032','PostgreSQL reset/delete journal and permanent fence',['PG11','PG12','PG17','PG18','PG25']),
  makeCase('H04',{runnerType:RUNNER.BACKEND,classification:CLASS.LIVE_RUNTIME})('H04-017','Connected Test PostgreSQL schema and restricted role',
    'Read-only hosted connection/schema probe. Passing does not prove concurrent writes, native deletion or recovery.',async ctx=>{
      let r;try{r=await ctx.sqlAuthority();}catch{return {status:'BLOCKED',evidence:ev(CLASS.BLOCKED_EXTERNAL,'internalHealth sqlAuthority','UNAVAILABLE','connected restricted Test schema','Hosted access/configuration pending; no fallback.')};}
      return verdict(r?.authority==='POSTGRESQL_TEST_V1'&&r.environment==='TEST'&&r.version===1&&r.runtimeRoleRestricted&&r.adminBootstrapped&&r.tables===22&&r.rlsTables===22&&r.constraints?.u>0&&r.constraints?.f>0,
        ev(CLASS.LIVE_RUNTIME,'internalHealth sqlAuthority',r,'22 RLS tables, native FK/unique constraints, restricted role, explicit admin bootstrap','Read-only evidence; separate hosted mutation acceptance required.'));
    }),
];

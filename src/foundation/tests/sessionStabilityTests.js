import { classifySessionFailure } from "@/foundation/authErrors";
import { createSessionCoalescer } from "@/lib/sessionCheck";
import { nativePrerequisite } from "@/foundation/health/nativeReadinessContract";
import { createHealthContext } from '@/foundation/health/context';
const check = (ok, msg = "assertion failed") => { if (!ok) throw new Error(msg); };
const http = status => Object.assign(new Error("x"), { status });
const NAMES = ["AdminTestOperation", "UserCalendarAction", "InternalHealthRun", "UserPrivacyRequest", "PrivacyRecoveryReceipt"];
const STRATEGY = { authority: "BASE44_NATIVE_V1", strategyVersion: "native-continuation/2", daily: "IMMUTABLE_CANDIDATES", calendar: "OBSERVATIONS_AND_RECEIPTS", reset: "VERIFIED_STEPS", deletion: "TARGET_LIFECYCLE_RESUMABLE" };
const readable = name => ({ name, readable: true, sampledRows: 1 });
const unreadable = (name, code, httpStatus) => ({ name, readable: false, diagnostic: { code, httpStatus } });
const ctx = value => ({ nativeReadiness: async () => value });
/** @type {import('./testTypes').FoundationTest[]} */
export const SESSION_STABILITY_TESTS = [
  ["SS01", "Session refresh: 429/503/timeout/network stay UNVERIFIED; 401/deleted/invalid payload are INVALID", async () => {
    for (const e of [http(429), http(503), http(500), { code: "ECONNABORTED" }, { code: "ERR_NETWORK" }, new Error("TIMEOUT"), { response: { status: 503, data: { error_code: "SESSION_UNAVAILABLE" } } }]) check(classifySessionFailure(e) === "UNVERIFIED", JSON.stringify(e));
    for (const e of [http(401), { response: { status: 403, data: { error_code: "ACCOUNT_DELETION_IN_PROGRESS" } } }, new Error("APPLICATION_SESSION_UNVERIFIED"), { response: { status: 401, data: { error_code: "AUTH_REQUIRED" } } }]) check(classifySessionFailure(e) === "INVALID", JSON.stringify(e));
  }],
  ["SS02", "Concurrent focus/visibility/timer/route checks coalesce; passive checks throttle after success", async () => {
    let runs = 0, release; const gate = new Promise(r => { release = r; });
    let time = 0; const c = createSessionCoalescer(async () => { runs++; await gate; return true; }, { minPassiveGapMs: 15000, now: () => time });
    const all = Promise.all([c.check(), c.passive(), c.passive(), c.check()]); release(); await all;
    check(runs === 1, `runs ${runs}`);
    time = 5000; await c.passive(); check(runs === 1, "passive within gap skipped");
    await c.check(); check(runs === 2, "explicit check always runs");
    time = 30000; await c.passive(); check(runs === 3, "passive after gap runs");
  }],
  ["SS04", "Health native prerequisite: 429 is BLOCKED, proven mismatch is FAIL, PASS only with every schema read", async () => {
    const limited = { ...STRATEGY, schemas: NAMES.map(n => ["UserPrivacyRequest", "PrivacyRecoveryReceipt"].includes(n) ? unreadable(n, "RATE_LIMITED", 429) : readable(n)) };
    check((await nativePrerequisite(ctx(limited), "daily")).status === "BLOCKED", "429 blocked");
    check((await nativePrerequisite(ctx({ ...limited, deletion: "OTHER" }), "daily")).status === "FAIL", "mismatch with 429 still fails");
    check((await nativePrerequisite(ctx({ ...STRATEGY, schemas: NAMES.map(n => n === "UserPrivacyRequest" ? unreadable(n, "NOT_FOUND", 404) : readable(n)) }), "daily")).status === "FAIL", "not found fails");
    check((await nativePrerequisite(ctx({ ...STRATEGY, schemas: NAMES.map(readable) }), "daily")).status === "PASS", "all readable passes");
    check((await nativePrerequisite(ctx({...STRATEGY,schemas:NAMES.map(n=>n==='UserPrivacyRequest'?unreadable(n,'TIMEOUT',504):readable(n))}), 'daily')).status==='BLOCKED','timeout blocked');
    const changes=[
      v=>{v.authority='OTHER';},v=>{v.strategyVersion='old';},
      ...['daily','calendar','reset','deletion'].map(key=>v=>{v[key]='OTHER';}),
      v=>{v.schemas.pop();},v=>{v.schemas[1]={...v.schemas[0]};},v=>{v.schemas[1].name='Foreign';},
      v=>{v.schemas[1]=null;},v=>{v.schemas[1].readable='true';},v=>{delete v.schemas[1].sampledRows;},
      v=>{v.schemas[1].sampledRows=-1;},v=>{v.schemas[1].sampledRows=2;},v=>{v.schemas[1].sampledRows='1';},
    ];
    for(const with429 of [false,true]) for(const change of changes) {
      const v={...STRATEGY,schemas:NAMES.map(readable)};if(with429)v.schemas[4]=unreadable(NAMES[4],'RATE_LIMITED',429);change(v);
      check((await nativePrerequisite(ctx(v),'daily')).status==='FAIL','malformed/mismatch concealed by transient');
    }
    check((await nativePrerequisite(ctx(limited),'unknown-feature')).status==='FAIL','wrong feature');
    check((await nativePrerequisite({nativeReadiness:async()=>{throw http(429);}},'unknown-feature')).status==='FAIL','wrong feature hidden by thrown 429');
  }],
  ['SS10','Four actual readiness Health cases share one read per run and enforce transient versus mismatch verdicts',async()=>{
    const {HEALTH_CASES}=await import('../health/catalog');
    const cases=['H04-019','H08-005','H09-004','H12-031'].map(id=>HEALTH_CASES.find(c=>c.id===id));let reads=0;
    for(const expected of ['PASS','BLOCKED','FAIL']){
      const value={...STRATEGY,schemas:NAMES.map(readable)};
      if(expected!=='PASS')value.schemas[4]=unreadable(NAMES[4],'RATE_LIMITED',429);
      if(expected==='FAIL')value.daily='WRONG';
      const loaders={nativeReadiness:async()=>{reads++;return value;},contentLibrary:async()=>({ready:true}),moonReadiness:async()=>({ready:true})};
      const first=createHealthContext(loaders),before=reads;
      for(const c of cases)check((await c.run(first)).status===expected,`${c.id} ${expected}`);
      check(reads===before+1,'per-run source repeated');
      await cases[0].run(createHealthContext(loaders));check(reads===before+2,'cross-run cached result');
    }
  }],
];

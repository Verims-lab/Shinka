import assert from 'node:assert/strict';
import fs from 'node:fs/promises';
import path from 'node:path';
import {spawn} from 'node:child_process';
import {createLocalCluster} from '../localCluster.mjs';
import {sqlSourceDigest} from '../evidence.mjs';
import {migrate,grantRuntimeRole} from '../migrate.mjs';
import {prepareReferenceData} from '../referenceData.mjs';
import {bootstrapAdmin} from '../bootstrapAdmin.mjs';
import {createSqlStore} from '../../../base44/shared/postgres/store.js';
import {handleSqlRequest} from '../../../base44/shared/postgres/http.js';
import {verifySqlEntries} from './entryBoundary.mjs';
import {postgresOptions,createPoolScope} from '../../../base44/shared/postgres/connection.js';
import {APP,IDS,NOW,makePool,makeRuntime,nativeClient,ready,cycleBody,actionId,execution} from './fixture.mjs';
const results=[],cluster=await createLocalCluster(),root=makePool(cluster.url),pools=[];
const identities=path.join(cluster.directory,'native-identity-fixture.json');
await fs.writeFile(identities,JSON.stringify(IDS),{mode:0o600});
let runtimeUrl,reference;
const test=async(name,work)=>{const start=Date.now();try{await work();results.push({name,status:'PASS',ms:Date.now()-start});console.log(`PASS ${name}`);}catch(error){results.push({name,status:'FAIL',code:error.code||error.message});console.error(`FAIL ${name}: ${error.code||error.message}`);throw error;}};
const expectCode=(work,code)=>assert.rejects(work,error=>{assert.equal(error.code||error.message,code);return true;});
const pool=()=>{const p=makePool(runtimeUrl);pools.push(p);return p;};
const runtime=(id,options)=>makeRuntime(pool(),`synthetic-${id}`,identities,options);
const rows=async(entity,owner)=>root`SELECT * FROM ${root(`shinka_private.${entity}`)} WHERE app_id=${APP} AND user_id=${`synthetic-${owner}`}`;
const child=async(actor,route,body,extra={})=>{
 const proc=spawn(process.execPath,[new URL('./worker.mjs',import.meta.url).pathname],{stdio:['pipe','pipe','pipe']});let output='';proc.stdout.on('data',b=>output+=b);
 let diagnostic='';proc.stderr.on('data',b=>diagnostic+=b);proc.stdin.end(JSON.stringify({url:runtimeUrl,actor:`synthetic-${actor}`,identities,route,body,...extra}));
 const exit=await new Promise(resolve=>proc.on('exit',resolve));if(extra.dropResponse){assert.equal(exit,0);return null;}
 const value=JSON.parse(output||'{}');if(!value.ok)throw Object.assign(new Error(value.code||'CHILD_FAILED'),{code:value.code,diagnostic});return value.result;
};
try {
 await test('PG01 migration checksum and restricted runtime role',async()=>{
  await root`CREATE ROLE anon NOLOGIN`;await root`CREATE ROLE authenticated NOLOGIN`;
  await root`ALTER DEFAULT PRIVILEGES GRANT SELECT ON TABLES TO anon,authenticated`;
  assert.equal((await migrate(root)).applied,true);assert.equal((await migrate(root)).applied,false);await grantRuntimeRole(root);
  await root`CREATE ROLE shinka_test_login LOGIN IN ROLE shinka_runtime NOBYPASSRLS`;
  runtimeUrl=cluster.url.replace('shinka_test_bootstrap@','shinka_test_login@');
  await root`INSERT INTO shinka_private.application(app_id,environment) VALUES(${APP},'TEST'),('other-synthetic-app','TEST')`;
  assert.equal((await root`SELECT has_schema_privilege('anon','shinka_private','USAGE') AS allowed`)[0].allowed,false);
  assert.equal((await root`SELECT has_table_privilege('authenticated','shinka_private.user_profile','SELECT') AS allowed`)[0].allowed,false);
  const p=pool();assert.equal((await p`SELECT * FROM shinka_private.application`).length,0);
  const [role]=await p`SELECT rolbypassrls,rolsuper FROM pg_roles WHERE rolname=current_user`;assert.equal(role.rolbypassrls,false);assert.equal(role.rolsuper,false);
  await assert.rejects(()=>p`UPDATE shinka_private.application SET environment='PRODUCTION'`,e=>e.code==='42501');
 });
 await test('PG02 manifest 6/240/260 and Moon import is identical on retry',async()=>{
  reference=await prepareReferenceData(root,APP,new Date(NOW));assert.equal(reference.categories,6);assert.equal(reference.mappings,240);assert.equal(reference.pairs,260);
  assert.deepEqual(await prepareReferenceData(root,APP,new Date(NOW)),reference);
 });
 await test('PG03 verified one-shot admin bootstrap; native admin does not confer SQL admin',async()=>{
  const plain=runtime('plain');assert.equal((await plain.execute('applicationSession',{})).role,'user');
  await expectCode(()=>plain.execute('internalHealth',{action:'contentCounts'}),'FORBIDDEN_INTERNAL_TOOLING');
  await expectCode(()=>bootstrapAdmin(root,nativeClient('synthetic-admin',identities),{appId:APP,confirmedUserId:'synthetic-plain',allowedPrincipals:IDS}),'BOOTSTRAP_IDENTITY_UNCONFIRMED');
  await ready(runtime('admin'));
  await bootstrapAdmin(root,nativeClient('synthetic-admin',identities),{appId:APP,confirmedUserId:'synthetic-admin',allowedPrincipals:IDS});
  await expectCode(()=>bootstrapAdmin(root,nativeClient('synthetic-admin',identities),{appId:APP,confirmedUserId:'synthetic-admin',allowedPrincipals:IDS}),'BOOTSTRAP_ALREADY_CLOSED');
  assert.equal((await runtime('admin',{nativeRole:'user'}).execute('applicationSession',{})).role,'admin');
 });
 await test('PG04 tenant RLS, forged owner, inactive and test scope fail closed',async()=>{
  await expectCode(()=>makeRuntime(root,'synthetic-plain',identities).execute('applicationSession',{}),'SQL_RUNTIME_ROLE_UNSAFE');
  const p=pool();await p.begin(async sql=>{await sql`SELECT set_config('shinka.app_id',${APP},true)`;assert.equal((await sql`SELECT * FROM shinka_private.application`).length,1);
   });
  await assert.rejects(()=>p.begin(async sql=>{await sql`SELECT set_config('shinka.app_id',${APP},true)`;await sql`INSERT INTO shinka_private.owner(app_id,user_id) VALUES('other-synthetic-app','synthetic-injected')`;}),e=>e.code==='42501');
  const r=runtime('inactive');await ready(r);await root`UPDATE shinka_private.user_profile SET account_status='INACTIVE' WHERE user_id='synthetic-inactive'`;
  await expectCode(()=>r.execute('dailyMessage',{action:'today'}),'ACTIVE_ACCOUNT_REQUIRED');
  await expectCode(()=>runtime('plain').execute('onboarding',{action:'hydrate',user_id:'synthetic-admin'}),'FORGED_OWNER');
  await expectCode(()=>runtime('plain',{allowedPrincipals:['synthetic-admin']}).execute('applicationSession',{}),'SQL_TEST_PRINCIPAL_REQUIRED');
 });
 await test('PG05 onboarding concurrent retries persist one grant/time/event/period and null optionals',async()=>{
  await ready(runtime('onboarding'));const body=cycleBody();
  const out=await Promise.all(Array.from({length:6},()=>runtime('onboarding').execute('onboarding',body)));
  assert.ok(out.every(x=>x.persisted));const consent=(await rows('user_health_consent','onboarding'))[0];assert.equal(consent.granted_at,NOW);
  for(const name of ['user_health_consent','user_health_consent_event','user_period_record'])assert.equal((await rows(name,'onboarding')).length,1);
  assert.equal((await rows('user_cycle_settings','onboarding')).length,0);
  await child('onboarding','onboarding',body);assert.equal((await rows('user_health_consent','onboarding'))[0].granted_at,consent.granted_at);
  await expectCode(()=>runtime('onboarding').execute('onboarding',{...body,period_start_date:'2026-09-01'}),'ACTION_CONFLICT');
 });
 await test('PG06 missing consent and skip produce no health records',async()=>{
  const no=runtime('no-consent');await ready(no);await assert.rejects(()=>no.execute('onboarding',{...cycleBody(),health_consent:false}));
  const skip=runtime('skip');await ready(skip);assert.equal((await skip.execute('onboarding',{action:'skipCycle'})).persisted,false);
  for(const owner of ['no-consent','skip'])for(const name of ['user_health_consent','user_health_consent_event','user_period_record'])assert.equal((await rows(name,owner)).length,0);
 });
 await test('PG07 consent/event/period failure rolls back together; retry recovers',async()=>{
  const r=runtime('partial');await ready(r);const body=cycleBody();
  await root`CREATE FUNCTION shinka_private.synthetic_fail_period() RETURNS trigger LANGUAGE plpgsql AS $$ BEGIN IF NEW.user_id='synthetic-partial' THEN RAISE EXCEPTION 'SYNTHETIC_PERIOD_FAILURE'; END IF; RETURN NEW; END $$`;
  await root`CREATE TRIGGER synthetic_failure BEFORE INSERT ON shinka_private.user_period_record FOR EACH ROW EXECUTE FUNCTION shinka_private.synthetic_fail_period()`;
  await assert.rejects(()=>r.execute('onboarding',body));
  for(const name of ['user_health_consent','user_health_consent_event','user_period_record'])assert.equal((await rows(name,'partial')).length,0);
  await root`DROP TRIGGER synthetic_failure ON shinka_private.user_period_record`;
  assert.equal((await r.execute('onboarding',body)).persisted,true);
 });
 await test('PG08 Home concurrent connections and lost-response/new-process retry return one immutable day',async()=>{
  await ready(runtime('daily'));const outcomes=await Promise.all(Array.from({length:8},()=>runtime('daily').execute('dailyMessage',{action:'today'})));
  assert.equal(new Set(outcomes.map(x=>x.daily.id)).size,1);assert.equal((await rows('user_daily_message','daily')).length,1);
  const ack=path.join(cluster.directory,'lost-response-ack');await child('daily','dailyMessage',{action:'today'},{dropResponse:true,ack});assert.equal(await fs.readFile(ack,'utf8'),'committed');
  assert.equal((await child('daily','dailyMessage',{action:'today'})).daily.id,outcomes[0].daily.id);
  await assert.rejects(()=>root`UPDATE shinka_private.user_daily_message SET user_id='synthetic-plain' WHERE user_id='synthetic-daily'`);
  await assert.rejects(()=>root`DELETE FROM shinka_private.user_daily_message WHERE user_id='synthetic-daily'`);
 });
 await test('PG09 Calendar concurrent revisions, committed replay and derived recomputation',async()=>{
  const r=runtime('calendar');await ready(r);await r.execute('onboarding',cycleBody());const current=await r.execute('calendar',{action:'read'});
  const body={action:'add',date:'2026-09-01',revision:current.revision,action_id:actionId()};
  const outcome=await Promise.allSettled([r.execute('calendar',body),runtime('calendar').execute('calendar',{...body,date:'2026-08-01',action_id:actionId()})]);
  assert.equal(outcome.filter(x=>x.status==='fulfilled').length,1);assert.equal(outcome.filter(x=>x.status==='rejected')[0].reason.code,'CALENDAR_STATE_CHANGED');
  const winner=outcome[0].status==='fulfilled'?body:null;
  if(winner){const replay=await child('calendar','calendar',winner);assert.equal(replay.revision,outcome[0].value.revision);}
  const tables=await root`SELECT table_name FROM information_schema.tables WHERE table_schema='shinka_private' AND table_name IN ('user_cycle_phase_day','user_cycle_prediction')`;assert.equal(tables.length,0);
  const after=await r.execute('calendar',{action:'read'});assert.equal(after.state,'READY');assert.equal((await rows('user_period_record','calendar')).length,2);
 });
 await test('PG10 last-admin guard and immediate SQL revocation across workers',async()=>{
  const a=runtime('admin');await expectCode(()=>a.execute('applicationAdmin',{action:'revoke',target_id:'synthetic-admin',action_id:actionId()}),'TEST_LAST_ADMIN_DENIED');
  const b=runtime('admin2');await ready(b);
  const grant={action:'grant',target_id:'synthetic-admin2',action_id:actionId()};
  await a.execute('applicationAdmin',grant);assert.equal((await b.execute('applicationSession',{})).role,'admin');
  await a.execute('applicationAdmin',{action:'revoke',target_id:'synthetic-admin2',action_id:actionId()});
  await expectCode(()=>a.execute('applicationAdmin',grant),'SQL_ADMIN_STATE_CHANGED');
  assert.equal((await child('admin2','applicationSession',{})).role,'user');await expectCode(()=>b.execute('internalHealth',{action:'contentCounts'}),'FORBIDDEN_INTERNAL_TOOLING');
 });
 await test('PG11 reset admission concurrent retry, blocked calendar and atomic progress receipts',async()=>{
  const r=runtime('reset'),a=runtime('admin');await ready(r);await r.execute('onboarding',cycleBody());const daily=await r.execute('dailyMessage',{action:'today'});
  const request=await execution(a,'synthetic-reset','RESET_ONBOARDING');const jobs=await Promise.all([a.execute('adminTestTools',request),runtime('admin').execute('adminTestTools',request)]);
  assert.equal(jobs[0].job.id,jobs[1].job.id);await expectCode(()=>r.execute('calendar',{action:'read'}),'ONBOARDING_RESTART_REQUIRED');
  const profile={action:'saveProfile',birth_date:'1990-03-21',action_id:actionId()};assert.equal((await r.execute('onboarding',profile)).state,'AUTHENTICATED_CYCLE_STEP');
  assert.equal((await child('reset','onboarding',profile)).state,'AUTHENTICATED_CYCLE_STEP');
  await child('reset','onboarding',{action:'skipCycle'});const finished=await child('reset','dailyMessage',{action:'today'});
  assert.equal(finished.daily.id,daily.daily.id);assert.equal(finished.state,'ACTIVE_EXISTING_USER');
  assert.equal((await a.execute('adminTestTools',{action:'status',target_id:'synthetic-reset',operation_id:request.request_id})).job.status,'COMPLETED');
 });
 await test('PG12 delete commits fence, checkpoints partial work, survives native lost response and new worker',async()=>{
  const r=runtime('delete');await ready(r);await r.execute('onboarding',cycleBody());await r.execute('dailyMessage',{action:'today'});
  const a=runtime('admin',{loseNativeDeleteResponse:true}),request=await execution(a,'synthetic-delete','DELETE_USER');
  await expectCode(()=>a.execute('adminTestTools',request),'TEST_JOB_RETRY_REQUIRED');
  const job=(await runtime('admin').execute('adminTestTools',{action:'status',target_id:'synthetic-delete',operation_id:request.request_id})).job;
  assert.equal(job.status,'RETRY_REQUIRED');assert.ok(job.checkpoints.includes('user_profile'));assert.ok(!job.checkpoints.includes('USER'));
  await expectCode(()=>r.execute('dailyMessage',{action:'today'}),'AUTH_REQUIRED');
  const resumed=await child('admin','adminTestTools',{action:'resume',target_id:'synthetic-delete',operation_id:request.request_id});assert.equal(resumed.job.status,'COMPLETED');
  assert.equal((await rows('user_daily_message','delete')).length,1);assert.equal((await rows('user_health_consent_event','delete')).length,1);assert.equal((await rows('user_period_record','delete')).length,0);
  const again=await child('admin','adminTestTools',{action:'resume',target_id:'synthetic-delete',operation_id:request.request_id});assert.deepEqual(again.job,resumed.job);
 });
 await test('PG15 independent OS processes contend for first Home creation',async()=>{
  await ready(runtime('daily-process'));
  const out=await Promise.all(Array.from({length:4},()=>child('daily-process','dailyMessage',{action:'today'})));
  assert.equal(new Set(out.map(x=>x.daily.id)).size,1);assert.equal((await rows('user_daily_message','daily-process')).length,1);
 });
 await test('PG16 Calendar rollback, lost response, edit/delete and unchanged Home',async()=>{
  const r=runtime('rollback-calendar');await ready(r);await r.execute('onboarding',cycleBody());
  const home=await r.execute('dailyMessage',{action:'today'}),before=await r.execute('calendar',{action:'read'});
  const body={action:'add',date:'2026-07-01',revision:before.revision,action_id:actionId()};
  await root`CREATE FUNCTION shinka_private.synthetic_fail_receipt() RETURNS trigger LANGUAGE plpgsql AS $$ BEGIN IF NEW.user_id='synthetic-rollback-calendar' AND NEW.operation='calendar' THEN RAISE EXCEPTION 'SYNTHETIC_RECEIPT_FAILURE'; END IF; RETURN NEW; END $$`;
  await root`CREATE TRIGGER synthetic_failure BEFORE INSERT ON shinka_private.request_receipt FOR EACH ROW EXECUTE FUNCTION shinka_private.synthetic_fail_receipt()`;
  await assert.rejects(()=>r.execute('calendar',body));assert.equal((await r.execute('calendar',{action:'read'})).revision,before.revision);
  assert.equal((await rows('user_period_record','rollback-calendar')).length,1);
  await root`DROP TRIGGER synthetic_failure ON shinka_private.request_receipt`;
  const ack=path.join(cluster.directory,'calendar-lost-response');await child('rollback-calendar','calendar',body,{dropResponse:true,ack});
  const replay=await child('rollback-calendar','calendar',body);assert.equal(replay.calculationNotice,'CYCLE_ESTIMATE_UNAVAILABLE');
  let periods=await rows('user_period_record','rollback-calendar');const old=periods.find(p=>p.period_start_date==='2026-07-01');
  const edited=await r.execute('calendar',{action:'edit',period_id:old.id,date:'2026-09-01',revision:replay.revision,action_id:actionId()});
  assert.equal((await rows('user_period_record','rollback-calendar')).find(x=>x.id===old.id).period_start_date,'2026-09-01');
  let revision=edited.revision;periods=await rows('user_period_record','rollback-calendar');
  for(const period of periods)revision=(await r.execute('calendar',{action:'delete',period_id:period.id,revision,action_id:actionId()})).revision;
  assert.equal((await r.execute('calendar',{action:'read'})).hasPeriods,false);
  assert.equal((await r.execute('dailyMessage',{action:'today'})).daily.id,home.daily.id);
 });
 await test('PG17 reset step failure rolls back profile/progress; concurrent changed input conflicts',async()=>{
  const r=runtime('reset-failure'),a=runtime('admin');await ready(r);await r.execute('dailyMessage',{action:'today'});
  const request=await execution(a,'synthetic-reset-failure','RESET_ONBOARDING');await a.execute('adminTestTools',request);
  await root`CREATE FUNCTION shinka_private.synthetic_fail_progress() RETURNS trigger LANGUAGE plpgsql AS $$ BEGIN IF NEW.target_id='synthetic-reset-failure' AND NEW.stage='CYCLE' THEN RAISE EXCEPTION 'SYNTHETIC_PROGRESS_FAILURE'; END IF; RETURN NEW; END $$`;
  await root`CREATE TRIGGER synthetic_failure BEFORE UPDATE ON shinka_private.test_operation FOR EACH ROW EXECUTE FUNCTION shinka_private.synthetic_fail_progress()`;
  const body={action:'saveProfile',birth_date:'1991-03-21',action_id:actionId()};await assert.rejects(()=>r.execute('onboarding',body));
  assert.equal((await rows('user_profile','reset-failure'))[0].birth_date,'1990-03-21');
  assert.equal((await a.execute('adminTestTools',{action:'status',target_id:'synthetic-reset-failure',operation_id:request.request_id})).job.stage,'PROFILE');
  await root`DROP TRIGGER synthetic_failure ON shinka_private.test_operation`;
  const out=await Promise.allSettled([r.execute('onboarding',body),runtime('reset-failure').execute('onboarding',{...body,birth_date:'1992-03-21',action_id:actionId()})]);
  assert.equal(out.filter(x=>x.status==='fulfilled').length,1);assert.equal(out.find(x=>x.status==='rejected').reason.code,'ACTION_CONFLICT');
  await child('reset-failure','onboarding',{action:'skipCycle'});await child('reset-failure','dailyMessage',{action:'today'});
 });
 await test('PG18 failed first deletion stage keeps durable fence while native identity exists',async()=>{
  const r=runtime('delete2');await ready(r);const home=await r.execute('dailyMessage',{action:'today'});
  await root.begin(async sql=>{const store=createSqlStore(sql,APP);await store.insert('notification_delivery',{user_id:'synthetic-delete2',daily_message_id:home.daily.id,scheduled_at:NOW,delivery_status:'PENDING'});});
  const a=runtime('admin',{beforeDeleteStage:async()=>{throw new Error('SYNTHETIC_INTERRUPTION');}}),request=await execution(a,'synthetic-delete2','DELETE_USER');
  await expectCode(()=>a.execute('adminTestTools',request),'TEST_JOB_RETRY_REQUIRED');
  assert.ok(JSON.parse(await fs.readFile(identities,'utf8')).includes('synthetic-delete2'));
  for(const [route,body] of [['applicationSession',{}],['onboarding',{action:'hydrate'}],['calendar',{action:'read'}],['dailyMessage',{action:'today'}],['domainAccess',{action:'read',entity:'user_profile'}]])await expectCode(()=>r.execute(route,body),'ACCOUNT_DELETION_IN_PROGRESS');
  const done=await child('admin','adminTestTools',{action:'resume',target_id:'synthetic-delete2',operation_id:request.request_id});assert.equal(done.job.status,'COMPLETED');
  assert.equal((await rows('notification_delivery','delete2'))[0].delivery_status,'SKIPPED');
 });
 await test('PG19 physical FK/unique/spacing constraints reject conflicting direct SQL',async()=>{
  await ready(runtime('spacing'));
  await root.begin(async sql=>{await createSqlStore(sql,APP).insert('user_period_record',{user_id:'synthetic-spacing',period_start_date:'2026-01-01'});});
  await assert.rejects(()=>root.begin(sql=>createSqlStore(sql,APP).insert('user_period_record',{user_id:'synthetic-spacing',period_start_date:'2026-01-15'})));
  await root.begin(sql=>createSqlStore(sql,APP).insert('user_period_record',{user_id:'synthetic-spacing',period_start_date:'2026-01-16'}));
  await assert.rejects(()=>root.begin(sql=>createSqlStore(sql,APP).insert('user_period_record',{user_id:'synthetic-spacing',period_start_date:'2026-01-16'})));
  await assert.rejects(()=>root.begin(sql=>createSqlStore(sql,APP).insert('user_period_record',{user_id:'synthetic-nonexistent',period_start_date:'2026-01-01'})),e=>e.code==='23503');
  const period=(await rows('user_period_record','spacing'))[0];
  assert.equal((await runtime('onboarding').execute('domainAccess',{action:'read',entity:'user_period_record',recordId:period.id})).records.length,0);
 });
 await test('PG20 withdrawn consent/open health job block retries and audited admin health read',async()=>{
  const withdrawn=runtime('withdrawn');await ready(withdrawn);const body=cycleBody();await withdrawn.execute('onboarding',body);
  await root`UPDATE shinka_private.user_health_consent SET consent_status='WITHDRAWN',withdrawn_at=${NOW} WHERE user_id='synthetic-withdrawn'`;
  await expectCode(()=>withdrawn.execute('onboarding',body),'CONSENT_STATE_CHANGED');
  await assert.rejects(()=>withdrawn.execute('calendar',{action:'add',date:'2026-09-01',revision:( '0'.repeat(64)),action_id:actionId()}));
  const period=(await rows('user_period_record','withdrawn'))[0];
  await expectCode(()=>runtime('admin').execute('domainAccess',{action:'adminRead',entity:'user_period_record',recordId:period.id}),'HEALTH_CONSENT_REQUIRED');
  const r=runtime('open-job');await ready(r);
  await root.begin(async sql=>{const store=createSqlStore(sql,APP),event=await store.insert('data_protection_event',{user_id:'synthetic-open-job',event_type:'HEALTH_DATA_DELETION',event_status:'PENDING',requested_at:NOW});
   await store.insert('health_data_deletion_job',{user_id:'synthetic-open-job',protection_event_id:event.id,job_status:'PENDING',requested_at:NOW});});
  await assert.rejects(()=>r.execute('onboarding',cycleBody()));assert.equal((await rows('user_health_consent','open-job')).length,0);
 });
 await test('PG21 worker killed during actual saveCycle transaction leaves no partial grant',async()=>{
  await ready(runtime('crash'));const body=cycleBody();
  await root`CREATE FUNCTION shinka_private.synthetic_pause_period() RETURNS trigger LANGUAGE plpgsql AS $$ BEGIN IF NEW.user_id='synthetic-crash' THEN PERFORM pg_sleep(20); END IF; RETURN NEW; END $$`;
  await root`CREATE TRIGGER synthetic_pause BEFORE INSERT ON shinka_private.user_period_record FOR EACH ROW EXECUTE FUNCTION shinka_private.synthetic_pause_period()`;
  const proc=spawn(process.execPath,[new URL('./worker.mjs',import.meta.url).pathname],{stdio:['pipe','ignore','ignore']});
  const exited=new Promise(resolve=>proc.on('exit',resolve));proc.stdin.end(JSON.stringify({url:runtimeUrl,actor:'synthetic-crash',identities,route:'onboarding',body}));
  let backend;const deadline=Date.now()+10000;
  while(Date.now()<deadline){[backend]=await root`SELECT pid FROM pg_stat_activity WHERE wait_event='PgSleep' AND query LIKE '%user_period_record%'`;if(backend)break;await new Promise(resolve=>setTimeout(resolve,30));}
  assert.ok(backend,'worker reached write after consent/event');proc.kill('SIGKILL');await exited;await root`SELECT pg_terminate_backend(${backend.pid})`;
  await root`DROP TRIGGER synthetic_pause ON shinka_private.user_period_record`;
  for(const name of ['user_health_consent','user_health_consent_event','user_period_record'])assert.equal((await rows(name,'crash')).length,0);
  assert.equal((await child('crash','onboarding',body)).persisted,true);
 });
 await test('PG22 UTC/offset business time survives retry; naive/missing/invalid time rejected',async()=>{
  const r=runtime('timestamps');await ready(r);
  const valid={user_id:'synthetic-timestamps',consent_status:'GRANTED',consent_version:'health-consent-v1.0',granted_at:'2026-10-19T15:00:00+03:00',withdrawn_at:null};
  for(const granted_at of ['2026-10-19T15:00:00','not-a-time',null])await assert.rejects(()=>root.begin(sql=>createSqlStore(sql,APP).insert('user_health_consent',{...valid,granted_at})));
  await root`INSERT INTO shinka_private.user_health_consent(app_id,id,user_id,consent_status,consent_version,granted_at)
    VALUES(${APP},${crypto.randomUUID()},${valid.user_id},'GRANTED',${valid.consent_version},${valid.granted_at})`;
  const old=(await rows('user_health_consent','timestamps'))[0];assert.equal(old.granted_at,'2026-10-19T12:00:00.000Z');
  await r.execute('onboarding',cycleBody());assert.equal((await rows('user_health_consent','timestamps'))[0].granted_at,old.granted_at);
  assert.equal((await rows('user_health_consent_event','timestamps'))[0].occurred_at,old.granted_at);
 });
 await test('PG23 actual function entries/config use SQL authority and close pools; no legacy fallback',async()=>{
  await verifySqlEntries(runtimeUrl,identities);
  const status=await runtime('admin').execute('internalHealth',{action:'sqlAuthority'});assert.equal(status.tables,22);assert.equal(status.rlsTables,22);assert.equal(status.runtimeRoleRestricted,true);
  let made=0,closed=0;const acquire=createPoolScope(()=>{made++;return {end:async()=>{closed++;}};});
  const a=acquire('first',{ssl:true}),b=acquire('first',{ssl:true});assert.equal(made,1);assert.throws(()=>acquire('rotated',{ssl:true}));
  await a.close();assert.equal(closed,0);await b.close();assert.equal(closed,1);await acquire('rotated',{ssl:true}).close();assert.equal(closed,2);
 });
 await test('PG24 concurrent roster revocations preserve one ACTIVE admin; lost grant response replays once',async()=>{
  const grant={action:'grant',target_id:'synthetic-admin2',action_id:actionId()},ack=path.join(cluster.directory,'grant-lost-response');
  await child('admin','applicationAdmin',grant,{dropResponse:true,ack});assert.equal(await fs.readFile(ack,'utf8'),'committed');
  await child('admin','applicationAdmin',grant);
  const out=await Promise.allSettled([
    runtime('admin').execute('applicationAdmin',{action:'revoke',target_id:'synthetic-admin2',action_id:actionId()}),
    runtime('admin2').execute('applicationAdmin',{action:'revoke',target_id:'synthetic-admin',action_id:actionId()}),
  ]);
  assert.equal(out.filter(x=>x.status==='fulfilled').length,1);
  const admins=await root`SELECT user_id FROM shinka_private.owner WHERE app_id=${APP} AND is_admin AND deletion_fenced_at IS NULL`;
  assert.equal(admins.length,1);
  if(admins[0].user_id==='synthetic-admin2') {
    await runtime('admin2').execute('applicationAdmin',{action:'grant',target_id:'synthetic-admin',action_id:actionId()});
    await runtime('admin').execute('applicationAdmin',{action:'revoke',target_id:'synthetic-admin2',action_id:actionId()});
  }
 });
 await test('PG25 missing start audit rolls back deletion admission, fence and role changes',async()=>{
  await ready(runtime('delete3'));const a=runtime('admin'),request=await execution(a,'synthetic-delete3','DELETE_USER');
  await root`CREATE FUNCTION shinka_private.synthetic_fail_start_audit() RETURNS trigger LANGUAGE plpgsql AS $$ BEGIN IF NEW.target_user_id='synthetic-delete3' THEN RAISE EXCEPTION 'SYNTHETIC_AUDIT_FAILURE'; END IF; RETURN NEW; END $$`;
  await root`CREATE TRIGGER synthetic_failure BEFORE INSERT ON shinka_private.admin_audit_log FOR EACH ROW EXECUTE FUNCTION shinka_private.synthetic_fail_start_audit()`;
  await assert.rejects(()=>a.execute('adminTestTools',request));
  assert.equal((await root`SELECT deletion_fenced_at FROM shinka_private.owner WHERE app_id=${APP} AND user_id='synthetic-delete3'`)[0].deletion_fenced_at,null);
  assert.equal((await root`SELECT id FROM shinka_private.test_operation WHERE app_id=${APP} AND target_id='synthetic-delete3'`).length,0);
  assert.equal((await runtime('delete3').execute('applicationSession',{})).role,'user');
  await root`DROP TRIGGER synthetic_failure ON shinka_private.admin_audit_log`;
  assert.equal((await a.execute('adminTestTools',request)).job.status,'COMPLETED');
 });
 await test('PG13 crash recovery preserves committed records and receipts',async()=>{
  const daily=(await rows('user_daily_message','daily'))[0];
  for(const p of pools)await p.end();pools.length=0;await root.end();cluster.restart();
  const result=await child('daily','dailyMessage',{action:'today'});assert.equal(result.daily.id,daily.id);
 });
 await test('PG14 HTTP hides SQL diagnostics and hosted TLS cannot be weakened',async()=>{
  const req=new Request('https://synthetic.invalid',{method:'POST',body:'{}'});
  const response=await handleSqlRequest(req,'onboarding',async()=>{throw new Error('password=synthetic private SQL statement');});
  assert.equal(response.status,503);assert.deepEqual(await response.json(),{error_code:'SQL_OPERATION_FAILED',field:null});
  assert.throws(()=>postgresOptions('postgresql://u:p@db.example.invalid/db?sslmode=no-verify'));assert.equal(postgresOptions('postgresql://u:p@db.example.invalid/db').ssl.rejectUnauthorized,true);
 });
} finally {
 for(const p of pools)await p.end().catch(()=>{});await root.end().catch(()=>{});cluster.stop();
 const report={sourceDigest:sqlSourceDigest(),scope:'LOCAL_REAL_POSTGRESQL',postgres:cluster.version,identityProvider:'SYNTHETIC_BASE44_FIXTURE',hostedVerified:false,reference,
  passed:results.filter(x=>x.status==='PASS').length,failed:results.filter(x=>x.status==='FAIL').length,results};
 await fs.writeFile(process.env.SHINKA_PG_REPORT||'/private/tmp/shinka-015-postgres-tests.json',JSON.stringify(report,null,2)+'\n');
}

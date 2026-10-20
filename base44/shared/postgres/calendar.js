import { calculateCalendar } from '../calendarCalculation.js';
import { calendarRevision, validateCalendarAccess, validateCalendarHealth, verifyCalendarCommit } from '../calendarState.js';
import { resolveTimezone, serverLocalDate } from '../onboardingValidation.js';
import { DOMAIN_SCHEMAS } from '../domainSchemas.js';
import { sqlFail } from './store.js';
import { receipt } from './receipts.js';

export function createSqlCalendar(context,{now=()=>new Date()}={}) {
  const {store,actor}=context,owner=actor.user_id;
  const one=async entity=>(await store.read(entity,{user_id:owner},'id',1))[0]??null;
  const snapshot=async()=>{
    const profile=await one('user_profile'),preferences=await one('user_preferences'),consent=await one('user_health_consent');
    const jobs=await store.read('health_data_deletion_job',{user_id:owner,job_status:{$ne:'COMPLETED'}},'id',20001);
    const events=await store.read('user_health_consent_event',{user_id:owner,...(consent?.consent_status==='GRANTED'?{occurred_at:{$gte:consent.granted_at}}:{})},'occurred_at',20001);
    const periods=await store.read('user_period_record',{user_id:owner},'period_start_date',2501);
    const settings=await one('user_cycle_settings');
    const completedDeletion=(await store.read('health_data_deletion_job',{user_id:owner,job_status:'COMPLETED'},'-completed_at',1))[0]??null;
    return {profile,preferences,consent,jobs,events,periods,settings,completedDeletion,predictions:[],phases:[]};
  };
  const computed=(state,today,instant)=>{
    const c=calculateCalendar({periods:state.periods,settings:state.settings,today});
    const rows=(list,kind)=>list.map((row,i)=>({...row,id:`derived-${kind}-${i}`,user_id:owner,calculated_at:instant}));
    return {...state,predictions:rows(c.predictions,'prediction'),phases:rows(c.phases,'phase')};
  };
  const write=async(entity,before,after)=>{
    const fields=Object.keys(DOMAIN_SCHEMAS[entity].properties);
    for(const row of before)if(!after.some(next=>next.id===row.id))await store.remove(entity,row.id);
    for(const row of after) {
      const data=Object.fromEntries(fields.map(key=>[key,row[key]??null]));
      const old=before.find(saved=>saved.id===row.id);
      if(!old)await store.insert(entity,data,row.id);
      else if(fields.some(key=>(old[key]??null)!==data[key]))await store.update(entity,row.id,data);
    }
  };
  const transactCalendar=async request=>{
    if(request.owner!==owner)sqlFail('FORGED_OWNER',403);
    const first=await snapshot();
    validateCalendarAccess(first,owner);
    const replay=await receipt(context,request.actionId,'calendar',request.fingerprint,async()=>{
      if(await calendarRevision(first)!==request.revision)sqlFail('CALENDAR_STATE_CHANGED');
      const {snapshot:next,calculationDay}=request.reduce(first,()=>crypto.randomUUID());
      verifyCalendarCommit(next,owner,calculationDay);
      await write('user_health_consent',first.consent?[first.consent]:[],next.consent?[next.consent]:[]);
      await write('user_health_consent_event',first.events,next.events);
      await write('user_period_record',first.periods,next.periods);
      return {committedRevision:await calendarRevision(next),calculationDay,calculatedAt:now().toISOString()};
    });
    const current=await snapshot(),revision=await calendarRevision(current);
    if(revision!==replay.result.committedRevision)sqlFail('CALENDAR_STATE_CHANGED');
    return {...replay.result,revision,status:replay.replayed?'REPLAYED':'COMMITTED',
      snapshot:computed(current,replay.result.calculationDay,replay.result.calculatedAt)};
  };
  const projection=async(entity,query={},sort='id',limit=100,offset=0,fields=null)=>{
    if(query.user_id!==owner||Object.keys(query).some(key=>!['user_id','id'].includes(key)))sqlFail('DERIVED_OWNER_REQUIRED',400);
    const state=await snapshot();
    if(!validateCalendarAccess(state,owner))sqlFail('HEALTH_CONSENT_REQUIRED',403);
    validateCalendarHealth(state,owner);
    const instant=now(),day=serverLocalDate(instant,resolveTimezone(null,state.preferences?.timezone));
    let rows=computed(state,day,instant.toISOString())[entity==='user_cycle_phase_day'?'phases':'predictions'];
    if(query.id)rows=rows.filter(row=>row.id===query.id);
    const key=sort.replace(/^-/,'');
    rows.sort((a,b)=>String(a[key]??'').localeCompare(String(b[key]??''))*(sort.startsWith('-')?-1:1));
    return rows.slice(offset,offset+limit).map(row=>fields?Object.fromEntries(fields.map(k=>[k,row[k]??null])):row);
  };
  return {snapshot,transactCalendar,projection,
    reader:()=>({snapshot,confirmedSnapshot:snapshot})}; // Already one locked SQL snapshot.
}

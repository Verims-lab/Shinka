import { nativeFixture } from './nativeFixture';
import { dailyRecordFixture } from './dailyRecordFixture';
import { handleYouRequest } from '../../../base44/shared/youOperation.js';
import { youRequest } from '@/services/youService';
export function youFixture() {
  const f = nativeFixture();
  f.tables.UserDailyMessage.push({...dailyRecordFixture(),message_pair_id:f.tables.MessagePair[0].id,category_id:f.tables.MessagePair[0].category_id,shinka_date:'2026-10-20'});
  f.tables.UserPeriodRecord.push({id:'period',user_id:'ownerA',period_start_date:'2026-10-01'});
  const place = {birthplace_geonames_id:123,birthplace_name:'Synthetic Settlement',birthplace_country_code:'TR',birthplace_latitude:40,birthplace_longitude:29};
  let resolves=0;
  const geoNames = {resolve:async id=>{resolves++;if(id!==123)throw Object.assign(new Error(),{code:'fixture-place'});return place;}};
  const http = (body,owner='ownerA',options={}) => handleYouRequest(new Request('https://fixture.invalid/you',{method:'POST',body:JSON.stringify(body),...options}),()=>f.client(owner),{now:f.now,geoNames});
  const request = (action,payload={}) => youRequest(action,payload,{functions:{invoke:async(_name,body)=>({data:await(await http(body)).json()})}});
  return {...f,http,request,place,get resolves(){return resolves;}};
}
export function profileIntent(view,patch={}) {
  const p=view.profile;
  return {display_name:p.display_name,birth_date:p.birth_date,birth_time:p.birth_time,birthplace_geonames_id:p.birthplace_geonames_id,revision:p.revision,...patch};
}
export const preferencesIntent = (view,patch={}) => ({language_code:view.preferences.language_code,notifications_enabled:view.preferences.notifications_enabled,timezone:view.preferences.timezone,revision:view.preferences.revision,...patch});

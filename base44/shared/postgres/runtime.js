import { onboardingOperation } from '../onboardingOperations.js';
import { dailyMessageOperation } from '../dailyMessageOperation.js';
import { calendarOperation } from '../calendarOperation.js';
import {sqlDomainExecute} from './domain.js';
import { internalHealthOperation } from '../internalHealthOperations.js';
import { contentLibraryOperation } from '../contentLibraryOperation.js';
import { requireInternalAdmin } from '../internalAuthorization.js';
import { inspectContentLibrary } from '../base44ContentLibrary.js';
import { FIRST_CONTENT_SOURCE } from '../firstContentSource.js';
import { CONTENT_CATEGORY_DECISION } from '../contentCategoryDecision.js';
import { createSqlClient, verifyBase44Identity, withSqlTransaction } from './session.js';
import { createSqlOnboardingPersistence } from './onboarding.js';
import { createSqlCalendar } from './calendar.js';
import { createSqlResetCoordinator } from './reset.js';
import { receipt, requestFingerprint } from './receipts.js';
import { sqlFail } from './store.js';
import { sqlAdminExecute } from './admin.js';
import {sqlAuthorityStatus} from './health.js';
import { changeSqlAdmin } from './roles.js';

export function createSqlRuntime(pool,rawClient,{appId,allowedPrincipals,now=()=>new Date(),...options}) {
  if(!appId||!Array.isArray(allowedPrincipals)||!allowedPrincipals.length)sqlFail('SQL_TEST_SCOPE_REQUIRED',503);
  const authenticate=async()=>{
    const identity=await verifyBase44Identity(rawClient);
    if(!allowedPrincipals.includes(identity.id))sqlFail('SQL_TEST_PRINCIPAL_REQUIRED',403);
    return identity;
  };
  const transaction=(identity,settings,work)=>withSqlTransaction(pool,{appId,actorId:identity.id,...settings},async context=>{
    const calendar=createSqlCalendar(context,{now});
    const client=createSqlClient(context,rawClient,{projection:calendar.projection});
    client.shinkaCalendarReader=calendar.reader;
    const persistence=createSqlOnboardingPersistence(context,{now});
    const atomic={
      transactCalendar:calendar.transactCalendar,
      read:async(entity,id)=>(await context.store.read(entity,{id},'id',1))[0],
      createIfAbsent:async({entity,record})=>{
        if(entity!=='user_daily_message'||record.user_id!==identity.id)sqlFail('INVALID_ATOMIC_SCOPE',403);
        // The caller holds this owner's lock for input calculation AND insert.
        const old=await context.store.read(entity,{user_id:identity.id,shinka_date:record.shinka_date},'id',2);
        if(old.length)return {status:'EXISTING',id:old[0].id};
        return {status:'CREATED',id:(await context.store.insert(entity,record)).id};
      },
    };
    const dependencies={now,persistence,atomic,geoNames:options.geoNames,
      library:c=>inspectContentLibrary(c,FIRST_CONTENT_SOURCE,CONTENT_CATEGORY_DECISION)};
    dependencies.lifecycleCoordinator=createSqlResetCoordinator(context,dependencies,{now});
    return work({context,client,dependencies,calendar});
  });
  const execute=async(route,body)=>{
    const identity=await authenticate();
    if(!body||typeof body!=='object'||Array.isArray(body))sqlFail('INVALID_REQUEST',400);
    if(body.user_id!==undefined&&body.user_id!==identity.id)sqlFail('FORGED_OWNER',403);
    if(route==='adminTestTools')return sqlAdminExecute({identity,body,transaction,appId,rawClient,now,options:{...options,allowedPrincipals}});
    if(route==='domainAccess')return sqlDomainExecute(identity,body,transaction);
    if(route==='applicationAdmin')return changeSqlAdmin({identity,body,transaction,rawClient,allowedPrincipals,now});
    return transaction(identity,{exclusiveRoster:route==='contentLibrary'&&['applyBatch','moonApplyBatch'].includes(body.action),
      allowActorInactive:route==='applicationSession'||route==='onboarding'&&body.action==='hydrate'},async({context,client,dependencies})=>{
      if(route==='applicationSession') {
        if(Object.keys(body).length)sqlFail('INVALID_REQUEST',400);
        return {...await client.auth.me(),authority:'POSTGRESQL_TEST_V1'};
      }
      if(route==='onboarding') {
        if(['initialize','saveProfile','saveCycle'].includes(body.action)) {
          if(typeof body.action_id!=='string'||!/^[a-zA-Z0-9_-]{16,80}$/.test(body.action_id))sqlFail('ACTION_ID_REQUIRED',400);
          if(await client.shinkaLifecycle(identity.id))return onboardingOperation(client,body,dependencies);
          const result=await receipt(context,body.action_id,`onboarding:${body.action}`,await requestFingerprint(body),
            ()=>onboardingOperation(client,body,dependencies));
          if(result.replayed&&body.action==='saveCycle'&&result.result.persisted&&!await dependencies.persistence.hasVerifiedCycle())sqlFail('CONSENT_STATE_CHANGED');
          return result.result;
        }
        return onboardingOperation(client,body,dependencies);
      }
      if(route==='dailyMessage')return dailyMessageOperation(client,body,dependencies);
      if(route==='calendar')return calendarOperation(client,body,dependencies);
      await requireInternalAdmin(client);
      if(route==='internalHealth') {
        if(body.action==='sqlAuthority'){if(Object.keys(body).length!==1)sqlFail('INVALID_REQUEST',400);return sqlAuthorityStatus(context);}
        const result=await internalHealthOperation(client,body,{geoNamesTransportProbe:options.geoNamesTransportProbe});
        return body.action==='contentCounts'?{...result,source:'LIVE_POSTGRESQL_COUNT'}:result;
      }
      if(route==='validateContentArtifacts'&&options.artifactOperation)return options.artifactOperation(client,body);
      if(route==='contentLibrary') {
        const result=await contentLibraryOperation(client,body,{source:FIRST_CONTENT_SOURCE,decision:CONTENT_CATEGORY_DECISION,astronomy:options.astronomy});
        return {...result,dailyPersistence:'POSTGRESQL_TRANSACTION_V1'};
      }
      sqlFail('INVALID_REQUEST',400);
    });
  };
  return {execute,authenticate,transaction};
}

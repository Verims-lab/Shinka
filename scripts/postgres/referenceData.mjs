import * as astronomy from 'astronomy-engine';
import {FIRST_CONTENT_SOURCE} from '../../base44/shared/firstContentSource.js';
import {CONTENT_CATEGORY_DECISION} from '../../base44/shared/contentCategoryDecision.js';
import {CONTENT_SOURCE_SHA256} from '../../base44/shared/contentSourceReceipt.js';
import {contentBlueprint,contentDigest,planContentImport} from '../../base44/shared/contentImportPlan.js';
import {generateMoonIntervals,validateMoonIntervals} from '../../base44/shared/moonIntervals.js';
import {createSqlStore} from '../../base44/shared/postgres/store.js';

export async function prepareReferenceData(pool,appId,now=new Date()) {
  const {sha256,...payload}=FIRST_CONTENT_SOURCE;
  if(sha256!==CONTENT_SOURCE_SHA256||await contentDigest(payload)!==sha256)throw new Error('REFERENCE_MANIFEST_MISMATCH');
  const blueprint=contentBlueprint(FIRST_CONTENT_SOURCE,CONTENT_CATEGORY_DECISION);
  const horizon=new Date(Date.UTC(now.getUTCFullYear(),now.getUTCMonth()+1,1));
  const moons=generateMoonIntervals(astronomy,horizon);
  return pool.begin(async sql=>{
    await sql`SELECT set_config('shinka.app_id',${appId},true)`;
    const apps=await sql`SELECT * FROM shinka_private.application WHERE app_id=${appId} FOR UPDATE`;
    if(apps.length!==1||apps[0].environment!=='TEST')throw new Error('TEST_DESTINATION_REQUIRED');
    const store=createSqlStore(sql,appId),categoryIds=new Map();
    for(const [entity,entries] of Object.entries(blueprint)) for(const entry of entries) {
      const record={...entry.record};
      if(record.category_id)record.category_id=categoryIds.get(record.category_id);
      const rows=await store.upsert(entity,[record],{key:Object.keys(record)});
      if(entity==='message_category_lookup')categoryIds.set(`@category:${record.category_code}`,rows[0].id);
    }
    const actual={};
    for(const entity of Object.keys(blueprint))actual[entity]=await store.read(entity,{},'id',1000);
    const verified=planContentImport(blueprint,actual);
    if(!verified.ready)throw new Error('REFERENCE_READBACK_CONFLICT');
    await store.upsert('moon_phase_lookup',moons,{key:['start_at_utc']});
    const savedMoon=await store.read('moon_phase_lookup',{},'start_at_utc',1201);
    validateMoonIntervals(savedMoon,now,new Date(Date.UTC(horizon.getUTCFullYear()+2,horizon.getUTCMonth(),1)));
    await sql`UPDATE shinka_private.application SET reference_hash=${sha256} WHERE app_id=${appId}`;
    return {scope:'TEST_REFERENCE_IMPORT',sourceHash:sha256,categories:actual.message_category_lookup.length,
      mappings:actual.message_category_mapping.length,pairs:actual.message_pair.length,moonIntervals:savedMoon.length,
      coverageStart:savedMoon[0].start_at_utc,coverageEnd:savedMoon.at(-1).end_at_utc};
  });
}

// Execute the actual TS entry with only platform imports replaced. No real secrets,
// backend calls or production mutations; no entry source is sent to the browser.
import { readFile } from 'node:fs/promises';
import { runInNewContext } from 'node:vm';
import ts from 'typescript';
import assert from 'node:assert/strict';

export async function verifyGeoNamesEntry(root) {
  const source=await readFile(`${root}/base44/functions/onboarding/entry.ts`,'utf8');
  const output=ts.transpileModule(source,{compilerOptions:{module:ts.ModuleKind.CommonJS,target:ts.ScriptTarget.ES2022}}).outputText;
  const exports={},reads=[],bindings=[];
  let active=false,currentValue;
  const createClient=()=>{};
  const imports={
    'npm:@base44/sdk@0.8.54':{createClientFromRequest:createClient},
    'base44:runtime':{secrets:{get:key=>{
      assert.equal(active,true,'secret read outside request');
      assert.equal(key,'GEONAMES_USERNAME');reads.push(key);return currentValue;
    }}},
    '../../shared/geonamesAdapter.js':{createGeoNamesAdapter:({username})=>{bindings.push(username);return {binding:bindings.length};}},
    '../../shared/onboardingOperations.js':{handleOnboardingRequest:(req,client,{geoNames})=>{
      assert.equal(client,createClient);assert.equal(geoNames.binding,bindings.length);
      return {request:req};
    }},
  };
  runInNewContext(output,{exports,require:name=>{assert.ok(Object.hasOwn(imports,name),'unexpected platform import');return imports[name];}},{timeout:1000});
  assert.equal(reads.length,0,'no module-load secret cache');
  assert.equal(typeof exports.default,'function');
  for(const value of [undefined,'fixture-first','fixture-rotated']){
    active=true;currentValue=value;const req={};
    try{assert.equal((await exports.default(req)).request,req);}finally{active=false;}
    assert.equal(bindings.at(-1),value,'current request secret must reach adapter');
  }
  assert.equal(reads.length,3);
  return {scope:'LOCAL_PLATFORM_IMPORT_SUBSTITUTION',requests:3,secretReadsAtModuleLoad:0,passed:true};
}

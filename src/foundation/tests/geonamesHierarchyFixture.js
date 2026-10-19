// Synthetic provider records, never imported by product code or used as fallback.
export const fixtureProviderPlace={geonameId:123,name:'Fixture City',countryCode:'TR',fcl:'P',fcode:'PPL',lat:'40',lng:'29',adminCode1:'34',adminCode2:'01',adminName1:'Fixture Region',adminName2:'Fixture District'};
export const fixtureCountries=[{geonameId:100,countryCode:'TR',countryName:'Türkiye'},{geonameId:200,countryCode:'US',countryName:'United States'},{geonameId:300,countryCode:'SG',countryName:'Singapore'}];
export const fixtureRegions=[
 {geonameId:1001,name:'Fixture Region',fcl:'A',fcode:'ADM1',countryCode:'TR',adminCode1:'34'},
 {geonameId:1002,name:'Fixture District',fcl:'A',fcode:'ADM2',countryCode:'TR',adminCode1:'34',adminCode2:'01',adminName1:'Fixture Region'},
 {geonameId:2001,name:'Fixture State',fcl:'A',fcode:'ADM1',countryCode:'US',adminCode1:'CA'},
 {geonameId:2003,name:'Fixture Township',fcl:'A',fcode:'ADM3',countryCode:'US',adminCode1:'CA',adminCode3:'007',adminName1:'Fixture State'},
];
export const fixtureSettlements=[fixtureProviderPlace,{...fixtureProviderPlace,geonameId:223,name:'Fixture Town',countryCode:'US',adminCode1:'CA',adminCode2:'',adminCode3:'007',adminName1:'Fixture State',adminName2:''},{...fixtureProviderPlace,geonameId:323,name:'Fixture Settlement',countryCode:'SG',adminCode1:'',adminCode2:'',adminName1:'',adminName2:''}];
export async function hierarchyFetch(input) {
  const url=new URL(input),p=url.searchParams;
  if(url.pathname==='/countryInfoJSON')return Response.json({geonames:fixtureCountries.filter(r=>!p.has('country')||r.countryCode===p.get('country'))});
  if(url.pathname==='/getJSON')return Response.json([...fixtureRegions,...fixtureSettlements].find(r=>r.geonameId===Number(p.get('geonameId')))||{});
  if(url.pathname==='/hierarchyJSON'){
    const parent=fixtureRegions.find(r=>r.geonameId===Number(p.get('geonameId'))),country=fixtureCountries.find(r=>r.countryCode===parent?.countryCode);
    const ancestors=fixtureRegions.filter(row=>row.countryCode===parent?.countryCode&&Number(row.fcode.slice(3))<=Number(parent.fcode.slice(3))&&row[`adminCode${row.fcode.slice(3)}`]===parent[`adminCode${row.fcode.slice(3)}`]);
    return Response.json({geonames:country?[{...country,fcl:'A',fcode:'PCLI'},...ancestors]:[]});
  }
  if(url.pathname==='/searchJSON'){
    const rows=(p.get('featureClass')==='A'?fixtureRegions:fixtureSettlements).filter(r=>(!p.has('country')||r.countryCode===p.get('country'))&&(!p.has('featureCode')||r.fcode===p.get('featureCode'))&&[1,2,3,4,5].every(i=>!p.has(`adminCode${i}`)||r[`adminCode${i}`]===p.get(`adminCode${i}`)));
    const offset=Number(p.get('startRow')||0),size=Number(p.get('maxRows')||8);
    return Response.json({totalResultsCount:rows.length,geonames:rows.slice(offset,offset+size)});
  }
  throw new Error('unexpected synthetic provider endpoint');
}

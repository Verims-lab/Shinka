// Synthetic provider records for the v1.0 birthplace search rule. IDs and
// coordinates are fixtures, never live GeoNames coverage or product fallback.
export const fixtureProviderPlace={geonameId:123,name:'Fixture City',countryCode:'TR',countryName:'Türkiye',fcl:'P',fcode:'PPL',lat:'40',lng:'29',adminCode1:'34',adminName1:'Fixture Region'};
const row=(geonameId,name,fcl,fcode,countryCode,countryName,adminName1,lat,lng)=>({geonameId,name,fcl,fcode,countryCode,countryName,adminName1,lat:String(lat),lng:String(lng)});
// "Kan" document examples plus a mid-word match and an upper-region-only false match.
export const KAN_CANDIDATES=[
  row(9001,'Kansas','A','ADM1','US','United States','Kansas',38.5,-98),
  row(9002,'Kansas City','P','PPL','US','United States','Missouri',39.1,-94.58),
  row(9003,'Kanpur','P','PPLA2','IN','India','Uttar Pradesh',26.46,80.35),
  row(9004,'Kankan','P','PPLA','GN','Guinea','Kankan',10.39,-9.31),
  row(9005,'Çanakkale','P','PPLA','TR','Türkiye','Çanakkale',40.15,26.41),
  row(9006,'Çankaya','P','PPLA2','TR','Türkiye','Ankara',39.92,32.86),
  row(9007,'Wichita','P','PPL','US','United States','Kansas',37.69,-97.34),
  row(9008,'Arkansas','A','ADM1','US','United States','Arkansas',34.75,-92.5),
  row(9009,'Kansas','P','PPL','US','United States','Illinois',39.55,-87.94),
];
export const KAN_EXPECTED=[9001,9002,9003,9004,9008,9009];
export const KAN_REJECTED=[9005,9006,9007];
export const fixtureCountry=row(9010,'Kanata Republic','A','PCLI','KR','Kanata Republic','',10,10);
export const fixtureStream=row(9011,'Kansas River','H','STM','US','United States','Kansas',39.1,-94.6);
const all=()=>[fixtureProviderPlace,...KAN_CANDIDATES,fixtureCountry];
// Provider double: returns the candidate rows it is given (noise included), paged by startRow/maxRows.
export function placeFetchFor(rows=all()) {
  return async input=>{
    const url=new URL(input),p=url.searchParams;
    if(url.pathname==='/getJSON')return Response.json([...all(),fixtureStream].find(r=>r.geonameId===Number(p.get('geonameId')))||{});
    if(url.pathname==='/searchJSON'){
      const offset=Number(p.get('startRow')||0),size=Number(p.get('maxRows')||50);
      return Response.json({totalResultsCount:rows.length,geonames:rows.slice(offset,offset+size)});
    }
    throw new Error('unexpected synthetic provider endpoint');
  };
}
export const placeFetch=placeFetchFor();
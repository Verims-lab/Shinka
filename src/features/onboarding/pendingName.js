import { optionalName } from '../../../base44/shared/onboardingValidation.js';
const KEY='shinka.pending-name.v1',TTL=30*60*1000;
/** @param {string|null} name @param {Pick<Storage,'getItem'|'setItem'|'removeItem'>} [storage] @param {number} [now] */
export function savePendingName(name,storage=undefined,now=Date.now()) {
  const value=optionalName(name);
  try {(storage||globalThis.sessionStorage).setItem(KEY,JSON.stringify({version:1,name:value,expires:now+TTL}));return true;}catch{return false;}
}
/** @param {Pick<Storage,'getItem'|'setItem'|'removeItem'>} [storage] */
export function clearPendingName(storage=undefined) {try{(storage||globalThis.sessionStorage).removeItem(KEY);}catch{/* No persistence available. */}}
/** @param {Pick<Storage,'getItem'|'setItem'|'removeItem'>} [storage] @param {number} [now] */
export function readPendingName(storage=undefined,now=Date.now()) {
  try {const raw=(storage||globalThis.sessionStorage).getItem(KEY);if(!raw)return null;
    if(raw.length>600)throw new Error('invalid');
    const value=JSON.parse(raw);
    if(value.version!==1||!Number.isFinite(value.expires)||value.expires<now||value.expires>now+TTL||Object.keys(value).some(k=>!['version','name','expires'].includes(k)))throw new Error('invalid');
    return optionalName(value.name);
  }catch{clearPendingName(storage);return null;}
}

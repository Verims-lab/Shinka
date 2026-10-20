import { BUILD_MARKER } from '../buildMarker';
import { loadStaticEvidence } from '../inspection/sourceScanner';
import { resolveEnvironment } from '../environment';
const KEY = 'shinka.browser-evidence.v1';
export const PROBE_CONTRACT = 'shinka.browser-probes/1';
export async function probeIdentity() {
  const manifest = await loadStaticEvidence();
  const bytes = new TextEncoder().encode(JSON.stringify(manifest.hashes));
  const digest = Array.from(new Uint8Array(await crypto.subtle.digest('SHA-256', bytes)), b => b.toString(16).padStart(2,'0')).join('');
  return { contract: PROBE_CONTRACT, buildMarker: BUILD_MARKER, sourceDigest: digest, origin: location.origin, environment: resolveEnvironment().id };
}
export async function acceptBrowserEvidence(bundle) {
  const identity = await probeIdentity();
  if (!bundle || Object.entries(identity).some(([k,v]) => bundle[k] !== v) ||
      !['chromium','webkit'].includes(bundle.engine) || !bundle.browserVersion || !Array.isArray(bundle.measurements) || bundle.measurements.length > 10 ||
      !Number.isFinite(Date.parse(bundle.measuredAt)) || Date.parse(bundle.measuredAt) > Date.now()+60000 || Date.now()-Date.parse(bundle.measuredAt)>86400000)
    throw new Error('BROWSER_EVIDENCE_MISMATCH');
  sessionStorage.setItem(KEY, JSON.stringify(bundle));
  return bundle;
}
export async function browserMeasurement(kind, path, width) {
  let bundle;
  try { bundle = await acceptBrowserEvidence(JSON.parse(sessionStorage.getItem(KEY))); } catch { return { state:'BLOCKED', code:'BROWSER_EVIDENCE_REQUIRED', path, width, scrollWidth:null, overflow:null }; }
  const rows = bundle.measurements.filter(r => r.kind===kind && r.path===path && r.width===width);
  if (rows.length !== 1 || rows[0].viewport?.width!==width || !Number.isFinite(rows[0].viewport?.height) || rows[0].viewport.height<=0 || rows[0].topLevel!==true || rows[0].landedPath!==path || !['READY','MEASURED'].includes(rows[0].state))
    return { state:'BLOCKED', code:'BROWSER_MEASUREMENT_UNCONFIRMED', path, width, scrollWidth:null, overflow:null };
  const row=rows[0],measured=isMeasuredBrowserRow(row,kind,path,width);
  if(!measured)return {state:'BLOCKED',code:'BROWSER_MEASUREMENT_UNCONFIRMED',path,width,scrollWidth:null,overflow:null};
  return { ...row, provenance: { ...await probeIdentity(), measuredAt:bundle.measuredAt, engine:bundle.engine, browserVersion:bundle.browserVersion, evidenceBoundary:'ADMIN_SUPPLIED_BROWSER_MEASUREMENT', physicalDevice:false } };
}

export function isMeasuredBrowserRow(row,kind,path,width) {
  const geometry=row.geometry;
  return kind==='layout'
    ? row.state==='MEASURED' && Number.isFinite(row.scrollWidth) && row.scrollWidth>0 && typeof row.overflow==='boolean' && row.overflow===(row.scrollWidth>width+1)
    : row.state==='READY' && row.route===path && row.screen==='UNAUTHENTICATED_SIGN_IN' && geometry && typeof geometry.providers==='string' && Array.isArray(geometry.heights) && geometry.heights.length===2 && geometry.heights.every(h=>Number.isFinite(h)&&h>0) && Array.isArray(geometry.padding) && geometry.padding.length===2 && Number.isInteger(geometry.passwords) && geometry.passwords>=0 && typeof geometry.ageChecked==='boolean';
}

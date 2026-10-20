// Read-only repository guard. Local findings do not certify a deployed Base44 app.
import { buildStaticEvidence } from './staticEvidence.mjs';
import { DOMAIN_SCHEMAS } from '../base44/shared/domainSchemas.js';
import { SOURCE_FIELD_NAMES } from '../base44/shared/domainSourceReceipt.js';
import { BUILD_MARKER } from '../src/foundation/buildMarker.js';
import { BUILD_LEDGER } from '../src/foundation/buildLedger.js';
import { HEALTH_CATALOG_VERSION } from '../base44/shared/healthConstants.js';
import { validateLedger } from '../src/foundation/buildMarkerRules.js';
const e=buildStaticEvidence();
const checks={
  dependencyBoundaries:e.dependencies.ok,
  boundedGeneratedHistory:e.activeBuildHistory.generatedMatches,
  twentyPhysicalProductSchemas:e.domain.expected===20&&e.domain.present===20&&e.domain.mismatches.length===0,
  noUnexpectedProductSchemas:e.domain.unexpected.length===0,
  separateBuiltinUserAndTooling:e.domain.builtinUserSeparate&&e.domain.internal===2&&e.domain.testOperationPolicy,
  exactAuthoritativeFields:Object.keys(SOURCE_FIELD_NAMES).length===20&&Object.entries(SOURCE_FIELD_NAMES).every(([entity,fields])=>JSON.stringify([...fields].sort())===JSON.stringify(Object.keys(DOMAIN_SCHEMAS[entity].properties).sort())),
  completeAccessMatrix:e.domain.accessMatrixComplete&&e.domain.accessMatrixRows===20,
  directSdkOperationsDenied:e.domain.directOperationsDenied,
  onboardingCopyAndProxy:e.onboarding.ok,
  onboardingGeoNamesEntry:e.geoNamesEntry,
  noProductSeedCalls:e.domain.writeSurface.ok,
  canonicalMarker:e.marker.ok&&validateLedger(BUILD_LEDGER,BUILD_MARKER).ok&&BUILD_LEDGER.at(-1).health_catalog_version===HEALTH_CATALOG_VERSION,
  docsAligned:e.docs.present===12&&e.docs.headerGaps.length===0&&e.docs.misaligned.length===0&&e.docs.missingDomainEntities.length===0&&e.docs.buildHistoryMismatches.length===0,
  noLegacyImport:e.legacy.length===0,noCredentialFindings:e.secretFiles.length===0,noPersonalEmails:e.emailFiles.length===0,
};
console.log(JSON.stringify({scope:'REPOSITORY_ONLY',buildMarker:BUILD_MARKER,healthCatalog:HEALTH_CATALOG_VERSION,checks,failed:Object.keys(checks).filter(k=>!checks[k]),domain:e.domain},null,2));
if(Object.values(checks).some(pass=>!pass)) process.exitCode=1;

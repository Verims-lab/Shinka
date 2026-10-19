import { CLASS, RUNNER } from "../constants";
import { ev, verdict } from "../evidence";
import { makeCase } from "../caseFactory";
import { checkAuthPolicy, OBSERVED_AUTH_METHODS } from "@/foundation/authPolicy";
import { guardScenarios } from "@/foundation/tests/securityScenarios";
const c = makeCase("H03");
const scan = (key, title, ok) => async (ctx) => {
  const manifest = await ctx.inspection();
  const result = manifest[key];
  return verdict(ok(result), ev(CLASS.STATIC, `build-time manifest:${key}`, result, "no violations", `${title}; repository hash metadata, not live enforcement`));
};
export const H03_CASES = [
  c("H03-001", "No legacy Shinka source/module import", "Syntax-aware production and test scan; strings/comments are not imports.", scan("legacy", "Legacy firewall", (x)=>x.length===0)),
  c("H03-002", "No duplicate BuildMarker authority", "Only the canonical module exports BUILD_MARKER.", scan("marker", "Marker authority", (x)=>x.ok)),
  c("H03-003", "No hardcoded secret", "Build-time source/config secret scan returns paths only.", scan("secretFiles", "Secret scan", (x)=>x.length===0)),
  c("H03-004", "No hardcoded personal admin email", "Production, configuration and tests scanned; reserved example fixture domains allowed.", scan("emailFiles", "Email scan", (x)=>x.length===0)),
  c("H03-005", "Foundational service boundaries exist", "Canonical service/module paths exist.", scan("boundaries", "Module inventory", (x)=>x.length===0)),
  c("H03-006", "No business logic in Health UI", "Internal UI accesses data through guarded internal services.", scan("internalUi", "UI boundary", (x)=>x.files>0&&x.violations.length===0)),
  c("H03-007", "Foundation automated tests pass", "Canonical tests run against helpers, synthetic backend contexts and rendered UI.", async () => {
    const { runFoundationTests } = await import("@/foundation/tests/foundationTests");
    const results=await runFoundationTests();
    const failed=results.filter((t)=>!t.passed).map((t)=>`${t.id}:${t.detail}`);
    return verdict(results.length>0&&failed.length===0,ev(CLASS.SYNTHETIC_RUNTIME,"canonical Foundation tests",{total:results.length,failed,authProbe:results.find(t=>t.id==="T74")?.evidence,probeFailures:results.filter(t=>!t.passed&&t.evidence).map(t=>({id:t.id,evidence:t.evidence}))},{failed:[]},"Local/browser regression; not live backend enforcement"));
  }, {runnerType:RUNNER.RUNTIME,classification:CLASS.SYNTHETIC_RUNTIME,timeoutMs:90000}),
  c("H03-008", "Repository auth policy: Apple and Google only", "No password routes/operations/fields or unapproved provider literals; recorded platform config is not live proof.", async (ctx) => {
    const surface=(await ctx.inspection()).authSurface;
    return verdict(surface.ok&&checkAuthPolicy().ok,ev(CLASS.STATIC,"repository auth manifest + recorded policy",{surface,recordedAt:OBSERVED_AUTH_METHODS.observedAt},{ok:true},"Repository policy only; Base44 Authentication panel and sign-in still require external verification"));
  }),
  c("H03-009", "Internal operations require server admin identity", "Anonymous, ordinary-user and forged-role requests denied before operation; admin permitted in synthetic runtime.", async () => {
    const result=await guardScenarios();
    return verdict(result.ok,ev(CLASS.SYNTHETIC_RUNTIME,"handleInternalRequest",result,{ok:true},"Injected server principals; not LIVE_ENFORCEMENT"));
  },{runnerType:RUNNER.RUNTIME,classification:CLASS.SYNTHETIC_RUNTIME}),
];

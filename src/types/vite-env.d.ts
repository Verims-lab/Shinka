/// <reference types="vite/client" />
declare module "virtual:shinka-static-evidence" {
  const evidence: ReturnType<typeof import("../../scripts/staticEvidence.mjs").buildStaticEvidence>;
  export default evidence;
}

// INTERNAL TOOLING service boundary — read-only content artifact validation (no import).
import { base44 } from "@/api/base44Client";
import { ShinkaError, classifyError, withTimeout } from "@/foundation/errors";

export async function fetchArtifactValidation(mode) {
  try {
    const res = await withTimeout(base44.functions.invoke("validateContentArtifacts", { mode }), 30000);
    return res.data;
  } catch (e) {
    throw new ShinkaError(classifyError(e), e?.response?.data?.error_code || e?.message);
  }
}
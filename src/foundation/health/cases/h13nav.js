// H13-008 navigation + icon contract.
import { checkNavContract } from "@/foundation/inspection/uiRules";
import { iconExports } from "@/foundation/probes/iconProbe";
import { CLASS } from "../constants";
import { ev, verdict } from "../evidence";
import { makeCase } from "../caseFactory";

const c = makeCase("H13");

export const H13_NAV_CASES = [
  c("H13-008", "Navigation and Lucide icon contract", "Bottom nav is exactly Home/Calendar/Pattern (house, calendar-days, moon); You is top-right user-round and not in bottom nav; icons resolve in lucide-react; Home shell renders from the contract.", async (ctx) => {
    const r = checkNavContract(iconExports());
    const shellUsesContract = ((await ctx.sources())["/src/pages/Home.jsx"] || "").includes("BOTTOM_NAV.map");
    return verdict(r.ok && shellUsesContract, ev(CLASS.STATIC, "uiContract.js + lucide-react + Home.jsx", { ...r, shellUsesContract }, { ok: true, shellUsesContract: true }, "Contract inspection"));
  }),
];
import { ADMIN_NAV_TESTS } from '@/foundation/tests/adminNavigationTests';
import { syntheticProbe } from './domainProbe';
import { RUNNER } from '../constants';
// H13-008 navigation + icon contract.
import { checkNavContract } from "@/foundation/inspection/uiRules";
import { iconExports } from "@/foundation/probes/iconProbe";
import { CLASS } from "../constants";
import { ev, verdict } from "../evidence";
import { makeCase } from "../caseFactory";

const c = makeCase("H13");

export const H13_NAV_CASES = [
  c("H13-014", "Admin navigation and localized inventory", "AN01/AN08: exactly three approved tools, TR/EN labels, panel/tool/app navigation and retained fallback menu Escape/arrows/Tab with injected identities, isolated lifecycle events/theme Document and abortable DOM observation. T83 proves this embedded fixture leaves the active account theme unchanged. CLI separately checks real Home → You → Admin keyboard entry, absent onboarding header access, responsive targets and late hydration after route departure.", syntheticProbe(ADMIN_NAV_TESTS.filter(([id]) => ["AN01", "AN08"].includes(id))), { classification: CLASS.SYNTHETIC_RUNTIME, runnerType: RUNNER.RUNTIME }),
  c("H13-008", "Navigation and Lucide icon contract", "Bottom nav is exactly Home/Calendar/Pattern (house, calendar-days, moon); You is top-right user-round and not in bottom nav; icons resolve in lucide-react; Home, Calendar and Pattern use the shared contract-driven navigation.", async (ctx) => {
    const r = checkNavContract(iconExports());
    const shellUsesContract = (await ctx.inspection()).ui.shellUsesContract;
    return verdict(r.ok && shellUsesContract, ev(CLASS.STATIC, "uiContract.js + lucide-react + ProductNavigation + Home/Calendar/Pattern", { ...r, shellUsesContract }, { ok: true, shellUsesContract: true }, "Contract inspection"));
  }),
];

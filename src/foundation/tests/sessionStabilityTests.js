import { classifySessionFailure } from "@/foundation/authErrors";
import { createSessionCoalescer } from "@/lib/sessionCheck";
import { nativePrerequisite } from "@/foundation/health/nativeReadinessContract";
const check = (ok, msg = "assertion failed") => { if (!ok) throw new Error(msg); };
const http = status => Object.assign(new Error("x"), { status });
const NAMES = ["AdminTestOperation", "UserCalendarAction", "InternalHealthRun", "UserPrivacyRequest", "PrivacyRecoveryReceipt"];
const STRATEGY = { authority: "BASE44_NATIVE_V1", strategyVersion: "native-continuation/2", daily: "IMMUTABLE_CANDIDATES", calendar: "OBSERVATIONS_AND_RECEIPTS", reset: "VERIFIED_STEPS", deletion: "TARGET_LIFECYCLE_RESUMABLE" };
const readable = name => ({ name, readable: true, sampledRows: 1 });
const unreadable = (name, code, httpStatus) => ({ name, readable: false, diagnostic: { code, httpStatus } });
const ctx = value => ({ nativeReadiness: async () => value });
/** @type {import('./testTypes').FoundationTest[]} */
export const SESSION_STABILITY_TESTS = [
  ["SS01", "Session refresh: 429/503/timeout/network stay UNVERIFIED; 401/deleted/invalid payload are INVALID", async () => {
    for (const e of [http(429), http(503), http(500), { code: "ECONNABORTED" }, { code: "ERR_NETWORK" }, new Error("TIMEOUT"), { response: { status: 503, data: { error_code: "SESSION_UNAVAILABLE" } } }]) check(classifySessionFailure(e) === "UNVERIFIED", JSON.stringify(e));
    for (const e of [http(401), { response: { status: 403, data: { error_code: "ACCOUNT_DELETION_IN_PROGRESS" } } }, new Error("APPLICATION_SESSION_UNVERIFIED"), { response: { status: 401, data: { error_code: "AUTH_REQUIRED" } } }]) check(classifySessionFailure(e) === "INVALID", JSON.stringify(e));
  }],
  ["SS02", "Concurrent focus/visibility/timer/route checks coalesce; passive checks throttle after success", async () => {
    let runs = 0, release; const gate = new Promise(r => { release = r; });
    let time = 0; const c = createSessionCoalescer(async () => { runs++; await gate; return true; }, { minPassiveGapMs: 15000, now: () => time });
    const all = Promise.all([c.check(), c.passive(), c.passive(), c.check()]); release(); await all;
    check(runs === 1, `runs ${runs}`);
    time = 5000; await c.passive(); check(runs === 1, "passive within gap skipped");
    await c.check(); check(runs === 2, "explicit check always runs");
    time = 30000; await c.passive(); check(runs === 3, "passive after gap runs");
  }],
  ["SS04", "Health native prerequisite: 429 is BLOCKED, proven mismatch is FAIL, PASS only with every schema read", async () => {
    const limited = { ...STRATEGY, schemas: NAMES.map(n => ["UserPrivacyRequest", "PrivacyRecoveryReceipt"].includes(n) ? unreadable(n, "RATE_LIMITED", 429) : readable(n)) };
    check((await nativePrerequisite(ctx(limited), "daily")).status === "BLOCKED", "429 blocked");
    check((await nativePrerequisite(ctx({ ...limited, deletion: "OTHER" }), "daily")).status === "FAIL", "mismatch with 429 still fails");
    check((await nativePrerequisite(ctx({ ...STRATEGY, schemas: NAMES.map(n => n === "UserPrivacyRequest" ? unreadable(n, "NOT_FOUND", 404) : readable(n)) }), "daily")).status === "FAIL", "not found fails");
    check((await nativePrerequisite(ctx({ ...STRATEGY, schemas: NAMES.map(readable) }), "daily")).status === "PASS", "all readable passes");
  }],
];
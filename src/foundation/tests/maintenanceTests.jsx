import { createElement, useEffect } from "react";
import { createRoot } from "react-dom/client";
import { retainBuildPackages } from "../buildHistoryPolicy";
import { validateLedger } from "../buildMarkerRules";
import { BUILD_LEDGER } from "../buildLedger";
import { BUILD_MARKER } from "../buildMarker";
import { loadStaticEvidence } from "../inspection/sourceScanner";
import {
  createPlaceListCache,
  PLACE_CACHE_LIMITS,
} from "@/features/profile/placeListCache";
import { createBirthplacePicker } from "@/features/profile/birthplaceSelection";
import { createGeoNamesAdapter } from "../../../base44/shared/geonamesAdapter.js";
import { onboardingOperation } from "../../../base44/shared/onboardingOperations.js";
import { sdkOnboardingFixture } from "./base44OnboardingFixture";
import { hierarchyFetch } from "./geonamesHierarchyFixture";
import { check, rejects } from "./dataModelTests";

const marker = (n) => `Buildmarker-${String(n).padStart(3, "0")}`;
const entry = (n) => ({
  build_marker: marker(n),
  notes: `package ${n}`,
  full_health_status: "EXTERNAL_REQUIRED",
});
const entries = (n) => Array.from({ length: n }, (_, i) => entry(i + 1));
const pause = () => new Promise((resolve) => setTimeout(resolve, 30));

/** @type {import('./testTypes').FoundationTest[]} */
export const MAINTENANCE_TESTS = [
  [
    "M01",
    "Active ledger preserves all packages below five and exactly five",
    () => {
      for (const n of [1, 3, 5]) {
        const result = retainBuildPackages(entries(n), marker(n));
        check(result.length === n && validateLedger(result, marker(n)).ok);
      }
    },
  ],
  [
    "M02",
    "Six or more unordered packages evict only oldest unique packages, retaining current",
    () => {
      const result = retainBuildPackages(entries(8).reverse(), marker(8));
      check(
        result.map((e) => e.build_marker).join() ===
          entries(8)
            .slice(3)
            .map((e) => e.build_marker)
            .join(),
      );
      check(
        validateLedger(result, marker(8)).ok &&
          !validateLedger(entries(8), marker(8)).ok,
      );
    },
  ],
  [
    "M03",
    "Same-package updates consolidate summary and keep latest status/open issues",
    () => {
      const result = retainBuildPackages(
        [
          ...entries(5),
          { ...entry(5), notes: "Latest checks pass; device pending" },
        ],
        marker(5),
      );
      check(
        result.length === 5 &&
          result.at(-1).notes === "Latest checks pass; device pending",
      );
      check(result.at(-1).full_health_status === "EXTERNAL_REQUIRED");
    },
  ],
  [
    "M04",
    "Missing current, future, invalid and discontinuous packages cannot be published",
    () => {
      for (const [rows, current] of [
        [entries(2), marker(3)],
        [entries(3), marker(2)],
        [[{ build_marker: "invalid" }], marker(1)],
      ]) {
        let thrown = false;
        try {
          retainBuildPackages(rows, current);
        } catch {
          thrown = true;
        }
        check(thrown);
      }
      check(!validateLedger([entry(1), entry(3)], marker(3)).ok);
    },
  ],
  [
    "M05",
    "Real source, generated history and initial dependency closure obey maintenance rules",
    async () => {
      const e = await loadStaticEvidence();
      check(
        validateLedger(BUILD_LEDGER, BUILD_MARKER).ok &&
          e.activeBuildHistory.generatedMatches,
      );
      check(e.dependencies.ok, JSON.stringify(e.dependencies));
    },
  ],
  [
    "M06",
    "Place cache expires, evicts LRU, bounds bytes/entries and clears",
    () => {
      let now = 0;
      const cache = createPlaceListCache(() => now);
      for (let i = 0; i < PLACE_CACHE_LIMITS.entries; i++)
        cache.set(String(i), { options: [i] });
      cache.get("0");
      cache.set("extra", { options: [] });
      check(
        cache.get("0") &&
          !cache.get("1") &&
          cache.stats().entries === PLACE_CACHE_LIMITS.entries,
      );
      cache.set("large", { text: "x".repeat(PLACE_CACHE_LIMITS.bytes) });
      check(!cache.get("large"));
      for (let i = 0; i < 3; i++)
        cache.set(`bytes-${i}`, { text: "x".repeat(400000) });
      check(
        cache.stats().bytes <= PLACE_CACHE_LIMITS.bytes &&
          !cache.get("bytes-0"),
      );
      now += PLACE_CACHE_LIMITS.ttlMs;
      check(cache.stats().entries === 0);
      cache.set("again", {});
      cache.clear();
      check(cache.stats().bytes === 0);
    },
  ],
  [
    "M07",
    "Picker cache keys isolate country, parent, language and page; clear/dispose force fresh lists",
    async () => {
      let calls = 0;
      const geo = createGeoNamesAdapter({
        username: "fixture",
        fetcher: hierarchyFetch,
      });
      const picker = createBirthplacePicker({
        request: async (action, payload) => {
          calls++;
          return action === "listPlaceCountries"
            ? geo.countries(payload.language_code)
            : action === "listPlaceRegions"
              ? geo.regions(payload)
              : geo.places(payload);
        },
      });
      await picker.start("en");
      await picker.country(100);
      await picker.region(0, 1001);
      const cold = calls;
      await picker.country(100);
      await picker.region(0, 1001);
      check(calls === cold);
      await picker.country(200);
      check(calls === cold + 2);
      const beforeLanguage = calls;
      await picker.language("tr");
      check(calls > beforeLanguage);
      const beforeClear = calls;
      await picker.clear();
      await picker.country(100);
      check(calls > beforeClear);
      picker.dispose();
      const beforeRestart = calls;
      await picker.start("tr");
      check(calls > beforeRestart);
      picker.dispose();
      const cache = createPlaceListCache();
      cache.set(JSON.stringify(["places", "TR", 1001, "tr", 0]), {
        options: [1],
      });
      check(!cache.get(JSON.stringify(["places", "TR", 1001, "tr", 100])));
    },
  ],
  [
    "M08",
    "Read-only provider lists read one owner profile, skip preferences, and still deny inactive/anonymous",
    async () => {
      const geo = createGeoNamesAdapter({
        username: "fixture",
        fetcher: hierarchyFetch,
      });
      for (const action of [
        "listPlaceCountries",
        "listPlaceRegions",
        "listPlaceSettlements",
      ]) {
        const f = sdkOnboardingFixture();
        await onboardingOperation(
          f.client,
          {
            action,
            language_code: "en",
            ...(action === "listPlaceCountries"
              ? {}
              : { country: "TR", parent_id: null, offset: 0 }),
          },
          { geoNames: geo },
        );
        check(
          f.calls.length === 1 &&
            f.calls[0].entity === "user_profile" &&
            f.calls[0].method === "filter",
        );
      }
      for (const inactive of [false, true]) {
        const f = sdkOnboardingFixture({ owner: inactive ? "ownerA" : null });
        if (inactive)
          f.rows.user_profile.push({
            user_id: "ownerA",
            account_status: "INACTIVE",
          });
        let outbound = 0;
        const call = () =>
          onboardingOperation(
            f.client,
            { action: "listPlaceCountries", language_code: "en" },
            {
              geoNames: {
                countries: async () => {
                  outbound++;
                },
              },
            },
          );
        if (inactive) check((await call()).state === "INACTIVE_ACCOUNT");
        else await rejects(call, "AUTH_REQUIRED");
        check(outbound === 0);
      }
    },
  ],
  [
    "M09",
    "Health runner rejects duplicate starts, ignores stale history and preserves completed audit on unmount",
    async () => {
      const { useHealthRunner } = await import("../health/useHealthRunner");
      /** @type {ReturnType<typeof useHealthRunner>} */
      let hook;
      /** @type {(value:any)=>void} */
      let release;
      let runs = 0,
        saves = 0,
        mounted = true;
      const pending = [];
      const operations = {
        list: () => new Promise((resolve) => pending.push(resolve)),
        run: () => {
          runs++;
          return new Promise((resolve) => {
            release = resolve;
          });
        },
        save: async () => {
          saves++;
        },
      };
      function Harness() {
        const value = useHealthRunner(operations);
        useEffect(() => {
          hook = value;
        });
        return null;
      }
      const host = document.createElement("div");
      document.body.appendChild(host);
      const root = createRoot(host);
      try {
        root.render(createElement(Harness));
        await pause();
        const reload = hook.loadHistory();
        pending[1]([{ id: "new" }]);
        await reload;
        await pause();
        pending[0]([{ id: "stale" }]);
        await pause();
        check(hook.history.items[0].id === "new");
        const first = hook.run();
        await hook.run();
        check(runs === 1);
        root.unmount();
        mounted = false;
        release({ id: "completed" });
        await first;
        check(saves === 1 && pending.length === 2);
      } finally {
        if (mounted) root.unmount();
        host.remove();
      }
    },
  ],
  ["M10", "Failed Health save retries the same completed run without rerunning tests", async () => {
    const {useHealthRunner}=await import('../health/useHealthRunner');
    /** @type {ReturnType<typeof useHealthRunner>} */
    let hook;
    let runs=0,saves=0;
    const {buildReport}=await import('../health/report');
    const {summarize,computeGate}=await import('../health/aggregate');
    const report=buildReport({scope:'FULL',started:new Date(),completed:new Date(),results:[],summary:summarize([]),gate:computeGate([])});
    const operations={list:async()=>[],run:async()=>{runs++;return report;},save:async value=>{check(value===report);if(++saves===1)throw new Error('private');}};
    function Harness(){hook=useHealthRunner(operations);return null;}
    const host=document.createElement('div');document.body.appendChild(host);const root=createRoot(host);
    try {root.render(createElement(Harness));await pause();await hook.run();await pause();check(hook.report===report&&hook.saveError);await hook.retrySave();await pause();check(runs===1&&saves===2&&hook.saveError===null);}
    finally {root.unmount();host.remove();}
  }],
];

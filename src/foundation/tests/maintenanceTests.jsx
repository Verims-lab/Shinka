import { createElement, useEffect } from "react";
import { createRoot } from "react-dom/client";
import { retainBuildPackages } from "../buildHistoryPolicy";
import { validateLedger } from "../buildMarkerRules";
import { BUILD_LEDGER } from "../buildLedger";
import { BUILD_MARKER } from "../buildMarker";
import { loadStaticEvidence } from "../inspection/sourceScanner";
import { createGeoNamesAdapter } from "../../../base44/shared/geonamesAdapter.js";
import { onboardingOperation } from "../../../base44/shared/onboardingOperations.js";
import { sdkOnboardingFixture } from "./base44OnboardingFixture";
import { placeFetch } from "./geonamesSearchFixture";
import { check, rejects } from "./dataModelTests";
import { testDelay } from '../testExecution';

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
    "M08",
    "Read-only place search reads one owner profile, skips preferences, and still denies inactive/anonymous",
    async () => {
      const geo = createGeoNamesAdapter({
        username: "fixture",
        fetcher: placeFetch,
      });
      for (const page of [0, 1]) {
        const f = sdkOnboardingFixture();
        await onboardingOperation(
          f.client,
          { action: "searchPlaces", query: "Kan", language_code: "en", page },
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
            { action: "searchPlaces", query: "Kan", language_code: "en" },
            {
              geoNames: {
                search: async () => {
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
    async (context = {}) => {
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
        // A fixed 30ms sleep is not evidence that React committed this hook.
        // Keep the ordinary test deadline/cancellation and wait for its API.
        while (!hook || pending.length === 0) await testDelay(0, context.signal);
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
  ["M10", "Failed Health save retries the same completed run without rerunning tests", async (context = {}) => {
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
    try {
      root.render(createElement(Harness));
      while(!hook)await testDelay(0,context.signal);
      await hook.run();while(hook.report!==report||!hook.saveError)await testDelay(0,context.signal);
      check(hook.report===report&&hook.saveError);await hook.retrySave();
      while(hook.saveError!==null)await testDelay(0,context.signal);
      check(runs===1&&saves===2&&hook.saveError===null);
    }
    finally {root.unmount();host.remove();}
  }],
];

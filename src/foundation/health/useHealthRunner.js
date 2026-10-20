import { useState, useCallback, useEffect, useRef } from "react";
import { runHealth } from "./runner";
import {
  saveHealthRun,
  listHealthRuns,
} from "@/services/internal/healthRunStore";
import { classifyError } from "@/foundation/errors";
import { persistCompletedRun } from "./completion";

const DEFAULT_OPERATIONS = {
  run: runHealth,
  save: saveHealthRun,
  list: listHealthRuns,
};
export function useHealthRunner(operations = DEFAULT_OPERATIONS) {
  const [report, setReport] = useState(null);
  const [running, setRunning] = useState(false);
  const [progress, setProgress] = useState([0, 0]);
  const [saveError, setSaveError] = useState(null);
  const [history, setHistory] = useState({
    state: "LOADING",
    items: [],
    code: null,
  });
  const mounted = useRef(false),
    lock = useRef(false),
    historyTicket = useRef(0), generation = useRef(0), recovery = useRef({}), controller = useRef(null);
  const loadHistory = useCallback(async () => {
    if (!mounted.current) return;
    const ticket = ++historyTicket.current;
    setHistory((h) => ({ ...h, state: "LOADING" }));
    try {
      const items = await operations.list();
      if (mounted.current && ticket === historyTicket.current)
        setHistory({
          state: items.length ? "SUCCESS" : "EMPTY",
          items,
          code: null,
        });
    } catch (error) {
      if (mounted.current && ticket === historyTicket.current)
        setHistory({ state: "ERROR", items: [], code: classifyError(error) });
    }
  }, [operations]);
  useEffect(() => {
    mounted.current = true;
    void loadHistory();
    return () => {
      mounted.current = false;
      historyTicket.current++; generation.current++; controller.current?.abort();
    };
  }, [loadHistory]);
  const run = useCallback(
    async (suiteId = null) => {
      if (lock.current || !mounted.current) return;
      lock.current = true;
      const ticket=++generation.current; recovery.current={}; controller.current=new AbortController();
      setRunning(true);
      setSaveError(null);
      try {
        const completed = await operations.run({
          suiteId, signal:controller.current.signal,
          onProgress: (done, total) => {
            if (mounted.current && ticket===generation.current) setProgress([done, total]);
          },
        });
        if (mounted.current && ticket===generation.current) setReport(completed);
        // A user-started run may finish after navigation. Preserve its audit record,
        // but never update a disposed screen or start another history request there.
        const outcome = await persistCompletedRun(
          completed,
          value=>operations.save(value,recovery.current),
          loadHistory,
        );
        if (mounted.current && ticket===generation.current) setSaveError([outcome.saveError,outcome.detail].filter(Boolean).join(" · ")||null);
      } catch (error) {
        if (mounted.current && ticket===generation.current) setSaveError(classifyError(error));
      } finally {
        lock.current = false;
        if (mounted.current && ticket===generation.current) setRunning(false);
      }
    },
    [loadHistory, operations],
  );
  const retrySave=useCallback(async()=>{
    if(lock.current||!report||!mounted.current)return;
    lock.current=true;setRunning(true);
    const ticket=generation.current;
    try {const outcome=await persistCompletedRun(report,value=>operations.save(value,recovery.current),loadHistory);
      if(mounted.current&&ticket===generation.current)setSaveError([outcome.saveError,outcome.detail].filter(Boolean).join(' · ')||null);
    } finally {lock.current=false;if(mounted.current&&ticket===generation.current)setRunning(false);}
  },[report,operations,loadHistory]);
  return { report, running, progress, saveError, history, run, loadHistory, retrySave };

}

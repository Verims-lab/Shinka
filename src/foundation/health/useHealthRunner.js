import { useState, useCallback, useEffect, useRef } from "react";
import { runHealth } from "./runner";
import {
  saveHealthRun, checkHealthRun,
  listHealthRuns,
} from "@/services/internal/healthRunStore";
import { classifyError } from "@/foundation/errors";
import { persistCompletedRun } from "./completion";

const DEFAULT_OPERATIONS = {
  run: runHealth,
  save: saveHealthRun, check: checkHealthRun,
  list: listHealthRuns,
};
/** @param {{run?: typeof runHealth, save?: typeof saveHealthRun, list?: typeof listHealthRuns, check?: typeof checkHealthRun}} [operations] */
export function useHealthRunner(operations = DEFAULT_OPERATIONS) {
  const [report, setReport] = useState(null);
  const [running, setRunning] = useState(false);
  const [progress, setProgress] = useState([0, 0]);
  const [saveState,setSaveState] = useState('IDLE');
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
      setSaveError(null);setSaveState('IDLE');
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
        if(mounted.current&&ticket===generation.current)setSaveState('SAVING');
        const outcome = await persistCompletedRun(
          completed,
          value=>operations.save(value,recovery.current),
          loadHistory,
        );
        if (mounted.current && ticket===generation.current) {setSaveError([outcome.saveError,outcome.detail].filter(Boolean).join(" · ")||null);setSaveState(outcome.saveState);}
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
    lock.current=true;setRunning(true);setSaveState('SAVING');
    const ticket=generation.current;
    try {const outcome=await persistCompletedRun(report,value=>operations.save(value,recovery.current),loadHistory);
      if(mounted.current&&ticket===generation.current){setSaveError([outcome.saveError,outcome.detail].filter(Boolean).join(' · ')||null);setSaveState(outcome.saveState);}
    } finally {lock.current=false;if(mounted.current&&ticket===generation.current)setRunning(false);}
  },[report,operations,loadHistory]);
  const checkSaved=useCallback(async()=>{
    if(lock.current||!report||!mounted.current)return;
    lock.current=true;setRunning(true);const ticket=generation.current;
    try {
      const result=await (operations.check||checkHealthRun)(report);
      if(mounted.current&&ticket===generation.current){setSaveState(result.state==='SAVED'?'SAVED':'UNKNOWN');if(result.state==='SAVED')setSaveError(null);}
      if(result.state==='SAVED')void loadHistory();
    } catch(error) {if(mounted.current&&ticket===generation.current){setSaveState('UNKNOWN');setSaveError([classifyError(error),error?.detail].filter(Boolean).join(' · '));}}
    finally {lock.current=false;if(mounted.current&&ticket===generation.current)setRunning(false);}
  },[report,operations,loadHistory]);
  return { saveState, checkSaved, report, running, progress, saveError, history, run, loadHistory, retrySave };

}

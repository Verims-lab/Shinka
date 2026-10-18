import { useState, useCallback, useEffect } from "react";
import { runHealth } from "./runner";
import { saveHealthRun, listHealthRuns } from "@/services/internal/healthRunStore";
import { classifyError } from "@/foundation/errors";
import { persistCompletedRun } from "./completion";

export function useHealthRunner() {
  const [report,setReport]=useState(null);
  const [running,setRunning]=useState(false);
  const [progress,setProgress]=useState([0,0]);
  const [saveError,setSaveError]=useState(null);
  const [history,setHistory]=useState({state:"LOADING",items:[],code:null});
  const loadHistory=useCallback(async()=>{
    setHistory((h)=>({...h,state:"LOADING"}));
    try {const items=await listHealthRuns();setHistory({state:items.length?"SUCCESS":"EMPTY",items,code:null});}
    catch(error){setHistory({state:"ERROR",items:[],code:classifyError(error)});}
  },[]);
  useEffect(()=>{void loadHistory();},[loadHistory]);
  const run=useCallback(async(suiteId=null)=>{
    setRunning(true);setSaveError(null);
    try {
      const completed=await runHealth({suiteId,onProgress:(done,total)=>setProgress([done,total])});
      setReport(completed);setRunning(false);
      const outcome=await persistCompletedRun(completed,saveHealthRun,loadHistory);
      setSaveError(outcome.saveError);
    } catch(error){setSaveError(classifyError(error));}
    finally {setRunning(false);}
  },[loadHistory]);
  return {report,running,progress,saveError,history,run,loadHistory};
}

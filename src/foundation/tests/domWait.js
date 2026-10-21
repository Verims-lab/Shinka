import { cancelledTest } from '../testExecution';
// Observe the actual fixture transition, with an abortable failure bound. No
// polling delay or animation frame dependency (hidden tabs need neither).
export function waitForFixture(check, host, context = {}) {
  context.stage?.('DOM_WAIT');
  return new Promise((resolve,reject)=>{
    if(context.signal?.aborted)return reject(cancelledTest());
    let timer;
    const close=()=>{observer.disconnect();clearTimeout(timer);context.signal?.removeEventListener('abort',abort);};
    const finish=(error)=>{close();if(error)reject(error);else resolve(undefined);};
    const abort=()=>finish(cancelledTest());
    const inspect=()=>{try{if(check())finish();}catch(error){finish(error);}};
    const observer=new MutationObserver(inspect);
    observer.observe(host,{childList:true,subtree:true,attributes:true,characterData:true});
    context.signal?.addEventListener('abort',abort,{once:true});
    timer=setTimeout(()=>finish(new Error('FIXTURE_DOM_TIMEOUT')),4000);
    inspect();
  });
}

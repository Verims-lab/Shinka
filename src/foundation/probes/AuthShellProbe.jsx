import { Component, useLayoutEffect, useRef, useState } from 'react';
import OnboardingScreen from '@/features/onboarding/OnboardingScreen';
import { AUTH_PROBE_PATH, AUTH_PROBE_SCREEN } from './authProbeContract';

const pending={read:()=>null,save:()=>false,clear:()=>{}};

/** @extends {Component<{children:import('react').ReactNode},{failed:boolean}>} */
class ProbeBoundary extends Component {
  state={failed:false};
  static getDerivedStateFromError(){return {failed:true};}
  render(){return this.state.failed?<div data-auth-probe="unauthenticated-shell" data-probe-status="ERROR" data-probe-error="AUTH_PROBE_RENDER_FAILED" data-probe-route={AUTH_PROBE_PATH}/>:this.props.children;}
}

function Shell() {
  const root=useRef(null),[status,setStatus]=useState('LOADING');
  useLayoutEffect(()=>{
    // Signal only after the real component commits and its layout has had a frame to settle.
    const frame=requestAnimationFrame(()=>{
      const shell=root.current?.querySelector('[data-auth-shell]');
      setStatus(shell&&root.current.querySelector('[data-probe-root]')?'READY':'ERROR');
    });
    return ()=>cancelAnimationFrame(frame);
  },[]);
  return <div ref={root} data-auth-probe="unauthenticated-shell" data-probe-route={AUTH_PROBE_PATH} data-probe-status={status} data-probe-error={status==='ERROR'?'AUTH_PROBE_SHELL_MISSING':undefined}>
    <OnboardingScreen state={AUTH_PROBE_SCREEN} initialLanguage="en" pending={pending}/>
  </div>;
}

// No AuthProvider, session hydration, persistence or authenticated principal is created.
// This is the real ON-03 shell, including the unchanged age/provider service boundary.
export default function AuthShellProbe(){return <ProbeBoundary><Shell/></ProbeBoundary>;}

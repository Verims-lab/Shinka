import { Component, useLayoutEffect, useRef, useState } from 'react';
import OnboardingScreen from '@/features/onboarding/OnboardingScreen';
import { AUTH_PROBE_PATH, AUTH_PROBE_SCREEN, inspectAuthShell } from './authProbeContract';


/** @extends {Component<{children:import('react').ReactNode},{failed:boolean}>} */
class ProbeBoundary extends Component {
  state={failed:false};
  static getDerivedStateFromError(){return {failed:true};}
  render(){return this.state.failed?<div data-auth-probe="unauthenticated-shell" data-probe-status="ERROR" data-probe-error="AUTH_PROBE_RENDER_FAILED" data-probe-route={AUTH_PROBE_PATH}/>:this.props.children;}
}

function Shell() {
  const root=useRef(null),[status,setStatus]=useState('LOADING');
  useLayoutEffect(()=>{
    // Hidden nested Preview frames may never receive an animation frame. Layout effects run
    // after DOM commit; getBoundingClientRect/getComputedStyle synchronously resolve layout.
    // The durable attribute remains observable even when the parent starts reading later.
    const actual=inspectAuthShell(root.current);
    setStatus(actual.rendered?'READY':'ERROR');
  },[]);
  return <div ref={root} data-auth-probe="unauthenticated-shell" data-probe-route={AUTH_PROBE_PATH} data-probe-status={status} data-probe-error={status==='ERROR'?'AUTH_PROBE_SHELL_MISSING':undefined} data-probe-lifecycle={status==='READY'?'COMMIT_VERIFIED':status==='ERROR'?'COMMIT_REJECTED':'MOUNTING'}>
    <OnboardingScreen state={AUTH_PROBE_SCREEN} initialLanguage="en"/>
  </div>;
}

// No AuthProvider, session hydration, persistence or authenticated principal is created.
// This is the real ON-02 shell, including the unchanged age/provider service boundary.
export default function AuthShellProbe(){return <ProbeBoundary><Shell/></ProbeBoundary>;}

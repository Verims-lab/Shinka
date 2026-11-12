import { applyAppTheme, appThemeExpectation } from '@/lib/appTheme';
// Rendered CSS regression: the canonical suite runs unchanged in Health Center and CLI.
import { createElement as h } from "react";
import { createRoot } from "react-dom/client";
import { flushSync } from "react-dom";
import PageContainer from "@/components/shinka/PageContainer";
import AppBackdrop from "@/components/shinka/AppBackdrop";
import OnboardingScreen from "@/features/onboarding/OnboardingScreen";
import PageHeader from "@/components/shinka/PageHeader";
import ShinkaCard from "@/components/shinka/ShinkaCard";
import ShinkaButton from "@/components/shinka/ShinkaButton";
import ShinkaInput from "@/components/shinka/ShinkaInput";
import { DESIGN_TOKENS, hexToRgbChannels } from "@/foundation/designTokens";
import { checkCssTokens } from "@/foundation/inspection/uiRules";
import { H13_CASES } from "@/foundation/health/cases/h13";
import { createHealthContext } from "@/foundation/health/context";

const assert = (ok, detail) => { if (!ok) throw new Error(detail); };
const rgb = (hex) => `rgb(${hexToRgbChannels(hex).split(" ").join(", ")})`;
const measure = (element) => getComputedStyle(element);
/** @param {import('react').ReactNode} children @param {(host: HTMLDivElement) => void|Promise<void>} check */
async function rendered(children, check) {
  const host=document.createElement("div");
  Object.assign(host.style,{position:"fixed",left:"-10000px",top:"0",width:"360px",visibility:"hidden"});
  host.setAttribute("aria-hidden","true");document.body.appendChild(host);
  const root=createRoot(host);
  try {flushSync(()=>root.render(children));await check(host);}
  finally {flushSync(()=>root.unmount());host.remove();}
}
const palette = () => DESIGN_TOKENS.color;
const COLORS = [
  ["bg-shinka-plum","primaryPlum"],["bg-shinka-plum-deep","deepPlumText"],["bg-shinka-mauve","mutedMauve"],
  ["bg-shinka-rose","dustyRose"],["bg-shinka-blush","blushPink"],["bg-shinka-lavender","softLavender"],
  ["bg-shinka-ivory","warmIvory"],["bg-shinka-cream","softCream"],["bg-shinka-taupe","mutedTaupe"],
  ["bg-shinka-line","divider"],["bg-shinka-white","white"],
];
const HEADINGS=["text-shinka-h1","text-shinka-h2","text-shinka-h3","text-shinka-h4"];
const BODY=["text-shinka-body-lg","text-shinka-body","text-shinka-caption"];

/** @type {import('./testTypes').FoundationTest[]} */
export const CSS_CONTRACT_TESTS = [
  ["T75","Canonical CSS channels and all eleven color utilities render exactly",async()=>{
    const vars=checkCssTokens(v=>measure(document.documentElement).getPropertyValue(v));
    assert(vars.checked===15&&!vars.mismatches.length,JSON.stringify(vars));
    await rendered(h("div",null,COLORS.map(([className,key])=>h("div",{key,className,"data-color":key}))),host=>{
      for(const el of Array.from(host.querySelectorAll("[data-color]"))) assert(measure(el).backgroundColor===rgb(palette()[el.getAttribute("data-color")]),`color utility ${el.className}`);
    });
  }],
  ["T76","Heading and body font families, weights, sizes and line heights survive CSS changes",async()=>{
    await rendered(h("div",null,
      ...HEADINGS.map((className,i)=>h("h2",{key:className,className:`font-heading font-medium ${className}`,"data-heading":i},"Heading fixture")),
      ...BODY.map((className,i)=>h("p",{key:className,className:`font-body font-normal ${className}`,"data-body":i},"Body fixture")),
      h("div",{className:"text-xs"},h("span",{className:"text-[11px]","data-nested-label":true},"Status")),
      h(PageHeader,{eyebrow:"Fixture",title:"Responsive heading"})),host=>{
      for(const el of Array.from(host.querySelectorAll("[data-heading]"))){const cs=measure(el),pair=DESIGN_TOKENS.typography.headingSizes[Number(el.getAttribute("data-heading"))];assert(/Cormorant Garamond/.test(cs.fontFamily)&&cs.fontWeight==="500"&&cs.fontSize===`${pair[0]}px`&&cs.lineHeight===`${pair[1]}px`,`heading ${el.className}`);}
      for(const el of Array.from(host.querySelectorAll("[data-body]"))){const cs=measure(el),pair=DESIGN_TOKENS.typography.bodySizes[Number(el.getAttribute("data-body"))];assert(/Inter/.test(cs.fontFamily)&&cs.fontWeight==="400"&&cs.fontSize===`${pair[0]}px`&&cs.lineHeight===`${pair[1]}px`,`body ${el.className}`);}
      assert(measure(host.querySelector("[data-nested-label]")).lineHeight==="16px","nested status label line height");
      assert(Math.abs(parseFloat(measure(host.querySelector("h1")).lineHeight)-(matchMedia("(min-width: 640px)").matches?40:35))<0.02,`responsive PageHeader line height ${measure(host.querySelector("h1")).lineHeight}`);
      const text=Array.from(host.querySelectorAll('[data-heading],[data-body],[data-nested-label],h1'));
      const before=text.map(el=>({size:parseFloat(measure(el).fontSize),line:parseFloat(measure(el).lineHeight)}));
      // Resize parents as well so nested labels inherit the correctly scaled line box.
      const all=Array.from(host.querySelectorAll('*')).filter(el=>el instanceof HTMLElement),sizes=all.map(el=>parseFloat(measure(el).fontSize));
      all.forEach((el,i)=>{el.style.fontSize=`${sizes[i]*2}px`;});
      text.forEach((el,i)=>assert(Math.abs(parseFloat(measure(el).lineHeight)-before[i].line*2)<0.02,'200% line box does not scale'));

    });
  }],
  ["T77","Real Shinka primitives preserve geometry, borders, colors and disabled state",async()=>{
    await rendered(h(PageContainer,{children:h(ShinkaCard,{title:"Fixture",children:[
      h(ShinkaButton,{key:"primary",id:"css-primary"},"Primary"),h(ShinkaButton,{key:"secondary",variant:"secondary",id:"css-secondary"},"Secondary"),
      h(ShinkaButton,{key:"disabled",disabled:true,id:"css-disabled"},"Disabled"),h(ShinkaInput,{key:"input","aria-label":"Synthetic input",id:"css-input"})]})}),host=>{
      const page=host.querySelector("[data-probe-root]"),inner=page.firstElementChild,card=host.querySelector("section");
      assert(measure(inner).paddingLeft==="20px"&&measure(inner).paddingRight==="20px","page padding");
      assert(measure(page).backgroundColor===rgb(palette().warmIvory),"page color");
      const cs=measure(card);assert(cs.borderRadius==="20px"&&cs.paddingLeft==="20px"&&cs.borderTopWidth==="1px"&&cs.borderTopColor===rgb(palette().divider)&&cs.boxShadow.includes("10px"),"card geometry");
      for(const selector of ["#css-primary","#css-input"]){const el=host.querySelector(selector),s=measure(el);assert(el.getBoundingClientRect().height>=52&&s.borderRadius==="16px"&&s.paddingLeft==="16px"&&s.transitionDuration==="0.2s",`${selector} geometry`);}
      const secondary=host.querySelector("#css-secondary").getBoundingClientRect();assert(secondary.height>=44&&secondary.width>=44,"secondary touch size");
      assert(measure(host.querySelector("#css-disabled")).opacity==="0.45","disabled opacity");
      assert(measure(host.querySelector("#css-primary")).backgroundColor===rgb(palette().primaryPlum),"primary color");
    });
  }],
  ["T78","Canonical spacing/radius utilities retain their pixel values",async()=>{
    const spacing=["p-1","p-2","p-3","p-4","p-5","p-6","p-8","p-10"];
    const radii=["rounded-shinka-sm","rounded-shinka-md","rounded-shinka-lg"];
    await rendered(h("div",null,...spacing.map((className,i)=>h("div",{key:className,className,"data-space":i})),...radii.map((className,i)=>h("div",{key:className,className,"data-radius":i}))),host=>{
      for(const el of Array.from(host.querySelectorAll("[data-space]")))assert(measure(el).paddingTop===`${DESIGN_TOKENS.spacing[Number(el.getAttribute("data-space"))]}px`,el.className);
      for(const el of Array.from(host.querySelectorAll("[data-radius]")))assert(measure(el).borderRadius===`${[12,16,20][Number(el.getAttribute("data-radius"))]}px`,el.className);
    });
  }],
  ["T79","Both manual themes and native form schemes follow the resolver, restoring prior authority",async()=>{
    const before=appThemeExpectation();
    try{for(const theme of ['light','dark']){
      applyAppTheme(theme);
      assert(document.documentElement.classList.contains('dark')===(theme==='dark')&&measure(document.documentElement).colorScheme===theme,'resolved root');
      await rendered(h('div',null,h('input',{type:'date'}),h('select',null,h('option',null,'Time')),h('div',{className:'hidden'})),host=>{
        for(const el of Array.from(host.querySelectorAll('input,select')))assert(measure(el).colorScheme===theme,'form scheme');
        assert(measure(host.lastElementChild.lastElementChild).display==='none','hidden class lost');
      });
    }}finally{applyAppTheme(before.source==='UNVERIFIED_DEFAULT'?null:before.theme);}
  }],
  ["T83","H13 theme expectations reject tampered DOM and survive the admin navigation fixture",async(context={})=>{
    const before=appThemeExpectation(),health=H13_CASES.find(c=>c.id==='H13-010'),colors=H13_CASES.find(c=>c.id==='H13-006');
    try{for(const value of [null,'light','dark']){
      applyAppTheme(value);assert((await health.run({})).status==='PASS','valid expectation');
      assert((await colors.run({})).status==='PASS','palette must match independently accepted theme');
      document.documentElement.classList.toggle('dark');
      assert((await health.run({})).status==='FAIL','DOM must not define expectation');
      assert((await colors.run({})).status==='FAIL','wrong palette must fail');
      applyAppTheme(value);document.documentElement.style.colorScheme=value==='dark'?'light':'dark';
      assert((await health.run({})).status==='FAIL','scheme mismatch must fail');
    }
      applyAppTheme('dark');
      const {ADMIN_NAV_TESTS}=await import('./adminNavigationTests');
      await ADMIN_NAV_TESTS.find(([id])=>id==='AN08')[2](context);
      assert(appThemeExpectation().theme==='dark'&&document.documentElement.classList.contains('dark'),'synthetic admin fixture changed the real account theme');
      assert((await health.run({})).status==='PASS','Health fixture must preserve theme authority');
    }finally{applyAppTheme(before.source==='UNVERIFIED_DEFAULT'?null:before.theme);}
  }],
  ["T81","User-facing shells reveal the app backdrop; standalone and internal containers retain their surfaces",async()=>{
    await rendered(h("div",null,h(PageContainer,{className:"shinka-onboarding",surface:"section","data-onb":1,children:"a"}),h(PageContainer,{"data-plain":1,children:"b"})),host=>{
      const onb=host.querySelector("[data-onb]"),plain=host.querySelector("[data-plain]");
      for(const c of ["shinka-viewport","text-shinka-ink","font-body","shinka-onboarding"]) assert(onb.classList.contains(c),`class ${c}`);
      assert(!onb.classList.contains("bg-shinka-ivory")&&plain.classList.contains("bg-shinka-ivory"),'surface ownership');
      assert(onb.firstElementChild.classList.contains("shinka-safe-content"),'safe content kept');
      assert(measure(plain).backgroundImage==="none"&&measure(onb).backgroundImage==="none",'no gradient/image on shells');
      assert(measure(onb).backgroundColor==="rgba(0, 0, 0, 0)",'onboarding shell transparent');
    });
    await rendered(h("div",null,h(AppBackdrop),h("div",{className:"shinka-route-clip"},h(PageContainer,{children:"Loading"}))),host=>{
      assert(measure(host.querySelector("[data-probe-root]")).backgroundColor==="rgba(0, 0, 0, 0)",'default loading shell reveals the backdrop');
    });
  }],
  ["T82","One unaltered decorative PNG anchored at the document top in both themes",async()=>{
    const png = /\/shinka-background(?:-[\w-]+)?\.png/;
    await rendered(h(AppBackdrop),host=>{
      const layer=host.querySelector("[data-app-backdrop]"),s=measure(layer);
      assert(layer.getAttribute("aria-hidden")==="true"&&!layer.textContent&&s.pointerEvents==="none"&&s.position==="absolute"&&s.zIndex==="-1",'decorative document layer');
      const art=getComputedStyle(layer,"::before");
      assert(png.test(art.backgroundImage)&&art.backgroundRepeat==="no-repeat"&&art.backgroundSize==="contain",'bundled original, no tiling or stretch');
      const before=appThemeExpectation();applyAppTheme('dark');
      try{assert(getComputedStyle(layer,"::after").content==="none"&&art.filter==="none"&&art.maskImage==="none"&&art.opacity==="1",'dark mode preserves the original pixels');}finally{applyAppTheme(before.source==='UNVERIFIED_DEFAULT'?null:before.theme);}
    });
    for(const state of ['UNAUTHENTICATED_INTRO','AUTHENTICATED_NAME_REQUIRED','UNAUTHENTICATED_SIGN_IN','AUTHENTICATED_PROFILE_REQUIRED','AUTHENTICATED_CYCLE_STEP']) {
      await rendered(h('div',null,h(AppBackdrop),h('div',{className:'shinka-route-clip'},h(OnboardingScreen,{state,authenticated:state.startsWith('AUTHENTICATED'),initialLanguage:'en',request:async()=>{throw new Error('UNEXPECTED_FIXTURE_IO');}}))),host=>{
        assert(host.querySelectorAll('[data-app-backdrop]').length===1&&!host.querySelector('img'),'one backdrop, no second content bitmap');
        const space=host.querySelector('.shinka-onboarding-art-space'),layer=host.querySelector('[data-app-backdrop]');
        const art=getComputedStyle(layer,'::before'),wash=getComputedStyle(layer,'::after');
        const root=getComputedStyle(document.documentElement);
        const safeTop=parseFloat(root.getPropertyValue('--safe-top'))||0, safeLeft=parseFloat(root.getPropertyValue('--safe-left'))||0;
        assert(!space&&parseFloat(art.top)===safeTop&&parseFloat(art.left)===safeLeft&&wash.content==='none','each step uses the safe original artwork');
        assert(png.test(art.backgroundImage),'approved composition remains');
      });
    }
    const backgroundHealth = H13_CASES.find(c => c.id === 'H13-020');
    assert((await backgroundHealth.run({})).status === 'PASS', 'shared backdrop Health probe');
  }],
  ["T80","Existing rendered Health typography/color/touch/account-theme-policy checks remain passing",async()=>{
    const context=createHealthContext();
    for(const id of ["H13-002","H13-003","H13-006","H13-007","H13-009","H13-010"]){const c=H13_CASES.find(c=>c.id===id),r=await c.run(context);assert(r.status==="PASS",`${id}: ${JSON.stringify(r.evidence.actual)}`);}
  }],
];

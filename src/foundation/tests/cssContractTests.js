import { followSystemTheme } from "@/features/mobile/systemTheme";
// Rendered CSS regression: the canonical suite runs unchanged in Health Center and CLI.
import { createElement as h } from "react";
import { createRoot } from "react-dom/client";
import { flushSync } from "react-dom";
import PageContainer from "@/components/shinka/PageContainer";
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
const palette = () => document.documentElement.classList.contains("dark") ? DESIGN_TOKENS.darkColor : DESIGN_TOKENS.color;
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
  ["T79","System theme initial/change/cleanup aligns class and native form scheme",async()=>{
    const root = document.createElement('div');
    let listener = () => {};
    const media = { matches: true, addEventListener: (_event, fn) => { listener = fn; }, removeEventListener: (_event, fn) => { if (listener === fn) listener = null; } };
    const stop = followSystemTheme(root, /** @type {any} */ (media));
    assert(root.classList.contains('dark') && root.style.colorScheme === 'dark', 'initial dark');
    media.matches = false; listener();
    assert(root.classList.contains('light') && !root.classList.contains('dark') && root.style.colorScheme === 'light', 'live light');
    stop(); assert(listener === null, 'theme listener cleanup');
    await rendered(h('div', {className:'hidden'}), host => assert(measure(host.firstElementChild).display === 'none', 'hidden class lost'));
  }],
  ["T81","Onboarding shell has layered light background; plain PageContainer and dark stay flat",async()=>{
    const root=document.documentElement,dark=root.classList.contains("dark");
    await rendered(h("div",null,h(PageContainer,{className:"shinka-onboarding","data-onb":1},"a"),h(PageContainer,{"data-plain":1},"b")),host=>{
      const onb=host.querySelector("[data-onb]"),plain=host.querySelector("[data-plain]");
      for(const c of ["shinka-viewport","bg-shinka-ivory","text-shinka-ink","font-body","shinka-onboarding"]) assert(onb.classList.contains(c),`class ${c}`);
      assert(onb.firstElementChild.classList.contains("shinka-safe-content"),"safe content kept");
      assert(measure(plain).backgroundImage==="none","non-onboarding background changed");
      const img=measure(onb).backgroundImage;
      if(dark) assert(img==="none"&&measure(onb).backgroundColor===rgb(DESIGN_TOKENS.darkColor.warmIvory),"dark surface");
      else assert((img.match(/radial-gradient/g)||[]).length===5&&/linear-gradient/.test(img)&&measure(onb).backgroundRepeat==="no-repeat","light layers");
    });
  }],
  ["T80","Existing rendered Health typography/color/touch/system-theme checks remain passing",async()=>{
    const context=createHealthContext();
    for(const id of ["H13-002","H13-003","H13-006","H13-007","H13-009","H13-010"]){const c=H13_CASES.find(c=>c.id===id),r=await c.run(context);assert(r.status==="PASS",`${id}: ${JSON.stringify(r.evidence.actual)}`);}
  }],
];
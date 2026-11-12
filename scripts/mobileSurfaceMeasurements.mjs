// Only geometry/colors/ratios/control identifiers leave this isolated browser.
export async function inspectMobileSurface(page, checkDarkReadingSurface = false) {
  return page.evaluate(checkDarkReadingSurface => {
    const rgba = color => {
      const parts = color.match(/[\d.]+/g)?.map(Number) || [0,0,0,0];
      return [...parts.slice(0,3), parts[3] ?? 1];
    };
    const over = (front, back) => front.slice(0,3).map((v,i)=>v*front[3]+back[i]*(1-front[3]));
    const reading=checkDarkReadingSurface&&document.documentElement.classList.contains('dark')
      ? document.querySelector('[data-app-backdrop] + .shinka-route-clip > [data-route-motion]') : null;
    const readingStyle=reading&&getComputedStyle(reading);
    const readingColor=readingStyle?.backgroundImage.match(/rgba?\([^)]+\)/)?.[0];
    const readingBounds=reading?.getBoundingClientRect();
    const gutter=Number(readingStyle?.backgroundSize.match(/^calc\(100% - ([\d.]+)px\) 100%$/)?.[1])/2;
    const background = el => {
      const chain = []; for(let n=el;n;n=n.parentElement) chain.unshift(n);
      const box=el.getBoundingClientRect();
      const covered=readingBounds&&box.left>=readingBounds.left+gutter-1&&box.right<=readingBounds.right-gutter+1
        &&box.top>=readingBounds.top-1&&box.bottom<=readingBounds.bottom+1;
      // Outside the opaque reading surface, bound bright artwork by white.
      return chain.reduce((bg,n)=>{
        if(reading&&n===document.documentElement)return [255,255,255];
        if(n===reading&&covered&&readingColor)return over(rgba(readingColor),bg);
        return over(rgba(getComputedStyle(n).backgroundColor),bg);
      },[255,255,255]);
    };
    const luminance = rgb => rgb.map(v=>{v/=255;return v<=0.04045?v/12.92:((v+0.055)/1.055)**2.4;}).reduce((sum,v,i)=>sum+v*[0.2126,0.7152,0.0722][i],0);
    const contrast = (a,b) => {const x=luminance(a),y=luminance(b);return (Math.max(x,y)+0.05)/(Math.min(x,y)+0.05);};
    const rows = [...document.querySelectorAll('body *')].filter(el=>el instanceof HTMLElement && el.getBoundingClientRect().height>0 && !el.closest(':disabled,[aria-hidden=true]') && [...el.childNodes].some(n=>n.nodeType===3&&n.textContent.trim()));
    const contrastRows = rows.map(el=>{
      const cs=getComputedStyle(el), bg=background(el), fg=over(rgba(cs.color),bg);
      const min = parseFloat(cs.fontSize)>=24 || parseFloat(cs.fontSize)>=18.66 && Number(cs.fontWeight)>=700 ? 3 : 4.5;
      return {tag:el.tagName, className:el.className, ratio:Math.round(contrast(fg,bg)*100)/100, min};
    });
    const small=[...document.querySelectorAll('button,input:not([type=checkbox]),select,nav a')].filter(el=>{const r=el.getBoundingClientRect();return r.height>0&&r.width>0&&(r.height<43.9||r.width<43.9);}).map(el=>el.id||el.tagName);
    const root = getComputedStyle(document.documentElement), color = name=>root.getPropertyValue(name).trim().split(/\s+/).map(Number);
    const boundaries = ['--shinka-white','--shinka-ivory'].map(surface=>({surface, focus:contrast(color('--shinka-plum'),color(surface)), input:contrast(color('--shinka-control'),color(surface))}));
    // 063 permits only the named, focusable timeline to scroll. Still measure
    // every glyph against its own node, so this does not exempt clipped labels.
    const timelineNode = el => {
      const node=el.closest('[data-lunar-node]'),region=node?.closest('.lunar-scroll[role="region"][tabindex="0"]');
      if(!region)return null;
      const r=region.getBoundingClientRect();
      return getComputedStyle(region).overflowX==='auto'&&r.left>=0&&r.right<=document.documentElement.clientWidth+1?node:null;
    };
    const textOverflow=rows.filter(el=>{
      const css=getComputedStyle(el),rect=el.getBoundingClientRect();
      if(el.matches('[data-lunar-timeline] .sr-only')&&css.position==='absolute'&&(css.clip!=='auto'||css.clipPath!=='none')&&css.overflow==='hidden'&&rect.width<=1&&rect.height<=1)return false;
      const node=timelineNode(el),bounds=node?.getBoundingClientRect();
      return [...el.childNodes].filter(n=>n.nodeType===3).some(n=>{
        const range=document.createRange();range.selectNodeContents(n);
        return [...range.getClientRects()].some(r=>bounds?r.left<bounds.left-1||r.right>bounds.right+1||r.bottom>bounds.bottom+1:r.right>document.documentElement.clientWidth+1);
      });
    }).map(el=>({tag:el.tagName,className:el.className}));
    const overflow=[...document.querySelectorAll('body *')].filter(el=>el.getBoundingClientRect().right>document.documentElement.clientWidth+1).slice(0,25).map(el=>({tag:el.tagName,id:el.id,className:el.className,right:el.getBoundingClientRect().right,width:el.getBoundingClientRect().width}));
    const uncontainedScrollRegions=[...document.querySelectorAll('.lunar-scroll')].filter(el=>{const r=el.getBoundingClientRect();return r.left<0||r.right>document.documentElement.clientWidth+1;}).map(el=>el.className);
    return { uncontainedScrollRegions, textOverflow, clientWidth:document.documentElement.clientWidth, overflow, width:innerWidth, scrollWidth:document.documentElement.scrollWidth, small, dark:document.documentElement.classList.contains('dark'), scheme:root.colorScheme, documentScroll:document.scrollingElement === document.documentElement, overscrollY:root.overscrollBehaviorY, contrastCount:contrastRows.length, minText:Math.min(...contrastRows.map(x=>x.ratio)), contrastFailures:contrastRows.filter(x=>x.ratio<x.min), boundaries };
  }, checkDarkReadingSurface);
}
export async function doubleText(page) {
  await page.evaluate(()=>{
    const nodes=[...document.querySelectorAll('body *')].filter(el=>el instanceof HTMLElement);
    const sizes=nodes.map(el=>parseFloat(getComputedStyle(el).fontSize));
    nodes.forEach((el,i)=>{el.style.fontSize=`${sizes[i]*2}px`;});
  });
}

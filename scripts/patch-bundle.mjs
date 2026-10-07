import { readFileSync, writeFileSync, existsSync } from 'node:fs';
import { join } from 'node:path';
import { pathToFileURL } from 'node:url';

const originalHt =
  'function ht({size:t=26}){return a.jsxs("div",{style:{display:"flex",alignItems:"center",gap:10},children:[a.jsxs("svg",{width:t,height:t,viewBox:"0 0 32 32",fill:"none",children:[a.jsx("rect",{width:"32",height:"32",rx:"8",fill:"#8fce00"}),a.jsx("path",{d:"M6 21 L13 14 L18 18 L26 9",stroke:"#191919",strokeWidth:"2.6",strokeLinecap:"round",strokeLinejoin:"round",fill:"none"}),a.jsx("circle",{cx:"26",cy:"9",r:"2.4",fill:"#191919"})]}),a.jsxs("span",{style:{fontWeight:700,fontSize:t*.7,letterSpacing:".5px"},children:["Trading",a.jsx("span",{style:{color:"var(--lime)"},children:"Pro"})]})]})}';

const newHt = `function WlHeroBrand(){const[_b,_sb]=b.useState(()=>(window.__WHITELABEL_BRANDING__||(window.__WHITELABEL_BRANDING_CONTROLLER__?window.__WHITELABEL_BRANDING_CONTROLLER__.getBranding():{})));b.useEffect(()=>{const h=(e)=>{if(e.detail)_sb({...e.detail});};window.addEventListener("whitelabel:update",h);_sb({...window.__WHITELABEL_BRANDING__});return()=>window.removeEventListener("whitelabel:update",h);},[]);const _n=(_b.name||"TradingPro").trim(),_p=_n.split(" "),_f=_p.length>1?_p.slice(0,-1).join(" "):_n,_l=_p.length>1?_p[_p.length-1]:"";return a.jsxs("h1",{className:"hero-brand","aria-label":_n,children:[a.jsx("span",{children:_f}),_l?a.jsx("span",{className:"brand-accent",style:{marginLeft:10},children:_l}):null]});}function WlSplashWord(){const[_b,_sb]=b.useState(()=>(window.__WHITELABEL_BRANDING__||(window.__WHITELABEL_BRANDING_CONTROLLER__?window.__WHITELABEL_BRANDING_CONTROLLER__.getBranding():{})));b.useEffect(()=>{const h=(e)=>{if(e.detail)_sb({...e.detail});};window.addEventListener("whitelabel:update",h);_sb({...window.__WHITELABEL_BRANDING__});return()=>window.removeEventListener("whitelabel:update",h);},[]);const _n=(_b.name||"TradingPro").trim(),_p=_n.split(" "),_f=_p.length>1?_p.slice(0,-1).join(" "):_n,_l=_p.length>1?_p[_p.length-1]:"";return a.jsxs("div",{className:"splash-word",children:[a.jsx("span",{children:_f}),_l?a.jsx("span",{style:{color:"var(--lime)",marginLeft:4},children:_l}):null]});}function ht({size:t=26}){const[_b,_sb]=b.useState(()=>(window.__WHITELABEL_BRANDING__||(window.__WHITELABEL_BRANDING_CONTROLLER__?window.__WHITELABEL_BRANDING_CONTROLLER__.getBranding():{})));b.useEffect(()=>{const h=(e)=>{if(e.detail)_sb({...e.detail});};window.addEventListener("whitelabel:update",h);_sb({...window.__WHITELABEL_BRANDING__});return()=>window.removeEventListener("whitelabel:update",h);},[]);const _n=(_b.name||"TradingPro").trim(),_lg=_b.logo||_b.favicon||"",_c=_b.color||"var(--lime)",_p=_n.split(" "),_f=_p.length>1?_p.slice(0,-1).join(" "):_n,_l=_p.length>1?_p[_p.length-1]:"";return a.jsxs("div",{style:{display:"flex",alignItems:"center",gap:10},children:[_lg?a.jsx("img",{src:_lg,alt:_n,style:{height:t,maxWidth:t*3.5,objectFit:"contain",borderRadius:6}}):a.jsxs("svg",{width:t,height:t,viewBox:"0 0 32 32",fill:"none",children:[a.jsx("rect",{width:"32",height:"32",rx:"8",fill:_c}),a.jsx("path",{d:"M6 21 L13 14 L18 18 L26 9",stroke:"#191919",strokeWidth:"2.6",strokeLinecap:"round",strokeLinejoin:"round",fill:"none"}),a.jsx("circle",{cx:"26",cy:"9",r:"2.4",fill:"#191919"})]}),a.jsxs("span",{style:{fontWeight:700,fontSize:t*.7,letterSpacing:".5px"},children:[_f,_l?a.jsx("span",{style:{color:"var(--lime)",marginLeft:4},children:_l}):null]})]});}`;

const originalHero =
  'a.jsxs("h1",{className:"hero-brand","aria-label":"TradingPro",children:[a.jsx("span",{children:"Trading"}),a.jsx("span",{className:"brand-accent",children:"Pro"})]})';
const newHero = 'a.jsx(WlHeroBrand,{})';

const originalSplash =
  'a.jsxs("div",{className:"splash-word",children:["Trading",a.jsx("span",{children:"Pro"})]})';
const newSplash = 'a.jsx(WlSplashWord,{})';

export function patchBundleFile(targetPath) {
  if (!existsSync(targetPath)) return false;
  let code = readFileSync(targetPath, 'utf-8');
  const before = code;
  code = code.replace('return a.jsxs("div",{children:[a.jsxs("div",{className:"topbar-market"', 'return a.jsxs("div",{className:"gotrade-trading-area",children:[a.jsxs("div",{className:"topbar-market"');
  code = code.replace('Ih="tradingpro_token"','Ih="gotrade_prototype_token_"+(new URLSearchParams(location.search).get("tenant")||"default")');
  // Embedded previews use the existing mock user without writing a login token.
  code = code.replace('if(!Ln()){i(!1);return}D.me()', 'if(!Ln()&&!window.__GOTRADE_PREVIEW__){i(!1);return}D.me()');
  // Billing is outside the simplified Gotrade platform for now.
  code = code.replace('a.jsx(Ve,{path:"/assinar",element:a.jsx(s_,{})})', 'a.jsx(Ve,{path:"/assinar",element:a.jsx(la,{to:{pathname:"/app",search:window.location.search},replace:!0})})');
  let changed = false;

  // 1. ht and hero brand definition
  if (code.includes(originalHt)) {
    code = code.replace(originalHt, newHt);
    changed = true;
    console.log(`[Patch] Successfully replaced originalHt in ${targetPath}`);
  } else if (code.includes('function WlHeroBrand()')) {
    // Already has an earlier patch - update it cleanly up to function ju
    const start = code.indexOf('function WlHeroBrand()');
    const end = code.indexOf('function ju({code:t,size:e=20})');
    if (start !== -1 && end !== -1 && end > start) {
      code = code.substring(0, start) + newHt + code.substring(end);
      changed = true;
      console.log(`[Patch] Successfully updated WlHeroBrand/ht in ${targetPath}`);
    }
  }

  // 2. hero-brand JSX
  if (code.includes(originalHero)) {
    code = code.replace(originalHero, newHero);
    changed = true;
    console.log(`[Patch] Successfully replaced hero-brand JSX in ${targetPath}`);
  }

  // 3. splash-word JSX
  if (code.includes(originalSplash)) {
    code = code.replace(originalSplash, newSplash);
    changed = true;
    console.log(`[Patch] Successfully replaced splash-word JSX in ${targetPath}`);
  }

  const authComponent = 'function WlAuth({mode:t}){const e=Rt(),s=yn();return window.__TP_RENDER_AUTH__(a,b,{mode:t,login:e.login,navigate:s})}';
  if (!code.includes('function WlAuth(')) code = code.replace('function kN()', authComponent + 'function kN()');
  code = code.replace('a.jsx(sk,{children:', 'a.jsx(sk,{basename:"/prototipo",children:');
  code = code.replace('As?a.jsx(la,{to:"/app",replace:!0}):a.jsx(K2,{})', 'a.jsx(la,{to:{pathname:"/login",search:window.location.search},replace:!0})');
  code = code.replace('a.jsx(jg,{children:a.jsx(t_,{})})', 'a.jsx(WlAuth,{mode:"login"})');
  code = code.replace('a.jsx(jg,{children:a.jsx(G2,{})})', 'a.jsx(WlAuth,{mode:"forgot"})');
  code = code.replace('element:a.jsx(Z2,{})', 'element:a.jsx(WlAuth,{mode:"reset"})');
  code = code.replace('t1=function(t){return"/"+t}', 't1=function(t){return"/prototipo/"+t}');
  code = code.replace(/"\/(?!prototipo\/)([^"\n]+\.(?:mp4|png|jpg|jpeg))"/g, '"/prototipo/$1"');
  code = code.replace(/rgba\(150,\s*214,\s*0,\s*([.\d]+)\)/g, 'rgba(var(--brand-rgb),$1)');
  code = code.replace(/rgba\(143,\s*206,\s*0,\s*([.\d]+)\)/g, 'rgba(var(--brand-rgb),$1)');
  code = code.replaceAll('color:"var(--lime)"', 'color:"var(--brand-accent)"');
  code = code.replaceAll('background:"var(--lime)"', 'background:"var(--brand-primary)"');
  code = code.replaceAll('color:"var(--dark)"', 'color:"var(--brand-on-primary)"');
  // Lightweight Charts parses color strings itself, so resolve CSS tokens at its boundary.
  const colorResolver = 'if(t.includes("var("))t=t.replace(/var\\((--[\\w-]+)\\)/g,(_,e)=>getComputedStyle(document.documentElement).getPropertyValue(e).trim());';
  if (!code.includes(colorResolver)) code = code.replace('function va(t){', 'function va(t){' + colorResolver);
  code = code.replace('layout:{background:{color:"#202020"},textColor:"#9a9a9a",fontFamily:"Inter, sans-serif"}', 'layout:{background:{color:"var(--panel)"},textColor:"var(--muted)",fontFamily:getComputedStyle(document.documentElement).getPropertyValue("--font-body")}');
  code = code.replaceAll('color:"#2b2b2b"', 'color:"var(--panel-2)"');
  code = code.replaceAll('downColor:"#ff4d4d"', 'downColor:"var(--brand-complement)"');
  code = code.replaceAll('borderDownColor:"#ff4d4d"', 'borderDownColor:"var(--brand-complement)"');
  code = code.replaceAll('wickDownColor:"#ff4d4d"', 'wickDownColor:"var(--brand-complement)"');
  code = code.replace(/#(?:96d600|8fce00|c2f942|dcff7a)(?![\da-f])/gi, 'var(--brand-accent)');
  // Canvas fill styles need concrete colors even when the chart parser accepts CSS tokens.
  const chartCleanup = 'return n.current=j,i.current=T,()=>j.remove()';
  const liveChart = 'const wlSyncChart=()=>{const v=(token)=>getComputedStyle(document.documentElement).getPropertyValue(token).trim();j.applyOptions({layout:{background:{color:v("--panel")},textColor:v("--muted")}});T.applyOptions({upColor:v("--brand-accent"),downColor:v("--brand-complement"),borderUpColor:v("--brand-accent"),borderDownColor:v("--brand-complement"),wickUpColor:v("--brand-accent"),wickDownColor:v("--brand-complement")});};window.addEventListener("whitelabel:update",wlSyncChart);return n.current=j,i.current=T,()=>{window.removeEventListener("whitelabel:update",wlSyncChart);j.remove()}';
  code = code.replace(chartCleanup, liveChart);
  const chartStart = code.indexOf('layout:{background:{color:"var(--panel)"}');
  const chartEnd = code.indexOf('return n.current=j,i.current=T', chartStart);
  if (chartStart !== -1 && chartEnd !== -1) {
    const options = code.slice(chartStart, chartEnd).replace(/:"var\((--[\w-]+)\)"/g,
      (_, token) => `:getComputedStyle(document.documentElement).getPropertyValue("${token}").trim()`);
    code = code.slice(0, chartStart) + options + code.slice(chartEnd);
  }
  code = code.replace('stroke:"#191919",strokeWidth:"2.6"', 'stroke:"var(--brand-on-primary)",strokeWidth:"2.6"');
  code = code.replace('r:"2.4",fill:"#191919"', 'r:"2.4",fill:"var(--brand-on-primary)"');

  // Trading meanings remain green/red even when the tenant chooses another brand.
  code = code.replace(/"var\(--(?:lime|brand-accent)\)"(?=:[^,;]{0,45}"var\(--sell\)")/g, '"var(--positive)"');
  code = code.replace(/rgba\(var\(--brand-rgb\),([.\d]+)\)(?="\s*:[^,;]{0,35}"rgba\(255,(?:77|80),(?:77|80),)/g, 'rgba(var(--positive-rgb),$1)');
  const resultStart = code.indexOf('function wT(');
  const resultEnd = code.indexOf('const ST=', resultStart);
  if (resultStart !== -1 && resultEnd !== -1) {
    code = code.slice(0, resultStart) + code.slice(resultStart, resultEnd)
      .replaceAll('--brand-rgb', '--positive-rgb').replaceAll('--brand-accent', '--positive') + code.slice(resultEnd);
  }
  const runningStart = code.indexOf('background:p.running?');
  const runningEnd = code.indexOf('p.running?c("bot.running")', runningStart);
  if (runningStart !== -1 && runningEnd !== -1) {
    code = code.slice(0, runningStart) + code.slice(runningStart, runningEnd)
      .replaceAll('--brand-rgb', '--positive-rgb').replaceAll('--brand-primary', '--positive').replaceAll('--lime', '--positive') + code.slice(runningEnd);
  }
  code = code.replace('color:"var(--brand-accent)",fontSize:12},children:"● Ativo"', 'color:"var(--positive)",fontSize:12},children:"● Ativo"');
  code = code.replace(/((?:upColor|borderUpColor|wickUpColor):(?:v\(|getComputedStyle\(document.documentElement\).getPropertyValue\())"--brand-accent"/g, '$1"--positive"');
  code = code.replace(/((?:downColor|borderDownColor|wickDownColor):(?:v\(|getComputedStyle\(document.documentElement\).getPropertyValue\())"--brand-complement"/g, '$1"--sell"');

  if (code !== before) {
    writeFileSync(targetPath, code, 'utf-8');
    console.log(`[Patch] Saved updates to ${targetPath}`);
  } else {
    console.log(`[Patch] No changes needed for ${targetPath}`);
  }
  return true;
}

if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href) {
const targets = [
  join(process.cwd(), 'prototipo', 'assets', 'index-D08ZekFh.js'),
  join(process.cwd(), 'public', 'assets', 'index-D08ZekFh.js'),
];

for (const target of targets) {
  patchBundleFile(target);
}
console.log('All bundle patches processed.');
}

export function patchStylesFile(targetPath) {
  const before = readFileSync(targetPath, 'utf8');
  const accent = /^(?:96d600|8fce00|79ae00|8dc800|76a800|7ea600|9dd600|9fd71d|9bdc18|aee735|b6f13a|a9c771|a9c971|b3cd8c)$/i;
  const surfaces = /^(?:191919|202020|262626|101210|121612|121a12|172000|2f3a12|070807|0d0f0d|090a09|0e120e|030403|060706|1e211e|121412|101410|1c221c|0f120f|090b09|0b0d0b|070a07|0d110d)$/i;
  const code = before.replace(/#([\da-f]{6})([\da-f]{2})?\b/gi, (match, value, alpha) => {
    const opacity = alpha ? parseInt(alpha, 16) / 255 : 1;
    if (accent.test(value)) return alpha ? `rgba(var(--brand-rgb),${opacity})` : 'var(--brand-accent)';
    if (surfaces.test(value)) return alpha ? `color-mix(in srgb,var(--panel) ${opacity * 100}%,transparent)` : 'var(--panel)';
    return match;
  }).replace(/rgba\(150,\s*214,\s*0,\s*([.\d]+)\)/g, 'rgba(var(--brand-rgb),$1)');
  if (code !== before) writeFileSync(targetPath, code);
}

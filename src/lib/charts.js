import {DAILY_SERIES,VOLUME_SERIES} from '../data/demo.js';
const n=v=>Number(v.toFixed(2));
export function lineChart(values=DAILY_SERIES, {height=208,labels=true,color='#60b9f7',area=true,accent=false}={}){
  const W=1000,H=height,padT=18,padB=labels?34:16,padL=8,padR=10;
  const max=Math.max(...values)*1.17,min=0,dx=(W-padL-padR)/(values.length-1), scale=(v)=>padT+(max-v)/(max-min)*(H-padT-padB);
  const pts=values.map((v,i)=>[n(padL+i*dx),n(scale(v))]);
  const d=pts.map(([x,y],i)=>`${i?'L':'M'}${x},${y}`).join(' ');
  const fill=`${d} L${W-padR},${H-padB} L${padL},${H-padB} Z`;
  const horizontal=[.25,.5,.75,1].map(fr=>`<line x1="0" y1="${n(padT+(H-padT-padB)*fr)}" x2="${W}" y2="${n(padT+(H-padT-padB)*fr)}" class="chart-grid"/>`).join('');
  const times=values.length===7?['Sáb','Dom','Lun','Mar','Mié','Jue','Vie']:values.length===6?['05:00','06:00','07:00','08:00','09:00','10:00']:['00:00','03:00','06:00','09:00','12:00','15:00','18:00','21:00'];
  const ticks=labels?times.map((t,i)=>`<text x="${n(padL+i*(W-padL-padR)/(times.length-1))}" y="${H-7}" text-anchor="middle" class="chart-tick">${t}</text>`).join(''):'';
  const dots=pts.map(([x,y],i)=>`<circle cx="${x}" cy="${y}" r="${accent?3.2:2.5}" fill="${color}" class="chart-point"><title>${String(i).padStart(2,'0')}:00 · ${values[i]} eventos relativos (simulación)</title></circle>`).join('');
  return `<svg class="line-chart" viewBox="0 0 ${W} ${H}" role="img" aria-label="Serie temporal simulada"><defs><linearGradient id="graphFade" x1="0" x2="0" y1="0" y2="1"><stop offset="0%" stop-color="${color}" stop-opacity=".25"/><stop offset="100%" stop-color="${color}" stop-opacity="0"/></linearGradient></defs>${horizontal}${area?`<path d="${fill}" fill="url(#graphFade)"/>`:''}<path d="${d}" fill="none" stroke="${color}" stroke-width="3.3" stroke-linejoin="round" stroke-linecap="round"/>${dots}${ticks}</svg>`;
}
export function barsChart(values=VOLUME_SERIES){let max=Math.max(...values);return `<div class="bar-chart" role="img" aria-label="Actividad por intervalo">${values.map((v,i)=>`<div class="bar-chart-slot"><div class="bar-chart-bar" style="height:${v/max*100}%"><span class="bar-tooltip">${String(i).padStart(2,'0')}:00 · ${v*41} eventos</span></div></div>`).join('')}</div><div class="bar-labels"><span>00:00</span><span>06:00</span><span>12:00</span><span>18:00</span><span>23:00</span></div>`;}
export function donutChart(items,centerLabel='Alertas'){
 const total=items.reduce((s,a)=>s+a.value,0)||1;
 let start=0;const colors=['#f07080','#f5ad5b','#78b1f2','#6dd2ad'];
 const circ=items.map((a,i)=>{const len=a.value/total*100;const output=`<circle cx="75" cy="75" r="55" fill="none" stroke="${colors[i]}" stroke-width="16" stroke-dasharray="${len} ${100-len}" stroke-dashoffset="${-start}" pathLength="100" transform="rotate(-90 75 75)"><title>${a.label}: ${a.value}</title></circle>`;start+=len;return output;}).join('');
 return `<div class="donut-layout"><div class="donut-container"><svg viewBox="0 0 150 150" role="img" aria-label="Distribución de severidades"><circle cx="75" cy="75" r="55" fill="none" stroke="#223049" stroke-width="16"/>${circ}</svg><div class="donut-center"><strong>${total}</strong><small>${centerLabel}</small></div></div><div class="donut-legend">${items.map((a,i)=>`<div><span class="legend-dot" style="background:${colors[i]}"></span><span>${a.label}</span><b>${a.value}</b></div>`).join('')}</div></div>`;
}
export function sparkline(values,color='#68c2ec'){const max=Math.max(...values),min=Math.min(...values),range=max-min||1;const pts=values.map((v,i)=>`${i*100/(values.length-1)},${30-(v-min)/range*23}`).join(' ');return `<svg class="spark" viewBox="0 0 100 34" preserveAspectRatio="none"><polyline points="${pts}" fill="none" stroke="${color}" stroke-width="2.2" vector-effect="non-scaling-stroke"/></svg>`;}
export function tinyRing(pct,color='#69c8ec'){return `<div class="tiny-ring" style="--p:${pct}%;--ring:${color}"><span>${pct}%</span></div>`;}

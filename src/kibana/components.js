import { esc } from '../components/ui.js';
import { icon } from '../lib/icons.js';
import { aggregate, histogram } from './query.js';
import { metricValue } from './dashboards.js';

export const number = n => new Intl.NumberFormat('es-ES').format(n);
export const date = (value, short = false) => new Intl.DateTimeFormat('es-ES', {timeZone:'Europe/Madrid', ...(short ? {day:'2-digit',month:'short',hour:'2-digit',minute:'2-digit'} : {year:'numeric',month:'short',day:'2-digit',hour:'2-digit',minute:'2-digit',second:'2-digit'})}).format(new Date(value));
export const palette = ['#14b8b5','#a2e8e5','#609fff','#b8d2ff','#e973a9','#f6b0cf','#f5796f','#efc35d'];
export const attrs = (action, value = '') => `data-k-action="${action}" data-k-value="${esc(typeof value === 'string' ? value : JSON.stringify(value))}"`;
export const btn = (label, action, value = '', ic = '', cls = '') => `<button type="button" class="k-btn ${cls}" ${attrs(action,value)}>${ic?icon(ic,15):''}${esc(label)}</button>`;
export const iconBtn = (label, action, value, ic) => `<button type="button" class="k-icon-btn" aria-label="${esc(label)}" title="${esc(label)}" ${attrs(action,value)}>${icon(ic,17)}</button>`;
export const select = (name, label, options, value) => `<label class="k-select"><span>${esc(label)}</span><select aria-label="${esc(label)}" data-k-field="${name}">${options.map(([v,l])=>`<option value="${esc(v)}" ${v===value?'selected':''}>${esc(l)}</option>`).join('')}</select></label>`;
export const noData = (message = 'Prueba otro periodo o elimina algún filtro.') => `<div class="k-empty">${icon('search',28)}<strong>Sin resultados</strong><p>${esc(message)}</p>${btn('Limpiar consulta y filtros','clear','','refresh-cw')}</div>`;
export const mark = () => `<svg class="k-elastic-mark" viewBox="0 0 36 40" aria-hidden="true"><path d="M18 1a10 10 0 0 1 10 11H9A10 10 0 0 1 18 1" fill="#fed10a"/><path d="M8 13h21a9 9 0 0 1 4 12H4a9 9 0 0 1 4-12" fill="#00bfb3"/><path d="M8 27h21a12 12 0 0 1-21 0" fill="#f04e98"/><path d="M4 14h12v10H3a10 10 0 0 1 1-10" fill="#1ba9f5"/><path d="M17 27h12a12 12 0 0 1-12 11" fill="#0077cc"/></svg>`;
export function metrics(documents, configs) {
  return `<div class="k-metrics">${configs.map((m,i)=>{const value=metricValue(documents,m); return `<section class="k-metric"><div>${esc(m.label)}${icon('info',13)}</div><strong data-k-metric="${i}">${typeof value==='number'?number(value):esc(value)}</strong><small>${m.type==='percent'?'Media de muestras':m.type==='unique'?'Valores distintos en el periodo':'Sobre los documentos filtrados'}</small></section>`;}).join('')}</div>`;
}
const filterAttrs = (field, value) => `${attrs('filter',{field,value:String(value)})} tabindex="0" role="button" aria-label="${esc(`Filtrar ${field}: ${value}`)}"`;
export function bars(documents, field) {
  const items = aggregate(documents,field,8), max = Math.max(1,...items.map(x=>x.value));
  if(!items.length) return noData('Este campo no aparece en los documentos filtrados.');
  return `<div class="k-bars">${items.map((x,i)=>`<button class="k-bar-row" ${attrs('filter',{field,value:x.label})} title="${esc(`${field}: ${x.label} · ${x.value} documentos`)}"><span class="k-bar-label">${esc(x.label)}</span><span class="k-bar-track"><span style="width:${x.value/max*100}%;background:${palette[i===0?0:1]}"></span></span><b>${number(x.value)}</b></button>`).join('')}<div class="k-chart-foot">Número de documentos · pulsa una barra para filtrar</div></div>`;
}
export function donut(documents,field) {
  const items = aggregate(documents,field,Infinity), total=items.reduce((s,x)=>s+x.value,0); let offset=0;
  if(!total) return noData('Este campo no aparece en los documentos filtrados.');
  const circles=items.map((x,i)=>{const length=x.value/total*100, start=offset; offset+=length;return `<circle cx="110" cy="110" r="78" fill="none" stroke="${palette[i%palette.length]}" stroke-width="30" pathLength="100" stroke-dasharray="${length} ${100-length}" stroke-dashoffset="${-start}" transform="rotate(-90 110 110)" ${filterAttrs(field,x.label)}><title>${esc(x.label)} · ${x.value} (${length.toFixed(1)} %)</title></circle>`;}).join('');
  return `<div class="k-donut-layout"><svg class="k-donut" viewBox="0 0 220 220" aria-label="Distribución por ${esc(field)}">${circles}<text x="110" y="108" text-anchor="middle" class="k-donut-total">${number(total)}</text><text x="110" y="129" text-anchor="middle" class="k-axis-text">documentos</text></svg><div class="k-legend">${items.map((x,i)=>`<button ${attrs('filter',{field,value:x.label})} title="Filtrar ${esc(x.label)}"><i style="background:${palette[i%palette.length]}"></i><span>${esc(x.label)}</span><b>${(x.value/total*100).toFixed(1)} %</b></button>`).join('')}</div></div>`;
}
export function timeChart(documents,state,type='histogram') {
  if(!documents.length) return noData();
  const bins=histogram(documents,state), max=Math.ceil(Math.max(4,...bins.map(b=>b.value))/4)*4;
  const width=860,height=215,left=48,right=15,top=18,bottom=40,plotW=width-left-right,plotH=height-top-bottom;
  const y=v=>top+plotH-v/max*plotH;
  const points=bins.map((b,i)=>[left+(i+.5)*plotW/bins.length,y(b.value)]);
  const grid=[0,.25,.5,.75,1].map(f=>`<line x1="${left}" y1="${y(max*f)}" x2="${width-right}" y2="${y(max*f)}" class="k-gridline"/><text x="${left-10}" y="${y(max*f)+4}" text-anchor="end" class="k-axis-text">${number(Math.round(max*f))}</text>`).join('');
  const ticks=[0,6,12,18,23].map(i=>`<text x="${left+(i+.5)*plotW/bins.length}" y="${height-10}" text-anchor="${i===0?'start':i===23?'end':'middle'}" class="k-axis-text k-time-label k-tick-${i}">${esc(date(bins[i].from,true))}</text>`).join('');
  const path=points.map(([x,py],i)=>`${i?'L':'M'}${x.toFixed(2)} ${py.toFixed(2)}`).join(' ');
  const line=type==='histogram'?'':`${type==='area'?`<path d="${path} L${points.at(-1)[0]} ${y(0)} L${points[0][0]} ${y(0)}Z" fill="#14b8b51c"/>`:''}<path d="${path}" fill="none" stroke="#14b8b5" stroke-width="2.5"/>`;
  const marks=bins.map((b,i)=>`<g ${attrs('time-zoom',{from:b.from,to:b.to})} role="button" tabindex="0" aria-label="${esc(`${date(b.from,true)}: ${b.value} documentos. Acotar intervalo`)}"><title>${esc(date(b.from))} — ${esc(date(b.to))} · ${b.value} documentos</title><rect x="${left+i*plotW/bins.length+2}" y="${top}" width="${plotW/bins.length-4}" height="${plotH}" class="k-time-hit"/>${type==='histogram'?`<rect x="${left+i*plotW/bins.length+3}" y="${y(b.value)}" width="${plotW/bins.length-6}" height="${Math.max(0,plotH-(y(b.value)-top))}" fill="#14b8b5"/>`:`<circle cx="${points[i][0]}" cy="${points[i][1]}" r="3" fill="#14b8b5"/>`}</g>`).join('');
  return `<div class="k-timechart"><svg viewBox="0 0 ${width} ${height}" aria-label="Histograma de ${documents.length} documentos">${grid}${line}${marks}${ticks}</svg><div class="k-chart-foot">@timestamp · ${bins.length} intervalos · Europe/Madrid · pulsa para acotar el periodo</div></div>`;
}
export function geo(documents, field) {
  const items=aggregate(documents,field), positions={'España':[244,108],'Francia':[253,91],'Alemania':[273,81],'Estados Unidos':[105,95],'Japón':[457,115]};
  return `<div class="k-geo"><svg viewBox="0 0 550 220" aria-label="Distribución geográfica ficticia"><path d="M26 45 88 22 143 42 176 65 145 98 114 111 103 139 77 122 64 87 34 77Z M117 144 153 132 178 155 166 191 145 216 125 181Z M232 55 268 43 296 57 315 47 353 30 429 51 507 88 485 128 441 143 399 121 366 151 344 125 311 103 287 116 276 94 249 98 224 80Z M242 110 284 105 311 138 294 181 275 197 249 165 232 137Z M430 169 465 151 507 177 481 205 444 200Z" fill="#1a3449" stroke="#2b5367"/>${items.map(x=>{const [cx,cy]=positions[x.label]||[300,100];return `<g ${filterAttrs(field,x.label)}><circle cx="${cx}" cy="${cy}" r="${6+Math.sqrt(x.value)*1.1}" fill="#14b8b54d" stroke="#65e1d2"/><circle cx="${cx}" cy="${cy}" r="3" fill="#a2e8e5"/><title>${esc(x.label)}: ${x.value} documentos ficticios</title></g>`;}).join('')}</svg><div class="k-geo-legend">${items.map(x=>btn(`${x.label} · ${x.value}`,'filter',{field,value:x.label})).join('')}</div><small>Ubicaciones asignadas a datos ficticios. Sin geolocalización de IP.</small></div>`;
}
export function gauges(documents,field) {
  const hosts=aggregate(documents,'host.name');
  return `<div class="k-gauges">${hosts.map(h=>{const values=documents.filter(d=>d['host.name']===h.label).map(d=>d[field]).filter(v=>typeof v==='number'); const avg=values.length?values.reduce((a,b)=>a+b,0)/values.length*100:0;return `<button ${attrs('filter',{field:'host.name',value:h.label})}><span>${esc(h.label)}</span><b>${avg.toFixed(1)} %</b><i><em style="width:${avg}%;background:${avg>80?'#e973a9':'#14b8b5'}"></em></i></button>`;}).join('')}</div>`;
}
export function timeline(documents) {
  return `<div class="k-timeline">${documents.slice(0,8).map(d=>`<button ${attrs('document',d._id)}><time>${date(d['@timestamp'],true)}</time><i></i><div><strong>${esc(d['rule.name']||d['event.action'])}</strong><span>${esc(d['source.ip'])} → ${esc(d['destination.ip'])} <b>${esc(d['alert.id']||'')}</b></span></div></button>`).join('')}</div>`;
}
export function chart(panel,documents,state) {
  if(!documents.length) return noData();
  if(['line','area','histogram'].includes(panel.type)) return timeChart(documents,state,panel.type);
  if(panel.type==='bar') return bars(documents,panel.field);
  if(panel.type==='donut') return donut(documents,panel.field);
  if(panel.type==='geo') return geo(documents,panel.field);
  if(panel.type==='gauge') return gauges(documents,panel.field);
  if(panel.type==='timeline') return timeline(documents);
  return '';
}
export function table(documents,state) {
  const total=documents.length, pages=Math.max(1,Math.ceil(total/state.pageSize)), page=Math.min(state.tablePage||1,pages), start=(page-1)*state.pageSize;
  return `<div class="k-table-meta"><span><b data-k-results="${total}">${number(total)}</b> documentos</span><div>${btn(`Columnas · ${state.columns.length}`,'columns','','columns-3')}${btn('Exportar JSON','export','','download')}</div></div><div class="k-table-scroll"><table class="k-table"><thead><tr><th><span class="sr-only">Detalle</span></th>${state.columns.map(f=>`<th scope="col" aria-sort="${state.sort===f?(state.dir==='asc'?'ascending':'descending'):'none'}"><button ${attrs('sort',f)}><span class="k-field-type">${f==='@timestamp'?'◷':'k'}</span>${esc(f)}${state.sort===f?state.dir==='asc'?' ↑':' ↓':icon('sort-desc',12)}</button></th>`).join('')}</tr></thead><tbody>${documents.slice(start,start+state.pageSize).map(d=>`<tr><td>${iconBtn(`Abrir documento ${d._id}`,'document',d._id,'chevron-right')}</td>${state.columns.map(f=>`<td><button class="k-cell ${f==='event.severity'?`k-severity k-${d[f]}`:''}" ${attrs('document',d._id)} title="${esc(d[f]??'Campo ausente')}">${f==='@timestamp'?esc(date(d[f])):esc(d[f]??'—')}</button></td>`).join('')}</tr>`).join('')||`<tr><td colspan="${state.columns.length+1}">${noData()}</td></tr>`}</tbody></table></div><div class="k-pagination">${select('pageSize','Filas', ['10','25','50','100'].map(v=>[v,v]),String(state.pageSize))}<span>${total?`${start+1}–${Math.min(start+state.pageSize,total)} de ${number(total)}`:'0 resultados'}</span><div><button class="k-icon-btn" aria-label="Página anterior" ${attrs('page',-1)} ${page<=1?'disabled':''}>${icon('chevron-left',17)}</button><span>${page} / ${pages}</span><button class="k-icon-btn" aria-label="Página siguiente" ${attrs('page',1)} ${page>=pages?'disabled':''}>${icon('chevron-right',17)}</button></div></div>`;
}

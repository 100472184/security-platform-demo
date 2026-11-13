import assert from 'node:assert/strict';
import {readFile,readdir} from 'node:fs/promises';
import {join} from 'node:path';
import {INITIAL_ALERTS,INITIAL_CASES,IOCS,NODES,PCAP_FLOWS,EVENTS,RULES,NAV_ITEMS} from '../src/data/demo.js';
import {renderPage} from '../src/pages/views.js';
const data={alerts:structuredClone(INITIAL_ALERTS),cases:structuredClone(INITIAL_CASES),rules:structuredClone(RULES),watchlist:['203.0.113.68'],investigations:[],settings:{compact:false,autorefresh:true,sound:false},activity:[],chat:[{role:'assistant',text:'Hola'}]};
const ui={route:'overview',range:'24h',alertQ:'',alertSeverity:'all',alertStatus:'all',alertPage:1,alertSort:'time',alertDir:'desc',caseQ:'',caseStatus:'all',casePage:1,caseSort:'created',caseDir:'desc',huntQuery:'',huntModule:'all',huntPage:1,iocQuery:'',iocResult:'',triageSeverity:'all',detQ:'',detState:'all',pcapQ:'',toolQuery:'',decodeInput:'',decodedOutput:''};
assert(INITIAL_ALERTS.length>=15);
assert(EVENTS.length>=100);
assert.equal(NODES.length,3);
for(const e of EVENTS) assert(INITIAL_ALERTS.some(a=>a.id===e.alertId),`Evento sin alerta: ${e.id}`);
for(const c of INITIAL_CASES)for(const id of c.alertIds)assert(INITIAL_ALERTS.some(a=>a.id===id),`Caso sin alerta: ${c.id}`);
for(const i of IOCS)for(const id of i.related)assert(INITIAL_ALERTS.some(a=>a.id===id),`IOC sin alerta: ${i.value}`);
for(const f of PCAP_FLOWS)assert(INITIAL_ALERTS.some(a=>a.id===f.alertId));
for(const item of NAV_ITEMS){const html=renderPage({...ui,route:item.id},data);assert(html.length>1200,`Vista insuficiente: ${item.id}`);assert(/<h1>/.test(html),`Falta título: ${item.id}`);}
async function scan(dir){for(const f of await readdir(dir,{withFileTypes:true})){if(['node_modules','dist','.git'].includes(f.name))continue;const path=join(dir,f.name);if(f.isDirectory())await scan(path);else if(/\.(?:js|mjs|html|css|json|md|svg)$/i.test(f.name)) {const t=await readFile(path,'utf8');const banned=[/COS[-_ ]?AR/i,/SECURITY\s+ONION/i,/172\.21\.120\.10/i,/10\.10\.10\.(?:25|26|27)/i];for(const re of banned)assert(!re.test(t),`Referencia no permitida: ${path} (${re})`);}}}
await scan('.');
console.log(`✓ ${NAV_ITEMS.length} módulos renderizados, ${EVENTS.length} eventos coherentes, ${INITIAL_ALERTS.length} alertas y ${INITIAL_CASES.length} casos verificados.`);
console.log('✓ Comprobación de limpieza de identidad superada.');

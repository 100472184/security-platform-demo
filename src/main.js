import {NAV_ITEMS,EVENTS,IOCS,PCAP_FLOWS,NODES} from './data/demo.js';
import {loadStore,saveStore,resetStore,createCase,record} from './lib/store.js';
import {topShell,bottomShell,esc} from './components/ui.js';
import {renderPage,renderOverlay} from './pages/views.js';
import {createKibana} from './kibana/controller.js';

let data=loadStore();
const routeFromPath=()=>{let path=decodeURIComponent(location.pathname).replace(/^\/+|\/+$/g,'');if(path==='tools/kibana'||path.startsWith('tools/kibana/'))return 'tools/kibana';return NAV_ITEMS.some(n=>n.id===path)?path:'overview';};
const ui={route:routeFromPath(),navCollapsed:false,mobileNav:false,selected:null,drawerTab:'details',modal:null,toast:'',range:'24h',alertQ:'',alertSeverity:'all',alertStatus:'all',alertSort:'time',alertDir:'desc',alertPage:1,caseQ:'',caseStatus:'all',caseSort:'created',caseDir:'desc',casePage:1,huntQuery:'',huntModule:'all',huntPage:1,iocQuery:'',iocResult:'',triageSeverity:'all',detQ:'',detState:'all',pcapQ:'',toolQuery:'',decodeInput:'',decodedOutput:'',formTitle:'',formSeverity:'high',formDescription:'',formAlertId:''};
const app=document.getElementById('app');
const kibana=createKibana({getData:()=>data,render,openAlert:id=>{navigate('alerts');open('alert',id);},openCase:id=>{navigate('cases');open('case',id);},createCase:id=>{navigate('cases');focusModal('create-case',id);}});
let lastToast='';
function render({focus=false,scrollTop=false}={}){
 let active=null,selection=0;
 if(focus&&(document.activeElement?.dataset?.field||document.activeElement?.dataset?.kField||document.activeElement?.dataset?.kColumn)){active=document.activeElement.dataset.field||document.activeElement.dataset.kField||document.activeElement.dataset.kColumn;try{selection=document.activeElement.selectionStart;}catch{}}
 const prevScroll=window.scrollY;
 app.innerHTML=ui.route==='tools/kibana'?kibana.render():topShell(ui,data)+renderPage(ui,data)+bottomShell(ui);
 const overlay=document.getElementById('overlay-root');if(overlay)overlay.innerHTML=renderOverlay(ui,data);
 document.body.classList.toggle('compact-mode',Boolean(data.settings.compact));
 if(active){const element=[...document.querySelectorAll('[data-field],[data-k-field],[data-k-column]')].find(e=>(e.dataset.field||e.dataset.kField||e.dataset.kColumn)===active);if(element){element.focus();try{element.setSelectionRange(selection,selection);}catch{}}}
 if(!scrollTop)window.scrollTo(0,prevScroll);
 if(ui.route==='analyst'){const ch=document.getElementById('chat-scroll');if(ch)ch.scrollTop=ch.scrollHeight;}
}
function navigate(route){if(!NAV_ITEMS.some(x=>x.id===route))return;ui.route=route;ui.mobileNav=false;ui.selected=null;ui.modal=null;history.pushState(null,'',`/${route}`);if(route==='tools/kibana')kibana.sync();render({scrollTop:true});window.scrollTo(0,0);}
function toast(message){ui.toast=message;lastToast=message;render({focus:false});}
function save(message){saveStore(data);toast(message);}
function open(kind,id){ui.selected={kind,id};ui.modal=null;ui.drawerTab='details';render();}
function sendChat(text){const prompt=(text||'').trim();if(!prompt)return;data.chat.push({role:'user',text:prompt});let response='';const q=prompt.toLowerCase();
const high=data.alerts.filter(x=>x.severity==='critical'&&x.status!=='closed'),cases=data.cases.filter(x=>x.status!=='closed');
if(q.includes('203.0.113.68')||q.includes('indicador')||q.includes('ioc'))response=`ANÁLISIS DE CORRELACIÓN · DEMOSTRACIÓN\n\nEl indicador 203.0.113.68 aparece en 3 detecciones ficticias: ALT-260133 (tráfico periódico), ALT-260135 (transferencia saliente) y ALT-260148 (huella TLS anómala).\n\nPrioridad sugerida: alta. Comprueba si la cadencia y el volumen se repiten, compara los equipos de origen e incluye las evidencias en un caso. No se ha consultado ninguna fuente externa.`;
else if(q.includes('crítica')||q.includes('alertas')||q.includes('resumen'))response=`RESUMEN OPERATIVO · DEMOSTRACIÓN\n\nHay ${high.length} alertas críticas abiertas de ${data.alerts.length} registros de prueba. Las señales prioritarias están asociadas a intentos de acceso y comunicaciones periódicas.\n\nSiguiente paso: revisar ALT-260131 y ALT-260133, validar los eventos vinculados en Hunt y documentar los hallazgos antes de clasificar el incidente.`;
else if(q.includes('caso')||q.includes('incidente'))response=`ESTADO DE INCIDENTES · DEMOSTRACIÓN\n\nExisten ${cases.length} casos sin cerrar de ${data.cases.length} casos registrados localmente.\n\nPara iniciar uno nuevo: abre una alerta, selecciona «Crear caso» y completa el formulario. El incidente aparecerá automáticamente en Cases y podrás modificar su estado y añadir anotaciones.`;
else if(q.includes('investig')||q.includes('plan')||q.includes('respuesta'))response=`PLAN DE INVESTIGACIÓN SUGERIDO · DEMOSTRACIÓN\n\n1. Confirmar el alcance: equipo de origen, destino y ventana temporal.\n2. Correlacionar alertas, eventos DNS, conexiones y procesos.\n3. Revisar los IOC asociados y contrastar la evidencia.\n4. Registrar un caso, asignar responsable y documentar decisiones.\n5. Determinar impacto y proponer contención, sin ejecutar acciones automáticas.`;
else response=`INTERPRETACIÓN LOCAL · DEMOSTRACIÓN\n\nTu consulta es: «${prompt.slice(0,145)}». Este asistente no está conectado a un modelo externo y no interpreta consultas arbitrarias de forma automática.\n\nPuedo ofrecer resúmenes predefinidos de alertas críticas, del indicador 203.0.113.68, de los casos abiertos o de un plan de investigación. Selecciona una consulta sugerida para ver el recorrido.`;
data.chat.push({role:'assistant',text:response});record(data,'Se consultó al asistente de análisis');render();}
function csvEscape(value){let s=String(value??'');if(/^[=+\-@]/.test(s))s="'"+s;return `"${s.replaceAll('"','""')}"`;}
function downloadCsv(name,rows){if(!rows?.length){toast('No hay registros para exportar.');return;}const fields=Object.keys(rows[0]);const content='\ufeff'+[fields.map(csvEscape).join(','),...rows.map(r=>fields.map(f=>csvEscape(r[f])).join(','))].join('\r\n');const blob=new Blob([content],{type:'text/csv;charset=utf-8'});const url=URL.createObjectURL(blob);const a=document.createElement('a');a.href=url;a.download=`security-platform-${name}-demo.csv`;document.body.appendChild(a);a.click();a.remove();URL.revokeObjectURL(url);toast(`Exportación de ${name} preparada.`);}
function exportType(type){let rows;switch(type){case 'alerts':rows=data.alerts;break;case 'events':rows=EVENTS;break;case 'cases':rows=data.cases.map(c=>({...c,alertIds:c.alertIds.join('|'),notes:JSON.stringify(c.notes)}));break;case 'iocs':rows=IOCS.map(i=>({...i,related:i.related.join('|')}));break;case 'flows':rows=PCAP_FLOWS;break;case 'rules':rows=data.rules;break;case 'dashboard':rows=[{metric:'Alertas',value:data.alerts.length},{metric:'Casos',value:data.cases.length},{metric:'Eventos históricos',value:EVENTS.length},{metric:'Nodos',value:NODES.length}];break;default:rows=[];}downloadCsv(type,rows);}
const focusModal=(modal,alertId='')=>{ui.selected=null;ui.modal=modal;ui.formAlertId=alertId;ui.formTitle=alertId?`Investigación de ${data.alerts.find(a=>a.id===alertId)?.title||'alerta'}`:'';ui.formSeverity=data.alerts.find(a=>a.id===alertId)?.severity||'high';ui.formDescription=alertId?`Caso derivado de la detección ${alertId}.`:'';render();};
function act(action,value,target){
 switch(action){
 case 'nav':navigate(value);break;
 case 'kibana-alert':navigate('tools/kibana');kibana.openRelated(value);break;
 case 'kibana-case':{const c=data.cases.find(c=>c.id===value);if(c){navigate('tools/kibana');kibana.openRelated(c.alertIds);}break;}
 case 'toggle-nav':{ui.navCollapsed=!ui.navCollapsed;ui.mobileNav=!ui.mobileNav;render();break;}
 case 'modal':focusModal(value);break;
 case 'help-start':navigate('alerts');break;
 case 'close-overlay':ui.selected=null;ui.modal=null;render();break;
 case 'dismiss-toast':ui.toast='';render();break;
 case 'open-alert':open('alert',value);break;
 case 'open-case':open('case',value);break;
 case 'open-event':open('event',value);break;
 case 'open-rule':open('rule',value);break;
 case 'open-node':open('node',value);break;
 case 'open-flow':open('flow',value);break;
 case 'drawer-tab':ui.drawerTab=value;render();break;
 case 'alert-ack':{const a=data.alerts.find(a=>a.id===value);if(!a)break;a.status='acknowledged';record(data,`Alerta ${value} reconocida`);save('Alerta reconocida correctamente.');break;}
 case 'alert-investigate':case 'triage-investigate':{const a=data.alerts.find(a=>a.id===value);if(!a)break;a.status='investigating';a.assignee='Analista demo';if(!data.investigations.includes(value))data.investigations.push(value);record(data,`Investigación iniciada: ${value}`);save('Investigación iniciada y asignada al analista demo.');break;}
 case 'triage-case':focusModal('create-case',value);break;
 case 'create-case':{const title=document.getElementById('new-title')?.value.trim();const sev=document.getElementById('new-severity')?.value||'medium';const desc=document.getElementById('new-description')?.value.trim();if(!title||title.length<4){const err=document.getElementById('new-title-error');if(err)err.textContent='Indica un título de al menos 4 caracteres.';document.getElementById('new-title')?.focus();break;}const c=createCase(data,ui.formAlertId?[ui.formAlertId]:[],title,sev,desc);if(ui.formAlertId){const a=data.alerts.find(x=>x.id===ui.formAlertId);if(a){a.status='investigating';a.assignee='Analista demo';}}record(data,`Caso ${c.id} creado`);ui.modal=null;ui.selected=null;ui.formAlertId='';saveStore(data);navigate('cases');open('case',c.id);toast(`Caso ${c.id} creado y vinculado correctamente.`);break;}
 case 'save-case':{const c=data.cases.find(x=>x.id===value);if(!c)break;c.status=document.querySelector('[data-field="editCaseStatus"]')?.value||c.status;c.owner=document.querySelector('[data-field="editCaseOwner"]')?.value||c.owner;record(data,`Caso ${value}: estado ${c.status}`);save('Cambios guardados en el caso.');break;}
 case 'add-note':{const c=data.cases.find(x=>x.id===value);const note=document.getElementById('case-note-input')?.value.trim();if(!note){toast('Escribe una nota antes de guardarla.');break;}c.notes.unshift({at:'13 nov · ahora',by:'Demo Analyst',text:note});record(data,`Nota añadida al caso ${value}`);save('Nota de investigación registrada.');break;}
 case 'export-case':{const c=data.cases.find(x=>x.id===value);if(c)downloadCsv('caso-'+value,[{...c,alertIds:c.alertIds.join('|'),notes:JSON.stringify(c.notes)}]);break;}
 case 'toggle-rule':{const r=data.rules.find(x=>x.id===value);if(!r)break;r.enabled=!r.enabled;record(data,`Regla ${value} ${r.enabled?'activada':'desactivada'}`);save(`Regla ${r.enabled?'activada':'desactivada'} en modo demo.`);break;}
 case 'evaluate-rules':toast('Evaluación local completada: reglas revisadas sin cambios en sistemas reales.');break;
 case 'grid-refresh':toast('Comprobación simulada completada: 3 de 3 nodos operativos.');break;
 case 'ioc-analyze':ui.iocResult=ui.iocQuery.trim();render();break;
 case 'ioc-select':ui.iocQuery=value;ui.iocResult=value;ui.selected=null;ui.route='intelligence';history.pushState(null,'','/intelligence');render({scrollTop:true});break;
 case 'watch-ioc':{if(data.watchlist.includes(value)){data.watchlist=data.watchlist.filter(x=>x!==value);}else data.watchlist.push(value);save('Lista de vigilancia actualizada.');break;}
 case 'ioc-hunt':ui.huntQuery=value;ui.huntPage=1;navigate('hunt');break;
 case 'hunt-from-alert':ui.huntQuery=value;ui.huntPage=1;navigate('hunt');break;
 case 'rule-alerts':ui.alertQ=value;navigate('alerts');break;
 case 'run-hunt':ui.huntPage=1;toast('Consulta ejecutada sobre el conjunto local de eventos.');break;
 case 'save-hunt':{const q=ui.huntQuery||'*';try{localStorage.setItem('security-platform-last-hunt',q);}catch{}toast(`Búsqueda «${q}» guardada en el navegador.`);break;}
 case 'hunt-preset':ui.huntQuery=value;ui.huntPage=1;render();break;
 case 'copy':navigator.clipboard?.writeText(value).then(()=>toast('Identificador copiado.')).catch(()=>toast('No se pudo acceder al portapapeles.'));break;
 case 'clear-alerts':ui.alertQ='';ui.alertSeverity='all';ui.alertStatus='all';ui.alertPage=1;render();break;
 case 'sort':{const [scope,field]=value.split(':');const key=scope==='case'?'case':scope==='hunt'?'hunt':'alert';ui[`${key}Dir`]=ui[`${key}Sort`]===field&&ui[`${key}Dir`]==='desc'?'asc':'desc';ui[`${key}Sort`]=field;render();break;}
 case 'page':{const [s,dir]=value.split(':');let key=s==='alerts'?'alertPage':s==='cases'?'casePage':'huntPage';ui[key]=Math.max(1,ui[key]+(dir==='next'?1:-1));render();break;}
 case 'ask':{const suggestions=['Resume las alertas críticas','Analiza la actividad de 203.0.113.68','Prepara un plan de investigación','¿Qué casos están abiertos?'];sendChat(suggestions[Number(value)]||suggestions[0]);break;}
 case 'reset-chat':data.chat=[{role:'assistant',text:'Nueva conversación iniciada. ¿Qué deseas analizar? Puedes consultar alertas, indicadores, casos o un plan de investigación.'}];saveStore(data);render();break;
 case 'export':exportType(value);break;
 case 'confirm-reset':data=resetStore();ui.modal=null;ui.selected=null;ui.iocResult='';ui.iocQuery='';save('Entorno de demostración restablecido.');break;
 case 'toggle-setting':data.settings[value]=!data.settings[value];saveStore(data);render();break;
 case 'decode':{const raw=document.getElementById('decode-input')?.value||'';ui.decodeInput=raw;try{const bytes=Uint8Array.from(atob(raw.replace(/\s/g,'')),c=>c.charCodeAt(0));ui.decodedOutput=new TextDecoder('utf-8',{fatal:true}).decode(bytes);toast('Cadena Base64 decodificada localmente.');}catch{ui.decodedOutput='No es una cadena Base64 válida (UTF-8).';render();}break;}
 case 'tool-agent':toast(`Agente ${value}: operativo (estado simulado).`);break;
 case 'tool-search':toast('Búsqueda ejecutada en los datos locales.');break;
 default:break;
 }
}
app.addEventListener('click',(ev)=>{
 if(ui.route==='tools/kibana'&&kibana.handleClick(ev))return;
 const nav=ev.target.closest('[data-nav]');if(nav){ev.preventDefault();navigate(nav.dataset.nav);return;}
 const t=ev.target.closest('[data-action]');if(!t||t.disabled)return;
 if(t.tagName==='A')ev.preventDefault();act(t.dataset.action,t.dataset.value||'',t);
});
app.addEventListener('input',(ev)=>{
 if(ui.route==='tools/kibana'&&kibana.handleInput(ev))return;
 const field=ev.target.dataset.field;
 if(!field)return;
 if(field==='editCaseStatus'||field==='editCaseOwner')return;
 ui[field]=ev.target.value;
 if(['alertQ','caseQ','huntQuery','detQ','pcapQ','toolQuery'].includes(field)){
  if(field==='alertQ')ui.alertPage=1;if(field==='caseQ')ui.casePage=1;if(field==='huntQuery')ui.huntPage=1;
  render({focus:true});
 }
});
app.addEventListener('change',(ev)=>{
 if(ui.route==='tools/kibana'&&kibana.handleChange(ev))return;
 const field=ev.target.dataset.field;if(!field)return;
 if(field==='editCaseStatus'||field==='editCaseOwner')return;
 ui[field]=ev.target.value;
 if(['alertSeverity','alertStatus'].includes(field))ui.alertPage=1;
 if(field==='caseStatus')ui.casePage=1;
 if(field==='huntModule')ui.huntPage=1;
 render();
});
app.addEventListener('submit',(ev)=>{if(ui.route==='tools/kibana'&&kibana.handleSubmit(ev))return;if(ev.target.id!=='chat-form')return;ev.preventDefault();const textarea=document.getElementById('chat-draft');sendChat(textarea?.value||'');});
document.addEventListener('keydown',(ev)=>{
 if(ui.route==='tools/kibana'&&kibana.handleKey(ev))return;
 if(ev.key==='Escape'&&(ui.selected||ui.modal)){ui.selected=null;ui.modal=null;render();return;}
 if(ev.key==='Enter'&&ev.target.id==='chat-draft'&&!ev.shiftKey){ev.preventDefault();sendChat(ev.target.value);}
 if(ev.key==='Enter'&&ev.target.dataset.field==='iocQuery'){ev.preventDefault();ui.iocResult=ui.iocQuery.trim();render();}
});
window.addEventListener('popstate',()=>{ui.route=routeFromPath();ui.selected=null;ui.modal=null;if(ui.route==='tools/kibana')kibana.sync();render({scrollTop:true});});
render({scrollTop:true});

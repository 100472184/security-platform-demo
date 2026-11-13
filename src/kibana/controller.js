import { DOCUMENTS, DEFAULT_COLUMNS, DATA_VIEWS, FIELDS, DEMO_NOW, DAY, structuredDocument } from './data.js';
import { DASHBOARDS, dashboardById } from './dashboards.js';
import { filterDocuments, aggregate, timeBounds, RANGES } from './query.js';
import { renderLogin, renderWorkspace } from './views.js';
import { esc } from '../components/ui.js';

const storage = {
  get(key,fallback) {try {return JSON.parse(localStorage.getItem(`security-kibana-${key}`)) ?? fallback;} catch {return fallback;}},
  set(key,value) {try {localStorage.setItem(`security-kibana-${key}`,JSON.stringify(value));return true;} catch {return false;}},
};
const snapshotKeys = ['query','view','range','from','to','filters','columns','sort','dir','scope'];
const dateInput = iso => new Intl.DateTimeFormat('sv-SE',{timeZone:'Europe/Madrid',year:'numeric',month:'2-digit',day:'2-digit',hour:'2-digit',minute:'2-digit'}).format(new Date(iso)).replace(' ','T');
// Resolve local wall time in Europe/Madrid, independently of the browser timezone.
export function madridDate(value) {
  const [day,time]=value.split('T'); if(!day||!time) return '';
  const wall=Date.parse(`${day}T${time}:00Z`); if(!Number.isFinite(wall)) return '';
  for (const offset of [1,2]) {const instant=new Date(wall-offset*3600000).toISOString(); if(dateInput(instant)===value) return instant;}
  return '';
}
export function initialState() {
  return {page:'catalog',dashboard:'security-overview',query:'',queryDraft:'',view:'all',range:'24h',from:new Date(DEMO_NOW-DAY).toISOString(),to:new Date(DEMO_NOW).toISOString(),filters:[],columns:[...DEFAULT_COLUMNS],sort:'@timestamp',dir:'desc',scope:'',pageSize:10,tablePage:1,
    catalogQuery:'',category:'',favoritesOnly:false,favorites:[],saved:[],globalSearch:'',fieldQuery:'',detailQuery:'',detailTab:'fields',document:null,modal:null,notice:'',error:'',loginError:'',navCollapsed:false,fullscreen:false,panel:0,updated:''};
}
export function cleanSnapshot(raw={}) {
  const base=initialState(), result={};
  for(const key of snapshotKeys) result[key]=raw[key]??base[key];
  result.query=typeof result.query==='string'?result.query.slice(0,4000):'';
  if(!DATA_VIEWS.some(([v])=>v===result.view))result.view='all';
  if(!RANGES.some(([v])=>v===result.range))result.range='24h';
  if(!dashboardById(result.scope))result.scope='';
  result.filters=Array.isArray(result.filters)?result.filters.filter(f=>f&&FIELDS.includes(f.field)&&typeof f.value==='string').slice(0,30).map(f=>({field:f.field,value:f.value,exclude:Boolean(f.exclude)})):[];
  result.columns=Array.isArray(result.columns)?[...new Set(result.columns.filter(f=>FIELDS.includes(f)))]:[...DEFAULT_COLUMNS];
  if(!result.columns.length)result.columns=['@timestamp'];
  if(!FIELDS.includes(result.sort))result.sort='@timestamp';
  if(!['asc','desc'].includes(result.dir))result.dir='desc';
  for(const k of ['from','to']) if(typeof result[k]!=='string'||!Number.isFinite(Date.parse(result[k])))result[k]=base[k];
  return result;
}

export function createKibana(bridge) {
  const state=initialState(); let authenticated=false, focusReturn=null;
  try {authenticated=sessionStorage.getItem('security-kibana-session')==='test';} catch {}
  const favorites=storage.get('favorites',[]), saved=storage.get('searches',[]);
  state.favorites=Array.isArray(favorites)?favorites.filter(id=>dashboardById(id)):[];
  state.saved=Array.isArray(saved)?saved.filter(s=>s&&typeof s.name==='string').map(s=>({...cleanSnapshot(s),name:s.name.slice(0,90)})):[];
  function sync() {
    const url=new URL(location.href), tail=url.pathname.replace(/^\/tools\/kibana\/?/,'').split('/');
    state.page=tail[0]==='discover'?'discover':tail[0]==='visualizations'?'visualizations':tail[0]==='dashboard'&&dashboardById(tail[1])?'dashboard':'catalog';
    state.dashboard=dashboardById(tail[1])?.id||'security-overview';
    let filters=[], columns;
    try {filters=JSON.parse(url.searchParams.get('filters')||'[]');columns=JSON.parse(url.searchParams.get('columns')||'null');} catch {}
    Object.assign(state,cleanSnapshot({query:url.searchParams.get('q')||'',view:url.searchParams.get('view')||'all',range:url.searchParams.get('range')||'24h',from:url.searchParams.get('from')||undefined,to:url.searchParams.get('to')||undefined,filters,columns:columns||DEFAULT_COLUMNS,scope:url.searchParams.get('scope')||'',sort:url.searchParams.get('sort')||'@timestamp',dir:url.searchParams.get('dir')||'desc'}));
    state.queryDraft=state.query;state.document=null;state.modal=null;state.validationError='';
    state.tablePage=1;
  }
  // page is the route name; the reusable table receives tablePage as its page.
  function urlState(push=false) {
    const path=`/tools/kibana${state.page==='dashboard'?`/dashboard/${state.dashboard}`:state.page==='catalog'?'':`/${state.page}`}`, query=new URLSearchParams();
    if(state.query)query.set('q',state.query);
    if(state.view!=='all')query.set('view',state.view);
    query.set('range',state.range);
    if(state.range==='custom'){query.set('from',state.from);query.set('to',state.to);}
    if(state.filters.length)query.set('filters',JSON.stringify(state.filters));
    if(state.scope)query.set('scope',state.scope);
    if(JSON.stringify(state.columns)!==JSON.stringify(DEFAULT_COLUMNS))query.set('columns',JSON.stringify(state.columns));
    if(state.sort!=='@timestamp'||state.dir!=='desc'){query.set('sort',state.sort);query.set('dir',state.dir);}
    const url=`${path}?${query}`;
    if(`${location.pathname}${location.search}`!==url) history[push?'pushState':'replaceState'](null,'',url);
  }
  function rows() {
    if(state.validationError){state.error=state.validationError;return [];}
    const scope=state.page==='dashboard'||state.modal==='inspect'?dashboardById(state.dashboard)?.scope:dashboardById(state.scope)?.scope;
    try {const docs=filterDocuments(DOCUMENTS,state,scope||(()=>true));state.error='';return docs;} catch(error) {state.error=error.message;return [];}
  }
  function redraw({url=false,push=false,top=false,modalFocus=false}={}) {
    if(url)urlState(push);
    state.fromInput=dateInput(state.from);state.toInput=dateInput(state.to);
    bridge.render({focus:true,scrollTop:top});
    if(top)window.scrollTo(0,0);
    if(modalFocus) requestAnimationFrame(()=>document.querySelector('.k-modal input, .k-modal button, .k-document-drawer button')?.focus());
  }
  function notice(text) {state.notice=text;}
  function addFilter(filter) {
    if(!FIELDS.includes(filter.field))return;
    const value={field:filter.field,value:String(filter.value),exclude:Boolean(filter.exclude)};
    if(!state.filters.some(f=>JSON.stringify(f)===JSON.stringify(value)))state.filters.push(value);
    state.tablePage=1;state.document=null;state.modal=null;redraw({url:true,push:true});
  }
  function go(page,id) {state.page=page;if(id)state.dashboard=id;state.document=null;state.modal=null;state.globalSearch='';state.tablePage=1;state.error='';state.validationError='';state.fullscreen=false;redraw({url:true,push:true,top:true});}
  function openModal(name) {focusReturn=document.activeElement;state.modal=name;state.document=null;redraw({modalFocus:true});}
  function download(name, value) {
    const blob=new Blob([JSON.stringify(value,null,2)],{type:'application/json'}), url=URL.createObjectURL(blob), a=document.createElement('a');a.href=url;a.download=name;document.body.append(a);a.click();a.remove();setTimeout(()=>URL.revokeObjectURL(url),1000);notice('Exportación JSON preparada.');
  }
  function action(action,value) {
    let payload;try{payload=JSON.parse(value);}catch{payload=value;}
    switch(action) {
      case 'catalog':go('catalog');return;
      case 'nav':if(value==='discover'&&state.page==='dashboard')state.scope=state.dashboard;go(value);return;
      case 'dashboard':if(!dashboardById(value))return;state.scope='';go('dashboard',value);return;
      case 'logout':authenticated=false;try{sessionStorage.removeItem('security-kibana-session');}catch{}state.loginError='';state.document=null;state.modal=null;state.notice='';redraw();return;
      case 'toggle-nav':state.navCollapsed=!state.navCollapsed;break;
      case 'fullscreen':state.fullscreen=!state.fullscreen;break;
      case 'help':case 'columns':case 'filter-modal':case 'save-search':case 'saved':openModal(action);return;
      case 'share':urlState();state.shareUrl=location.href;openModal('share');return;
      case 'copy-link':navigator.clipboard?.writeText(state.shareUrl).then(()=>{notice('Enlace copiado.');redraw();}).catch(()=>{notice('Selecciona y copia el enlace de la ventana.');redraw();});if(!navigator.clipboard)notice('Selecciona y copia el enlace de la ventana.');break;
      case 'close':state.modal=null;state.document=null;redraw();requestAnimationFrame(()=>{if(focusReturn?.dataset.kAction)document.querySelector(`[data-k-action="${focusReturn.dataset.kAction}"]`)?.focus();});return;
      case 'dismiss':state.notice='';break;
      case 'refresh':state.updated=new Intl.DateTimeFormat('es-ES',{timeZone:'Europe/Madrid',hour:'2-digit',minute:'2-digit',second:'2-digit'}).format(new Date());notice('Vista recalculada sobre el corte fijo de demostración.');break;
      case 'filter':addFilter(payload);return;
      case 'remove-filter':state.filters.splice(Number(value),1);state.tablePage=1;redraw({url:true,push:true});return;
      case 'clear':Object.assign(state,{query:'',queryDraft:'',filters:[],view:'all',scope:'',tablePage:1,validationError:''});redraw({url:true,push:true});return;
      case 'clear-scope':state.scope='';redraw({url:true,push:true});return;
      case 'time-zoom':state.from=new Date(payload.from).toISOString();state.to=new Date(payload.to).toISOString();state.range='custom';state.tablePage=1;redraw({url:true,push:true});return;
      case 'sort':if(state.sort===value)state.dir=state.dir==='asc'?'desc':'asc';else {state.sort=value;state.dir='desc';}state.tablePage=1;redraw({url:true});return;
      case 'page':state.tablePage=Math.min(Math.max(1,Math.ceil(rows().length/state.pageSize)),Math.max(1,state.tablePage+Number(value)));break;
      case 'column':if(state.columns.includes(value)){if(state.columns.length===1){notice('Mantén al menos una columna visible.');break;}state.columns=state.columns.filter(f=>f!==value);}else if(FIELDS.includes(value))state.columns.push(value);redraw({url:true});return;
      case 'field-detail':state.field=value;openModal('field-detail');return;
      case 'document':focusReturn=document.activeElement;state.document=value;state.detailTab='fields';state.detailQuery='';state.modal=null;redraw({modalFocus:true});return;
      case 'detail-tab':state.detailTab=value;break;
      case 'export':download('kibana-eventos-demo.json',rows().map(structuredDocument));break;
      case 'export-document':download(`kibana-${value}.json`,structuredDocument(DOCUMENTS.find(d=>d._id===value)));break;
      case 'favorite':state.favorites=state.favorites.includes(value)?state.favorites.filter(id=>id!==value):[...state.favorites,value];if(!storage.set('favorites',state.favorites))notice('Favorito aplicado a esta sesión; el almacenamiento no está disponible.');break;
      case 'favorites-only':state.favoritesOnly=!state.favoritesOnly;break;
      case 'inspect':state.panel=Number(value);openModal('inspect');return;
      case 'visualization':state.dashboard=payload.dashboard;state.panel=payload.panel;state.scope='';state.view='all';openModal('inspect');return;
      case 'discover-current':state.scope=state.dashboard;go('discover');return;
      case 'global-discover':state.query=value;state.queryDraft=value;state.scope='';state.view='all';go('discover');return;
      case 'example':state.query=value;state.queryDraft=value;state.modal=null;state.tablePage=1;redraw({url:true,push:true});return;
      case 'load-search':Object.assign(state,cleanSnapshot(state.saved[Number(value)]));state.queryDraft=state.query;go('discover');return;
      case 'delete-search':state.saved.splice(Number(value),1);if(!storage.set('searches',state.saved))notice('El almacenamiento no está disponible.');break;
      case 'platform-alert':bridge.openAlert(value);return;
      case 'platform-case':bridge.openCase(value);return;
      case 'create-case':bridge.createCase(value);return;
      case 'investigate-source':{const doc=DOCUMENTS.find(d=>d._id===value);state.scope='';state.view='all';state.query='';state.queryDraft='';state.filters=[{field:'source.ip',value:doc['source.ip'],exclude:false}];go('discover');return;}
      case 'related-dashboard':{const doc=DOCUMENTS.find(d=>d._id===value), d=DASHBOARDS.find(d=>d.id===`tpot-${doc['honeypot.name']}`)||DASHBOARDS.find(d=>!['security-overview','network-security','incident-investigation'].includes(d.id)&&d.scope(doc))||DASHBOARDS[0];state.scope='';state.view='all';state.filters=doc['alert.id']?[{field:'alert.id',value:doc['alert.id'],exclude:false}]:[{field:'source.ip',value:doc['source.ip'],exclude:false}];state.query='';state.queryDraft='';go('dashboard',d.id);return;}
      default:return;
    }
    redraw();
  }
  function handleClick(event) {
    const target=event.target.closest('[data-k-action]');if(!target||target.disabled)return false;
    event.preventDefault();action(target.dataset.kAction,target.dataset.kValue||'');return true;
  }
  function handleInput(event) {
    const field=event.target.dataset.kField;
    if(['queryDraft','catalogQuery','globalSearch','fieldQuery','detailQuery'].includes(field)) {state[field]=event.target.value;if(field!=='queryDraft')redraw();return true;}
    return false;
  }
  function handleChange(event) {
    if(event.target.dataset.kColumn){action('column',event.target.dataset.kColumn);return true;}
    if(event.target.id==='k-filter-field'){document.getElementById('k-filter-values').innerHTML=aggregate(DOCUMENTS,event.target.value,Infinity).map(x=>`<option value="${esc(x.label)}"></option>`).join('');return true;}
    const field=event.target.dataset.kField;if(!field)return false;
    if(['queryDraft','catalogQuery','globalSearch','fieldQuery','detailQuery'].includes(field))return true;
    state.validationError='';
    if(['range','view','category'].includes(field))state[field]=event.target.value;
    if(field==='pageSize')state.pageSize=Number(event.target.value);
    if(field==='source'||field==='severity') {
      const name=field==='source'?'source.ip':'event.severity';state.filters=state.filters.filter(f=>f.field!==name||f.exclude);
      if(event.target.value)state.filters.push({field:name,value:event.target.value,exclude:false});
    }
    state.tablePage=1;redraw({url:field!=='category',push:true});return true;
  }
  function handleSubmit(event) {
    if(!event.target.id.startsWith('k-'))return false;event.preventDefault();const form=new FormData(event.target);
    if(event.target.id==='k-login-form') {
      if(form.get('username')==='test'&&form.get('password')==='test'){authenticated=true;state.loginError='';try{sessionStorage.setItem('security-kibana-session','test');}catch{}redraw({top:true});}else{state.loginError='Usuario o contraseña incorrectos. Utiliza test / test.';redraw();document.getElementById('k-user')?.focus();}return true;
    }
    if(event.target.id==='k-query-form') {
      state.validationError='';state.query=state.queryDraft;state.tablePage=1;redraw({url:true,push:true});return true;
    }
    if(event.target.id==='k-range-form') {
      const from=madridDate(form.get('from')),to=madridDate(form.get('to'));
      try{timeBounds({range:'custom',from,to});}catch(error){state.validationError=error.message;bridge.render({focus:true});return true;}
      state.validationError='';state.from=from;state.to=to;state.range='custom';state.tablePage=1;redraw({url:true,push:true});return true;
    }
    if(event.target.id==='k-filter-form') {addFilter({field:form.get('field'),value:form.get('value'),exclude:form.get('operator')==='exclude'});return true;}
    if(event.target.id==='k-save-form') {
      const name=String(form.get('name')).trim();if(!name)return true;
      state.saved.unshift({...cleanSnapshot(state),name});state.saved=state.saved.slice(0,30);state.modal=null;notice(storage.set('searches',state.saved)?'Búsqueda guardada en este navegador.':'Búsqueda guardada solo durante esta sesión.');redraw();return true;
    }
    return false;
  }
  function handleKey(event) {
    if(event.key==='Escape') {if(!authenticated)return false;state.modal=null;state.document=null;state.globalSearch='';state.fullscreen=false;redraw();return true;}
    if(event.key==='Tab'&&(state.modal||state.document)) {
      const dialog=document.querySelector('.k-modal, .k-document-drawer'), focusables=[...dialog.querySelectorAll('button:not(:disabled), input, select, [tabindex="0"]')];
      if(!dialog.contains(document.activeElement)){event.preventDefault();focusables[0]?.focus();}
      if(event.shiftKey&&document.activeElement===focusables[0]){event.preventDefault();focusables.at(-1)?.focus();}
      if(!event.shiftKey&&document.activeElement===focusables.at(-1)){event.preventDefault();focusables[0]?.focus();}
    }
    if((event.key==='Enter'||event.key===' ')&&event.target.matches('[role="button"][data-k-action]')) {event.preventDefault();action(event.target.dataset.kAction,event.target.dataset.kValue);return true;}
    if(event.key==='/'&&!event.target.matches('input,textarea,select')){event.preventDefault();document.querySelector('[data-k-field="globalSearch"]')?.focus();return true;}
    return false;
  }
  sync();
  return {
    render() {if(!authenticated)return renderLogin(state.loginError); const docs=rows();state.fromInput=dateInput(state.from);state.toInput=dateInput(state.to);return renderWorkspace({...state,tablePage:state.tablePage||1},docs,bridge.getData());},
    sync, handleClick, handleInput, handleChange, handleSubmit, handleKey,
    openRelated(alertIds) {const ids=Array.isArray(alertIds)?alertIds:[alertIds],query=ids.map(id=>`alert.id: ${JSON.stringify(id)}`).join(' OR ');Object.assign(state,{query,queryDraft:query,view:'all',range:'all',scope:'',filters:[]});go('discover');},
  };
}

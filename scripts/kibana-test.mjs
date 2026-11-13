import assert from 'node:assert/strict';
import { DOCUMENTS, DATA_VIEWS, DEFAULT_COLUMNS, DEMO_NOW, DAY, structuredDocument } from '../src/kibana/data.js';
import { DASHBOARDS, metricValue } from '../src/kibana/dashboards.js';
import { compileQuery, filterDocuments, aggregate, histogram, sortDocuments } from '../src/kibana/query.js';
import { initialState, cleanSnapshot, madridDate } from '../src/kibana/controller.js';
import { renderWorkspace, renderLogin } from '../src/kibana/views.js';
import { INITIAL_ALERTS, INITIAL_CASES, EVENTS } from '../src/data/demo.js';

const state=initialState(), data={alerts:INITIAL_ALERTS,cases:INITIAL_CASES};
assert.equal(DASHBOARDS.length,21);
assert.equal(DOCUMENTS.length,2924);
assert.equal(new Set(DOCUMENTS.map(d=>d._id)).size,DOCUMENTS.length);
assert(renderLogin().includes('Credenciales de demostración'));
for (const event of EVENTS) {
  const doc=DOCUMENTS.find(d=>d._id===event.id);
  assert.equal(doc['alert.id'],event.alertId);
  assert.equal(doc['source.ip'],event.source);
  assert.equal(doc['destination.ip'],event.destination);
  assert.equal(doc['message'],event.summary);
}
for (const doc of DOCUMENTS) {
  assert(doc['labels.synthetic']);
  assert(Date.parse(doc['@timestamp'])<=DEMO_NOW);
  for(const field of ['source.ip','destination.ip','threat.indicator.ip']) if(doc[field]) assert(/^(192\.0\.2|198\.51\.100|203\.0\.113)\.\d{1,3}$/.test(doc[field]),field);
  for(const field of ['dns.question.name','url.domain','tls.server.x509.subject.common_name'])if(doc[field])assert(doc[field].endsWith('.example'));
  assert.equal(structuredDocument(doc).source.ip,doc['source.ip']);
  if(doc['honeypot.name']==='ipphoney')assert.equal(doc['destination.port'],631);
}
const within24=filterDocuments(DOCUMENTS,state), within1=filterDocuments(DOCUMENTS,{...state,range:'1h'}), within7d=filterDocuments(DOCUMENTS,{...state,range:'7d'});
assert(within1.length<within24.length&&within24.length<within7d.length);
assert(within24.every(d=>Date.parse(d['@timestamp'])>=DEMO_NOW-DAY));
assert.equal(histogram(within24,state).reduce((sum,b)=>sum+b.value,0),within24.length);
const known=DOCUMENTS.find(d=>d['alert.id']==='ALT-260133');
for(const q of ['source.ip: "192.0.2.51"','alert.id: *','source.ip: 192.0.2.*','alert.id: ALT-260133 AND (event.severity: critical OR event.severity: high)','NOT event.severity: low','"Conexiones HTTPS"','network.bytes >= 0'])assert(compileQuery(q)(known),q);
for(const q of ['source.ip: 203.0.113.68','NOT alert.id: *','event.severity: low AND alert.id: ALT-260133'])assert(!compileQuery(q)(known),q);
for(const q of ['source.ip:', 'source.ip: "incomplete', '(event.severity: high', 'event.severity: high AND','network.bytes > high',')'])assert.throws(()=>compileQuery(q),q);
assert(compileQuery('event.severity: low OR event.severity: critical AND source.ip: 192.0.2.51')(known));
assert(!compileQuery('NOT (event.severity: low OR event.severity: critical)')(known));
assert(compileQuery('network.bytes > 30')({'network.bytes':31}));
assert(!compileQuery('network.bytes < 30')({}));
assert(compileQuery('dns.question.name: *.example')({'dns.question.name':'test.example'}));
assert(!compileQuery('dns.question.name: *.example')({'dns.question.name':'testXexample'}));
assert(compileQuery('rule.name: "A [literal].*"')({'rule.name':'A [literal].name'}));
assert.equal(madridDate('2026-11-13T11:00'),'2026-11-13T10:00:00.000Z');
assert.equal(madridDate('2026-07-13T11:00'),'2026-07-13T09:00:00.000Z');
assert.equal(madridDate('2026-03-29T02:30'),'');
assert.equal(filterDocuments(DOCUMENTS,{...state,range:'custom',from:known['@timestamp'],to:known['@timestamp']}).filter(d=>d._id===known._id).length,1);
assert.throws(()=>filterDocuments(DOCUMENTS,{...state,range:'custom',from:'bad',to:'bad'}));
for(const [view] of DATA_VIEWS)assert(filterDocuments(DOCUMENTS,{...state,view}).length>0,view);
for(const dashboard of DASHBOARDS) {
  const docs=filterDocuments(DOCUMENTS,state,dashboard.scope);
  assert(docs.length>0,dashboard.name);
  const src=docs[0]['source.ip'], filtered=filterDocuments(DOCUMENTS,{...state,filters:[{field:'source.ip',value:src}]},dashboard.scope);
  assert(filtered.length>0&&filtered.length<=docs.length);
  assert(filtered.every(d=>d['source.ip']===src));
  for(const p of dashboard.panels) if(p.field&&p.field!=='@timestamp')assert(docs.some(d=>d[p.field]!=null),`${dashboard.name}: missing ${p.field}`);
  const html=renderWorkspace({...state,page:'dashboard',dashboard:dashboard.id},docs,data);
  assert(html.includes(dashboard.name));
  assert(!html.includes('NaN'),dashboard.name);
  assert.equal((html.match(/data-k-panel=/g)||[]).length,dashboard.panels.length);
  assert.equal(histogram(filtered,state).reduce((sum,b)=>sum+b.value,0),filtered.length);
  for(const m of dashboard.metrics)assert.notEqual(String(metricValue(filtered,m)),'NaN');
  const empty=renderWorkspace({...state,page:'dashboard',dashboard:dashboard.id},[],data);
  assert(empty.includes('Sin resultados'));assert(!empty.includes('NaN'));
}
const exclude=filterDocuments(DOCUMENTS,{...state,filters:[{field:'event.severity',value:'critical',exclude:true}]});
assert(exclude.every(d=>d['event.severity']!=='critical'));
assert.equal(aggregate(within24,'event.dataset',Infinity).reduce((s,x)=>s+x.value,0),within24.length);
assert.deepEqual(sortDocuments([{'n':100},{'n':9},{'n':20}],'n','asc').map(d=>d.n),[9,20,100]);
const sanitized=cleanSnapshot({filters:[{field:'invalid',value:'x'}],columns:['bad'],range:'bad',query:42,scope:'unknown'});
assert.equal(sanitized.query,'');assert.deepEqual(sanitized.filters,[]);assert.deepEqual(sanitized.columns,['@timestamp']);assert.equal(sanitized.range,'24h');
const hostile=renderWorkspace({...state,page:'discover',queryDraft:'"><img src=x onerror=alert(1)>',columns:DEFAULT_COLUMNS},within24,data);
assert(!hostile.includes('<img src=x'));
console.log('✓ Kibana: 21 dashboards, 2.924 documentos, privacidad, correlaciones, KQL, filtros, métricas, histogramas, rangos y renderización verificados.');

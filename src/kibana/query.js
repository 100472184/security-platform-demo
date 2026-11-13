import { DEMO_NOW, HOUR, DAY, matchesView } from './data.js';

export const RANGES = [['1h','Última hora'], ['6h','Últimas 6 horas'], ['24h','Últimas 24 horas'], ['7d','Últimos 7 días'], ['30d','Últimos 30 días'], ['90d','Últimos 90 días'], ['365d','Último año'], ['all','Todo el periodo'], ['custom','Rango absoluto…']];
export function timeBounds(state) {
  if (state.range === 'custom') {
    const from = Date.parse(state.from), to = Date.parse(state.to);
    if (!Number.isFinite(from) || !Number.isFinite(to) || from > to) throw new Error('El rango necesita dos fechas válidas; el inicio debe ser anterior al final.');
    return [from, to];
  }
  const durations = {'1h':HOUR, '6h':6*HOUR, '24h':DAY, '7d':7*DAY, '30d':30*DAY, '90d':90*DAY, '365d':365*DAY, all:365*DAY};
  return [DEMO_NOW - (durations[state.range] || DAY), DEMO_NOW];
}
function tokenize(query) {
  const tokens = []; let i = 0;
  while (i < query.length) {
    const c = query[i];
    if (/\s/.test(c)) {i++; continue;}
    if (c === '"') {
      let text = ''; i++; let closed = false;
      while (i < query.length) {if (query[i] === '"') {i++; closed = true; break;} if (query[i] === '\\' && i + 1 < query.length) i++; text += query[i++];}
      if (!closed) throw new Error('Falta cerrar una comilla en la consulta.');
      tokens.push({value:text, quoted:true}); continue;
    }
    if ('():<>='.includes(c)) {let value = c; i++; if ('<>'.includes(c) && query[i] === '=') value += query[i++]; tokens.push({value}); continue;}
    const start = i; while (i < query.length && !/[\s():<>="”]/.test(query[i])) i++;
    if (i === start) throw new Error('Utiliza comillas dobles rectas en la consulta.');
    tokens.push({value:query.slice(start,i)});
  }
  return tokens;
}
const wildcard = value => new RegExp(`^${value.split('*').map(s => s.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')).join('.*')}$`, 'i');
export function compileQuery(query = '') {
  if (!query.trim() || query.trim() === '*') return () => true;
  const tokens = tokenize(query); let position = 0;
  const peek = v => tokens[position] && !tokens[position].quoted && tokens[position].value.toUpperCase() === v;
  function term() {
    if (peek('NOT')) {position++; const match = term(); return doc => !match(doc);}
    if (peek('(')) {position++; const match = expression(); if (!peek(')')) throw new Error('Falta cerrar un paréntesis.'); position++; return match;}
    const token = tokens[position++];
    if (!token || (!token.quoted && ['AND','OR',')',':','>','<','>=','<=','='].includes(token.value.toUpperCase()))) throw new Error('Se esperaba un término o campo:valor.');
    const field = token.value;
    if ([':', '>', '<', '>=', '<=', '='].includes(tokens[position]?.value)) {
      const op = tokens[position++].value, value = tokens[position++];
      if (!value || (!value.quoted && ['AND','OR','NOT','(',')',':','>','<','>=','<=','='].includes(value.value.toUpperCase()))) throw new Error(`Falta un valor después de ${field}${op}`);
      if (op === ':' || op === '=') {const pattern = wildcard(value.value); return doc => value.value === '*' ? doc[field] != null : doc[field] != null && pattern.test(String(doc[field]));}
      const number = Number(value.value); if (!Number.isFinite(number)) throw new Error('Las comparaciones >, >=, < y <= requieren un número.');
      return doc => {const current = doc[field]; if (current == null || !Number.isFinite(Number(current))) return false; return op === '>' ? +current > number : op === '<' ? +current < number : op === '>=' ? +current >= number : +current <= number;};
    }
    const text = field.toLowerCase();
    if (text.includes('*')) {const pattern = wildcard(`*${text}*`); return doc => Object.values(doc).some(v => pattern.test(String(v)));}
    return doc => Object.values(doc).some(v => String(v).toLowerCase().includes(text));
  }
  function conjunction() {
    let match = term();
    while (position < tokens.length && !peek('OR') && !peek(')')) {if (peek('AND')) position++; const right = term(), left = match; match = doc => left(doc) && right(doc);}
    return match;
  }
  function expression() {let match = conjunction(); while (peek('OR')) {position++; const right = conjunction(), left = match; match = doc => left(doc) || right(doc);} return match;}
  const match = expression(); if (position < tokens.length) throw new Error('Paréntesis o símbolo inesperado.'); return match;
}
export function filterDocuments(documents, state, scope = () => true) {
  const match = compileQuery(state.query), [from,to] = timeBounds(state);
  return documents.filter(doc => {
    const time = Date.parse(doc['@timestamp']);
    return time >= from && time <= to && matchesView(doc, state.view || 'all') && scope(doc) && match(doc)
      && (state.filters || []).every(f => f.exclude ? String(doc[f.field]) !== f.value : String(doc[f.field]) === f.value);
  });
}
export function aggregate(documents, field, limit = 8) {
  const counts = new Map();
  for (const doc of documents) if (doc[field] != null) counts.set(String(doc[field]), (counts.get(String(doc[field])) || 0) + 1);
  return [...counts].map(([label,value]) => ({label,value})).sort((a,b) => b.value - a.value || a.label.localeCompare(b.label)).slice(0,limit);
}
export function histogram(documents, state, count = 24) {
  const [from,to] = timeBounds(state), width = Math.max(1, (to-from)/count);
  const bins = Array.from({length:count}, (_,i) => ({from:from+i*width, to:i===count-1?to:from+(i+1)*width-1, value:0}));
  for (const doc of documents) {const i = Math.min(count-1,Math.floor((Date.parse(doc['@timestamp'])-from)/width)); if (i>=0 && i<count) bins[i].value++;}
  return bins;
}
export function sortDocuments(documents, field, dir) {
  return [...documents].sort((a,b) => {const x=a[field], y=b[field]; if(x==null) return y==null?0:1; if(y==null) return -1; const v=typeof x==='number' && typeof y==='number'?x-y:String(x).localeCompare(String(y), 'es', {numeric:true}); return dir==='asc'?v:-v;});
}

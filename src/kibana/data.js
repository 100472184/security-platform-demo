import { EVENTS, INITIAL_ALERTS, IOCS } from '../data/demo.js';

// Stable demo clock: results remain reproducible, regardless of the actual date.
export const DEMO_NOW = Date.parse('2026-11-13T10:00:00Z');
export const HOUR = 3_600_000;
export const DAY = 24 * HOUR;
export const DATA_VIEWS = [
  ['all', 'Security events · *'], ['suricata', 'suricata-*'], ['zeek', 'zeek-*'],
  ['endpoint', 'endpoint-*'], ['authentication', 'authentication-*'], ['dns', 'dns-*'],
  ['http', 'http-*'], ['firewall', 'firewall-*'], ['system', 'system-*'], ['tpot', 'tpot-*'],
  ...['cowrie', 'sentrypeer', 'adbhoney', 'miniprint', 'heralding', 'dionaea', 'ipphoney', 'redishoneypot'].map(x => [`tpot.${x}`, `tpot-${x}-*`]),
];
const datasets = ['suricata.alert', 'zeek.connection', 'zeek.dns', 'zeek.http', 'zeek.tls',
  'endpoint.events', 'authentication.events', 'dns.events', 'http.access', 'firewall.events', 'system.metrics',
  'tpot.cowrie', 'tpot.sentrypeer', 'tpot.adbhoney', 'tpot.miniprint', 'tpot.heralding', 'tpot.dionaea', 'tpot.ipphoney', 'tpot.redishoneypot'];
const sources = ['192.0.2.51', '198.51.100.27', '192.0.2.61', '198.51.100.95', '192.0.2.41', '203.0.113.19', '192.0.2.78'];
const protocols = ['tls', 'dns', 'http', 'ssh', 'smb', 'smtp'];
const ports = {tls:443, dns:53, http:80, ssh:22, smb:445, smtp:25, sip:5060, adb:5555, printer:9100, redis:6379, pop3:110, imap:143, postgresql:5432, mqtt:1883, ftp:21};
const domains = ['updates-cdn.example', 'auth-gateway.example', 'portal.example', 'resolver.example', 'packages.example', 'random-query.example'];
const rules = ['DEMO IDS Periodic TLS connection', 'DEMO IDS DNS unusual query', 'DEMO IDS Service scan', 'DEMO IDS Web signature', 'DEMO IDS Suspicious SMB'];
const pick = (values, n) => values[Math.abs(n) % values.length];

function sample(dataset, n, time, id) {
  const group = dataset.split('.')[0];
  let protocol = pick(protocols, n);
  if (dataset.includes('dns')) protocol = 'dns';
  if (dataset.includes('http') || dataset.endsWith('ipphoney')) protocol = 'http';
  if (dataset.endsWith('tls')) protocol = 'tls';
  if (dataset.endsWith('cowrie')) protocol = 'ssh';
  if (dataset.endsWith('sentrypeer')) protocol = 'sip';
  if (dataset.endsWith('adbhoney')) protocol = 'adb';
  if (dataset.endsWith('miniprint')) protocol = 'printer';
  if (dataset.endsWith('redishoneypot')) protocol = 'redis';
  if (dataset.endsWith('heralding')) protocol = pick(['pop3', 'imap', 'postgresql', 'ssh'], n);
  if (dataset.endsWith('dionaea')) protocol = pick(['smb', 'ftp', 'mqtt', 'http'], n);
  const actions = {
    suricata: ['alert'], zeek: [dataset.slice(5)], endpoint: ['process.start', 'file.creation', 'registry.set', 'process.start'],
    authentication: ['login.failure', 'login.failure', 'login.success'], dns: ['dns.query'], http: ['http.request'],
    firewall: ['allow', 'deny', 'deny', 'allow'], system: ['metric.sample', 'service.healthy', 'service.degraded'],
  };
  const honeypotActions = {
    cowrie: ['session.connect', 'login.failed', 'login.success', 'command.input', 'file.download', 'session.closed'],
    sentrypeer: ['options', 'register'], adbhoney: ['connection.open', 'connection.closed'],
    miniprint: ['connection.open', 'command.received', 'print_job.saved', 'response.sent', 'connection.closed'],
    heralding: ['session.connect', 'authentication.failure', 'session.closed'],
    dionaea: ['connection.accept', 'download.complete', 'mqtt.publish'], ipphoney: ['request'],
    redishoneypot: ['connection.open', 'command', 'connection.closed'],
  };
  const hp = dataset.slice(5);
  const action = group === 'tpot' ? `${hp}.${pick(honeypotActions[hp], n)}` : pick(actions[group], n);
  const severity = group === 'system' ? (n % 9 === 0 ? 'medium' : 'info') : pick(['low', 'low', 'medium', 'high', 'low', 'critical', 'medium'], n);
  const doc = {
    '_id': id, '_index': `${dataset.replaceAll('.', '-')}-2026.11`, '@timestamp': new Date(time).toISOString(),
    'event.dataset': dataset, 'event.kind': group === 'suricata' ? 'alert' : 'event', 'event.action': action,
    'event.severity': severity, 'event.outcome': /fail|deny|degraded/.test(action) ? 'failure' : 'success',
    'source.ip': pick(sources, n), 'source.port': 49152 + n % 16000,
    'destination.ip': n % 3 ? '203.0.113.68' : '192.0.2.12', 'destination.port': ports[protocol],
    'network.protocol': protocol, 'network.transport': ['dns', 'sip'].includes(protocol) ? 'udp' : 'tcp',
    'network.bytes': 300 + (n * 7919) % 190000, 'host.name': `workstation-${String(n % 8 + 1).padStart(2, '0')}`,
    'observer.name': `sensor-0${n % 3 + 1}`, 'source.geo.country_name': pick(['España', 'Francia', 'Alemania', 'Estados Unidos', 'Japón'], n),
    'labels.synthetic': true, 'message': `${dataset}: ${action} observado en un sistema de demostración.`,
  };
  // Geography is explicitly assigned to fictional events; it is never an IP lookup.
  if (group === 'suricata') {
    doc['rule.name'] = pick(rules, n); doc['rule.id'] = `DEMO-IDS-${100 + n % 5}`;
    doc['rule.category'] = pick(['Network anomaly', 'Potentially bad traffic', 'Web application', 'Protocol activity'], n);
  }
  if (protocol === 'dns') {doc['dns.question.name'] = pick(domains, n); doc['dns.response_code'] = n % 4 ? 'NOERROR' : 'NXDOMAIN'; doc['dns.question.type'] = pick(['A', 'AAAA', 'TXT'], n);}
  if (protocol === 'http') {doc['http.request.method'] = group === 'tpot' ? 'GET' : pick(['GET', 'GET', 'POST', 'PUT'], n); doc['http.response.status_code'] = pick([200, 200, 404, 403, 500], n); doc['url.domain'] = pick(domains, n); doc['url.path'] = pick(['/', '/api/status', '/login', '/printers', '/health'], n);}
  if (protocol === 'tls') {doc['tls.version'] = n % 4 ? '1.3' : '1.2'; doc['tls.server.x509.subject.common_name'] = pick(domains, n);}
  if (group === 'endpoint') {doc['process.name'] = pick(['powershell.exe', 'cmd.exe', 'python3', 'systemd', 'explorer.exe'], n); doc['process.pid'] = 1024 + n; doc['process.parent.name'] = n % 2 ? 'explorer.exe' : 'services.exe';}
  if (['endpoint', 'authentication', 'tpot'].includes(group)) doc['user.name'] = pick(['demo.analyst', 'demo.operator', 'demo.service', 'demo.guest'], n);
  if (group === 'firewall') {doc['rule.name'] = pick(['DEMO Allow HTTPS', 'DEMO Block unknown ingress', 'DEMO Deny restricted port', 'DEMO Allow DNS'], n); doc['rule.id'] = `FW-${n % 4 + 1}`;}
  if (group === 'system') {
    doc['host.name'] = pick(['sensor-01', 'search-01', 'manager-01'], n);
    doc['system.cpu.pct'] = +(0.12 + (n * 7 % 75) / 100).toFixed(2);
    doc['system.memory.used.pct'] = +(0.3 + (n * 3 % 60) / 100).toFixed(2);
    doc['service.name'] = pick(['ingest', 'search', 'dashboard', 'collector'], n);
  }
  if (group === 'tpot') {
    doc['destination.ip'] = '192.0.2.200'; doc['honeypot.name'] = hp;
    if (hp === 'ipphoney') doc['destination.port'] = 631;
    if (hp === 'sentrypeer') doc['network.transport'] = n % 6 ? 'udp' : 'tcp';
    doc['session.id'] = `demo-session-${hp}-${Math.floor(n / 3)}`;
    if (hp === 'cowrie' && action.endsWith('command.input')) doc['process.command_line'] = pick(['uname -a', 'id', 'ls /tmp', 'exit'], Math.floor(n / 6));
    if (hp === 'cowrie' && action.endsWith('file.download')) doc['file.name'] = `artifact-demo-${n % 3}.txt`;
    if (hp === 'sentrypeer') {doc['sip.method'] = action.endsWith('options') ? 'OPTIONS' : 'REGISTER'; doc['user_agent.original'] = 'Demo SIP Client/1.0';}
    if (hp === 'redishoneypot' && action.endsWith('.command')) doc['redis.command'] = n % 2 ? 'PING' : 'INFO';
    if (hp === 'adbhoney' && action.endsWith('closed')) doc['event.duration'] = (200 + n % 100) * 1_000_000_000;
    if (hp === 'miniprint' && action.endsWith('saved')) doc['file.name'] = `print-demo-${n}.prn`;
  }
  if (n % 4 === 0 && group !== 'system') {
    doc['threat.indicator.ip'] = doc['destination.ip'];
    doc['threat.indicator.provider'] = 'Synthetic intelligence';
    doc['threat.indicator.confidence'] = pick(['High', 'Medium', 'Low'], n);
    doc['threat.indicator.type'] = 'ipv4-addr';
  }
  return doc;
}

const supplemental = datasets.flatMap((dataset, d) => Array.from({length:144}, (_, i) => {
  const age = i < 48 ? (i * 0.48 + d * 0.014) * HOUR : i < 88 ? (1 + (i - 48) * 0.145) * DAY : i < 120 ? (7 + (i - 88) * 0.7) * DAY : (32 + (i - 120) * 11) * DAY;
  return sample(dataset, i + d * 151, DEMO_NOW - age - 60_000, `KBN-${d + 1}-${String(i + 1).padStart(4, '0')}`);
}));
const mapped = EVENTS.map((event, i) => {
  const dataset = {network:'suricata.alert', endpoint:'endpoint.events', identity:'authentication.events', dns:'dns.events'}[event.sensor];
  const doc = sample(dataset, i, Date.parse(`${event.time}+01:00`), event.id);
  Object.assign(doc, {'source.ip':event.source, 'destination.ip':event.destination, 'event.severity':event.severity,
    'alert.id':event.alertId, 'rule.id':event.rule, 'rule.name':INITIAL_ALERTS.find(a => a.id === event.alertId).title,
    'message':event.summary, 'platform.event_id':event.id});
  if (event.sensor === 'identity') {doc['event.action'] = /fallo|intento/i.test(event.summary) ? 'login.failure' : 'login.success'; doc['event.outcome'] = doc['event.action'] === 'login.failure' ? 'failure' : 'success';}
  if (event.sensor === 'dns') doc['dns.question.name'] = 'updates-cdn.example';
  if (event.alertId === 'ALT-260133' || event.alertId === 'ALT-260135') {
    doc['network.protocol'] = 'tls'; doc['destination.port'] = 443;
    doc['threat.indicator.ip'] = event.destination; doc['threat.indicator.type'] = 'ipv4-addr';
    doc['threat.indicator.confidence'] = 'High'; doc['threat.indicator.provider'] = 'Synthetic intelligence';
  }
  return doc;
});
export const DOCUMENTS = [...mapped, ...supplemental].sort((a,b) => b['@timestamp'].localeCompare(a['@timestamp']));
export const FIELDS = [...new Set(DOCUMENTS.flatMap(Object.keys))].sort();
export const DEFAULT_COLUMNS = ['@timestamp', 'event.dataset', 'source.ip', 'destination.ip', 'event.action', 'event.severity'];
export const DEMO_INDICATORS = IOCS;
export function matchesView(doc, view) {return view === 'all' || doc['event.dataset'] === view || doc['event.dataset'].startsWith(`${view}.`);}
export function structuredDocument(doc) {
  const result = {};
  for (const [field, value] of Object.entries(doc)) {
    const keys = field.startsWith('@') || field.startsWith('_') ? [field] : field.split('.');
    let parent = result;
    keys.forEach((key, i) => {if (i === keys.length - 1) parent[key] = value; else parent = parent[key] ||= {};});
  }
  return result;
}

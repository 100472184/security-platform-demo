const metric = (label, type = 'count', field, value) => ({label,type,field,value});
const panel = (title, type, field, span = 1) => ({title,type,field,span});
const sources = () => panel('Direcciones de origen', 'bar', 'source.ip');
const timeline = (title = 'Actividad a lo largo del tiempo', type = 'area', span = 2) => panel(title,type,'@timestamp',span);
const logs = (title = 'Eventos recientes') => panel(title,'logs',null,2);
const severity = () => panel('Distribución de severidad','donut','event.severity');
const scope = (...prefixes) => doc => prefixes.some(p => doc['event.dataset'].startsWith(p));
const uniqueSources = () => metric('Orígenes únicos','unique','source.ip');
const alerts = () => metric('Alertas IDS','match','event.kind','alert');

export const DASHBOARDS = [
  {id:'security-overview',name:'Security Overview',category:'Seguridad',icon:'shield-check',description:'Visión unificada de la actividad, las alertas y el riesgo en el entorno.', scope:()=>true,
    metrics:[metric('Eventos'),alerts(),uniqueSources(),metric('Severidad crítica','match','event.severity','critical')],
    panels:[timeline('Volumen de eventos y tendencias'),severity(),panel('Eventos por conjunto de datos','bar','event.dataset'),panel('Actividad por región · geografía ficticia','geo','source.geo.country_name'),sources(),logs()]},
  {id:'network-security',name:'Network Security',category:'Red',icon:'network',description:'Conexiones, volumen transferido, protocolos y comunicaciones sospechosas.',scope:scope('zeek','suricata','firewall'),
    metrics:[metric('Conexiones'),metric('Tráfico total','bytes','network.bytes'),uniqueSources(),metric('Destinos únicos','unique','destination.ip')],
    panels:[timeline('Conexiones de red','line'),panel('Protocolos observados','donut','network.protocol'),panel('Destinos más frecuentes','bar','destination.ip'),sources(),panel('Puertos de destino','bar','destination.port'),logs('Conexiones recientes')]},
  {id:'suricata-alerts',name:'Suricata Alerts',category:'Seguridad',icon:'shield-alert',description:'Alertas IDS: firmas, categorías, severidades y registros correlacionados con la plataforma.',scope:scope('suricata'),
    metrics:[metric('Alertas'),metric('Firmas activas','unique','rule.name'),uniqueSources(),metric('Alertas altas','match','event.severity','high')],
    panels:[timeline('Alertas IDS por intervalo','line'),panel('Firmas de detección','bar','rule.name',2),severity(),panel('Categorías de regla','bar','rule.category'),sources(),panel('Destinos de las alertas','bar','destination.ip'),logs('Alertas Suricata · documentos')]},
  {id:'zeek-network',name:'Zeek Network Monitoring',category:'Red',icon:'waypoints',description:'Exploración de conexiones y registros DNS, HTTP y TLS del sensor de red.',scope:scope('zeek'),
    metrics:[metric('Registros Zeek'),metric('Tipos de registro','unique','event.dataset'),metric('Dominios DNS','unique','dns.question.name'),metric('Tráfico observado','bytes','network.bytes')],
    panels:[panel('Tipos de log','donut','event.dataset'),panel('Versiones TLS','donut','tls.version'),timeline('Registros Zeek por intervalo','histogram'),panel('Consultas DNS','bar','dns.question.name'),panel('Destinos HTTP','bar','url.domain'),logs('Registros de conexión y aplicación')]},
  {id:'endpoint-security',name:'Endpoint Security',category:'Seguridad',icon:'monitor',description:'Ejecución de procesos, modificaciones de archivos y actividad de los equipos.',scope:scope('endpoint'),
    metrics:[metric('Eventos de endpoint'),metric('Equipos','unique','host.name'),metric('Procesos','unique','process.name'),metric('Severidad alta','match','event.severity','high')],
    panels:[panel('Procesos observados','bar','process.name'),panel('Actividad por equipo','bar','host.name'),timeline('Actividad de endpoints'),panel('Tipos de actividad','donut','event.action'),severity(),logs('Procesos y cambios recientes')]},
  {id:'authentication',name:'Authentication Monitoring',category:'Identidad',icon:'lock',description:'Autenticaciones correctas y fallidas, cuentas y orígenes de actividad anómala.',scope:scope('authentication'),
    metrics:[metric('Autenticaciones'),metric('Fallidas','match','event.action','login.failure'),metric('Correctas','match','event.action','login.success'),metric('Cuentas','unique','user.name')],
    panels:[timeline('Intentos de autenticación','histogram'),panel('Resultado del inicio de sesión','donut','event.action'),panel('Cuentas observadas','bar','user.name'),sources(),panel('Origen geográfico · simulado','geo','source.geo.country_name'),logs('Registro de acceso')]},
  {id:'dns-analysis',name:'DNS Analysis',category:'Red',icon:'globe',description:'Consultas DNS, dominios, respuestas NXDOMAIN y tipos de registro.',scope:doc=>doc['dns.question.name']!=null,
    metrics:[metric('Consultas DNS'),metric('Dominios únicos','unique','dns.question.name'),metric('NXDOMAIN','match','dns.response_code','NXDOMAIN'),uniqueSources()],
    panels:[panel('Dominios consultados','bar','dns.question.name',2),timeline('Consultas por intervalo','line'),panel('Códigos de respuesta','donut','dns.response_code'),panel('Tipos de registro','donut','dns.question.type'),logs('Consultas DNS recientes')]},
  {id:'http-traffic',name:'HTTP Traffic Analysis',category:'Red',icon:'globe',description:'Métodos, rutas, códigos de respuesta y destinos de navegación web.',scope:doc=>doc['http.request.method']!=null,
    metrics:[metric('Solicitudes HTTP'),metric('Destinos web','unique','url.domain'),metric('Errores 404','match','http.response.status_code',404),metric('Errores 500','match','http.response.status_code',500)],
    panels:[panel('Métodos HTTP','donut','http.request.method'),panel('Códigos de respuesta','bar','http.response.status_code'),timeline('Tráfico HTTP'),panel('Rutas solicitadas','bar','url.path'),panel('Dominios web','bar','url.domain'),logs('Solicitudes recientes')]},
  {id:'threat-intelligence',name:'Threat Intelligence',category:'Investigación',icon:'brain',description:'Coincidencias con indicadores sintéticos, confianza, direcciones y alertas relacionadas.',scope:doc=>doc['threat.indicator.ip']!=null,
    metrics:[metric('Coincidencias IOC'),metric('Indicadores únicos','unique','threat.indicator.ip'),metric('Confianza alta','match','threat.indicator.confidence','High'),metric('Alertas vinculadas','unique','alert.id')],
    panels:[panel('Indicadores coincidentes','bar','threat.indicator.ip'),panel('Nivel de confianza','donut','threat.indicator.confidence'),timeline('Evolución de las coincidencias','line'),panel('Origen de coincidencias · geografía ficticia','geo','source.geo.country_name'),panel('Alertas de la plataforma','bar','alert.id'),logs('Evidencias de indicadores')]},
  {id:'incident-investigation',name:'Incident Investigation',category:'Investigación',icon:'crosshair',description:'Cronología de las evidencias compartidas con Alerts, Hunt y Cases.',scope:doc=>Boolean(doc['alert.id']),
    metrics:[metric('Evidencias correlacionadas'),metric('Alertas vinculadas','unique','alert.id'),uniqueSources(),metric('Equipos afectados','unique','host.name')],
    panels:[panel('Cronología de la investigación','timeline',null,2),panel('Alertas correlacionadas','bar','alert.id'),severity(),timeline('Secuencia temporal de evidencias','histogram'),logs('Evidencias · abrir para investigar')]},
  {id:'firewall-monitoring',name:'Firewall Monitoring',category:'Red',icon:'shield-check',description:'Tráfico permitido y bloqueado, reglas aplicadas y servicios de destino.',scope:scope('firewall'),
    metrics:[metric('Decisiones de firewall'),metric('Permitidas','match','event.action','allow'),metric('Bloqueadas','match','event.action','deny'),metric('Reglas','unique','rule.name')],
    panels:[panel('Permitido / bloqueado','donut','event.action'),panel('Reglas aplicadas','bar','rule.name'),timeline('Decisiones por intervalo','histogram'),sources(),panel('Puertos observados','bar','destination.port'),logs('Registro de firewall')]},
  {id:'system-monitoring',name:'System Monitoring',category:'Operaciones',icon:'activity',description:'Muestras de CPU, memoria, servicios y estado de los sistemas de demostración.',scope:scope('system'),
    metrics:[metric('Muestras de telemetría'),metric('CPU media','percent','system.cpu.pct'),metric('Memoria media','percent','system.memory.used.pct'),metric('Sistemas','unique','host.name')],
    panels:[timeline('Muestras recibidas','area'),panel('CPU media por sistema','gauge','system.cpu.pct'),panel('Memoria media por sistema','gauge','system.memory.used.pct'),panel('Estado de servicio','donut','event.action'),panel('Servicios monitorizados','bar','service.name'),logs('Telemetría reciente')]},
  {id:'tpot-global',name:'T-Pot Global Security',category:'Honeypots',icon:'blocks',description:'Actividad conjunta de ocho honeypots: servicios, orígenes y protocolos.',scope:scope('tpot'),
    metrics:[metric('Interacciones'),metric('Honeypots','unique','honeypot.name'),uniqueSources(),metric('Servicios','unique','destination.port')],
    panels:[timeline('Actividad de los honeypots','histogram'),panel('Eventos por honeypot','bar','honeypot.name'),panel('Protocolos objetivo','bar','network.protocol'),sources(),panel('Distribución de transporte','donut','network.transport'),logs('Últimas interacciones')]},
];

const honeypots = [
  ['cowrie','Cowrie','Sesiones SSH, autenticaciones, comandos y artefactos capturados.','ssh',
    [metric('Sesiones','unique','session.id'),metric('Autenticaciones correctas','match','event.action','cowrie.login.success'),metric('Comandos','exists','process.command_line'),metric('Artefactos','exists','file.name')],
    [panel('Comandos ejecutados','bar','process.command_line'),panel('Usuarios autenticados','bar','user.name'),panel('Actividad Cowrie','donut','event.action'),sources()]],
  ['sentrypeer','SentryPeer','Solicitudes SIP, métodos, agentes de usuario y transporte.','sip',
    [metric('Solicitudes SIP'),uniqueSources(),metric('OPTIONS','match','sip.method','OPTIONS'),metric('REGISTER','match','sip.method','REGISTER')],
    [sources(),panel('Métodos SIP','donut','sip.method'),panel('Transporte','donut','network.transport'),panel('Agentes SIP','bar','user_agent.original')]],
  ['adbhoney','ADBHoney','Conexiones al servicio ADB y duración de las sesiones.','adb',
    [metric('Telemetría'),metric('Conexiones abiertas','match','event.action','adbhoney.connection.open'),metric('Conexiones cerradas','match','event.action','adbhoney.connection.closed'),uniqueSources()],
    [panel('Acciones de conexión','donut','event.action'),panel('Duración de sesión (ns)','bar','event.duration'),sources(),panel('Puertos de origen','bar','source.port')]],
  ['miniprint','MiniPrint','Conexiones de impresión, comandos y trabajos guardados.','printer',
    [metric('Eventos nativos'),metric('Conexiones','match','event.action','miniprint.connection.open'),metric('Comandos','match','event.action','miniprint.command.received'),metric('Trabajos guardados','exists','file.name')],
    [panel('Ciclo de vida de eventos','bar','event.action'),panel('Clasificación de actividad','donut','event.action'),panel('Trabajos capturados','bar','file.name'),sources()]],
  ['heralding','Heralding','Protocolos de autenticación, sesiones y usuarios de prueba.','authentication',
    [metric('Sesiones','unique','session.id'),metric('Intentos de autenticación','match','event.action','heralding.authentication.failure'),uniqueSources(),metric('Protocolos','unique','network.protocol')],
    [panel('Protocolos objetivo','bar','network.protocol'),panel('Puertos objetivo','donut','destination.port'),sources(),panel('Usuarios observados','bar','user.name')]],
  ['dionaea','Dionaea','Interacciones de servicios SMB, FTP, MQTT y HTTP.','network',
    [metric('Interacciones'),uniqueSources(),metric('Servicios','unique','network.protocol'),metric('Descargas','match','event.action','dionaea.download.complete')],
    [panel('Protocolos objetivo','bar','network.protocol'),panel('Puertos objetivo','bar','destination.port'),sources(),panel('Clasificación de eventos','donut','event.action')]],
  ['ipphoney','IPPHoney','Solicitudes HTTP dirigidas a servicios de impresión IPP.','http',
    [metric('Interacciones'),uniqueSources(),metric('Solicitudes GET','match','http.request.method','GET'),metric('Rutas solicitadas','unique','url.path')],
    [sources(),panel('Rutas solicitadas','bar','url.path'),panel('Métodos HTTP','donut','http.request.method'),panel('Sensores','bar','observer.name')]],
  ['redishoneypot','RedisHoneyPot','Sesiones Redis, comandos PING e INFO y eventos de conexión.','redis',
    [metric('Eventos'),metric('Sesiones','unique','session.id'),metric('Comandos','exists','redis.command'),uniqueSources()],
    [sources(),panel('Comandos Redis','donut','redis.command'),panel('Acciones observadas','donut','event.action'),panel('Puertos de origen','bar','source.port')]],
];
for (const [id,name,description,,metrics,panels] of honeypots) DASHBOARDS.push({id:`tpot-${id}`,name:`T-Pot ${name}`,category:'Honeypots',icon:'blocks',description,scope:scope(`tpot.${id}`),metrics,panels:[timeline(`Actividad ${name}`,id==='cowrie'?'line':'histogram'),...panels,logs(`Telemetría reciente · ${name}`)]});
export const dashboardById = id => DASHBOARDS.find(d => d.id === id);

export function metricValue(documents, config) {
  const values = documents.map(d=>d[config.field]).filter(v=>v!=null);
  if (config.type==='unique') return new Set(values).size;
  if (config.type==='exists') return values.length;
  if (config.type==='match') return values.filter(v=>String(v)===String(config.value)).length;
  if (config.type==='percent') return values.length ? `${(values.reduce((a,b)=>a+b,0)/values.length*100).toFixed(1)} %` : '—';
  if (config.type==='bytes') {const total=values.reduce((a,b)=>a+b,0); return total>=1e6?`${(total/1e6).toFixed(2)} MB`:`${(total/1e3).toFixed(1)} kB`;}
  return documents.length;
}

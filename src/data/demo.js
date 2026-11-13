// Datos 100 % sintéticos. IPs RFC 5737 y dominios reservados .example.
export const INITIAL_ALERTS = [
  ['ALT-260131','Intentos de acceso distribuidos','Autenticación','critical','new','198.51.100.27','192.0.2.41','identity','Múltiples intentos de acceso desde origen externo en 7 minutos.', '2026-11-13T09:42:00'],
  ['ALT-260132','Ejecución de script anómalo','Endpoint','high','investigating','192.0.2.41','192.0.2.51','endpoint','Un intérprete ejecutó comandos con parámetros atípicos.', '2026-11-13T09:34:00'],
  ['ALT-260133','Tráfico periódico hacia dominio sospechoso','Red','critical','new','192.0.2.51','203.0.113.68','network','Conexiones HTTPS de pequeño tamaño a intervalos regulares.', '2026-11-13T09:18:00'],
  ['ALT-260134','Movimiento lateral mediante SMB','Endpoint','high','new','192.0.2.51','192.0.2.61','endpoint','Autenticaciones laterales entre estaciones de prueba.', '2026-11-13T08:56:00'],
  ['ALT-260135','Transferencia saliente inusual','Red','high','acknowledged','192.0.2.61','203.0.113.68','network','Volumen saliente por encima del perfil habitual.', '2026-11-13T08:21:00'],
  ['ALT-260136','Cambio de grupo privilegiado','Identidad','medium','new','192.0.2.41','192.0.2.12','identity','Cambio de pertenencia a un grupo administrativo.', '2026-11-13T07:53:00'],
  ['ALT-260137','Solicitud DNS de alta entropía','DNS','medium','new','192.0.2.51','203.0.113.53','dns','Patrón de subdominios con longitud y diversidad elevadas.', '2026-11-13T07:38:00'],
  ['ALT-260138','Escaneo de servicios internos','Red','medium','acknowledged','192.0.2.78','192.0.2.41','network','Exploración repetida de puertos internos.', '2026-11-13T06:40:00'],
  ['ALT-260139','Archivo potencialmente no deseado','Endpoint','low','closed','192.0.2.88','192.0.2.51','endpoint','Archivo comprimido descargado desde un repositorio de pruebas.', '2026-11-13T06:15:00'],
  ['ALT-260140','Uso inusual de PowerShell','Endpoint','high','new','192.0.2.61','192.0.2.31','endpoint','Nueva sesión con cadena de comandos codificada.', '2026-11-13T05:52:00'],
  ['ALT-260141','Conexión a servicio no habitual','Red','low','closed','192.0.2.91','203.0.113.25','network','Sesión de salida a puerto fuera de la línea base.', '2026-11-13T05:08:00'],
  ['ALT-260142','Fallos de autenticación repetidos','Identidad','medium','acknowledged','198.51.100.95','192.0.2.12','identity','Se detectaron varios fallos para una misma cuenta.', '2026-11-13T04:41:00'],
  ['ALT-260143','Posible suplantación DNS','DNS','high','new','192.0.2.71','203.0.113.53','dns','Una respuesta DNS no coincide con el perfil de resolución.', '2026-11-13T04:12:00'],
  ['ALT-260144','Autenticación fuera de horario','Identidad','low','acknowledged','192.0.2.76','192.0.2.12','identity','Acceso fuera de franja habitual para un usuario de ejemplo.', '2026-11-13T03:23:00'],
  ['ALT-260145','Proceso con persistencia sospechosa','Endpoint','medium','investigating','192.0.2.31','192.0.2.51','endpoint','Nuevo mecanismo de inicio automático observado.', '2026-11-13T02:56:00'],
  ['ALT-260146','Patrón de transferencia DNS atípico','DNS','low','new','192.0.2.82','203.0.113.53','dns','Número de consultas TXT superior a la media.', '2026-11-13T02:11:00'],
  ['ALT-260147','Acceso a recurso compartido sensible','Endpoint','medium','closed','192.0.2.61','192.0.2.44','endpoint','Lectura de fichero clasificado como relevante para demo.', '2026-11-13T01:46:00'],
  ['ALT-260148','Sesión TLS con huella anómala','Red','low','new','192.0.2.92','203.0.113.68','network','Huella del cliente TLS poco frecuente.', '2026-11-13T01:10:00']
].map(([id,title,category,severity,status,src,dst,sensor,description,time],i)=>({id,title,category,severity,status,src,dst,sensor,description,time,rule:`DET-${String(100+i).padStart(3,'0')}`,count:[216,189,167,83,51,42,38,31,17,15,12,9,8,7,7,5,3,2][i],assignee:i%4===0?'Analista demo':'Sin asignar',tags:i<5?['campaña-orion','correlacionado']:['observación']}));
export const INITIAL_CASES=[
  {id:'CAS-260041',title:'Actividad lateral y tráfico saliente',severity:'high',status:'in_progress',owner:'Analista demo',alertIds:['ALT-260134','ALT-260135'],created:'2026-11-12T15:40:00',description:'Investigación de sesiones laterales y transferencia inusual.',notes:[{at:'12 nov · 16:10',by:'Analista demo',text:'Se ha iniciado la revisión de artefactos asociados.'}]},
  {id:'CAS-260040',title:'Verificación de acceso administrativo',severity:'medium',status:'new',owner:'Sin asignar',alertIds:['ALT-260136'],created:'2026-11-12T12:20:00',description:'Verificación del contexto del cambio de privilegios.',notes:[]},
  {id:'CAS-260039',title:'Anomalía DNS controlada',severity:'low',status:'closed',owner:'Operador demo',alertIds:['ALT-260139'],created:'2026-11-11T09:14:00',description:'Actividad validada en el entorno de simulación.',notes:[]}
];
export const IOCS=[
  {value:'203.0.113.68',type:'IPv4',risk:'critical',confidence:96,label:'Nodo de contacto sospechoso',source:'Inteligencia sintética',related:['ALT-260133','ALT-260135','ALT-260148']},
  {value:'198.51.100.27',type:'IPv4',risk:'high',confidence:87,label:'Origen de intentos de acceso',source:'Correlación local',related:['ALT-260131']},
  {value:'updates-cdn.example',type:'Dominio',risk:'high',confidence:89,label:'Dominio de comunicaciones periódicas',source:'Inteligencia sintética',related:['ALT-260133']},
  {value:'203.0.113.53',type:'IPv4',risk:'medium',confidence:62,label:'Resolución DNS bajo observación',source:'Correlación local',related:['ALT-260137','ALT-260143']},
  {value:'198.51.100.95',type:'IPv4',risk:'medium',confidence:64,label:'Origen de autenticaciones fallidas',source:'Inteligencia sintética',related:['ALT-260142']},
  {value:'auth-gateway.example',type:'Dominio',risk:'low',confidence:18,label:'Servicio de referencia benigno',source:'Datos demo',related:[]}
];
export const NODES=[
  {id:'sensor-01',role:'Sensor',address:'192.0.2.21',state:'healthy',events:186,ram:46,cpu:24,disk:38,uptime:'31 días',container:['Packet capture','Network sensor','Event forwarder','Health agent']},
  {id:'search-01',role:'Search',address:'192.0.2.22',state:'healthy',events:824,ram:64,cpu:53,disk:48,uptime:'31 días',container:['Search engine','Ingest pipeline','Dashboard engine','Metrics store']},
  {id:'manager-01',role:'Manager',address:'192.0.2.23',state:'healthy',events:0,ram:42,cpu:31,disk:29,uptime:'31 días',container:['Case service','Rules service','UI gateway','Agent scheduler','Cache']}
];
export const PCAP_FLOWS=[
  {id:'FLOW-101',time:'09:18:03',source:'192.0.2.51',destination:'203.0.113.68',protocol:'TLS',port:443,packets:384,bytes:118240,risk:'high',alertId:'ALT-260133'},
  {id:'FLOW-102',time:'08:56:15',source:'192.0.2.51',destination:'192.0.2.61',protocol:'SMB',port:445,packets:912,bytes:902144,risk:'high',alertId:'ALT-260134'},
  {id:'FLOW-103',time:'08:21:47',source:'192.0.2.61',destination:'203.0.113.68',protocol:'TLS',port:443,packets:1764,bytes:1412800,risk:'critical',alertId:'ALT-260135'},
  {id:'FLOW-104',time:'07:38:29',source:'192.0.2.51',destination:'203.0.113.53',protocol:'DNS',port:53,packets:240,bytes:26880,risk:'medium',alertId:'ALT-260137'},
  {id:'FLOW-105',time:'07:06:52',source:'192.0.2.71',destination:'203.0.113.53',protocol:'DNS',port:53,packets:64,bytes:7192,risk:'low',alertId:'ALT-260143'},
  {id:'FLOW-106',time:'06:42:19',source:'192.0.2.78',destination:'192.0.2.41',protocol:'TCP',port:22,packets:188,bytes:24912,risk:'medium',alertId:'ALT-260138'},
  {id:'FLOW-107',time:'06:32:04',source:'192.0.2.92',destination:'203.0.113.25',protocol:'HTTPS',port:443,packets:124,bytes:88032,risk:'low',alertId:'ALT-260141'},
  {id:'FLOW-108',time:'05:47:20',source:'192.0.2.61',destination:'192.0.2.31',protocol:'RDP',port:3389,packets:439,bytes:385212,risk:'medium',alertId:'ALT-260140'}
];
export const RULES=INITIAL_ALERTS.map((a,i)=>({id:a.rule,title:a.title,category:a.category,severity:a.severity,enabled:i!==8,signals:a.count,updated:`${1+i%5} d`,description:a.description}));
const types=['authentication.failure','process.execution','network.connection','dns.query','file.access','identity.change'];
export const EVENTS=Array.from({length:188},(_,i)=>{
  const al=INITIAL_ALERTS[i%INITIAL_ALERTS.length];
  const minute=String((i*7)%60).padStart(2,'0');
  const hour=String(9-Math.floor(i/24)).padStart(2,'0');
  return {id:`EVT-${String(28001+i)}`,time:`2026-11-13T${hour}:${minute}:12`,type:types[i%types.length],source:al.src,destination:al.dst,sensor:al.sensor,severity:al.severity,alertId:al.id,summary:al.description,rule:al.rule};
});
export const DAILY_SERIES=[33,37,29,43,40,36,55,59,47,60,52,56,65,61,69,72,66,80,73,84,88,81,92,79];
export const VOLUME_SERIES=[45,51,43,48,61,56,62,72,61,57,68,63,72,79,73,85,77,69,82,95,91,85,78,88];
export const NAV_ITEMS=[
  {id:'overview',title:'Overview',icon:'layout-dashboard',section:'primary'},
  {id:'alerts',title:'Alerts',icon:'bell',section:'primary'},
  {id:'dashboards',title:'Dashboards',icon:'chart-no-axes-combined',section:'primary'},
  {id:'hunt',title:'Hunt',icon:'crosshair',section:'primary'},
  {id:'intelligence',title:'IOC Intelligence',icon:'brain',section:'primary'},
  {id:'analyst',title:'AI Analyst',icon:'message-circle',section:'primary'},
  {id:'triage',title:'Triage',icon:'headphones',section:'primary'},
  {id:'cases',title:'Cases',icon:'briefcase-business',section:'primary'},
  {id:'detections',title:'Detections',icon:'scan-search',section:'primary'},
  {id:'pcap',title:'PCAP',icon:'network',section:'primary'},
  {id:'grid',title:'Grid',icon:'waypoints',section:'primary'},
  {id:'downloads',title:'Downloads',icon:'download',section:'primary'},
  {id:'administration',title:'Administration',icon:'settings',section:'primary'},
  {id:'tools/kibana',title:'Kibana',icon:'kibana',section:'tools'},
  {id:'tools/search',title:'Search Studio',icon:'chart-line',section:'tools'},
  {id:'tools/fleet',title:'Agent Fleet',icon:'blocks',section:'tools'},
  {id:'tools/endpoints',title:'Endpoint Manager',icon:'monitor',section:'tools'},
  {id:'tools/metrics',title:'Metrics Explorer',icon:'activity',section:'tools'},
  {id:'tools/decoder',title:'Packet Decoder',icon:'binary',section:'tools'}
];

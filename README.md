# Security Platform · SOC Workspace

**Maqueta comercial interactiva de una plataforma SOC**, con una identidad visual neutra, un tema oscuro y datos de seguridad inventados. Está diseñada para realizar demostraciones en directo con una integración de Kibana totalmente local, sin conectarse a un SIEM, a un servidor de correo, a sensores, a un proveedor de IA ni a ningún servicio externo.

## Iniciar en Visual Studio Code

Necesitas **Node.js 18 o posterior**. Descomprime el ZIP, abre la carpeta `security-platform-demo` en VS Code y ejecuta:

```bash
npm install
npm run dev
```

Abre **http://localhost:4173**. El servidor es local y admite enlaces directos a todas las rutas. Para cambiar de puerto:

```bash
PORT=4300 npm run dev
```

### Alternativa con Python 3

Para ejecutar la demo sin Node.js, detén cualquier servidor anterior con **Ctrl+C** y ejecuta desde la carpeta del proyecto:

```bash
python3 scripts/dev.py
```

Abre **http://127.0.0.1:4173/**. Este servidor admite la navegación directa y la recarga de rutas como `/overview` o `/tools/kibana`. El servidor estándar `python3 -m http.server` no aplica el fallback que necesita esta aplicación y devuelve 404 al recargar esas rutas. Usa `python3 scripts/dev.py --port 4300` para cambiar el puerto o `python3 scripts/dev.py --dist` para servir una compilación existente. Esta alternativa necesita Python 3.9 o posterior.

### Comprobar y compilar

```bash
npm run check
npm test
npm run build
npm run preview
```

`npm run build` genera `dist/`, una aplicación estática que puede servirse en cualquier servidor HTTP con soporte de fallback al `index.html` para las rutas internas. `npm run preview` sirve la versión compilada desde el mismo puerto, 4173. No es necesario Vite, React ni un empaquetador: **la aplicación usa módulos JavaScript nativos**, CSS, SVG y los módulos estándar de Node.js. No tiene dependencias de ejecución. Playwright es una dependencia de desarrollo para las pruebas de navegador, fijada en `package-lock.json`. No se proporciona código TypeScript porque no es imprescindible para esta maqueta.

> **Importante:** no es una plataforma de seguridad productiva. Ninguna acción de la interfaz afecta a equipos ni servicios reales.

## Módulos implementados

| Módulo | Funcionalidad demostrable |
| --- | --- |
| **Overview** | Estado general, KPIs, analítica temporal, alertas prioritarias y salud de nodos. |
| **Alerts** | Filtrado, búsqueda, ordenación, paginación, detalle, reconocimiento e inicio de investigaciones. |
| **Dashboards** | Gráficos SVG con indicadores emergentes al pasar el cursor, distribución por severidad, series temporales y periodos. |
| **Hunt** | Consulta de 188 eventos locales, búsqueda por atributos, filtros por fuente, ordenación, paginación y vínculos con alertas. |
| **IOC Intelligence** | Consulta de indicadores de prueba, correlación con detecciones y lista de vigilancia persistente. |
| **AI Analyst** | Conversación simulada sobre alertas, indicadores, incidentes y planes de investigación. |
| **Triage** | Cola por severidad, reconocimiento de investigaciones y apertura de casos. |
| **Cases** | Creación de casos, vinculación con alertas, edición de estado y responsable y anotaciones persistentes. |
| **Detections** | Exploración y activación/desactivación simulada de reglas. |
| **PCAP** | Explorador de flujos de prueba, metadatos y secuencias de paquetes ilustrativas. |
| **Grid** | Tres nodos ficticios con medidores, servicios asociados y detalles de estado. |
| **Downloads** | Exportaciones CSV reales generadas localmente en el navegador. |
| **Administration** | Preferencias y restauración del estado de la demostración. |
| **Kibana** | Login demo, 21 dashboards, Discover, consultas KQL, filtros, gráficos interactivos, JSON y evidencias vinculadas. |
| **Search Studio** | Búsqueda local de eventos. |
| **Agent Fleet** | Inventario sintético de agentes y sus estados. |
| **Endpoint Manager** | Vista de endpoints ficticios. |
| **Metrics Explorer** | Analítica de rendimiento ilustrativa. |
| **Packet Decoder** | Decodificación Base64 en el navegador. |

La barra lateral puede contraerse. Los paneles de detalle y los formularios se muestran en drawers y modales, y la navegación funciona sin recargar la página.

## Recorrido recomendado para una demo de 5–8 minutos

1. **Overview:** presenta el estado de los tres nodos y los KPIs.
2. **Alerts:** abre `ALT-260133`, la señal de tráfico periódico hacia un destino sospechoso.
3. **Eventos:** usa la pestaña *Eventos* y abre un evento correlacionado. También puedes saltar a **Hunt** para ver todos los eventos de la misma alerta.
4. **Indicadores:** consulta `203.0.113.68` en **IOC Intelligence**, revisa las correlaciones y añádelo a vigilancia.
5. **AI Analyst:** pregunta «Analiza la actividad de 203.0.113.68». Verás una respuesta simulada con los vínculos a los registros de ejemplo.
6. **Incidentes:** regresa a la alerta y pulsa *Crear caso*. Completa el formulario y guárdalo.
7. **Cases:** comprueba que el caso recién creado aparece en la tabla. Cambia su estado, asígnalo y agrega una nota.
8. **Grid / Dashboards / Downloads:** muestra la salud de la plataforma, los gráficos y una exportación CSV descargable.

Los cambios de alerta, reglas, casos, indicadores vigilados, preferencias y chat se conservan en `localStorage`, por lo que siguen presentes al recargar. Para volver al punto de partida, ve a **Administration → Restablecer entorno**.


## Kibana · recorrido y funcionamiento

1. Abre **Herramientas → Kibana**, o entra directamente en **http://localhost:4173/tools/kibana**.
2. Inicia sesión con **usuario `test` y contraseña `test`**. Las credenciales aparecen en el formulario. La sesión de demostración se conserva en `sessionStorage`; *Salir* la cierra.
3. El catálogo contiene **21 dashboards**. Incluye los 12 solicitados: Security Overview, Network Security, Suricata Alerts, Zeek Network Monitoring, Endpoint Security, Authentication Monitoring, DNS Analysis, HTTP Traffic Analysis, Threat Intelligence, Incident Investigation, Firewall Monitoring y System Monitoring.
4. Incluye también **T-Pot Global** y dashboards de **Cowrie, SentryPeer, ADBHoney, MiniPrint, Heralding, Dionaea, IPPHoney y RedisHoneyPot**. Todos están reconstruidos con HTML, CSS y SVG interactivos.
5. Abre **Suricata Alerts**, selecciona *Última hora* y después *Últimas 24 horas*. Los contadores, series, distribuciones y tabla se recalculan juntos. Pulsa una barra o un sector para filtrar; pulsa un intervalo de la serie para acotar el tiempo.
6. Abre **Discover** desde el dashboard. Se conserva su contexto, visible como una etiqueta que puedes retirar. Selecciona un data view, añade filtros o ejecuta una consulta.
7. Abre un documento con la flecha de la tabla. Alterna entre campos y **JSON estructurado**. Los botones `+` y `−` incluyen o excluyen valores del resultado.
8. Ejecuta `alert.id: "ALT-260133"`. Sus 11 documentos corresponden a eventos de la aplicación principal. Abre uno y usa *Alerta*, *Crear caso* o *Dashboard relacionado*.
9. Guarda la búsqueda, modifica sus columnas o exporta los resultados como JSON. *Compartir* genera un enlace con consulta, filtros, data view, contexto, columnas, ordenación y periodo. El usuario de destino debe entrar con las credenciales demo; los casos creados y las búsquedas guardadas pertenecen a cada navegador.

**Periodo reproducible:** el reloj de la telemetría está fijado en **13 de noviembre de 2026, 11:00 CET**. Los selectores relativos se calculan desde ese instante. Hay muestras de un año, con mayor densidad en las últimas 24 horas. El rango absoluto se interpreta en **Europe/Madrid**, independientemente de la zona horaria del equipo. *Actualizar* recalcula el mismo corte; no genera ni consulta eventos reales.

**Consultas admitidas (subconjunto local inspirado en KQL):**

```text
source.ip: "192.0.2.51"
event.severity: high OR event.severity: critical
alert.id: "ALT-260133" AND NOT event.severity: low
(event.severity: high OR event.severity: critical) AND network.bytes >= 10000
dns.question.name: *.example
alert.id: *
Conexiones HTTPS
```

Los campos con `:` comparan valores completos, sin distinguir mayúsculas; `*` es un comodín y también permite comprobar existencia. El texto libre busca en todos los valores; los términos consecutivos usan AND. Se admiten paréntesis, AND, OR, NOT y comparaciones numéricas `>`, `>=`, `<`, `<=`. Las consultas inválidas muestran un error y no resultados. No se implementa el lenguaje completo de Elasticsearch ni agrupaciones de valores como `campo: (a OR b)`.

Los favoritos y las búsquedas se guardan con claves `security-kibana-*` en `localStorage`. Las ubicaciones del mapa son asignaciones ficticias: no se intenta geolocalizar las IP reservadas. Search Studio continúa disponible como herramienta independiente en `/tools/search`.

### Estructura del módulo

| Archivo | Responsabilidad |
| --- | --- |
| `src/kibana/data.js` | 2.924 documentos, 19 datasets, data views y conversión a JSON estructurado. |
| `src/kibana/query.js` | KQL reducido, filtros combinados, periodos, agregaciones e histogramas. |
| `src/kibana/dashboards.js` | Catálogo, ámbito de cada dashboard, métricas y composición de paneles. |
| `src/kibana/components.js` | Tablas, gráficos SVG, mapa, métricas y controles compartidos. |
| `src/kibana/views.js` | Login, catálogo, dashboards, Discover, biblioteca, detalles y modales. |
| `src/kibana/controller.js` | Interacciones, sesión simulada, URL, búsquedas y puente con alertas/casos. |
| `src/kibana/kibana.css` | Estilos aislados y adaptación a móvil. |

### Pruebas en navegador (opcional)

Después de `npm install`, con Google Chrome instalado:

```bash
npm run test:browser
```

La prueba inicia y detiene su propio servidor en el puerto 4197, utiliza un perfil de navegador aislado y guarda capturas en la carpeta temporal del sistema (`/tmp/security-platform-browser-qa` en Linux). No utiliza tu perfil ni modifica tus datos de demostración.

Para utilizar Chromium descargado por Playwright:

```bash
npx playwright install chromium
PLAYWRIGHT_CHANNEL=chromium npm run test:browser
```

También se puede indicar `CHROME_PATH` con la ruta al ejecutable, `KIBANA_TEST_PORT` para el puerto de prueba y `QA_OUTPUT_DIR` para las capturas. Las pruebas de datos (`npm test`), la compilación y la aplicación no necesitan navegador automatizado. Las dependencias de QA son opcionales para ejecutar la aplicación: `npm install --omit=dev` permite instalar únicamente lo necesario para la demo.

## Arquitectura

```text
security-platform-demo/
├── index.html                     # Entrada HTML
├── package.json                   # Scripts y dependencia opcional de QA
├── package-lock.json              # Manifiesto de instalación reproducible
├── public/icons/platform.svg      # Icono corporativo neutral
├── src/
│   ├── kibana/                    # Datos, consultas, dashboards, componentes, vistas y controlador
│   ├── main.js                    # Estado de la interfaz, rutas y eventos
│   ├── components/ui.js           # Shell, tablas, botones, selectores, KPIs
│   ├── pages/views.js             # Módulos, detalles y modales
│   ├── data/demo.js               # Dataset ficticio con relaciones
│   ├── lib/store.js               # Persistencia, casos, estados y helpers
│   ├── lib/charts.js              # Gráficos SVG y barras
│   ├── lib/icons.js               # Iconografía SVG local
│   └── styles/
│       ├── variables.css          # Tokens de diseño
│       └── global.css             # Sistema visual y adaptabilidad
└── scripts/
    ├── dev.mjs                    # Servidor HTTP local y rutas SPA con Node.js
    ├── dev.py                     # Servidor local equivalente con Python 3
    ├── build.mjs                  # Creación de la carpeta dist/
    ├── smoke.mjs                  # Comprobaciones de estructura y datos
    ├── kibana-test.mjs            # KQL, filtros, métricas, privacidad y correlación
    ├── browser-qa.mjs             # Recorrido funcional en navegador
    └── check.mjs                  # Validación de sintaxis de todos los módulos
```

Los módulos están separados según su responsabilidad. Los componentes de tabla, panel, botón, estado, métrica y gráfico se reutilizan en las distintas pantallas. Todos los recursos se sirven en local; no hay fuentes, iconos ni scripts de terceros.

## Datos y privacidad

- Los identificadores de casos, reglas, eventos, nodos y activos son inventados.
- Las direcciones IP de muestra pertenecen a rangos reservados para documentación **192.0.2.0/24**, **198.51.100.0/24** y **203.0.113.0/24** (RFC 5737).
- Los dominios ficticios terminan en **`.example`**.
- No se incluyen logos, capturas, datos de red, archivos, direcciones o denominaciones de la instalación de referencia.
- El proyecto no necesita credenciales, variables de entorno, API keys ni Internet.
- Las búsquedas, los filtros y los cambios de estado se realizan en el navegador.

## Limitaciones conocidas

- **IA:** el módulo no utiliza un modelo de lenguaje; devuelve respuestas condicionadas y predefinidas, claramente identificadas como simulación.
- **Telemetría:** no hay ingesta real, fuentes externas ni Elasticsearch. El login de Kibana es simulado. Las magnitudes de Overview son ilustrativas; Hunt contiene 188 eventos y Kibana incluye esos mismos 188 más 2.736 documentos sintéticos. En Kibana, métricas, gráficos, exportaciones y tablas se calculan sobre los documentos filtrados.
- **PCAP:** los flujos, los paquetes representados y la evidencia son muestras sintéticas; no se genera ni se analiza un archivo PCAP binario real.
- **Grid:** el estado de procesos y servidores es ilustrativo; las verificaciones no reinician ni interrogan infraestructura.
- **Persistencia:** `localStorage` es adecuada para demos de un solo navegador, pero no ofrece sincronización entre usuarios ni control de acceso.
- **Exportación:** CSV contiene datos de ejemplo y se genera localmente; no es un informe forense certificado.
- **Gráficos:** los tooltips de SVG utilizan el indicador nativo del navegador. Los gráficos originales muestran series ilustrativas. Kibana agrega documentos individuales por intervalo, admite filtros al pulsar barras o sectores y permite acotar el periodo al seleccionar un intervalo.
- **SPA:** si se publica en un servidor estático ajeno al proyecto, debe configurarse el fallback de rutas a `index.html`.

## Control de calidad

- `npm run check` comprueba la sintaxis de todos los módulos JavaScript.
- `npm test` valida relaciones del dataset, renderización de módulos y ausencia de denominaciones prohibidas en los archivos entregados.
- `npm run build` genera una copia publicable en `dist/` sin compilación ni recursos remotos.
- La suite de navegador verifica los 21 dashboards de Kibana, login, Discover, consultas, filtros, periodos, columnas, ordenación, paginación, JSON, exportaciones, búsquedas guardadas, navegación hacia alertas y creación de casos. Consulta `QA.md` para los resultados de esta entrega.

---

**Aviso de uso:** únicamente destinado a demostración comercial, formación y presentación visual. No sustituye un sistema SIEM/SOC operativo ni constituye una herramienta de detección, respuesta o inteligencia real.

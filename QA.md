# Verificación de la entrega · Kibana

Fecha: 13 de noviembre de 2026. Versión: 1.1.0.

La integración se ha verificado con Node.js 22.16.0, Playwright 1.56.1 y Google Chrome en un perfil aislado. La aplicación conserva su arquitectura de módulos JavaScript nativos; Playwright se utiliza exclusivamente para las pruebas.

| Comprobación | Resultado |
| --- | --- |
| Sintaxis de todos los módulos de aplicación y scripts | Correcta (`npm run check`). |
| Regresión de las 19 entradas de la plataforma | Renderización correcta; relaciones de alertas, eventos y casos conservadas. |
| Credenciales incorrectas, login `test:test`, sesión y logout | Verificados en navegador, incluyendo recarga. |
| Catálogo de 21 dashboards, categorías, búsqueda y favoritos | Verificados. |
| Cada dashboard: datos, paneles completos y periodo 24 h / 1 h | Verificado contra el conjunto de documentos filtrado. |
| Filtros de severidad, IP de origen, destino y selección en gráficos | Modifican resultados, métricas y visualizaciones. |
| Histogramas, selección temporal y rangos absolutos | Verificados; suma de intervalos igual al número de documentos. |
| KQL: texto, campos, comodines, existencia, AND/OR/NOT, paréntesis y números | Verificados; sintaxis inválida produce un mensaje de error. |
| Data views, columnas, ordenación numérica/temporal y paginación | Verificados en datos y navegador. |
| Detalle de documento, búsqueda de campos y JSON estructurado | Verificados. |
| Guardar/cargar búsquedas, recarga y enlaces con estado | Verificados. |
| Exportación JSON de resultados | Archivo descargado y contenido comprobado: corresponde a los documentos filtrados. |
| Documento → crear caso → alerta → Discover | Verificado; caso persistido y relacionado con la alerta. |
| Biblioteca de visualizaciones e inspección de paneles | Verificadas. |
| Pantalla completa, Escape y navegación atrás/adelante | Verificados; Escape y retorno al catálogo probados. |
| Catálogo, dashboard y Discover en 390 y 768 px | Sin desbordamiento horizontal de la página; tablas con desplazamiento propio. |
| Regresión de Alerts, Hunt, Cases, Detections, Search Studio y Packet Decoder | Rutas abiertas tras utilizar Kibana. |
| Errores JavaScript y peticiones externas durante el recorrido | Ninguno. |
| Compilación estática | Correcta (`npm run build`). |

## Datos y alcance

- **2.924 documentos sintéticos**, en 19 datasets. Se reutilizan los **188 eventos** originales, con sus identificadores, alertas, direcciones y mensajes.
- **21 dashboards**: los 12 de seguridad solicitados, una vista global de honeypots y ocho vistas específicas.
- IP de los bloques de documentación `192.0.2.0/24`, `198.51.100.0/24` y `203.0.113.0/24`; dominios `.example` y nombres de equipos/usuarios ficticios.
- La revisión automática comprueba las direcciones, dominios, fechas, documentos relacionados, métricas, agregaciones, escape de texto y renderización sin datos.
- Los rangos relativos usan el corte fijo del **13/11/2026 a las 11:00 CET**. El rango absoluto se interpreta en Europe/Madrid; también se han comprobado fechas de verano y horas inexistentes en el cambio horario.
- Las capturas del entorno de referencia no se incluyen ni se utilizan como interfaz. Los paneles son componentes HTML y SVG.

## Repetir las comprobaciones

```bash
npm install
npm run check
npm test
npm run test:browser
npm run build
```

La prueba de navegador necesita Google Chrome. Las alternativas para Chromium y las variables de entorno están documentadas en `README.md`. El script inicia su propio servidor, crea un perfil temporal y lo cierra al terminar; sus capturas quedan en la carpeta temporal, fuera del proyecto.

## Límites explícitos

La autenticación, la telemetría y la inteligencia son simuladas. KQL es un subconjunto local documentado. No se conecta a Elasticsearch ni se ingieren datos externos. Las posiciones geográficas son ficticias. Las comprobaciones de navegador se han realizado en Chrome; no se ha ejecutado una matriz adicional de Safari y Firefox.

# Dashboard de Ejecución CAPEX — Grupo Ramos

Esta versión aplica la línea gráfica de Grupo Ramos y las marcas Sirena, Aprezio y Multiplaza usando los logotipos suministrados.

## Cambios incluidos
- Eliminado el filtro de Año.
- El supranúmero queda únicamente como dato interno para leer el Excel.
- En la interfaz se usa exclusivamente la **Descripción**: filtro, gráfico y tabla.
- Ejecución = Real + Comprometido.
- % Ejecución = (Real + Comprometido) / Plan × 100.
- Se añadieron los logotipos dentro de la carpeta `assets`.

## Para GitHub Pages
Sube `index.html`, `style.css`, `script.js`, `Panel de Ejecucion CAPEX.xlsx` y la carpeta `assets` completa.

Importante: si el repositorio es público, el archivo Excel también será público.


## Actualización de datos
El botón para cargar Excel desde el navegador fue eliminado. Para actualizar la información oficial, reemplaza `Panel de Ejecucion CAPEX.xlsx` en el repositorio de GitHub conservando exactamente el mismo nombre.

## Versión 5
- Título actualizado a **CAPEX de Continuidad**.
- Eliminada la franja informativa superior sobre la fuente de datos.
- Se mantiene el filtro **Supranúmero**, mostrando únicamente la descripción al usuario.
- Se añadió **Ejecución por Formato**.
- Se añadió **Estado de las Partidas Presupuestarias**.
- Se eliminó el gráfico de composición del presupuesto para aprovechar mejor el espacio.

## Versión 6
- Eliminado el filtro **Estatus**.
- Eliminada la columna **Estatus** del detalle.
- Sustituido el gráfico de estado de partidas por una **Distribución del Presupuesto por Supranúmero** tipo dona.
- La distribución usa la **descripción** del supranúmero, muestra las categorías principales y agrupa el resto como **Otros**.

## Versión 6.1
- Se agregó control de caché para GitHub Pages (`?v=6.1`) para evitar mezclar archivos antiguos y nuevos.
- Se añadieron validaciones de carga de SheetJS y Chart.js.
- Se corrigió la exportación CSV para que tampoco incluya Estatus.

## Versión 6.2 — corrección de carga
- El Excel oficial ahora se llama `data.xlsx` para evitar problemas de rutas, espacios y acentos en GitHub Pages.
- La página fuerza una lectura nueva del Excel (`cache: no-store`).
- Si ocurre un error de datos, se muestra claramente en rojo debajo del título.
- Para futuras actualizaciones, reemplaza `data.xlsx` manteniendo exactamente ese nombre.

## Versión 7 — Asistente CAPEX
- Se agregó un chat flotante llamado **Asistente CAPEX**.
- Funciona sin API externa y consulta directamente los datos cargados desde `data.xlsx`.
- Puede responder preguntas sobre presupuesto, real, comprometido, ejecución, pendiente, centros, formatos y supranúmeros.
- Respeta los filtros activos del dashboard.


## Versión 9
- Se añadió filtro **Estado de ejecución** en Operaciones y Mantenimiento:
  - Todas las partidas
  - Sin ejecución (Real = 0 y Comprometido = 0)
  - Con ejecución
- Se corrigió el formato monetario de los ejes para evitar etiquetas como `RD$ 0M`.
- Los títulos de todos los gráficos fueron reescritos para explicar claramente qué compara cada visual.
- En Ejecución General se añadió **Plan de los próximos meses**.
  - Centro y Formato NO afectan este bloque.
  - Solo el filtro Trimestre modifica el calendario mensual.
- En Operaciones se añadió **Presupuesto liberado**:
  - Se calcula como `Plan - Real - Comprometido` cuando la partida ya tiene ejecución.
  - Solo se consideran remanentes positivos.
- En Operaciones se añadió el gráfico **Top 10 partidas finalizadas con mayor presupuesto liberado**.
- El detalle de Operaciones incluye la columna **Presupuesto liberado**.

## Versión 10
- La página General prioriza el análisis mensual antes de los KPIs anuales.
- El plan mensual incorpora indicadores visuales tipo batería con % y monto ejecutado.
- El filtro Trimestre controla el bloque mensual.
- Se quitó el código numérico de Supranúmero de las tablas visibles de Operaciones y Mantenimiento.
- Se eliminó el gráfico de presupuesto liberado en Operaciones; el KPI y la columna de presupuesto liberado se mantienen.
- Se redistribuyó el espacio de Operaciones para mejorar legibilidad.

## Versión 11
- General: tres meses por trimestre en una sola fila, con Plan, Ejecutado, batería y estado.
- Insights dinámicos recalculados desde la data.
- Operaciones: eliminado todo lo relacionado con Presupuesto liberado.

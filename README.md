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

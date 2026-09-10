# CAPEX de Continuidad — GitHub Pages v14

Versión rediseñada para integrar Operaciones y Mantenimiento en una sola experiencia.

## Estructura

- `index.html`
- `style.css`
- `script.js`
- `data.xlsx`

## Cambios principales

1. **Operaciones y Mantenimiento ya no son pestañas separadas.**
   Se controlan con el filtro superior `Todas | Operaciones | Mantenimiento`.
   El filtro activo queda visible mediante un botón resaltado y el indicador `Vista actual`.

2. **Resumen VP**
   Replica la estructura ejecutiva aprobada:
   - batería anual grande;
   - cuatro baterías trimestrales;
   - resumen del plan de acción;
   - plan de acción por Mantenimiento y Operaciones;
   - alertas;
   - próximos hitos.

3. **Ejecución General**
   La ejecución anual es el primer bloque.
   Debajo se conserva la lógica `Trimestre -> detalle mensual`.

4. Se eliminó la sección de **Consideraciones**.

## Hoja requerida para Plan de Acción

Agrega una hoja al archivo `data.xlsx` llamada exactamente:

`Plan de Acción`

La fila 1 debe contener estas columnas:

| ID | Área | Centro | Trimestre | Tema | Situación / Desviación | Acción | Responsable | Fecha compromiso | Estatus | Prioridad | Impacto RD$ | % Avance | Próximo paso | Última actualización | Comentario |
|---|---|---|---|---|---|---|---|---|---|---|---:|---:|---|---|---|

Valores recomendados:

- Área: `Operaciones` / `Mantenimiento`
- Trimestre: `T1` / `T2` / `T3` / `T4`
- Estatus: `Pendiente` / `En proceso` / `Completado` / `Bloqueado`
- Prioridad: `Alta` / `Media` / `Baja`
- Impacto RD$: número
- % Avance: porcentaje o decimal

El dashboard detecta automáticamente la hoja. Si todavía no existe, el diseño se mantiene y muestra un mensaje para cargar acciones.

## Nota de datos trimestrales

Las baterías trimestrales y el detalle mensual se alimentan de `Ejecucion mensual`.
El filtro de Área se aplica plenamente al bloque anual, centros, detalle y plan de acción usando `Detalle Centro-Supra`.
Para que el histórico mensual también pueda separarse por Área, añade una columna `Área` a `Ejecucion mensual` o prepara una tabla mensual por área en una siguiente actualización.

## GitHub

Sube **los cuatro archivos** a la raíz del repositorio `DASHBOARD-DE-CONTINUIDAD` y habilita GitHub Pages desde `main / (root)`.


## Ajustes v13

- Branding principal cambiado a **Grupo Ramos**; se eliminó la identificación de Sirena.
- `Resumen VP` ahora se denomina **Visión Ejecutiva**.
- Se eliminó el filtro de año.
- `Análisis por Centro` y `Detalle de Inversiones` se unificaron en **Análisis de Inversiones**.
- Filtros de la vista unificada:
  - búsqueda escrita por tienda;
  - supranúmero desplegable;
  - formato desplegable.
- El supranúmero se usa como filtro, pero **ya no aparece como columna** del detalle.
- **Ejecución General no se filtra por Operaciones/Mantenimiento**.
- Se agregaron cuatro tarjetas trimestrales en Ejecución General con batería, Plan acumulado y Ejecución acumulada.
- Se conserva el selector trimestral para visualizar los meses debajo.


## Ajustes v14

- La **Ejecución Anual** cambió al visual aprobado: barra de **Ejecución** apilada en `Real + Comprometido` frente a la barra de **Plan`.
- Sobre las barras se muestra el **% de ejecución** y la **brecha por ejecutar**; si la ejecución supera el plan, cambia automáticamente a `Sobre el plan`.
- Se mantienen las baterías trimestrales con **Plan acumulado** y **Ejecución acumulada**.
- Se mantiene el detalle mensual al seleccionar trimestre.
- `Ejecución General` permanece consolidada y no responde al filtro de Operaciones/Mantenimiento.
- `Visión Ejecutiva` conserva el filtro de Área con indicación discreta de la vista seleccionada.
- Se conserva `Análisis de Inversiones` unificado, con búsqueda por tienda, filtro desplegable de supranúmero y filtro de formato.
- El supranúmero sigue disponible como filtro pero no aparece como columna en el detalle.
- El encabezado utiliza el **logo oficial de Grupo Ramos** alojado en el sitio corporativo.

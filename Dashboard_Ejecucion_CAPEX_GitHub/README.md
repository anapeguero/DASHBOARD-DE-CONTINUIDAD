# Dashboard de Ejecución de Presupuesto CAPEX

Primera versión del dashboard web basada en `Panel de Ejecucion CAPEX.xlsx`.

## Fórmula utilizada

**Ejecución = Real + Comprometido**

**% Ejecución = (Real + Comprometido) / Plan × 100**

## Cómo probarlo

1. Descarga o copia toda esta carpeta.
2. Abre `index.html` mediante un servidor local (recomendado) o súbela a GitHub Pages.
3. El dashboard buscará automáticamente `Panel de Ejecucion CAPEX.xlsx`.
4. También puedes usar **Cargar otro Excel** para probar una versión actualizada del archivo.

## GitHub Pages

Sube estos archivos al repositorio:

- `index.html`
- `style.css`
- `script.js`
- `Panel de Ejecucion CAPEX.xlsx`

Luego activa GitHub Pages desde Settings → Pages → Deploy from branch.

## Importante

El Excel contiene datos presupuestarios. Si el repositorio es público, el archivo Excel también quedará accesible públicamente. Si los datos son confidenciales, conviene utilizar un repositorio privado o cambiar posteriormente la arquitectura para no exponer el archivo.

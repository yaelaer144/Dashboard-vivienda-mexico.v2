# Indicadores de Vivienda y Construcción Residencial en México

Dashboard estático preparado para **GitHub Pages mediante GitHub Actions**.

## Publicación

1. Descomprime el paquete.
2. Sube **todos los archivos y carpetas** a la raíz de la rama `main`.
3. En `Settings > Pages > Build and deployment`, selecciona **GitHub Actions** como `Source`.
4. Abre `Actions > Publicar dashboard en GitHub Pages` y comprueba que la ejecución termine correctamente.
5. Regresa a `Settings > Pages` y usa **Visit site**.

Consulta `SUBIR_A_GITHUB.md` para instrucciones detalladas.

## Estructura mínima

```text
index.html
styles.css
app.js
charts.js
maps.js
bootstrap-data.js
local-data.js
.github/
  workflows/
    pages.yml
```

`index.html` se encuentra en la raíz y las rutas a los recursos son relativas, por lo que funciona como sitio de proyecto (`usuario.github.io/repositorio/`).

## Actualización

El workflow `pages.yml` publica cambios hechos en `main` y también puede ejecutarse manualmente o por calendario. En las ejecuciones manuales/programadas intenta actualizar las fuentes configuradas, valida los archivos y publica el resultado en la misma ejecución.

## Regla de integridad

El dashboard no interpola periodos faltantes ni genera observaciones para rellenar huecos. Las series conservan la periodicidad y universo de la fuente correspondiente.

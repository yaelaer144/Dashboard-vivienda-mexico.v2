# Dashboard de Vivienda y Construcción — GitHub Pages

Paquete preparado para publicarse como sitio estático desde la **raíz** de un repositorio de GitHub. `index.html`, los archivos JavaScript y los CSV usan rutas relativas, por lo que funcionan tanto en un dominio `github.io` como en un sitio de proyecto `usuario.github.io/repositorio/`.

## Publicar por primera vez

1. Crea o abre el repositorio en GitHub.
2. Sube **el contenido de esta carpeta a la raíz del repositorio**. No subas una carpeta contenedora adicional.
3. Confirma que en la raíz se vean, entre otros, `index.html`, `styles.css`, `app.js`, los CSV y la carpeta `.github`.
4. Ve a **Settings > Pages**.
5. En **Build and deployment**, selecciona **Deploy from a branch**.
6. Selecciona la rama `main` y la carpeta `/(root)`, y guarda.

El archivo `.nojekyll` indica a GitHub Pages que publique este proyecto como archivos estáticos, sin procesamiento de Jekyll.

## Actualización automática

El workflow `.github/workflows/actualizar-dashboard.yml` queda listo para:

- ejecución manual desde **Actions > Actualizar datos del dashboard > Run workflow**;
- revisión automática cada lunes a las 07:00, hora de Ciudad de México;
- ejecutar `update_dashboard.py`;
- validar que no existan referencias locales rotas;
- hacer commit únicamente cuando cambien datos del dashboard.

### Variables opcionales de GitHub Actions

Si cuentas con exportaciones CSV oficiales o endpoints propios, se pueden registrar en **Settings > Secrets and variables > Actions > Variables**:

- `ENOE_CSV_URL`
- `IMSS_CSV_URL`
- `SHF_CSV_URL`
- `INPP_CSV_URL`
- `VAB_EDIFICACION_CSV_URL`
- `IFB_RESIDENCIAL_CSV_URL`
- `IMAI_CONSTRUCCION_CSV_URL`

Las variables no configuradas simplemente se omiten; el script conserva los últimos datos ya validados y no rellena periodos faltantes mediante interpolación.

## Prueba local opcional

Desde esta misma carpeta:

```bash
python -m http.server 8000
```

Después abre `http://localhost:8000/`. Para revisar solamente la estructura de archivos:

```bash
python validate_dashboard.py
```

# Publicar el dashboard en GitHub Pages

Esta versión usa **GitHub Actions** para publicar el sitio. No uses `Deploy from a branch`.

## 1. Sube los archivos

Descomprime el ZIP y sube **todo su contenido** a la raíz del repositorio. En la página principal del repositorio debes ver, entre otros:

- `index.html`
- `styles.css`
- `app.js`
- `.github/workflows/pages.yml`

No subas solamente el ZIP.

## 2. Configura Pages

En GitHub entra a:

`Settings > Pages > Build and deployment`

En **Source** selecciona:

`GitHub Actions`

No selecciones `Deploy from a branch` para esta versión.

## 3. Comprueba el despliegue

Ve a la pestaña **Actions** del repositorio y abre:

`Publicar dashboard en GitHub Pages`

La ejecución debe terminar en verde. El paso final se llama **Publicar GitHub Pages**.

Después vuelve a `Settings > Pages`. GitHub mostrará el botón **Visit site** y la URL publicada.

## 4. Si no aparece el workflow

Comprueba que el archivo exista exactamente en:

`.github/workflows/pages.yml`

Si cargaste los archivos desde el navegador y la carpeta `.github` no se incluyó, vuelve a subirla.

## 5. Actualización automática

El mismo workflow:

- publica cualquier cambio que hagas en `main`;
- permite ejecución manual desde **Actions > Run workflow**;
- revisa actualizaciones los lunes a las 07:00, hora de Ciudad de México;
- publica el sitio dentro de la misma ejecución, incluso cuando la actualización automática modifica archivos.

# Dashboard de vivienda — GitHub Pages (sin Actions)

Esta versión está preparada para publicarse como sitio estático directamente desde la rama `main` y la carpeta raíz del repositorio.

## Publicación

1. Sube **el contenido de esta carpeta** directamente a la raíz del repositorio. `index.html` debe quedar visible en la página principal del repositorio, no dentro de otra carpeta.
2. En GitHub abre **Settings → Pages**.
3. En **Build and deployment → Source** selecciona **Deploy from a branch**.
4. Selecciona **Branch: main** y **Folder: /(root)**.
5. Presiona **Save**.
6. Regresa a **Settings → Pages** para abrir el enlace publicado cuando GitHub indique que el sitio está activo.

No se utilizan GitHub Actions ni workflows de despliegue.

## Archivos principales

- `index.html`: entrada del dashboard.
- `styles.css`: estilos.
- `app.js`, `charts.js`, `maps.js`, etc.: lógica del dashboard.
- Archivos `.csv` y `.json`: datos locales utilizados por el sitio.
- `.nojekyll`: evita que GitHub Pages procese el contenido mediante Jekyll.

## Importante

Si el repositorio ya tenía un workflow en `.github/workflows`, elimínalo del repositorio para mantener esta configuración completamente sin Actions.

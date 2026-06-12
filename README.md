# Curso de Linux: de cero a conceptos avanzados

Sitio estático del curso, construido con [Docusaurus](https://docusaurus.io/).

El curso completo vive en la carpeta [`docs/`](docs/): cada módulo es una
carpeta numerada y su `index.md` contiene el índice detallado de los capítulos
que se irán desarrollando como archivos `.md` adicionales dentro de la misma
carpeta. El sidebar se genera automáticamente a partir de esa estructura.

## Desarrollo local

```bash
npm install        # instalar dependencias (solo la primera vez)
npm start          # servidor de desarrollo con recarga en vivo
```

## Build de producción

```bash
npm run build      # genera el sitio estático en build/
npm run serve      # sirve build/ localmente para verificarlo
```

## Cómo añadir un capítulo

1. Crear el archivo dentro de la carpeta del módulo, con prefijo numérico
   para el orden, p. ej. `docs/03-terminal-y-shell/01-que-es-una-shell.md`.
2. Añadir el front matter mínimo:

   ```md
   ---
   title: ¿Qué es una shell?
   description: Breve descripción del capítulo.
   ---
   ```

3. El capítulo aparece automáticamente en el sidebar bajo su módulo.

## Deploy

Antes de publicar, ajustar `url`, `baseUrl`, `organizationName` y
`projectName` en [`docusaurus.config.js`](docusaurus.config.js).

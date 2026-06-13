# Kanban

Tablero Kanban estático (Vite + React + Tailwind). Sin backend: persiste en el
navegador vía `localStorage`. Se publica en GitHub Pages con GitHub Actions.

## Desarrollo

```bash
npm install
npm run dev
```

## Build de producción

```bash
npm run build      # genera /dist
npm run preview    # sirve /dist localmente para probar
```

## Deploy

Push a `main` dispara el workflow de `.github/workflows/deploy.yml`, que buildea
y publica el contenido de `dist` en GitHub Pages.

> Recordá activar Pages una vez en **Settings → Pages → Source: GitHub Actions**.

URL: https://juan-amelio.github.io/kanban/

## Notas

- `vite.config.js` usa `base: '/kanban/'`. Si renombrás el repo, actualizá ese valor.
- Persistencia en `localStorage` con las keys `kanban_cards_v2` y `kanban_next_v2`.

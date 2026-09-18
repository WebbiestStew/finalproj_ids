# DAuto — frontend

SPA en React (Vite) que consume el backend en `../backend`. Cubre lo que ya
existe del producto: landing, registro, login y un panel por rol. No hay
catálogo, financiamiento ni nada de eso todavía — ver el README raíz del repo
para el panorama completo.

## Correr en local

```bash
npm install
npm run dev
```

Por defecto apunta a `http://localhost:3000` (el backend). Si lo corres en otro
puerto o hay que apuntar a un backend distinto, define `VITE_API_URL` en un
`.env` (ver `.env.example`).

## Stack

React 19 + Vite, `react-router-dom` para rutas, y `motion` (Framer Motion) para
las animaciones que sí importan — el menú de usuario, el control segmentado del
registro, y las transiciones entre páginas. Todo lo demás es CSS plano con
variables, sin ningún framework de UI.

## Scripts

```bash
npm run dev      # servidor de desarrollo
npm run build    # build de producción a dist/
npm run lint     # oxlint
npm run preview  # sirve el build de producción localmente
```

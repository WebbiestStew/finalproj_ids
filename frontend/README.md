# DAuto — frontend

SPA en React (Vite) que consume el backend de `../backend`: landing, registro, inicio de
sesión, un panel por rol, el **catálogo de vehículos** (público, con filtros en la URL) y el
**inventario** de cada concesionaria (publicar, editar, cambiar estado, eliminar). Todavía no
hay financiamiento ni citas — ver el README de la raíz para el panorama completo.

## Correr en local

```bash
npm install
npm run dev     # http://localhost:5173
```

Apunta a `http://localhost:3000` por defecto; para otro backend define `VITE_API_URL`
(ver `.env.example`).

## Diseño

Sigue el lenguaje de diseño de Apple, adaptado a la web:

- Fuente del sistema (SF en Mac/iOS), sin fuentes externas, con tracking que depende del tamaño.
- Un solo color de acento, tokens semánticos y modo claro/oscuro automático
  (`prefers-color-scheme`, sin interruptor propio). Los pares de color de texto cumplen
  WCAG AA (≥ 4.5:1), medidos con un script, no a ojo.
- Chrome translúcido (barra y menú) con `backdrop-filter`; el contenido sigue opaco.
- Movimiento con resortes críticamente amortiguados (`motion`): menú de usuario, control de
  rol, alertas y transiciones de página. Respeta `prefers-reduced-motion`,
  `prefers-reduced-transparency` y `prefers-contrast`.
- Accesibilidad: enlace para saltar al contenido, landmarks, alertas anunciadas
  (`role="alert"`), errores enlazados con `aria-describedby`, foco visible y objetivos táctiles
  de 44 px en pantallas táctiles.

## Scripts

```bash
npm run dev            # servidor de desarrollo
npm run build          # build de producción a dist/
npm run lint           # oxlint
npm test               # pruebas (Vitest + Testing Library)
npm run test:coverage  # con reporte de cobertura
```

Nota: el proyecto usa `legacy-peer-deps` (ver `.npmrc`) para evitar un fallo del resolvedor de
npm con las dependencias peer de las herramientas de prueba.

# DAuto

Proyecto final de Ingeniería de Software (Tecmilenio, campus Las Torres). La idea de DAuto
es simple: comprar o vender un auto usado en México hoy implica llamarle a cinco
agencias, que ninguna te diga el precio real por teléfono, y comparar financiamiento
a mano en una libreta. DAuto centraliza eso — catálogo, precio real, historial del
vehículo y financiamiento en un solo lugar, para compradores y concesionarias.

Este repo es el avance del proyecto, no el producto terminado. Lo que sí funciona
está funcionando de verdad (con pruebas, CI/CD y un pipeline de seguridad corriendo
en GitHub Actions); lo que no está construido todavía se dice tal cual, sin
maquillar.

## Qué hay hoy

Lo único implementado hasta ahora es el módulo de **autenticación**: registro y
login con JWT, tres roles (`admin`, `concesionaria`, `comprador`), y un panel que
cambia según quién entró — un admin ve la lista de usuarios registrados, todos los
demás ven un "esto llega después".

El resto del alcance (catálogo de vehículos, simulador de financiamiento,
geolocalización de sucursales, citas para test drive, reportes de ventas) está en
`adv_pr.pdf`, planeado por sprints, pero sin una línea de código todavía. Si estás
leyendo esto buscando esas funciones, no las vas a encontrar — perdón por el spoiler.

## Cómo se ve

El frontend le mete bastante cuidado al detalle de interacción — nada dramático,
pero los botones responden al instante al presionarlos, el menú del usuario se abre
con un resorte físico anclado al avatar (no un fade genérico), y cambiar de página
no es un corte seco. Si te interesa el por qué, está documentado en el código
mismo (`frontend/src/App.jsx`, `frontend/src/components/UserMenu.jsx`) con
comentarios que citan de dónde sale cada decisión.

## Cómo correrlo

Necesitas dos terminales — el backend y el frontend son proyectos separados.

**Backend** (`backend/`):

```bash
cd backend
cp .env.example .env   # y ajusta JWT_SECRET
npm install
npm run dev
```

Levanta en `http://localhost:3000`. Los detalles (endpoints, cómo crear un admin,
Docker) están en [`backend/README.md`](backend/README.md).

**Frontend** (`frontend/`):

```bash
cd frontend
npm install
npm run dev
```

Levanta en `http://localhost:5173` y ya apunta al backend de arriba. Sin el
backend corriendo, vas a ver "Failed to fetch" en cuanto intentes registrarte —
no es un bug, es que falta la otra mitad prendida.

## Pruebas y CI/CD

El backend tiene 27 pruebas unitarias con Jest, cobertura arriba del 98% (el
mínimo pedido era 80%), y un pipeline en GitHub Actions que corre lint + pruebas +
build de Docker + un despliegue de humo en cada push a `main`. Hay otro workflow
separado con un escaneo de seguridad (OWASP ZAP) y análisis de calidad de código.
Ambos están en verde ahora mismo — no siempre lo estuvieron, y la historia de qué
se rompió y cómo se arregló está en el informe de cierre.

```bash
cd backend
npm run test:coverage
npm run lint
```

## Estructura

```
backend/    API REST — Express, SQLite, autenticación JWT
frontend/   SPA en React (Vite) que consume la API
docs/       informe de cierre: qué se planeó vs. qué se hizo, lecciones, plan de mejora
adv_pr.pdf  el acta de constitución original del proyecto (secciones 1-3)
```

## El informe de cierre

[`docs/informe-cierre.md`](docs/informe-cierre.md) tiene la comparación honesta
entre lo planificado y lo ejecutado, incluyendo los dos bugs reales de CI/CD que
se encontraron corriendo el pipeline por primera vez (no leyendo el YAML), y las
lecciones que dejaron. Vale la pena leerlo antes de asumir que todo salió a la
primera — no fue así, y ese es justo el punto de documentarlo.

---

Diego Villarreal Martínez · Al07064821

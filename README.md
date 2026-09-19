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

Dos módulos funcionando de punta a punta:

- **Cuentas:** registro y login con JWT, tres roles (`admin`, `concesionaria`, `comprador`) y un
  panel que cambia según quién entró.
- **Catálogo de vehículos:** cualquiera puede ver los autos y filtrarlos por marca, carrocería,
  precio y año (los filtros viven en la URL, así que un enlace comparte la búsqueda). Cada
  concesionaria publica y administra su propio inventario — editar, apartar, marcar como vendido
  o eliminar — y un auto vendido deja de aparecer en el catálogo.

Todavía no hay fotos: cada auto se muestra con una ilustración cuyo tipo de carrocería y color
salen de sus datos, y la ficha lo dice. El resto del alcance (simulador de financiamiento,
geolocalización de sucursales, citas para test drive, reportes de ventas) está en `adv_pr.pdf`,
planeado por sprints, pero sin una línea de código todavía.

## Cómo se ve

El diseño sigue el lenguaje de Apple, adaptado a la web: fuente del sistema, un solo
color de acento, modo claro y oscuro automático, barra y menú translúcidos, y un
auto dibujado en línea que se traza solo al abrir la página. Los colores de texto
cumplen WCAG AA — medido con un script, no a ojo — y todo respeta las preferencias
de movimiento, transparencia y contraste reducidos. El movimiento (menú de usuario,
selector de rol, transiciones de página) usa resortes en vez de animaciones fijas.
Los detalles y el por qué están en [`frontend/README.md`](frontend/README.md).

## Cómo correrlo

Necesitas Node 22 (mínimo 20.19). Desde la raíz:

```bash
npm run setup   # instala todo y crea los .env con un secreto y una contraseña de admin generados
npm run dev     # backend y frontend juntos → http://localhost:5173
```

`setup` imprime las cuentas de prueba (administrador y dos concesionarias demo con 12 autos) y es seguro
repetirlo. Si algo falla al conectar, casi siempre es que falta el backend: `npm run dev` levanta los dos.

Con Docker: `npm run setup && docker compose up --build` → http://localhost:3000.
Para publicarlo en internet (Render gratis o Fly.io con datos persistentes) está la guía completa en
[`docs/despliegue.md`](docs/despliegue.md). Es una sola imagen: la API sirve también el frontend.

## Pruebas y CI/CD

El backend tiene 130 pruebas con Jest y cobertura de 100% en líneas (el mínimo pedido
era 80%); el frontend tiene 132 con Vitest y ~98%. El pipeline de GitHub Actions corre,
en cada push a `main`, auditoría de dependencias, lint, pruebas con cobertura, build
del frontend, build de Docker y un despliegue de humo del contenedor publicado. Hay otro
workflow con un escaneo de seguridad (OWASP ZAP). No siempre estuvieron en verde — la
historia de qué se rompió y cómo se arregló está en el informe de cierre.

```bash
cd backend  && npm run test:coverage && npm run lint
cd frontend && npm run test:coverage && npm run lint
```

Una cosa que no me atrevo a afirmar: que aguante 1,000 usuarios concurrentes. Lo medí
y el cuello de botella es el hash de contraseñas (~4 logins/s por instancia con el costo
por defecto); los números y el plan están en el informe.

## Estructura

```
backend/     API REST — Express, SQLite, JWT (y sirve el frontend compilado en producción)
frontend/    SPA en React (Vite) que consume la API
scripts/     setup y dev de un solo comando
docs/        informe de cierre y guía de despliegue
Dockerfile   una imagen con todo · docker-compose.yml · render.yaml · fly.toml
adv_pr.pdf   el acta de constitución original del proyecto (secciones 1-3)
```

## El informe de cierre

[`docs/informe-cierre.md`](docs/informe-cierre.md) tiene la comparación honesta
entre lo planificado y lo ejecutado, incluyendo los dos bugs reales de CI/CD que
se encontraron corriendo el pipeline por primera vez (no leyendo el YAML), y las
lecciones que dejaron. Vale la pena leerlo antes de asumir que todo salió a la
primera — no fue así, y ese es justo el punto de documentarlo.

---

Diego Villarreal Martínez · Al07064821

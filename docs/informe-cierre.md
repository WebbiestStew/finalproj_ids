# Avance de Proyecto — DAuto: Implementación, Seguridad y Cierre

**Materia:** Ingeniería en desarrollo de software
**Alumno:** Diego Villarreal Martínez — Matrícula Al07064821
**Continúa de:** `adv_pr.pdf` (secciones 1–3: acta de constitución, requerimientos, riesgos y cronograma)

---

## 4. Implementación y seguridad

### 4.1 Módulo básico: Autenticación de concesionarias y compradores

Del backlog de la sección 2.3 (módulo **Auth & Usuarios** de la arquitectura monolítica
modular) se implementó el módulo de registro y autenticación, primer bloque funcional
requerido antes de catálogo, financiamiento, citas y reportes. Ubicado en `backend/`.

- **Autenticación:** JWT firmado con `HS256`, expiración de 2 horas, contraseñas
  con hash `bcrypt` (12 rounds).
- **Roles:** `admin`, `concesionaria`, `comprador` (especialización de la matriz de
  stakeholders de la sección 1.2). El endpoint público de registro **no permite**
  auto-asignarse el rol `admin`; las cuentas administrativas se crean con un script
  de seed (`scripts/seedAdmin.js`), evitando escalamiento de privilegios.
- **Endpoints:** `POST /api/auth/register`, `POST /api/auth/login`,
  `GET /api/auth/me` (protegido), `GET /api/auth/users` (protegido, solo `admin`).
- **Validación de entrada:** esquemas `zod` para email, contraseña (mín. 8
  caracteres) y nombre.
- **Hardening adicional:** `helmet` (CSP, HSTS, X-Frame-Options, etc.),
  `express-rate-limit` en `/login` y `/register` (20 intentos / 15 min) para mitigar
  fuerza bruta, y `cors` restringido por variable de entorno en vez de origen abierto.

**Pruebas unitarias — cobertura real obtenida (Jest):**

| Métrica    | Resultado | Umbral exigido |
|------------|-----------|-----------------|
| Statements | 98.26%    | 80%             |
| Branches   | 82.35%    | 80%             |
| Functions  | 95.83%    | 80%             |
| Lines      | 98.18%    | 80%             |

26 pruebas (`backend/tests/`) cubren: registro válido/ inválido por rol, duplicados,
login correcto/incorrecto, middleware de autenticación y de roles (unitario y de
integración vía `supertest`), manejo de rutas desconocidas, y dos pruebas de
seguridad negativa (inyección SQL y XSS almacenado, ver 5.1). El umbral de 80% está
codificado en `jest.config` (`coverageThreshold`), por lo que **la build falla
automáticamente** si la cobertura cae por debajo del mínimo.

### 4.2 Pipeline CI/CD (GitHub Actions)

Archivo: `.github/workflows/ci-cd.yml`. Tres jobs encadenados:

1. **`lint-and-test`** — instala dependencias, corre ESLint y `jest --coverage`;
   publica el reporte de cobertura como artefacto.
2. **`build-and-push`** (solo en push a `main`, tras pasar el job anterior) —
   construye la imagen Docker (`backend/Dockerfile`, `node:20-alpine`, usuario no
   root) y la publica en GitHub Container Registry (`ghcr.io`) con tags `latest` y
   el SHA del commit, usando el `GITHUB_TOKEN` por defecto (sin credenciales
   externas que configurar).
3. **`deploy-test-env`** — despliega automáticamente la imagen recién publicada en
   un contenedor efímero dentro del runner de CI y ejecuta un *smoke test* real
   (`/health` + flujo completo de registro) contra ella antes de dar por buena la
   entrega.

> **Nota de alcance:** al no contar con una cuenta de hosting persistente (Render/Fly/EC2)
> para este avance, el "entorno de prueba" del punto 3 es efímero (vive solo durante el
> job de CI). La imagen ya queda publicada en GHCR lista para desplegarse en un host
> persistente agregando únicamente las credenciales de ese proveedor como secreto —
> el resto del pipeline no cambia.

---

## 5. Pruebas y calidad

### 5.1 Pruebas de seguridad

Se ejecutaron dos vías complementarias, dado que este entorno de desarrollo no tiene
Docker disponible localmente (`action-baseline` de ZAP sí requiere Docker):

**a) OWASP ZAP Baseline Scan (automatizado en CI):**
`.github/workflows/security-scan.yml` levanta el servidor y ejecuta
`zaproxy/action-baseline` contra `http://localhost:3000`, publicando el reporte
HTML/JSON como artefacto en cada push a `main` y cada Pull Request.

**b) Pruebas manuales dirigidas (ejecutadas en este avance, servidor local real):**

| Payload probado | Resultado antes | Acción tomada | Resultado después |
|---|---|---|---|
| SQLi en `email` (registro y login), ej. `' OR 1=1--` | Rechazado por `zod` (formato de correo inválido) antes de llegar a la consulta parametrizada de `better-sqlite3` | Ninguna (ya seguro por diseño: consultas parametrizadas + validación) | Sin cambios — confirmado seguro |
| XSS almacenado en `name`, `<script>alert(1)</script>` | **Se guardaba tal cual** en la base de datos y se devolvía en el JSON de respuesta — riesgo de XSS reflejado si un frontend renderiza `user.name` sin escapar | Se agregó regla de validación (`regex` en `zod`) que rechaza `<` y `>` en el nombre | Payload ahora responde `400 Bad Request`; se agregó prueba de regresión (`tests/auth.test.js`) |
| CORS `Access-Control-Allow-Origin: *` por defecto | Abierto a cualquier origen | Se restringió por variable de entorno `CORS_ORIGINS` (lista blanca), con fallback abierto solo si no se configura | Documentado en `.env.example`, listo para fijarse en despliegue real |
| Encabezados de seguridad (`curl -I /health`) | — | `helmet` ya aplicaba CSP, HSTS, `X-Content-Type-Options`, `X-Frame-Options`, etc. | Confirmado correcto, sin cambios |

Este hallazgo de XSS almacenado es el resultado más relevante de la sección de
seguridad: mostró que **bloquear inyección SQL no es suficiente** — cada campo debe
validarse también contra el contexto de salida (HTML) en el que eventualmente se
va a renderizar.

### 5.2 Calidad de código

No se contó con una instancia de SonarQube (requiere servidor/Docker o cuenta
SonarCloud, no disponibles en este entorno). Como sustituto real y ejecutable ahora
mismo se usó **`eslint-plugin-sonarjs`** — el mismo motor de reglas de "code smells"
detrás del analizador JS/TS de SonarQube — y se dejó preparado un job opcional de
SonarCloud en CI (`security-scan.yml`, job `code-quality`) que se activa solo si el
repositorio configura `SONAR_TOKEN` y la variable `SONAR_ORGANIZATION`.

**Métricas reales obtenidas (`npm run lint`, `backend/src` + `backend/tests`):**

| Corrida | Code smells | Bugs | Vulnerabilidades |
|---|---|---|---|
| Antes | 3 (`sonarjs/no-duplicate-string` — literales de rutas/headers repetidos en las pruebas) | 0 | 0 |
| Después de remediar | **0** | 0 | 0 |

Remediación: se extrajeron los literales duplicados (`/api/auth/register`,
`/api/auth/login`, `Authorization`, etc.) a constantes en `tests/auth.test.js`,
eliminando la deuda técnica detectada sin afectar la cobertura (se mantuvo en 98.26%).

`npm audit` sobre las dependencias de producción y desarrollo: **0 vulnerabilidades**
conocidas al momento de este avance.

---

## 6. Cierre y evaluación

### 6.1 Planificado vs. ejecutado

| Punto del checklist | Planificado | Ejecutado | Desviación |
|---|---|---|---|
| Módulo básico + JWT/roles (4h) | Módulo de autenticación con roles admin/usuario | Implementado con 3 roles (`admin`/`concesionaria`/`comprador`) para reflejar el dominio real de DAuto (sección 1.2), no solo admin/usuario genérico | Ampliación menor de alcance, sin costo adicional relevante |
| Cobertura ≥80% (Jest) | ≥80% | 98.26% statements / 82.35% branches | Por encima de lo pedido |
| CI/CD con despliegue automático a entorno de prueba | Despliegue a un entorno de prueba persistente | Build + push a GHCR + smoke test automatizado en contenedor efímero de CI | **Desviación real:** no había cuenta de hosting de prueba disponible; se sustituyó por un entorno efímero dentro del propio pipeline |
| Escaneo OWASP ZAP | Escaneo de XSS/SQLi | ZAP baseline automatizado en GitHub Actions (requiere Docker, no disponible localmente) + pruebas manuales dirigidas ejecutadas localmente | Se dividió en dos vías por la limitación de entorno; ambas se completaron |
| SonarQube (deuda técnica, code smells) | Análisis con SonarQube | `eslint-plugin-sonarjs` (motor de reglas equivalente) ejecutado y remediado localmente; job de SonarCloud dejado listo mas no activado | **Desviación real:** sin servidor/cuenta SonarQube disponible en este entorno |
| Informe de cierre | Comparación + lecciones + mejora continua | Este documento | Sin desviación |

### 6.2 Lecciones aprendidas

1. **Validar solo el formato de entrada no basta.** La protección contra SQLi vino
   gratis por usar consultas parametrizadas + `zod`, pero el mismo `zod` dejaba
   pasar `<script>` en el nombre porque nadie había pensado en el contexto de
   salida (HTML). La lección: cada campo de texto libre necesita una regla
   explícita pensada en dónde se va a renderizar, no solo en si "parece" un dato
   válido.
2. **Las herramientas de seguridad/calidad asumen infraestructura que no siempre
   está disponible en el entorno de desarrollo local** (Docker para ZAP, un
   servidor para SonarQube). Definir desde el Sprint 0 qué checks corren en local
   y cuáles solo pueden validarse en CI hubiera evitado la re-planificación a
   mitad de esta entrega — es el mismo tipo de riesgo que la sección 3.1 (R1)
   identificaba para la API de geolocalización, y aplica igual de bien a
   herramientas de calidad/seguridad.
3. **Un umbral de cobertura en el propio `jest.config` (no solo revisado a mano)
   convierte una buena práctica en una regla que no se puede saltar** — cualquier
   PR que baje de 80% rompe el pipeline automáticamente, sin depender de que
   alguien se acuerde de revisarlo.

### 6.3 Plan de mejora continua

- Activar SonarCloud con token real y agregar el badge de cobertura/deuda técnica
  al README una vez el repositorio esté en GitHub.
- Sustituir el job `deploy-test-env` efímero por un despliegue a un host persistente
  (Render/Fly.io/EC2) en cuanto se disponga de una cuenta de prueba, reutilizando
  la misma imagen ya publicada en GHCR.
- Ampliar el escaneo de ZAP de *baseline* a *full scan* autenticado (con un usuario
  de prueba) antes del cierre de cada sprint, no solo en cada push.
- Extender este mismo módulo de autenticación al de Catálogo/Inventario (Sprint 2
  del cronograma original) reutilizando el middleware `authenticate`/`requireRole`.
- Explorar (siguiendo la lógica del ejemplo del propio checklist sobre predicción de
  donaciones, adaptado al dominio de DAuto) un modelo de IA para **predecir
  probabilidad de cierre de venta por prospecto** o sugerir precio de referencia
  por vehículo según kilometraje/año/zona, usando los reportes de ventas del
  módulo de Reportes (Sprint 5) como fuente de datos de entrenamiento.

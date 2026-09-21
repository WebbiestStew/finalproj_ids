# Reportes

Evidencia generada por las herramientas, no escrita a mano. Cada archivo se regenera con el comando
indicado. Los mismos reportes se publican como artefactos en cada corrida de
[GitHub Actions](https://github.com/WebbiestStew/finalproj_ids/actions) (se borran a los 90 días; estos
archivos quedan en el repo).

| Reporte | Qué muestra | Cómo se regenera |
|---|---|---|
| [`pruebas-backend.txt`](pruebas-backend.txt) | 130 pruebas Jest, cobertura 100 % líneas / 93.9 % ramas (mínimo pedido: 80 %) | `cd backend && npm run test:coverage` |
| [`pruebas-frontend.txt`](pruebas-frontend.txt) | 132 pruebas Vitest, cobertura 97.8 % líneas / 87.5 % ramas | `cd frontend && npm run test:coverage` |
| [`duplicacion-backend.txt`](duplicacion-backend.txt) | jscpd: 0.53 % de líneas duplicadas (umbral 3 %) | `cd backend && npm run duplication` |
| [`zap-baseline-final.txt`](zap-baseline-final.txt) | OWASP ZAP, última corrida: **0 fallos, 0 advertencias, 66 reglas pasadas, 1 ignorada** | workflow *Seguridad y calidad de codigo* |
| [`zap-baseline-1-warn.html`](zap-baseline-1-warn.html) / [`.md`](zap-baseline-1-warn.md) | Reporte completo de la corrida anterior, con la única advertencia (*Non-Storable Content*) | ídem |

## Seguridad

El escaneo de ZAP es *baseline* (pasivo: revisa cabeceras, cookies y contenido; no ataca activamente). Por
eso la cobertura de XSS e inyección SQL no depende solo de ZAP: `backend/tests/hardening.test.js` y
`auth.test.js` / `vehicles.test.js` envían cargas de inyección SQL y de XSS a la API y comprueban que se
rechazan o se tratan como texto (consultas parametrizadas, validación con zod, rechazo de `<` y `>` en
nombres). Los hallazgos encontrados y corregidos están en la sección 5 del
[informe de cierre](../informe-cierre.md).

La regla ignorada (10049, *Non-Storable Content*) es una decisión de diseño: las respuestas de la API llevan
`Cache-Control: no-store` porque una corrida anterior marcó lo contrario como hallazgo. Está justificada en
[`.zap/rules.tsv`](../../.zap/rules.tsv).

## Calidad de código (SonarQube)

El workflow ya tiene el job de SonarCloud y `sonar-project.properties` cubre backend y frontend con sus
reportes de cobertura, pero **el job se salta hasta que se configuren `SONAR_TOKEN` y la variable
`SONAR_ORGANIZATION`** (no hay servidor SonarQube local ni cuenta). Mientras tanto, las métricas equivalentes
salen de ESLint con `eslint-plugin-sonarjs` (0 code smells), oxlint (0 avisos), jscpd (0.53 % de duplicación)
y `npm audit` (0 vulnerabilidades); los números y su comparación están en la sección 4 del informe.

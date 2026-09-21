# Reportes

Evidencia generada por las herramientas, no escrita a mano. Cada archivo se regenera con el comando
indicado. Los mismos reportes se publican como artefactos en cada corrida de
[GitHub Actions](https://github.com/WebbiestStew/finalproj_ids/actions) (se borran a los 90 días; estos
archivos quedan en el repo).

| Reporte | Qué muestra | Cómo se regenera |
|---|---|---|
| [`pruebas-backend.txt`](pruebas-backend.txt) | 130 pruebas Jest, cobertura 100 % líneas / 93.9 % ramas (mínimo pedido: 80 %) | `cd backend && npm run test:coverage` |
| [`pruebas-frontend.txt`](pruebas-frontend.txt) | 143 pruebas Vitest, cobertura 97.8 % líneas / 87.6 % ramas | `cd frontend && npm run test:coverage` |
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

## Calidad de código (SonarQube / SonarCloud)

Análisis oficial con **SonarCloud** (`webbieststew_finalproj_ids`), ejecutado por el workflow *Seguridad y calidad
de codigo*. Resultado tras corregir los dos hallazgos del primer análisis
([`sonarcloud/`](sonarcloud/): `metricas.json`, `quality-gate.json`, `hallazgos.json`):

| | Primer análisis | Actual |
|---|---|---|
| Quality gate | sin calcular | **OK** |
| Bugs / vulnerabilidades / hotspots | 0 / 0 / 0 | 0 / 0 / 0 |
| Code smells | 2 | **0** |
| Deuda técnica | 25 min | **0 min** |
| Ratings (seguridad / fiabilidad / mantenibilidad) | A / A / A | A / A / A |
| Cobertura / duplicación | 93.6 % / 0.0 % | 93.6 % / 0.0 % |

Los dos hallazgos (regex con retroceso en `validateRegistration.js` y un `radiogroup` no enfocable en
`Register.jsx`) y su corrección están en la sección 5.2 del [informe de cierre](../informe-cierre.md).
Además corren en cada push: ESLint con `eslint-plugin-sonarjs`, oxlint, jscpd y `npm audit`.

# Auditoría de Eros (2-nov-2026)

Dos auditorías de solo lectura: **el admin contra el Eros real** (levantado en local sin claves, con datos ficticios) y **`eros-agent` en sí** (código, base copiada, tests con la red bloqueada). No se contactó el Eros de producción, ni portales, ni n8n, SMTP o Telegram.

Referencias: P = `portfolio`, E = `eros-agent/src/eros`.

---

## 1. Urgente: seguridad

| # | Qué | Dónde | Arreglo |
|---|---|---|---|
| S1 | El repo `eros-agent` es **público** y el workflow de n8n tiene escrito `Bearer Adct…` para llamar a Eros. Si es la clave de producción, cualquiera usa la API de Eros (postular, publicar, borrar). | `n8n/eros_career_os_master_workflow.json` | Comprobar en Coolify; si coincide, rotar `EROS_API_KEY` en Eros y en la API del portfolio. Sacar el literal (credenciales de n8n) y limpiar el historial o hacer privado el repo. |
| S2 | El webhook de n8n `/webhook/eros-content` no pide autenticación y publica directo en LinkedIn y X. | mismo workflow; E/content/dispatcher.py:342 | Auth por header en el webhook y que Eros mande `N8N_WEBHOOK_SECRET`. |
| S3 | Desde el admin, un id raro (`%2F`) termina en `DELETE /api/jobs` de Eros, que **borra toda la cola** (revive «Borrar todas»). La clave viaja en redirecciones. | P/server/src/admin/proxy.ts:113 y rutas de hunter | Validar ids (`^[A-Za-z0-9_-]+$`) y `redirect: 'manual'`. |
| S4 | Las rutas del CV de Eros son públicas, con ids predecibles, y si no hay CV lo generan con Gemini (gasta cuota). | E/api.py:518-546; engine.py:446-479 | Servir solo lo guardado y con token firmado. |

## 2. Lo que puede mandar algo mal a un reclutador

| # | Qué | Dónde | Arreglo |
|---|---|---|---|
| R1 | **«Enviar desde Eros» adjunta el CV de Eros**, no el de la base: datos escritos a mano y, sin Gemini, un resumen que es el texto del análisis («…compatibilidad del 83% con el perfil de Mateo»). | E/hunter/dispatcher.py:247-289; cv_generator.py:251+; P/hunterCvRoutes.ts:36 | Ya: apagar «Enviar desde Eros» (queda Gmail + «Ya la envié»). Después: el admin manda su CV y Eros no adjunta otro. |
| R2 | **Correos adivinados marcados como verificados**: `jobs@<empresa>.com` (con «Empresa Confidencial» → `empresaconfidencial.com`), y el admin siempre manda `confirmed: true`. | E/hunter/email_finder.py:173-176, 343-348; dispatcher.py:152-173; P/erosContract.ts | No guardar correos adivinados; guardar la fuente; el admin la muestra y pide escribir la dirección si no es real. |
| R3 | **Envío duplicado**: el admin corta a los 35 s y dice «no se envió» mientras Eros sigue y envía; un reintento manda de nuevo. Sin proveedor, Eros registra «aplicado» sin enviar. | P/hunterApply.ts:82; E/dispatcher.py:191, 291-310, 347-356 | Marcar «enviando» atómico en Eros + clave de idempotencia; ante corte, «no sabemos si salió». `ok:false` sin proveedor. |
| R4 | **Sin Gemini, Eros inventa**: puntajes 72–95 para cualquier vacante (22 de 41 evaluadas en la base son heurísticas), posts con métricas falsas; el admin lo muestra como «Eros». | E/integrations/llm.py:62-83, 241-268, 348-375 | Que el modo heurístico no guarde SAVED ni escriba CV, mensajes o posts; el admin lo rotula. |

## 3. Funciones del panel que no andan contra el Eros real

Los tests pasan porque el Eros simulado (`tests/admin/eros-mock.ts`) responde con formas que el real no manda.

| # | Función | Causa | Arreglo |
|---|---|---|---|
| F1 | Tendencia → publicación: falla siempre (422 sin enfoque, 500 con enfoque). | Enfoques del admin (`TECHNICAL_BREAKDOWN`…) ≠ los de Eros (`architecture`…); default inválido en Eros. | Mapear enfoques; no mandar `pillar` null; arreglar el default en E/radar/models.py:40. |
| F2 | «Buscar correo» nunca muestra lo encontrado. | Eros manda `contact_email`, el admin lee `email`. | Leer `contact_email`, `found`, `source`. |
| F3 | Publicaciones: Dev.to vacío, enfoque siempre vacío, «Generar» con enfoque da 422, «Publicar en el blog» usa el texto de LinkedIn. | Eros manda `devto` anidado; enfoques distintos; puntos y ángulo van en `custom_instructions`. | Leer `devto.*`, mapear enfoques. |
| F4 | «Publicar en LinkedIn» publica también en X (el workflow ignora el canal) y dice «despachó» aunque Eros solo la aprobó local. | E/content/dispatcher.py:20-59; P/content.ts:108-120 | Eros respeta `channel`; el admin lee `status`. |
| F5 | El asunto del mensaje sale vacío. | Eros manda `subject_or_hook`. | Leer ese campo. |
| F6 | «Buscar vacantes» y «Evaluar» se cortan a los 60 s y Eros sigue; un segundo clic duplica el escaneo; el corte cuenta como caída y apaga funciones. | P/hunter.ts:93, 106; Eros es sincrónico | Escaneo asincrónico en Eros (202 + estado); los cortes largos no cuentan como caída. |
| F7 | Un 500 de Eros se muestra como «Eros no responde»; los 400 de envío salen genéricos. | P/proxy.ts:99-101, 149-151 | Distinguir 5xx de caída y pasar el `detail`. |

El CV adaptado (ver, imprimir, copiar) **anda con Eros arriba y caído**: el invariante 6 se cumple.

## 4. Eros en sí

| # | Qué | Dónde |
|---|---|---|
| E1 | Cada escaneo borra físicamente vacantes descartadas, de bajo puntaje **y aplicadas**; vuelven como nuevas y se re-evalúan. | E/hunter/engine.py:63-64, 85-119, 220 |
| E2 | Scrapers rotos sin aviso: GetOnBoard sin empresa ni tags (25 de 25), Hacker News mal parseado, LinkedIn guarda vacantes sin descripción, Computrabajo casi vacío. Sin métricas por fuente. | E/hunter/sources/*.py |
| E3 | Perfil y CV escritos a mano dentro de Eros, duplicando la base del portfolio (que expone `/api/cv`). | E/hunter/matcher.py:13-29; cv_generator.py:23-111, 251-430 |
| E4 | LLM frágil: sin reintentos ni timeouts razonables, cascada de 4 modelos de 45 s, pausa de cuota no compartida, modelos configurados que quizá no existen. | E/integrations/llm.py; config.py:39-45 |
| E5 | Publicación: se puede republicar lo publicado o rechazado; marca PUBLISHED antes de que n8n publique; solo sale el primer tweet; no hay Dev.to. | E/content/dispatcher.py:298-345 |
| E6 | Logs de producción perdidos (uvicorn sin logging); con `main.py` se loguea el token de Telegram en URLs. | Dockerfile:28; main.py:17-20 |
| E7 | La base SQLite vive en `/app/data`: sin confirmar volumen en Coolify, sin respaldos. Los embeddings (~42 KB por vacante) viajan en `/api/jobs`. | Dockerfile:22-23; models.py:38 |
| E8 | Filtros: «global»/«contractor» anulan exclusiones geográficas; Laravel/PHP no se excluyen; coincidencias por subcadena. | E/hunter/filters.py |
| E9 | Menores: cookie de sesión con la clave en crudo; UI propia con Vue/Tailwind de CDN sin versión; `/perfil` de Telegram se rompe con «&»; `/api/stats` cuenta doble; Dockerfile como root sin healthcheck; README desactualizado. | varios |

Tests de Eros: 43 de 48 pasan; las 5 fallas son porque el venv no tiene PyMuPDF. Un test hace una consulta DNS real. Sin cobertura: scrapers, purga, modo heurístico, envío y Radar.

## 5. Orden sugerido

1. **Hoy:** S1 (comprobar y rotar la clave), apagar «Enviar desde Eros» (R1) y cerrar S3 en el admin.
2. **Admin (este repo):** F1, F2, F3, F5, F7, rotular lo heurístico, mostrar la fuente del correo, y alinear el Eros simulado con las respuestas reales para que los tests lo cubran.
3. **Eros (otro repo):** S2, S4, R2, R3, R4, E1, F4, F6, y después E3 (que Eros tome el CV de la base) y los scrapers.

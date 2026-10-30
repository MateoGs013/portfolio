# Plan de implementación: rediseño «movimiento» en el sitio real

## Resumen

El rediseño son 23 paquetes repartidos en 8 olas. Los paquetes de una misma ola corren en paralelo, cada uno en su copia del repo y con archivos disjuntos. Las olas se ejecutan en orden. Cada paquete termina con `pnpm typecheck` y `pnpm lint` en 0 y cumple sus criterios de aceptación. Nada se despliega sin el OK de Mateo.

| Ola | Paquetes | Qué deja hecho |
|---|---|---|
| 1 | D1 · D0 | Esquema, migración, seed en español, parche de producción y fieldMeta. Reglas unificadas en `docs/diseno.md` |
| 2 | D2 · D3 · D4 · A1 | API con visibilidad, idioma, CV compuesto y snapshot generado. Inglés en la base. Capturas y videos como Media. Admin sin bugs y con los campos nuevos |
| 3 | F1 · F2 · A2 · A3 · D5 | Explorador desmontado, cañería del front, tokens y hojas globales. Traducciones en el admin. Job Hunter alimentado por la base. Snapshot final |
| 4 | F3 · F4 · F5 · F6 | Shell (cabecera, pie, paleta y atajos), primitivas de movimiento, primitivas de registro y CV desde la base |
| 5 | P1 · P2 · P3 · P4 | Inicio, Obra, Caso y Sobre mí |
| 6 | X1 · X2 · X3 · X4 | Cierre del Hiperfoco, morph de la tecla R, SEO/CSP y /lab según decisión |
| 7 | Q1 | Suite e2e nueva |
| 8 | Q2 | Piso de calidad, capturas de referencia y documentación |

## Decisiones de arquitectura tomadas (no requieren a Mateo)

- **Visibilidad:** `publishedAt` no nulo y ≤ ahora. El campo ya existe, así que no hace falta migración. null-net y lampone quedan en `null`. Se aplica en la API, en las relaciones, en los conteos, en el sitemap y en el snapshot, nunca en un componente. En el admin es el interruptor «Mostrar en el sitio».
- **Inglés:** tablas tipadas por modelo (`ProjectTranslation`, `ProcessStepTranslation`, `MediaTranslation`, `LinkTranslation`, `ExperienceTranslation`, `TechTranslation`). En los `Doc`, `en` va dentro de cada campo. El server resuelve con `present(record, lang)` y devuelve `untranslated[]`, y el front marca `lang="es"` en lo que no tiene traducción. El inglés se traduce desde el español vigente, nunca desde `i18n.ts`.
- **Idioma en la URL:** `?lang=en`. Mapea 1:1 con la API (invariante 2), el SSR lo resuelve sin parpadeo y el hreflang es recíproco.
- **Métricas:** modelo `Metric` (número, unidad, origen y fecha de medición). Las etiquetas y la descripción de «qué mide» van en el diccionario de interfaz, así que no hay nada que traducir.
- **Media:** `tint`, `poster`, `srcWebm`, `caption` y `viewport`. Sale `layer`/`LAYER`. La portada en movimiento es `COVER` + `VIDEO`.
- **Experiencia y CV:** `Experience.kind`, `highlights`, `location`, `cvOrder` y la relación explícita con `Project`. Se agrega una fila para Eros. `GET /api/cv?lang=` arma un `CvDocument` que comparten el visor público, el script de PDF y el respaldo del Job Hunter.
- **Fallbacks:** un solo `server/src/snapshot/content.json`, generado con `pnpm db:snapshot` desde las mismas consultas de la API, con un chequeo de paridad (`db:snapshot:check`). El front no tiene datos propios.
- **Rutas:** `/`, `/projects`, `/projects/:slug`, `/about` (CV en `/about?cv=ats`) y `?vista=registro`. Todo lo demás redirige con 301, conservando la query.
- **Hiperfoco:** se conserva el existente, con la tecla H y el monocromo, rehecho como capa de presentación. El estado va en una cookie que lee el SSR, sin flash. No tiene componentes propios: se borra el dossier escrito a mano. La navegación se conserva, el contraste pasa AA, el movimiento ambiental se apaga y las view transitions quedan cortas. Esc cierra capas y después sale del modo.
- **Cabecera:** la del prototipo (Obra, Sobre mí, Contacto). Las acciones de la barra inferior del plan (idioma, tema, Hiperfoco e «Ir a») pasan a la cabecera, y la ruta sigue siendo el estado sin necesidad de dibujarla.
- **Tema:** oscuro por defecto, recordado en cookie (recomendación de plan §9.3).

## Contratos compartidos entre paquetes

- **API y tipos:** los define D2 (server) y F1 los refleja en `app/lib/api.ts`.
- **Anclas DOM:** las define D0 en `docs/diseno.md`: `data-chrome`, `data-hf`, `data-ornament`, `data-vt`, `data-travel*`, `data-motion`, `data-tint`, `.f/.fk/.ft/.fv`.
- **Hooks de Nuxt:** `record:before` / `record:after` (los emite `useRecordView` y los escuchan el morph y `useMotion`) y `site:overlay` (paleta → Lenis).
- **Política de movimiento:** `useMotionPrefs` → `allowAmbient = !reduce && !hyperfocus`, `allowTransitions = !reduce`.

## De dónde sale cada dato del front

| Pieza | Fuente |
|---|---|
| Nombre en el hero y la cabecera | `about.display_name` (loader y hero); `about.name` en CV y JSON-LD |
| Titular, rol | `about.headline`, `about.role` |
| Disponibilidad, ubicación, hora, respuesta | `contact.availability`, `contact.location`, `contact.time_zone`, `contact.response_time` |
| Email, GitHub, LinkedIn, PDF del CV | `contact.email`, `contact.github`, `contact.linkedin`, `contact.cv` (+`en`) |
| Obra destacada | `/api/projects` con `featured`, en `sortOrder` |
| Tarjeta o fila | `title`, `year`, `role`, `status` (etiqueta del diccionario), `org.name`, `media` COVER (+`tint`) |
| Caso | `summary`, `brief`, `steps`, GALLERY (`caption`, `viewport`), `metrics` (Metric + diccionario), `links`, `techs` (`category`, `since`, `note`, `projects`) |
| Siguiente obra | Misma lista de `/api/projects`, siguiente en `sortOrder` (circular) |
| Sobre mí | `engineering_philosophy`, `technical_degree`, `higher_education`, `languages`, `work_modalities`, `professional_goal`, `/api/experience` |
| CV | `/api/cv?lang=` (Doc about/contact + Experience + Tech por categoría) |
| Rótulos, estados, aria y etiquetas de métricas | `app/lib/dict.ts` (solo interfaz, ES/EN) |

## Ola 1: datos núcleo

**D1 · Esquema, migración y seed en español.** Aplica todos los cambios de esquema, escribe la migración con conversión de datos (LAYER → GALLERY y metrics Json → Metric) y alinea el seed con producción en `about.role` y `headline`. Pone `publishedAt: null` a las dos obras ocultas, carga los tints, corrige las dimensiones de la portada de Ynara y agrega la portada de Eros. Suma las experiencias con `kind`, `highlights`, `cvOrder` y su relación con las obras, la fila de Eros y los docs about/contact reformados, y borra el doc home. Deja los módulos `seed/en.ts` y `seed/media.ts` vacíos para que los llenen D3 y D4. Escribe un parche idempotente con `--dry` para producción y actualiza `fieldMeta.ts`. En el admin, las colecciones editables responden 503 en lugar de servir el respaldo con ids inventados.

**D0 · Fuente única de reglas.** Crea `docs/diseno.md` (vocabulario, tokens, anclas, Hiperfoco, política de movimiento, teclas y rutas). Corrige `plan.md`: sin la «lectura enfocada (F)», Hiperfoco con H y sin barra inferior. Recorta `.claude/rules/explorer.md`, hace que `AGENTS.md` apunte a lo mismo, borra las reglas de Gemini y actualiza `CLAUDE.md`.

## Ola 2: API y contenido

**D2 · API pública.** Arma las capas `content/` (visibilidad, idioma, `present`, `matches`, CV, snapshot) y `queries/`, y reescribe las rutas. `?status=live` pasa a funcionar, `meta.filters` muestra lo aplicado y se borra el alias de slug. Stack y orgs cuentan solo lo visible. Suma `GET /api/cv`, el snapshot generado, el chequeo de paridad y la actualización de `backend.md`. Se borra `server/src/fallbackData.ts`.

**D3 · Inglés.** Llena `seed/en.ts` traduciendo desde el español vigente, sin afirmaciones nuevas, y escribe un parche que solo completa lo que falta.

**D4 · Capturas y videos.** Un script de importación copia las capturas a `public/media/projects/<slug>/` y registra cada Media con póster, WebM, pie ES/EN, orden y viewport. Reemplaza HERO, MAIN_VIDEO, ORDER, SKIP y CAPTION del prototipo.

**A1 · Admin.** Corrige los cuatro errores que pierden datos (rol de la media, orden de los pasos, tipos de las métricas, `docFields`). Suma el interruptor de visibilidad, el reordenamiento de obras, la subida de video con póster, el tinte calculado con canvas, la tarjeta de media completa, el editor de Metric, los campos de experiencia del CV y los aria-label. Al final recompila `admin.css`.

## Ola 3: desmontaje y base del front

**F1 · Desmontaje y cañería.** Borra el explorador, los Ui* que salen y los composables muertos, y mueve el lab al archivo. Arma los tipos, `useApi` con `lang`, `useLocale`, el diccionario, `format`, `useSiteContent`, el tema y el Hiperfoco en cookie, `useRecordView`, `usePageSeo` y `error.vue`. Suma el scroll con Lenis opcional, las 301, el sitemap con alternativas, `nuxt.config` (view transitions, CSP por entorno, proxy `/media/**`, redirección de los PDF duplicados) y gsap/lenis como dependencias. Deja páginas mínimas que ya leen de la API.

**F2 · Tokens y hojas globales.** Escribe los tokens de §4 con AA verificado por script, `@theme` con la escala de texto, las variantes `focus-mode` y `record`, `motion.css`, `print.css` (un solo `@page 10.5mm 12mm`) y `hyperfocus.css` contra las anclas. Saca Google Fonts.

**A2 · Traducciones en el admin.** Selector ES|EN con el español como referencia, upsert de las tablas de traducción e indicador «sin traducir».

**A3 · Job Hunter.** El CV de respaldo sale de `composeCv` con el contrato que lee el admin. Sin datos falsos, con valores escapados y sin tocar el proxy a Eros.

**D5 · Snapshot final.** Se regenera el snapshot con inglés y media, y se verifica la paridad.

## Ola 4: shell y primitivas

**F3 · Shell.** Layout, cabecera con navegación visible sin JS y utilidades, pie de contacto desde la base (mailto real + botón copiar), paleta accesible, atajos centralizados y apagables, imanes y sonido opcional.

**F4 · Movimiento.** Plugins de GSAP/Lenis y de elementos compartidos, `useMotion` con limpieza, cursor, tinte, RevealLines, ScrubWords, burbuja, MediaImage/MediaVideo (con pausa visible) y RollNumber.

**F5 · Registro.** RecordField, RecordValue y RecordTable, renderizados por el SSR según `?vista=registro`.

**F6 · CV.** CvHarvardAts solo con props `CvDocument`, barra de impresión y descarga, hoja `CvSheet` y script `cv-pdf.mjs` con la cota dual. Se borran los PDF duplicados.

## Ola 5: páginas

**P1 · Inicio:** loader de primera visita, nombre por letras, titular, lista con vista previa que sigue al cursor y frase que se enciende.
**P2 · Obra:** galería horizontal con pin, inclinación y parallax. Facetas en la URL y vista registro como tabla.
**P3 · Caso:** título y portada que viajan, captura que crece, rótulos fijos, pasos, galería y teléfonos, métricas con «Asomar», enlaces y la siguiente obra en escena.
**P4 · Sobre mí:** filosofía, datos, objetivo y trayectoria. «Ver CV» se transforma en la hoja.

## Ola 6: Focus, registro, SEO y lab

**X1 · Hiperfoco:** transformación al entrar y salir, marcas completas, Esc/H coherentes, contraste y su spec.
**X2 · Morph R:** viaje, fantasma, trazado de líneas y anclaje de scroll, con su spec.
**X3 · SEO/CSP:** JSON-LD desde la base, OG de 1200x630, hreflang, CSP final, robots y su spec.
**X4 · Lab:** según lo que decida Mateo.

## Olas 7 y 8: pruebas y piso de calidad

**Q1:** la configuración corre contra el build, con proyectos por ancho, tema, reduced motion y sin JS, y axe. Se borran las specs del explorador, `cv-audit` pasa a solo lectura con la cota dual y se suman specs de rutas, a11y, teclado, sin JS, movimiento, i18n, CLS, media y literales prohibidos.
**Q2:** piso-calidad, capturas de referencia versionadas, Lighthouse local y documentación final.

## Qué se borra

El explorador completo y el catch-all, el dossier del Hiperfoco, el blog público, 20 Ui* (más 11 archivados con el lab), los composables muertos, `explorer.ts`, `i18n.ts`, `path.ts`, los dos `fallbackData.ts` y los fallbacks de `docs.ts`, `articles.ts` y `schema.ts`. También el doc home, `metrics` Json, `Media.layer`/`LAYER`, el candidato falso del Job Hunter, los PDF duplicados, los tokens `--d-*` y el CSS de Hiperfoco con `!important`, Google Fonts, las specs obsoletas y las reglas de Gemini.

## Decisiones que necesitan a Mateo

1. La ubicación pública (por defecto, Río Negro) y si el teléfono queda fuera del CV.
2. Ynara: si lideraste el front o el back, y la fecha de fin.
3. Eros: si usa SQLite o PostgreSQL, y si Gemini y n8n se cargan como Tech.
4. Qué tecnologías del CV se cargan como Tech y desde qué año.
5. La revisión de las viñetas del CV y del inglés antes de llevarlos a producción.
6. Si /lab y el visor IDE se conservan sin enlazar o se borran.
7. Si el blog sale del sitio público.
8. Media en producción: si va en git o por el admin con un volumen persistente.
9. Si se confirma que no hay página Stack.

Cada decisión tiene un valor por defecto, así que ningún paquete queda bloqueado. Solo X4 y la parte de `.gitignore` de D4 cambian según la respuesta.

## Riesgos principales

Producción está atrás del seed: hay que hacer un backup y correr los parches con `--dry`. La deriva entre la base y el snapshot se controla con `db:snapshot:check`. View transitions con Lenis y pin se verifican en P3 y F4. La cota del CV con contenido editable se protege con límites y con el script de PDF. Entre las olas 3 y 5 el sitio queda en páginas mínimas, así que no hay que desplegar en ese tramo.
---

## Correcciones tras la crítica (30-oct-2026)

Un crítico adversarial revisó el plan contra el código y encontró problemas que lo bloqueaban. Los verifiqué en el repo: las capturas están en `.gitignore`, el seed pone `publishedAt: new Date()` a las 8 obras (`seed.ts:551`), hay métricas que son listas (`languages`, `localModels`) y `cv-audit.spec.ts` reescribe los PDF de `public/cv/`. Estas correcciones mandan sobre lo de arriba.

### Datos y producción
- **Parche de producción:** pone `publishedAt = null` explícito a null-net y lampone (en producción ya tienen fecha). Suma la ciudad de cet-30, la portada de Eros y `contact.email` con tipo `email`. Corre con `--dry` y después de un `pg_dump`.
- **Métricas en dos pasos:** `Metric` admite valor numérico o lista (`value Decimal?`, `items String[]`), así `languages` y `localModels` no se pierden. La columna `metrics Json` queda hasta que el parche verifique la conversión. Se borra en una migración posterior. `present()` convierte el `Decimal` a número.
- **Clave de métrica sin entrada en el diccionario:** se muestra con el rótulo que se cargó en el admin (`Metric.label` opcional). El admin avisa si falta.
- **Experiencia ↔ obra:** pares explícitos en el seed, nunca «por mismo org» (escuela-da-vinci no se liga a Ynara).
- **CvDocument completo:** `contact.website` para el portafolio. La entrada freelance toma su título de `Experience.role`. `languages` pasa a ser tipo lista en el Doc. `methodologies` sale de `about.core_competencies`.
- **Retrato:** `about.portrait = /media/profile/mateo-front.png`.
- **Respaldos generados, no escritos (decisión 6):** el server guarda en memoria y en disco la última respuesta buena de cada consulta. Solo si nunca hubo una, usa el `content.json` versionado (generado con `pnpm db:snapshot`). `fallbackContentData.ts` del admin también se genera. El front no tiene datos propios.
- **Inglés con cota:** las viñetas EN respetan el mismo límite que las ES (3 de 160 caracteres) para que el CV en inglés entre en una página.

### Orden y dueños de archivos
- **Capturas:** los paquetes leen las capturas desde la ruta absoluta del checkout principal (`CAPTURAS_DIR`), porque los worktrees no las tienen.
- **D4 pasa a la ola 3** (después de que A1 cambie `image.ts`), y D5 pasa a la ola 4. D4 es dueño de las filas `MediaTranslation` (pie ES y EN). D3 no toca media.
- **CSP del admin (`media-src blob:`):** es de A1. D2 no toca `server/src/app.ts`. *Integración ola 2:* D2 la agregó en `app.ts` (paquetes.json le asignaba ese archivo) y A1 no la tocó; queda `media-src 'self' blob:` en el admin.
- **A3** suma `radar.ts`, las heurísticas de `fallbackHunterData.ts` y los literales de `hunter.ts`. Puede cambiar los handlers de respaldo de `hunter.ts`, pero el proxy a Eros se comporta igual. Su aceptación incluye `scripts/test-cv-and-subject.ts` y `scripts/test-audit.ts`.
- **Pruebas antes:** F1 (ola 3) cambia `playwright.config.ts` para que corra contra el build, instala `@axe-core/playwright`, borra las specs del explorador (`routes-audit` y las demás) y deja `cv-audit` en solo lectura. Así las olas 4 a 6 pueden verificar. La aceptación de F6 sobre `/about?cv=ats` pasa a P4.
- **Diccionario repartido:** `app/lib/dict/` tiene un archivo por área (`cv.ts`, `case.ts`, `shell.ts`…), cada uno con su dueño. F1 arma el índice.
- **`useProjects`:** la clave de caché incluye los filtros. La «siguiente obra» sale siempre de la lista completa.
- **AppIcon:** es de F3 y conserva `download` y `printer`, que usa F6.
- **X4 se funde en X3** (los dos tocaban `canonical.global.ts` y `nuxt.config.ts`). **X2 va después de X1**, en su propia ola: los dos tocaban los mismos componentes y `useHotkeys.ts`.
- **Tokens:** F2 es dueño de `tokens.css` y `hyperfocus.css`. F1 solo pone los atributos que define `docs/diseno.md`.
- **D0** también actualiza la skill `piso-calidad` (`.claude/skills` y `.agents/skills`) y las skills de `.agents/` que describen el explorador.

### Hiperfoco
- X1 empieza con un inventario de lo que hace hoy: colecciones como tabla, CV en Harvard, dossier en la home, Esc antes de subir de nivel. Cada comportamiento se conserva, se mejora o se descarta con motivo escrito. No se reescribe de cero.
- El contenido del dossier sale de la base. `?foco=1` funciona como entrada compartible (la ruta es el estado).

### Seguridad y SEO
- **CSP sin hash** para scripts: un hash anula `'unsafe-inline'` y bloquearía el `window.__NUXT__` de Nuxt. Se verifica contra `pnpm build && pnpm start`.
- **`runtimeConfig.public.siteUrl`** es de F1. Canonical, hreflang, `og:url` y el sitemap lo leen de ahí. El grep de literales prohibidos cubre también `nuxt.config.ts`.

### Olas corregidas
| Ola | Paquetes |
|---|---|
| 1 | D1 · D0 |
| 2 | D2 · D3 · A1 |
| 3 | F1 · F2 · A2 · A3 · D4 |
| 4 | F3 · F4 · F5 · F6 · D5 |
| 5 | P1 · P2 · P3 · P4 |
| 6 | X1 · X3 (con lo de X4) |
| 7 | X2 |
| 8 | Q1 |
| 9 | Q2 |

### Respuestas de Mateo (30-oct-2026)
- **/lab y visor «Modern IDE»:** se archivan los dos en `docs/archive/lab/`. `/lab` redirige a la home y el CV de `/about` queda solo en Harvard ATS.
- **Blog:** se conserva. Paquete nuevo **P5 · Artículos** (ola 5): `/articles` y `/articles/:slug` con el estilo nuevo, enlazados desde el pie (F3 deja el enlace). D1 suma `ArticleTranslation` (title, summary, content) y D3 traduce el artículo existente. Los artículos entran en el sitemap, el hreflang y el snapshot.
- **Media:** las capturas y videos se versionan en git, en `public/media/projects/<slug>/`. Lo que se suba después por el admin necesita un volumen de Coolify en `/app/public/media`.
- **Contenido:** valores por defecto. Ubicación Río Negro, Argentina, y sin teléfono en el CV. Ynara y Eros quedan como dice la base. El CV muestra solo las tecnologías cargadas como Tech.
- **Página Stack:** no hay, como en el prototipo aprobado. Las tecnologías del caso filtran `/projects?stack=`.
- **Viñetas del CV e inglés:** quedan en la base sin las afirmaciones que no tienen respaldo. Mateo las revisa en el admin antes de llevarlas a producción.

### Integración de la ola 1 (30-oct-2026)
Lo que quedó fijado al mergear D0 y D1 en `rediseno/movimiento`. Manda sobre lo anterior.

- **ArticleTranslation** usa `title`, `summary` y `content`, los nombres de `Article` (no `excerpt`/`body`), así `present()` resuelve por el mismo nombre.
- **Archivos nuevos de D1:** el seed está partido en `server/src/seed/` (`types`, `stack`, `projects`, `projects-hidden`, `experience`, `docs`, `articles`, `metrics`, `files`, `apply`, `en`, `media`) y el parche en `server/src/patches/rediseno/`. Dueños: D3 escribe `seed/en.ts`, D4 `seed/media.ts`; D2 usa `seed/docs.ts` como respaldo de `/api/docs/:key` hasta el snapshot. El resto es de D1 (registrado en `paquetes.json`).
- **Migración 20261101:** la conversión Json → `Metric` no aborta: un texto conocido (`lcp`, `freeTierQuota`, `operatingCost`, `ephemeralTTL`) que no queda como número limpio va a `items` tal cual. Una coma decimal (`0,8s`) se leería como 8: producción no tiene ninguna, verificarlo en el `--dry`.
- **Orden en producción** (solo con el OK de Mateo): `pg_dump` → `prisma migrate deploy` → `2026-10-30-eros-barberpole.ts` → `2026-11-01-rediseno-datos.ts --dry` → aplicar → `--dry` otra vez. El parche 10-30 ahora también alinea `legacyMetrics` de Eros, así el 11-01 no revive métricas viejas desde el Json.
- **Admin:** `docFields` acepta `value` y `en` como texto o lista (type `list`), valida `url` y `email` y conserva `en`. Las filas `Metric` se muestran como clave → valor solo para leer hasta A1.
- **Sitio actual:** `metricMap()` (`app/lib/explorer.ts`) lee las métricas como filas `Metric` o como el Json viejo, así el explorador y el dossier no muestran basura hasta que F1/X1 los reemplacen. `/lab` y sus alias redirigen a `/` con 301 desde `routeRules` de Nuxt.
- **`docs/diseno.md`:** impresión sin ocultar `[data-hf="measure"]`; nombres únicos de view transition (todo `[data-vt]` saliente a `none` antes de nombrar el par); `--sig-text` claro `#b82d00`; `--ok`/`--wip` solo como punto; Lenis `lerp .1`; contador y barra del cargador; conteo al entrar en pantalla es ambiental; `?foco=1` se saca de la URL al hidratar; `data-intro` no se pone con Hiperfoco.

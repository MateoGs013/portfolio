# Fases

Orden de trabajo y criterios de terminado. Marcar con `[x]` a medida que se cierran.

---

## Fase 0 — Schema ✅ cerrada el 5-sep-2026

- [x] Definir las colecciones reales — `prisma/schema.prisma`
- [x] Definir campos y tipos de cada una
- [x] Decidir a qué mundo pertenece cada campo — `app/lib/fieldMeta.ts`
- [x] Aprobar y migrar — migración `20260905174945_init`

**Terminado cuando:** `schema.prisma` está aprobado y migrado, y cada campo tiene asignado su mundo.

Criterio para las colecciones: **cada una debería ser la respuesta a una pregunta concreta que trae quien entra.**

---

## Fase 1 — Backend ✅ cerrada el 5-sep-2026

- [x] Modelos Prisma y migración
- [x] Los seis endpoints — `server/src/routes/`
- [x] Filtros como query params, con el mapeo uno a uno a la URL pública — `meta.filters` devuelve lo aplicado
- [x] Admin — propio, en `/admin` servido por el API, protegido con `ADMIN_TOKEN`
- [x] Seed con contenido real, no lorem — `server/src/seed.ts`, cronología tomada de GitHub. Falta afinar desde el admin: `Tech.since`, `Tech.note`, `metrics`

**Terminado cuando:** se puede cargar un proyecto de punta a punta desde el admin y verlo en los seis endpoints. ✅ Verificado el 5-sep-2026: proyecto con org, techs, media subida y pasos creado por el admin y leído en `/api/projects/:slug`.

---

## Fase 2 — Shell ✅ cerrada el 5-sep-2026

- [x] Routing `/datos/*` y `/diseno/*` — `app/pages/{datos,diseno}/[[...path]].vue`, un renderer por mundo en `app/worlds/`
- [x] Estado compartido: `path = [collection, slug, sub]` — `app/lib/path.ts`, leído siempre de la ruta (`useMundo`)
- [x] Truncado al cambiar de mundo — tabla `depth` por mundo y raíz; la query viaja intacta
- [x] Tokens de los dos mundos — `app/worlds/<mundo>/tokens.css`, prefijos `--d-` y `--n-`
- [x] Carga de fuentes con preload — `usePreloadFonts`, una lista por superficie
- [x] Umbral, salteable con link directo — `/` (y `/umbral`, que no redirige)
- [x] Persistencia del mundo elegido — cookie `mundo`, un año; `/` redirige en el servidor
- [x] Control de pasaje, sin animar todavía — `PasajeControl.vue`, dos links

**Terminado cuando:** se cambia de mundo conservando la posición, y un link directo saltea el umbral. ✅ Verificado el 5-sep-2026 con un recorrido en Chrome headless: `/datos/projects/la-rucula/techs?stack=vue` → `/diseno/projects/la-rucula?stack=vue` → `/datos/projects/la-rucula?stack=vue`, sin recarga.

Lo que dejó para la Fase 3: DATOS ya resuelve todos los niveles en una sola columna (`app/worlds/datos/levels.ts`), que es la forma mobile; faltan las columnas en perspectiva, el teclado y las facetas. `orgs` no tiene endpoint: `/datos/orgs/:slug` da 404 hasta que lo tenga.

---

## Fase 3 — DATOS completo ✅ cerrada el 5-sep-2026 (revisada el 6-sep)

- [x] Ventana de explorador de archivos — `app/worlds/datos/DatosWorld.vue`: barra con historial, subir, ruta como barra de dirección e "ir a"; contenido; barra de estado con el request real
- [x] Endpoint de `orgs` por relación — `GET /api/orgs/:slug` con proyectos y experiencias
- [x] Carpeta en vista de íconos — `DatosFolder.vue` + `DatosIcono.vue`: la base (carpeta por tabla, archivo por documento) y cada colección (un archivo por record con el dato dominante adentro)
- [x] Archivo abierto — `DatosDetail.vue`: campos con tipos, relaciones a la vista, vecinos anterior y siguiente
- [x] Cabecera única para los tres niveles — `DatosCabecera.vue`: ícono, nombre, línea de tipo, filtros activos o vecinos
- [x] Profundidad: docs y records son archivo; no hay sub-nivel (`depth` de DATOS es 2)
- [x] Teclado de carpeta — flechas en cuatro direcciones, Enter abre, Backspace/Esc suben con el foco en la baldosa de origen, `/` o Ctrl+K ir a; mover el foco no navega
- [x] Command palette — `DatosGoto.vue`: índice de schema, proyectos, experiencia y stack
- [x] Filtros como facetas — tocar un valor filtrable en el archivo agrega `?campo=valor`; chips con `×` en la cabecera de la carpeta
- [x] SSR — todo se resuelve en el servidor; el 404 sale con status 404
- [x] Mobile — la misma ventana con marco angosto, baldosas chicas, tres por fila

**Terminado cuando:** todo el contenido es alcanzable sin mouse y con JS apagado. ✅ Verificado el 5-sep-2026 (29 chequeos en Chrome headless) y de nuevo el 6-sep tras la revisión: recorrido completo por teclado y por clicks vía CDP sin errores de consola, diez rutas en SSR, capturas a 1440, 1024, 768 y 390px.

**Cómo llegó hasta acá.** La Fase 2 copiaba los prototipos y se rehízo como "hoja técnica" con columnas en perspectiva. El 5-sep, con capturas, se vio que la navegación directa se había perdido y la colección pasó a tabla. La misma noche Mateo pidió algo más mínimo y "como un explorador de archivos": salieron las columnas, después la tabla, después la lista, y quedó una ventana con carpetas en grilla de íconos, una sola cosa por pantalla. El 6-sep se unificó la cabecera de los tres niveles y los márgenes. Cada paso, con lo descartado y el porqué, está en `docs/decisiones.md`.

**Auditoría del 5-sep-2026** (`/piso-calidad`, `/revision-mundos`, guidelines de interfaz web, build de producción): CLS 0 · LCP 192 ms · JS 241 KB transferidos · CSS 24 KB · sin JS todo navegable por links · primer Tab cae en "saltar al contenido" · el foco sigue a la navegación por teclado · 320px sin desborde · reduced motion corta las animaciones. Las cifras son de antes de la revisión: volver a medir en la Fase 7 con datos reales de producción y exponerlas como contenido.

**El sitio puede salir acá.** DISEÑO es la parte cara y va segunda. Falta la Fase 7 antes de publicar.

---

## Fase 4 — DISEÑO: proyectos ✅ cerrada el 6-sep-2026

- [x] Tira de película como índice y como pie del visor — `app/worlds/diseno/sections/ProyectosTira.vue`: un fotograma retroiluminado por proyecto; sin portada, una placa oscura con la inicial
- [x] La obra se pinta mientras se cuenta — `SeccionProyectos.vue`: línea de tiempo GSAP con una parada por pedido, etapa y resultado; la portada pasa de apagada a pintada, el título entra fino y blando y toma cuerpo con la obra, cada bloque de texto se enciende cuando le toca
- [x] Construcción por capas desde `Media.layer` — cada capa aparece en su turno sobre la anterior. Implementado sin datos: ningún proyecto trae capas todavía; probar en cuanto uno las tenga
- [x] Scrubber — un `range` nativo con las paradas debajo; arrastrar pausa, tocar una parada salta
- [x] FLIP de fotograma a obra — el fotograma tocado vuela hasta convertirse en la placa, sin plugin
- [x] Degradación — sin portada, sin etapas, sin brief o sin resultado, la sección cuenta lo que hay; sin JS todo está en el estado final y el scrubber no aparece; `prefers-reduced-motion` arranca en el final y el scrubber sigue en manos del visitante
- [x] La portada viaja en la lista — `GET /api/projects` incluye la media `COVER` de cada proyecto

**Terminado cuando:** un proyecto sin capas, sin portada o sin etapas se muestra sin romperse, y todo se entiende con la animación apagada. ✅ Verificado el 6-sep por CDP: índice, vuelo, línea de tiempo completa, scrubber, salto por parada, cambio de proyecto desde la tira (con y sin portada), reduced motion; cero errores de consola; capturas a 1440 y 390.

**Dirección:** ver `docs/decisiones.md` → "Fase 4". Tres formas pesadas, elegida la tira de película con pintado por etapas. Lo que dejó para la Fase 5: el scrubber como instrumento a reusar en `experience`, la película retroiluminada como material, los ejes de Fraunces como variable.

---

## Fase 5 — DISEÑO: el resto ✅ cerrada el 6-sep-2026

- [x] `experience` — exposición larga (6-sep-2026): bandas sobre el eje de los años, el scrubber mueve una fecha y enciende lo que corría entonces; abrir una etapa la deja encendida con su relato. `sections/SeccionExperiencia.vue`; el scrubber compartido pasa a `DisenoRango.vue`. Verificado por CDP: viaje, scrub, abrir y volver, reduced motion, móvil; sin errores de consola
- [x] `stack` — la caja por año (6-sep-2026): los nombres en Fraunces tan grandes como años llevan; el scrubber mueve un año y enciende lo que ya había entrado. `sections/SeccionStack.vue`. Verificado por CDP: viaje, scrub por año, abrir y volver, reduced motion, móvil; sin errores
- [x] `about` — specimen de blando a firme (6-sep-2026): nombre, rol y prosa leen los mismos cuatro ejes de Fraunces y el scrubber los recorre; con ancho, el nombre y el scrubber fijos a la izquierda. `sections/SeccionAbout.vue`
- [x] `contact` — los créditos (6-sep-2026): las líneas suben una por vez y quedan quietas; sin scrubber. `sections/SeccionContact.vue`

**Fase cerrada el 6-sep-2026.** Las cinco secciones tienen forma propia y `DisenoWorld.vue` ya no dibuja contenido: decide qué sección responde a la ruta. Tres propuestas por sección, con lo descartado, en `docs/decisiones.md`. Verificado por CDP sección por sección (viajes, scrub, abrir y volver, 404 de sub-ruta en documentos, reduced motion, móvil) sin errores de consola.

---

## Fase 6 — Metamorfosis In-Situ (Transformers sin telón)
- [x] Mapeo 1:1 de identificadores de filas (`data-row`) y anclas (`data-anchor`) entre DATOS y DISEÑO
- [x] Descarte de cortinas, telones u overlays que tapen la pantalla
- [x] Desacople mecánico de elementos en perspectiva 3D a la vista del usuario
- [x] Transmutación física de filas de base de datos en tarjetas volumétricas chamfered y viceversa
- [x] Transición del fondo y chasis de la ventana (`--d-paper` ↔ `--n-bg`) sin romper los 1320px
- [x] Ancla FLIP con encaje magnético en el nombre del registro
- [x] Degradación instantánea con `prefers-reduced-motion`

**Terminado cuando:** al pulsar el selector de mundo, los elementos visibles del sitio se transforman mecánicamente in-situ sin telones ni pantallas de cobertura intermedias.

---

## Fase 7 — Piso de calidad ✅ reemplazada por R7 (31-oct-2026)

La fase quedó pendiente con el explorador y se cerró como **R7** del rediseño «movimiento» (abajo), sobre el sitio nuevo. DATOS ya no existe: las cifras de Lighthouse quedan anotadas en R7 y publicarlas como métrica del sitio necesita una medición en producción, que solo corre Mateo.

- [x] Sin JS
- [x] Solo teclado
- [x] Lector de pantalla
- [x] Reduced motion
- [x] CLS en cero
- [x] Responsive hasta 320px
- [x] Degradación de contenido

---

## Fase 8 — Unificación con Modo Focus y Despliegue en Coolify ✅ cerrada (Sep/Oct 2026)

- [x] Descarte oficial de "Dos Mundos" y remoción de `app/worlds/diseno`.
- [x] Consolidación en un explorador técnico relacional sobre PostgreSQL 17.
- [x] Implementación de **Modo Focus / Hiperfoco** (`useHyperfocus.ts`) para lectura directa sin ruido de interfaz.
- [x] Integración de **CV Harvard ATS** e IDE en `/about` (`DatosCV.vue`) con exportación de 1 página A4.
- [x] Rediseño de la consola de administración (`/admin`) a estándares 2026 (sin emojis, layout desktop elástico, editor visual de métricas).
- [x] Job Hunter AI con evaluación de vacantes (Gemini), redacción de pitch y generador de CV Harvard ATS adaptado.
- [x] Infraestructura en producción consolidada en **Hostinger VPS mediante Coolify** (PostgreSQL 17, Dockerfiles multi-stage y Traefik SSL).

---

## Rediseño «movimiento» (R0–R7) ✅ cerrado el 31-oct-2026

Plan en `docs/rediseno/plan.md` y `docs/rediseno/implementacion.md`, paquetes en `docs/rediseno/paquetes.json`, nueve olas integradas en la rama `rediseno/movimiento`. Todo se verificó en local; producción espera el OK de Mateo y el orden de parches de `implementacion.md`.

- [x] **R0 · Fuente única** — `docs/diseno.md` (D0): reglas, tokens, anclas del DOM, Hiperfoco, política de movimiento, teclas y rutas. `AGENTS.md` y las skills apuntan ahí.
- [x] **R1 · Datos** — D1 a D5: `Metric` tipada, tablas `*Translation` (ES y EN desde la base), visibilidad por `publishedAt` (seis obras), capturas y videos versionados, API pública con envoltura `{ data, meta }`, `/api/cv` y respaldos generados (`pnpm db:snapshot`, `db:snapshot:check`). Cero contenido escrito a mano en `app/` (`tests/e2e/data.spec.ts`).
- [x] **R2 · Tokens** — F2: `@theme` con los tokens de `diseno.md`, un corte de 768 px, contraste AA en los dos temas y en Hiperfoco (`scripts/check-contrast.mjs`).
- [x] **R3 · Shell** — F3 y F4: cabecera, pie, paleta «Ir a», teclas, sonido apagado por defecto, Lenis, GSAP y view transitions con elementos compartidos.
- [x] **R4 · Modo registro** — F5 y X2: `RecordField`/`RecordValue`/`RecordTable`, `?vista=registro` desde el SSR y el morph de `R`.
- [x] **R5 · Páginas** — P1 a P5: inicio con cargador y vista previa, obra con galería horizontal, caso con captura que crece y Asomar, sobre mí con trayectoria y CV Harvard ATS, artículos. X1 (Hiperfoco) y X3 (SEO, CSP, OG).
- [x] **R6 · Lab** — `/lab` y el visor IDE archivados en `docs/archive/lab/`; sus rutas redirigen con 301.
- [x] **R7 · Piso de calidad** — Q1 (suite e2e por ancho, tema, reduced motion y sin JS) y Q2 (abajo).

### R7 · Auditoría del 31-oct-2026

`/piso-calidad` sobre `/`, `/projects`, `/projects/la-rucula`, `/about`, `/about?cv=ats` y los artículos, en 320, 375, 768, 1440 y 2560 px, en los dos temas, contra el build local:

- Sin scroll horizontal, un solo `h1`, una sola región `aria-live`, el email en una línea y sin errores de consola en ninguna combinación.
- Con la base caída (API apuntando a una base que no existe), la API responde desde el snapshot (`meta.source: 'snapshot'`) y las seis páginas salen 200 desde el SSR.
- **Bloqueantes corregidos:**
  - Áreas táctiles: los controles medían 18–24 px de alto en táctil. La utilidad `hit` y la variante `coarse:` (`app/assets/css/base.css`) los llevan a 44 × 44 px sin mover el layout de escritorio (cabecera, utilidades, idioma, tema, Hiperfoco, pie, facetas, caso, Asomar, trayectoria, CV, artículos, error).
  - Contraste de las palabras que se encienden: nacían en opacidad .16 (1,5:1). El piso pasa a .5 (`ScrubWords.vue`): 4,7:1 en oscuro y 3,4:1 en claro, sobre el 3:1 del texto grande.
  - Paleta con reduced motion: el cierre es inmediato y su evento `close` llegaba después de que `/` la volviera a abrir, y la cerraba (la suite lo marcó en `keyboard.spec.ts`). Un `close` viejo con el diálogo ya abierto se ignora (`SitePalette.vue`).
  - CLS de la primera visita: el contador del cargador, alineado a la derecha en una caja de `3ch`, se corría al llegar General Sans (0,000007). Ahora es una caja fija de 2 em con el número desde su borde izquierdo (`IntroLoader.vue`).
- Capturas de referencia versionadas: `tests/e2e/visual.spec.ts`, 5 vistas × 3 anchos × 2 temas (30 capturas en `tests/e2e/visual.spec.ts-snapshots/`), quietas (reduced motion, animaciones CSS apagadas, reloj de la página fijo). Pasan dos veces seguidas.
- `server/admin/admin.css` recompilado con `source(none)`: el Tailwind del admin ya no lee `app/` ni otras copias del repo.

**Lighthouse 13.6 local** (build de producción con `pnpm start`, Chrome 156, sin datos de campo):

| Página | Perfil | Performance | Accesibilidad | Buenas prácticas | SEO | CLS | LCP |
|---|---|---|---|---|---|---|---|
| `/` | móvil (por defecto) | 97 | 100 | 100 | 100 | 0 | 1,4 s |
| `/` | escritorio | 100 | 100 | 100 | 100 | 0 | 0,3 s |
| `/projects/la-rucula` | móvil (por defecto) | 55 | 100 | 100 | 100 | 0 | 6,4 s |
| `/projects/la-rucula` | escritorio | 95 | 100 | 100 | 100 | 0 | 1,3 s |

El caso en móvil simulado (CPU ×4) es lo único flojo: 3,9 s de estilo y layout en el hilo principal durante la hidratación (escenas de GSAP, SplitText y ScrollTrigger) retrasan el pintado de la portada. Queda como trabajo siguiente; no afecta CLS ni accesibilidad.

### Verificación final del rediseño (31-oct-2026)

Tres verificadores independientes (corrección, datos escritos a mano, UX contra el prototipo). Lo corregido está en el commit `fix(rediseno): verificación final`. Queda pendiente, con motivo:

- **Capturas que faltan o no aguantan el tamaño:** Ynara Web no tiene portada ni galería (la tarjeta y el caso muestran la placa con el título, que es provisoria hasta capturarla) e Ynara no tiene galería. `la-rucula/atardeceres.webp` es casi todo fondo y la paleta de Eros es chica en su marco: hay que volver a capturarlas con `capturar.mjs`.
- **Videos:** `la-rucula/intro.{mp4,webm}` arranca con cuadros en blanco y el video de las tarjetas no coincide con la captura en el primer cuadro. Se resuelve recodificando (sin la entrada en blanco y con el mismo encuadre que la captura), no en código. En táctil, el video de una tarjeta se detiene a los 5 s a propósito: está dentro de un enlace, no puede tener botón de pausa y WCAG 2.2.2 pide ese tope.
- **Campos cargados que el diseño no muestra:** `Experience.story`, `contact.preferred_contact` y el pie del video de portada de Eros. El registro (`R`) de Sobre mí ya lista todos los campos del documento about; falta decidir si la trayectoria muestra `story` y dónde va `preferred_contact`.
- **Duplicación a decidir:** `Project.url` y `Project.repo` repiten las URL de los Link «sitio en vivo» y «código fuente», y los 382 commits de Ynara siguen en textos narrativos (outcome y la experiencia) además de su Metric (del rol ya salieron). Cambiar cualquiera de las dos cosas es una decisión de esquema o de redacción.
- **Article.coverImage:** la API no manda sus medidas, así que todavía no puede ser og:image; el canonical propio (`canonicalUrl`) ya se usa.

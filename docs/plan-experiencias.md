# Plan de obra — Las cuatro físicas (§4c)

Dirección del 22-jul-2026. Origen: 4 conceptos en paralelo + 8 críticas
adversarias verificadas contra el código real + juez de familia. Este doc es
el detalle VINCULANTE de DESIGN.md §4c: cada corrección listada acá salió de
una crítica que encontró el bug en el repo, no en abstracto. Se implementa
en el orden de §4c; cada fase cierra con `npm run build && npm run qa`
(16 combinaciones) + screenshots claro/oscuro revisados + commit propio.

> **⏸ ACTUALIZACIÓN 23-jul-2026 — el runtime pasó a RUTAS.** La Fase 0 de abajo
> asumía un cambio de edición EN CALIENTE (`ms:edicion`, `portal.ts`, cortina
> `#wipe`, `mount/unmount` bajo la cortina). Eso se **retiró**: cada edición es
> ahora una RUTA (`/`, `/terminal`, `/plano`, `/fanzine`) y el remonte lo hace
> el ciclo natural de navegación (`astro:before-swap` / `astro:page-load`).
> Sigue vigente la parametrización de órganos (halftone `PARAMS`/renderer,
> registro `DESREGISTRO`, `setCubierto`, `--topbar-h`, `lenis.on('scroll',…)`).
> Las físicas por edición (Fases 1-4) siguen siendo el plan, pero montan POR
> RUTA (gate `data-tema`), no bajo cortina. Prioridad: terminar **Afiche**
> impecable antes de tocar otra. Ver el banner CONGELADO de DESIGN.md.

---

## Fase 0 — Runtime compartido (bloquea todo, ~2 días)

El hallazgo unánime de las 8 críticas: los cuatro planes dependían de un
lifecycle de cambio de edición en caliente que NO existe — `applyTema`
(tema.ts) solo setea `data-tema` y los módulos solo se inician en
`astro:page-load`. Cambiar de edición sin navegar dejaría triggers de la
edición saliente vivos y la entrante sin motion.

1. **Evento `ms:edicion`**: `applyTema` emite
   `CustomEvent('ms:edicion', { detail: { saliente, entrante } })`.
   Secuencia canónica, toda detrás de la cortina del wipe:
   `unmount(saliente)` → `applyTema` → `ScrollTrigger.refresh()` →
   `mount(entrante)` → `pageReveal`. Documentar el contrato en CLAUDE.md.
2. **Registro de ediciones**: cada edición expone `mount()`/`unmount()`
   idempotentes; sus ScrollTriggers llevan id prefijado (`afiche-*`,
   `terminal-*`…) para kill selectivo — nunca `getAll().kill()` en el
   switch (se llevaría el drift y el parallax del masthead).
3. **halftone.ts paramétrico**: `PARAMS[edicion] = { angulos, celda,
   umbral, pasos, }` con default = comportamiento actual. OJO: los ángulos
   se hornean en `construirPlanchas()` — el observer hoy solo recolorea;
   hay que reconstruir planchas cuando los ángulos/umbral cambian (en
   viewport primero, resto en `requestIdleCallback`, bajo la cortina).
   Bug geométrico a evitar: una grilla cuadrada rotada 90° coincide
   consigo misma (0°/90° = cero roseta, sobreimpresión exacta) — los pares
   de ángulos por edición se eligen mirando la trama real.
4. **registro.ts paramétrico**: `DESREGISTRO[edicion]` (ejes, cantidad de
   fantasmas, drift) consumido por `pageReveal` Y por el paso 1 del wipe
   de tema.ts (hoy hardcodea el desregistro horizontal). Las tintas
   `--reg-c1/--reg-c2` NO se tocan (§4c.3).
5. **tipos.ts**: API `setCubierto(bool)` — pausar el loop del canvas
   cuando su hoja quede cubierta (Afiche) sin IntersectionObserver (no
   detecta oclusión; se dispara desde los triggers de la pared).
6. **Infra menor**: token `--topbar-h` medido; `lenis.on('scroll',
   ScrollTrigger.update)` en lenis.ts (sin eso el pin de Plano jittea un
   frame); revisar `html { scroll-behavior: smooth }` en base.css (rompe
   cualquier scroll programático/snap bajo Lenis → `auto` cuando Lenis
   controla); ids `pieza-{slug}` en los `<article>` de Tirada.astro.
7. **QA extendido**: qa/review.mjs suma screenshots en 3 posiciones de
   scroll por combinación + el flujo de cambio de edición en caliente a
   mitad de página (ambas direcciones) + una corrida con
   `prefers-reduced-motion` emulado. Actualizar el comentario stale
   ("3 ediciones") — el harness ya cubre las 16 combinaciones.

---

## Fase 1 — AFICHE: la pared empapelada (~3 días)

**Qué es.** Cada escena es un afiche que se pega encima del anterior;
sticky stacking nativo (scroll 1:1, cero pin). Momentos firma: la pegatina
(hoja entra rotada -0.7° con filo rasgado y sombra, el scrub la aplana, a
cobertura total UN golpe: la escobilla del pegador la alisa — snap `prensa`
180ms + flash de misregistración), el takeover "LA TIRADA" en reserva de
papel (letras = papel sin imprimir, el rodillo entinta el fondo de accent,
único full-bleed), y la pila de ejemplares del clicker (cada click estampa
una hoja real numerada que cae, pool de 6 nodos).

**Correcciones vinculantes (de las críticas):**

- **Contención del sticky (bloqueante)**: sticky se contiene en su ancestro
  de bloque. Partir Hero.astro en dos hojas HERMANAS dentro de un
  contenedor `.pared` hijo directo de `<main>`; el colofón queda fuera de
  main → "la pared termina" gratis. Sin esto hay UNA pegatina, no tres.
- **Filos reales**: offsets sticky acumulativos
  (`top: calc(var(--topbar-h) + N*8px)`) para que cada afiche viejo deje
  una lonja real asomando — la idea madre literal, y lo único que separa
  esto del patrón clonado "stacked cards". La franja del colofón muestra
  exactamente 4 estratos (los reales), no 5-6 decorativos.
- **Topbar**: las hojas nunca la tapan (`--topbar-h`, §4c.5). Blindaje
  mobile: `top: min(0px, calc(100svh - 100%))` para hojas más altas que el
  viewport (portada apilada en <860px se clavaría arriba).
- **Triggers sobre wrappers estáticos, jamás sobre el elemento sticky**
  (ScrollTrigger calcula con getBoundingClientRect y el sticky miente).
- **Golpe**: clase propia `.registro-hoja` (no reutilizar `.registro` — su
  drift global filtraría a la coreografía). Gatear por velocity de Lenis:
  un flick o el ancla `#tirada` que cruza 2-3 triggers seguidos NO dispara
  golpes en cascada. El scrub es dueño exclusivo de rotación/sombra y
  termina ANTES de cobertura; el golpe one-shot solo hace y+flash.
- **Takeover = el h2 real de la tirada** (elimina el titular duplicado y
  descuenta el viewport extra). Estado inicial nunca en blanco: la tinta
  ya arranca ~15% subida desde el primer paint.
- **Filos rasgados: 3 paths SVG únicos, no un tile repetido** — ahí se
  decide si es pared o Canva.
- **Cobertura total** → `visibility: hidden` + `inert` en la hoja tapada
  (foco de teclado invisible + repaint de 2 capas 100svh resueltos de un
  saque), reversible en onLeaveBack; `setCubierto(true)` al canvas.
- **Dato del colofón**: "tirada total del taller: NNNN" (ms-tirada es
  acumulativo — no mentir "de esta sesión", §4b.7).
- **Intro**: no duplicar — el registro converge como siempre; el golpe de
  apertura se define en em contra el mecanismo real de registro.ts, y sus
  offsets "brutos" de Afiche se documentan en §6.

**No hace:** pin, drag de despegue, pegatina por pieza, parallax multicapa,
rotaciones permanentes, golpe inverso al subir.

---

## Fase 2 — TERMINAL: man sonzogni (~3 días)

**Qué es.** UNA diégesis: el manual (troff — tipografía, no una tele CRT).
Un solo comando tipeado en toda la home (`man sonzogni`, solo primera
visita de sesión); secciones con encabezados de man (NOMBRE / TIRADA /
IMPRENTA / COLOFÓN, visibles sin JS); todo reveal es ráfaga de líneas
enteras (`.set()` a ritmo de buffer, patrones irregulares, cero fade); un
caret de bloque único que salta. Scrollback: lo impreso queda impreso.
Takeover: modo pager en la tirada — standout SGR 7 DISEÑADO por tema
(claro: fondo --ink; oscuro: profundizar, jamás invertir a campo claro),
redraw en 6 bandas como cover-swap POR ENCIMA, barra `less` con datos
reales (pieza N/4, % cuantizado de a 5%) que absorbe el marco vivo.
`(END)` + prompt final `$ ▮` viven en el colofón, donde el buffer termina
de verdad.

**Correcciones vinculantes:**

- **Podar `$ open` por pieza** (falla el test de remoción §4b.3 — es el
  eyebrow disfrazado); cada pieza ya trae su dato real de proyectos.ts.
- **Ratchet del halftone**: `q = max(qAnterior, floor(p*8)/8)` + snap a 1
  en onLeave (sin esto la captura se des-imprime al subir, contradiciendo
  el scrollback; y floor solo nunca llega a 1 → foto a medio revelar).
  Early-return si el paso cuantizado no cambió.
- **Inversión del pager a nivel :root** (tokens `.pager` en tokens.css,
  AA verificado en los 4 estados) — nunca overlay fixed + inversión
  scoped: el borde deja texto tinta-sobre-tinta. Quitar `.pager` de
  documentElement en `astro:before-swap` (persiste entre navegaciones).
- **SplitText**: solo tras `document.fonts.ready`, `autoSplit` para
  resize, flag `data-impreso` por bloque (el re-split no re-oculta lo ya
  impreso), aria del split nuevo (3.13+), sin `text-wrap: balance` en
  titulares terminal. Split de elementos `.only-terminal` recién al
  montar (display:none no se puede medir).
- **pageReveal bifurcado**: en terminal los wipes interpolados de
  [data-reveal] se reemplazan por set instantáneo + ráfaga propia ("la
  terminal no interpola").
- **Anclas del ls**: saltos programáticos setean estado final en los
  triggers intermedios (nada de tormenta de pops); `anchors: true` en
  Lenis. Un flick largo muestra secciones a medio imprimir → presupuesto
  duro 600ms por bloque y estado final al superarse.
- **Barra sticky**: alto SIEMPRE reservado (visibility, no display) +
  `env(safe-area-inset-bottom)`; textContent solo cuando cambia el cuanto.
- **`.pulso` cede**: un solo blink idle por edición (§4c.4) — en terminal
  el caret es el blink; el pulso queda sólido.
- **Tipeo**: span mono pre-dimensionado en `ch` (CLS 0), `gsap.delayedCall`
  (no setInterval — tab throttling y cleanup), clave de sesión propia que
  cubra también el primer switch a terminal en la sesión.
- Los "dos rojos" no existen: UN `--accent` por tema; el registro del hero
  queda cian/magenta (§4c.3).

**No hace:** tipear párrafos, CRT (scanlines/glow/curvatura), datos falsos
(exit codes, uptime), pin, sonido, des-imprimir al subir.

---

## Fase 3 — PLANO: la lámina delineada (~3-4 días)

**Qué es.** Todo se traza en orden de dibujante: ejes → marcos → cotas →
tinta (SVG dasharray, ease `tinta`); el título se revela con un wipe cuyo
borde es una regla T VISIBLE deslizándose (causalidad: el borde del reveal
ES el instrumento). La única cota mide el ancho real del título en px del
viewport (re-medida en resize; al corregirse, la cifra vieja se tacha un
instante — corrección de plano real). Takeover: el ÚNICO pin del sitio —
la tirada como lámina horizontal CONTINUA (papel y grid sin costuras, no 4
slides con marquito), polilínea que conecta los marcos (llega a la esquina
del detalle N+1 cuando estás en el N — reparte el trazo, pasa el test de
remoción; una recta paralela abstracta no). Rótulo vivo inferior con datos
reales (lámina, detalle N/4, revisión % = scroll) que absorbe el marco
vivo y al llegar al colofón (cajetín de firmas) recibe la RÚBRICA trazada
"conforme a obra" — Plano firma, el sello de goma es de Fanzine (§4c).

**Correcciones vinculantes:**

- **El paneo es enhancement montado por JS** (`.plano-panea` la pone
  plano.ts al montar el pin efectivamente); fallback vertical SIEMPRE en
  el CSS base — arregla no-JS, mobile, reduced-motion y el switch en
  caliente de un tiro. Kill-switch declarado: si no da 60fps en laptop
  mediana, la versión vertical ES la edición.
- **tirada.ts cede sus triggers dentro del pin**: sus STs verticales por
  pieza no tienen sentido bajo transform horizontal — el progreso local
  del timeline maestro maneja `setHalftoneProgress` (sin esto el momento
  firma del sitio se rompe justo donde más se escenifica). Ventanas de
  impresión NO solapadas (≤1 canvas re-renderizando por frame).
- **Snap**: nada de `ScrollTrigger.snap` peleando con Lenis — snap manual
  en scroll-end vía `lenis.scrollTo` con ease del sistema (el default de
  ScrollTrigger es power3: prohibido §2.7). Probar primero SIN snap.
- **Focus**: handler `focusin` en el track → seek del pin al detalle
  enfocado; `overflow: clip` (no hidden — el scrollIntoView nativo
  desplazaría el contenedor de forma permanente). Sin esto el paneo es
  trampa de teclado (WCAG 2.4.7).
- **Deep-links**: `/#tirada` y `/#colofon` re-anclados post-refresh (el
  pin spacer agrega ~3 viewports); `loading='lazy'` de las piezas 2+ no
  se dispara bajo transform → eager o pre-carga al montar el pin.
- **Salida del pin en caliente**: registrar la sección visible antes del
  switch, teardown con revert, refresh y `lenis.scrollTo(sección,
  { immediate: true })` bajo la cortina — el usuario emerge donde estaba.
- **Apertura ≤800ms** (900 viola §6), versión corta por sesión (espejo de
  ms-intro), y suprime el pageReveal genérico en el hero plano: el
  delineado ES el reveal. Cota: entra seca con `prensa`, tabular-nums.
- **Tinta**: cero "cian" hardcodeado — tokens de plano existentes o token
  nuevo en tokens.css con AA verificado en oscuro (#10294f).
- **Rótulo en mobile**: versión mínima ("lám 001 · rev 43%", 10px
  tabular), nunca ocultarlo — y la rúbrica final duplicada en el cajetín
  para que el payoff exista sin rótulo.

**No hace:** zoom/rotación CAD, blueprint 3D, grilla de fondo animada,
cotas falsas, sello de goma, SplitText, WebGL.

---

## Fase 4 — FANZINE: la pila fotocopiada (~2.5-3 días)

**Qué es.** La tirada colapsa a pila de hojas fotocopiadas (columna única
~760px, margen asimétrico, rotaciones deterministas por nth-of-type,
fondo/borde/sombra de hoja física — CSS puro, la identidad sobrevive a
reduced-motion). Cada hoja se imprime con la pasada del escáner (scrub
0.6); la pasada de entrada a la edición ES la cortina parametrizada
("fotocopiando…", ≤800ms total). Recortes despegables (Draggable+Inertia)
con PALIMPSESTO: despegar pasado un umbral revela el mismo dato en la voz
de otra edición (ya existe en proyectos.ts) — cumple "despegar", pasa el
test de remoción y cierra la idea madre: la fanzine está fotocopiada de
las otras. Contraportada = takeover de la edición: el sello "ejemplar Nº
0020" con TU número congelado al desbloquear (`ms-ejemplar`), golpe
`prensa` una vez.

**Correcciones vinculantes:**

- **Física vertical coherente**: la edición declara "el eje del escáner" —
  drift de registro, offsets de halftone y hovers de misregistración
  pasan a eje vertical vía `DESREGISTRO[fanzine]`, un solo fantasma
  (`--reg-c2: transparent` en las 2 paletas). Sin esto declara física
  vertical y ejecuta horizontal en cada interacción.
- **La pila es el objeto COMPLETO**: tapa, 4 piezas, imprenta y
  contraportada son hojas (fondo/borde/rotación/folio); foliar el objeto
  entero ("pág 02/07"), re-skineando el `.pieza-folio` existente — nunca
  dos contadores en la misma hoja.
- **Encuadernación real**: side-stitch — dos grapas verticales en el
  margen izquierdo de TODAS las hojas, mismas coordenadas (la grapa
  atraviesa la pila), transform-origin EN la grapa. Nada de grapas 45°
  decorativas por esquina. Van en un hijo real o `.masthead-top`
  (`.masthead::after` está OCUPADO por el grano).
- **Un solo dueño de progreso por hoja**: el ST de la hoja anima `--scan`
  y de ahí leen clip-path, línea de luz Y `setHalftoneProgress` — jamás
  3 reveladores compitiendo (scan + halftone + wipe de título).
- **El texto no se clipea ilegible**: el escáner imprime el PAPEL (fondo +
  media); la info va con opacity corta ligada al mismo `--scan` — respeta
  la decisión existente de no animar la información.
- **Recortes**: `type:'x'` en pointer coarse desde el día uno (con 'x,y' +
  allowNativeTouchScrolling GSAP fuerza touch-action none y mata el
  scroll); affordance diegética (esquina de cinta despegada + sombra
  corta + cursor grab); `killRecortes()` en unmount y before-swap
  (Draggable no muere con los ScrollTriggers).
- **Rotación ≤0.6° sobre texto corrido** (subpixel antialiasing en 1x);
  el quemado de umbral vive SOLO en imágenes, el body Courier queda
  limpio.
- **Sello**: número congelado en `ms-ejemplar` al desbloquear; min-height
  reservado y texto poblado en toda edición (el switch en caliente lo
  encuentra listo); mask SVG determinista que muerda el borde (no badge
  digital); fallback "tirada corta" sin localStorage.
- `ScrollTrigger.refresh()` obligatorio en el switch (la pila cambia la
  altura del documento en ambas direcciones — cubierto por Fase 0).

**No hace:** page-flip 3D, sonido, stickers decorativos, Math.random en
runtime, tóner sobre texto, takeover extra (la contraportada es el suyo).

---

## Riesgos transversales

- El switch en caliente es LA fábrica de bugs: cada fase se prueba con el
  recorrido "scrollear al fondo → cambiar de edición → volver → navegar a
  /pieza y regresar" en ambas direcciones (QA de Fase 0).
- Presupuesto de paint honesto: clip-path por JS es paint, no compositor —
  acotado por elemento está bien; full-viewport solo en one-shots.
- Cada "no hace" de arriba es ley: si una iteración futura quiere
  agregarlo, primero se enmienda esto y DESIGN.md (§0).

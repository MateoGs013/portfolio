# Referencia — Nithin M Warrier (https://www.nithinmwarrier.com/)

> Portfolio de un visual/product designer (Kochi, Kerala). Capturado con
> `qa/_ref-capture.mjs` a 1440×900, 8 frames sobre `scrollH ≈ 10899` (~12
> viewports). Read-only: este archivo es lo único que se escribió.

## Ficha técnica

**Fingerprint del capturador (window-globals + recursos):**

- `title`: "Nithin M Warrier — Portfolio"
- **Stack**: **Next.js** con **Turbopack** — todo el JS sale de
  `_next/static/chunks/*` + `turbopack-052l_bt.271on.js`. React implícito (el
  fingerprint da `react:false` sólo porque busca `#__next`; con App Router el
  root cambia). No es Astro/Nuxt/Webflow.
- **Smooth scroll**: **Lenis** confirmado por window-global (`lenis:true`). El
  resto de libs de motion dan `false` porque van **bundleadas** (el fingerprint
  por globals no las ve).
- **WebGL**: `webgl:true`, **7 canvases**. Aparece
  `gstatic.com/draco/.../draco_wasm_wrapper.js` → **geometría 3D comprimida con
  Draco**. Hay un personaje voxel 3D animado en la sección oscura → comportamiento
  **consistente con Three.js / React-Three-Fiber** (no confirmable por nombre).
- **Motion 2D**: pinned + scrub + path-draw + split-text ligados al scroll →
  **comportamiento consistente con GSAP ScrollTrigger** (no confirmable: GSAP no
  expone global, va en el bundle).
- **Analytics**: dos `*/script.js` bajo rutas hasheadas
  (`73037b90291a6800/script.js`, `3946d11fc9f4aa2c/script.js`) → analytics
  first-party proxeada (patrón Plausible/Umami self-host).
- **Tipografía**: `body` en **"Aeonik TRIAL"** (grotesca geométrica, versión
  trial) + fallback sans. `h1Font/h1Size = null` → el nombre gigante **no es un
  `<h1>`** (son spans/divs, probablemente split por caracter para animar).
- **Color base**: `body` `bg = lab(100 0 0)` (blanco). El crema cálido que se ve
  es **relleno de sección**, no el body.
- **Headings detectados**: sólo `"CuratedProjects"` (concatenado, sin espacio →
  markup partido). `navText: []` → **no hay `<nav>` clásico**; la navegación es
  la píldora "Menu" flotante.
- **scrollH**: 10899 px.
- **Créditos** (del pie, vía fetch): "Designed in Figma" · "Created with Claude
  Code".

**Paleta observada:** crema `#f2ede6` aprox · negro/gris carbón `#1c1c1c` ·
amarillo `#ffe14d` aprox (acento dominante) · azul `#38a8e0` aprox (CTA) ·
naranja de la firma · texto negro puro sobre crema, blanco roto sobre carbón.

## Primer vistazo / loader

- La captura esperó 4.5 s y **no** se ve un loader con porcentaje ni contador
  numérico en frame; el hero llega ya compuesto. Lo que sí es "carga" es la
  **firma naranja dibujada a mano** arriba al centro (trazo tipo `stroke` de SVG
  que probablemente se dibuja con `stroke-dashoffset`). No se puede afirmar un
  preloader de barra; comportamiento consistente con reveal de entrada corto.
- **Hero (frame 00)**: fondo crema con **grilla fina de ingeniería** (graph
  paper) muy tenue. Al centro, el nombre en negro bold enorme en dos líneas:
  **NITHIN M / WARRIER** (Aeonik, tracking normal, peso alto). Sobre una
  **línea horizontal de 1px** que cruza el ancho, flanqueando el nombre:
  izquierda `Visual Designer`, derecha `Based in Kochi, Kerala` (metadatos, no
  botones). Debajo, **píldora azul "Curious? Have a look!"** (CTA). Abajo al
  centro, **píldora amarilla "Menu ☰"** (nav flotante persistente en TODOS los
  frames). Sobre el borde derecho, **pestaña negra fija "w." + "Honors"**
  rotado 90° → badge de honores estilo Awwwards, fijo al viewport.
- Nota clave para nuestro concepto: **el nombre gigante SÍ existe acá** — es lo
  contrario a "ganar el nombre con la experiencia". Lo tomamos como contra-ejemplo
  (ver "Qué robar").

## Mecánica de scroll

- **Scroll suave con inercia (Lenis)** manejando todo el eje; el resto son
  secciones **pineadas** con progreso scrubbeado (nada corre por tiempo, todo por
  posición de scroll).
- Estructura por bloques que se **pinean y transicionan** uno sobre otro:
  1. Hero crema (00).
  2. **Retrato que se "construye"** desde abajo con una **máscara escalonada /
     pixelada amarilla** (bordes en escalones, tipo voxel/pixel-reveal) — 01→02.
  3. Sección **oscura de statement** con texto que se ilumina palabra por palabra
     y una **línea bezier que se dibuja** al scroll — 03→05.
  4. **Transición de pincelada rasgada** (torn brush) entre oscuro y crema — 05→06.
  5. **Curated Projects**: lista de servicios rotando + **mockups de dispositivo**
     — 06→07.
- El personaje voxel 3D (WebGL) **flota y rota** ligado al avance del scroll
  (parallax + rotación scrubbeada).

## Animaciones clave (qué + cómo)

- **Firma dibujada (hero)** — *qué*: el monograma naranja se traza. *cómo*:
  trazo SVG con `stroke-dasharray/`stroke-dashoffset` animado (consistente con
  DrawSVG/GSAP).
- **Retrato voxelizado que sube** — *qué*: un bloque amarillo con **borde
  superior escalonado/pixelado** crece desde abajo y revela la foto del autor.
  *cómo*: máscara con `clip-path` de pasos (o reveal por celdas/grid) + el fondo
  amarillo lleva **trama de puntos** (dot-grid tipo halftone). Es el momento
  "se compone el retrato" del sitio.
- **Tags de rol que aparecen** — *qué*: tres píldoras negras `Brand Designer` /
  `Web Designer` / `Product Designer` entran sobre el retrato. *cómo*: stagger de
  entrada (fade/translate) mientras la sección está pineada.
- **Split-text con iluminación progresiva** — *qué*: "4+ years of crafting
  meaningful products and visuals **that hold up**" arranca con las últimas
  palabras en gris y se **encienden a blanco** conforme scrolleás. *cómo*:
  split por palabra + scrub que interpola color/opacidad (SplitText + ScrollTrigger
  scrub, comportamiento consistente).
- **Path bezier dibujándose** — *qué*: una **línea blanca ondulada** serpentea de
  abajo-izquierda, pasa por un icono de **pluma/bezier** (cuadradito amarillo
  rotado) y sube hasta el texto. *cómo*: `stroke-dashoffset` scrubbeado; el icono
  de pen-tool ancla la curva. Refuerza el relato "esto se diseña con vectores".
- **Personaje voxel 3D** — *qué*: criatura marrón blocky (draco/WebGL) que
  flota arriba-derecha y **rota** entre frames. *cómo*: modelo Draco-comprimido en
  canvas WebGL, rotación/posición ligadas al scroll (parallax 3D).
- **Logo de Figma** que aparece pegado al texto — marca de herramienta, entra con
  el bloque.
- **Transición de pincelada rasgada** — *qué*: el borde entre la sección oscura y
  la crema es un **trazo de pincel irregular** (torn ink). *cómo*: máscara SVG/PNG
  con borde grunge que se desplaza; separa "capítulos" con textura de tinta.
- **Lista de servicios rotando** — *qué*: en Projects, "LANDING PAGES" en negro
  nítido con `VISUAL BRAND…` / `PRODUCT D…` **fantasma abajo**, apiladas y
  desenfocadas. *cómo*: carrusel vertical de palabras (rotador tipo slot) con las
  entradas salientes en gris/blur.
- **Mockups de proyecto** — *qué*: cada trabajo entra como **captura dentro de un
  frame de laptop/browser** (p.ej. "The Rameshwaram Cafe"). *cómo*: card grande
  que revela desde un placeholder amarillo sólido (06) al mockup real (07).
- **UI persistente**: píldora "Menu" (abajo) y pestaña "w. Honors" (derecha) fijas
  al viewport en todo el recorrido; **magnetismo de cursor** probable en las
  píldoras (patrón habitual, no confirmable por captura).

## Patrones de layout (grid, tipografía, escala, espaciado, color)

- **Grid**: composición **centrada y simétrica** en el hero (nombre al medio,
  metadatos a izquierda/derecha sobre una hairline que cruza todo el ancho). Marco
  de **líneas guía finas** en los bordes (columnas de ingeniería) presentes casi
  siempre. Projects rompe a **2 columnas** (texto izq. / mockup der.).
- **Tipografía**: una sola familia (Aeonik) haciendo TODO — de metadatos chicos
  (~16px) al nombre display (probable 100–140px). Contraste por **peso y escala**,
  no por familias. Bold para display, regular para copy. Mayúsculas en display de
  Projects ("LANDING PAGES").
- **Escala/espaciado**: mucho **aire** (el hero es casi todo espacio negativo con
  el nombre flotando); las secciones respiran a viewport completo. Ritmo por
  bloques full-bleed, no por cards apretadas.
- **Color por capítulos**: crema (identidad/calma) → amarillo saturado
  (retrato/energía) → carbón (statement/foco) → crema otra vez (trabajo). El
  **amarillo es el acento firma**; azul sólo para el CTA. Los cambios de color de
  fondo **marcan los actos** del video-scroll.
- **Formas**: todo pill/rounded (botones, tags, cards con radios grandes),
  contrapunto a la grilla recta. Texturas: dot-grid (halftone) sobre amarillo,
  brush rasgado en transiciones, grid fina en crema.

## Recorrido frame por frame

- **00 (y=0)** — Hero crema con grilla tenue. Firma naranja arriba. "NITHIN M
  WARRIER" negro gigante al centro; hairline con "Visual Designer" (izq) y "Based
  in Kochi, Kerala" (der). CTA azul "Curious? Have a look!". Píldora "Menu" abajo.
  Pestaña "w./Honors" a la derecha.
- **01 (y≈765)** — Bloque **amarillo con borde superior escalonado/pixelado** sube
  desde abajo revelando el **retrato** (rulos, lentes naranjas, hoodie azul). Fondo
  amarillo con trama de puntos. Reveal en progreso.
- **02 (y≈1530)** — Retrato completo sobre amarillo punteado. Tres tags negros:
  "Brand Designer" / "Web Designer" / "Product Designer". Abajo asoma la sección
  carbón entrando.
- **03 (y≈2295)** — Sección carbón. Statement centrado "4+ years of crafting
  meaningful products and visuals **that hold up**" con las últimas palabras en
  gris (aún no iluminadas). Icono pen-tool amarillo rotado bajo el texto.
- **04 (y≈3060)** — Todo el statement ya en blanco. **Logo de Figma** a la
  izquierda. Empieza a dibujarse la **línea blanca ondulada** (bezier) hacia el
  icono. Asoma el **voxel marrón 3D** arriba-derecha.
- **05 (y≈3825)** — El **voxel 3D** más grande/rotado (animación 3D). Línea
  bezier completa cruzando por el pen-tool. Abajo aparece el **borde de pincelada
  rasgada** iniciando la vuelta al crema.
- **06 (y≈4590)** — Sección crema con **borde brush rasgado** arriba. **Card
  amarilla grande** a la derecha (placeholder de proyecto antes de revelar la
  imagen). Izquierda vacía, lista para poblar.
- **07 (y≈5355)** — **Curated Projects**. Izquierda: "Designing experiences that
  help brands grow through" + display "LANDING PAGES" con "VISUAL BRAND…" /
  "PRODUCT D…" fantasma (rotador de servicios). Derecha: **mockup de laptop** con
  el sitio "The Rameshwaram Cafe" (dark + ornamento dorado).

## Qué robar para nuestro concepto

El destino es contar el sitio **como un video / línea de montaje** (ideación →
maquetado → programación → producto), con una **carga que compone un retrato en
halftone**, el **nombre ganado por la experiencia**, y transiciones prolijas.
De esta referencia sirve, traducido a nuestro sistema "Ediciones":

1. **Retrato voxel/pixel que se construye = nuestro halftone que converge.** El
   reveal escalonado del retrato (frames 01→02) es exactamente la idea de "se
   compone un retrato en tinta". Traducir su pixel-mask a nuestra **trama duotono
   por celdas** (`halftone.ts`): las planchas convergen a registro conforme
   scrolleás. Robamos la *mecánica del reveal por celdas*, no el amarillo plano.
2. **Capítulos por color de fondo = nuestras ediciones como actos.** Ellos usan
   crema→amarillo→carbón→crema para marcar etapas. Nosotros ya tenemos claro/oscuro
   por edición: usar el **cambio de fondo scrubbeado como separador de etapa**
   (ideación/maquetado/programación/producto) sin cambiar de edición.
3. **Split-text con iluminación progresiva.** El statement que se enciende palabra
   por palabra es limpio y de mucha pregnancia. Encaja con "prolijo sin
   sobrecargar". Aplicable a nuestro copy rioplatense (encender por línea al scroll).
4. **Path bezier dibujándose como hilo conductor.** La línea que se traza y
   atraviesa las secciones es el "cable" que cose el relato — ideal para la
   metáfora de **etapas del trabajo** (un hilo que va de ideación a producto).
   Implementable con `stroke-dashoffset` + ScrollTrigger scrub (nuestras `eases`).
5. **Transiciones de textura (brush rasgado) entre actos.** En vez de fade, un
   **borde con textura** (para nosotros: registro de tinta / rasgado de plancha)
   separa capítulos. Coherente con "Ediciones" impresas.
6. **UI mínima persistente.** Una sola píldora "Menu" flotante + un badge lateral,
   sin navbar. Menos cromo, más contenido. Nos sirve para no cargar la pantalla.
7. **CONTRA-EJEMPLO deliberado — el nombre gigante.** Ellos abren con "NITHIN M
   WARRIER" a pantalla completa. Nuestro concepto pide **lo opuesto**: el nombre se
   **gana con la experiencia**, no se grita en el hero. Robamos su *sistema de
   composición y motion*, pero **invertimos la jerarquía del nombre**: que aparezca
   pequeño/tardío, como firma seca al final de la tirada, no como masthead inicial.
8. **Una sola tipografía por peso/escala** (ellos: Aeonik para todo). Refuerza
   nuestra ley de tokens: contraste por peso, no por sumar familias.

**Lo que NO copiar:** el amarillo saturado plano de fondo (choca con nuestras 6
paletas de tokens), el personaje 3D mascota (fuera de concepto imprenta), y el
nombre display gigante en el hero (contradice el brief).

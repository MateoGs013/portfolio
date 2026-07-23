# Referencias — síntesis para rehacer el portfolio

Tres sitios analizados a fondo. Los análisis por-sitio viven en:

- [`dragonfly.md`](./dragonfly.md) — screenshots en `qa/artifacts/ref/dragonfly-00..07.png`
- [`bymonolog.md`](./bymonolog.md) — screenshots en `qa/artifacts/ref/bymonolog-00..07.png`
- [`nithinmwarrier.md`](./nithinmwarrier.md) — screenshots en `qa/artifacts/ref/nithinmwarrier-00..07.png`

Este README es la destilación: qué se repite en los tres, cómo lo traducimos al
concepto **Ediciones / La Imprenta**, y qué NO copiar. Leer junto a
`docs/DESIGN.md` — este doc alimenta esa ley, no la reemplaza.

---

## Patrones que se repiten en los 3

Los tres son estudios/portfolios de alta gama (dos con premios), y coinciden en
un puñado de decisiones. Lo que se repite es lo que vale la pena robar.

### 1. La carga no es un spinner: es composición
Ninguno abre con una barra de progreso con `%`. El hero **llega compuesto** o se
compone frente a vos:
- **Dragonfly**: la libélula 3D se "imprime" como nube de puntos / ASCII-halftone
  blanco sobre negro; las alas se arman en diagonales de puntos. La imagen
  dispersa converge con el progreso — literalmente componer un retrato en trama.
- **bymonolog**: entra tras `load` a negro cálido con globo wireframe; el fondo
  es foto con **grano + trama de puntos (halftone)**, no un gradiente CSS.
- **nithinmwarrier**: sin loader visible; la única "carga" es una firma naranja
  dibujada a mano (trazo SVG `stroke-dashoffset`) y un retrato que se revela por
  celdas / máscara pixelada.

**Denominador común: la carga ES la primera animación del sitio, y construye la
identidad en vez de tapar la espera.**

### 2. Scroll suave con inercia + pin + scrub como columna vertebral
Los tres usan la misma receta de motion (aunque con stacks distintos —
Nuxt/Three, Webflow/GSAP-CDN, Next/R3F):
- **Smooth-scroll con inercia** (Lenis confirmado por global en dragonfly y
  nithin; consistente en monolog) enganchado al ticker de GSAP.
- **Secciones pineadas** con progreso **100% scrubbeado al scroll** (nada por
  tiempo): monolog fija el wordmark y compone una pieza "entre palabras", nithin
  encadena actos (retrato → statement → bezier → proyectos), dragonfly deja la
  libélula pineada de fondo rotando/rearmándose.
- One-page largo: 12–15 viewports (scrollH ~10.9k / ~13.2k / ~13.7k).
- Un objeto/hilo persistente cose todo (libélula, wordmark, path bezier).

### 3. Un solo tipo de animación firma, repetido con disciplina
No hay parque de efectos. Cada sitio tiene **un** gesto y lo ordeña:
- Composición **dot-matrix / halftone / voxel** de imágenes (los tres la usan en
  alguna forma: puntos, grano+trama, reveal por celdas).
- **Split-text** con reveal por línea/carácter/palabra, muchas veces con la
  última palabra que se "seca" en degradé de tinta (monolog y nithin, calcado).
- **Path SVG dibujado** (`stroke-dashoffset`) como hilo conductor (nithin) o
  ticker de progreso segmentado (dragonfly).

### 4. Layout: monocromía, contraste brutal de escala, vacío compositivo
- **Paleta ultra-restringida**: negro + una tinta (naranja #F5410E en dragonfly),
  o monocromo cálido sin acento de UI (monolog: el color entra SOLO por la
  imagen), o capítulos de color de fondo por acto (nithin). **El color casi nunca
  vive en la UI; vive en las piezas.**
- **Escala tipográfica sin escalones intermedios**: display gigante full-bleed vs
  micro-mono (~11–17px), nada en el medio → jerarquía nítida.
- **Voces tipográficas por función**: serif lectura / sans título / mono HUD
  (dragonfly), o una sola familia jugando por peso y tamaño (monolog Khteka,
  nithin Aeonik).
- **Lenguaje de ficha técnica**: contadores tabulares (`01/05`, `02/02`),
  labels mono-caps, marcadores (`ss ←—01/05`, `SEC-01`), bullets de sección,
  marcas de registro `+`. Aire generoso, mitad de pantalla vacía a propósito.

### 5. Restraint (la lección transversal)
Los tres se ven caros por lo que NO hacen: sin navbar cargado (una píldora
"Menu" y un badge lateral bastan), sin acento cromático gratuito, un solo gesto
3D sutil (o ninguno), tipografía haciendo el 90% del trabajo. **La contención es
el look.**

---

## Traducción a nuestro concepto

Nuestro brief: el sitio es un **VIDEO** que se recorre con el scroll, contando
las etapas **ideación → maquetado → programación → producto terminado**; la
**carga construye el sitio**; un **retrato se compone de trazo a foto**; el
**nombre se gana** por la experiencia (chico y tardío, firma seca); transiciones
**prolijas con pregnancia**. Mapeo momento por momento, con la técnica concreta.

### A. La CARGA que construye el sitio → `registro.ts` + `halftone.ts`
En vez de preloader, el registro de tintas ya existente hace de composición
inicial. Reforzarlo con la mecánica de dragonfly: **el retrato/masthead nace de
puntos, plancha por plancha, y la imagen dispersa converge a registro** con el
progreso de carga.
- **Técnica**: `halftone.ts` ya tiene las planchas 15°/75° que convergen a
  registro. Usar ese mismo canvas como pantalla de carga: densidad de trama
  interpolada de dispersa→registrada mientras cargan los assets. `pageReveal()`
  de `registro.ts` reutilizado para la salida de la cortina.
- **Qué robar de quién**: dragonfly (carga = composición en trama), monolog
  (grano + halftone en vez de gradiente CSS).
- **Regla anti-bloqueo**: la carga corre con CSS/canvas 2D, NO espera a WebGL
  (ver "Qué NO copiar").

### B. El sitio como VIDEO scrubbeado → `lenis.ts` + `tirada.ts`
El scroll es la línea de tiempo. Lenis (ya lo tenemos) da la inercia; los
ScrollTriggers de `tirada.ts` scrubbean un fondo continuo de trama que **muta con
el scroll y cose las etapas** — el equivalente a la libélula persistente de
dragonfly o el wordmark pineado de monolog.
- **Técnica**: un canvas halftone de fondo pineado + ScrollTriggers con `scrub`
  ligados al progreso; las eases del sistema (`eases.ts`: prensa/tinta/salida)
  para todo. `prefers-reduced-motion` corta el scrub y deja estados finales.

### C. Etapas ideación → maquetado → programación → producto → **capítulos scrubbeados**
Molde ideal: el pin + scrub de monolog donde una pieza central se "compone entre
palabras" ("WE CLOSE [img] THAT GAP"), y los actos encadenados por color de
fondo de nithin (crema/carbón/crema).
- **Técnica**: cuatro secciones pineadas, una por etapa, cada una con su beat:
  1. **Ideación** — split-text que se enciende palabra por palabra (nithin:
     "…that hold up"): copy rioplatense encendiendo por línea.
  2. **Maquetado** — path bezier blanco que se dibuja (`stroke-dashoffset` +
     ScrollTrigger, anclado a un ícono) como hilo que cose las etapas (nithin).
  3. **Programación** — la pieza central se compone: de placeholder/plancha
     sólida a la captura real de proyecto (monolog + nithin mockups).
  4. **Producto terminado** — la trama converge del todo a registro; el
     screenshot real "impreso" queda legible y nítido.
- **Transiciones entre etapas**: NO fade. Textura de **pincelada rasgada / rasgado
  de plancha** (nithin) o barrido de tema prolijo (`tema.ts`) — coherente con
  registro de tinta del concepto Ediciones.
- **Sin cambiar de edición**: las etapas son actos dentro de una edición; el
  cambio de edición es otra capa (el selector de `tema.ts`).

### D. El RETRATO que se compone de trazo a foto → `halftone.ts` por celdas
La mecánica de nithin (retrato voxelizado que sube y se revela por celdas) y de
dragonfly (retrato nace de puntos plancha por plancha), pero SIN el amarillo
plano de nithin ni gimmick.
- **Técnica**: reveal por celdas de `halftone.ts` — las celdas de trama se
  resuelven de trazo/punto disperso → duotono → foto en clave baja. Un solo
  tratamiento por tipo de imagen: **retrato en clave baja fotográfico** (como los
  chiaroscuro de dragonfly), **editorial/abstracto en dot-matrix**. Que la trama
  no sea decoración: es cómo se "imprime" la persona.

### E. El NOMBRE ganado por la experiencia → masthead chico, plancha grande
Aquí los tres se dividen y nosotros tomamos partido explícito:
- **Robar de monolog**: el `<h1>` real es diminuto (17.75px); el "MONOLOG"
  gigante es **grafismo/plancha, no nombre**. Masthead chico, escala grande como
  plancha impresa.
- **Robar de dragonfly**: el wordmark del hero **se disuelve al primer scroll** y
  la identidad pasa a una marca discreta (monograma/folio).
- **CONTRA-EJEMPLO deliberado (nithin y el wordmark gigante de dragonfly)**: NO
  abrir con el nombre gigante protagonista. Nuestro nombre **emerge de la trama,
  se lee un instante y se disuelve de nuevo en puntos**; la identidad persistente
  es el monograma / folio de pliego en una esquina, no el cartelón.
- **Técnica**: el nombre aparece como plancha compuesta en el registro inicial,
  y `transition:name` lo morfea hacia la tirada (ya existe el patrón entre
  `index.astro` y `pieza/[slug].astro`).

### F. Transiciones prolijas con pregnancia → sistema, no fade
- **Cambio de edición**: barrido de cortina de `tema.ts` (ya emite `ms:edicion`),
  no corte duro como monolog. Montar la edición entrante detrás de la cortina.
- **Cambio de acto/etapa**: rasgado de plancha (máscara con borde grunge que se
  desplaza) en vez de opacity.
- **HUD/frame persistente** (robado de dragonfly): marcas de registro `+`,
  monograma en esquina, **ticker de progreso segmentado** que dialoga con el
  clicker **La Imprenta** y con un "progreso de tirada". Barato, prolijo, con
  pregnancia.
- **Divisores numerados** (dragonfly): `01 / TÍTULO` + hairline full-width +
  micro-label mono al margen — traducible al folio de pliego de cada Edición.

---

## Qué NO copiar

Lo que no encaja con el concepto, contradice el brief, o es riesgo técnico.

### Riesgos técnicos
- **WebGL pesado que bloquea el first paint.** Los tres cargan Three.js + DRACO/
  R3F (7 canvases en nithin, 2 en dragonfly, modelos comprimidos WASM). Eso es
  peso y bloqueo. **Nosotros somos Astro con motion modular**: si sumamos 3D que
  sea UN gesto (la prensa, el retrato componiéndose), nunca un parque de
  partículas, y **nunca en el camino crítico del primer render**. La carga y el
  hero deben pintar con canvas 2D / CSS; el WebGL (si existe) entra después y
  degrada con `prefers-reduced-motion` y en móvil.
- **Scroll-jacking excesivo.** Pin + scrub está bien dosificado, pero 15
  viewports pineados encadenados marean y rompen accesibilidad. Mantener el
  recorrido más corto, respetar SIEMPRE `prefers-reduced-motion` (estados finales
  legibles sin motion), y no secuestrar el scroll hasta el punto de que no se
  pueda escanear.
- **No adoptar sus stacks.** Nuxt/Webflow+jQuery/Next son de ellos. Tomamos el
  vocabulario visual y de motion, no la arquitectura. Nada de Barba, jQuery, ni
  bundles de terceros (el toggle de sonido de monolog vía odyn.dev).

### Contradicciones con el brief
- **El nombre gigante como protagonista del hero** (nithin: "NITHIN M WARRIER"
  bold gigante al centro; el wordmark cartelón de dragonfly). Contradice
  frontalmente "nombre ganado". Ver sección E.
- **Amarillo saturado plano de fondo** (nithin): choca con nuestras 6 paletas de
  tokens. Robamos la *mecánica* del reveal por celdas, no el color.
- **La mascota / personaje 3D** (voxel de nithin, y en menor medida el globo
  espectáculo): fuera del concepto imprenta. Si hay 3D, es la prensa o el
  retrato, no un personaje.

### Clichés a evitar (los que el cliente ya marcó como "plantilla IA")
- Preloader con barra/porcentaje (ninguna referencia lo hace — nosotros tampoco).
- Gradientes CSS de fondo como "textura" — usar grano + trama real (halftone),
  como monolog.
- Acento cromático de UI decorativo: el color entra por las piezas
  (screenshots reales), no por botones y bordes de colores.
- Sumar familias tipográficas: contraste por **peso y escala**, no por agregar
  fuentes (refuerza la ley de tokens).
- La trama/halftone como gimmick aplicado a todo por igual: **un tratamiento por
  tipo de imagen**, dosificado.

---

*Fuentes: `dragonfly.md`, `bymonolog.md`, `nithinmwarrier.md` y sus screenshots
en `qa/artifacts/ref/`.*

# Referencia — Dragonfly (https://www.dragonfly.xyz/)

> Fondo de inversión cripto. Sitio one-page larguísimo, negro absoluto, una sola
> tinta naranja, y una libélula 3D que se "imprime" en trama de puntos/ASCII y
> vive de fondo mutando con el scroll. Editorial de lujo con estética de
> viewfinder / pliego de imprenta (marcas de registro, monograma en las esquinas,
> ticker de progreso). Es casi un caso testigo de nuestro concepto DESTINO.

---

## Ficha técnica

Datos del capturador (`qa/_ref-capture.mjs`, viewport 1440×900) + inferencias.

- **Título**: `Dragonfly`
- **Stack**: **Nuxt (Vue 3)**. El fingerprint por globals reportó `vue:true` /
  `nuxt:false`, pero **todas** las URLs de JS cuelgan de `/_nuxt/` con hash
  (`DL_a0gdT.js`, `DSFEkcKy.js`, …) → build de Nuxt sin discusión (el global
  `__NUXT__` no estaba montado en el instante del sniff). SSR/SSG + hidratación.
- **WebGL**: **sí**. `canvases: 2`. Hay `@gl/libs/draco/draco_wasm_wrapper.js`
  → geometría 3D comprimida con **DRACO** decodificada en cliente. El namespace
  propio `@gl/` sugiere una capa GL in-house. Comportamiento **consistente con
  Three.js + shaders custom** (point-cloud / dither); no se puede confirmar la
  lib exacta porque va bundleada.
- **Motion**: ningún global de GSAP/Lenis expuesto (todo como módulo). El
  scrubbing continuo del 3D, el smooth-scroll con inercia y los reveals por
  línea son **consistentes con GSAP ScrollTrigger + Lenis**, sin poder afirmarlo.
- **Fondo**: `rgb(0,0,0)` — negro puro.
- **Tipografía**: `bodyFont: "Times New Roman"` — usan una **serif** como cara de
  lectura (Times o una licenciada que degrada a Times). El display grande
  ("GLOBAL SINCE DAY 1") tiene más contraste modulado (aire Didone). Los títulos
  de sección y la nav son **sans grotesca**; las micro-etiquetas son **mono**
  en mayúsculas con tracking.
- **`headings: []`** (ningún h1/h2/h3 con texto) y **`h1Font: null`**: los
  títulos ("ABOUT/WRITING/TEAM", el wordmark del hero, los títulos de artículo)
  **no son headings semánticos** o están troceados en spans por carácter/línea
  para animar (split-text). Señal fuerte de reveals tipográficos.
- **Altura de scroll**: `scrollH: 13726` px ≈ **15 viewports**. One-page larga.
- **Nav / secciones**: `Home · About · Writing · Team · Portfolio · Careers ·
  Contact` (+ `Terms · Disclosures`). Secciones numeradas: **01 About · 02
  Writing · 03 Team · 04 Portfolio · 05 Careers** (la captura llegó hasta 03).
- **Paleta**: negro `#000` · texto blanco/gris · **una sola tinta**, un
  naranja-rojo vivo ≈ `#F5410E`/`#FF4713`. Cero segundo color.

---

## Primer vistazo / loader

- Pantalla negra. En el centro, la palabra **DRAGONFLY** en la tinta naranja,
  en caja alta, grande pero **no descomunal** (ocupa ~el ancho útil, sin gritar).
- Detrás, una **libélula compuesta por puntos** (nube de puntos / trama tipo
  ASCII-halftone, blanco sobre negro): las alas son líneas diagonales de puntos
  que van del ángulo al centro. Es el **canvas WebGL** — un modelo 3D (DRACO)
  renderizado como partículas/glifos, no como sólido.
- **Frame persistente** montado desde el arranque (se mantiene en todos los
  frames): pasa a la sección **Mecánica de scroll**. La sensación de carga es
  "la imagen se **arma** a partir de puntos" más que un spinner — el loader ES
  la composición del retrato en trama. (No se ve un preloader clásico con %.)
- Lectura: el nombre aparece pero se **disuelve al primer scroll** y cede el
  protagonismo; la identidad que queda es el monograma de las esquinas, no el
  cartelón. (Ojo con esto para nuestro DESTINO, ver última sección.)

---

## Mecánica de scroll

- **Smooth-scroll con inercia** (consistente con Lenis): el desplazamiento es
  amortiguado, no nativo. Sobre esa base corren ScrollTriggers.
- **Fondo 3D pineado y scrubbeado**: la libélula de puntos **no** se va con el
  contenido; queda de fondo y **rota / se rearma / dispersa** ligada al progreso
  del scroll (scrub). Las secciones de contenido pasan por encima. Es el hilo
  conductor que hila las 15 pantallas — la "película" del sitio.
- **HUD/nav fijo (top-center)**: pill oscuro con tres zonas —
  1) glifo **`>|<`** (target/colapso, motivo viewfinder),
  2) **ticker de progreso** de segmentos naranjas en el medio (dashes que se
     llenan/varían según avanzás → lectura de scroll-progress),
  3) **MENU** a la derecha.
- **Monograma en las 4 esquinas**, fijo: `D` (sup-izq), una `F` espejada
  (sup-der), `L` (inf-izq), `Y` (inf-der) → **"DFLY"** repartido como marco de
  visor. Marca la identidad sin cartelón.
- **Marcas de registro `+`** (crop/registration marks de imprenta) en posiciones
  fijas de los bordes: refuerzan la metáfora de pliego impreso.
- **Divisores de sección** consistentes: número en naranja (`01`), título en sans
  blanca (`ABOUT`), **hairline** a todo el ancho y etiqueta `SEC-01` al extremo
  izquierdo de la línea. Sistema repetido en 02/03…
- Ritmo: bloques a **pantalla completa** (statements) alternados con **listas
  densas** (contenido/equipo). Alterna respiración y densidad.

---

## Animaciones clave (qué + cómo)

- **Composición en trama de puntos / ASCII (la firma)**: imágenes convertidas a
  **dot-matrix monocromo**. La libélula del hero, y los thumbnails de artículos
  (un vórtice espiral, una arquitectura isométrica) están **ditherizados** a
  puntos/caracteres. Técnica consistente con **shader de halftone/dither o
  ASCII** (atlas de glifos) sobre textura, o assets pre-ditherizados. Efecto:
  todo "se imprime" en puntos.
- **3D scrubbeado al scroll**: point-cloud de la libélula (modelo DRACO) que
  converge/dispersa con el progreso. En el hero está armada; en "GLOBAL SINCE
  DAY 1" abre en X de alas diagonales corner-to-corner.
- **Reveals tipográficos por línea/carácter** (split-text): coherente con
  `headings:[]` — los títulos entran troceados. Los statements serif grandes
  aparecen línea por línea; la copy hace fade-up.
- **Statement display serif a pantalla completa**: "GLOBAL / SINCE / DAY / 1"
  centrado, alto contraste, sobre la trama — momento manifiesto.
- **Ticker de progreso segmentado** en la nav (los dashes naranjas como readout
  del scroll).
- **Pager/carousel** de artículos destacados: control central de glifos
  geométricos diminutos (cuadrado naranja lleno + contorno entre crosshairs).
- **Hover/estado activo en tinta**: filtros (`ALL · COMMENT-LETTER · LEGAL ·
  OPINION · RECRUITING · RESEARCH`) como pills mono; activo = **relleno naranja**.
- **Marcadores viewfinder** (`+` / crosshair naranja) en las esquinas de las
  tarjetas de equipo destacado → coherente con el motivo de visor. Cursor custom
  plausible pero **no confirmable** desde estáticos.
- **`LOAD MORE`** con micro-glifo de puntos (carga incremental de la lista).

---

## Patrones de layout (grid, tipografía, escala, espaciado, color)

- **Grid**: contenido a ~full-bleed con márgenes finos. Listas en **3 columnas**
  (Título sans mayúscula · Excerpt serif · Categoría mono a la derecha + marcador
  de puntos). Equipo en **grilla de 4 columnas** (thumb + nombre + rol).
- **Sistema tipográfico de tres voces**:
  - **Serif** (Times-like) → copy de lectura y statements display de alto
    contraste. Es la voz "editorial".
  - **Sans grotesca** → títulos de sección y de artículo, en caja alta.
  - **Mono** en mayúsculas con tracking → micro-etiquetas (`SEC-01`, `ETHOS`,
    `OPINION`, `13`, categorías, tags). Es la voz "instrumento/HUD".
- **Escala**: saltos grandes entre el statement a pantalla completa y la
  micro-tipografía mono. Poco tamaño intermedio → jerarquía clara.
- **Espaciado**: aire generoso alrededor de los statements; densidad quirúrgica
  en las listas separadas por **hairlines** de 1px.
- **Color**: negro `#000` de base, texto blanco y grises apagados para lo
  secundario, y **una única tinta** naranja `≈#F5410E` reservada para números de
  sección, estado activo, ticker de progreso y marcadores. La restricción
  cromática (mono-tinta) es la mitad de la "pregnancia".
- **Fotografía**: retratos de equipo en **clave baja / chiaroscuro** sobre negro
  (los rostros emergen de la oscuridad). Coherencia total: todo vive en negro.
  La trama de puntos se reserva para imágenes editoriales/abstractas, no para
  los retratos.
- **Motivo de imprenta/visor**: marcas de registro `+`, monograma de esquinas,
  glifos `>|<` y crosshairs — un lenguaje de "pliego + viewfinder" cosido a todo.

---

## Recorrido frame por frame

- **00 (y=0)** — Hero: negro; wordmark **DRAGONFLY** naranja centrado sobre la
  libélula en trama de puntos (alas diagonales). HUD fijo (`>|<` · ticker ·
  MENU), monograma DFLY en las 4 esquinas, marcas de registro `+`.
- **01 (y=765)** — Divisor **01 / ABOUT** (hairline + `SEC-01`). Copy serif:
  "Eight years in crypto…" + párrafo indentado con etiqueta mono `ETHOS`
  ("$3M to $30M+ … New York City and Singapore"). La libélula sigue de fondo.
- **02 (y=1530)** — Statement display serif a pantalla completa **"GLOBAL /
  SINCE / DAY / 1"**, alto contraste, sobre la trama que abre en X de alas.
- **03 (y=2295)** — Divisor **02 / WRITING**. Dos destacados como **arte
  dot-matrix** (vórtice espiral · arquitectura isométrica), cada uno con tag
  mono `OPINION`; títulos entrando abajo.
- **04 (y=3060)** — Destacados con título + excerpt serif; **pager** de glifos
  (cuadrado naranja). Arranca **ALL CONTENT** (label `13`) con filtros pill
  (`ALL` activo naranja) y filas de lista a 3 columnas.
- **05 (y=3825)** — Más filas de contenido (Research/Recruiting/Opinion),
  botón **LOAD MORE**, y divisor **03 / TEAM** (`SEC-03`).
- **06 (y=4590)** — **Equipo destacado**: 4 retratos grandes chiaroscuro
  (Haseeb Qureshi, Bo Feng, Tom Schmidt, Rob Hadick) con `+` naranja y
  nombre(sans)/rol(serif); debajo arranca la grilla secundaria.
- **07 (y=5355)** — **Roster completo** en grilla de 4 columnas: thumb + nombre
  sans + rol serif, decenas de personas, todo en clave baja sobre negro.

---

## Qué robar para nuestro concepto

Traducción directa al DESTINO (el sitio como VIDEO / carga que construye /
nombre ganado / prolijo con pregnancia). Encaja tanto que es casi el brief:

1. **La carga = composición en trama, no spinner.** Su libélula que se arma con
   puntos ES literalmente "cómo se compone un retrato en halftone". Nosotros ya
   tenemos `halftone.ts` (planchas tinta/acento a 15°/75° que convergen a
   registro): usar esa misma mecánica como **loader/registro** — el retrato
   nace de puntos, plancha por plancha, en vez de un preloader. Robar la idea de
   que **la imagen dispersa converge con el progreso**.
2. **Hilo 3D/canvas scrubbeado como columna vertebral del "video".** Un elemento
   de fondo continuo (para nosotros: la trama halftone que corre por las piezas
   vía `tirada.ts`) que muta ligado al scroll y cose las etapas
   ideación→maquetado→programación→producto. Es exactamente su libélula
   persistente.
3. **Divisores numerados + hairline + micro-label mono.** `01 / TÍTULO` con
   línea a todo el ancho y `SEC-01` al margen: sistema barato, prolijo y con
   pregnancia. Traducible a nuestras "Ediciones" (`SEC-01`, folio de pliego).
4. **Mono-tinta + tres voces (serif lectura / sans título / mono HUD).** La
   restricción cromática y el contraste serif↔mono dan la "pregnancia sin
   sobrecargar". Ya vivimos en tokens de una tinta por edición: reforzar el
   **contraste de las tres voces** en cada edición.
5. **Motivo de imprenta/visor como frame persistente.** Marcas de registro `+`,
   monograma repartido en las esquinas, ticker de progreso segmentado. Para el
   portfolio-imprenta es perfecto: **marcas de registro reales**, folio, y un
   **progreso de tirada** en un HUD fijo (dialoga con el clicker "La imprenta").
6. **El nombre se disuelve.** Ojo con la **tensión**: Dragonfly SÍ pone un
   wordmark gigante en el hero — eso es lo que NO queremos. Lo rescatable es que
   **se disuelve al instante** y la identidad persistente pasa al **monograma de
   esquinas** (DFLY). Nuestra traducción: nada de nombre gigante fijo; que el
   nombre **emerja de la trama y vuelva a disolverse en puntos**, y que lo que
   quede sea una marca discreta (folio/monograma), ganándose el nombre con el
   recorrido.
7. **Imágenes "impresas".** Convertir editorial/abstracto a **dot-matrix**, pero
   dejar los **retratos en clave baja** fotográficos (como ellos) para que la
   trama no se vuelva gimmick. Coherencia: todo sobre negro (o sobre el papel de
   cada edición), un solo tratamiento por tipo de imagen.

**Qué NO copiar:** el cartelón naranja gigante del hero (contradice "nombre
ganado"), y el volumen de secciones VC (nosotros somos portfolio, no fondo). La
densidad de listas conviene dosificarla.

---

*Fuentes: fingerprint de `qa/_ref-capture.mjs` + lectura de los 8 screenshots
`qa/artifacts/ref/dragonfly-00..07.png` + WebFetch de copy/secciones. Las libs
de motion/3D no se afirman: van bundleadas en Nuxt; se describen como
"comportamiento consistente con" a partir de indicios (URLs `_nuxt/`, DRACO,
canvas WebGL) y de lo visual.*

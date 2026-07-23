# Referencia — ByMonolog (https://bymonolog.com/)

> Estudio de branding + web (MONOLOG, fundado por Huy Nguyen). Sitio premiado
> (Awwwards/FWA/CSSDA). Se documenta como material de traducción hacia nuestro
> concepto DESTINO: el sitio-como-video, la carga que construye, el nombre que
> se gana con la experiencia. Capturado con `qa/_ref-capture.mjs`
> (8 frames, viewport 1440×900, scroll total 13227px → ~14–15 pantallas; se
> capturó ~47% del largo).

## Ficha técnica

Fingerprint del capturador (`INFO bymonolog`):

- **Título**: "MONOLOG | Brand and Web Design Studio founded By Huy"
- **Stack de build**: **Webflow** (URLs `cdn.prod.website-files.com/…`) + **jQuery 3.5.1**.
  Es un Webflow "enchulado" a mano, no un framework SPA (React/Next/Vue/Nuxt/Astro = false).
- **Librerías de motion (confirmadas por URL de recurso, no window-globals)**:
  - **GSAP 3.15.0** + **ScrollTrigger** + **SplitText** + **CustomEase** + **Flip**
    (`cdn.prod.website-files.com/gsap/3.15.0/…`). El paquete completo de GSAP:
    scroll, split de texto por línea/caracter, curvas custom y transiciones FLIP.
  - **Lenis 1** (`cdn.jsdelivr.net/npm/lenis@1`) → smooth-scroll con inercia.
  - **Three.js 0.160.1** (`cdn.jsdelivr.net/npm/three@0.160.1`) → WebGL.
  - **Barba 2** (`@barba/core@2`) → transiciones de página SPA-like sin recargar.
  - **odyn.dev** (`cdn.odyn.dev/p/3pc9/bundle.js`) → utilidad de terceros
    (sonido/interacción para Webflow; consistente con el toggle de mute del nav).
- **WebGL**: `true`. **Canvases: 3**. Uno es el globo wireframe del hero (three.js);
  los otros dos son consistentes con capas de post: grano/dither y/o textura de
  trama (halftone) sobre el fondo cinematográfico. No confirmado el shader exacto.
- **Fondo base**: `rgb(8, 8, 7)` (casi negro cálido). Sección "Success Stories"
  invierte a crema `~#e9e9e6`.
- **Tipografía**: **Khteka** (neo-grotesca) para TODO — body y headings
  (`Khteka, Arial, sans-serif`). El wordmark gigante usa un peso pesado/redondeado
  de la misma familia.
- **`h1` semántico = 17.75px**: el único `<h1>` es el logo chico del nav. El
  "MONOLOG" gigante del hero es tipografía decorativa (h2/display), NO el h1.
  → El nombre no grita; la marca se sostiene desde una firma pequeña. Dato de oro
  para nuestro DESTINO ("nada de nombre gigante").
- **Nav**: `Work(SOON)`, `Services(SOON)`, `Process(SOON)`, `Start a project`, y un
  menú/footer expandido `Work→ Process→ Services→ Resources→ Contact→` +
  `YouTube↗ Linkedin↗ Instagram↗`. Varias rutas marcadas "SOON" (sitio en rollout).
- **Estructura (de `headings`)**: Hero → Statement/testimonio slider → Clients
  ("Brands we've helped") → "We close that gap" (pin) → Success Stories (5 casos:
  OH Architecture, Supersolid, Mammoth Murals, HISS/Univ. Sydney, +1) → Awards
  (Awwwards SOTD ×5, FWA SOTD ×5, CSSDA SOTD ×5, Honorable Mention ×8, Typography
  Honors ×2, Independent of the Year Nominee) → Our principles ("Outcomes first,
  taste second" / "All in or nothing" / "Human-first, always" / "Intention over
  speed") → Contacto/footer.

## Primer vistazo / loader

- No se capturó una pantalla de loader dedicada (el capturador entra tras
  `load`), pero el patrón es claro: **fondo negro cálido + entrada de contenido
  animada**. El hero abre con un **globo wireframe WebFR (three.js)** girando
  al centro, la bajada de misión debajo, y el **wordmark gigante "MONOLOG"
  entrando desde el borde inferior** (sangra fuera de viewport).
- El fondo es una **fotografía cinematográfica desenfocada** (paisaje/duna en
  penumbra) con **grano visible + trama de puntos (halftone)** en la zona superior
  → sensación de "impreso/analógico", no de gradiente CSS plano.
- Nav fijo desde el frame 0: logo (izq) · links centrados · **toggle de mute** +
  botón `Start a project ↗` (der). El mute confirma **diseño de sonido** en la
  experiencia.
- Lectura: limpio, oscuro, con una sola pieza 3D sutil (el globo) como acento —
  nada recargado, pregnancia por contraste (negro + tipografía enorme).

## Mecánica de scroll

- **Smooth-scroll con inercia (Lenis)** enganchado al ticker de GSAP: el scroll
  no es nativo, tiene lerp/easing. Nuestro `lenis.ts` hace exactamente esto.
- **Pin / sticky con ScrollTrigger**: el hero fija el wordmark "MONOLOG" mientras
  el contenido de abajo sube por encima (frames 00→01: el wordmark pasa de sangrar
  abajo a quedar pineado arriba detrás del siguiente bloque).
- **Scrub ligado al scroll**: el beat "WE CLOSE — THAT GAP" es una sección
  **pineada** donde la media central **escala y cambia** en función del progreso de
  scroll (no por tiempo). Frames 03 y 04 son el MISMO bloque con el media
  intermedio creciendo/rotando de pieza.
- **Transiciones de página (Barba)**: navegación entre Work/Process/etc. sin
  recarga dura, con animación de entrada/salida.
- **Cambio de tema por scroll**: corte duro de sección oscura (`#080807`) a
  sección crema (`#e9e9e6`) al llegar a "Success Stories" (frame 05). El sitio
  reencuadra su paleta según la sección — paralelo directo a nuestras "ediciones".

## Animaciones clave (qué + cómo)

- **Wordmark gigante que se pinea** (qué: "MONOLOG" a sangre entra desde abajo y
  queda fijo detrás del contenido / cómo: ScrollTrigger `pin` + translate en Y
  ligado al progreso).
- **Reveal de párrafo por caracter/línea con degradé de tinta** (qué: el statement
  del founder revela y la última palabra queda con un gradiente que se desvanece,
  ".understood" / cómo: **SplitText** por caracter + stagger + máscara de opacidad;
  consistente con GSAP SplitText).
- **Slider/carrusel de statement** (qué: contador "02/02" + flechas ← → / cómo:
  timeline GSAP + Flip para reordenar; navegación manual además del scroll).
- **Globo wireframe 3D** (qué: esfera de meridianos finos rotando / cómo: three.js
  canvas WebGL, geometría de líneas, rotación continua en el rAF).
- **Grid de logos con entrada escalonada** (qué: "Brands we've helped", 8 logos /
  cómo: ScrollTrigger batch + stagger de opacidad/translate al entrar en viewport).
- **Media inline que crece entre palabras** (qué: "WE CLOSE [img] THAT GAP", la
  imagen intermedia escala y cicla piezas / cómo: sección pin + scrub sobre
  scale/clip; posible **Flip** para el swap de piezas).
- **Bullet holográfico/iridiscente** como marcador de sección ("Brands we've
  helped", "Success Stories") — punto con relleno gradiente animado (único golpe de
  color en un sitio casi monocromo).
- **Stat chips resaltados** (qué: "$2M+", "58%", "$100K+", "15+" en cajitas de
  highlight / cómo: reveal simple al entrar, refuerzan el dato duro por caso).
- **Toggle de sonido** en el nav (diseño de audio, prob. vía odyn.dev).
- **Cursor**: probable cursor custom/magnético (habitual en este tier), **no
  confirmable** en capturas estáticas.
- `prefers-reduced-motion`: no verificable desde stills.

## Patrones de layout (grid, tipografía, escala, espaciado, color)

- **Grid asimétrico**: bloques usan mitad de ancho con la otra mitad vacía (logos
  a la derecha, statement a la derecha con label a la izquierda). El vacío es
  compositivo, no relleno.
- **Escala tipográfica de contraste brutal**: micro (nav 17.75px, labels mono ~11px)
  vs. display gigante (wordmark y "WE CLOSE THAT GAP" que cruzan todo el ancho).
  No hay escalones intermedios grandes — o susurra o grita.
- **Tipografía única (Khteka)** en toda la jerarquía; el peso y el tamaño hacen el
  trabajo, no cambiar de familia. Números y contadores en tratamiento **monoespaciado
  tabular** ("02/02", "01/05", "ss ←—01/05", "VINAMILK").
- **Color**: monocromo cálido. Negro `#080807`, tinta crema `~#eae8e2`, sección
  clara `~#e9e9e6`. Cero acento cromático de UI salvo el **bullet holográfico**.
  El color entra SOLO por la imagen editorial (campera azul, floral rosa/mostaza,
  film-still cálido). Las cajas de stat son highlights gris claro.
- **Textura**: grano + trama de puntos sobre fondos → estética "impresa".
- **Etiquetas de sistema**: marcadores tipo "ss ←—01/05", contadores por ítem,
  prefijos cortos → lenguaje de "ficha técnica/editorial" muy afín a nuestra idea
  de espécimen.
- **Espaciado**: aire generoso, secciones a pantalla completa, ritmo pausado.

## Recorrido frame por frame

- **00** (y=0): Hero. Nav fijo (logo · About/Work/Services/Process · mute + `Start a project`). Fondo foto cinematográfica desenfocada con grano/halftone. Centro: globo wireframe 3D + bajada de misión. Abajo: wordmark "MONOLOG" gigante sangrando fuera del viewport.
- **01** (y=765): El wordmark gigante subió y quedó pineado arriba. Debajo, slider de statement a 2 columnas: izq. flechas ← →, "02/02", "30+ / Globally recognized awards (Awwwards, FWA, CSSDA)"; der. párrafo grande del founder con última palabra en degradé + avatar "Huy (By Huy) Nguyen, Founder, MONOLOG".
- **02** (y=1530): El avatar del founder se va hacia arriba; entra "Brands we've helped" (bullet holográfico) con grid 2×4 de logos monocromos alineados a la derecha (Vinamilk, Moc Chau, Univ. Sydney, OH, Supersolid, SLIK, Mammoth Murals, Backhouse) con labels en mono-caps.
- **03** (y=2295): Beat pineado "WE CLOSE [media] THAT GAP": entre las palabras, una imagen chica (mural azul con círculo rojo). Abajo, copy centrado "Your website is where ideal customers decide…".
- **04** (y=3060): Mismo beat, más avanzado: la media intermedia CAMBIÓ (retrato con capucha rosa + campera azul) y creció — evidencia de scrub sobre scale + swap de piezas. Mismo copy debajo.
- **05** (y=3825): Corte duro oscuro→crema. "Success Stories" (bullet holográfico). Caso 01/05: imagen apaisada (OH Architecture, casa moderna) + columna der. con título, descripción y chip "$2M+ / In project enquiries generated within 3 months of launch".
- **06** (y=4590): Sigue en tema claro. Caso 02/05 "Supersolid": film-still cálido de un tipo + stat "58% / Increase in average session duration". Empieza 03/05 "Mammoth Murals" (floral rosa granulado).
- **07** (y=5355): "Mammoth Murals" con chip "$100K+ / In new work within 30 days of launch". Caso 04/05 "HISS (University of Sydney)": imagen editorial de manos (rosa/marrón) + stat "15+ / Global universities united on a single platform".

## Qué robar para nuestro concepto

Traducción a "Ediciones" / sitio-como-video / carga que construye:

1. **Nombre que se gana, no que grita**: el `h1` real es diminuto (17.75px) y el
   "MONOLOG" enorme es puro grafismo. Nuestro DESTINO pide exactamente esto —
   masthead/firma chica; que la escala grande sea textura/plancha, no el nombre.
2. **Fondo con grano + trama de puntos (halftone)** para la sensación "impreso":
   ya lo tenemos en `halftone.ts`. Reforzar la idea de que el fondo del hero sea
   una plancha texturada, no un gradiente CSS. Consistente con nuestra firma duotono.
3. **Pin + scrub donde una pieza crece/cambia entre palabras**: el beat "WE CLOSE
   [media] THAT GAP" es el molde ideal para contar las **etapas del trabajo**
   (ideación → maquetado → programación → producto): una sección pineada donde el
   contenido central se "compone" con el progreso de scroll. Encaja con `tirada.ts`
   (ScrollTriggers scrub) y con la mecánica de convergencia a registro del halftone.
4. **Reveal de texto por caracter con degradé de tinta** (SplitText): la última
   palabra que se termina de "secar" es 1:1 con nuestra metáfora de tinta/secado.
   Usarlo con moderación en un statement clave, no en todo.
5. **Cambio de paleta por sección ligado al scroll** (oscuro → crema): valida
   nuestro sistema de ediciones/temas. Su corte es duro; nosotros podemos hacer el
   barrido (`tema.ts`) como transición "prolija sin sobrecargar".
6. **Lenguaje de ficha técnica**: contadores tabulares ("01/05"), labels mono-caps,
   marcadores "ss ←—", bullets de sección. Refuerza el aire de "espécimen/edición"
   que ya cultivamos en `especimen.astro`.
7. **Monocromía + color solo en la imagen**: UI casi sin acento cromático; el color
   entra por las piezas. Disciplina útil para no caer en "plantilla IA" —
   dejar que el trabajo (screenshots reales) ponga el color.
8. **Grid asimétrico con vacío compositivo**: mitad de pantalla vacía a propósito.
   Da respiración y pregnancia sin adornos.
9. **Un solo objeto 3D sutil** (el globo wireframe) como acento, no como
   espectáculo. Si sumamos WebGL, que sea un gesto (p.ej. la "prensa" o el retrato
   en halftone componiéndose), no un parque de partículas.
10. **Diseño de sonido opcional con toggle de mute**: gancho de detalle; evaluable,
    pero siempre con opt-out visible como ellos.

**Qué NO copiar**: es Webflow + jQuery con GSAP por CDN; nosotros somos Astro con
motion modular en `src/scripts/` — la arquitectura es nuestra, sólo tomamos el
vocabulario visual/motion. Y evitar el wordmark gigante como cliché: robamos la
IDEA (escala como grafismo) sin repetir su ejecución literal.

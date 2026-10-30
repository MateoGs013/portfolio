# Rediseño 2026 — Plan

> **Dirección radical vigente (30-oct-2026): Movimiento.** Prototipo en `movimiento.html` (http://localhost:4321/docs/rediseno/movimiento.html). Lo memorable es el movimiento; la UX es la de un portafolio convencional (inicio, obra, caso, sobre mí, contacto en el pie). Referencias: brandonyasin.com, danielebuser.com, dennissnellenberg.com. Regla única: **lo que tocás se transforma en la página** (view transitions con elementos compartidos, nunca telones): la palabra del menú se vuelve el título gigante, la tarjeta o la fila se vuelven el caso (título e imagen), el "Siguiente" se vuelve el caso siguiente, y en la primera visita el nombre del loader viaja hasta el nombre del inicio. Piezas: loader de una sola vez, nombre monumental por letras, lista con vista previa que sigue al cursor, galería horizontal movida por el scroll vertical (con inclinación por velocidad y parallax interno), caso con captura enmarcada que crece hasta el borde, columna fija y textos que entran por líneas, frase que se enciende palabra por palabra al leerla, imanes y email que rueda al copiarse. Mateo va a sumar capturas y videos por proyecto: las imágenes del cuerpo del caso son recortes de la portada hasta entonces.
>
> **Descartado: La costura.** Prototipo en `costura.html`, se conserva como registro.
> Cada pantalla tiene dos caras superpuestas al píxel: el **diseño** (oscuro, cinematográfico, portadas a pantalla completa con la temperatura de cada obra) y el **registro** que lo construye (papel técnico, campos tipados, `NULL` a la vista). **El único control es el scroll:** cada escena aparece como diseño; al seguir bajando se fija y una línea la cruza de derecha a izquierda, dejando ver cómo está hecha; después sigue la próxima. Los títulos grandes cruzan la línea, así que la misma palabra se lee en General Sans de un lado y en código del otro. Sin movimiento, las dos caras se muestran una debajo de la otra.
> Se probaron dos versiones: con el cursor ("la UX es muy compleja") y con el scroll ("me sigue pareciendo complejo e innecesario"). Lección: el visitante no tiene que aprender ni entender un concepto; la estructura es la de siempre y la diferencia está en el oficio del movimiento.

> **Implementación.** Las reglas vigentes del sitio público (vocabulario de movimiento, tokens, tipografía, anclas del DOM, Hiperfoco, política de movimiento, teclas y rutas) viven en [`docs/diseno.md`](../diseno.md), que es la fuente única. Este plan conserva el razonamiento y las referencias; si algo de acá contradice a `docs/diseno.md`, gana `docs/diseno.md`. El plan por olas está en `implementacion.md` y los paquetes en `paquetes.json`.

Demo navegable: `node docs/rediseno/serve.mjs` → http://localhost:4321 (o la configuración `rediseno-demo` de `.claude/launch.json`). Usa el contenido real exportado de la API (`demo-data.js`), así que lo que se ve es lo que hay en Postgres hoy.

---

## 1. La tesis

**Minimalista en lo que se ve, preciso en lo que se toca.**

La página tiene poco: tipografía, aire, una línea de 1px y un solo color de acento. Lo memorable no está en la decoración sino en cómo responde todo lo que se toca. Cada respuesta tiene un significado: se mueve lo que cambia y nada más.

El rasgo propio que nadie más tiene es este: **cada página es un registro de la base y se puede dar vuelta.** Con `R` (o el botón «Velo como registro»), los mismos nodos del DOM viajan con FLIP desde la composición editorial hasta una tabla de campos tipados (`title string`, `status enum ProjectStatus`, `techs relation → Tech[]`, `NULL` a la vista). No es otra página ni una superposición que tapa el sitio. Es la metamorfosis in situ que se buscó en la Fase 6 de "Dos Mundos", ahora en el lugar correcto: una herramienta, no una tesis aparte.

Así se resuelve la contradicción que generó la discordia entre archivos:

| Lo que pedía explorer.md | Lo que pedía AGENTS.md | Cómo lo resuelve el rediseño |
|---|---|---|
| Tinta sobre papel, la estructura del dato es la decoración | Micro-interacciones Bencho, efecto Awwwards | Superficie sobria y un **vocabulario** chico de micro-interacciones con oficio |
| Explorador: ruta = estado, teclado, facetas | Landing con hero, obras, contacto | La landing es la *lectura editorial*; el explorador es la *forma de navegar* y el modo registro |
| Cero ornamento | Sonido, física, sparks, globo | Sonido opcional y apagado; física solo donde algo se mueve de verdad; sparks y globo al `/lab` |

---

## 2. Referencias y qué se toma de cada una

Revisadas en vivo el 30-oct-2026. Lo marcado *sin verificar* viene de Awwwards y no se vio funcionando.

| Sitio | Qué se toma | Qué no |
|---|---|---|
| **rauno.me** (Rauno Freiberg) | "Copied" en el mismo lugar del email; un indicador de posición mínimo | Cruces `+`, secuestro del scroll |
| **emilkowal.ski** | Popovers que entran desde `scale .9–.98`, nunca desde 0; hover solo con `(hover:hover) and (pointer:fine)` | — |
| **paco.me** (cmdk) | Que un modo de lectura sea un interruptor de una tecla. Se conserva el **Hiperfoco** existente (`H`): monocromo, columna de lectura y movimiento ambiental apagado | Desenfocar y atenuar lo que no está bajo el cursor (se probó en la demo y se descartó); el cubo 3D en las letras |
| **samuelkraft.com** | Atenuar los hermanos de una lista al apuntar uno | — |
| **benji.org** | La entrada animada ocurre **solo en la primera visita** (`home-visited`) | — |
| **brianlovin.com** | `Ctrl+K` "Jump to…" sobre todas las páginas y registros | El volumen de secciones |
| **jakub.kr** | Una sola clase de transición para todo lo interactivo; guard de `prefers-reduced-motion` en cada animación | — |
| **ibelick.com** | Filas que entran con `scale .985→1` y texto que sube bajo máscara | — |
| **lochie.me** | Morph de texto letra a letra, usado en *un* solo campo | Pantalla vacía sin obra |
| **danielebuser.com** | Titular enorme con una sola marca de color (`'26`) | Columnas tenues de fondo |
| **dennissnellenberg.com** | La lista de obra con la imagen que sigue al cursor | El preloader en cada visita |
| **dragonfly.xyz / bymonolog / wembi** | Lenis, view transitions, una afirmación por pantalla, `Esc` para cerrar | Canvas, grano, 3D |
| **jonhowell.com** | Quizá un único easter egg en el pie (*sin verificar*) | Cursores y clicks "explosivos" |

### Segunda ronda: inmersión visual sin WebGL (30-oct-2026)

| Sitio | Técnica | Qué se toma |
|---|---|---|
| **kaiblamey.com** (Kai Blamey Nguyen) | La lista de títulos elige qué video llena la pantalla de fondo | La lista de Obra como selector de escena, sin secuestrar la rueda y con URL por obra |
| **brandonyasin.com** (SOTD 24-oct-2026) | La tarjeta se convierte en el hero del caso; en el caso, columna fija a la izquierda y contenido que avanza | El rótulo de cada bloque fijo mientras su texto avanza; el morph ya lo teníamos con view transitions |
| **felixpeault.com** | Escenas fijas apiladas, cada serie con su propio gradiente | La temperatura por obra |
| **noth.in** (SOTD 10-ago-2026) | Parallax por capas: el marco y la imagen interna se mueven con distinto ritmo | La siguiente obra como escena con profundidad |
| **ol.studio**, **slavvitanov.com** | Descripción fija junto a una columna de imágenes; ritmo entre vacío y portada grande | Confirma el caso a dos columnas con rótulo fijo |
| **maximiliankaspar.com**, **gregorylalle.com** | Tipografía a escala del contenedor (~7,8vw); índice fijo de proyectos | Ya está cubierto por los títulos grandes y el índice de campos |

Se descartaron por WebGL o canvas a pantalla completa: Pacôme Pertant, Jesper Landberg, Henri Heymans, Local Studio, Olha Lazarieva, Mathias Adolfsson y Studio Null. También quedó afuera la galería horizontal infinita de Brandon Yasin (secuestra la rueda).

**Patrones comunes:** un solo gesto de entrada; duraciones de 140–300 ms (hasta 850 ms solo para cambios de layout grandes); el movimiento se gasta en lo que se lee; la interacción memorable es una herramienta (paleta, copiar, filtros); un único acento; respeto a `reduced-motion` y a `hover:none`.

---

## 3. Vocabulario de interacción

Seis verbos. Todo lo que se mueve en el sitio es uno de estos; si algo no entra en ninguno, no se agrega.

| Verbo | Dónde | Especificación |
|---|---|---|
| **Transformar** (FLIP) | Modo registro · filtros de colección · portada compartida al abrir un caso | Registro: ver la especificación de abajo. Filtros: 600 ms `expo.out`, con los que entran subiendo 10 px. Portada: view transition de 750 ms desde la vista previa hasta la imagen del caso |
| **Deslizar** | Navegación · filtros · paleta | Un solo rectángulo de resaltado que viaja entre opciones (300 ms `power3.out`); aparece sin viajar la primera vez |
| **Rodar** | Métricas · conteos · copiar email | Los números cuentan al entrar en pantalla (1,2 s, una sola vez); el conteo de una colección rueda al filtrar (500 ms); el email se cae letra por letra a "copiado" y vuelve (stagger de 12–25 ms) |
| **Seguir** | Listas de obra (solo puntero fino) | Vista previa 16:10 que sigue al cursor por la derecha con un lerp de 0,16, gira hasta ±7° según la velocidad y cambia de imagen deslizando una tira vertical (600 ms) |
| **Asomar** | Tecnologías y métricas de un caso | Un popover que crece desde su ancla (`scale .96→1`, blur de 2 px a 0, 260 ms `expo.out`). Si ya está abierto y pasás a otra ancla, viaja hasta ella y cambia de tamaño en el camino (340 ms), sin cerrarse y volver a abrirse. Se ubica debajo de todo el valor, así no tapa a los vecinos de la lista |
| **Atenuar** | Solo hover en listas | Los hermanos bajan a .25 (500 ms). No se usa para leer: el modo de lectura es el Hiperfoco (`H`) |

### La transformación diseño ↔ registro, en detalle

Es la interacción firma, así que tiene su propia especificación (implementada en `morph()` de la demo; `__morph.pause().progress(.4)` en la consola la congela en cualquier cuadro).

**Principio:** ningún texto cambia de ancho mientras viaja, así que nunca se ve reacomodándose línea por línea. Cada nodo elige una de tres técnicas.

1. **Viaje (valores de una línea, misma familia tipográfica):** FLIP solo con `transform`. Traslación más escala uniforme según la razón de `font-size`, alineando la línea de base aproximada y no la caja. El color y el peso (General Sans es variable) se interpolan en el camino.
2. **Fantasma (valores que cambian de cortes de línea, de familia o de contenido, como "En producción" → `LIVE`):** un clon con el aspecto anterior viaja y se escala hasta el lugar nuevo mientras se apaga (del 12 % al 46 % del recorrido). El nodo real aparece recién después (del 50 % en adelante). Se disuelve *a través*, nunca hay dos textos legibles a la vez.
3. **Imágenes:** FLIP con escala en X e Y.

**Acompañamiento, de diseño a registro (~1,3 s):**
- **0–0,3 s.** Los ornamentos se apagan como fantasmas y suben 6 px. La página se ancla al primer valor visible para que nada salte.
- **0,05 s.** Arrancan los valores, de arriba hacia abajo, con 14 ms entre cada uno y un tope de 220 ms. Duran 0,95 s con `expo.inOut`.
- **0,18 s.** Las líneas de la tabla se trazan de izquierda a derecha (`--rs` de 0 a 1, 0,85 s `expo.out`), una por fila con 22 ms de separación: primero se raya la tabla y después se llena.
- **Llegada de cada valor.** Los rótulos de su fila (nombre y tipo del campo) se descubren con una máscara de izquierda a derecha cuando el valor de esa fila va por la mitad del viaje. Así el rótulo nunca aparece antes que su dato.
- **0,75 s.** Llegan las comillas de los strings.

**De registro a diseño:** los rótulos se tapan hacia la derecha, las líneas se recogen hacia la derecha, los valores vuelven y los ornamentos suben 10 px a partir de 0,5 s.

**Reglas fijas:**
- Mientras dura, una segunda pulsación de `R` se ignora.
- Con `prefers-reduced-motion` el cambio es instantáneo.
- La URL cambia al instante (`?vista=registro`); la animación es solo la lectura del cambio.

### Detalles de continuidad

Cada uno usa los verbos de arriba y hace visible algo de la base de datos. Todos están en la demo.

| Detalle | Qué pasa | Por qué |
|---|---|---|
| **El título que se abre** | Al hacer click en una fila de obra, su título se transforma en el título del caso (view transition `title`, 720 ms). Si la vista previa estaba abierta, la imagen se transforma en la portada (`cover`) | Abrir un registro se siente como abrirlo, no como cambiar de página |
| **La faceta que viaja** | En un caso, tocar una tecnología o el estado lleva a la obra filtrada (`/projects?stack=gsap`). La palabra tocada vuela hasta el filtro activo (`facet`). La cabecera del registro dice `where techs ∋ gsap` | "Facetar es tocar un valor", con la relación hecha gesto |
| **Asomar la relación** | Pasar el cursor por una tecnología muestra su categoría, desde cuándo la usás, tu criterio (`note`) y **en qué otras obras está**. En una métrica muestra qué mide | La relación y el significado sin salir de la página |
| **Índice de campos** | En el caso, un minimapa de rayas a la derecha (≥1180 px), una por campo con contenido. Al apuntarlo aparecen los nombres de campo (`brief`, `steps`, `metrics`), el activo se alarga y toma el acento, y un click desliza hasta ahí | El registro como mapa; el guiño de datos para quien lo busca |
| **Máquina del tiempo** *(fuera: no hay página Stack)* | En Stack, una barra de años. Al arrastrarla, lo que todavía no usabas se apaga y baja, lo que ya usabas sube a su lugar (FLIP de 700 ms), el conteo rueda y el año cambia rodando. La URL guarda `?hasta=2024`. Con sonido, el tono sube con los años | Cuenta tu crecimiento con los datos de `since`, sin un párrafo |
| **La ruta que rueda** *(fuera: no hay barra inferior)* | Cuando cambia la query (filtro, vista, año), sus caracteres suben en la barra de estado, uno tras otro | La ruta es el estado, y se ve cambiar |
| **Resaltado de teclado** | Con `j`/`k` o Tab, una barra se desliza detrás de la fila enfocada. Solo con foco visible (teclado), no con mouse | Quien navega con teclado recibe el mismo cuidado |
| **Scroll con inercia** | Lenis (`lerp .11`) sobre el ticker de GSAP. Apagado con reduced motion. La paleta lo pausa mientras está abierta | Es la materia de tus referencias (dragonfly, wembi, monolog) |

**Reglas del presupuesto:**
- Una sola entrada animada, en la home, en la primera visita de la sesión. El texto nunca nace invisible ni borroso: sube desde una máscara, así el LCP se pinta enseguida.
- Cada verbo tiene equivalente de teclado: `R`, `H` (Hiperfoco), `Ctrl/⌘ K` o `/`, `j`/`k`, `Esc` y `Backspace` para subir, `Enter`.
- Con `prefers-reduced-motion` todo llega a su estado final sin animar, y la vista previa no tiene lerp.
- En táctil (`hover:none`) no hay vista previa: las filas muestran una miniatura.
- **Sonido:** opcional, apagado por defecto, con un tic de 70 ms. Suena solo en los cinco verbos. Se activa desde la paleta.

**Sale del sitio público** (pasa a `/lab`, se borra si nadie lo usa): `UiClickSpark`, `UiBorderBeam`, `UiDecryptedText`, `UiThinkingTrace`, `UiDotGlobe`, `UiHubDiagram`, `UiHoloCard`, `UiSpotlightCard`, `UiRouteLoader`, `UiProgressiveBlur`, el reloj con segundos, el porcentaje de scroll y los avatares "MS PG AI". Hay 10 componentes `Ui*` que hoy no se usan fuera del lab.

---

## 4. Sistema visual

### Color
| Token | Oscuro (por defecto) | Claro | Uso |
|---|---|---|---|
| `--bg` | `#0b0b0c` | `#f1f2f2` | fondo |
| `--surface` | `#141416` | `#e6e7e8` | paleta, placas sin portada |
| `--ink` | `#ededee` | `#121315` | texto principal |
| `--dim` | `#a1a1a9` | `#55565d` | texto secundario |
| `--faint` | `#83838c` (≈5:1) | `#66676e` (≈5:1) | tipos, metadatos. **Hoy `#71717a` da 4,1:1 y no pasa AA** |
| `--rule` | `rgba(255,255,255,.085)` | `rgba(0,0,0,.1)` | líneas de 1px |
| `--sig` | `#ff3e00` | `#ff3e00` | **solo** el cuadrado del nombre, el estado activo (subrayado de 1px), el foco y la query en la ruta |

### Tipografía
- **General Sans** para todo lo que se lee. **Martian Mono** solo para lo que de verdad es un identificador: nombres y tipos de campo, la ruta, slugs, `kbd`. Bebas sale del sistema.
- Seis tamaños, en tokens: `xs .8125` · `s .9375` · `m 1.0625` · `l 1.375` · `xl clamp(1.6, 3vw, 2.25)` · `hero clamp(2.6, 6.6vw, 6)` rem. Se terminan los `text-[10.5px]` y `[12.5px]` sueltos.
- Titulares en 540–560 con tracking de −0,02 a −0,042 em; cuerpo en 420.
- **Sin etiquetas en mayúsculas espaciadas** y sin numeración "01 /". Los rótulos de sección van en sans, en minúscula de oración y en `--dim`.

### Espacio y forma
- Un margen lateral `clamp(1rem, 4vw, 3rem)`, un ancho máximo de 80 rem y secciones separadas por `clamp(5rem, 15vh, 9rem)`.
- Sin tarjetas ni cajas dentro de cajas: listas sobre líneas de 1px. Radio de 4–6 px solo en imágenes, botones de la barra y paleta.

### Inmersión visual

La superficie sigue siendo sobria. La inmersión sale de la imagen y del color de cada obra, no de decoración agregada.

- **Temperatura por obra.** Cada portada tiene un color característico (`Media.tint`), y el fondo de toda la página toma un 8 % de ese color (5 % en tema claro) con una transición de 1,2 s. Así La Rúcula se siente cálida, ARG Piscinas y Ynara frías y Barberpole roja, sin que cambie ningún token. En las listas, pasar el cursor por una obra anticipa su temperatura al 75 %. Técnica: `@property --tint` y `--tint-amt` registradas como `<color>` y `<percentage>` para que el navegador pueda interpolarlas, y `color-mix()` sobre `--bg`.
  - *Cómo se calcula:* cuantizar la imagen a 8 colores, quedarse con el de mejor relación entre saturación y peso, y normalizarlo a luminosidad media. En el sitio real lo calcula el admin con un `canvas` al subir la imagen (el servidor hoy solo lee las dimensiones de los encabezados, sin dependencias) y se guarda en `Media.tint`. Los colores de la demo salieron de `public/media/projects/` con el mismo algoritmo.
- **La portada que se abre.** En el caso, cuando la portada llega arriba, la escena se fija durante un 85 % de pantalla de scroll. En ese tramo la imagen pasa del ancho de la columna, con radio de 4 px, a cubrir toda la pantalla, mientras se aleja de 1,14× a 1×. Al final aparece su texto alternativo como pie de foto. Técnica: ScrollTrigger con `pin` y `scrub` sincronizado con Lenis, `clip-path: inset()` calculado en las coordenadas de la imagen escalada para que lo visible abra parejo y `power2.inOut` sobre el progreso.
  - *Cuándo no:* sin movimiento, con puntero táctil o por debajo de 768 px la portada queda estática en la columna.
  - *Con el modo registro:* la escena se desarma antes de transformar (sin mover lo que estás mirando) y se rearma al volver.
- **La lista como selector de escena (Obra).** En la colección, apuntar una obra (con mouse o con foco de teclado) llena el fondo con su portada: desenfocada 5 px, al 42 % y entrando desde 1,12× en 1,2 s. Un degradado desde el color de la página deja la lista siempre legible del lado izquierdo, y la temperatura acompaña. Al hacer click, ese fondo se transforma en la portada del caso. En la home se mantiene la vista previa chica que sigue al cursor: cada página tiene un solo gesto de imagen.
- **Rótulos fijos.** En el caso y en Sobre mí, el rótulo de cada bloque ("Proceso", "Resultado") queda fijo a 5 rem del borde mientras su texto avanza. En mobile vuelve a ser estático.
- **La siguiente obra como escena.** El cierre del caso es una escena a pantalla completa con la portada de la próxima obra en profundidad: la imagen se mueve más lento que su marco, de −10 % a 6 %. Mientras entra, la temperatura de la página pasa de una obra a la otra (por ejemplo, de ARG Piscinas a Ynara), así que el cambio de obra empieza antes del click. El título y la portada viajan al caso siguiente con view transitions. Una sombra fuerte abajo garantiza que el texto se lea sobre portadas claras.

---

## 5. Páginas

Las rutas reales se mantienen (`/projects`, `/projects/:slug`, `/about`) para no romper links ni SEO; `/stack` redirige a `/projects?stack=`. La demo usa rutas con hash en español solo por comodidad. El mapa completo está en `docs/diseno.md` §8.

**Cabecera (en todas las páginas):** la del prototipo `movimiento.html`: el nombre a la izquierda y Obra, Sobre mí y Contacto a la derecha. Las acciones que esta versión ponía en una barra inferior (idioma, tema, Hiperfoco e «Ir a») van en la cabecera. No hay barra inferior: la ruta sigue siendo el estado sin necesidad de dibujarla, y la disponibilidad con la hora local va en el pie de contacto.

**Home**
- Nombre y rol chicos. Un titular grande con una afirmación concreta (campo nuevo `about.headline`, ver §6). Disponibilidad y ubicación.
- Obra destacada (`featured`) como lista con vista previa.
- Contacto con el email grande que se copia.
- Nada escrito a mano en el componente: todo sale de `about`, `contact` y `projects`.

**Obra (`/projects`)**
- Título con conteo, una línea de contexto y filtros de estado como facetas (`?status=live`) que transforman la lista.
- En modo registro, la carpeta se vuelve tabla: `title · slug · status · year`.

**Caso (`/projects/:slug`)**
- Orden de lectura: título → resumen → rol, año, cliente, estado y stack (cada tecnología enlaza a `/projects?stack=`) → portada → encargo → proceso → resultado → métricas → links.
- Al final, "Velo como registro" y la **siguiente obra en grande**, con vista previa.
- Los campos vacíos no se ven en diseño y aparecen como `NULL` en registro.

**Stack: sin página** (decisión de Mateo, 30-oct-2026, como en el prototipo aprobado). Las tecnologías facetan la obra: cada una enlaza a `/projects?stack=<slug>`, y en el caso su `note`, desde cuándo se usa y **en qué otras obras está** se ven con «Asomar». `/stack` y `/stack/:slug` redirigen con 301.

**Sobre mí**
- `engineering_philosophy` como texto principal, cuatro datos (formación, estudios, idiomas, modalidad), objetivo y trayectoria (`experience`).
- Links a los PDF del CV en ES y EN (uno ATS por idioma).
- El CV se abre desde acá en `/about?cv=ats`, solo en Harvard ATS. El visor «IDE» y `/lab` se archivan en `docs/archive/lab/`.

---

## 6. Datos y contenido

1. **El contenido sale de Postgres y de ningún otro lado** (invariante 1). Hoy está copiado en `ExplorerHome.vue` (obras a mano), `CvHarvardAts.vue` y `CvContainer.vue` (ubicaciones a mano), `app/lib/fallbackData.ts`, `server/src/fallbackData.ts`, `fallbackContentData.ts` e `i18n.ts`.
2. **El fallback se genera, no se escribe.** Un script exporta un snapshot JSON desde la base (como `demo-data.js`), y el server lo usa si la base no responde. Se mantiene la resiliencia sin una segunda copia mantenida a mano.
3. **Cambios de schema** (con `prisma migrate dev` y `fieldMeta.ts` en el mismo commit):
   - `about.headline` (string): la afirmación del hero.
   - `Media.tint` (string, hex): el color característico de la imagen, calculado por el admin al subirla.
   - `metrics` con origen: `{ value, source, measuredAt }` o un `metricsSource` + `metricsMeasuredAt` por proyecto, para que cada número diga de dónde sale.
4. **Errores de contenido que corregir ya:**
   - **Ubicación.** El footer, el globo y el contacto dicen Paraná (31.73° S 60.52° W, que es Entre Ríos). La barra y el CV dicen Río Negro y algunas entradas del CV dicen Buenos Aires. Hay que dejar una sola, la del Doc `contact.location`.
   - **La Rúcula muestra "PostgreSQL 17 · latencia sub-100ms"** y el proyecto es Vue + Vite. Esa línea se borra.
   - **Numeración repetida** ("01 / Síntesis" y "01 / El encargo"), el menú mobile que dice "PROJECTS" con el sitio en español, el header mobile que se pisa con ES/EN y el título cortado en el diagrama ("LA RÚCULA GA").
   - **`about.availability_status` dice "DISPONIBLE // Búsqueda…".** Es un tell de consola; pasa a texto llano.
   - **El registro de Eros describe otro proyecto.** La base de producción dice "director creativo autónomo… vault de Obsidian"; el seed ya tenía "Eros Career OS", pero producción nunca se recargó. Mateo aprobó el 30-oct-2026 el texto de **asistente de carrera**: ya está en `server/src/seed.ts` (resumen, encargo, cuatro pasos y un resultado que suma los datos de despliegue del seed). Para la base existente: `pnpm tsx server/src/patches/2026-10-30-eros-barberpole.ts`, que solo toca Eros y Barberpole (el seed borra todo y pisaría lo editado desde el admin).
   - **La URL de Barberpole está vieja.** La base tiene `parcial-2-peluqueria.vercel.app`, que redirige a `barberpole-service.vercel.app`. La de producción es `https://turnos.mateogs.tech`: ya corregida en el seed y en el mismo parche.
   - **Producción está atrás del seed en general**, no solo en Eros: la API sirve 6 proyectos y el seed (y los datos de respaldo del admin) tienen más, como null-net y Lampone Terminal Noir. Antes de la fase R1 hay que decidir qué fuente manda y alinear las dos.
6. **Fuera de este repo, en La Rúcula:** `/menu/carta`, `/menu/bebidas` y el resto de `/menu/:categoría` devuelven 404 si se abren directo (desde un QR, un buscador o un link compartido). Navegando desde `/menu` sí funcionan, así que falta el *fallback* del servidor para esas rutas.
5. **Inglés:** las traducciones viven como campos de la base (`*_en` o una tabla de traducciones), no en `i18n.ts`. Decisión de modelado dentro de la Fase R1.

---

## 7. Fases

Cada fase se cierra con `pnpm typecheck` y `pnpm lint` en cero, revisión local en el navegador y capturas antes/después. **Push solo con tu OK**; después se audita en producción.

| Fase | Qué | Terminado cuando |
|---|---|---|
| **R0 · Fuente única** | Nace `docs/diseno.md` con §3 y §4 de este plan. `.claude/rules/explorer.md` se recorta a lo estructural y apunta ahí. `AGENTS.md` (Gemini) apunta al mismo archivo y se borra `.agents/rules/architectural-guardrails.md`. Su "push antes de mirar" se reemplaza por local primero. Entrada en `docs/decisiones.md` con lo descartado | Claude y Gemini leen las mismas reglas y ninguna contradice a otra |
| **R1 · Datos** | Arreglos de §6.4, migración de `headline` y del origen de `metrics`, home y CV leyendo de la base, fallback generado por script, plan de traducciones | `grep` de nombres de proyectos y ubicaciones en `app/` da cero copias escritas a mano |
| **R2 · Tokens** | `@theme` de `base.css` con los tokens de §4; reemplazo de valores arbitrarios; contraste AA en los dos temas | No quedan `text-[Npx]` ni colores sueltos en `app/components` (salvo `/lab`) |
| **R3 · Shell** | Cabecera con idioma, tema, Hiperfoco e «Ir a» (sin barra inferior), paleta "Ir a" con resaltado que viaja, tema, `experimental.viewTransition` de Nuxt. Salen el route loader, el reloj con segundos, el % de scroll y el SFX encendido | Navegar entre las cinco páginas no muestra pantallas negras ni cargadores, y todo funciona con teclado |
| **R4 · Modo registro** | Componente `<Field>` (`k`, `type`, valor) y composable `useRecordView`. El estado vive en `?vista=registro` y el SSR lo renderiza directo (invariante 2). FLIP con GSAP Flip, respetando reduced motion | Cada página alterna entre diseño y registro sin saltos, y la URL con `?vista=registro` abre directo en registro y sin JS |
| **R5 · Páginas** | Home, obra, caso y sobre mí según §5. Se parten `ExplorerView.vue` (1197 líneas) y `ExplorerDetail.vue` (1147) | Cada archivo queda por debajo de 300 líneas y cada página coincide con la demo en 375, 768 y 1440 px |
| **R6 · Lab** | Los componentes de §3 que salen se mudan a `/lab` o se borran | Ningún componente del lab se importa desde las páginas públicas |
| **R7 · Piso de calidad** (la Fase 7 pendiente) | `/piso-calidad`: sin JS, solo teclado, lector de pantalla, reduced motion, CLS 0, 320 px. Capturas de referencia con Playwright de 5 páginas × 3 anchos × 2 temas. Lighthouse en producción, publicado como métrica del propio sitio | Cero bloqueantes; las capturas de referencia quedan versionadas |

El admin (`/admin`) queda fuera de este rediseño: tiene su propio Tailwind y sus reglas. Solo comparte los tokens de color si se decide.

---

## 8. Riesgos

- **El FLIP del modo registro en páginas largas.** Con `absolute: true` el layout queda fijo mientras viaja, pero hay que bloquear el alto del documento (la demo ya lo hace) y anclar el scroll. Se prueba en el caso más largo (Ynara).
- **View transitions + SSR de Nuxt.** El soporte es experimental. Si falla en algún navegador, se cae a un fundido simple sin romper nada.
- **Gemini puede volver a escribir reglas propias.** La Fase R0 deja una sola fuente; conviene que cada agente la lea por referencia, no copiada.

## 9. Decisiones

1. El texto del titular (`headline`): vive en la base (`about.headline`) y se edita desde el admin.
2. Visor de CV «Modern IDE»: **resuelto**, se archiva con `/lab` en `docs/archive/lab/`; el CV público es solo Harvard ATS más los PDF.
3. Tema por defecto: **resuelto**, oscuro, recordando la elección de cada visitante en una cookie.
4. Modo de lectura: **resuelto**, se conserva el Hiperfoco existente (`H`), revisado; ver `docs/diseno.md` §5.

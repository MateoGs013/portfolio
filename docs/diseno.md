# Diseño del sitio público

Fuente única de las reglas del sitio público: vocabulario de movimiento, sistema visual, contrato de anclas del DOM, Hiperfoco, política de movimiento, teclas y rutas. Claude (`CLAUDE.md`, `.claude/rules/`) y Gemini (`AGENTS.md`) leen este archivo por referencia; ninguna otra regla lo copia ni lo contradice. Si algo de acá choca con otro documento, gana este y se corrige el otro.

- **Referencia de look y de movimiento:** `docs/rediseno/movimiento.html` (prototipo aprobado). Se lleva a producción con acabado pulido, sin simplificarlo.
- **Transformación «ver como registro»:** la función `morph()` de `docs/rediseno/demo.html`.
- **Por qué y qué se descartó:** `docs/decisiones.md`. **Plan por olas:** `docs/rediseno/implementacion.md`.
- **Fuera de alcance:** la consola `/admin` tiene sus reglas en `.claude/rules/admin.md`.

## 1. La regla

**Lo que tocás se transforma en la página.** La estructura es la de un portafolio convencional (inicio, obra, caso, sobre mí, contacto en el pie) y lo memorable es el oficio del movimiento. Nada de telones: los elementos viajan. La palabra del menú se vuelve el título de la página, la fila o la tarjeta se vuelven el caso, «Siguiente» se vuelve el caso siguiente y, en la primera visita, el nombre del cargador viaja hasta el nombre del inicio.

El contenido sale entero de PostgreSQL vía la API. Los componentes no tienen texto de contenido escrito a mano; la interfaz (rótulos, estados, aria, etiquetas de métricas) vive en el diccionario `app/lib/dict/`, ES y EN.

## 2. Vocabulario de movimiento

Seis verbos. Todo lo que se mueve en el sitio es uno de ellos; si algo no entra en ninguno, no se agrega. `--e` es `cubic-bezier(.16, 1, .3, 1)` (el `expo.out` de CSS).

| Verbo | Qué es | Piezas y especificación |
|---|---|---|
| **Transformar** | Un elemento se convierte en otro sin cortar | **View transitions con elementos compartidos** (`title`, `cover`, `page-title`, `cv-sheet`): grupos de 0,95 s con `--e`. La página sale en 0,45 s `cubic-bezier(.7,0,.84,0)` hacia opacidad 0 y −4vh, y la nueva entra en 0,9 s `--e` desde +6vh, 0,08 s después. **Cargador → inicio:** las letras del nombre del cargador suben (`yPercent` 110 → 0, 1 s `expo.out`, 0,035 s por letra) mientras un contador 0 → 100 (abajo a la derecha, `--text-s`, cifras tabulares) y una barra de 2 px en `--sig` (`scaleX` 0 → 1) avanzan juntos en 1,5 s `power2.inOut`. A 1,6 s el nombre viaja con FLIP 1,15 s `expo.inOut`, con escala por la razón de `font-size`; contador y barra se apagan en 0,4 s, el fondo del cargador se vuelve transparente en 0,6 s (desde 0,55 s) y el resto del inicio aparece (opacidad 0 → 1, 1 s `power2.out`, desde 0,9 s, 0,08 s entre bloques). El nombre del cargador tiene su propio tamaño, `clamp(2rem, 5.4vw, 5rem)`, no `display-row`. **Captura que crece:** escala .88 → 1 y radio 6 px → 0 con scrub (de `top 85%` a `top 10%`) y la imagen adentro de 0 a −8 %. **Registro (R):** §2.1. **Filtros de obra:** FLIP de 600 ms `expo.out`, los que entran suben 10 px. **Temperatura:** el fondo toma el `tint` de la obra en 1,2 s |
| **Deslizar** | Algo entra o se desplaza por un carril | **Líneas que se revelan:** cada línea sube desde una máscara (`yPercent` 115 → 0, 1,15 s `expo.out`, 0,085 s entre líneas, desde `top 88%`). **Nombre por letras:** `yPercent` 110 → 0, 1 s `expo.out`, 0,035 s por letra en el cargador; en las visitas siguientes, 1,1 s y 0,025 s por letra. **Galería horizontal:** el scroll vertical mueve la pista con `pin` y `scrub: .8`, con barra de progreso de 1 px. **Tira de la vista previa:** 0,7 s `expo.out`. **Resaltado de la paleta:** un solo rectángulo que viaja 300 ms `power3.out`; la primera vez aparece sin viajar. **Scroll con inercia:** Lenis (`lerp .1`, el valor del prototipo) sobre el ticker de GSAP, con `lagSmoothing(0)` |
| **Rodar** | Dos estados apilados que se intercambian | **Texto que rueda** al apuntar o enfocar un enlace (dos copias apiladas, 0,6 s `--e`). **Email copiado:** las letras salen hacia arriba (0,45 s `expo.in`) y vuelven desde abajo (0,7 s `expo.out`), 12 ms entre letras, y se anuncia «Copiado». **Números:** el SSR trae el valor final; al entrar en pantalla cuentan desde 0 una sola vez (1,6 s `power3.out`; es ambiental, §6) y al filtrar ruedan 500 ms (respuesta a una acción) |
| **Seguir** | Algo acompaña al puntero o al scroll de forma continua | **Vista previa** de las filas del inicio: 16:10, lerp .14, 32 px a la derecha del cursor sin salirse de la pantalla, giro de ±8° según la velocidad, entra en 0,5 s `expo.out` desde escala .8 y sale en 0,35 s. **Burbuja «Ver caso»** sobre las tarjetas (5,5 rem). **Imanes:** el enlace se acerca al cursor (k .35; el email .12) y vuelve con `elastic.out(1, .4)` en 1 s. **Parallax:** imágenes ±6 % dentro de su marco, ±5 % en la galería, teléfonos a distinto ritmo por paridad, siguiente obra con la imagen más lenta que su marco. **Inclinación por velocidad** de las tarjetas: `skewX` hasta ±6°. **Palabras que se encienden** al leerlas: opacidad .16 → 1 con scrub, de `top 78%` a `bottom 42%` |
| **Asomar** | Algo aparece desde su ancla sin tapar | **Popover** de tecnologías y métricas en el caso: crece desde el ancla (`scale .96 → 1`, blur 2 px → 0, 260 ms `expo.out`); si está abierto y pasás a otra ancla, viaja y cambia de tamaño en 340 ms sin cerrarse. Se ubica debajo de todo el valor. **Video de la tarjeta:** se funde sobre la captura (0,6 s) cuando ya tiene cuadros |
| **Atenuar** | Solo hover en listas | Al apuntar una fila, sus hermanas bajan a .25 (0,5 s `--e`) y el título apuntado se corre 1,2 rem (0,7 s). En «Siguiente», el título se corre 1,5 rem (0,9 s). Solo con `(hover: hover) and (pointer: fine)` |

### 2.1 Ver como registro (R)

La transformación firma: los mismos nodos viajan desde la composición editorial hasta una tabla de campos tipados (`title string`, `status enum ProjectStatus`, `techs relation → Tech[]`, `NULL` a la vista). No es otra página ni una capa encima.

- **Principio:** ningún texto cambia de ancho mientras viaja. **Viaje** (una línea, misma familia): FLIP solo con `transform`, escala uniforme por la razón de `font-size`, alineado por la línea de base; color y peso se interpolan. **Fantasma** (cambia de cortes de línea, de familia o de contenido): un clon con el aspecto anterior viaja y se apaga del 12 % al 46 %; el nodo real aparece desde el 50 %. **Imágenes:** FLIP con escala en X e Y.
- **De diseño a registro (~1,3 s):** 0–0,3 s los ornamentos se apagan como fantasmas y suben 6 px, y la página se ancla al primer valor visible. Desde 0,05 s viajan los valores de arriba hacia abajo (14 ms entre cada uno, tope 220 ms, 0,95 s `expo.inOut`). Desde 0,18 s las líneas de la tabla se trazan de izquierda a derecha (`--rs` de 0 a 1, 0,85 s `expo.out`, 22 ms por fila). Los rótulos de cada fila se descubren con máscara cuando su valor va por la mitad del viaje. A 0,75 s llegan las comillas de los strings.
- **De registro a diseño:** los rótulos se tapan hacia la derecha, las líneas se recogen hacia la derecha, los valores vuelven y los ornamentos suben 10 px desde 0,5 s.
- **Reglas fijas:** la URL cambia al instante (`?vista=registro`) y el SSR la renderiza sin JS; una segunda R mientras corre se ignora; con `prefers-reduced-motion` el cambio es instantáneo; los clones llevan `view-transition-name: none`.

## 3. Sistema visual

### Color

Tema oscuro por defecto, recordado en la cookie `pf-theme`. Los tokens viven en `app/assets/css/tokens.css` bajo `:root[data-theme]`.

| Token | Oscuro | Claro | Uso |
|---|---|---|---|
| `--bg` | `#0b0b0c` | `#f1f2f2` | fondo |
| `--surface` | `#141416` | `#e6e7e8` | paleta, placas sin portada |
| `--ink` | `#ededee` | `#121315` | texto principal |
| `--dim` | `#a1a1a9` | `#55565d` | texto secundario, rótulos de sección |
| `--faint` | `#83838c` (≈5,2:1) | `#66676e` (≈5:1) | metadatos, tipos de campo |
| `--rule` | `rgba(255,255,255,.1)` | `rgba(0,0,0,.1)` | líneas de 1 px |
| `--sig` | `#ff3e00` | `#ff3e00` | **solo decorativo:** el cuadrado del nombre y la barra del cargador |
| `--sig-text` | `#ff3e00` (≈5,6:1) | `#b82d00` (≈5,5:1 sobre `--bg`, ≈5:1 sobre `--surface`) | foco visible y el único texto en acento (estado activo, también el ítem activo de la paleta sobre `--surface`) |
| `--ok` · `--wip` | `#3ecf6e` · `#e5a00d` | `#1f8a4c` · `#a86a00` | **solo el punto de estado** (gráfico, ≥3:1); nunca color de texto. Nunca es la única señal: siempre va con su rótulo en `--dim` o `--ink` |

- **Temperatura por obra:** `@property --tint` (`<color>`) y `--tint-amt` (`<percentage>`); el fondo es `color-mix(in oklab, var(--bg), var(--tint) var(--tint-amt))` con transición de 1,2 s. 8 % en oscuro, 5 % en claro, 75 % de eso al anticipar con hover o foco. El `tint` sale de `Media.tint` (lo calcula el admin al subir la imagen).
- El acento ocupa menos del 5 % de la pantalla. Nunca en bordes ni en rótulos.
- Contraste AA verificado por `scripts/check-contrast.mjs` en los dos temas, con y sin Hiperfoco.

### Tipografía

- **General Sans** (variable, 200–700, local) para todo lo que se lee. **Martian Mono** solo para identificadores: nombres y tipos de campo del registro, slugs, `kbd`. No hay otras familias ni fuentes remotas.
- Cuerpo en 420; titulares en 540–560 con tracking de −0,03 a −0,058 em e interlineado de .82 a .95; la frase grande en 500.
- **Sin etiquetas en mayúsculas espaciadas** y sin numeración «01 /». Los rótulos de sección van en sans, en minúscula de oración y en `--dim`.

**Seis tamaños de lectura** (tokens `--text-*` del `@theme`; no hay `text-[Npx]` sueltos):

| Token | Valor | Uso |
|---|---|---|
| `xs` | `.8125rem` | rótulos `dt`, pies de foto, etiquetas de métrica |
| `s` | `.9375rem` | cabecera, rótulos de sección, metadatos, columna fija, pie |
| `m` | `1.0625rem` | cuerpo |
| `l` | `clamp(1.05rem, 1.5vw, 1.375rem)` | párrafos del caso, bajada del inicio, cargos de la trayectoria |
| `xl` | `clamp(1.5rem, 2.6vw, 2.4rem)` | títulos de tarjeta |
| `hero` | `clamp(1.6rem, 3.6vw, 3.4rem)` | frase que se enciende, intro del caso, números de métrica |

**Escala monumental** (solo títulos `h1`, filas de obra y el email; tokens `--text-display-*`):

| Token | Valor | Uso |
|---|---|---|
| `display-row` | `clamp(2rem, 5.6vw, 5.4rem)` | filas de obra del inicio, nombre del cargador |
| `display-mail` | `clamp(1.8rem, 7.4vw, 8rem)` | email del pie, sin cortes (`white-space: nowrap`, nunca `break-all`) |
| `display-case` | `clamp(3rem, 11vw, 11.5rem)` | título del caso y de la siguiente obra |
| `display-page` | `clamp(3.4rem, 13vw, 13rem)` | título de página (Obra, Sobre mí) |
| `display-name` | `clamp(3.4rem, 15.5vw, 16rem)` | el nombre del inicio |

### Espacio y forma

- Margen lateral `--pad: clamp(1rem, 3.2vw, 3rem)`, también a 320 px. Secciones separadas por `clamp(5rem, 16vh, 10rem)`. Las medidas de lectura se limitan en `ch` (58ch los párrafos, 26ch la frase grande), no con un contenedor fijo.
- Sin tarjetas ni cajas dentro de cajas: listas sobre líneas de 1 px. Radio de 3 px en imágenes, 6 px al inicio de la captura que crece.
- Un solo corte de diseño: **768 px** (el `md` de Tailwind; el prototipo usa 760 px y la diferencia es deliberada). Debajo, la galería pasa a columna, la captura queda estática, el caso va a una columna y los rótulos fijos dejan de serlo.
- `overflow-x: clip` solo en `body`. Cero scroll horizontal de 320 px a 2560 px.

## 4. Contrato de anclas del DOM

Los paquetes de frontend se coordinan por estos atributos y clases, no por nombres de componentes. Las hojas globales (`print.css`, `hyperfocus.css`, `motion.css`) y los plugins de movimiento solo miran estas anclas.

| Ancla | Significado | Ejemplo |
|---|---|---|
| `data-chrome` | Cromo del sitio. No se imprime | `<header data-chrome class="…">` |
| `data-hf="hide"` | Se oculta en Hiperfoco | `<div data-hf="hide" aria-hidden="true">` (vista previa) |
| `data-hf="measure"` | Columna de lectura en Hiperfoco: `max-width: 68ch`, centrada | `<article data-hf="measure">` |
| `data-ornament` | Decorativo puro (lleva `aria-hidden`). En el morph sale como fantasma; en Hiperfoco y en registro no se ve | `<span class="sq" data-ornament aria-hidden="true">` |
| `data-vt="title\|cover\|page-title\|cv-sheet"` | Nombre estático de view transition en la página de destino. Uno por nombre y por estado (ver «Nombres únicos» abajo) | `<h1><span data-vt="title">{{ project.title }}</span></h1>` · `<figure data-vt="cover">` · `<h1 data-vt="page-title">Obra</h1>` · `<article data-vt="cv-sheet" class="cv">` |
| `data-travel="row\|card\|next\|nav"` | Origen de un viaje: al tocarlo se nombra su par | `<a data-travel="row" :href="…">` · `<a data-travel="card">` · `<a data-travel="next">` · `<NuxtLink data-travel="nav" to="/about"><span data-travel-title>Sobre mí</span></NuxtLink>` (la palabra del menú viaja como `page-title`) |
| `data-travel-title` | Dentro del origen, lo que viaja como `title` | `<span data-travel-title>{{ p.title }}</span>` |
| `data-travel-cover` | Dentro del origen, lo que viaja como `cover` | `<MediaImage data-travel-cover :media="p.cover" />` |
| `data-motion` | Lo que GSAP transforma. La impresión resetea `transform` y `opacity` en él y sus hijos | `<figure data-motion class="grow">` |
| `data-tint="#rrggbb"` | Temperatura que anticipa al apuntar o enfocar | `<a data-travel="row" :data-tint="p.cover?.tint">` |
| `.f[data-f]` | Fila de un campo del registro | `<div class="f" data-f="status">` |
| `.fk` · `.ft` · `.fv` | Nombre, tipo y valor del campo. `.fk` y `.ft` solo existen en registro; `.fv` es el nodo que viaja | `<span class="fk">status</span><span class="ft">enum ProjectStatus</span><span class="fv">LIVE</span>` |
| `.fv.q` · `.null` · `.fv-list` · `.flip` | String con comillas · `NULL` visible · lista que no viaja como bloque · nodo que viaja sin ser `.fv` | `<span class="fv q">La Rúcula</span>` · `<span class="null">NULL</span>` · `<ul class="fv-list"><li class="fv">Nuxt</li></ul>` · `<img class="flip" :src="cover.src">` |
| `.ed-only` · `.rec-only` | Contenido que solo existe en diseño o solo en registro (rótulos, estado en palabras o en enum) | `<span class="ed-only">En producción</span><span class="rec-only">LIVE</span>` |
| `data-row` · `data-card` | Destinos de `j`/`k` en listas y galerías | `<a data-row data-travel="row">` |
| `data-view` | Activa la burbuja «Ver caso» | `<a data-card data-view data-travel="card">` |

**Nombres únicos de view transition.** Si dos elementos tienen el mismo `view-transition-name` en un mismo estado, el navegador saltea la transición. El plugin de elementos compartidos lo evita como `prepareTravel()` y `render()` del prototipo: al tocar un origen (`click` en fase de captura, antes de navegar) pone `view-transition-name: none` en todo `[data-vt]` de la página saliente y recién después nombra el par `data-travel-title` / `data-travel-cover` del origen (`title` y `cover`, o `page-title` si es `nav`). En la página nueva, cuando termina la transición, limpia los nombres que puso fuera de la raíz de la página. Ejemplos: en un caso, el `h1` con `title` se apaga antes de que «Siguiente» tome `title`; en `/projects`, el `h1` con `page-title` se apaga antes de que «Sobre mí» del menú tome `page-title`.

**Estado en `<html>`** (lo pone el SSR, sin parpadeo): `data-theme="dark|light"` (cookie `pf-theme`), `data-hyperfocus="true"` (cookie `pf-hyperfocus`), `data-vista="registro"` (de `?vista=registro`) y `data-intro` (solo lo pone el script del head en `/`, primera visita de la sesión, sin reduced motion y sin Hiperfoco: ni cookie `pf-hyperfocus` ni `?foco=1`). Tailwind expone `focus-mode:` y `record:` como variantes de los dos primeros estados de lectura. Mientras corre el morph, `data-morphing` en `<html>` y `.quotes-off` en la raíz de la página.

**Hooks de Nuxt:** `record:before` y `record:after` (los emite `useRecordView`; los escuchan el morph y `useMotion`), `site:overlay` (`{ open }`, la paleta pausa Lenis) y `page:view-transition:start` (Lenis se detiene hasta que termina).

## 5. Hiperfoco

El Modo Focus existente (`useHyperfocus`), revisado: una capa de presentación para leer sin ruido, no otra versión del sitio. No tiene componentes propios ni contenido escrito a mano.

- **Estado:** cookie `pf-hyperfocus` leída por el SSR, que pone `data-hyperfocus="true"` en `<html>` antes del primer pintado. `?foco=1` es la entrada compartible: el SSR renderiza en Hiperfoco y escribe la cookie, y el cliente saca `foco` de la URL con `replaceState` después de hidratar, así recargar o copiar el enlace después de salir no lo vuelve a encender. Salir con `H` o `Esc` borra la cookie. El canonical no lleva `foco`.
- **Teclas:** `H` alterna (nunca detrás de un diálogo abierto). `Esc` primero cierra la capa abierta (paleta, popover, menú) y, si no hay ninguna, sale del Hiperfoco. El botón de la cabecera dice «Hiperfoco», con `aria-pressed` y `aria-keyshortcuts="h"`, y conserva el foco al alternar. El cambio se anuncia por la región `aria-live`.
- **Qué cambia:** la navegación queda intacta (cabecera, pie, paleta, teclas). El contenido se lee en una columna `[data-hf="measure"]`. Se ocultan `[data-hf="hide"]` y `[data-ornament]`: vista previa, burbuja, cargador, cuadrado del nombre, escena de la siguiente obra (queda un enlace llano). Imágenes y videos en monocromo (`grayscale(1)`, sin tocar el contraste) y en póster. `--tint-amt: 0%`. `--sig` pasa a `--ink`. `--faint` y `--rule` se ajustan para seguir en AA.
- **Movimiento:** se apaga todo lo ambiental (§6). Las view transitions quedan en 200–250 ms (220 ms los grupos) y el propio cambio de modo es una view transition de 220 ms. El morph de R funciona sin escalonado: los valores viajan juntos en 250 ms.
- **Del Hiperfoco anterior** (explorador): las colecciones como tabla se conservan como la lista llana de `/projects` sin galería con pin; el CV en Harvard se conserva (es el único visor); el dossier escrito a mano en la home se descarta (contenido fuera de la base); el orden de `Esc` (capas → modo) se conserva; la persistencia pasa de `localStorage` a cookie para que el SSR no parpadee. El paquete X1 completa la revisión y su spec.

## 6. Política de movimiento

`useMotionPrefs` es la única fuente, reactiva:

- `reduce`: `prefers-reduced-motion: reduce`.
- `fine`: `(hover: hover) and (pointer: fine)`.
- `hyperfocus`: `useHyperfocus().isHyperfocus`.
- `allowAmbient = !reduce && !hyperfocus`: cargador, letras del nombre, líneas y palabras, números que cuentan al entrar en pantalla, Lenis, galería con pin, captura que crece, parallax, inclinación, vista previa, burbuja, imanes, temperatura, autoplay y videos al apuntar.
- `allowTransitions = !reduce`: view transitions, morph de R, FLIP de filtros, Rodar en respuesta a una acción (texto que rueda, email copiado, números al filtrar), Asomar y el resaltado de la paleta. En Hiperfoco se acortan a 200–250 ms.

**Presupuesto:**
- Una sola entrada animada: el cargador, en `/`, una vez por sesión (`sessionStorage` `mov-visited`). Se omite con click, tecla o rueda; una regla CSS lo oculta a los 4 s pase lo que pase. En las visitas siguientes solo suben las letras del nombre; el resto del inicio no se anima (el prototipo lo funde desde 20 px en 1 s: acá se descarta a propósito por la regla siguiente).
- El texto nunca nace invisible: el SSR entrega todo visible y legible sin JS; lo que ya está en pantalla al cargar no se anima. **Única excepción:** las letras del nombre del inicio (y el cargador en la primera visita). Su máscara no retrasa el LCP: el nombre llega pintado en el SSR y la animación arranca después del primer pintado. El LCP no espera a JS.
- Respuestas a una acción: 140–340 ms. Viajes y transformaciones: 0,6–1,15 s. Solo el scrub no tiene duración.
- Se anima `transform`, `opacity`, `clip-path` y `filter`; nada que fuerce layout salvo el radio de la captura que crece. Sin WebGL ni canvas.
- Con `reduce` todo llega a su estado final sin animar: sin Lenis, sin partir texto, sin autoplay (póster y controles) y la vista previa sin lerp.
- Táctil (`hover: none` o `pointer: coarse`): sin vista previa, burbuja ni imanes; las filas muestran una miniatura y los videos de tarjeta corren al entrar en pantalla (salvo `saveData`).
- Videos: mudos, `playsinline`, solo mientras se ven, `preload="none"` salvo la portada en autoplay, y botón de pausa visible.
- Toda animación vive en `useMotion` (contexto de GSAP con limpieza al desmontar y en `record:before`). Ningún componente escribe `innerHTML`.
- **Sonido:** opcional, apagado por defecto (cookie), un tic de 70 ms. Suena solo en cinco gestos: R, H, copiar el email, mover el resaltado de la paleta y abrir un Asomar. Silencioso con Hiperfoco o reduced motion.

## 7. Teclas

Un solo `useHotkeys`. Todas se pueden apagar desde la paleta («Atajos de una tecla»). No se disparan con foco en `input`, `textarea`, `select`, `[role=combobox]` o `[contenteditable]`, con un diálogo abierto, ni con modificadores (salvo Ctrl/⌘K).

| Tecla | Acción |
|---|---|
| `1` · `2` · `3` · `4` · `5` | Inicio · Obra · Sobre mí · Contacto (`#contacto`) · CV (`/about?cv=ats`) |
| `j` / `k` | Foco a la siguiente o anterior `[data-row]` / `[data-card]` (mover el foco no navega) |
| `Enter` | Abre lo que tiene foco |
| `Esc` | Cierra la capa abierta; si no hay ninguna, sale del Hiperfoco |
| `Backspace` | Sube un nivel: caso → obra, CV → sobre mí, artículo → artículos |
| `R` | Ver como registro (`?vista=registro`) |
| `H` | Hiperfoco |
| `/` · Ctrl/⌘K | Paleta «Ir a»: páginas, las obras, Hiperfoco, tema, idioma, sonido y atajos |

## 8. Rutas

La ruta es el estado: todo se resuelve con rutas limpias y query parameters indexables.

| Ruta | Qué es |
|---|---|
| `/` | Inicio: nombre, titular, obra destacada con vista previa, frase y contacto |
| `/projects` | Obra: galería horizontal. `?status=live\|wip\|archived` y `?stack=<slug>` facetan (no hay página Stack: las tecnologías del caso enlazan acá) |
| `/projects/:slug` | Caso. Solo las 6 obras publicadas; el resto da 404 |
| `/about` | Sobre mí. `/about?cv=ats` abre el CV Harvard ATS (la hoja imprimible en una página A4) |
| `/articles` · `/articles/:slug` | Blog, con el estilo del sitio |
| `?lang=en` | Inglés en cualquier ruta (el español es el valor por defecto). Hreflang recíproco |
| `?vista=registro` | Cualquier página como registro tipado, renderizado por el SSR |
| `?foco=1` | Entrada compartible al Hiperfoco |

- Todo lo demás redirige con 301 conservando la query (`/stack/:slug` → `/projects?stack=:slug`, `/experience` → `/about#trayectoria`, `/lab` → `/`, los alias en español y las rutas del explorador anterior).
- El canonical no lleva `vista`, `cv` ni `foco`; esos parámetros nunca se reenvían a la API.
- **CV en PDF:** uno ATS por idioma, `public/cv/CV-ES-Mateo-Sonzogni-ATS.pdf` y `CV-EN-Mateo-Sonzogni-ATS.pdf`. Las URL sin `-ATS` redirigen a ellos.
- **Impresión:** un único `@page { size: A4; margin: 10.5mm 12mm }` en el CSS de `app/`. Se ocultan `[data-chrome]`, `[data-hf="hide"]` y `[data-ornament]`, y se resetea `[data-motion]`. `[data-hf="measure"]` se imprime: solo pierde el límite de 68ch. En `/about?cv=ats` queda visible solo la hoja del CV (`[data-vt="cv-sheet"]`); las demás páginas se imprimen como texto de lectura.

## 9. Lo que no se hace

- Telones, cargadores de ruta o pantallas negras al navegar. Sin WebGL, canvas, grano ni 3D.
- Cosplay de terminal: prefijos `//`, consolas falsas, ventanas de sistema operativo, `READ-ONLY · UTF-8`.
- Cajas dentro de cajas, sopa de píldoras, destellos de click, bordes láser, globos, reloj con segundos, porcentaje de scroll.
- Rótulos en mayúsculas espaciadas o numerados. Emojis en cualquier parte del sitio o del admin.
- Texto de contenido escrito en un componente, ubicaciones o cifras fuera de la base, datos de respaldo mantenidos a mano.
- Atenuar fuera del hover en listas. Animaciones que no sean uno de los seis verbos.

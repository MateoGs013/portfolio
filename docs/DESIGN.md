# DESIGN.md — Ley de diseño y motion del proyecto

> **⏸ CONGELADO — 23-jul-2026.** El concepto está cerrado: generation-loss (§4d)
> es la ley final. **Cero re-fundaciones hasta que una edición salga a la calle
> terminada.** Causa raíz diagnosticada: cuatro re-fundaciones en 48h (§4, §4b,
> §4c, §4d — §4d deroga a §4c del día anterior) hicieron que el código nunca
> alcanzara a una espec que se recolaba los cimientos cada día. Se corta acá.
> Decisiones de ejecución (23-jul):
>
> 1. **Las ediciones son RUTAS, no un swap en caliente.** `/` = Afiche ·
>    `/terminal` · `/plano` · Fanzine gated. El selector navega (ClientRouter, ya
>    activo); la lectura de "reimpresión" se logra con `transition:persist` /
>    `transition:name` (§6.6). Se retira la maquinaria in-place: `portal.ts`,
>    el evento `ms:edicion`, el `.wipe` y las ramas de swap de `tema.ts`. §4d.2
>    (portales) se reinterpreta como **transición de página temática**, no como
>    cortina sobre DOM vivo. Es más robusto y más Astro-native.
> 2. **Se termina UNA edición impecable antes de tocar la siguiente:** Afiche
>    (default, sin WebGL, la más avanzada). Una cosa terminada sobre la que
>    iterar — el modo de falla a evitar es "3 mundos geniales y 1 roto" (§4d).
> 3. **Ideas nuevas van a un backlog, NO reabren el concepto.** El doc se toca
>    para AJUSTAR lo que se está construyendo, nunca para re-fundar.

> Escrito en julio 2026 tras una investigación de tendencias, catálogo de
> antipatrones "AI slop" y craft de motion (fuentes al final). **Leer entero
> antes de tocar cualquier cosa visual o de motion.** Si una decisión
> contradice este doc, la decisión está mal o el doc se actualiza primero —
> nunca se ignora en silencio.

## 0. Por qué existe

El cliente detectó que la v1 de la home "tiene el patrón típico de AI". Tenía
razón. La IA converge a lo más probable ("distributional convergence"): cada
default es un promedio disfrazado de decisión. La autoría se lee en las
decisiones que un promedio nunca tomaría. Regla transversal: **si una decisión
es "la opción segura/común", es candidata a tell.**

### Autopsia de la v1 (lo que había que borrar y por qué)

| Elemento v1 | Tell |
|---|---|
| Preloader con contador 000→100% | Cliché nº1 de portfolio dev; delay gratuito, leído como demo-reel |
| Hero: eyebrow uppercase + raya + nombre gigante + meta row | El hero promedio; patrón Snellenberg tan clonado que hay generadores automáticos |
| Marquesina infinita | Decorativa, sin función; señal de relleno |
| Cursor custom que crece en hover | Default de 2023, no diferenciador; molesta en accesibilidad |
| SplitText letra por letra con fade | El combo Lenis + reveal por letra es lo más clonado de 2025 |
| Fade-up con stagger uniforme en todo | "Same generic fade-in on everything" — motion sin intención |
| Labels mono uppercase con tracking por todos lados | Mono mal aplicado: chrome decorativo disfrazado de funcional |
| Un solo ease (expo.out) para todo | Firma de template; el motion de autor usa curvas propias por segmento |

## 1. El norte

**Concepto "Ediciones"** — el portfolio se reimprime en sistemas de diseño
distintos (Afiche · Terminal · Plano), con claro/oscuro por edición y el clicker
"La imprenta" que las desbloquea. La investigación confirma que este concepto es
el **antídoto exacto** al look-AI — pero solo si se ejecuta con rigor de
imprenta real, no como textura decorativa encima de un template.

> **Re-fundación 22-jul-2026 — GENERATION-LOSS (ley detallada en §4d).** El hilo
> conductor deja de ser "imprenta / tinta sobre papel" y pasa a ser la **pérdida
> de generación**: las ediciones NO son cuatro hermanas paralelas, son una
> **cadena descendente de copias de un mismo master** — **Plano** (el master, la
> lámina madre) → **Afiche** (1ª impresión off del master) → **Terminal** (el
> master transmitido a una pantalla) → **Fanzine** (3ª generación, la fotocopia
> de las fotocopias). Cada edición muestra degradación visible respecto de la
> más limpia, y ese ORDEN es la restricción dura que reemplaza al sustrato de
> papel compartido. La cohesión se muda del material al contenido, la voz, el
> selector y el retrato-master.

Lo que se premia hoy (Awwwards Developer Award 2026) no es el efecto vistoso:
es el **craft técnico invisible** — transiciones custom, 60fps, cero layout
shift, scroll con peso real. Astro (islands, JS mínimo) es ventaja: cuidarla.

## 2. PROHIBIDO (no negociable)

1. **Preloader con contador de porcentaje.** Ver §5 para el reemplazo.
2. **Marquesinas infinitas** de texto decorativo.
3. **Cursor custom** que sigue el mouse y crece en hover.
4. **Fade-up + stagger uniforme** como reveal por defecto de secciones.
5. **Reveal letra-por-letra con fade** sin razón narrativa.
6. **Eyebrow uppercase con puntito/raya** encima de cada título.
7. **Un ease global.** Cada familia de movimiento usa su curva del sistema (§5).
8. **Uniformidad de radius/padding/spacing** entre secciones y ediciones — la
   monotonía métrica es la firma del template. Las ediciones DEBEN diferir
   también en métricas (densidad, radios, grosores), no solo en color/fuente.
9. **Gradientes violeta→azul, glow detrás de cards, glassmorphism decorativo,
   emoji como iconos, iconos Lucide de relleno, cards con borde de acento
   lateral, 3D/blobs de stock.**
10. **Copy genérico intercambiable** ("interfaces que respiran", "digital
    experiences", "detalle sobre ruido"). Si la frase sirve para el portfolio
    de cualquier otro dev, se reescribe.
11. **Nav genérico** "Home / About / Work / Contact" (ver §3, vocabulario).
12. **Mono como body copy global** — el mono es tinta de datos, no la voz por
    defecto (excepción: edición Terminal, donde es la identidad y se asume).
13. **WebGL como capa base** que bloquea el first paint. Solo como acento lazy
    en 1-2 momentos. Momento sancionado (§4d): la difusión volumétrica de luz
    por el vellum de Plano — lazy, con fallback CSS estático y kill-switch a
    60fps. Terminal puede sumar un bloom-pass opcional sólo en oscuro. Afiche y
    Fanzine, sin WebGL.
14. **Kinetic typography como base del sitio** (pelea con lectores de pantalla
    y CWV). Como acento puntual, sí.
15. **Instrumentos de cursor apilados y HUDs decorativos.** Máximo UN gesto
    de cursor por vista (§4b). Prohibidos los readouts numéricos que no miden
    nada real (cotas falsas, "presión", coordenadas ornamentales) y cualquier
    elemento nuevo que aparezca para seguir al puntero por encima del
    contenido (bandas, scanlines, crosshairs, manchas). El cursor actúa sobre
    lo que ya existe o no actúa.

## 3. OBLIGATORIO (los principios)

1. **Rigor editorial real, no disfraz.** Grid con baseline, medida de texto
   45–75 caracteres, jerarquía dramática (titular enorme contra texto diminuto,
   no escalera de tamaños parecidos). Müller-Brockmann como norte. La textura
   de papel sin el grid es un disfraz; el grid sin textura ya es imprenta.
2. **Cada edición es una publicación real**: su propio par tipográfico, su
   propia densidad, sus propios márgenes, radios y grosores de línea, su propio
   comportamiento de motion. Romper la uniformidad ENTRE ediciones es el punto.
3. **Vocabulario de imprenta en todo el sitio.** Nav y labels con voz propia:
   "Pliego / Tirada / Colofón / Taller" en vez de "Home / Work / About". El
   colofón (la ficha de imprenta al final de un libro) reemplaza al footer
   genérico. Cada label debe ser específico de ESTE sitio.
4. **Copy con voz de Mateo** (rioplatense, concreto, sin humo). Test: ¿esto lo
   diría él en voz alta? ¿Serviría en el portfolio de otro? Si no/sí → afuera.
5. **Contenido real siempre**: screenshots de producción, dominios reales,
   datos verificables ("2 clientes en producción en España" vale más que
   cualquier adjetivo).
6. **Asimetría intencional.** Tensión en los layouts: columnas desiguales,
   elementos que rompen la grilla a propósito (como un pliego real, donde la
   imagen sangra). Nada centrado por defecto.
7. **Motion diegético**: cada animación debe poder explicarse con el lenguaje
   de imprenta (se imprime, se registra, se entinta, pasa el rodillo). Si no
   se puede explicar así, probablemente es decoración genérica.
8. **Performance como feature**: presupuesto de JS por isla, imágenes
   optimizadas, cero layout shift. Verde en PageSpeed es parte del portfolio.

## 4. Escenografía — escala de experiencia (enmienda 21-jul-2026)

Diagnóstico: la home tenía el craft correcto pero a **escala de documento** —
flujo continuo de revista, denso, sin un momento donde la página cambie de
estado. Las referencias que el cliente marcó como norte (russellnumo.nl,
Awwwards Nominee 7.81; specia1ne.com, Nominee 9.30) usan nuestro mismo stack
(Astro/Next + GSAP + Lenis, cero three.js): la brecha es de **puesta en
escena**, no de tecnología. Reglas:

1. **Una idea por viewport.** Las secciones de la home son escenas (~100svh)
   con una sola idea y aire enorme. La densidad editorial queda para fichas,
   casos y colofón — el contraste escena/ficha es parte del lenguaje.
2. **Escala brutal.** El protagonista de cada escena llena el ancho del
   viewport y puede sangrar los bordes (la plancha es más grande que el
   papel; `overflow: clip`, nunca scroll horizontal).
3. **Un takeover por página.** Al menos un momento donde la página entera
   cambia de estado (se entinta full-bleed) ligado al scroll. En specia1ne es
   el azul de "Selected Work"; acá, la tirada entintándose.
4. **Marco vivo.** Datos reales en tiempo real con lenguaje de taller: reloj,
   estado ("taller abierto a encargos"), folio de pliego, avance de tirada
   con el scroll. Un instrumento calibrado, no una página.
5. **El scroll dirige escenas.** Pinning coreografiado con scrub, permitido y
   deseado en los momentos clave; el scroll no solo desplaza — dirige.
6. **Cursor y velocidad son tinta — con presupuesto (§4b).** Las
   interacciones firma pueden leer la posición del mouse y la velocidad del
   scroll (desregistro, halftone), siempre con falloff continuo y
   reversibles. El cursor custom sigue PROHIBIDO (§2.3), y también lo está
   apilar instrumentos: UN gesto de cursor por vista, actuando sobre el
   contenido que ya existe — la página reaccionando, no un puntero
   disfrazado ni un tablero de efectos.
7. **Resuelto en §4c:** cada edición tiene una experiencia propia de
   motion/layout — una FÍSICA de scroll, no un cambio de tintas. La
   experiencia propia vive en layout, escenas y scroll, NO en multiplicar
   vocabularios de cursor (§4b.6). La dirección completa es ley en §4c.

## 4b. Economía del gesto (enmienda 21-jul-2026)

Diagnóstico: la v2 de "instrumentos de cursor" (rodillo que invierte,
scanline CRT, cruz con cotas, mancha con arrastre — uno por edición) se
sintió **forzada**. La investigación (Awwwards SOTD 2024-26, Codrops,
inventario de los sitios norte) explica por qué, y las razones son
estructurales, no de ejecución:

- **Inventario real de los norte:** Snellenberg usa UN vocabulario
  (punto + magnetismo) repetido en todo el sitio; specia1ne usa 2 gestos;
  el portfolio de Spitzer usa **casi cero** cursor — su firma es una única
  transición Flip. Presupuesto premiado: **1 gesto firma, tope 2 elementos
  cursor-reactivos por vista, un solo vocabulario.** Nosotros teníamos 4
  metáforas compitiendo.
- **El anti-patrón raíz:** los 4 instrumentos eran **capas nuevas encima
  del contenido**. Los efectos que se sienten naturales hacen reaccionar
  lo que YA está en pantalla (la tipografía, el retrato) — Exat (Codrops
  2026) trata "la tipografía misma como el elemento primario de interfaz".
  Una banda/scanline/mancha que aparece para seguir al mouse es un objeto
  ajeno; una letra que gana peso bajo el cursor es el sitio comportándose.
- **Readouts decorativos = ruido.** "Marca 0,53 · presión ▮▮▮", cotas en
  mm que no miden nada: fingen dato. Ningún sitio norte los usa.

### Las reglas

1. **Presupuesto duro: UN gesto de cursor por vista** (tope 2 elementos
   cursor-reactivos contando estados de hover). Un solo vocabulario por
   sitio.
2. **El cursor afecta lo que ya existe.** Tinta, peso, registro, revelado
   del contenido presente. Nada nuevo aparece para seguir al puntero.
3. **Test de remoción:** si al quitar el efecto la vista queda más limpia,
   era decoración → afuera. Si queda incompleta, revelaba contenido → se
   queda. (Aplicarlo antes de cada merge.)
4. **Causal, no ilustrativo.** El scramble funciona en Terminal porque una
   terminal realmente baraja caracteres; una scanline CRT es una *foto* de
   la estética, pegada encima. Preguntar: ¿esto es lo que este objeto
   HARÍA, o es un disfraz de su época?
5. **Falloff continuo, reversible, sin residuo.** Distancia con gradiente
   (estilo Exat), nunca toggle binario. Alejás el cursor y todo vuelve.
6. **Las ediciones varían PARÁMETROS, no mecanismos.** El gesto firma es
   el ancla que persiste entre ediciones; cada edición lo re-tinta
   (charset, tinta, trama, timing). Cambiar el mecanismo por skin son
   cuatro sitios, no un sitio con cuatro ediciones.
7. **Si un número aparece en pantalla, mide algo real** y le sirve al
   lector. Si no, es HUD de utilería (§2.15).

## 4c. Las cuatro físicas (dirección de ediciones, 22-jul-2026)

Cierre del pendiente §4.7. Proceso: 4 conceptos desarrollados en paralelo,
8 críticas adversarias verificadas contra el código real y un juez de
familia (plan de obra detallado en `docs/plan-experiencias.md`). La regla
madre (re-fundada en §4d): **cada edición es una GENERACIÓN distinta de un mismo
master** — una física de scroll propia aplicada al MISMO contenido (§4c.8), con
los órganos partidos en un Nivel A compartido y un Nivel B bifurcado por
generación (§4c.2). El contenido y la voz son la familia; la generación es la
identidad.

### Las físicas

- **Afiche = COBERTURA.** La home es una pared de la calle: cada escena es
  un afiche que se pega ENCIMA del anterior (sticky stacking nativo, scroll
  1:1, cero scroll-jacking). El viejo no se va: queda un filo real asomando
  (offsets sticky acumulativos — la pared literal, no ilustrada). Toda
  rotación ASIENTA a 0 — asentar ES el gesto — y cada cobertura remata con
  un golpe único: la escobilla del pegador alisa la hoja (diégesis de
  empapelado, no de prensa). Takeover: "LA TIRADA" en reserva de papel —
  las letras son papel sin imprimir y el rodillo entinta el fondo (única
  inversión full-bleed; ES el titular real de la sección, no un duplicado).
- **Terminal = CUANTIZACIÓN.** La home es `man sonzogni` ejecutándose: UNA
  diégesis (el manual — no una shell; un solo comando tipeado en toda la
  home), todo reveal es impresión de líneas enteras en ráfagas de buffer
  (pops discretos agrupados irregularmente, cero fade), un solo caret que
  SALTA, jamás viaja. Lo impreso no se des-imprime (scrollback — excepción
  declarada a §6.1: la reversibilidad vive en los ESTADOS — pager, barra —
  nunca en la tinta; el halftone avanza con ratchet). Takeover: modo pager
  con standout (SGR 7) diseñado por tema — jamás inversión ciega — y barra
  tipo `less` con datos reales que ABSORBE el marco vivo.
- **Plano = DIRECCIÓN.** La home es una lámina que se delinea delante tuyo:
  todo se TRAZA en orden de dibujante (ejes → marcos → cotas → tinta),
  nunca hace fade, y la única cota mide el ancho real del título en TU
  viewport. Takeover: el ÚNICO pin del sitio — paneo horizontal 100%
  reversible sobre la tirada, el delineante siempre un trazo adelante;
  enhancement montado por JS con fallback vertical SIEMPRE (mobile y
  reduced-motion son la lámina leída de arriba a abajo, no la versión
  pobre). El rótulo vivo (title block) ABSORBE el marco vivo y al llegar
  al colofón se firma "conforme a obra" — Plano FIRMA con rúbrica trazada,
  jamás sella.
- **Fanzine = MANIPULACIÓN.** La única edición táctil: la tirada colapsa a
  pila de hojas fotocopiadas (el único layout propio), cada hoja se imprime
  con la pasada del escáner — que ES la cortina del cambio de edición
  ("fotocopiando…", una sola pasada, ≤800ms, nunca cortina + pasada
  apiladas). Los recortes se despegan con drag + inercia y debajo hay
  PALIMPSESTO: el mismo dato en la voz de OTRA edición — la fanzine está
  fotocopiada de las otras tres. La rotación es PERMANENTE (la fotocopia
  quedó torcida; ≤0.6° sobre texto corrido). La contraportada estampa el
  sello con TU número de ejemplar, congelado al desbloquear (un ejemplar
  numerado no cambia de número). El sello de goma es DE la fanzine:
  ninguna otra edición sella.

### Invariantes de familia (lo que hace que sean UN sitio)

1. **Un runtime compartido antes que cualquier edición** (Fase 0): evento
   `ms:edicion` emitido por `applyTema` + `mount()`/`unmount()`
   idempotentes por edición + `ScrollTrigger.refresh()`, todo detrás de la
   cortina. Cuatro lifecycles privados = cuatro sitios pegados.
2. **Los órganos se parten en DOS NIVELES (re-fundado, §4d).** Nivel A —
   compartido como mecanismo único re-parametrizado: los **portales** (§4d.2,
   reemplazan a la cortina única), las 3 curvas y el marco vivo. Nivel B —
   **bifurcado en renderers distintos por generación** (NO un órgano con los
   mismos ángulos): el retrato (§4c.9) y el halftone. `halftone.ts` PARAMS lleva
   un campo `renderer` (`contour` Plano / `rosette` Afiche / `scanline` Terminal /
   `diffusion` Fanzine), no sólo ángulos/celda/umbral.
3. **Cada edición declara su CANAL de reproducción, no tintas de proceso**
   (DEROGADO el §4c.3 original — cian/magenta en las 4 —, ver §4d). Plano = un
   solo canal de luz (halo de difusión) · Afiche = spot 2 tintas · Terminal =
   eco de señal mono · Fanzine = feed-slip vertical 1-bit. `--reg-c1`/`--reg-c2`
   se redefinen por `[data-tema]` en `tokens.css`, no en `:root`. `registro.ts`
   DESREGISTRO lleva eje + cantidad de fantasmas + canal, no sólo drift.
4. **UN instrumento de marco vivo por edición**: la barra `less` (Terminal)
   y el rótulo (Plano) absorben reloj y estado, jamás conviven con el
   vivo. Afiche y Fanzine conservan el vivo tal cual. Un solo blink idle
   por edición.
5. **La topbar siempre encima de todo** (`top: var(--topbar-h)`): el
   selector de ediciones es lo que hace legible el concepto entero —
   ninguna hoja, pin o pila lo tapa.
6. **El colofón es la ficha quieta final en las 4 ediciones**: ahí el
   sitio vuelve a ser uno.
7. **Regímenes de rotación opuestos y exclusivos**: en Afiche toda
   rotación asienta a 0; en Fanzine es permanente. Ninguna edición toma
   prestado el régimen de la otra. Terminal y Plano no rotan.
8. **Paridad de contenido (NUEVO, §4d).** Los mismos 4 proyectos, el retrato
   del autor, el colofón y el reloj vivo aparecen en las 4 ediciones; ningún
   mundo agrega ni saca un átomo de contenido. Es la regla de cohesión
   load-bearing que reemplaza al sustrato de papel compartido. Check de merge (§8).
9. **El retrato es el master de reproducción (NUEVO, §4d).** El canvas `.tipos`
   NO se desmonta en el switch: se sostienen sus píxeles fuente y sólo se
   reconstruye el renderer por generación (§4c.2 Nivel B). Es la misma cara
   re-reproducida por la máquina nueva — el único ancla que carga entre mundos
   a través del portal (§4d.2). Refina §4b.6: el retrato deja de ser
   tipos-móviles-en-las-4 y pasa a ser un renderer por generación.

### Orden de obra

Fase 0 (runtime + parametrización de órganos + QA extendido con posiciones
de scroll y cambios de edición en caliente) → **Afiche** (es la default y
la primera impresión; su cirugía de DOM la heredan las demás) →
**Terminal** (banco de pruebas del runtime, riesgo bajo, craft alto) →
**Plano** (el mayor riesgo técnico — pin + Lenis + focus — se calibra con
el sitio ya estable) → **Fanzine** (recompensa secreta: el palimpsesto
solo tiene sentido con las otras tres vivas). Presupuesto honesto:
~13-15 días senior. El detalle vinculante por fase vive en
`docs/plan-experiencias.md`.

## 4d. Re-fundación: GENERATION-LOSS (22-jul-2026)

Origen: auditoría con criterio de jurado Awwwards (5 lentes + adversario) sobre
el sitio construido, las referencias de norte que marcó el autor
(dragonfly.xyz/Studio Freight, bymonolog, wembi, nithinmwarrier — todas
restrainadas, frías, tipográficas, con **casi cero WebGL**) y un juez escéptico
del concepto. Diagnóstico aceptado: las 4 ediciones compartían el layout de
masthead y sólo cambiaban color/fuente/charset — **re-skin, no re-composición** —
y las reglas de cohesión de §4c (§4c.2 órganos, §4c.3 tintas, sustrato de papel
compartido) eran justamente lo que las hacía RIMAR. "Reproducción" a secas no
alcanzaba: era un adjetivo que no diferenciaba nada — un tell de slop sofisticado.

**La ley nueva — no son cuatro hermanas, es un LINAJE.** Un mismo master copiado
por tecnologías distintas, degradándose generación a generación:

| Gen | Edición | Rol en la cadena | Sustrato · luz | Canal de reproducción |
|-----|---------|------------------|----------------|-----------------------|
| 0 | **Plano** | el master, la lámina madre | vellum retroiluminado · luz transmisiva | exposición por contacto (un canal de luz) |
| 1 | **Afiche** | 1ª impresión off del master | papel serigrafiado sobre muro · luz reflejada mate | tintas SPOT (accent + spot cálido) |
| 2 | **Terminal** | el master transmitido a pantalla | vidrio + fósforo · luz emisiva | haz de electrones (eco de señal) |
| 3 | **Fanzine** | la fotocopia de las fotocopias | bond barato + tóner · luz reventada | difusión de error 1-bit (feed-slip vertical) |

Por qué es LOAD-BEARING y no otra narrativa colgada: recupera una **restricción
dura** (cada edición debe mostrar degradación visible respecto de la más limpia,
y hay un ORDEN) que reemplaza a la que se pierde al romper el sustrato compartido.
Y le da trabajo a la transición (§4d.2): bajar de generación degrada/copia; subir
re-expone/restaura. El parecido Afiche↔Fanzine deja de ser bug — Fanzine ES la
fotocopia degradada de Afiche — y el peel del palimpsesto de Fanzine pasa a ser
el remate verificable de toda la cadena.

### Lo que se DEROGA y lo que se AGREGA

- **§4c.2 (órganos) → dos niveles.** Nivel A compartido: portales (§4d.2), las 3
  curvas, el marco vivo. Nivel B bifurcado por generación: retrato (§4c.9) y
  halftone (`renderer`: contour/rosette/scanline/diffusion). Retrato por mundo:
  Plano = contorno/isolíneas · Afiche = screenprint 2 tintas QUIETO (churn
  apagada, glifo→punto) · Terminal = ráster/dither dibujado por el haz · Fanzine
  = xerox 1-bit por difusión de error.
- **§4c.3 (tintas de proceso cian/magenta en las 4) → DEROGADO.** Cada edición
  declara su canal de reproducción (tabla de arriba). `--reg-c1`/`--reg-c2` se
  redefinen por `[data-tema]` en `tokens.css`; `registro.ts` DESREGISTRO gana eje
  + fantasmas + canal.
- **§4c.2 (cláusula del wipe) → DEROGADO. Cuatro PORTALES, no una cortina** (§4d.2).
- **§4c.8 (NUEVO) — Paridad de contenido** (ver §4c invariantes).
- **§4c.9 (NUEVO) — El retrato es el master de reproducción** (ver §4c invariantes).
- **§2.13 → enmienda:** el momento WebGL sancionado es la difusión volumétrica de
  luz por el vellum de Plano — lazy, sin bloquear first paint, con fallback CSS
  estático y kill-switch a 60fps. Terminal puede sumar un bloom-pass opcional
  sólo en oscuro. Afiche y Fanzine, sin WebGL.
- **§4b.4 → enmienda SÓLO para Terminal:** se habilitan glow / persistencia /
  colapso-a-scanline SIEMPRE que sean CAUSALES (emergentes del haz que dibuja y
  el fósforo que decae), no una foto de la estética pegada encima. La curvatura
  de barril sigue prohibida (no es causal de nada).
- **Sustrato de papel crema compartido → ELIMINADO** como portador de cohesión.
  La cohesión se muda a: contenido invariante (§4c.8) + voz de Mateo + selector
  siempre presente (§4c.5) + retrato-master (§4c.9) + colofón (§4c.6) + la ley de
  craft invisible (cero fade autoral, las 3 curvas, un gesto de cursor, mismo
  piso de accesibilidad).

### §4d.2 — Los portales (reemplazan a la cortina única de §5 / `tema.ts`)

El switch deja de ser un `div.wipe` que baja y sube. Cada portal es **la máquina
de copiar del mundo de destino encendiéndose sobre el viewport**, con mecanismo
FÍSICO propio (no una cortina de cuatro colores):

- **A Afiche:** una hoja full-bleed se PEGA torcida y la escobilla la asienta en
  una pasada (gesto de pegador; reutiliza el vocabulario de `pared.ts`).
- **A Terminal:** el viewport COLAPSA a una línea de fósforo y la pantalla se
  ENCIENDE (apagón-a-scanline + degauss; imposible con un fade).
- **A Plano:** una MESA DE LUZ prende bajo el vellum y el mundo se revela por
  exposición, ploteándose en orden de dibujante.
- **A Fanzine:** la BARRA del escáner barre top→bottom (clunk-whirr) y detrás
  aparece el tóner.

Invariante duro: cada portal alcanza su **pico de oclusión** exactamente en el
frame donde el runtime hace `unmount → applyTema → ScrollTrigger.refresh() →
mount` (el recableo nunca se ve). Ninguno tapa la topbar (§4c.5): viven DEBAJO
del selector. El retrato-master (§4c.9) es lo único que carga a través del portal
— metamorfosis, no corte. Presupuesto 680–820ms (§6). Reduced-motion: se apagan
los cuatro mecanismos (colapso CRT, blanco reventado y titileo fluorescente son
riesgos fotosensibles — se eliminan, no se atenúan) → crossfade ≤160ms teñido al
sustrato de destino, foco preservado, selector nunca oculto.

### Disciplina de ejecución (vinculante)

- **La trampa a evitar:** un theme-switcher técnicamente deslumbrante disfrazado
  de concepto editorial = una versión más fina del mismo slop que el cliente ya
  cazó. Generation-loss es el antídoto SÓLO si la degradación es visible y el
  switch se lee como REIMPRESIÓN (el contenido persiste), no como cambiar de
  página.
- **Temperatura:** las referencias del autor son frías, restrainadas,
  tipográficas. Los mundos se ejecutan FRÍOS y con aire, no con textura-máxima.
  `plano-dark` (el objeto más logrado del set en la auditoría) marca el norte
  cromático.
- **Terminal es el mejor craft y el peor concepto** (el CRT-portfolio es cliché):
  se construye SÓLO si el primer vistazo se lee "impresora de líneas", no "iTerm
  con glow". Si no se garantiza, se recorta.
- **Scope:** el modo de falla no es "todo mediocre" sino "3 mundos geniales y 1
  roto = demo inconcluso", peor que un solo mundo impecable. Se envían DOS mundos
  impecables (Afiche ya está + uno más) antes de tocar el tercero. Plano conserva
  su kill-switch a fallback vertical (§4c / plan Fase 3).

## 5. El intro (reemplazo del contador)

El intro es "el sitio saliendo de la prensa", diegético y corto (~800–1200ms,
solo primera visita de la sesión):

1. **Registro de tintas**: los canales de color del título entran desalineados
   (cian desde la izquierda, magenta desde arriba…) y convergen a registro —
   misregistration de serigrafía, barato en CSS (capas + `mix-blend-mode`).
2. Opcional al asentar: la trama **halftone** gruesa se afina hasta imagen
   nítida (mismo shader que se reutiliza en el resto del sitio, §6.4).
3. En visitas repetidas: sin intro. El mejor loader es el que no existe.

## 6. Sistema de motion

### Curvas (definir en `CustomEase`, usar SOLO estas)

- `prensa` — golpe seco y asentamiento lento (base: `0.45, 0.05, 0.55, 0.95`).
  Para impactos: llegada de tinta, sellos, cambios de edición.
- `tinta` — arranque casi lineal, frenada suave (base: `0.33, 0, 0.2, 1`).
  Para todo lo que fluye: reveals, movimientos de layout.
- `salida` — ease-in corto para elementos que se van.

Ajustar los valores a mano hasta que se sientan propios; documentar acá el
valor final. Prohibido volver a `power2.out`/`expo.out` genéricos.

### Números

- Micro-interacciones (hover, toggle): **100–200ms**.
- Transiciones de UI: **200–400ms**.
- Momentos únicos por sesión (intro, cambio de edición): hasta **600–800ms**.
- Stagger: **0.01–0.05s** (nunca más de 0.08).
- Orquestación: los elementos se pisan (`-=0.2` a `-=0.4`); nunca secuencia
  estricta. El overlap es la diferencia entre coreografía y lista.
- Scrub: **0.5–1** para scroll ligado (1 = ~1s de "alcance", da peso).

### Técnicas del proyecto (priorizadas)

1. **Scrub direccional**: el scroll es el gesto de pasar la hoja por la prensa
   — las animaciones ligadas al progreso (reversibles), no disparadas una vez.
   Excepción declarada (§4c): en Terminal la impresión es one-way
   (scrollback) — allí la reversibilidad vive en los estados, no en la tinta.
2. **Wipe con textura**: los reveals son barridos de rodillo con borde
   irregular de tinta (`clip-path` animado), no fades.
3. **Misregistration**: en hovers y transiciones los canales de color se
   desalinean unos px y vuelven a registro. Identitario y casi nadie lo hace.
4. **Halftone/riso shader** (una sola inversión técnica, reutilizada): imágenes
   clave que "se imprimen" de trama gruesa a continua; por edición cambia la
   paleta de tinta y el ángulo de trama. Con grid noise + ink bleed +
   `smoothstep` para que sea orgánico, no filtro de Photoshop.
5. **Fuente variable animada** (Archivo tiene ejes): la tipografía "gana cuerpo
   de tinta" — `wght`/`wdth` en ola. Reemplaza al split letra-por-letra.
6. **Transiciones de página con persistencia**: el título/plancha persiste y se
   "re-registra" entre páginas (Astro `transition:persist`/`transition:name`,
   o Barba + GSAP si hace falta control fino).
7. **Física de papel**: Draggable + InertiaPlugin para láminas/galerías con
   flick real (plugins ya gratis).
8. **Grano reactivo**: textura de papel que responde a la velocidad del scroll
   (más grano al moverse rápido). Barato con feTurbulence/canvas.

`prefers-reduced-motion` se respeta SIEMPRE (ya es contrato en CLAUDE.md).

## 7. Referencias

**Nivel de craft (no clonar el lenguaje):** Dennis Snellenberg (ya
sobre-clonado — estudiar el nivel, no el look), Clement Grellier, Karim Saab,
Arnaud Rocca, James Clapham, Valentin Gassend, Patrick Heng
(patrickheng.com), Joseph Santamaria (joseph-san.com).

**Técnica:**
- Halftone shader: paper.design/blog/retro-print-cmyk-halftone-shader ·
  blog.maximeheckel.com/posts/shades-of-halftone · studio-ity.com/cmyk-halftone
- Scroll cinemático: tympanus.net/codrops/2025/11/19/how-to-build-cinematic-3d-scroll-experiences-with-gsap
- Transiciones Astro: developer.chrome.com/blog/astro-view-transitions ·
  tympanus.net/codrops/2026/04/08/creating-custom-page-transitions-in-astro-with-barba-js-and-gsap
- Timing: nngroup.com/articles/animation-duration · valhead.com

**Escenografía (§4):** russellnumo.nl (shader hover ~40 líneas, hand-rolled) ·
specia1ne.com (sistema numerado + takeover, Astro+GSAP) ·
tympanus.net/codrops/2026/02/18 (breakdown Spitzer: SplitText por línea, Flip
shared-element, misma familia técnica).

**Economía del gesto (§4b):** tympanus.net/codrops/2026/04/10 (Exat: la
tipografía como interfaz, peso variable por distancia al cursor con falloff) ·
tympanus.net/codrops/2024/06/19 (terminal typography: scramble causal, no
decorativo) · awwwards.com — artículo custom cursors (Waaarhol: inversión
como ÚNICA idea; "don't overdo things") · blog.olivierlarose.com (rebuild
Snellenberg: un vocabulario punto+magnetismo) · rauno.me (restraint como
estándar de polish).

**Antipatrones:** 925studios.co/blog/ai-slop-web-design-guide ·
impeccable.style/slop · solodesign.cc/blog/ai-design-slop-the-tells ·
dev.to/studiomeyer_io (qué sobrevivió de 2026)

## 8. Checklist antes de cada merge visual

- [ ] ¿Alguna decisión es "el default"? → justificarla o cambiarla.
- [ ] ¿El copy serviría en el portfolio de otro dev? → reescribir.
- [ ] ¿Cada animación se explica con lenguaje de imprenta? → si no, afuera.
- [ ] ¿Hay más de UN gesto de cursor en la vista, o algún elemento nuevo
      siguiendo al puntero? → recortar (§4b.1-2).
- [ ] Test de remoción (§4b.3): ¿quitando el efecto la vista queda más
      limpia? → era decoración, afuera.
- [ ] ¿Todo número en pantalla mide algo real? → si no, es HUD de utilería.
- [ ] ¿La sección nueva es una ESCENA con una idea (§4), o volvió la densidad
      de documento?
- [ ] ¿El motion nuevo respeta la física de su edición y los invariantes de
      familia (§4c)? ¿Algún órgano se duplicó en vez de parametrizarse?
- [ ] ¿El switch se lee como REIMPRESIÓN (el contenido persiste a través del
      portal, la generación degrada visible) y no como re-navegación (§4d)?
- [ ] ¿Paridad de contenido intacta en las 4 ediciones (§4c.8)? ¿Ningún mundo
      agrega ni saca un átomo?
- [ ] ¿Las 16 combinaciones (4 ediciones × 2 temas × 2 viewports) se ven
      intencionales?
- [ ] ¿Medida de texto 45–75ch, jerarquía dramática, asimetría presente?
- [ ] ¿`npm run qa` verde y screenshots revisados?
- [ ] ¿Nada del catálogo PROHIBIDO (§2) entró de vuelta?

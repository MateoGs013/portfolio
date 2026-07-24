# DESIGN.md — Ley de diseño y motion

> Reescrito 23-jul-2026. Reemplaza la ley anterior (Ediciones / generation-loss):
> se re-fundó cuatro veces en 48h y nunca se terminó — el thrasheo del concepto
> fue la causa de que el proyecto costara tanto. Esta versión es **lean a
> propósito**: un concepto, reglas que sirven, cero arqueología. Se lee entera
> antes de tocar UI o motion. Si algo contradice este doc, se corrige el doc
> primero — nunca se ignora en silencio. **No se re-funda: se construye.**

## 0. Por qué existe

El cliente detectó que la v1 "tenía el patrón típico de AI". Tenía razón. La IA
converge a lo más probable: cada default es un promedio disfrazado de decisión.
La autoría se lee en las decisiones que un promedio nunca tomaría. Regla
transversal: **si una decisión es "la opción segura/común", es candidata a tell.**

## 1. El concepto — EL MAKING-OF

El portfolio no *describe* el trabajo: lo **muestra haciéndose**. Es el making-of
de un creative developer, recorrido como un video. Cuatro etapas del proceso real
—**Ideación → Maquetado → Programación → Producto**—, cada una su propia
**ruta/edición** con su lenguaje visual. La última etapa es el producto terminado.
El **retrato del autor es el hilo conductor**: se compone de trazo a foto a medida
que avanzás por las etapas. El **nombre se gana con la experiencia** — nunca se
grita en un hero.

Confirmado contra tres referencias (dragonfly.xyz, bymonolog.com,
nithinmwarrier.com — análisis en `docs/referencias/`): lo premiado hoy es el craft
invisible y el **restraint**, no el efecto vistoso.

| Ruta | Etapa | Lenguaje visual | Estado del retrato |
|------|-------|-----------------|--------------------|
| `/` | **Ideación** | papel de libreta, trazo a lápiz, el problema planteado | trazos de lápiz (boceto) |
| `/maquetado` | **Maquetado** | wireframe: cajas grises, el esqueleto del layout | celdas / bloques |
| `/programacion` | **Programación** | monoespaciada, el build corriendo, código real | dither / ASCII |
| `/producto` | **Producto** | terminado, a todo color, los proyectos reales | foto en halftone nítida |

Cada etapa es una escena que se recorre con el scroll (§6). El cambio de etapa es
navegación entre rutas (ClientRouter, ya montado); la transición hace **avanzar la
composición del retrato** — ese cruce es la "reimpresión".

## 2. El hilo — el retrato que se compone

El retrato (canvas `.tipos` / `halftone.ts`) es el único elemento que persiste y
progresa entre etapas: de trazo disperso → celdas → dither → foto. Es la libélula
de dragonfly hecha nuestra. Un solo tratamiento por tipo de imagen: **el retrato
en clave baja/halftone**; los screenshots de proyectos, "impresos" en trama. La
trama no es decoración: es cómo se imprime el trabajo.

- **La carga es la etapa 0.** Nada de spinner ni contador de %. El retrato nace de
  puntos dispersos que convergen a registro mientras cargan los assets. La carga
  ES la primera animación (`registro.ts` + `halftone.ts`, canvas 2D — nunca espera
  a WebGL).
- El retrato cruza las rutas con `transition:persist`; cada etapa reconstruye su
  renderer (trazo/celda/dither/foto), no la fuente.

## 3. El nombre ganado

El nombre **emerge de la trama, se lee un instante y se disuelve** en puntos. La
identidad persistente es un **monograma/folio discreto** en una esquina, no un
cartelón. El `<h1>` real es chico; si hay tipografía grande, es grafismo/plancha,
no el nombre. **Prohibido el hero de nombre gigante** (es el tell Snellenberg que
el cliente ya cazó). Que se acuerden del nombre por la experiencia.

## 4. PROHIBIDO (no negociable)

1. **Hero de nombre gigante** / eyebrow + raya + nombre + meta row (el hero promedio).
2. **Preloader con contador de %.** La carga es composición (§2).
3. **WebGL en el camino crítico del primer render.** Si hay 3D es UN gesto (la
   prensa, el retrato), lazy, con fallback CSS y kill a 60fps / mobile /
   reduced-motion. Las referencias cargan Three+DRACO pesado — nosotros no.
4. **Scroll-jacking excesivo.** Pin + scrub dosificado, sí; secuestrar 15
   viewports, no. Siempre se puede escanear.
5. **Un ease global** (`power2.out`/`expo.out`). Cada familia usa su curva (§6).
6. **Color de acento decorativo en la UI.** El color vive en el TRABAJO (los
   screenshots), no en botones/bordes. Negro/blanco + una tinta por etapa.
7. **Sumar familias tipográficas** para jerarquía: el contraste es por peso y
   escala, no por agregar fuentes.
8. **Parque de efectos**, kinetic typography como base, cursor custom que sigue el
   mouse, marquesinas, fade-up + stagger uniforme como reveal por defecto.
9. **Copy genérico** ("interfaces que respiran", "digital experiences"). Si sirve
   para el portfolio de cualquier otro dev, se reescribe.
10. **La trama/halftone como gimmick** aplicado a todo por igual.

## 5. OBLIGATORIO (los principios)

1. **Restraint = el look caro.** Menos cromo, más contenido; la tipografía hace el
   90% del trabajo; mitad de pantalla vacía a propósito.
2. **Un gesto firma por etapa, con disciplina** (§6). No un parque de efectos.
3. **Rigor editorial**: grid, medida 45–75ch, jerarquía dramática (display gigante
   contra micro-mono, nada en el medio). Müller-Brockmann como norte.
4. **Cero ficha técnica como disfraz**: folios numerados, marcas de registro
   `+`, contadores `01/04` y etiquetas mono-caps están PROHIBIDOS como chrome
   decorativo (fue el tell central del hero rechazado). Un dato aparece solo si
   es real y funcional: un año, un dominio en producción, un estado verificable.
5. **Contenido real siempre**: screenshots de producción, dominios reales, datos
   verificables. Copy con voz de Mateo (rioplatense, concreto, sin humo).
6. **Motion diegético**: cada animación se explica con el lenguaje de imprenta/
   taller (se compone, se registra, se entinta, se rasga). Si no, es decoración.
7. **Performance como feature**: Astro (JS mínimo por isla), cero layout shift,
   verde en PageSpeed. `prefers-reduced-motion` SIEMPRE (estados finales legibles).

## 6. Sistema de motion

### Curvas (CustomEase — usar SOLO estas)
- `prensa` — golpe seco + asentamiento (`0.45, 0.05, 0.55, 0.95`). Impactos,
  registros, cambios de etapa.
- `tinta` — arranque casi lineal, frenada suave (`0.33, 0, 0.2, 1`). Todo lo que
  fluye: reveals, movimientos de layout.
- `salida` — ease-in corto para lo que se va.

### El gesto firma (técnicas priorizadas)
1. **Carga = composición**: el retrato converge de trama dispersa a registro (§2).
2. **Scroll = línea de tiempo**: Lenis (inercia) + secciones pineadas + progreso
   **scrubbeado** (por posición, no por tiempo), reversible. Un elemento persistente
   (el retrato) cose el recorrido.
3. **Split-text que se enciende** por línea/palabra al scroll (reemplaza al split
   letra-por-letra con fade).
4. **Path SVG dibujándose** (`stroke-dashoffset`) como hilo entre escenas.
5. **Halftone/registro** reutilizado (una sola inversión técnica): imágenes que se
   "imprimen" de trama gruesa a foto.
6. **Transiciones = sistema, no fade**: rasgado de plancha / barrido de registro
   entre etapas + persistencia del retrato (`transition:persist`) y morph del
   título (`transition:name`).

### Números
- Micro-interacciones 100–200ms · UI 200–400ms · momentos únicos hasta 600–800ms.
- Stagger 0.01–0.05s · scrub 0.5–1. Los elementos se pisan (`-=0.2`/`-=0.4`),
  nunca secuencia estricta.

## 7. Referencias

Craft (no clonar el look): **dragonfly.xyz** (Studio Freight — carga = composición
en puntos, restraint negro + 1 tinta, marco-instrumento), **bymonolog.com**
(wordmark pineado, grano + halftone, split-text), **nithinmwarrier.com** (retrato
por celdas, path bezier como hilo, capítulos por color de fondo). Análisis completo
con screenshots en `docs/referencias/`.

## 8. Checklist antes de cada merge

- [ ] ¿Alguna decisión es "el default"? → justificar o cambiar.
- [ ] ¿El copy serviría en el portfolio de otro dev? → reescribir.
- [ ] ¿El nombre se gana (chico, se disuelve) o se grita (gigante)? → §3.
- [ ] ¿Cada animación se explica con lenguaje de taller? → si no, afuera.
- [ ] ¿Un solo gesto firma por etapa, o volvió el parque de efectos?
- [ ] ¿El color vive en el trabajo, no en la UI?
- [ ] ¿WebGL fuera del camino crítico y con fallback? ¿`prefers-reduced-motion` OK?
- [ ] ¿Se ve intencional en las combinaciones (4 etapas × claro/oscuro × 2 viewports)?
- [ ] ¿`npm run build && npm run qa` verde y screenshots revisados?

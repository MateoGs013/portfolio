# DESIGN.md — Ley de diseño y motion del proyecto

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
    en 1-2 momentos.
14. **Kinetic typography como base del sitio** (pelea con lectores de pantalla
    y CWV). Como acento puntual, sí.

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
6. **Cursor y velocidad son tinta.** Las interacciones firma pueden leer la
   posición del mouse y la velocidad del scroll (desregistro, halftone),
   siempre sutiles y reversibles. El cursor custom sigue PROHIBIDO (§2.3):
   esto es la página reaccionando, no un puntero disfrazado.
7. **Pendiente declarado:** cada edición tendrá una experiencia propia de
   motion/layout, no solo cambio de tintas. Ninguna decisión nueva debe
   cerrarle la puerta a eso.

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

**Antipatrones:** 925studios.co/blog/ai-slop-web-design-guide ·
impeccable.style/slop · solodesign.cc/blog/ai-design-slop-the-tells ·
dev.to/studiomeyer_io (qué sobrevivió de 2026)

## 8. Checklist antes de cada merge visual

- [ ] ¿Alguna decisión es "el default"? → justificarla o cambiarla.
- [ ] ¿El copy serviría en el portfolio de otro dev? → reescribir.
- [ ] ¿Cada animación se explica con lenguaje de imprenta? → si no, afuera.
- [ ] ¿La sección nueva es una ESCENA con una idea (§4), o volvió la densidad
      de documento?
- [ ] ¿Las 16 combinaciones (4 ediciones × 2 temas × 2 viewports) se ven
      intencionales?
- [ ] ¿Medida de texto 45–75ch, jerarquía dramática, asimetría presente?
- [ ] ¿`npm run qa` verde y screenshots revisados?
- [ ] ¿Nada del catálogo PROHIBIDO (§2) entró de vuelta?

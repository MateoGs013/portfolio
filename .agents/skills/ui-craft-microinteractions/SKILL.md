---
name: ui-craft-microinteractions
description: Criterio de diseño e implementación de micro-interacciones táctiles inspiradas en Bencho UI (bencho.dev) y componentes de React Bits / Vue Bits (reactbits.dev / vue-bits.dev) adaptados a Vue 3, Nuxt 4 y Tailwind CSS v4. Úsalo al diseñar o mejorar componentes interactivos, tarjetas Bento, toggles, píldoras de estado, animaciones tipográficas o trazas de IA.
---

# UI Craft & Micro-interactions (Bencho UI + Vue Bits)

Esta skill define el criterio estético y técnico para construir interfaces extraordinarias en el portfolio, combinando la precisión táctil de **Bencho UI (`bencho.dev`)** con el catálogo de primitivas interactivas de **React Bits / Vue Bits (`reactbits.dev` / `vue-bits.dev`)**, adaptadas de forma nativa a **Vue 3 + Nuxt 4 + Tailwind CSS v4** sin dependencias pesadas.

## 1. Filosofía Central: "El medio segundo después del clic"

1. **Respuesta física inmediata**: Todo control interactivo debe acusar recibo en `< 16ms` (1 frame a 60fps) mediante escala sutil (`active:scale-[0.98]`), desplazamiento óptico o cambio de luminancia en bordes.
2. **Transiciones con inercia natural**: Prohibido usar `linear` o `ease` genérico en micro-interacciones espaciales. Usar curvas exponenciales de desaceleración suave:
   - **Snappy Spring (Píldoras, Toggles, Botones)**: `cubic-bezier(0.22, 1, 0.36, 1)` (`220ms–280ms`)
   - **Spatial Reveal (Drawers, Bento Cards, Modales)**: `cubic-bezier(0.16, 1, 0.3, 1)` (`320ms–450ms`)
3. **Zero Bloat / Copy-Paste Primitives**: Al igual que en Vue Bits y Bencho UI, las micro-interacciones se implementan como composables o componentes ligeros propios en `app/components/ui/` o `app/composables/`, evitando instalar librerías de animación redundantes cuando CSS Custom Properties + `requestAnimationFrame` o GSAP (ya presente) resuelven el problema con `0 KB` extra.

---

## 2. Catálogo de Patrones Aprobados

### A. De React Bits / Vue Bits (`vue-bits.dev`)

1. **`SpotlightCard` (Iluminación radial por cursor en Bento & Carpetas)**
   - **Qué es**: Un resplandor radial ultra-sutil que sigue el cursor sobre superficies `--bg-surface` y revela el borde (`--border-strong`) solo cerca del puntero.
   - **Implementación**:
     - Trackear coordenadas relativas `--mouse-x` y `--mouse-y` en el contenedor vía `@mousemove` con `requestAnimationFrame`.
     - Aplicar un pseudo-elemento o capa con `background: radial-gradient(380px circle at var(--mouse-x) var(--mouse-y), rgba(99, 102, 241, 0.08), transparent 70%)`.
   - **Dónde usarlo**: Tarjetas del Bento Grid en `/`, tarjetas de proyectos en `ExplorerFolder.vue` y nodos de `/stack`.

2. **`DecryptedText` / `ScrambleText` (Evolución de `useScrambleText.ts`)**
   - **Qué es**: Decodificación de glifos monoespaciados (`JetBrains Mono`) al revelar títulos técnicos, slugs de rutas o métricas de telemetría.
   - **Regla de oro**: El texto final SIEMPRE vive en el DOM real para SEO y lectores de pantalla (`aria-label` intacto durante el scramble). Nunca usar Canvas/WebGL para texto.

3. **`CountUp` Tabular (Métricas y Telemetría DB)**
   - **Qué es**: Interpolación numérica con `font-variant-numeric: tabular-nums` para contadores de registros (`14 projects`), scores de Lighthouse (`100/100`) y latencia de queries (`1.8ms`).
   - **Regla de oro**: En SSR se renderiza el valor real final; en hidratación cliente se anima desde `0` o valor previo en `400ms` sin causar CLS (reserva de ancho con `tabular-nums`).

4. **`Magnet` & `ClickSpark` Sutil (Controles Primarios)**
   - **Qué es**: Atracción magnética leve (`max 4px` de desplazamiento) en botones de acción primaria (ej. descarga de CV PDF, botón de envío en `/contact`, enlaces de deploy en `ExplorerDetail.vue`).

### B. De Bencho UI (`bencho.dev`)

1. **Segmented Physics Switcher (Indicador deslizante compartido)**
   - **Qué es**: Un selector segmentado donde la píldora activa se desliza físicamente (`transform: translate3d(...)`) entre opciones en lugar de aparecer/desaparecer abruptamente.
   - **Dónde usarlo**:
     - Selector de vista en `ExplorerView.vue` (`Grid` / `Table` / `Timeline`).
     - Selector de idioma (`ES` / `EN`) y tema (`Dark` / `Light`).
     - Selector de formato CV en `/about` (`Modern` / `Harvard ATS`).

2. **Stateful Action Pills (Morfismo de estado en 3 fases)**
   - **Qué es**: Botones compactos tipo píldora que mutan suavemente de ancho y contenido entre estados: `Idle -> Processing/Copied -> Done` con ícono SVG con trazado animado (`stroke-dashoffset`).
   - **Dónde usarlo**:
     - Copiar email / URL de ruta / cita de artículo.
     - Píldora de telemetría SQL/API en la barra de estado (`GET /api/projects · 200 OK · 4ms`) que al hacer clic despliega el inspector de payload JSON.

3. **AI Reasoning Trace (`Bencho Thinking Steps`)**
   - **Qué es**: Visualización estructurada y colapsable en tiempo real de los pasos que ejecuta el agente IA (Eros) en lugar de un spinner genérico.
   - **Dónde usarlo**:
     - `/admin` -> **Job Hunter**: Mostrar pasos en vivo (`1. Analizando vacante -> 2. Cruzando con 12 proyectos en PostgreSQL -> 3. Optimizando keywords ATS -> 4. Generando Cover Letter`).
     - `/admin` -> **TrendRadar & Omnichannel**: Mostrar el progreso de scraping RSS/HN y síntesis con Gemini.

---

## 3. Invariantes Innegociables (Guardrails)

Toda micro-interacción implementada con esta skill DEBE cumplir las siguientes 4 leyes:

1. **Invariante de Hyperfocus (`html[data-hyperfocus="true"]`)**:
   - Cuando el modo Hyperfocus está activo (`useHyperfocus.ts`), **TODOS** los efectos de spotlight, magnetismo, scramble y sombras decorativas se apagan instantáneamente.
2. **Invariante de Accesibilidad (`prefers-reduced-motion: reduce`)**:
   - Toda animación JS debe verificar `window.matchMedia('(prefers-reduced-motion: reduce)').matches` y saltar directamente al estado final en `0ms`.
3. **Invariante de Tokens (Obsidian Dark & Technical Paper)**:
   - Prohibido hardcodear colores mágicos fuera de la paleta semántica (`--bg-base`, `--bg-surface`, `--text-primary`, `--accent-primary`). El spotlight debe adaptar su opacidad tanto en modo oscuro (`rgba(99, 102, 241, 0.09)`) como en modo papel técnico (`rgba(79, 70, 229, 0.05)`).
4. **Invariante de Rendimiento**:
   - Solo animar propiedades compuestas por GPU (`transform`, `opacity`) o variables CSS consumidas por gradientes sin disparar `layout`/`reflow`.

---

## 4. Estándar Awwwards 2026: "Swiss Architectural Portfolio" (Daniele Buser, Dennis Snellenberg, Basement Studio, Daksh Gajjar)

Para evitar tanto el **Extremo A (Cliché de terminal/consola ruidosa llena de cajas naranjas y etiquetas `//`)** como el **Extremo B (Texto plano sin dirección de arte)**, toda vista pública del portafolio debe regirse por las **6 Leyes de Dirección de Arte Awwwards**:

### Ley 1: Uso Quirúrgico del Naranja Constructivista (`#ff3e00`) como Signo Gráfico Único
- El color `--d-sig` (`#ff3e00` / `#c53000`) **jamás** se usa para pintar bordes de cajas ni etiquetas en mayúsculas tipo `TIER_01 //`.
- Se reserva al **< 5% de la interfaz** como puntuación gráfica monumental: el bloque de apóstrofe en el año (`’26`), el punto cuadrado final en el cierre (`Say Hello.` / `Hablemos.`), o un indicador puntual de estado activo. El 95% restante es monocromo arquitectónico de alto contraste.

### Ley 2: Grilla Suiza de 12 Columnas Expuesta vs. "Cajas dentro de Cajas"
- Prohibido anidar cajas redondeadas con bordes duros dentro de otras cajas.
- La estructura visual se construye mediante líneas divisorias continuas (`1px solid var(--d-rule)`) —columnas verticales sutiles de fondo y reglas horizontales limpias— combinadas con generoso espacio negativo.

### Ley 3: Anatomía Awwwards para `Selected Works` (Cero "Sopa de Píldoras")
- **Vista Escenario Editorial (2 Columnas estilo *Daniele Buser*)**: Marcos arquitectónicos amplios con imagen `16:10` protagonista. Al pie del marco: **Título del proyecto a escala `22px–28px` a la izquierda**, y a la derecha una **columna vertical alineada a la derecha con las 4 tecnologías principales en micro-uppercase sin bordes de píldora** (`VUE 3 / TAILWIND / GSAP / VITE` a `10.5px`, `leading-[1.35]`, `text-dim`).
- **Vista Índice Arquitectónico (Tabla 4 Columnas estilo *Dennis Snellenberg*)**: Cabecera limpia (`CLIENT / PROJECT`, `LOCATION`, `SERVICES & STACK`, `YEAR`) con filas amplias separadas por hairlines de `1px` y ventana flotante cinética (`UiCursorWorkList`).

### Ley 4: Contraste de Escala Tipográfica 12:1 y Filtros con Superíndice
- Titulares display monumentales (`clamp(42px, 6.8vw, 92px)`, `tracking-[-0.04em]`, `leading-[0.94]`) en `General Sans Variable`.
- Los filtros y enlaces de colección expresan su conteo mediante **superíndices tabulares limpios** (`All ⁰⁶`, `Live ⁰⁴`, `Work ⁰⁶`, `Lab ²⁸`) en lugar de badges pesados.

### Ley 5: Navegación Limpia sin Bloqueo de Rutas
- La navegación entre rutas del portafolio debe ser **instantánea (`0ms` bloqueo)**: nunca disparar cortinas o modales de carga (`UiRouteLoader`) que tapen la pantalla al hacer clic en enlaces internos.
- En vistas de detalle (`ExplorerDetail.vue` / `ExplorerFileWindow.vue`), evitar el falso cromo de ventana OS (`READ-ONLY · UTF-8`) y presentar un **Case Study Editorial** limpio con tira de créditos de 4 columnas.

### Ley 6: Cierre Monumental (`Say Hello.` / `Hablemos.`)
- El pie de página actúa como un segundo Hero tipográfico: titular gigante con punto final cuadrado en `#ff3e00` y el correo directo (`mateogabus@gmail.com`) a escala display (`clamp(20px, 2.8vw, 36px)`) con copiado táctil en 1 clic.

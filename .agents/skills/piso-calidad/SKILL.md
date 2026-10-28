---
name: piso-calidad
description: Verifica que las vistas y componentes del Explorador Relacional cumplan los 7 requisitos de accesibilidad, SSR, teclado, rendimiento y resiliencia antes de dar por cerrada cualquier tarea visual o de frontend.
---

# Piso de Calidad — Los 7 Requisitos No-Negociables

Invocar esta skill antes de considerar terminada cualquier vista o componente en `app/`. Ningún cambio pasa a producción sin cumplir los 7 puntos.

---

## 1. Funciona sin JavaScript (SSR Real)

**Criterio:** El HTML que entrega Nuxt 4 en la respuesta inicial contiene el texto completo del perfil, proyectos, experiencias, artículos y stack. Si el usuario desactiva JS, puede leer todo el portfolio y navegar mediante enlaces `<a href="...">` reales.

**Checklist:**
- [ ] El contenido textual viene de `useAsyncData` en SSR, nunca de `onMounted(() => fetch(...))`
- [ ] Las animaciones de entrada y micro-interacciones (`SpotlightCard`, `ScrambleText`, `CountUp`) enriquecen el nodo DOM hidratado pero no ocultan el contenido con `opacity: 0` permanente si JS falla
- [ ] Los enlaces entre colecciones, filtros (`?tech=`, `?org=`, `?tag=`) y registros son `<NuxtLink>` / `<a>` reales con `href` válido

---

## 2. Navegable 100% con Teclado

**Criterio:** Un usuario sin mouse puede recorrer todo el explorador relacional: cambiar colecciones (`0–5`), moverse entre filas/tarjetas (`↑/↓/←/→`), abrir detalle (`Enter`), volver (`Backspace`/`Escape`), filtrar (`/`), activar Hyperfocus (`H`) y abrir la paleta de comandos (`⌘K` / `Ctrl+K`).

**Checklist:**
- [ ] Todos los elementos interactivos son alcanzables con `Tab` y tienen `:focus-visible` claro (`2px solid var(--accent-primary)`, `outline-offset: 2px`)
- [ ] Ningún atajo global de teclado se dispara cuando el foco está dentro de un `<input>`, `<textarea>` o elemento `contenteditable`
- [ ] Los modales y drawers (`ExplorerGoto.vue`, `ExplorerHelp.vue`) atrapan el foco y se cierran con `Escape` devolviendo el foco al elemento disparador

---

## 3. Lector de Pantalla Comprende la Jerarquía y los Cambios de Vista

**Criterio:** VoiceOver / NVDA anuncia correctamente la estructura semántica, la tabla/grid activa y los filtros aplicados.

**Checklist:**
- [ ] Un solo `<h1>` por vista; jerarquía `<h2>` -> `<h3>` sin saltos
- [ ] Botones solo-ícono tienen `aria-label` descriptivo
- [ ] El selector de vista (`Grid` / `Table` / `Timeline`) y el botón de Hyperfocus usan `aria-pressed` o `role="tablist"` / `role="tab"` con `aria-selected`
- [ ] El efecto `ScrambleText` preserva `aria-label` con el texto final limpio para que el lector de pantalla no lea caracteres aleatorios

---

## 4. `prefers-reduced-motion: reduce` y Modo Hyperfocus

**Criterio:** Con movimiento reducido activo en el sistema operativo o con el modo Hyperfocus (`html[data-hyperfocus="true"]`), todas las transiciones espaciales, spotlights y scrambles se desactivan instantáneamente.

**Checklist:**
- [ ] En CSS global y componentes existe el bloque `@media (prefers-reduced-motion: reduce)` que lleva duraciones a `0.01ms`
- [ ] En JS, los composables de animación (`useScrambleText`, `CountUp`, `SpotlightCard`) verifican `window.matchMedia('(prefers-reduced-motion: reduce)').matches` y el estado de `useHyperfocus()` antes de iniciar loops de `requestAnimationFrame`

---

## 5. Cero Layout Shift (CLS = 0.00) y Anti-FOUC

**Criterio:** Ningún elemento salta ni cambia el tamaño de sus vecinos al hidratarse, cargar fuentes o cambiar números.

**Checklist:**
- [ ] Tema (`dark`/`light`) e idioma resueltos antes del primer paint sin parpadeo (anti-FOUC)
- [ ] Contadores numéricos, índices (`01`, `02`), latencias y fechas usan `font-variant-numeric: tabular-nums`
- [ ] Imágenes y contenedores multimedia declaran `aspect-ratio` o dimensiones explícitas

---

## 6. Responsive Impecable desde `320px` hasta `2560px`

**Criterio:** Ningún viewport produce scroll horizontal involuntario y los controles táctiles en móvil tienen área mínima de `44×44px`.

**Checklist:**
- [ ] En `320px–767px`, el sidebar se transforma en drawer accesible con backdrop y cierre automático al navegar
- [ ] Las tablas densas usan contenedor con `overflow-x: auto` aislado sin desbordar el `<body>`
- [ ] Las tarjetas Bento colapsan limpiamente a 1 columna en móvil

---

## 7. Degradación Elegante ante Campos `NULL` o API Caída

**Criterio:** Ningún campo opcional vacío (`summary`, `repoUrl`, `deployUrl`, `logoUrl`, `endDate`) ni la caída de PostgreSQL rompe el layout o muestra `undefined` / `null` en pantalla.

**Checklist:**
- [ ] Todo campo nullable tiene fallback visual limpio (ocultar bloque o mostrar `—` estilizado en vista tabla)
- [ ] Si PostgreSQL no está disponible, el backend sirve `fallbackData.ts` transparente y el header indica el estado sin romper la navegación

---

## 8. Impresión y Exportación A4 de Cota Dual (Harvard ATS)

**Criterio:** La vista `/about` y los componentes de exportación PDF generan exactamente 1 hoja A4 completa, sin hojas fantasma ni áreas vacías inferiores desproporcionadas.

**Checklist:**
- [ ] En emulación `print`, el contenedor del documento mide entre `248mm` y `268mm` de altura neta (cobertura vertical `>= 90%`).
- [ ] El buffer PDF generado con `preferCSSPageSize: true` reporta exactamente `1` objeto `/Type /Page` (0 overflow a página 2).
- [ ] El tamaño de fuente del cuerpo y viñetas se mantiene en `9.2pt - 9.5pt` legible para escaneo ATS.
- [ ] Los 4 archivos estáticos de descarga en `public/cv/` (`CV-ES-...`, `CV-EN-...`) están sincronizados y validados a 1 página.

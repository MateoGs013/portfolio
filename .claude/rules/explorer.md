---
paths:
  - "app/components/**"
  - "app/pages/**"
  - "app/lib/**"
---

# Sitio público: reglas estructurales

El sistema visual, el vocabulario de movimiento, el contrato de anclas del DOM, el Hiperfoco, la política de movimiento, las teclas y las rutas están en **`docs/diseno.md`**, que es la fuente única. Leelo antes de tocar un componente, una página o `app/lib/`. Este archivo solo agrega lo estructural, que no cambia con el diseño.

## DOM accesible y SSR

- **Todo el texto es DOM, nunca WebGL ni canvas:** seleccionable, buscable con Ctrl+F, legible por lector de pantalla e indexable. Las letras partidas para animar llevan `aria-hidden` y el texto completo va en un `.sr` o en el `aria-label` del contenedor.
- **El SSR entrega la página completa.** Datos con `useAsyncData`, nunca con `fetch` en `onMounted`. Con JS apagado se lee todo y se navega por enlaces reales (`<NuxtLink>` / `<a href>`). Ninguna animación deja contenido en `opacity: 0` si JS no corre.
- **Un `<h1>` por página** y jerarquía sin saltos. Botones solo con ícono llevan `aria-label`. Los interruptores usan `aria-pressed`. Una sola región `aria-live` para anuncios.
- **Teclado:** todo interactivo es alcanzable con Tab y tiene `:focus-visible` con `--sig-text`. Los diálogos atrapan el foco y lo devuelven al disparador. Las teclas de una letra son las de `docs/diseno.md` §7, en un solo `useHotkeys`.
- **Contraste AA** en los dos temas y en Hiperfoco. `prefers-reduced-motion` lleva todo a su estado final sin animar.

## Una cosa por pantalla

Cada página muestra una superficie a la vez y tiene un solo gesto de imagen (la vista previa en el inicio, la galería en Obra, la captura que crece en el caso). Si una pantalla combina dos superficies o dos gestos, está mal aunque cada uno sea sobrio. Para Mateo «abrumador» es cantidad de cosas a la vez, no densidad tipográfica.

## Contenido

- Cero texto de contenido en los componentes: nombres, ubicaciones, cifras, obras y enlaces salen de la API. La interfaz (rótulos, estados, aria, etiquetas de métricas) va en `app/lib/dict/`, un archivo por área, ES y EN.
- Campos vacíos: no se ven en diseño y aparecen como `NULL` en registro. Nunca `undefined`, `null` ni un bloque vacío en pantalla.
- Solo las obras publicadas en la base existen en el sitio; la visibilidad la resuelve la API, nunca un componente.

## Código

- Archivos de menos de 300 líneas; las páginas son orquestadores delgados. Carpetas por área en `app/components/`: `site/`, `home/`, `work/`, `case/`, `about/`, `record/`, `motion/`, `media/`, `cv/`, `articles/` y `ui/`.
- Tailwind CSS v4 primero, con los tokens del `@theme` (sin `text-[Npx]` ni colores sueltos). Las hojas globales (`tokens.css`, `motion.css`, `print.css`, `hyperfocus.css`) solo miran las anclas del contrato.
- Toda animación pasa por `useMotion` y respeta `useMotionPrefs`. Ningún componente escribe `innerHTML`.

## CV Harvard ATS: cota dual

La hoja del CV (`/about?cv=ats`, los PDF de `public/cv/` y el generador del Job Hunter) entra en **una sola página A4**:

1. **Sin desborde:** nunca una segunda página (`pageCount === 1`).
2. **Sin vacío:** la hoja mide entre 248 y 265 mm (del 90 % al 96 % de los 276 mm imprimibles).
3. **Escala ATS:** nombre de 19 a 21 pt, títulos de sección de 11 a 11,5 pt, cuerpo y viñetas de 9,2 a 9,5 pt con interlineado de 1,3 a 1,35. Nunca bajar de 9 pt para que entre: se ajusta la cantidad y la concisión de las viñetas.
4. **Un único `@page { size: A4; margin: 10.5mm 12mm }`** en el CSS de `app/`. Puppeteer y Playwright imprimen con `preferCSSPageSize: true` y sin márgenes propios. El generador del Job Hunter (`server/src/admin/`) conserva su propio `@page` y sus márgenes: los decide A3 de forma explícita, esta regla no lo obliga a cambiar (invariante 6).

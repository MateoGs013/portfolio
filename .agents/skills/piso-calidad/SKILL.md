---
name: piso-calidad
description: Verifica que las páginas y componentes del sitio público cumplan los 8 requisitos de SSR, teclado, lector de pantalla, movimiento e Hiperfoco, estabilidad, responsive, resiliencia e impresión del CV antes de dar por cerrada cualquier tarea visual o de frontend.
---

# Piso de calidad: los 8 requisitos

Invocar esta skill antes de considerar terminada cualquier página o componente en `app/`. Ningún cambio se publica sin cumplir los 8 puntos. Las reglas de fondo están en `docs/diseno.md` (diseño, anclas, Hiperfoco, movimiento, teclas y rutas) y `.claude/rules/explorer.md` (estructura y cota dual del CV); esta skill es la lista para verificarlas. Se verifica en local, contra los puertos propios, nunca en producción. Versión breve sincronizada en `.claude/skills/piso-calidad/SKILL.md`.

## 1. Funciona sin JavaScript (SSR real)

El HTML de la primera respuesta trae el contenido completo y se navega con enlaces reales.

- [ ] Los datos vienen de `useAsyncData`, nunca de un `fetch` en `onMounted`.
- [ ] Ninguna animación deja texto en `opacity: 0` o fuera de su máscara si JS no corre. Lo que ya está en pantalla al cargar no se anima.
- [ ] Cabecera, obras, facetas (`?status=`, `?stack=`), idioma (`?lang=en`) y registro (`?vista=registro`) son `<NuxtLink>` / `<a href>` reales y el SSR los resuelve.

## 2. Navegable 100 % con teclado

- [ ] Todo interactivo es alcanzable con Tab y tiene `:focus-visible` con `--sig-text`.
- [ ] Las teclas de `docs/diseno.md` §7 funcionan: `1`–`5`, `j`/`k`, `Enter`, `Esc` (capas y después Hiperfoco), `Backspace`, `R`, `H`, `/` y `Ctrl/⌘K`.
- [ ] Ninguna tecla de una letra se dispara con foco en `input`, `textarea`, `select`, `[role=combobox]` o `[contenteditable]`, ni con un diálogo abierto, ni con los atajos apagados desde la paleta.
- [ ] La paleta atrapa el foco, se cierra con `Esc` y devuelve el foco al disparador.

## 3. El lector de pantalla entiende la página

- [ ] Un solo `<h1>` por página; jerarquía sin saltos.
- [ ] Las letras partidas para animar llevan `aria-hidden` y el texto completo está en un `.sr` o en el `aria-label` del contenedor.
- [ ] Botones solo con ícono con `aria-label`; interruptores (Hiperfoco, tema, sonido) con `aria-pressed`.
- [ ] Cambios de idioma, registro, Hiperfoco y «Copiado» se anuncian por la única región `aria-live`.
- [ ] Los campos sin traducción llevan `lang="es"` cuando la página está en inglés.

## 4. `prefers-reduced-motion` e Hiperfoco

- [ ] Toda animación pasa por `useMotion` y respeta `useMotionPrefs` (`allowAmbient`, `allowTransitions`).
- [ ] Con reduced motion: sin Lenis, sin partir texto, sin autoplay (póster y controles), view transitions y morph instantáneos.
- [ ] Con Hiperfoco (`html[data-hyperfocus="true"]`): navegación intacta, `[data-hf="hide"]` y `[data-ornament]` ocultos, columna `[data-hf="measure"]`, imágenes en monocromo, temperatura en 0 y movimiento ambiental apagado. Ningún componente se renderiza solo en Hiperfoco.

## 5. Cero layout shift (CLS 0) y sin parpadeo

- [ ] Tema (`pf-theme`), Hiperfoco (`pf-hyperfocus`), idioma y vista salen del SSR: el primer pintado ya es el correcto.
- [ ] Números, años y conteos con `font-variant-numeric: tabular-nums`.
- [ ] Imágenes y videos reservan su relación de aspecto (`width`/`height` desde la Media).
- [ ] El cargador de la primera visita no corre el contenido: aparece encima y se va.

## 6. Responsive de 320 px a 2560 px

- [ ] `document.documentElement.scrollWidth <= clientWidth` en 320, 375, 768, 1440 y 2560 px.
- [ ] Debajo de 768 px: galería en columna, captura estática, caso a una columna, utilidades de la cabecera en un `<details>` que funciona sin JS.
- [ ] Áreas táctiles de 44 × 44 px como mínimo. El email no se corta (`white-space: nowrap`, nunca `break-all`).

## 7. Degradación elegante (`NULL` o base caída)

- [ ] Un campo vacío no se ve en diseño y aparece como `NULL` en registro; nunca `undefined`, `null` ni un bloque vacío.
- [ ] Si PostgreSQL no responde, la API sirve la última respuesta buena o el snapshot generado (`server/src/snapshot/content.json`) y el SSR no se rompe. El front no tiene datos propios.

## 8. Impresión del CV en una página A4 (cota dual)

- [ ] `/about?cv=ats` en emulación `print`: la hoja mide entre 248 y 265 mm (90–96 % de los 276 mm imprimibles) y no hay segunda página.
- [ ] Un único `@page { size: A4; margin: 10.5mm 12mm }` en el CSS de `app/`; se ocultan `[data-chrome]`, `[data-hf="hide"]` y `[data-ornament]`, se resetea `[data-motion]` y `[data-hf="measure"]` se imprime (sin el límite de 68ch).
- [ ] Cuerpo y viñetas entre 9,2 y 9,5 pt.
- [ ] Los dos PDF de `public/cv/` (`CV-ES-…-ATS.pdf`, `CV-EN-…-ATS.pdf`) tienen exactamente una página y las URL sin `-ATS` redirigen a ellos.

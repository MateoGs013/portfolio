---
name: piso-calidad
description: Verifica que las páginas y componentes del sitio público cumplan los 8 requisitos de SSR, teclado, lector de pantalla, movimiento e Hiperfoco, estabilidad, responsive, resiliencia e impresión del CV antes de dar por cerrada cualquier tarea visual o de frontend.
---

# Piso de calidad: los 8 requisitos

Invocar esta skill antes de considerar terminada cualquier página o componente en `app/`. Ningún cambio se publica sin cumplir los 8 puntos. Las reglas de fondo están en `docs/diseno.md` y `.claude/rules/explorer.md`; la lista detallada para verificar cada punto está en `.agents/skills/piso-calidad/SKILL.md` (sincronizada con esta). Se verifica en local, nunca en producción.

1. **Funciona sin JavaScript:** datos con `useAsyncData`, todo el texto visible en el SSR, enlaces reales para páginas, facetas, `?lang=en` y `?vista=registro`.
2. **Navegable 100 % con teclado:** Tab con `:focus-visible` (`--sig-text`) y las teclas de `docs/diseno.md` §7 (`1`–`5`, `j`/`k`, `Enter`, `Esc`, `Backspace`, `R`, `H`, `/`, `Ctrl/⌘K`), nunca dentro de campos ni detrás de un diálogo; la paleta devuelve el foco.
3. **Lector de pantalla:** un `<h1>` por página sin saltos, letras animadas con `aria-hidden` y texto completo accesible, `aria-pressed` en los interruptores, una sola región `aria-live`, `lang="es"` en lo que no tiene traducción.
4. **Reduced motion e Hiperfoco:** todo por `useMotion` y `useMotionPrefs`; con reduced motion nada anima; con Hiperfoco (`html[data-hyperfocus="true"]`) la navegación queda, se ocultan `[data-hf="hide"]` y `[data-ornament]`, imágenes en monocromo y sin movimiento ambiental.
5. **CLS 0 y sin parpadeo:** tema, Hiperfoco, idioma y vista desde el SSR (cookies `pf-theme` y `pf-hyperfocus`), `tabular-nums` en números, medios con relación de aspecto reservada.
6. **Responsive de 320 a 2560 px:** sin scroll horizontal, corte único en 768 px, áreas táctiles de 44 × 44 px, el email sin cortes.
7. **Degradación elegante:** campos vacíos ocultos en diseño y `NULL` en registro; con la base caída, la API sirve la última respuesta buena o el snapshot generado, y el SSR no se rompe.
8. **CV en una página A4 (cota dual):** `/about?cv=ats` impreso entre 248 y 265 mm sin segunda página, un único `@page { size: A4; margin: 10.5mm 12mm }`, cuerpo de 9,2 a 9,5 pt y los dos PDF ATS de una página.

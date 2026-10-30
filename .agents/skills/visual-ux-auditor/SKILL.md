---
name: visual-ux-auditor
description: Flujo de inspección visual y de UX con Playwright contra el entorno local. Captura el sitio público en varios anchos, en los dos temas, con Hiperfoco, en modo registro y en impresión del CV, y las inspecciona con view_file para evaluar fidelidad al prototipo, contraste, overflow y accesibilidad.
---

# Auditoría visual con Playwright («ojos del agente»)

Se audita siempre en local, antes de cualquier push: el sitio en `pnpm dev` (:3000) y la API en `pnpm dev:api` (:3001), o los puertos que indique la tarea vía `PLAYWRIGHT_BASE_URL`. Nunca se audita producción en lugar de la revisión local. La referencia de cómo se tiene que ver es `docs/rediseno/movimiento.html` y las reglas, `docs/diseno.md`.

## 1. Cómo funciona

1. **Captura:** `pnpm test:e2e` o un spec puntual en `tests/e2e/` con Chromium, `deviceScaleFactor: 2`. Las capturas van al directorio de artefactos de la sesión, no al repo (las de referencia versionadas son solo las de `tests/e2e/visual.spec.ts-snapshots/`).
2. **Inspección:** `view_file` sobre cada `.png`. Se evalúa contra el prototipo: composición, ritmo, jerarquía tipográfica, una sola superficie por pantalla, contraste en los dos temas y ausencia de recortes o solapamientos.

## 2. Matriz

**Anchos:** 1440 × 900, 768 × 1024, 375 × 812 y 320 × 568. En los dos últimos, `scrollWidth <= clientWidth` y áreas táctiles de al menos 44 × 44 px (`boundingBox()`).

**Páginas:** `/`, `/projects`, `/projects/<una obra>`, `/about`, `/about?cv=ats` y `/articles`.

**Estados:**
- Tema oscuro (por defecto) y claro: cookie `pf-theme`.
- Hiperfoco: cookie `pf-hyperfocus=true` o `?foco=1`. Navegación intacta, sin ornamentos, imágenes en monocromo.
- Registro: `?vista=registro`. Campos tipados y `NULL` visibles, también con JS apagado.
- Reduced motion: `page.emulateMedia({ reducedMotion: 'reduce' })`. Todo quieto y legible.
- Impresión: `page.emulateMedia({ media: 'print' })` en `/about?cv=ats`. Una sola página A4, sin cromo.
- Sin JS: `javaScriptEnabled: false`. Contenido completo y navegación por enlaces.

## 3. Consola, red y teclado

- **Cero errores:** escuchar `console` y `pageerror`; ni errores de hidratación ni nombres de view transition duplicados.
- **Sin pedidos duplicados** a la misma colección de la API en una navegación.
- **Teclado real:** `page.keyboard.press` con las teclas de `docs/diseno.md` §7 y verificar `document.activeElement` después de cada una.
- **axe** (`@axe-core/playwright`): sin violaciones serias en cada página y estado.

## 4. Comandos

- `pnpm test:e2e`: la suite completa contra el entorno local.
- `PLAYWRIGHT_BASE_URL=http://localhost:<puerto> pnpm test:e2e <spec>`: un spec contra otros puertos.

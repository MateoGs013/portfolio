---
name: visual-ux-auditor
description: Flujo de inspección visual, UX/UI y tests E2E automatizados con Playwright. Permite capturar screenshots multi-viewport (Desktop, Tablet, Mobile 320px), multi-tema (Obsidian Dark, Technical Paper, Hyperfocus, Print A4) e inspeccionarlos con view_file para evaluar diseño, micro-interacciones, contraste, overflow y accesibilidad con ojos propios.
---

# Visual & UX/UI Auditor con Playwright ("Ojos del Agente")

Esta skill dota al agente de **visión directa sobre el navegador real** mediante **Playwright (`@playwright/test`)** y la herramienta `view_file` (que soporta lectura nativa de imágenes `.png`). Úsala siempre antes y después de realizar cambios visuales, de layout, de micro-interacciones o en la consola `/admin`.

---

## 1. Cómo Funcionan los "Ojos" del Agente

1. **Captura Automatizada con Playwright**:
   - Ejecuta la suite de Playwright (`pnpm test:e2e` o `pnpm audit:visual`) o un script puntual en `tests/e2e/` que levanta Chromium headless contra el frontend (`http://localhost:3000`) y el backend/admin (`http://localhost:3003`).
   - Guarda capturas de pantalla de alta resolución (`deviceScaleFactor: 2`) en el directorio de artefactos de la sesión o en `tests/screenshots/`.
2. **Inspección Visual con `view_file`**:
   - Invoca `view_file` pasando el `AbsolutePath` del archivo `.png` generado.
   - Analiza con criterio de diseño 2026: jerarquía tipográfica, alineación de grillas Bento, contraste en ambos temas (`Dark` y `Technical Paper`), estado del modo `Hyperfocus`, ausencia de recortes o solapamientos y fidelidad del CV Harvard ATS en modo impresión (`page.emulateMedia({ media: 'print' })`).

---

## 2. Matriz de Evaluación Visual y UX/UI Obligatoria

Cada iteración importante de Frontend o Admin debe evaluarse en estas dimensiones:

### A. Matriz de Viewports
- **Desktop Wide (`1440×900`)**: Verificar balance del Bento Grid, sidebar de colecciones, topbar con breadcrumbs y panel de detalle sin espacios muertos.
- **Tablet (`768×1024`)**: Verificar transición de grillas de 3->2 columnas y legibilidad de tablas.
- **Mobile Compacto (`375×812` y `320×568`)**:
  - Verificar que `document.documentElement.scrollWidth <= document.documentElement.clientWidth` (**cero overflow horizontal**).
  - Verificar que los botones e ítems interactivos tengan caja táctil `>= 44×44px` (`boundingBox()`).
  - Verificar apertura/cierre del drawer móvil.

### B. Matriz de Temas y Estados
- **Obsidian Dark (`data-theme="dark"`)**: Superficies `#09090B` / `#121215`, bordes sutiles `rgba(255,255,255,0.07)` y spotlight radial equilibrado.
- **Technical Paper (`data-theme="light"`)**: Papel cálido `#FAF8F5`, texto tinta `#141413` y contraste editorial limpio sin sombras sucias.
- **Modo Hyperfocus (`data-hyperfocus="true"`, tecla `H`)**: Verificar que desaparezca el ruido visual y los efectos decorativos instantáneamente.
- **Modo Print A4 (`emulateMedia({ media: 'print' })` en `/about` y `/admin` Job Hunter)**: Verificar que el CV Harvard ATS entre en 1 página A4 limpia sin elementos de navegación filtrados.

### C. Telemetría de Consola, Red y Teclado
- **Cero errores en consola**: Escuchar `page.on('console', ...)` y `page.on('pageerror', ...)` — ningún `ReferenceError`, `Hydration node mismatch` ni warning de Vue debe ocurrir.
- **Cero peticiones duplicadas**: Auditar con `page.on('request', ...)` que `/api/schema` o `/api/projects` no se disparen por duplicado en una misma navegación.
- **Navegación real por teclado**: Simular `page.keyboard.press('1')`, `ArrowDown`, `Enter`, `Escape`, `/`, `h` y `Control+k` verificando el foco activo (`document.activeElement`).

---

## 3. Comandos Rápidos del Flujo

- `pnpm test:e2e`: Ejecuta toda la suite de validación E2E y UX/UI con Playwright.
- `pnpm audit:visual`: Ejecuta el generador de capturas multi-viewport y multi-tema para inspección visual inmediata con `view_file`.

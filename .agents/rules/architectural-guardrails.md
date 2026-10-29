# Architectural Guardrails & Engineering Standards (2026 Edition)

Este documento establece las reglas obligatorias e inmutables de arquitectura, diseño responsivo, micro-interacciones y protocolo de despliegue para el portfolio de Mateo Sonzogni (`https://mateogs.tech`). Cualquier agente de IA (Gemini / Antigravity) o desarrollador debe acatar estas reglas estrictamente.

---

## 1. Regla de Oro: Modularidad Atómica (< 300 Líneas por Archivo)

1. **Límite Estricto**: Ningún componente Vue, composable o módulo puede superar las **300 líneas de código** (techo absoluto de tolerancia: 350 líneas).
2. **Prohibición de Monolitos**: Están terminantemente prohibidos los archivos monolíticos multifunción (como el antiguo `ExplorerFolder.vue` de 3,800 líneas).
3. **Descomposición por Dominio**:
   - Cada sección o subvista debe residir en su propia carpeta atómica con responsabilidad única:
     - `app/components/explorer/home/` para las secciones de la Home (`Hero`, `Works`, `Capabilities`, `Contact`).
     - `app/components/explorer/dossier/` para el modo Hiperfoco (`Dossier`).
     - `app/components/explorer/collection/` para vistas de carpeta (`Header`, `Grid`, `Timeline`, `Table`).
4. **Coordinadores Delgados**: Los componentes de nivel superior (`ExplorerFolder.vue`, `ExplorerView.vue`) deben actuar exclusivamente como orquestadores delgados (< 150 líneas), delegando la presentación y la interacción a sus subcomponentes.

---

## 2. Regla de Unidades Relativas y Fluidas (Cero Píxeles Fijos en Layout)

1. **Unidades Relativas Obligatorias**: Todo contenedor, ancho, margen, padding y tamaño tipográfico debe expresarse en unidades relativas y fluidas:
   - `clamp(min, preferred, max)` para tipografía y espacios elásticos.
   - `rem`, `vw`, `%`, `ch` para anchos y altos de layout.
2. **Prohibición de Píxeles Fijos**: Queda estrictamente prohibido usar anchos fijos en píxeles (`w-[320px]`, `width: 480px`, `text-[48px]`) en contenedores principales o cabeceras.
3. **Cero Desbordamiento Horizontal**: La aplicación debe garantizar 0px de desbordamiento horizontal (`overflow-x: hidden`) desde móviles ultra-estrechos (**320px**) hasta monitores **4K Ultra-wide**.

---

## 3. Regla de Integridad de Identificadores y Correos (No `break-all`)

1. **Prohibición de `break-all` en Identificadores**: Queda terminantemente prohibido partir direcciones de correo electrónico, URLs, nombres o slugs con `break-all` (evita aberraciones como `mateoga-` `bus@gmail.com`).
2. **Tratamiento Tipográfico de Emails y Datos Clave**:
   - Emplear siempre `whitespace-nowrap inline-block max-w-full`.
   - Escalar el tamaño de fuente con `clamp(1.05rem, 2.8vw, 2.5rem)`.
   - Utilizar envoltorios flexbox elásticos con `flex-wrap` y `min-w-0` para permitir que los elementos adyacentes fluyan a la siguiente línea limpiamente.

---

## 4. Regla de Navegación Continua (Cero Pantallas Negras)

1. **State Retention (Stale-While-Revalidate)**:
   - Al navegar entre rutas o cambiar de sección, **nunca** desmontar el DOM ni dejar la vista en blanco/negro mientras se resuelve una promesa asíncrona (`useAsyncData`).
   - Mantener siempre visible la vista actual (`displayEx = ref(ex.value ?? null)`) hasta que los nuevos datos estén listos.
2. **Transiciones Suaves**:
   - Usar `<Transition name="pane-morph" mode="out-in">` con curvas cúbicas suaves aceleradas por GPU (`cubic-bezier(0.16, 1, 0.3, 1)`).
   - Telemetría en tiempo real: haz láser de 2px en el borde superior indicando profundidad de scroll (`0%` a `100%`) y HUD de estado inferior con ticks acústicos.

---

## 5. Regla de Micro-interacciones y Estética Bencho UI / Awwwards

1. **Feedback Háptico y Acústico**: Cada interacción táctil (clicks en botones, cambio de modo, apertura de modales) debe acompañarse de sonido sutil con `useBenchoSound` (`pop`, `notch`, `press`, `switch`, `laser`).
2. **Física de Resortes (Spring Physics)**:
   - Los elementos flotantes, dynamic islands y cursores interactivos deben usar dinámica de amortiguación de segundo orden ($k = 380\text{ N/m}$, $c = 28\text{ Ns/m}$, $m = 0.9\text{ kg}$).
   - Quedan prohibidas las animaciones toscas con easing lineal en componentes clave.
3. **Artefactos Visuales Vivos**:
   - Bordes láser vivos (`UiBorderBeam`).
   - Destellos de click táctiles (`UiClickSpark`).
   - Texto descifrado al montar (`UiDecryptedText` / `UiTextBlurReveal`).
   - Globo terráqueo 3D interactivo (`UiDotGlobe`).

---

## 6. Protocolo Obligatorio de Verificación y Despliegue en 5 Fases

Cualquier cambio de código debe seguir rigurosamente esta secuencia **sin excepciones**:

```
[1. Local Typecheck] ──> [2. Local Lint] ──> [3. Git Commit & Push] ──> [4. Espera VPS (25s)] ──> [5. Playwright Audit]
```

1. **Fase 1: Verificación de Tipos**:
   - Ejecutar `pnpm typecheck`. Debe finalizar con código `0` y 0 errores.
2. **Fase 2: Calidad y Linting**:
   - Ejecutar `pnpm lint`. Debe finalizar con código `0` y 0 advertencias/errores.
3. **Fase 3: Git Commit & Push**:
   - Crear commit semántico (`feat:`, `fix:`, `refactor:`, `perf:`).
   - Realizar `git push origin main`.
4. **Fase 4: Despliegue en VPS**:
   - **Regla estricta**: NUNCA inspeccionar el sitio con `/browser` o Playwright antes de haber hecho commit, push y esperado ~25 segundos para que Coolify reconstruya y levante la imagen en el VPS.
5. **Fase 5: Auditoría Automatizada Playwright**:
   - Validar sobre el dominio productivo `https://mateogs.tech` en múltiples viewports (Desktop 1440px, Tablet 768px, Mobile 375px y Mobile 320px).
   - Confirmar 0 desbordamiento horizontal, 0 errores de consola y renderizado completo.

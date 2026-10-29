# AGENTS.md — Protocolo y Directrices de Desarrollo Autónomo

Bienvenido al repositorio de Mateo Sonzogni (`portfolio`). Este archivo rige las operaciones de agentes de IA y desarrolladores.

## Reglas Inmutables de Arquitectura

1. **Modularidad Atómica (< 300 Líneas por Componente)**:
   - Ningún archivo Vue debe superar las 300 líneas de código.
   - Descomponer monolitos en carpetas de dominio (`app/components/explorer/home/`, `app/components/explorer/collection/`, `app/components/explorer/dossier/`).
   - Mantener componentes superiores como orquestadores delgados (< 150 líneas).

2. **Unidades Relativas y Cero Píxeles Fijos**:
   - Nunca usar anchos fijos en píxeles en contenedores o textos principales.
   - Usar `clamp()`, `rem`, `vw`, `%` para un diseño 100% fluido desde 320px hasta 4K.
   - Cero desbordamiento horizontal (`0px` overflow-x).

3. **Integridad de Textos e Identificadores**:
   - Queda estrictamente prohibido usar `break-all` en correos electrónicos o identificadores técnicos.
   - Usar `whitespace-nowrap inline-block max-w-full` con `clamp(1.05rem, 2.8vw, 2.5rem)`.

4. **Navegación Continua (Sin Pantallas Negras)**:
   - Nunca desmontar la vista actual al navegar mientras se cargan datos asíncronos (`stale-while-revalidate` con `displayEx`).
   - Transiciones suaves con `<Transition name="pane-morph" mode="out-in">`.

5. **Micro-interacciones Bencho UI / Awwwards**:
   - Retroalimentación acústica con `useBenchoSound` (`pop`, `notch`, `press`, `switch`).
   - Física de resortes de 2do orden ($k = 380\text{ N/m}$, $c = 28\text{ Ns/m}$, $m = 0.9\text{ kg}$).
   - Destellos táctiles (`UiClickSpark`) y haces láser (`UiBorderBeam`).

6. **Secuencia de Verificación y Despliegue**:
   - 1) `pnpm typecheck` (0 errores)
   - 2) `pnpm lint` (0 errores)
   - 3) `git commit & push`
   - 4) Esperar 25s al despliegue en VPS (Coolify)
   - 5) Auditar en vivo en `https://mateogs.tech` con Playwright.
   - **PROHIBIDO**: Inspeccionar con browser o Playwright antes de haber hecho commit & push.

Consulta detalles adicionales en `.agents/rules/architectural-guardrails.md`.

---
name: piso-calidad
description: Verifica que las vistas y componentes del Explorador Relacional cumplan los 7 requisitos de accesibilidad, SSR, teclado, rendimiento y resiliencia antes de dar por cerrada cualquier tarea visual o de frontend.
---

# Piso de Calidad — Los 7 Requisitos No-Negociables

Invocar esta skill antes de considerar terminada cualquier vista o componente en `app/`. Ningún cambio pasa a producción sin cumplir los 7 puntos. (Sincronizada con `.agents/skills/piso-calidad/SKILL.md`).

1. **Funciona sin JavaScript (SSR Real)**: Datos desde `useAsyncData`, nunca `opacity: 0` bloqueante sin fallback, `<NuxtLink>` con `href` real.
2. **Navegable 100% con Teclado**: Atajos `0–5`, `↑/↓/←/→`, `Enter`, `Backspace`/`Escape`, `/`, `H`, `⌘K`, y `:focus-visible` claro.
3. **Lector de Pantalla (ARIA)**: Jerarquía `<h1>`->`<h2>`->`<h3>` sin saltos, `aria-label` intacto en `ScrambleText`, estados `aria-pressed` / `aria-selected`.
4. **`prefers-reduced-motion: reduce` y Modo Hyperfocus (`html[data-hyperfocus="true"]`)**: Desactivación instantánea de spotlights, scrambles y transiciones espaciales.
5. **Cero Layout Shift (CLS = 0.00) y Anti-FOUC**: `font-variant-numeric: tabular-nums` en contadores/índices y resolución de tema pre-paint.
6. **Responsive `320px–2560px`**: Sin overflow horizontal en `<body>`, áreas táctiles de `44×44px` en móvil.
7. **Degradación Elegante (`NULL` / Fallback DB)**: Campos opcionales vacíos se ocultan o muestran `—` limpio; si PostgreSQL cae, `fallbackData.ts` responde sin romper el SSR.

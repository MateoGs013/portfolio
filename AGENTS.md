# AGENTS.md

Repositorio del portafolio de Mateo Sonzogni (Nuxt 4 + Express 5 + Prisma + PostgreSQL 17). Este archivo es la puerta de entrada para cualquier agente (Gemini, Antigravity u otro). No tiene reglas propias: apunta a las mismas fuentes que lee Claude, así nadie trabaja con reglas distintas.

## Qué leer

| Si vas a tocar | Leé |
|---|---|
| Cualquier cosa | `CLAUDE.md`: invariantes, stack, comandos y estructura del repo |
| El sitio público (`app/**`) | **`docs/diseno.md`** (fuente única del diseño: movimiento, tokens, anclas del DOM, Hiperfoco, teclas y rutas) y `.claude/rules/explorer.md` (reglas estructurales y la cota dual del CV) |
| El backend (`server/src/**`, `prisma/**`) | `.claude/rules/backend.md` |
| La consola `/admin` (`server/admin/**`) | `.claude/rules/admin.md` y `docs/admin.md` |
| Una idea nueva de diseño | `docs/decisiones.md`: hay caminos cerrados y volver a proponerlos hace perder tiempo |
| El rediseño en curso | `docs/rediseno/implementacion.md` y `docs/rediseno/paquetes.json` |

Las skills de `.agents/skills/` resumen esas mismas fuentes para tareas concretas. Si una skill contradice a `docs/diseno.md` o a `.claude/rules/`, ganan estos y se corrige la skill. No se escriben reglas nuevas fuera de esos archivos.

## Cómo se trabaja

1. **Local primero.** Todo se verifica en la máquina antes de publicar nada: `pnpm typecheck` y `pnpm lint` en 0, y la página revisada en el navegador local (`pnpm dev` en :3000 y `pnpm dev:api` en :3001) o con Playwright contra local.
2. **Push y despliegue solo con el OK de Mateo.** Nunca se hace push, se toca la base de producción, el VPS ni una URL en vivo por iniciativa propia. Producción se audita después del despliegue, no en lugar de la revisión local.
3. **Archivos de menos de 300 líneas.** Las páginas y los contenedores son orquestadores delgados.
4. **Cero contenido escrito a mano.** Todo sale de PostgreSQL vía la API; la interfaz va en `app/lib/dict/`.
5. **Sin emojis** en el sitio ni en el admin.

# AGENTS.md

Repositorio del portafolio de Mateo Sonzogni (Nuxt 4 + Express 5 + Prisma + PostgreSQL 17, con el admin en Vite + Vue + TypeScript). Este archivo es la puerta de entrada para cualquier agente (Gemini, Antigravity u otro). No tiene reglas propias: apunta a las mismas fuentes que lee Claude, así nadie trabaja con reglas distintas.

## Qué leer

| Si vas a tocar | Leé |
|---|---|
| Cualquier cosa | `CLAUDE.md`: invariantes, stack, comandos y estructura del repo |
| El sitio público (`app/**`) | **`docs/diseno.md`** (fuente única del diseño: movimiento, tokens, anclas del DOM, Hiperfoco, teclas y rutas) y `.claude/rules/explorer.md` (reglas estructurales y la cota dual del CV) |
| El backend (`server/src/**`, `prisma/**`) | `.claude/rules/backend.md` |
| La consola `/admin` (`server/admin/src/**`, `server/src/admin/**`) | `.claude/rules/admin.md` (invariantes y anatomía) y `docs/admin.md` (rutas, dirección visual, matriz de datos, contrato con Eros e inventario de endpoints) |
| Una idea nueva de diseño | `docs/decisiones.md`: hay caminos cerrados y volver a proponerlos hace perder tiempo |
| La historia de un rediseño | Sitio: `docs/rediseno/implementacion.md` y `docs/rediseno/paquetes.json`. Admin: `docs/rediseno-admin/plan.md` (mandan sus secciones finales), `paquetes.json` y la demo aprobada `demo.html` |

Las skills de `.agents/skills/` resumen esas mismas fuentes para tareas concretas. Si una skill contradice a `docs/diseno.md` o a `.claude/rules/`, ganan estos y se corrige la skill. No se escriben reglas nuevas fuera de esos archivos.

## Cómo se trabaja

1. **Local primero.** Todo se verifica en la máquina antes de publicar nada: `pnpm typecheck` y `pnpm lint` en 0 (el lint incluye los chequeos del admin), y la página revisada en el navegador local (`pnpm dev` en :3000, `pnpm dev:api` en :3001 y, para el admin, `pnpm build:admin` o `pnpm dev:admin` en :3002) o con Playwright contra local. Las pruebas del admin corren siempre con `node scripts/admin-run.mjs [--demo] [--eros-mock] [--web] -- <comando>`, sobre una copia descartable de la base y con Eros apagado o simulado; el Eros real no se contacta nunca.
2. **Push y despliegue solo con el OK de Mateo.** Nunca se hace push, se toca la base de producción, el VPS ni una URL en vivo por iniciativa propia. Producción se audita después del despliegue, no en lugar de la revisión local.
3. **Archivos de menos de 300 líneas.** Las páginas y los contenedores son orquestadores delgados.
4. **Cero contenido escrito a mano.** Todo sale de PostgreSQL vía la API; la interfaz va en `app/lib/dict/` (sitio) y en los diccionarios del admin (`ui/dict.ts`, `shell/dict.ts` y `features/<área>/dict.ts`).
5. **Sin emojis** en el sitio ni en el admin.

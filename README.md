# Mateo Sonzogni · Portafolio

Portafolio de proyectos, trayectoria y CV sobre PostgreSQL 17, Express 5 y Nuxt 4. La estructura es la de un portafolio convencional (inicio, obra, caso, sobre mí y artículos) y lo memorable es cómo se mueve: lo que tocás se transforma en la página. Todo el contenido, en castellano y en inglés, sale de la base.

En producción: [mateogs.tech](https://mateogs.tech).

## Qué tiene

- **Cinco páginas desde la base:** `/`, `/projects`, `/projects/:slug`, `/about` y `/articles`, en ES y EN (`?lang=en`). Ningún texto de contenido vive en los componentes; la interfaz usa un diccionario chico (`app/lib/dict/`).
- **Movimiento con criterio:** cargador de la primera visita, nombre por letras, filas con vista previa, galería horizontal con pin, captura que crece, líneas que se revelan, palabras que se encienden y view transitions con elementos compartidos (GSAP, Lenis y la API de View Transitions). Con `prefers-reduced-motion` nada anima.
- **Ver como registro (`R`):** cada página se transforma en el registro tipado de la base que la alimenta (`?vista=registro`, también sin JS).
- **Hiperfoco (`H`):** una columna de lectura en monocromo, sin ornamentos ni movimiento ambiental y con la navegación intacta. Se comparte con `?foco=1`.
- **CV Harvard ATS:** `/about?cv=ats`, imprimible en una sola página A4, con un PDF por idioma en `public/cv/`.
- **Teclado completo:** `1`–`5`, `j`/`k`, `Enter`, `Esc`, `Backspace`, `R`, `H`, `/` y `Ctrl/⌘K`, apagables desde la paleta.
- **Consola de administración (`/admin`):** CMS propio y centro de operaciones del agente de empleo Job Hunter, con el generador de CV Harvard ATS adaptado a cada vacante.
- **Respaldo generado:** si la base no responde, la API sirve la última respuesta buena o el snapshot versionado (`server/src/snapshot/content.json`).

El diseño completo (tokens, anclas del DOM, política de movimiento, teclas y rutas) está en [`docs/diseno.md`](docs/diseno.md).

## Stack

- **Frontend:** Nuxt 4, Vue 3, TypeScript, Tailwind CSS v4, GSAP 3 (ScrollTrigger, SplitText, Flip), Lenis y View Transitions. General Sans y Martian Mono servidas en local.
- **Backend:** Express 5, Prisma 7, PostgreSQL 17 y Multer.
- **Admin:** Vue 3 sin build y Tailwind CSS v4 (`@tailwindcss/cli`).
- **Infraestructura:** Hostinger VPS con Coolify, Dockerfiles multi-stage y Traefik. Ver [`DEPLOY.md`](DEPLOY.md).

## Puesta en marcha

Requisitos: Node 24, pnpm 10 y Docker (para PostgreSQL).

```bash
cp .env.example .env
pnpm install
pnpm db:up              # PostgreSQL 17 en Docker
pnpm prisma migrate deploy
pnpm db:seed            # contenido real: seis obras, experiencia, stack, documentos y artículos
pnpm dev:api            # API en :3001
pnpm dev                # sitio en :3000
```

## Comandos

```bash
pnpm typecheck          # Nuxt, server y la suite e2e
pnpm lint               # ESLint
pnpm build && pnpm start    # build de producción del sitio (pnpm start:api para la API)
pnpm build:admin-css    # Tailwind del admin
pnpm db:snapshot        # regenerar el respaldo versionado desde la base
pnpm db:snapshot:check  # comparar respaldo y base
pnpm cv:pdf             # regenerar los dos PDF ATS desde el sitio local
pnpm test:e2e           # Playwright contra el build: 375, 768 y 1440 px en los dos temas, reduced motion y sin JS
```

`pnpm test:e2e` compila una vez y corre cada spec de cada proyecto con una API nueva (el límite de la API pública es de 300 pedidos cada 15 minutos). Las capturas de referencia están en `tests/e2e/visual.spec.ts-snapshots/` y se regeneran a propósito con `pnpm test:e2e visual --update-snapshots`.

## Calidad

Cada cambio visual pasa el piso de calidad (`.claude/skills/piso-calidad/`): funciona sin JS, se navega entero con teclado, el lector de pantalla lo entiende, respeta reduced motion e Hiperfoco, CLS 0, responsive de 320 a 2560 px, degrada con la base caída y el CV entra en una página A4. La última auditoría y las cifras de Lighthouse están en [`docs/fases.md`](docs/fases.md).

## Documentación

- [`CLAUDE.md`](CLAUDE.md) y [`AGENTS.md`](AGENTS.md): invariantes, estructura y comandos.
- [`docs/diseno.md`](docs/diseno.md): fuente única del diseño del sitio público.
- [`docs/admin.md`](docs/admin.md): la consola de administración.
- [`docs/decisiones.md`](docs/decisiones.md) y [`docs/fases.md`](docs/fases.md): decisiones y estado del proyecto.

## Licencia

MIT © [Mateo Gabriel Sonzogni](https://github.com/MateoGs013)

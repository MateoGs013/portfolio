# Portafolio Mateo Sonzogni

Portafolio de proyectos, trayectoria y CV construido sobre PostgreSQL 17, Express 5 y Nuxt 4. Dirección «movimiento»: la estructura es la de un portafolio convencional y lo memorable es cómo se mueve; lo que tocás se transforma en la página. El diseño completo está en `docs/diseno.md`.

El portafolio se estructura en torno a:
- **Sitio público:** inicio (`/`), obra (`/projects`), caso (`/projects/:slug`), sobre mí (`/about`) y artículos (`/articles`), en ES y EN (`?lang=en`), con el contenido entero desde la base. Cada página se puede ver como registro tipado de la base con `R` (`?vista=registro`).
- **Modo Focus / Hiperfoco (`useHyperfocus.ts`):** una tecla (`H`) que deja una columna de lectura en monocromo, sin ornamentos ni movimiento ambiental y con la navegación intacta. El estado vive en una cookie que lee el SSR, así no parpadea.
- **CV Harvard ATS (`app/components/cv/`):** en `/about?cv=ats`, imprimible en una sola página A4. Un PDF ATS por idioma (`public/cv/CV-{ES,EN}-Mateo-Sonzogni-ATS.pdf`); las URL sin `-ATS` redirigen a ellos.
- **Consola de Administración (`/admin`):** CMS interno y centro de operaciones del agente autónomo de empleo (**Job Hunter** / Eros), con generación de propuestas y CV Harvard ATS adaptado a cada vacante.

---

## Invariantes del Proyecto

Si se violan, es otro proyecto. Si una tarea los contradice, parar y preguntar.

1. **Un solo modelo relacional de contenido.** Toda la información (proyectos, experiencia, tecnologías, empresas, multimedia) vive en PostgreSQL 17 modelada por Prisma. Cero duplicación.
2. **La ruta es el estado.** Las vistas y filtros se resuelven mediante rutas limpias y query parameters estándar, completamente indexables y compartibles.
3. **Modo Focus sin distracciones.** El modo Focus (`useHyperfocus`, tecla `H`) permite a reclutadores y clientes concentrarse en la lectura del contenido sin ruidos de interfaz, sin perder la navegación.
4. **Accesibilidad y rendimiento en primer orden.** Navegación completa por teclado (`1`–`5` inicio, obra, sobre mí, contacto y CV; `j`/`k`, `Enter`, `Esc`, `Backspace`, `R`, `H`, `/` y `Ctrl/⌘K`, todas apagables desde la paleta), contraste WCAG AA y respeto a `prefers-reduced-motion`. Todo se lee y se navega con JS apagado.
5. **Cero emojis en la consola administrativa.** El panel de administración (`/admin`) respeta un estándar 2026 riguroso: sin emojis, con micro-indicadores geométricos e iconografía exclusivamente utilitaria.
6. **Integridad del Generador de CV Harvard ATS.** El panel de Job Hunter debe preservar siempre la capacidad de analizar vacantes, adaptar el CV al estándar Harvard ATS, previsualizarlo, imprimirlo en A4 y copiarlo en texto plano.
7. **Estándar Tailwind CSS First.** Toda nueva interfaz (panel de administración y evoluciones visuales) se construye sobre clases utilitarias de **Tailwind CSS v4**, eliminando hojas de estilo monolíticas frágiles y sincronizando con los tokens sobrios del portafolio.

---

## Stack Tecnológico

- **Frontend:** Nuxt 4 · Vue 3 · TypeScript · Tailwind CSS v4 (`@tailwindcss/vite`) · CSS nativo con variables · GSAP 3 (ScrollTrigger, SplitText, Flip) · Lenis · View Transitions.
- **Admin CMS:** Vue 3 · Tailwind CSS v4 (`@tailwindcss/cli`) · Command Palette (`⌘K`) · Job Hunter con Gemini.
- **Backend:** Express 5 · TypeScript (`tsx`) · Prisma ORM · PostgreSQL 17 · Multer.
- **IA / Agente de Empleo:** Integración con modelos Gemini para evaluación de compatibilidad de empleo, redacción de cartas/pitch y generación adaptada de CV Harvard ATS.
- **Tipografía:** General Sans Variable (todo lo que se lee) y Martian Mono (identificadores) en el sitio, locales; Plus Jakarta Sans en el admin.
- **Infraestructura:** Hostinger VPS gestionado con Coolify (Dockerfiles multi-stage, Traefik reverse proxy con SSL Let's Encrypt).

---

## Comandos Habituales

```bash
cp .env.example .env       # Configuración de variables locales
pnpm db:up                 # Levantar PostgreSQL 17 en Docker (pnpm db:down para detenerlo)
pnpm db:seed               # Poblar la base de datos con contenido inicial real
pnpm db:snapshot           # Regenerar el respaldo versionado (server/src/snapshot/content.json) desde la base
pnpm db:snapshot:check     # Comparar el respaldo con la base (después de un seed solo difieren las fechas)
pnpm dev                   # Servidor de desarrollo Frontend (Nuxt) en :3000
pnpm dev:api               # Servidor de desarrollo Backend (Express) en :3001
pnpm build:admin-css       # Compilar el Tailwind del admin (solo lee server/admin: source(none))
pnpm typecheck             # Verificación estricta de tipos TypeScript (Nuxt + Express)
pnpm lint                  # Verificación de linter (ESLint)
pnpm build                 # Compilar frontend para producción
pnpm start                 # Servir el build (pnpm start:api para la API sin watch)
pnpm build:api             # Compilar admin CSS, generar Prisma y ejecutar migraciones
pnpm cv:pdf                # Regenerar los dos PDF ATS desde el sitio local (CV_BASE_URL), con la cota dual
pnpm test:e2e              # Playwright contra el build (tests/e2e/run.mjs): 3 anchos x 2 temas, reduced motion y sin JS
```

---

## Estructura del Repositorio

```
app/components/site/     Cabecera, pie de contacto, paleta «Ir a» y utilidades (idioma, tema, Hiperfoco)
app/components/home/     Inicio: nombre por letras, obra destacada con vista previa, frase
app/components/work/     Obra: galería horizontal, tarjetas y facetas
app/components/case/     Caso: cabecera, captura que crece, secciones, métricas, siguiente obra
app/components/about/    Sobre mí: filosofía, datos, trayectoria y acceso al CV
app/components/record/   Modo registro (R): RecordField, RecordValue, RecordTable
app/components/motion/   Primitivas de movimiento (RevealLines, ScrubWords, CursorBubble)
app/components/media/    MediaImage y MediaVideo (con pausa visible)
app/components/cv/       Visor del CV Harvard ATS (CvContainer, CvHarvardAts, CvSheet)
app/components/articles/ Blog con el estilo del sitio
app/components/ui/       Iconografía utilitaria lineal SVG (AppIcon)
app/pages/               Inicio, obra, caso, sobre mí (con ?cv=ats) y artículos
app/composables/         Datos (useApi, useSiteContent, useCv), idioma, tema, Hiperfoco, registro, movimiento, teclas, SEO
app/plugins/             Preferencias del SSR, movimiento (Lenis y GSAP), elementos compartidos, morph de R e imanes
app/middleware/          canonical.global.ts: rutas canónicas y 301 de las archivadas
app/lib/                 Tipos de la API, formato, markdown, registro (record.ts, morph/), metadatos de campos y diccionario (dict/)
app/assets/css/          Tokens (tokens.css), base, movimiento, impresión e Hiperfoco
app/nitro/routes/        sitemap.xml y robots.txt desde la API; el resto se proxía a Express
server/src/             Express 5: rutas públicas (routes/, queries/, content/), admin/, seed/, patches/ y snapshot/
server/admin/           Consola de administración propia (HTML/CSS/JS sin build) en /admin
prisma/                 Esquema de base de datos relacional y migraciones SQL
public/cv/              PDFs del CV: uno ATS de 1 página por idioma (pnpm cv:pdf)
public/media/projects/  Capturas y videos de cada obra, versionados en git
public/og/              Imagen OG por defecto de 1200x630 (scripts/og-default.mjs)
scripts/                cv-pdf.mjs, og-default.mjs y check-contrast.mjs (contraste de la cabecera con mezcla)
tests/e2e/              Suite Playwright (support.ts, run.mjs) y capturas de referencia (visual.spec.ts-snapshots/)
docs/diseno.md          Fuente única del diseño del sitio público
docs/rediseno/          Prototipos aprobados (movimiento.html, demo.html), plan y paquetes del rediseño
docs/archive/           Histórico: prototipos y conceptos descartados ("Dos Mundos", explorador, /lab y el visor IDE)
```

---

## Dónde está el resto

Este archivo resume las directrices transversales. La documentación detallada se encuentra en:

- `docs/diseno.md` — **Fuente única del diseño del sitio público:** vocabulario de movimiento, tokens, anclas del DOM, Hiperfoco, política de movimiento, teclas y rutas
- `.claude/rules/explorer.md` — Reglas estructurales al tocar `app/components/**`, `app/pages/**` o `app/lib/**` (DOM accesible, una cosa por pantalla, cota dual del CV)
- `.claude/rules/backend.md` — Reglas al tocar `server/**` o `prisma/**`
- `.claude/rules/admin.md` — Reglas de interfaz y UX al tocar `server/admin/**`
- `DEPLOY.md` — Guía completa de despliegue en Hostinger VPS con Coolify
- `docs/admin.md` — Arquitectura y especificaciones de la consola de administración 2026
- `docs/decisiones.md` — Registro de decisiones arquitectónicas y motivos de descarte
- `docs/fases.md` — Estado de las fases de desarrollo del proyecto
- `AGENTS.md` — Puerta de entrada para otros agentes (Gemini): apunta a estas mismas fuentes
- `docs/archive/` — Carpeta de archivo para documentación histórica conservada

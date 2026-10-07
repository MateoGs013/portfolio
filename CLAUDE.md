# Portafolio Mateo Sonzogni

Portafolio técnico y explorador relacional de proyectos, trayectoria y habilidades construido sobre PostgreSQL 17, Express 5 y Nuxt 4.

El portafolio se estructura en torno a:
- **Explorador Técnico:** Presenta los proyectos y el stack con metadatos, métricas cuantificables de rendimiento y relaciones directas en la base de datos.
- **Modo Focus / Hiperfoco (`useHyperfocus.ts`):** Oculta elementos secundarios y decorativos para brindar una lectura clara, rápida y sin fricciones.
- **CV Harvard ATS y Visualizador IDE (`CvContainer.vue`):** Visualización en `/about` y exportación lista para imprimir en una sola página A4 (`CV-{ES,EN}-Mateo-Sonzogni-ATS.pdf` y `CV-{ES,EN}-Mateo-Sonzogni.pdf`).
- **Consola de Administración (`/admin`):** CMS interno y centro de operaciones del agente autónomo de empleo (**Job Hunter** / Eros), con generación de propuestas y CV Harvard ATS adaptado a cada vacante.

---

## Invariantes del Proyecto

Si se violan, es otro proyecto. Si una tarea los contradice, parar y preguntar.

1. **Un solo modelo relacional de contenido.** Toda la información (proyectos, experiencia, tecnologías, empresas, multimedia) vive en PostgreSQL 17 modelada por Prisma. Cero duplicación.
2. **La ruta es el estado.** Las vistas y filtros se resuelven mediante rutas limpias y query parameters estándar, completamente indexables y compartibles.
3. **Modo Focus sin distracciones.** El modo Focus (`useHyperfocus`) permite a reclutadores y clientes concentrarse en la lectura del contenido técnico sin ruidos de interfaz.
4. **Accesibilidad y rendimiento en primer orden.** Navegación accesible por teclado (`1-5`, `Esc`, `j/k`, `Enter`), contraste WCAG AA y respeto a `prefers-reduced-motion`.
5. **Cero emojis en la consola administrativa.** El panel de administración (`/admin`) respeta un estándar 2026 riguroso: sin emojis, con micro-indicadores geométricos e iconografía exclusivamente utilitaria.
6. **Integridad del Generador de CV Harvard ATS.** El panel de Job Hunter debe preservar siempre la capacidad de analizar vacantes, adaptar el CV al estándar Harvard ATS, previsualizarlo, imprimirlo en A4 y copiarlo en texto plano.

---

## Stack Tecnológico

- **Frontend:** Nuxt 4 · Vue 3 · TypeScript · CSS nativo con variables · GSAP 3.
- **Backend:** Express 5 · TypeScript (`tsx`) · Prisma ORM · PostgreSQL 17 · Multer.
- **IA / Agente de Empleo:** Integración con modelos Gemini para evaluación de compatibilidad de empleo, redacción de cartas/pitch y generación adaptada de CV Harvard ATS.
- **Tipografía:** Martian Mono Variable, Plus Jakarta Sans, JetBrains Mono.
- **Infraestructura:** Hostinger VPS gestionado con Coolify (Dockerfiles multi-stage, Traefik reverse proxy con SSL Let's Encrypt).

---

## Comandos Habituales

```bash
cp .env.example .env    # Configuración de variables locales
pnpm db:up              # Levantar PostgreSQL 17 en Docker (pnpm db:down para detenerlo)
pnpm db:seed            # Poblar la base de datos con contenido inicial real
pnpm dev                # Servidor de desarrollo Frontend (Nuxt) en :3000
pnpm dev:api            # Servidor de desarrollo Backend (Express) en :3001
pnpm typecheck          # Verificación estricta de tipos TypeScript (Nuxt + Express)
pnpm lint               # Verificación de linter (ESLint)
pnpm build              # Compilar frontend para producción
pnpm build:api          # Generar Prisma y ejecutar migraciones
```

---

## Estructura del Repositorio

```
app/components/explorer/ Componentes del explorador técnico (ExplorerView, Folder, Detail, Header, etc.)
app/components/cv/       Visor de CV Dual modular (CvContainer, CvHarvardAts, CvModernIde)
app/components/ui/       Iconografía utilitaria lineal SVG (AppIcon)
app/lib/                 Lógica del explorador y resolución de datos (explorer.ts)
app/assets/css/          Tokens de diseño (tokens.css), tipografía y estilos base
app/nitro/              Reservado; Nitro no sirve rutas propias (proxiadas a Express)
server/src/             Backend Express 5 (rutas REST, admin, multer, cliente Prisma)
server/admin/           Consola de administración propia (HTML/CSS/JS sin build) en /admin
prisma/                 Esquema de base de datos relacional y migraciones SQL
public/cv/              PDFs de CV oficiales (ES/EN estándar y ATS de 1 página)
docs/                   Documentación de arquitectura, decisiones y despliegue
docs/archive/           Histórico de prototipos, conceptos descartados ("Dos Mundos") y configs previas
```

---

## Dónde está el resto

Este archivo resume las directrices transversales. La documentación detallada se encuentra en:

- `.claude/rules/explorer.md` — Reglas al tocar `app/components/**` o `app/lib/explorer.ts`
- `.claude/rules/backend.md` — Reglas al tocar `server/**` o `prisma/**`
- `.claude/rules/admin.md` — Reglas de interfaz y UX al tocar `server/admin/**`
- `DEPLOY.md` — Guía completa de despliegue en Hostinger VPS con Coolify
- `docs/admin.md` — Arquitectura y especificaciones de la consola de administración 2026
- `docs/decisiones.md` — Registro de decisiones arquitectónicas y motivos de descarte
- `docs/fases.md` — Estado de las fases de desarrollo del proyecto
- `docs/archive/` — Carpeta de archivo para documentación histórica conservada

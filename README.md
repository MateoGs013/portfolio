# Mateo Sonzogni — Technical Portfolio & Relational Explorer

> Explorador relacional de base de datos técnica, CV dual interactivo (**Harvard ATS** / **Modern IDE**) y sistema de micro-interacciones espaciales de 60 FPS.

[![Production](https://img.shields.io/badge/Status-Live_Production-10b981?style=flat-square)](https://mateogs.tech)
[![Nuxt 4](https://img.shields.io/badge/Nuxt-4.x-00DC82?style=flat-square&logo=nuxtdotjs&logoColor=white)](https://nuxt.com)
[![Vue 3](https://img.shields.io/badge/Vue-3.x-42b883?style=flat-square&logo=vuedotjs&logoColor=white)](https://vuejs.org)
[![Express 5](https://img.shields.io/badge/Express-5.x-000000?style=flat-square&logo=express&logoColor=white)](https://expressjs.com)
[![Prisma 7](https://img.shields.io/badge/Prisma-7.x-2D3748?style=flat-square&logo=prisma&logoColor=white)](https://www.prisma.io)
[![PostgreSQL 17](https://img.shields.io/badge/PostgreSQL-17-4169E1?style=flat-square&logo=postgresql&logoColor=white)](https://www.postgresql.org)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.x-3178C6?style=flat-square&logo=typescript&logoColor=white)](https://www.typescriptlang.org)
[![Tailwind CSS v4](https://img.shields.io/badge/Tailwind-v4-06B6D4?style=flat-square&logo=tailwindcss&logoColor=white)](https://tailwindcss.com)

---

## 🏛️ Concepto y Filosofía de Diseño

Este portafolio reemplaza la clásica plantilla estática de tarjetas por un **explorador técnico relacional** inspirado en Linear, Raycast y hojas de especificaciones de ingeniería:

* **La base de datos completa es navegable:** Colecciones como carpetas (`/projects`, `/stack`, `/experience`, `/orgs`, `/docs`) y registros como hojas de especificaciones técnicas con relaciones bidireccionales automáticas.
* **Facetar es tocar un valor:** Hacer clic en cualquier tecnología, año, organización o estado agrega el filtro correspondiente a la URL de forma instantánea.
* **Navegación Continua por Teclado:** Soporte nativo para `Cmd+K` (Go To dialog), flechas de navegación, `Enter`, `Esc` y `/` para búsqueda global.
* **CV Dual Reactivo (`/docs/about`):**
  * **Modo Harvard ATS:** Diseño editorial académico de alta legibilidad, preparado para escaneo algorítmico y exportación perfecta a PDF / impresión A4.
  * **Modo Modern IDE:** Editor de código interactivo con inspectores de datos, pestañas y telemetría de ingeniería en tiempo real.
* **Modo Hiperfoco (`useHyperfocus.ts`):** Modo de lectura concentrada en alto contraste monocromático que despoja la interfaz de adornos visuales.
* **Micro-interacciones Bencho UI:** Dynamic Island, tarjetas holográficas de refracción (`UiHoloCard`), botones con barrido de luz (`UiBorderBeam`), efectos de desencriptado (`UiDecryptedText`) y trazas de pensamiento de agentes de IA (`UiThinkingTrace`).
* **Resiliencia & Fallback Offline:** Si la base de datos externa entra en reposo, el servidor activa un fallback estático en memoria (`server/src/fallbackData.ts`) sin degradación de la experiencia ni interrupciones HTTP 500.

---

## 🛠️ Stack Arquitectónico

### Frontend
- **Framework:** Nuxt 4 + Vue 3 (Composition API estricta, SSR y pre-render selectivo).
- **Estilos:** Tailwind CSS v4 + Design Tokens con soporte para temas *Obsidian Dark*, *Technical Paper* e *Hyperfocus*.
- **Tipografía:** *General Sans Variable* (editorial / UI) + *Martian Mono* (identificadores y tipos relacionales).
- **Accesibilidad:** 100/100 Lighthouse, semántica ARIA completa y lectores de pantalla.

### Backend & API
- **Core Server:** Express 5 montado en Node.js y compatible con Nitro.
- **ORM & DB:** Prisma 7 conectando a PostgreSQL 17.
- **Admin Console (`/admin`):** Consola interna inspirada en Linear 2026 con métricas operativas, editor de contenido y monitoreo del agente de empleo Eros.

---

## 🚀 Puesta en Marcha Local

### Requisitos previos
- Node.js `>= 20.x`
- npm `>= 10.x`
- PostgreSQL 17 (opcional en desarrollo; el sistema cuenta con fallback en memoria automático)

### Instalación

```bash
# 1. Clonar el repositorio
git clone https://github.com/MateoGs013/portfolio.git
cd portfolio

# 2. Instalar dependencias
npm install

# 3. Generar el cliente de Prisma
npx prisma generate --schema=./prisma/schema.prisma

# 4. Iniciar el entorno de desarrollo
npm run dev
```

La aplicación quedará disponible en `http://localhost:3000`.

---

## 🧪 Calidad y Auditoría

```bash
# Ejecutar verificación de tipos
npm run typecheck

# Ejecutar tests end-to-end con Playwright (compila una vez y corre cada spec de cada proyecto
# —1440/768/375 en dark y light, reduced-motion y no-js— con una API nueva; ver tests/e2e/run.mjs)
pnpm test:e2e
```

### Métricas de Rendimiento (Lighthouse)
- **Performance:** 99+
- **Accessibility:** 100
- **Best Practices:** 100
- **SEO:** 100

---

## 📄 Licencia

MIT © [Mateo Gabriel Sonzogni](https://github.com/MateoGs013)

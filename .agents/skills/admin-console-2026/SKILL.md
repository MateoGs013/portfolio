---
name: admin-console-2026
description: Reglas de arquitectura, estética Linear 2026 sin emojis, trazas de IA (Eros) e impresión Harvard ATS para la consola de administración (/admin). Úsalo siempre que edites archivos en server/admin/ o endpoints en server/src/admin/.
---

# Admin Console 2026 & Eros AI Suite

La consola de administración (`server/admin/`) es una SPA servida en `/admin` construida con **Vue 3 Global Build (ESM nativo sin bundler) + Tailwind CSS v4 CLI**. Esta skill define las reglas técnicas y de diseño para mantenerla rápida, libre de errores en runtime y alineada con la estética de ingeniería 2026.

## 1. Reglas Técnicas de Vue 3 Global Build (`window.Vue`)

Dado que `/admin` no pasa por Vite ni TypeScript en build-time, los errores de importación solo se descubren en el navegador si no se siguen estas reglas:

1. **Desestructuración Explícita de `window.Vue`**:
   - Antes de usar cualquier API reactiva (`ref`, `reactive`, `computed`, `watch`, `onMounted`, `onUnmounted`, `nextTick`), verifica la primera línea del archivo:
   - `const { ref, computed, watch, onMounted } = window.Vue;`
   - **Prohibido** invocar `ref()` o `watch()` sin haberlo desestructurado en el módulo actual.
2. **Estilos con Tailwind CSS v4 CLI**:
   - Si agregas clases utilitarias nuevas en `server/admin/js/**/*.js` o `server/admin/index.html`, recuerda regenerar el bundle CSS ejecutando `pnpm build:admin-css` (`tailwindcss -i server/admin/admin.src.css -o server/admin/admin.css --minify`).

## 2. Invariante Estético: Cero Emojis & Precisión Linear 2026

1. **Cero Emojis (Invariante #5)**:
   - Está estrictamente prohibido usar emojis Unicode en labels, botones, toasts, estados vacíos o prompts visibles de `/admin`.
   - Usa indicadores geométricos CSS (`w-1.5 h-1.5 rounded-full`), glifos tipográficos técnicos (`+`, `×`, `->`, `//`, `[01]`) o iconos SVG monocromáticos de trazo `1.5px`.
2. **Trazas de Razonamiento IA (`Bencho UI Thinking Steps`)**:
   - En las herramientas de **Eros AI** (`JobHunterView.js`, `OmnichannelModal.js`, `RadarView.js`), nunca muestres un simple texto estático de "Cargando...".
   - Muestra una lista secuencial de pasos técnicos con indicadores de estado (`pending`, `active` con pulso sutil, `done` con tiempo en `ms`) que refleje qué está haciendo el backend (ej. consultando contexto PostgreSQL, llamando a Gemini, validando estructura JSON).

## 3. Telemetría y Rendimiento en Admin

1. **Endpoint Agregado de Conteos (`/api/admin/meta`)**:
   - Nunca dispares 9 `GET` paralelos a colecciones completas solo para contar `.length` en el sidebar. Usa un endpoint ligero de conteos (`prisma.$transaction` con `.count()`) para mantener el arranque de `/admin` por debajo de `50ms`.

## 4. Invariante Harvard ATS (Impresión A4 en 1 Página)

En `JobHunterView.js` (y su contraparte pública en `/about`):
- El contenedor `#cv-print-area` debe producir un PDF de **exactamente 1 página A4** (`210mm × 297mm`) al invocar `window.print()`.
- Tipografía serif clásica (`EB Garamond` / `Times New Roman`), negro puro `#000` sobre blanco `#fff`, sin columnas laterales complejas ni gráficos que confundan parsers ATS (Workday, Greenhouse, Lever).

## 5. Arquitectura de Despacho de Postulaciones y CVs (Anti-SMTP VPS)

Está estrictamente prohibido utilizar sockets directos `smtplib` con contraseñas de aplicación de Gmail desde contenedores VPS (Hostinger / Coolify) debido a bloqueos de rDNS IPv6 de Google (`550-5.7.1`), ausencia de sincronización en la carpeta "Enviados" y penalización en filtros ATS corporativos.

Todo flujo de despacho de postulaciones debe seguir uno de los dos canales autorizados:

1. **Canal Primario: 1-Click Direct Compose (Human-in-the-Loop)**:
   - Al pulsar "Postular en Gmail", el modal descarga en paralelo el PDF nativo Harvard ATS (`api.downloadHunterCVPdf(id)`) y abre la ventana nativa de redacción de Gmail:
     `https://mail.google.com/mail/?view=cm&fs=1&to=${to}&su=${encodeURIComponent(subject)}&body=${encodeURIComponent(body)}`
   - Garantiza entrega 100% legítima desde la sesión personal autenticada del usuario en su navegador, registro instantáneo en "Enviados" y cero caídas de servidor.

2. **Canal Secundario: Automatización vía n8n OAuth2 (`flow.mateogs.tech`)**:
   - Cuando se requiere despacho en segundo plano o programado, la API satélite envía el payload vía HTTPS (puerto 443) al webhook de aplicaciones de n8n (`N8N_APPLICATION_WEBHOOK_URL`).
   - n8n ejecuta el despacho mediante el nodo oficial **Gmail OAuth2** de Google Cloud (`users.messages.send`), logueando el estado en PostgreSQL y notificando al bot de Telegram.

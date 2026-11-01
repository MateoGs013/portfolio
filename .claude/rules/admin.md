---
paths:
  - "server/admin/**"
  - "server/src/admin/**"
---

# Admin (`/admin`)

La mesa de trabajo interna del portafolio: con ella Mateo, o un asistente que no programa, carga y cuida el contenido que publica el sitio y opera la búsqueda laboral con Eros. No es una pieza de exhibición ni un cosplay de terminal. El documento completo (rutas, dirección visual con valores, matriz de datos, contrato con Eros e inventario de endpoints) es `docs/admin.md`; la dirección aprobada es la capa «Dirección 2» de `docs/rediseno-admin/demo.html`, y lo descartado con su motivo está en `docs/decisiones.md` → «Rediseño del admin (nov-2026)».

---

## Invariantes

Si se violan, la herramienta pierde su propósito. Los que tienen guardarraíl fallan en `pnpm lint`.

1. **Vite, componentes `.vue` y TypeScript estricto.** La UI vive en `server/admin/src/`, la compila Vite (`server/admin/vite.config.ts`, con `@vitejs/plugin-vue` y `@tailwindcss/vite`) a `server/admin/dist/` y la sirve la API en `/admin/` (`server/src/admin/ui.ts`). La base es absoluta (`/admin/`): con una relativa, `/admin` sin barra final pediría los assets al sitio. `ADMIN_BASE` existe solo para desarrollo y pruebas. `pnpm typecheck` corre `vue-tsc` sobre el admin.
2. **Tailwind v4 first, con los tokens del sitio.** Una sola hoja, `styles/admin.css` (`@import 'tailwindcss' source(none)` más `@source` del propio admin), y los tokens en `styles/tokens.css` mapeados por `@theme`. La paleta de Tailwind por defecto está apagada: solo existen `bg`, `panel`, `surface`, `ink`, `dim`, `faint`, `sig`, `ok`, `wip`, `danger` y sus hermanos. Cero hex fuera de `tokens.css`, cero `text-[Npx]`, cero `!important`, cero `transition-all` (`check-admin-style`). Los pares de texto pasan AA (`check-admin-contrast`).
3. **Una cosa por pantalla.** Rejilla `220px 1fr` (navegación y pantalla) desde 768 px. Cada colección es su propia pantalla de filas grandes; el editor ocupa la pantalla solo, en una columna, con el título en display que viaja desde la fila. Sin columna de lista fija al lado del editor, sin tarjetas dentro de tarjetas, sin rejillas ni puntos de fondo.
4. **Sin colores por módulo.** Todas las áreas usan los mismos tokens. El acento (`sig`) ocupa menos del 5 % de la pantalla: el primario, lo activo y el foco. `ok` y `wip` son solo el punto de estado, siempre con una palabra al lado.
5. **Cero emojis e iconos solo utilitarios.** Los trazos permitidos están en `ui/icons.ts` (buscar, cerrar, agregar, eliminar, abrir afuera, flechas, desplegar, listo, arrastrar, mostrar u ocultar la clave, subir y copiar) y un `IconButton` siempre lleva nombre accesible. Si el texto alcanza, va texto.
6. **Un asistente sin saber SQL ni JSON carga una obra completa en menos de cinco minutos.** Cada campo dice para qué sirve y dónde aparece (sale de `adminSchema`), la dirección se deriva sola, las métricas se cargan por tipo, las empresas y tecnologías se crean sin salir del formulario. `tests/e2e/admin-flujo-obra.spec.ts` lo mide con las constantes de la auditoría.
7. **Ningún valor de enum en pantalla.** Los rótulos salen de `server/src/shared/labels.ts` y llegan por `/meta` (Publicada, En desarrollo, Portada…); los veredictos de vacantes del puntaje. Nunca LIVE, WIP, COVER ni nombres de veredicto en mayúsculas.
8. **Un solo modelo de guardado.** Toda colección pasa por el marco de `features/collections/` y `useEditor`: el formulario tiene la misma forma que el payload (así un error del servidor, `?campo=` y las marcas de cambios caen en el campo justo), cada campo lleva `data-field="<ruta del payload>"`, `Ctrl/⌘S` guarda, el borrador queda en `sessionStorage` y la guarda de salida avisa antes de perder algo. Nada guarda por su cuenta fuera de ese camino sin una razón escrita (la media va pieza por pieza dentro del mismo Guardar).
9. **Paleta `Ctrl/⌘K` con registros.** Un combobox ARIA, abierto desde cualquier pantalla, que indexa secciones, acciones y registros (obras, trayectoria, artículos, catálogos y vacantes) sin acentos. Cada área suma sus fuentes con `registerPaletteSource` (`composables/usePalette.ts`).
10. **La ruta es el estado.** Router por hash; `?filtro=`, `?seccion=`/`:seccion` y `?campo=` viven en la URL. La bandeja de Inicio y las checklists enlazan al campo exacto.
11. **Sin `style` estático.** La CSP de `/admin` no admite estilos en línea: nada de `style="…"` en las plantillas. Los `:style` dinámicos van por CSSOM y están permitidos.
12. **Métricas tipadas, sin JSON a mano.** Cada métrica es una fila `Metric`: clave del catálogo (`server/src/shared/metricKeys.ts`, con rótulo y descripción en los dos idiomas) o una propia con su rótulo, valor con unidad (`metricUnits.ts`) o lista, fuente y fecha de medición.
13. **Invariante 6 del proyecto.** Vacantes analiza, adapta el CV Harvard ATS, lo muestra, lo imprime en A4 dentro de la cota dual (248–265 mm) y lo copia en texto plano, con Eros arriba o caído. El CV se arma siempre desde la base; de Eros entran solo pistas.
14. **Español claro.** Mensajes completos por modelo («Experiencia guardada»), errores que dicen qué pasó y qué hacer, confirmaciones que nombran lo que se pierde. Ningún tecnicismo de base de datos en pantalla.

---

## Anatomía

```
server/admin/src/
  main.ts · App.vue · router.ts   arranque, hosts (Announcer, Toaster, ConfirmHost) y rutas por hash
  api/                            client.ts (Bearer, tiempos, reintento, reingreso ante 401) y errors.ts
  stores/                         session, status (sondeo de /status), meta (/meta), toasts y dialogs
  composables/                    useEditor, useCollection, useDraft, useLeaveGuards, useShortcuts, usePalette…
  ui/                             componentes base accesibles y el diccionario ui/dict.ts; Muestrario solo en dev
  shell/                          AppShell, navegación (nav.ts), cabecera, menú del celular, paleta, ingreso
  features/collections/           el marco común: Explorer, EditorFrame, SectionTabs, SchemaField, BilingualField,
                                  SlugField y SlugDialog, PublishState, Checklist, InlineCreate, DeleteDialog
  features/<área>/                Index.vue (la única entrada), model.ts, dict.ts y sus piezas
  models/                         el tipo Model, rótulos y validación compartida
  styles/                         admin.css, tokens.css y fonts.css
  assets/fonts/                   General Sans y Martian Mono, copiadas del sitio
```

- **Marco (`shell/AppShell.vue`).** «Saltar al editor» como primer Tab, navegación de 220 px (sin iconos ni numeración; contador solo si hay pendientes; Catálogos plegado), la paleta, el aviso de estado de la base y de Eros, y el menú del celular por debajo de 768 px.
- **Listas.** `Explorer`: título de pantalla en `heading`, filtros y búsqueda en la URL, filas en `list` que entran escalonadas y se atenúan al apuntar, `j`/`k` y `Enter`, `N` para crear.
- **Editor.** `EditorFrame`: «← Obras» para volver, título en `display` que viaja desde la fila, publicación y checklist, secciones como pestañas, campos sin caja sobre una línea y la barra de acciones anclada abajo con el estado de guardado, Descartar y Guardar.
- **Áreas.** `home` (Inicio), `projects` (Obras: esencial, relato, imágenes y datos), `experience` (Trayectoria y Vista CV), `articles`, `profile` (Sobre mí y Contacto), `stack` y `orgs` (Catálogos), `hunter` (Vacantes, en cuatro etapas), `content` (Publicaciones) y `radar` (Tendencias).
- **Textos.** Cada capa tiene su diccionario (`ui/dict.ts`, `shell/dict.ts`, `features/<área>/dict.ts`); ningún texto de interfaz se escribe en una plantilla.

---

## Defaults a evitar

Los tics que se borraron del panel anterior. Volver a cualquiera es retroceder:

- Numeración decorativa (00–09) y rótulos «NN // …» o «EROS // …».
- Mono en mayúsculas espaciadas para rótulos; `uppercase` y `tracking-wide*` en cualquier lado.
- Rótulos de infraestructura escritos a mano (ACID, ONLINE, SYS, «CMS 2026», versiones, «VPS · Conectado»): el estado sale de `/status`.
- Corchetes de estado ([BLOQUEADO], [MANUAL]) y valores de enum crudos (EXCELENTE_MATCH, LIVE, COVER).
- Colores por módulo, botón azul, glow, degradados, bento con blur, ping y pulse.
- Rejillas y puntos de fondo, «mood» sin contenido, cosplay de terminal (semáforos, verde flúor, prompts falsos).
- Familias tipográficas ajenas al sitio y fuentes desde un CDN.
- `user-select: none`, `transition-all`, hex sueltos y `!important`.
- `window.confirm`, `alert` y `prompt` (eslint los prohíbe): las confirmaciones van por `requestConfirm`.
- `Ctrl+N` y `Ctrl+D`, que pisan al navegador.
- La Guía de Asistencia en un modal, la traza de IA y la telemetría de «Infraestructura»: si un campo necesita explicación, va en su ayuda.

---

## Módulos del API del admin

`server/src/admin/router.ts` solo monta; cada módulo vive en su archivo:

- **Contenido** (detrás de `forgetsLastGood`, que olvida los respaldos de la API pública después de cada escritura buena): `meta.ts`, `projects.ts` (con `metrics.ts` y `translations.ts`), `media.ts` (con `mediaFiles.ts`, `image.ts` y `video.ts`), `experience.ts`, `techs.ts`, `orgs.ts`, `articles.ts` y `docs.ts` (con `docInput.ts`). Un router nuevo que escriba en Prisma va detrás de `forgetsLastGood`.
- **Lectura:** `status.ts` (base y Eros) y `pending.ts` (la bandeja de Inicio, con `pendingText.ts`, `issues.ts` y `cvStamp.ts`).
- **Eros:** `hunter.ts` (cola, escaneo, evaluación, mensaje, afinidad), `hunterApply.ts` (postular), `hunterCvRoutes.ts` y `hunterCvBase.ts` (las hojas del CV), con `hunterCv.ts`, `erosHints.ts`, `hunterCvCache.ts`, `hunterCvHtml.ts`, `hunterCvText.ts`, `cvProposal.ts`, `hunterHeuristics.ts` y `hunterMatch.ts` (el respaldo local sin Eros); `content.ts` y `contentCarousel.ts` (Publicaciones) y `radar.ts` (Tendencias). Todos hablan con Eros por `proxy.ts` y validan lo que vuelve en `erosContract.ts` y `erosContentContract.ts`. `fallbackHunterData.ts` y `fallbackContentData.ts` son la muestra de `EROS_DEMO=1`, armada desde la base; `profile.ts` arma el candidato de los respaldos desde la base.
- **Transversales:** `auth.ts` (Bearer y tickets HMAC), `input.ts` (validación, `guardSlugChange`), `errors.ts` (el formato de error) y `common.ts`. `ui.ts` sirve la UI compilada con su CSP.

El servidor nunca importa valores de `app/` (Dockerfile.api no lo copia): lo compartido vive en `server/src/shared/` (`adminSchema`, `adminContracts`, `hunterContracts`, `contentContracts`, `labels`, `docSchema`, `metricKeys`, `markdown`, `slug`) y la UI lo importa por el alias `@shared`. Cada endpoint montado figura en el inventario de `docs/admin.md` §9; `scripts/check-admin-endpoints.mjs` falla si la tabla, lo montado y lo que llama la UI no coinciden.

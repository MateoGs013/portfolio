# Rediseño del panel de administración (/admin), plan corregido

Trabajo sobre la rama `rediseno/admin`. Este plan junta seis auditorías: datos, flujos, lenguaje visual, código, Eros y accesibilidad. También se apoya en la lectura de `.claude/rules/admin.md`, `.claude/rules/backend.md`, `docs/admin.md`, `docs/diseno.md`, `prisma/schema.prisma`, `app/lib/fieldMeta.ts`, `server/src/admin/*`, `Dockerfile.api`, `server/src/app.ts`, `nuxt.config.ts`, `playwright.config.ts`, `tests/e2e/run.mjs` y `DEPLOY.md`. La sección 11 detalla cómo se aplicó cada punto de la crítica.

## 1. Diagnóstico

El admin funciona en la superficie, pero tiene tres problemas de fondo que se refuerzan entre sí.

**Integridad de datos.** Esto se arregla antes que cualquier rediseño.
- Si falla la carga de una sección, el store cambia de sección pero se queda con el formulario anterior. Ctrl+S termina mandando `PUT /projects/117` con el payload de una experiencia.
- Editar el título de una obra que ya existe reescribe su slug y cambia la URL pública: `la-rucula` pasa a `la-rucula-gastrobar-bar`. Con las experiencias pasa lo mismo, y su slug es público en `/api/experience/:slug`.
- En los Doc, `en` guarda copias del email, de las URL y del retrato. El sitio, el CV inglés y el CV del Job Hunter las sirven aunque estén viejas, y eso rompe el invariante 6. `contact.cv` es la excepción: su `en` es distinto a propósito (`/cv/CV-EN-…`).
- Se pueden renombrar o borrar los bloques de about y contact que el código consume por nombre, y también el documento entero.
- Ctrl+N, un 401 o un guardado lento pierden ediciones sin avisar.
- Sin Eros, la muestra de vacantes pisa la caché real. Analizar, adaptar o generar el pitch de una vacante real da 404, y la hoja impresa se arma con una vacante vacía.

**Datos que no llegan al editor o llegan mal.**
- ArticleTranslation no se puede editar.
- Las opciones relacionales se cargan una sola vez por sesión.
- Las métricas cambian de id cada vez que se guarda.
- La media no se puede reemplazar.
- Las viñetas EN se corren de posición.
- Los rótulos de los enums están duplicados en el cliente y se muestran valores crudos (LIVE, WIP, COVER).
- Los errores salen en jerga inglesa, de a uno y sin ubicar el campo.
- Los conteos son falsos: dice 8 «en vivo» cuando el sitio publica 6, y «PG-17 ACID · ONLINE» está escrito a mano.
- Los PDF del CV en `public/cv/` no se actualizan cuando se edita el perfil o la trayectoria.

**Un lenguaje visual ajeno al sitio.**
- Hay 413 `font-mono`, 325 tamaños sueltos de 8,5 a 11,5 px y 269 hex arbitrarios. Los tokens de `@theme` no se usan ni una vez.
- Cada módulo tiene su propio color y hay una retícula de puntos. Aparecen todos los tics que Mateo rechaza: «00 // SISTEMA», «01 // COLECCIONES ACID», la numeración 00–09, «[BLOQUEADO]», «EXCELENTE_MATCH» y «EROS // …».
- Accesibilidad:
  - el contraste falla AA en 19 a 39 nodos por vista;
  - ningún diálogo atrapa el foco;
  - las filas del explorador no se alcanzan con teclado;
  - las pestañas no tienen roles;
  - prefers-reduced-motion solo se respeta en el switch.

**Código.**
- Son 11.317 líneas en 50 archivos, y ocho de esos archivos pasan de 300 líneas. AdmJobHunter tiene 2087.
- Hay 712 líneas muertas.
- Las plantillas son strings que se compilan en el navegador, así que la CSP necesita `unsafe-eval`.
- Ningún estado vive en la URL.
- Hay tres renderizadores del CV y no coinciden entre sí.

**Se conserva** (todas las auditorías coinciden):
- las métricas tipadas como filas Metric;
- los pasos y enlaces sincronizados por id;
- `translations.en` por upsert;
- `forgetLastGood`;
- los tickets HMAC del CV con su CSP sandbox;
- el CV de respaldo compuesto desde `cvDocument`;
- `hunterCvHtml.ts` (1 página, 253,7 mm);
- `requestConfirm` y la guarda de cambios sin guardar;
- el acento #ff3e00;
- las tres columnas con la barra de acciones anclada;
- el switch `role=switch`;
- Martian Mono solo para identificadores;
- `tests/e2e/admin-audit.spec.ts` como guarda del invariante 6.

## 2. Dirección visual: la mesa de trabajo del sitio

El admin toma el mismo frío, las mismas familias y el mismo acento que mateogs.tech, pero con densidad de herramienta. Fondo liso, listas sobre líneas de 1 px y ninguna tarjeta dentro de otra tarjeta. El acento ocupa menos del 5 % de la pantalla. Del sitio se trae una sola firma de movimiento: lo que tocás viaja hasta el lugar donde se edita.

**Color.** Tema oscuro, con los tokens en `:root[data-theme=dark]` mapeados en `@theme`:

| Token | Valor | Uso |
|---|---|---|
| `--bg` | #0b0b0c | lienzo del editor (igual que el sitio) |
| `--panel` | #111113 | navegación y explorador |
| `--surface` | #161618 | inputs y fila en hover |
| `--surface-2` | #1c1c1f | fila seleccionada, popovers y paleta |
| `--rule` / `--rule-strong` | rgba(255,255,255,.08) / .14 | divisores / bordes de control |
| `--ink` | #ededee | texto principal |
| `--dim` | #a1a1a9 (7,6:1) | rótulos y texto secundario |
| `--faint` | #83838c (4,52:1 sobre #1c1c1f) | ayudas y metadatos |
| `--sig` | #ff3e00 | relleno del primario (texto #0b0b0c a 5,6:1), indicador activo, subrayado de pestaña |
| `--sig-text` | #ff3e00 | anillo de foco y único texto en acento |
| `--ok` · `--wip` | #3ecf6e · #e5a00d | solo el punto de estado, siempre acompañado de una palabra |
| `--danger` | #f0524f (≈5,6:1) | acciones destructivas y errores |

Quedan prohibidos los colores por módulo, el azul, el violeta, el cian, el glow y los degradados. El tema claro queda preparado con los valores del sitio, pero no se activa. Un script compara los valores compartidos con `app/assets/css/tokens.css`.

**Tipografía.**
- General Sans Variable y Martian Mono, servidas desde el propio admin. Sin CDN, sin Plus Jakarta Sans y sin JetBrains Mono.
- Seis tamaños, definidos como tokens y nunca como `text-[Npx]`:

  | Token | Tamaño | Uso |
  |---|---|---|
  | `meta` | 12 | kbd y metadatos |
  | `label` | 13 | rótulos en `--dim`, en minúscula de oración |
  | `body` | 14/1.45, peso 420 | cuerpo del texto |
  | `row` | 15, peso 520 | títulos de fila |
  | `title` | 20, peso 560, −0,02em | títulos de vista |
  | `figure` | 28, peso 500 | cifras, con tabular-nums |

- Los textareas de relato van a 15/1.6 con 68ch.
- El mono, a 12–13, se usa solo para slug, clave de métrica, URL, id y kbd.
- No hay mayúsculas espaciadas en ningún lado. Las únicas mayúsculas son las del documento del CV.

**Espacio y forma.**
- Base de 4 px.
- Controles de 32 px; el primario del pie mide 36.
- Radios: 6 px en controles, 10 en diálogos y 3 en imágenes. Solo los diálogos llevan sombra.
- Rejillas: Inicio `240px 1fr` y colecciones `240px minmax(300px,340px) 1fr`.
- El formulario tiene un ancho máximo de 760 px.
- Entre 768 y 1023 px hay dos columnas con el explorador plegable. Por debajo de 768 px es maestro-detalle.

**Movimiento.** Todo se apaga con prefers-reduced-motion mediante un bloque global.
- Curva `--e`: cubic-bezier(.16,1,.3,1).
- Duraciones:
  - 120 ms para el color en hover;
  - 200 ms para paneles, diálogos y avisos (opacidad más 6 px de desplazamiento);
  - 300 ms para el resaltado de la paleta y el indicador de la navegación, que viajan;
  - 250 ms para la View Transition del título de la fila al encabezado del editor.
- Solo se animan opacity, transform, color y background-color.

**Lenguaje.** Todo sale de un diccionario único:
- Publicación: Borrador, Programada, Publicada, Oculta.
- Situación: En línea, En desarrollo, Archivada.
- Media: Portada, Galería.
- Veredictos: Muy compatible, Compatible, Dudosa, Descartar.

Nunca se muestra el valor de un enum. Los mensajes se escriben completos por modelo («Experiencia guardada»). Eros aparece como fuente («Generado por Eros» o «Armado desde la base, sin Eros»), nunca como marca.

## 3. Arquitectura de información

1. **Inicio** (`#/inicio`). Una bandeja de pendientes calculada con las reglas de la API pública. Cada fila lleva al campo exacto.
   - Incluye obras ocultas, inglés faltante por campo, viñetas EN, métricas sin fuente, borradores, vacantes nuevas compatibles y Eros sin responder.
   - También avisa si el PDF del CV ya no coincide con la base o si falta un bloque requerido del perfil.
   - Arriba tiene una línea de resumen con cifras reales y dos accesos: Nueva obra y Pegar una vacante.
2. **Obras** (`#/obras/:id/:seccion`). Cuatro secciones:
   - Lo esencial
   - Relato
   - Imágenes
   - Datos

   El encabezado muestra la publicación con su checklist y el enlace «Ver en el sitio».
3. **Trayectoria** (`#/trayectoria/:id`, `#/trayectoria/cv`). La vista CV ordena las entradas y muestra en vivo la hoja A4 real.
4. **Artículos** (`#/articulos/:id`). Texto, vista previa con el render del sitio e inglés.
5. **Perfil** (`#/perfil/sobre-mi`, `#/perfil/contacto`). Formularios fijos armados desde un esquema, retrato y bloques libres.

**Catálogos**, como secundarios plegados: Tecnologías y Empresas.

**Búsqueda laboral** tiene las pestañas Vacantes (`#/busqueda/vacantes/:id/:etapa`), Publicaciones y Tendencias.

**La ruta es el estado.** El router funciona por hash. `?filtro=` aplica a las listas y `?campo=` lleva el foco a un campo. La guarda de cambios sin guardar corre en `beforeEach`.

**Paleta Ctrl/⌘K.** Es un combobox ARIA que indexa secciones, acciones y registros (vacantes incluidas). Busca sin acentos.

**Teclado** (alineado con `docs/diseno.md` §7):
- Ctrl/⌘K abre la paleta.
- Ctrl/⌘S guarda, también desde un campo.
- Esc cierra la capa de arriba.
- ↑/↓ o j/k y Enter recorren las listas.
- / abre la búsqueda.
- N crea un registro nuevo.

No se usan Ctrl+N ni Ctrl+D. Las teclas de un carácter se pueden apagar desde la paleta.

## 4. Arquitectura de código

**Build: Vite + SFC + TypeScript.** Depende de la pregunta 1, que bloquea A0. Así queda:
- Raíz en `server/admin/src/` y salida en `server/admin/dist/` (en .gitignore).
- **`base` absoluta**: `/admin-next/` durante la convivencia y `/admin/` desde S1. Se lee de `ADMIN_BASE`. Con una base relativa, una visita a `/admin-next` sin barra final pide `/assets/*` a Nuxt y da 404.
- `uiNext` responde 301 de `/admin-next` a `/admin-next/`. Nitro tiene sus routeRules para `/admin-next` y `/admin-next/**`.
- Plugins: `@vitejs/plugin-vue` y `@tailwindcss/vite`. `admin.css` empieza con `@import 'tailwindcss' source(none); @source './**/*.{vue,ts,html}';` para no escanear `app/` ni `docs/`.
- `vue-router` en modo hash y `vue-tsc` en `pnpm typecheck`.
- `Dockerfile.api`: solo cambia la línea de build.
- CSP del admin nuevo: `script-src 'self'` y `style-src 'self'`. `check-admin-style` prohíbe los atributos `style="…"` estáticos, porque Vue los inserta por innerHTML. Los `:style` dinámicos van por CSSOM y están permitidos. `img-src 'self' data: blob:`.
- La prueba de humo pasa por el proxy de Nuxt, que es el camino de producción. Verifica que el navegador reciba una sola CSP, la del admin. Si la regla `'/**'` de nitro le suma la del sitio, se agrega en `nuxt.config.ts` el override de headers para `/admin-next/**` (y para `/admin/**` en S1).

**Plan B si la pregunta 1 se responde «sin build».** A0 pasa a vue.esm-browser con importmap, `@tailwindcss/cli` y JSDoc. La CSP conserva `unsafe-eval`. La estructura de carpetas y los paquetes siguen iguales, con módulos `.js` en lugar de `.vue`.

**Estructura de `server/admin/src/`:**
- `api/` (client, errors)
- `stores/`
- `composables/`
- `ui/`: componentes base accesibles más un Muestrario solo en desarrollo
- `shell/`
- `features/collections/`: el marco común (Explorer, EditorFrame, SectionTabs, BilingualField, DeleteDialog, SaveState, PublishState, Checklist, InlineCreate, SlugField, SlugDialog)
- `features/<área>/`, cada una con su `model.ts`
- `styles/`

**Reglas del código nuevo:**
- Archivos de 300 líneas como máximo.
- Cero hex, cero `text-[Npx]`, cero paletas de Tailwind, cero ` // ` en plantillas, cero mayúsculas espaciadas, cero emojis y cero `style` estático.
- Los atajos llaman acciones.
- Cada vista declara sus estados de carga, vacío, error y respaldo.
- `pnpm lint` corre `scripts/admin-checks.mjs`, que ejecuta todos los `scripts/check-admin-*.mjs` presentes. Así ningún paquete necesita tocar `package.json` para sumar un chequeo.

**Servidor:**
- `router.ts` solo monta. Se separan meta, orgs, articles, status y pending.
- El contrato vive en `server/src/shared/`: adminSchema, labels, adminContracts, slug, docSchema, metricKeys y markdown.
- Los errores 400 tienen la forma `{ error, errors: [{ path, message }] }`, en español y todos juntos.
- Hasta S1, el static del admin actual queda restringido a una lista blanca: `index.html`, `admin.css`, `js/**` y `vendor/**`.

**Migración sin romper producción:**
- El admin actual sigue en `/admin` mientras el nuevo crece en `/admin-next`.
- Los cambios de API son aditivos hasta S1.
- L0 arregla en el admin actual los fallos que rompen datos y lo prepara para los cambios de H0: el 409 del CV, la vacante en el cuerpo y el login sin dev-token.

**Pruebas:**
- `playwright.config.ts` (sitio) suma `testIgnore: ['**/admin-*.spec.ts']` en todos sus proyectos, salvo `admin-audit.spec.ts` mientras viva el admin actual.
- El admin nuevo tiene su propio `playwright.admin.config.ts`, sin `webServer`, con `baseURL` desde `ADMIN_API_URL`. Lo lanza `scripts/admin-run.mjs`, que:
  - copia la base;
  - toma un puerto libre entre 3940 y 3990;
  - usa un token aleatorio;
  - corre con Eros apagado, o con el Eros simulado si se pasa `--eros-mock`;
  - con `--web`, compila Nuxt apuntando a esa API para probar el proxy;
  - limpia todo al terminar.
- `tests/e2e/run.mjs` despacha cada config. Todos los comandos de aceptación usan `-c playwright.admin.config.ts`.

## 5. Datos: matriz y huecos

| Modelo | Campos editables | Inglés | Editor | Endpoint | Hueco que se cierra |
|---|---|---|---|---|---|
| Project | slug, title, year, role, status, featured, summary, brief, outcome, url, repo, sortOrder, publishedAt, org, techs (experiences y articles en solo lectura) | title, role, summary, brief, outcome | U1, U7 | PUT /projects/:id, PATCH /projects/:id/slug | slug reescrito (L0, D2); orden max+1 (D2); errores por campo (D1) |
| Metric | key, value, unit, items, label, source, measuredAt, order | label (MetricTranslation, nueva) | U7 | anidado | ids que cambian → sincronización por id; catálogo de claves; label EN (D2) |
| ProcessStep | title, body, mediaId, order | title, body | U1 | anidado | se conserva |
| Link | label, url | label | U7 | anidado | completa https:// (D1) |
| Media | role, alt, caption, tint, viewport, order, poster, srcWebm, archivo | alt, caption | U7 | /media, POST /media/:id/file y /webm | reemplazo que conserva id, inglés y pasos (D2) |
| Experience | slug, kind, role, startedAt, endedAt, summary, story, highlights, location, cvOrder, org, techs, projects | role, summary, story, highlights, location | U2 | PUT /experience/:id, **PATCH /experience/:id/slug**, PATCH /experience/order | **slug que sigue al cargo** (L0, D1); viñetas EN corridas (D1); cvOrder 1..n (D1) |
| Tech | slug, name, category, since, note, color | note | U3 | /techs, impacto | color y año validados; impacto y reasignación (D1) |
| Org | slug, name, url, city | — | U3 | /orgs, impacto | impacto y reasignación (D1) |
| Doc about | bloques del esquema; **portrait = imagen sin `en`**; portrait_alt traducible; bloques libres | solo string, text y list | U4 | GET/PUT /docs/:key, POST /docs/about/portrait | `en` de portrait, email y url que queda viejo (D2 + parche); retrato **dentro del volumen** (`public/media/projects/_perfil/`) |
| Doc contact | bloques del esquema; **cv = ruta por idioma** (dos campos: «PDF en español» y «PDF en inglés»); email y url sin `en` | string, text, list y cv | U4 | ídem | el parche no toca `cv`; los bloques requeridos que faltan se crean al guardar |
| Article | slug, title, summary, content, readingTimeMin, status, featured, canonicalUrl, sortOrder, publishedAt, techs, project | title, summary, content | U6 | /articles, **PATCH /articles/:id/slug** | inglés sin editor; nace DRAFT; slug con acentos; cambio de dirección explícito (D1) |
| Doc.title | no se pide en el formulario; el servidor conserva el valor guardado (sin migración) | — | — | — | — |
| legacyMetrics | no se edita | — | — | — | migración aparte, fuera del plan |
| PDF del CV (`public/cv/*.pdf`) | artefacto derivado | ES y EN | — | `pnpm cv:pdf` | sello `server/src/snapshot/cv-stamp.json` y pendiente en Inicio (U5); pregunta 6 |

**Además:**
- `/meta` se invalida después de cada escritura.
- Se puede crear una empresa o una tecnología sin salir del formulario, con InlineCreate de C0.
- Los conteos usan las reglas de visibilidad de la API pública.
- `check-admin-schema` falla si un campo de Prisma no tiene descriptor.
- Una prueba de ida y vuelta (GET → formulario → PUT sin cambios) no debe alterar nada.

**Producción.** Solo se toca a través del parche `server/src/patches/2026-11-05-admin-datos.ts`: `--dry`, aplicar, y `--dry` otra vez hasta que diga «sin cambios». Si cambia algo público, `pnpm db:snapshot` y commit.

## 6. Eros y Job Hunter (invariante 6)

**Contrato tipado** en `erosContract.ts` y `erosContentContract.ts`. El servidor normaliza los nombres (`scanned`, `new_jobs`, `linkedin_text`).

**Una sola fuente del CV.** Eros devuelve un AdminCv con la misma forma que el de respaldo. El servidor compone siempre el CV con `tailorCv(await loadCv(lang))` y de Eros toma solo las pistas de adaptación, que se extraen campo por campo:
- **Categorías:** las claves de `skills` se pasan a TechCategory con `cvLabels.categories` invertido, en los dos idiomas, y se respeta su orden. Las desconocidas se descartan.
- **Tecnologías dentro de cada categoría:** se emparejan con `Tech.name` por nombre normalizado (minúsculas, sin acentos ni puntuación). Las que no están en la base se descartan.
- **Entradas:** `experience[].title` y `role` se emparejan con las obras y experiencias visibles del CV base por título normalizado, o por slug si Eros lo manda. Dan el orden y nunca suman entradas nuevas.
- **Viñetas:** se emparejan por texto exacto normalizado con `highlights` de la entrada y dan el orden de los índices. Una viñeta que no existe en la base se descarta.
- **Resumen:** pasa a ser `summaryProposal` (pregunta 4).
- **El resto** (nombre, contacto, educación, idiomas, metodología) sale siempre de la base.

La respuesta trae `_adaptation: { categories, entries, bullets, discarded }`. La prueba usa un **Eros simulado**, con respuestas escritas a mano según el contrato, sin contactar al Eros real. Incluye textos inventados, como «3 años de experiencia» y «Portafolio Dos Mundos», y verifica que ninguno llegue al CV y que cada viñeta exista en la base.

**Caché y salidas:**
- El AdminCv queda en memoria por vacante, con un TTL de 1 h.
- De ahí salen `/cv/:id/html`, `/cv/:id/txt` y la impresión.
- **«Descargar PDF» deja de pedir el PDF de Eros.** Pasa a ser «Imprimir o guardar como PDF» sobre la misma hoja, y `/cv/:id/pdf` se retira (está en el inventario de la pregunta 3).
- Si no hay CV en caché, la API responde 409. Pasa después de un reinicio o de más de 1 h, y el cliente (nuevo y legado) **reintenta solo**: vuelve a hacer POST /cv con la vacante en el cuerpo y repite el pedido una vez.
- El CV base de Trayectoria usa `/cv-base/ticket` y `/cv-base/html`, con prefijo propio para no chocar con `/cv/:id/*`.

**Sin Eros, honesto:**
- Las lecturas responden 503 `{offline:true}`.
- Las escrituras sin Eros fallan con un mensaje claro.
- El circuit breaker cuenta solo errores de red, timeouts y 5xx.
- Analizar, generar el pitch y adaptar el CV aceptan la vacante en el cuerpo.
- **Los ids `manual-*` nunca van a Eros.** Además, un 404 de Eros con vacante en el cuerpo cae al respaldo local con `_source 'fallback'`.
- «Pegar una vacante» cumple el invariante 6 con Eros arriba o caído.
- La muestra ficticia aparece solo con `EROS_DEMO=1`, en pruebas y capturas.

**Flujo por etapas:**
1. Análisis
2. Mensaje
3. CV: la hoja real, Imprimir A4, Copiar texto plano, Ampliar
4. Postular

**Inventario de endpoints → UI** (nada se retira sin decisión, ver la pregunta 3):

| Endpoint | Dónde queda |
|---|---|
| GET /hunter/stats | resumen de la cola y bloque de Inicio (H1, U5) |
| GET /hunter/jobs | cola (H1) |
| POST /hunter/scan | «Buscar vacantes nuevas» (H1) |
| POST /hunter/evaluate (lote) | Más acciones → «Evaluar las pendientes» (H1) |
| POST /hunter/jobs/:id/evaluate | etapa Análisis (H1) |
| POST /hunter/purge | Más acciones → «Limpiar la cola», con confirmación (H1) |
| POST /hunter/search/semantic y /vectorize | interruptor «Buscar por afinidad» en la búsqueda de la cola, y vectorizar al terminar un escaneo (H1; pregunta 3) |
| PATCH /hunter/jobs/:id/status | estados y «Ya la envié» (H1) |
| DELETE /hunter/jobs/:id | Más acciones de la vacante → Eliminar (H1) |
| DELETE /hunter/jobs (todas) | pregunta 3 (recomendación: retirarlo de la UI) |
| POST /hunter/jobs/:id/pitch | etapa Mensaje (H1) |
| POST /hunter/cv/:id, /ticket, /html, /txt | etapa CV (H1) |
| GET /hunter/cv/:id/pdf | se retira (una sola fuente) |
| GET /jobs/:id/apply-preview | etapa Postular: vista previa del correo (H1) |
| POST /jobs/:id/find-email | etapa Postular: «Buscar correo» (H1) |
| PATCH /jobs/:id/contact-email | etapa Postular: destinatario (H1) |
| POST /jobs/:id/apply-email | etapa Postular: «Enviar desde Eros», con confirmación que muestra destinatario y asunto (H1) |
| content: GET /posts, /posts/:id, POST /generate, PATCH /posts/:id/status, DELETE /posts/:id, /carousel/:id/ticket y /html, /posts/:id/publish (n8n), /posts/:id/publish-to-blog | H2: lista, detalle, generar, estado, eliminar, carrusel, «Publicar por n8n» con confirmación, «Publicar en el blog» |
| radar: GET /trends, /trends/:id, POST /scan, PATCH /trends/:id/status, POST /trends/:id/generate | H2: lista, detalle, buscar, estado, crear publicación |

`scripts/check-admin-endpoints.mjs` (DOC) falla en dos casos: si una ruta montada no tiene uso en `server/admin/src` ni figura como retirada, o si `docs/admin.md` no la documenta.

**Seguridad:**
- `dev-token` vale solo si no hay `ADMIN_TOKEN` y no se está en producción. L0 quita el botón «dev-token rápido» del login actual.
- `HUNTER_API_URL` pasa a ser obligatoria para que Eros esté disponible. Ya está documentada en DEPLOY.md como `http://eros:8000`, así que no hace falta preguntarla: alcanza con verificarla en Coolify antes del deploy. Sin ella, Eros queda «no configurado».
- El reintento a 127.0.0.1:8000 se activa solo con `HUNTER_LOCAL_FALLBACK=1`.

## 7. Accesibilidad

- Todo lo clicable es `<button>` o `<a>`.
- `:focus-visible` con un anillo de 2 px en `--sig-text`.
- Las listas son listbox con roving tabindex.
- Las pestañas siguen WAI-ARIA con activación manual.
- Los diálogos usan `<dialog>`: atrapan el foco y lo devuelven al cerrar. En los destructivos, el foco empieza en Cancelar.
- `Field` liga el rótulo, la ayuda y el error.
- Hay dos regiones aria-live montadas desde el arranque.
- `<nav aria-label="Secciones">` con `aria-current`.
- Enlace «Saltar al editor».
- Al cambiar de vista, el foco va al h1 y se actualiza `document.title`.
- Ningún texto que se lee baja de 12 px.
- axe con 0 violaciones serias o críticas.
- Sin scroll horizontal entre 390 y 1920 px.

## 8. Qué se descarta

**Del admin actual:**
- blueprint-grid, la numeración 00–09 y los «NN // …»;
- ACID, PG-17, ONLINE escrito a mano, SYS, CMS 2026, v2026.2 y DEST;
- [BLOQUEADO], [MANUAL] y EXCELENTE_MATCH;
- «EROS // …»;
- el bento con blur, el glow, el ping y el pulse;
- los colores por módulo y el botón azul;
- el mono en mayúsculas;
- Plus Jakarta Sans y JetBrains Mono;
- `user-select:none`, `transition-all`, los hex sueltos y los `!important`;
- la Guía de Asistencia, AdmAiTrace y la telemetría «Infraestructura»;
- la maqueta Vue del CV y el PDF de Eros;
- el parche de `window.confirm`;
- Ctrl+N y Ctrl+D;
- las 712 líneas muertas;
- la caché de vacantes en `localStorage`;
- el slug que sigue al título;
- el botón dev-token.

**Del sitio no se trae:** la escala monumental, Lenis, la temperatura de fondo, R, el Hiperfoco, el texto que rueda, los imanes, el parallax ni los cursores.

## 9. Riesgos

- **Vite en Docker.** La fuente se copia a `server/admin/src/assets/fonts/` y un hash la compara con la del sitio. S1 exige que `docker build -f Dockerfile.api .` termine bien.
- **Proxy de Nuxt.** Las pruebas de humo de A0 y S1 corren con el build de Nuxt: carga sin barra final, assets sin 404, una sola CSP.
- **CSP sin `unsafe-inline`.** Se cubre con la prohibición del `style` estático y con E1 verificando que la consola no registre violaciones de CSP en ninguna vista.
- **Convivencia.** L0 prepara el admin actual para el 409 y para la vacante en el cuerpo antes de H0. `EROS_DEMO=1` solo corre en la API de las pruebas.
- **Mudar `metricKeys` y `markdown` a shared** toca el sitio. D2 y U6 corren `pnpm test:e2e i18n record data routes`.
- **MetricTranslation.** La migración es aditiva. D2 regenera `server/src/snapshot/content.json` y lo commitea antes de `db:snapshot:check`.
- **Volumen.** El retrato va dentro de `/app/public/media/projects`. D2 lo prueba con un rebuild de contenedor y un volumen nombrado.
- **Escrituras en pruebas.** Nunca sobre `portfolio`: siempre `scripts/admin-run.mjs`.
- **5 minutos.** Se mide con las constantes de la auditoría (2 s por clic y 12 s por campo) sobre el alcance literal del invariante: cargar, redactar el caso, asignar tecnologías y subir imágenes. La versión bilingüe completa se mide e informa aparte. Al cierre de la ola 5 hay una sesión cronometrada con una persona que no programa (o con Mateo observando). Si falla, la ola no cierra.
- **Tamaño.** Ocho olas y veinte paquetes. Mateo revisa cada ola con capturas y una secuencia.

## 10. Despliegue

1. Cada paquete trabaja en su worktree, en una rama que sale de `rediseno/admin`, y se integra al cerrar su ola. Antes de integrar: `pnpm lint`, `pnpm typecheck`, `pnpm build:admin` y sus specs.
2. Al cierre de cada ola, Mateo revisa `/admin-next` en local, a 1440 y 390 px, con una secuencia.
3. Después de S1 y DOC, un PR único a `main`. Coolify despliega y la migración corre sola.
4. Antes del merge:
   - verificar `HUNTER_API_URL=http://eros:8000` en Coolify (DEPLOY.md);
   - verificar el volumen en `/app/public/media/projects`;
   - hacer `pg_dump`.
5. En producción, con el OK de Mateo:
   1. `pnpm tsx server/src/patches/2026-11-05-admin-datos.ts --dry`
   2. aplicar el parche
   3. `--dry` otra vez, hasta que diga «sin cambios»
   4. reiniciar la API
   5. si cambió algo público, `pnpm db:snapshot` y commit; si cambió el CV, `pnpm cv:pdf` y commit
6. Auditoría de solo lectura en mateogs.tech/admin.

## 11. Cómo se aplicó la crítica

**Blockers**
- **Playwright.** D1 crea `playwright.admin.config.ts` (sin webServer), suma `testIgnore` de `admin-*.spec.ts` a los proyectos del sitio y enseña a `run.mjs` a despachar cada config. Todos los comandos de aceptación usan `-c playwright.admin.config.ts`.
- **base.** Pasa a ser absoluta (`/admin-next/`, y `/admin/` en S1), con 301 a la barra final. A0, E1 (`admin-proxy.spec.ts`) y S1 suman pruebas de humo por el proxy de Nuxt.

**Majors**
- **Retrato:** se sube dentro del volumen (`_perfil`), con una prueba de rebuild (D2).
- **portrait y cv:** portrait es una imagen sin `en`. cv es una ruta por idioma con dos campos, y el parche no la toca (D2, U4).
- **U5** pasa a la ola 5 y depende de C0 y U1.
- **PublishState, Checklist, InlineCreate, SlugField y SlugDialog** pasan a C0.
- **Extracción de Eros:** queda especificada campo por campo, con Eros simulado y sin PDF de Eros (H0).
- **`manual-*`** nunca va a Eros, y un 404 con cuerpo cae al respaldo (H0). Lo prueba un caso con el simulado arriba (H1).
- **409:** el cliente vuelve a generar solo (L0 y H1), con un caso de reinicio en admin-audit (H0).
- **5 minutos:** se usan las constantes de la auditoría, con tope de 15 campos y 16 clics, alcance literal y la sesión humana como gate (E1, U7).
- **PDF del CV:** sello y pendiente en Inicio (U5), el paso documentado (DOC) y la pregunta 6.
- **Paridad:** inventario completo en la sección 6 y la pregunta 3; `check-admin-endpoints.mjs` (DOC).
- **Slug de experiencias y artículos:** PATCH explícito (D1), SlugField en U2 y U6, y L0 frena el slug que sigue al cargo.

**Minors aplicados**
- snapshot en D2;
- PUT que crea los bloques requeridos faltantes;
- Doc.title solo en la UI;
- prefijo `/cv-base`;
- `source(none)`;
- `style` estático prohibido;
- img-src sin https (Repo.vue no muestra imágenes externas; si las mostrara, se suma el host puntual);
- lista blanca del static del admin actual;
- botón dev-token fuera en L0;
- `/status` de Eros en H0 (H0 pasa a la ola 2 y depende de D1);
- DOC depende de S1 (ola 8) y S1 da de baja `@tailwindcss/cli`.

**Preguntas**
- La de `HUNTER_API_URL` y la política sin Eros dejan de ser preguntas: están en DEPLOY.md y quedan como decisiones en la sección 6.
- La del build bloquea A0 y tiene plan B.
- La de la redirección aclara que necesita un endpoint público de alias.
## Respuestas de Mateo (31-oct-2026)

Mandan sobre cualquier paso de los paquetes que diga otra cosa.

1. **Build:** Vite + componentes `.vue` + TypeScript, compilado en la imagen del API. Se actualiza el invariante de `.claude/rules/admin.md` que nombraba `@tailwindcss/cli`. El plan B sin build queda descartado.
2. **Publicaciones y Tendencias:** se conservan las dos como pestañas de Búsqueda laboral (paquete H2), sin datos inventados.
3. **Job Hunter:** se conserva todo menos «Borrar todas las vacantes». La búsqueda por afinidad queda como interruptor y vectorizar corre sola después de cada escaneo. El PDF que arma Eros se retira: el CV se imprime o se guarda como PDF desde la hoja armada con la base.
4. **Resumen dirigido de Eros:** entra al CV solo como propuesta, al lado, aceptable con un clic. Por defecto queda el resumen de la base.
5. **Slugs:** dirección fija; se cambia solo con «Cambiar dirección», que avisa que los enlaces viejos dejan de andar. Sin tabla de alias.
6. **PDF del CV del sitio:** se regenera a mano (`pnpm cv:pdf` y commit). Inicio avisa cuando el PDF ya no coincide con la base.

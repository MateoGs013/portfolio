# El admin (`/admin`)

La mesa de trabajo del portafolio: acá se carga y se cuida el contenido que publica mateogs.tech y se opera la búsqueda laboral con Eros. Este documento describe lo que quedó después del rediseño (noviembre de 2026, olas A0 a S1). El plan con sus motivos está en `docs/rediseno-admin/plan.md`, la dirección visual aprobada en `docs/rediseno-admin/demo.html` (capa «Dirección 2») y las decisiones con lo descartado en `docs/decisiones.md` → «Rediseño del admin (nov-2026)». Las reglas para tocar el código están en `.claude/rules/admin.md` (UI) y `.claude/rules/backend.md` (API).

---

## 1. Tesis

El sitio público sale entero de un solo modelo relacional en PostgreSQL 17. El admin es la única puerta de escritura a ese modelo y tiene que ser tan confiable como el sitio es cuidado:

1. **Lo que se guarda es lo que se publica.** Los conteos, los estados y los pendientes usan las mismas reglas de visibilidad que la API pública (`server/src/content/visibility.ts`). Nada en pantalla está escrito a mano: las cifras salen de `/api/admin/meta` y la bandeja de `/api/admin/pending`.
2. **Una cosa por pantalla.** Cada colección es su propia pantalla con filas grandes; el editor ocupa la pantalla solo. Es la misma mesa del sitio, con densidad de herramienta.
3. **No se pierde trabajo.** Borrador por registro en la sesión, guarda de cambios sin guardar en cada navegación, reingreso sin perder el formulario ante un 401 y errores por campo, todos juntos y en español.
4. **Eros es una fuente, no una dependencia.** Sin Eros el contenido se edita igual y el CV Harvard ATS se arma desde la base (invariante 6 del proyecto). Lo que necesita a Eros lo dice y no inventa datos.

---

## 2. Perfiles

**Mateo (autor).** Publica obras y artículos, mantiene la trayectoria y el CV, revisa vacantes y postula. Quiere teclado (`Ctrl/⌘K`, `Ctrl/⌘S`, `j`/`k`, `/`, `N`), direcciones que se puedan compartir (`#/obras/12/relato?campo=outcome`) y saber al instante qué falta.

**Un asistente sin saber programar.** Carga una obra completa (texto, tecnologías, imágenes) en menos de cinco minutos sin SQL ni JSON (invariante 6 de `.claude/rules/admin.md`). Cada campo dice para qué sirve y dónde aparece, las métricas se cargan por tipo, la dirección (slug) se deriva sola y no cambia sin aviso, y ningún valor de enum se ve crudo. La prueba `tests/e2e/admin-flujo-obra.spec.ts` mide el recorrido con las constantes de la auditoría (2 s por clic, 12 s por campo): los topes son 16 clics, 15 campos, 2 guardados y 300 s, y la cuenta estricta (cada Enter que elige una tecnología cuenta como clic) da hoy 17 con el techo en 17.

---

## 3. Arquitectura de información y rutas

El router va por hash (`server/admin/src/router.ts`). La ruta es el estado: `?filtro=` en las listas, `?seccion=` o `:seccion` en los editores, `?campo=` para llevar el foco a un campo exacto (lo usan la checklist y la bandeja de Inicio).

| Pantalla | Ruta | Qué hay |
|---|---|---|
| Inicio | `#/inicio` | Línea de resumen con cifras reales, bandeja de pendientes que lleva al campo exacto, vacantes nuevas compatibles, Eros caído y el aviso del PDF del CV |
| Obras | `#/obras`, `#/obras/nueva`, `#/obras/:id/:seccion` | Lista (con `?vista=orden` para el orden del sitio) y editor en cuatro secciones: `esencial`, `relato`, `imagenes`, `datos` |
| Trayectoria | `#/trayectoria`, `#/trayectoria/nueva`, `#/trayectoria/:id`, `#/trayectoria/cv` | Entradas de trabajo y formación; la Vista CV ordena las entradas del CV y muestra la hoja A4 real medida (`?idioma=en`) |
| Artículos | `#/articulos`, `#/articulos/nuevo`, `#/articulos/:id` | Texto en markdown con la vista previa del sitio e inglés; `?origen=eros` cuando llega desde Publicaciones |
| Perfil | `#/perfil/sobre-mi`, `#/perfil/contacto` | Los documentos `about` y `contact` como formularios fijos desde `server/src/shared/docSchema.ts`, retrato y bloques libres |
| Catálogos | `#/tecnologias[/:id]`, `#/empresas[/:id]` | Plegados en la navegación. El alta es un diálogo (`?nueva=1`), con «Dónde se usa» y reasignación al borrar |
| Búsqueda laboral | `#/busqueda/vacantes/:id?/:etapa?`, `#/busqueda/publicaciones/:id?`, `#/busqueda/tendencias/:id?` | Tres pestañas. Vacantes recorre las etapas `analisis`, `mensaje`, `cv` y `postular` |
| Ingreso | `#/ingresar?volver=` | La clave (`ADMIN_TOKEN`) queda en `sessionStorage` (`adm-token`) |

Cada área tiene una sola entrada, `features/<área>/Index.vue`, que elige lista o registro según la ruta. Consultas que abren algo y se limpian solas: `#/busqueda/vacantes?pegar=1` (pegar una vacante), `#/busqueda/publicaciones?generar=1`, `#/empresas?nueva=1`, `#/tecnologias?nueva=1` y `#/busqueda/vacantes/:id/cv?adaptar=1`. `#/muestrario` (los componentes base) existe solo en desarrollo.

La navegación (`shell/nav.ts`) no lleva iconos ni numeración; el contador aparece solo cuando hay pendientes (obras ocultas, borradores, vacantes nuevas compatibles).

---

## 4. Dirección visual

La de la demo aprobada: el mismo frío, las mismas familias y el mismo acento que el sitio. Los valores viven en `server/admin/src/styles/tokens.css` y llegan a Tailwind por `@theme`; la paleta de Tailwind por defecto está apagada (`--color-*: initial`), así que solo existen estos colores.

**Color (tema oscuro).**

| Token | Valor | Uso |
|---|---|---|
| `bg` | #0b0b0c | lienzo, igual que el sitio |
| `panel` · `surface` · `surface-2` | #111113 · #161618 · #1c1c1f | navegación, hover de fila, popovers, paleta y diálogos |
| `rule` · `rule-strong` · `rule-hover` | blanco al 8 · 14 · 22 % | divisores, línea de los campos, línea apuntada |
| `ink` · `dim` · `faint` | #ededee · #a1a1a9 · #83838c | texto, rótulos, ayudas y metadatos |
| `sig` · `sig-text` · `on-sig` | #ff3e00 · #ff3e00 · #0b0b0c | relleno del primario, indicador activo y anillo de foco; texto sobre el primario |
| `ok` · `wip` | #3ecf6e · #e5a00d | solo el punto de estado, siempre con una palabra al lado |
| `danger` | #f0524f | errores y acciones destructivas |

El acento ocupa menos del 5 % de la pantalla. El tema claro está declarado con los valores del sitio y no se activa. `scripts/check-admin-contrast.mjs` mide cada par texto/fondo (AA) y compara `bg`, `ink`, `dim`, `faint`, `sig`, `ok` y `wip` con `app/assets/css/tokens.css`.

**Tipografía.** General Sans Variable para todo lo que se lee y Martian Mono solo para identificadores (slug, clave de métrica, URL, id, teclas), ambas servidas por el propio admin desde `server/admin/src/assets/fonts/` (copia del sitio, comparada por hash). Tamaños como tokens, nunca `text-[Npx]`:

| Token | Tamaño | Uso |
|---|---|---|
| `meta` · `label` | 12 · 13 | metadatos y teclas · rótulos en minúscula de oración |
| `body` · `row` | 14/1,45 · 15 | texto de herramienta · títulos de fila chica |
| `title` · `figure` | 20 · 28 | títulos de bloque · cifras con `tabular-nums` |
| `field` · `lead` · `prose` | 16 · 16 · 17/1,6 | campos, bajadas y textos largos (68ch) |
| `list` | clamp(24–34 px) | filas de las listas |
| `heading` · `display` | clamp(38–60 px) · clamp(44–72 px), −0,045em | título de pantalla · título del registro |

Sin mayúsculas forzadas ni espaciadas: las únicas mayúsculas son las del documento del CV.

**Composición.** Rejilla `220px 1fr` desde 768 px (navegación y pantalla); debajo, cabecera con menú y paleta. Las listas son pantallas de filas grandes sobre líneas de 1 px; el editor es una columna con el título en display, las secciones como pestañas y la barra de acciones anclada abajo (publica su alto en `--bar-h` para que los avisos no la tapen). Los campos no tienen caja: texto sobre una línea de 1 px que pasa a 2 px en `ink` con el foco, con 34 px entre campos. Esa línea es el indicador de foco de los campos de texto (la excepción deliberada al anillo de 2 px en `sig-text`, como en la demo aprobada); botones, enlaces, pestañas y filas llevan el anillo. Los textos con inglés van en una sola columna: el español arriba y el inglés debajo, nunca dos columnas angostas. Imágenes es una grilla de miniaturas que se abren pieza por pieza y Métricas una tabla compacta que se abre fila por fila; las nuevas y las que tienen un error quedan abiertas. Radios: 6 px en controles, 10 en diálogos, 3 en imágenes; solo los diálogos llevan sombra. Sin tarjetas dentro de tarjetas, sin rejillas de fondo, sin colores por módulo.

**Movimiento.** Curva `--e` (cubic-bezier(.16,1,.3,1)). Las filas entran escalonadas (`stagger`, 45 ms por fila, `animate-rise`); al apuntar una, las hermanas bajan a .28 y la apuntada se corre 14 px. El título viaja de la fila al encabezado del editor con una View Transition (`record-title`, 0,7 s). Paneles, diálogos y avisos: 200 ms de opacidad y 6 px. Solo se animan opacity, transform, color y background-color, y `prefers-reduced-motion` apaga todo desde un bloque global de `styles/admin.css`.

**Lenguaje.** Un solo diccionario por capa: `ui/dict.ts` (componentes base), `shell/dict.ts` (marco) y `features/<área>/dict.ts`; los rótulos de los enums salen de `server/src/shared/labels.ts` (Publicada, Programada, Oculta, Borrador; En línea, En desarrollo, Archivada; Portada, Galería). Los veredictos de vacantes salen del puntaje con los cortes de `hunterHeuristics.ts` (82, 65, 45): Muy compatible, Compatible, Dudosa, Descartar. Eros aparece como fuente («Generado por Eros», «Armado desde la base, sin Eros»), nunca como marca.

---

## 5. Componentes base

En `server/admin/src/ui/`, todos accesibles y probados en el Muestrario (`#/muestrario`, solo en desarrollo):

- **Acciones:** `Button` (variantes en `button.ts`, estado de carga, atajo con `Kbd`), `IconButton` (siempre con nombre accesible), `Menu`.
- **Campos:** `Field` (liga rótulo, ayuda y error; pasa `data-field` a su raíz), `TextInput`, `TextArea` (se re-mide solo), `Select`, `RadioGroup`, `Switch` (`role=switch`). La línea y su estado salen de `field.ts` (`lineControl`, `lineState`).
- **Listas y navegación:** `Listbox` (roving tabindex, `j`/`k`), `Tabs` (WAI-ARIA con activación manual).
- **Estado:** `StatusDot` (punto más palabra), `Spinner`, `Skeleton`, `EmptyState`, `ErrorState`.
- **Capas:** `Dialog` (todo `<dialog>` pasa por acá: atrapa y devuelve el foco, prop `locked` para acciones largas; `topLayer.ts` mueve los avisos adentro del diálogo abierto), `ConfirmHost` y `ConfirmDialog` (por `requestConfirm`, con el foco en Cancelar en las destructivas), `Toaster`, `Announcer` (dos regiones `aria-live` montadas desde el arranque; `announce()`).
- **Identificadores:** `Mono` (y `monoClass`) y `Kbd`, los únicos lugares donde aparece Martian Mono. `Icon` dibuja solo los trazos utilitarios de `icons.ts`.

El marco de colecciones (`features/collections/`) arma las pantallas de datos: `Explorer` (lista con filtros y búsqueda en la URL), `EditorFrame` (título, secciones, barra de acciones, eliminar), `SectionTabs`, `SchemaField` (un campo desde `adminSchema`), `BilingualField`, `SlugField` y `SlugDialog` («Cambiar dirección»), `PublishState` y `Checklist`, `InlineCreate` (empresa o tecnología sin salir del formulario), `DeleteDialog` (con el impacto), `SaveState`, `DraftNotice` y `ErrorSummary`. Cada área declara su `model.ts` (`models/types.ts`: ruta del API, forma del formulario igual a la del payload, secciones, filtros, checklist) y `useEditor` hace el resto: carga, guardado con `Ctrl/⌘S`, borrador en `sessionStorage` (`adm-draft:<modelo>:<id|nueva>`), guarda de salida y errores por campo.

---

## 6. Teclado

| Tecla | Hace |
|---|---|
| `Ctrl/⌘K` | Abre la paleta: un combobox que indexa secciones, acciones y registros (vacantes incluidas) y busca sin acentos |
| `Ctrl/⌘S` | Guarda, también desde adentro de un campo |
| `Esc` | Cierra la capa de arriba (paleta, diálogo, menú) |
| `↑` `↓` o `j` `k`, `Enter` | Recorren y abren las filas de una lista |
| `/` | Busca en la lista (si la vista no tiene búsqueda, abre la paleta) |
| `N` | Registro nuevo en las listas que lo permiten |

No se usan `Ctrl+N` ni `Ctrl+D` (los toma el navegador). Las teclas de un carácter se apagan desde la paleta y la preferencia queda en `localStorage` (`adm-single-keys`). El primer `Tab` es «Saltar al editor», y después de cada navegación el foco va al `h1` de la vista y cambia `document.title` («Registro · Sección · Admin»).

---

## 7. Matriz de datos

Qué se edita de cada modelo, dónde y por qué endpoint. El descriptor de cada campo (rótulo, ayuda, tope, si tiene inglés, dónde se lee) está en `server/src/shared/adminSchema.ts` y llega entero en `GET /meta`.

| Modelo | Se edita | Inglés | Pantalla | Endpoint |
|---|---|---|---|---|
| Project | título, dirección, año, rol, situación, destacada, resumen, pedido, resultado, sitio, repositorio, orden, publicación, empresa, tecnologías, enlaces, pasos, métricas | título, rol, resumen, pedido, resultado | Obras | `PUT /projects/:id`, `PATCH /projects/:id/slug`, `PATCH /projects/:id` (orden) |
| Metric | clave del catálogo o propia, valor con unidad o lista, rótulo, fuente, fecha de medición, orden | rótulo (MetricTranslation) | Obras → Datos | anidada en el PUT, sincronizada por id |
| ProcessStep · Link | título, texto, imagen del paso · rótulo y dirección (completa `https://`) | título y texto · rótulo | Obras → Relato y Datos | anidados en el PUT, sincronizados por id |
| Media | archivo, versión WebM, póster, rol, alt, pie, tinte, viewport, orden | alt y pie | Obras → Imágenes | `/media`, `/media/:id/file`, `/webm`, `/poster` |
| Experience | dirección, tipo, cargo, fechas, resumen, relato, viñetas, lugar, orden del CV, empresa, tecnologías, obras | cargo, resumen, relato, viñetas (alineadas por posición), lugar | Trayectoria | `PUT /experience/:id`, `PATCH /experience/:id/slug`, `PATCH /experience/order` |
| Tech · Org | nombre, dirección, categoría, desde, nota, color · nombre, dirección, sitio, ciudad | nota · nada | Catálogos | `/techs`, `/orgs`, con impacto y reasignación al borrar |
| Article | título, dirección, resumen, texto, minutos de lectura, estado, destacado, canónica, orden, publicación, tecnologías, obra | título, resumen, texto | Artículos | `/articles`, `PATCH /articles/:id/slug`; nace en borrador |
| Doc `about` · `contact` | bloques fijos del esquema más bloques libres; el retrato es una imagen sin inglés; `cv` es una ruta por idioma; email y direcciones sin inglés | solo los bloques de texto y lista | Perfil | `GET/PUT /docs/:key`, `POST /docs/about/portrait` |
| PDF del CV | derivado, no se edita | ES y EN | Inicio avisa | `pnpm cv:pdf` (§10) |

`Doc.title` y `Project.legacyMetrics` no se editan. Las direcciones (slugs) son fijas: un PUT con otra da 400 en `slug`; se cambian solo con «Cambiar dirección», que avisa que los enlaces viejos dejan de andar. No hay tabla de alias.

---

## 8. Contrato con Eros

Eros es el agente de Job Hunter y de contenido. Corre aparte, en la red interna de Coolify (`HUNTER_API_URL=http://eros:8000`, con `EROS_API_KEY`), y el admin le habla solo a través de `/api/admin/hunter`, `/content` y `/radar` (`server/src/admin/proxy.ts`). Los tipos del cable están en `server/src/shared/hunterContracts.ts` y `contentContracts.ts`; lo que Eros manda se normaliza en `erosContract.ts` y `erosContentContract.ts`.

**Estado.** `GET /status` informa `eros.state`: `ok`, `cooldown` (el corte abierto después de tres errores de red o tiempos agotados seguidos, con `retryInSec`), `down`, `auth` (Eros responde pero rechaza la clave) o `unconfigured` (falta `HUNTER_API_URL`). Solo cuenta lo que dice que Eros no está: un 5xx, una redirección o un 4xx son respuestas y ponen el corte en cero. El reintento a `127.0.0.1:8000` existe solo con `HUNTER_LOCAL_FALLBACK=1` fuera de producción.

**Ids y redirecciones.** Todo id que el admin reenvía a Eros (vacante, publicación, tendencia, carrusel, CV) pasa por `erosIdParam` (`router.param('id', …)` en cada router de Eros): fuera de `^[A-Za-z0-9_-]+$` responde 400 `invalid` y no sale nada (un `%2F` llegaba a `DELETE /api/jobs`, que borra la cola entera). `proxy.ts` pide con `redirect: 'manual'`: un 3xx de Eros no se sigue, así la clave nunca viaja a otra dirección, y se informa como error de Eros.

**Sin Eros, honesto.** Las lecturas responden 503 `{ code: 'offline', offline: true, retryInSec }` (504 si se agotó el tiempo) y el admin dice «Eros no responde»; las escrituras fallan diciendo qué no pasó («El estado no cambió.»). Un 5xx o una redirección de Eros llega como 502 `eros_error` («Eros respondió con un error (500).»), que no es una caída: la cola no pasa a solo lectura. Un 401/403 de Eros llega como 502 `eros_auth`. Un 400/422 de Eros llega como 400 `invalid` con su `detail` saneado (sin direcciones, etiquetas ni saltos, hasta 200 caracteres) después de «Eros no aceptó el pedido. Eros dijo: «…».». Analizar, el mensaje, la vista previa del correo y el CV reciben la vacante entera en el cuerpo (`{ job }`) y caen al respaldo local (`_source: 'fallback'`, cabecera `X-Eros-Source`). Los tiempos: el servidor espera a Eros 60 s y el cliente 90 s; escanear y evaluar en lote son tareas largas (abajo).

**Vacantes pegadas.** «Pegar una vacante» crea un id `manual-<hash>` que nunca va a Eros: estado, eliminar, correo de contacto y envío responden 400 para esos ids, y todo el invariante 6 (analizar, adaptar, previsualizar, imprimir, copiar) anda con Eros arriba o caído. Las pegadas viven en `sessionStorage` (`adm-hunter-manual`); la última cola buena de Eros en `adm-hunter-queue`, nunca filas de muestra ni de respaldo.

**Escaneo y evaluación en lote.** «Buscar vacantes nuevas» (`POST /hunter/scan`) recorre los portales y vectoriza solo al terminar (`vectorized` en la respuesta). Eros los hace sincrónicos y pueden tardar minutos: el servidor espera 180 s (195 s con la vectorización) y el cliente 210 s. Su corte no cuenta como caída: responde 504 `eros_busy` y la UI dice que Eros puede estar terminando y que se recargue la cola en un momento, en lugar de «No se buscaron vacantes nuevas». Corren de a uno: la UI apaga el botón mientras hay una en curso (también después de salir de Vacantes y volver) y el servidor responde 409 a un segundo pedido. «Buscar por afinidad» es un interruptor de la búsqueda de la cola (`POST /hunter/search/semantic`).

**Postular sin «Enviar desde Eros».** Está apagado con un solo interruptor, `EROS_SEND_ENABLED` en `server/src/shared/hunterContracts.ts`: Eros adjunta su propio CV (escrito a mano en Eros y, sin Gemini, con un resumen que es el texto del análisis), no el armado desde la base, y daba por verificados correos adivinados. La etapa Postular queda con «Abrir en Gmail» (adjuntando el PDF de la etapa CV) y «Ya la envié»; `POST /hunter/jobs/:id/apply-email` responde 409 `send_disabled` sin preguntarle a Eros. Se vuelve a encender cuando Eros adjunte el CV que le manda el admin y no otro.

**De dónde sale el correo.** «Buscar correo» lee lo que Eros responde de verdad, `{ contact_email, source, found }`, y lo lleva a `FoundEmail { email, found, origin, source }`: `origin` es `posting` (del aviso, `description`), `company_site` (Hunter.io), `guessed` (`domain_guessing` o `mx_inference`: `jobs@<dominio>`) o `unknown`. La vista previa trae `email_origin` desde `is_email_extracted`. La UI lo dice debajo del destinatario en español (del aviso, de la web de la empresa, adivinado, sin verificar); uno adivinado o sin origen lleva la marca «Adivinado» o «Sin verificar» y ninguno se presenta como verificado. `contact_email_verified` de Eros no se lee: Eros lo calcula como lo contrario de `is_email_extracted`.

**Estimaciones sin Gemini.** Cuando Eros no puede usar el modelo puntúa por palabras clave y lo marca con `scored_by: 'heuristic'` (en la vacante y en el análisis). El contrato lo lleva como `estimated` y la UI lo rotula «estimado» en la cola y «Estimación sin Gemini…» en el análisis, nunca como «Generado por Eros». El mensaje y las publicaciones de Eros no traen esa marca: no se pueden distinguir.

**Asunto del mensaje.** Eros manda el asunto en `subject_or_hook`; `subject` queda como respaldo.

**Una sola fuente del CV.** El servidor arma el CV siempre desde la base (`tailorCv(loadCv(lang))`, `hunterCv.ts`) y de Eros toma solo pistas, extraídas campo por campo en `erosHints.ts`:
- categorías: las claves de `skills` pasan a TechCategory por su rótulo, en los dos idiomas, respetando el orden; las desconocidas se descartan;
- tecnologías: se emparejan con `Tech.name` normalizado (minúsculas, sin acentos ni puntuación); las que no están en la base se descartan;
- entradas: se emparejan con las obras y experiencias visibles del CV base por título normalizado o por slug; dan el orden y nunca suman entradas;
- viñetas: por texto exacto normalizado contra los `highlights` de la entrada; una que no existe se descarta;
- resumen: es `summaryProposal`. Entra al CV solo si `_adaptation.proposal` es `ok` y se acepta con un clic («Usar este resumen»); por defecto queda el de la base;
- el resto (nombre, contacto, educación, idiomas, metodología) sale siempre de la base.

La respuesta trae `_adaptation { categories, entries, bullets, discarded, proposal }`.

**Caché y 409.** El CV adaptado queda en memoria por vacante una hora (`hunterCvCache.ts`). De ahí salen `/cv/:id/html` (la hoja, con `?measure=1` para medirla en un iframe `sandbox="allow-scripts"` que responde `postMessage({ type: 'cv-measure', heightMm, pages })`) y `/cv/:id/txt`. Si no está en caché (reinicio o más de una hora) responden 409 `cv_expired` y el cliente vuelve a hacer `POST /cv/:id` con la misma vacante y repite una vez. Las hojas que se abren en otra pestaña o en un iframe usan un ticket HMAC de una hora (`auth.ts`, alcances `cv`, `cv-base` y `carousel`), nunca la clave. El CV se imprime o se guarda como PDF desde esa hoja; Eros ya no arma PDF.

**Publicaciones y tendencias.** Los enfoques son los valores de `ContentPillar` de Eros (`architecture`, `production_lessons`, `performance_optimization`, `ai_agent_ops`, `fullstack_engineering`) con su rótulo en `contentContracts.ts`; sin elegir, Eros usa arquitectura. A `POST /api/content/generate` le llega `{ topic, pillar?, project_slug?, custom_instructions? }` (un `pillar: null` no se manda; los puntos clave y el ángulo van en `custom_instructions`). A `POST /api/radar/trends/:id/generate` le llega `{ pillar, project_slug?, custom_angle? }` con el enfoque siempre (sin él Eros cae en un valor que no existe) y los puntos dentro de `custom_angle`. Dev.to se lee del objeto anidado `devto: { title, tags, markdown_body }`, y «Publicar en el blog» usa ese Markdown. Al publicar se lee el `status` de Eros: `published` («Eros la dio por publicada») o `approved_local` (Eros no tiene n8n: la aprobó y no salió a ninguna red); cualquier otra cosa es un error. Eros no respeta el canal elegido, así que la UI lo avisa y nunca dice por qué red salió.

**Muestra para pruebas.** `EROS_DEMO=1` (y nunca con `NODE_ENV=production`) sirve una cola y publicaciones ficticias (ids `demo-*`, empresas Ejemplo/Example, `X-Eros-Source: demo`) para pruebas y capturas. En Publicaciones y Tendencias las escrituras sobre ids `demo-*` responden 400 y no se guardan. En Vacantes solo se frenan los ids `manual-*`: cambiar la etapa o borrar una vacante `demo-*` va a Eros y, sin Eros, falla como sin conexión. Las pruebas que necesitan un Eros que responda usan el simulado de `tests/admin/eros-mock.ts`; el Eros real nunca se contacta desde una prueba.

---

## 9. Inventario de endpoints

Todas las rutas van debajo de `/api/admin`, detrás del Bearer `ADMIN_TOKEN` (las tres hojas con ticket también aceptan `?ticket=`). Los errores tienen la forma `{ error, code, errors: [{ path, message }] }` (§11). La columna de la derecha dice dónde las llama la UI, con rutas dentro de `server/admin/src`.

`scripts/check-admin-endpoints.mjs` (lo corre `pnpm lint`) compara esta tabla con las rutas montadas en `server/src/admin/router.ts` y con las llamadas de la UI: falla si una ruta montada no está acá, si una de acá no está montada, si una retirada sigue montada o si una montada no tiene uso en la UI ni figura en «Sin uso en la UI». `node scripts/check-admin-endpoints.mjs --list` imprime lo que encontró.

### Estado, resumen y pendientes

| Método | Ruta | Qué hace | Dónde está en la UI |
|---|---|---|---|
| GET | `/status` | Base y Eros (`AdminStatus`); también comprueba la clave al ingresar | `stores/status.ts`, `stores/session.ts` |
| GET | `/meta` | Resumen con cifras reales, opciones de los enums, `adminSchema`, catálogo de claves de métrica e inglés faltante | `stores/meta.ts` |
| GET | `/pending` | La bandeja de Inicio (`PendingItem[]`), con la ruta al campo exacto | `features/home/usePending.ts` |

### Contenido

| Método | Ruta | Qué hace | Dónde está en la UI |
|---|---|---|---|
| GET | `/projects` | Lista de obras | `features/projects/model.ts`, `composables/useEditor.ts` |
| GET | `/projects/:id` | Una obra con métricas, media, pasos y enlaces | `composables/useEditor.ts`, `features/projects/media/useMediaSave.ts` |
| POST | `/projects` | Obra nueva (dirección derivada del título, última en el orden) | `composables/useEditor.ts` |
| PUT | `/projects/:id` | Guarda la obra entera | `composables/useEditor.ts` |
| PATCH | `/projects/:id` | Cambia solo el orden en el sitio | `features/projects/ProjectOrder.vue` |
| PATCH | `/projects/:id/slug` | «Cambiar dirección» | `features/projects/model.ts`, `features/collections/SlugDialog.vue` |
| DELETE | `/projects/:id` | Elimina la obra y sus archivos sin uso | `features/collections/DeleteDialog.vue` |
| POST | `/media` | Sube una imagen o video (multipart) | `features/projects/media/mediaRun.ts` |
| POST | `/media/:id/file` | Reemplaza el archivo conservando id, inglés y pasos | `features/projects/media/mediaRun.ts` |
| POST | `/media/:id/webm` | Suma o cambia la versión WebM de un MP4 | `features/projects/media/mediaRun.ts` |
| POST | `/media/:id/poster` | Suma o cambia el póster de un video | `features/projects/media/mediaRun.ts` |
| PATCH | `/media/:id` | Rol, alt, pie, tinte, viewport, orden e inglés | `features/projects/media/mediaRun.ts` |
| DELETE | `/media/:id` | Quita una imagen | `features/projects/media/mediaRun.ts` |
| GET | `/experience` | Lista de la trayectoria (no hay detalle: el registro sale de la lista) | `features/experience/model.ts`, `features/experience/cvOrder.ts`, `features/projects/Relations.vue` |
| POST | `/experience` | Entrada nueva | `composables/useEditor.ts` |
| PUT | `/experience/:id` | Guarda la entrada | `composables/useEditor.ts` |
| PATCH | `/experience/order` | Orden del CV (1..n; lo que no se lista sale del CV) | `features/experience/cvOrder.ts` |
| PATCH | `/experience/:id/slug` | «Cambiar dirección» | `features/experience/model.ts` |
| DELETE | `/experience/:id` | Elimina la entrada | `features/collections/DeleteDialog.vue` |
| GET | `/techs` | Lista de tecnologías | `features/stack/model.ts` |
| POST | `/techs` | Tecnología nueva (también desde el formulario de una obra) | `features/orgs/CatalogCreate.vue`, `features/collections/inlineCreate.ts` |
| PUT | `/techs/:id` | Guarda la tecnología | `composables/useEditor.ts` |
| PATCH | `/techs/:id/slug` | «Cambiar dirección» | `features/stack/model.ts` |
| GET | `/techs/:id/impact` | Dónde se usa, antes de borrar | `features/orgs/CatalogUsage.vue`, `features/collections/DeleteDialog.vue` |
| DELETE | `/techs/:id` | Elimina, con `?reassignTo=` para pasar sus usos a otra | `features/collections/DeleteDialog.vue` |
| GET | `/orgs` | Lista de empresas | `features/orgs/model.ts` |
| GET | `/orgs/:id` | Una empresa | `composables/useEditor.ts` |
| POST | `/orgs` | Empresa nueva (también desde un formulario) | `features/orgs/CatalogCreate.vue`, `features/collections/inlineCreate.ts` |
| PUT | `/orgs/:id` | Guarda la empresa | `composables/useEditor.ts` |
| PATCH | `/orgs/:id/slug` | «Cambiar dirección» | `features/orgs/model.ts` |
| GET | `/orgs/:id/impact` | Dónde se usa, antes de borrar | `features/orgs/CatalogUsage.vue`, `features/collections/DeleteDialog.vue` |
| DELETE | `/orgs/:id` | Elimina, con `?reassignTo=` | `features/collections/DeleteDialog.vue` |
| GET | `/articles` | Lista de artículos | `features/articles/model.ts`, `features/projects/Relations.vue` |
| GET | `/articles/:id` | Un artículo con su inglés | `composables/useEditor.ts` |
| POST | `/articles` | Artículo nuevo, siempre en borrador | `composables/useEditor.ts` |
| PUT | `/articles/:id` | Guarda el artículo | `composables/useEditor.ts` |
| PATCH | `/articles/:id/slug` | «Cambiar dirección» | `features/articles/model.ts` |
| DELETE | `/articles/:id` | Elimina el artículo | `features/collections/DeleteDialog.vue` |
| GET | `/docs/:key` | `about` o `contact` como `AdminDoc` (bloques, esquema, faltantes) | `features/profile/useDocEditor.ts` |
| PUT | `/docs/:key` | Guarda el documento; errores por bloque (`fields.<nombre>`) | `features/profile/useDocEditor.ts` |
| POST | `/docs/about/portrait` | Sube el retrato (PNG, JPG o WebP hasta 10 MB) | `features/profile/PortraitField.vue` |

### Vacantes (Job Hunter)

| Método | Ruta | Qué hace | Dónde está en la UI |
|---|---|---|---|
| GET | `/hunter/jobs` | La cola de Eros | `features/hunter/adapter.ts`, `shell/paletteSources.ts` |
| GET | `/hunter/stats` | Resumen de la cola | `features/hunter/adapter.ts` |
| POST | `/hunter/scan` | «Buscar vacantes nuevas», con la vectorización al final | `features/hunter/adapter.ts` |
| POST | `/hunter/vectorize` | Prepara para la búsqueda por afinidad lo que quedó sin vectorizar | `features/hunter/adapter.ts` |
| POST | `/hunter/evaluate` | «Evaluar las pendientes» (lote) | `features/hunter/adapter.ts` |
| POST | `/hunter/purge` | «Limpiar la cola», con confirmación | `features/hunter/adapter.ts` |
| POST | `/hunter/search/semantic` | «Buscar por afinidad» | `features/hunter/adapter.ts` |
| POST | `/hunter/jobs/:id/evaluate` | Etapa Análisis | `features/hunter/adapter.ts` |
| POST | `/hunter/jobs/:id/pitch` | Etapa Mensaje | `features/hunter/adapter.ts` |
| PATCH | `/hunter/jobs/:id/status` | Estado de la vacante y «Ya la envié» | `features/hunter/adapter.ts` |
| DELETE | `/hunter/jobs/:id` | Elimina una vacante | `features/hunter/adapter.ts` |
| POST | `/hunter/jobs/:id/apply-preview` | Etapa Postular: vista previa del correo | `features/hunter/adapter.ts` |
| POST | `/hunter/jobs/:id/find-email` | «Buscar correo», con de dónde salió (`FoundEmail.origin`) | `features/hunter/adapter.ts` |
| PATCH | `/hunter/jobs/:id/contact-email` | El destinatario | `features/hunter/adapter.ts` |
| POST | `/hunter/jobs/:id/apply-email` | «Enviar desde Eros»: apagado, responde 409 `send_disabled` mientras `EROS_SEND_ENABLED` sea false (§8) | `features/hunter/adapter.ts` |
| POST | `/hunter/cv/:id` | Adapta el CV a la vacante (`TailoredCv`) | `features/hunter/cvClient.ts` |
| POST | `/hunter/cv/:id/ticket` | Ticket de la hoja | `features/hunter/cvClient.ts` |
| GET | `/hunter/cv/:id/html` | La hoja A4 (medir, ampliar, imprimir) | `features/hunter/cvClient.ts` |
| GET | `/hunter/cv/:id/txt` | El CV en texto plano para formularios ATS | `features/hunter/cvClient.ts` |
| POST | `/hunter/cv-base/ticket` | Ticket de la hoja del CV base | `features/experience/CvSheet.vue`, `features/experience/CvView.vue` |
| GET | `/hunter/cv-base/html` | La hoja del CV base de Trayectoria (`?lang=`, `?measure=1`) | `features/experience/CvSheet.vue`, `features/experience/CvView.vue` |

### Publicaciones y Tendencias

| Método | Ruta | Qué hace | Dónde está en la UI |
|---|---|---|---|
| GET | `/content/posts` | Publicaciones de Eros | `features/content/api.ts` |
| GET | `/content/posts/:id` | Una publicación | `features/content/api.ts` |
| POST | `/content/generate` | «Generar una publicación» | `features/content/api.ts` |
| PATCH | `/content/posts/:id/status` | Aprobar, descartar, volver a borrador | `features/content/api.ts` |
| DELETE | `/content/posts/:id` | Elimina en Eros | `features/content/api.ts` |
| POST | `/content/posts/:id/publish` | «Publicar por n8n», con confirmación; dice si Eros la publicó o solo la aprobó (`status`) | `features/content/api.ts` |
| POST | `/content/posts/:id/publish-to-blog` | Crea un artículo en borrador y lleva a su editor | `features/content/api.ts` |
| POST | `/content/carousel/:id/ticket` | Ticket del carrusel | `features/content/api.ts` |
| GET | `/content/carousel/:id/html` | El carrusel para ver o imprimir | `features/content/api.ts` |
| GET | `/radar/trends` | Tendencias detectadas | `features/radar/api.ts` |
| GET | `/radar/trends/:id` | Una tendencia | `features/radar/api.ts` |
| POST | `/radar/scan` | Buscar tendencias nuevas | `features/radar/api.ts` |
| PATCH | `/radar/trends/:id/status` | Estado de la tendencia | `features/radar/api.ts` |
| POST | `/radar/trends/:id/generate` | Crea una publicación desde la tendencia | `features/radar/api.ts` |

### Sin uso en la UI

Montadas a propósito aunque la UI no las llama. Cada una dice por qué sigue.

Hoy no hay ninguna. Una ruta que se monte sin uso va en una tabla como esta, con el motivo:

| Método | Ruta | Por qué sigue |
|---|---|---|

### Retirados

Ya no existen. Si alguno vuelve a montarse, el chequeo falla.

| Método | Ruta | Por qué se retiró |
|---|---|---|
| GET | `/media` | La lista de media (`?projectId=`): solo la leía el panel anterior; la obra trae su media en `GET /projects/:id` |
| GET | `/hunter/jobs/:id/apply-preview` | La vista previa sin la vacante en el cuerpo: la UI usa el POST, que también anda sin Eros |
| DELETE | `/hunter/jobs` | «Borrar todas las vacantes»: Mateo decidió retirarlo (pregunta 3); «Limpiar la cola» cubre lo útil |
| GET | `/hunter/cv/:id/pdf` | El PDF que armaba Eros: el CV se imprime o se guarda como PDF desde la hoja armada con la base |
| GET | `/hunter/jobs/:id/cv/pdf` | Alias del anterior |
| POST | `/hunter/jobs/:id/cv` | Alias de `POST /hunter/cv/:id` |
| POST | `/hunter/jobs/:id/cv/ticket` | Alias de `POST /hunter/cv/:id/ticket` |
| GET | `/hunter/jobs/:id/cv/html` | Alias de `GET /hunter/cv/:id/html` |
| DELETE | `/hunter/:id` | Alias de `DELETE /hunter/jobs/:id` |
| PATCH | `/hunter/status/:id` | Alias de `PATCH /hunter/jobs/:id/status` |
| POST | `/hunter/evaluate/:id` | Alias de `POST /hunter/jobs/:id/evaluate` |
| POST | `/hunter/pitch/:id` | Alias de `POST /hunter/jobs/:id/pitch` |
| POST | `/hunter/semantic-search` | Alias de `POST /hunter/search/semantic` |
| GET | `/hunter/apply-preview/:id` | Alias de la vista previa |
| POST | `/hunter/find-email/:id` | Alias de `POST /hunter/jobs/:id/find-email` |
| POST | `/hunter/apply-email/:id` | Alias de `POST /hunter/jobs/:id/apply-email` |
| PATCH | `/hunter/contact-email/:id` | Alias de `PATCH /hunter/jobs/:id/contact-email` |
| GET | `/docs` | La lista de documentos: solo la leía el panel anterior |
| DELETE | `/docs/:key` | Borrar `about` o `contact` dejaba al sitio sin bloques que el código lee por nombre |

Fuera de la API también se retiraron `/admin-next` (la convivencia durante el rediseño), los archivos estáticos del panel anterior (`server/admin/index.html`, `js/`, `vendor/`, `admin.css`) y el botón «dev-token» del ingreso.

---

## 10. El PDF del CV del sitio

Los PDF de `public/cv/` (`CV-ES-Mateo-Sonzogni-ATS.pdf` y `CV-EN-…`) son un artefacto derivado de la base y se regeneran a mano (pregunta 6):

1. Con la base y la API arriba, compilar y servir el sitio: `pnpm build && pnpm start`.
2. `pnpm cv:pdf` (o `CV_BASE_URL=http://localhost:<puerto> node scripts/cv-pdf.mjs`). Abre `/about?cv=ats` en cada idioma, mide la hoja con la cota dual (una página A4, alto entre 248 y 265 mm, escala ATS) y solo si los dos idiomas pasan escribe los PDF en la ruta que publica `contact.cv`. Se niega si `/api/cv` no viene de la base o si el CV cambia durante el render.
3. Junto a los PDF escribe `server/src/snapshot/cv-stamp.json`: la fecha y el sha256 del JSON estable de `/api/cv?lang=es` y `?lang=en`.
4. Commitear los dos PDF y el sello juntos.

El Inicio del admin compone el mismo CV desde la base (`server/src/admin/cvStamp.ts`) y muestra «El PDF del CV no coincide con la base» cuando el hash difiere. El hash cubre el CvDocument entero, incluidos los slugs: un «Cambiar dirección» en una experiencia también lo dispara.

---

## 11. Guardarraíles

**En `pnpm lint`.** `scripts/admin-checks.mjs` corre cada `scripts/check-admin-*.mjs` presente; un chequeo nuevo se suma creando el archivo:
- `check-admin-style.mjs`: hex sueltos, `text-[N…]`, paletas de Tailwind, « // » en plantillas, mayúsculas forzadas o espaciadas, `font-mono` fuera de `Mono` y `Kbd`, `transition-all`, `style` estático, `!important`, emojis y archivos de más de 300 líneas.
- `check-admin-contrast.mjs`: contraste AA de los tokens, tokens compartidos con el sitio y el hash de las fuentes.
- `check-admin-schema.mjs`: cada campo de `prisma/schema.prisma` tiene descriptor en `adminSchema` y cada valor de enum su rótulo en `labels.ts`.
- `check-admin-endpoints.mjs`: el inventario del §9 contra lo montado y lo usado.

eslint, para `server/admin/src/**`: máximo 300 líneas y prohibidos `confirm`, `alert` y `prompt` (las confirmaciones van por `requestConfirm`). `pnpm typecheck` corre `vue-tsc` sobre el admin.

**En el servidor.** CSP estricta para `/admin` y `/api/admin` (`server/src/admin/ui.ts`): script, style y font `'self'`, `script-src-attr 'none'`, sin `unsafe-eval` ni `unsafe-inline`; por eso no hay `style` estático en las plantillas (los `:style` dinámicos van por CSSOM). Errores como `AdminErrorBody` (`server/src/admin/errors.ts`): `invalid` con todos los campos juntos y rutas anidadas (`links[0].url`, `translations.en.title`), `unauthorized`, `not_found`, `conflict` (409 de una restricción única, en su campo), `in_use` (409 de una relación), `cv_expired` (409 del CV adaptado que ya no está en caché), `too_large`, `offline`, `db_unavailable` (503), `eros_auth` e `internal`. La excepción es `requireAdmin` (`auth.ts`): responde 401 `{ error: 'unauthorized' }` y 503 `{ error: 'admin deshabilitado: …' }` sin `code` ni `errors`. `eros_unreachable` no lo manda el servidor: lo arma el cliente (`server/admin/src/api/errors.ts`) ante un 502 o 504 de una ruta de Eros. Cada escritura de contenido pasa por `forgetsLastGood`, que olvida los respaldos de la API pública.

**En las pruebas.** Toda prueba del admin corre con `node scripts/admin-run.mjs [--demo] [--eros-mock] [--web] -- <comando>`: copia la base a `portfolio_admin_*`, la migra, levanta la API en un puerto libre entre 3940 y 3990 con una clave al azar y Eros apagado (`HUNTER_API_URL=http://127.0.0.1:9`), y limpia todo al terminar. Cada spec declara sus modos en una línea `admin-run:` de su cabecera y `pnpm test:e2e` (`tests/e2e/run.mjs`) la corre una vez por línea. Nunca se escribe sobre la base de trabajo ni se contacta al Eros real.

---

## 12. Checklist de aceptación

Antes de dar por terminado un cambio en el admin:

- [ ] `pnpm typecheck`, `pnpm lint` (con los cuatro chequeos del admin) y `pnpm build:admin` en 0.
- [ ] Las specs del área con `admin-run` en sus modos (`pnpm test:e2e admin-<área>` o el comando de su cabecera), y `admin-audit` si se tocó Vacantes o el CV.
- [ ] Sin emojis, iconos solo utilitarios, ningún valor de enum visible y ningún texto fuera de los diccionarios.
- [ ] Cada vista con su carga, vacío, error y respaldo; el foco en el `h1` al entrar y el teclado del §6 andando.
- [ ] axe sin violaciones serias ni críticas, contraste AA y sin scroll horizontal entre 390 y 1920 px.
- [ ] `prefers-reduced-motion` respetado y ninguna violación de CSP en la consola.
- [ ] El invariante 6 intacto: analizar una vacante, adaptar el CV Harvard ATS, previsualizarlo, imprimirlo en A4 dentro de 248–265 mm y copiarlo en texto plano, con Eros arriba y caído.
- [ ] Si cambió un endpoint: el §9 actualizado (lo exige `check-admin-endpoints`). Si cambió un campo: el recorrido de `.claude/rules/backend.md` → «Sumar un campo».
- [ ] Revisado en el navegador local a 1440 y 390 px antes de cualquier push, que hace solo Mateo.

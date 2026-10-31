# Contenido visual para el rediseño

En la dirección "Movimiento", las imágenes son la mitad del sitio. Hoy cada obra tiene una sola portada, y Ynara Web y Eros no tienen ninguna. Esta es la lista de lo que hace falta producir, en orden de prioridad.

## Estado al 30-oct-2026

`node docs/rediseno/capturar.mjs` captura las tres obras públicas desde producción y deja todo en `docs/rediseno/capturas/` (fuera de git; se sube al sitio por el admin). El prototipo `movimiento.html` las usa solo con un índice (`manifest.js`).

| Obra | Capturado | Falta |
|---|---|---|
| La Rúcula (laruculagastrobar.es) | inicio, carta, una categoría, atardeceres · celular: carta e inicio · videos: intro y scroll | el panel de edición (requiere login) |
| ARG Piscinas (argpiscinas.es) | inicio, obras, una obra, blog · celular: inicio · videos: scroll y cambio de idioma ES → EN → DE | el panel de gestión (requiere login) |
| Barberpole (turnos.mateogs.tech) | inicio, portal público de reservas, modo claro · celular: inicio y portal · video: scroll | sacar un turno de punta a punta (crearía una reserva real) |
| Ynara | — | en desarrollo: grabarla cuando esté mostrable |
| Ynara Web | — | el video de la forma de luz |
| Eros | la consola `/admin` del portafolio: Job Hunter, Contenido omnicanal, TrendRadar, panel principal y paleta · video: recorrido por los tres módulos (`node docs/rediseno/capturar-admin.mjs`: API local sin base ni Eros reales, clave de prueba descartable, datos de ejemplo anonimizados) | el panel de `eros.mateogs.tech` con datos reales (hoy muestra 0 vacantes) |

Detalles que maneja el script, por si se cambia algo de esos sitios: la intro de La Rúcula dura ~9 s; ARG abre una promo a los ~7 s que traba el scroll (se entra con la marca de "ya cerrada") y una burbuja de chat que se oculta; el portal de Barberpole no se desplaza, así que va en capturas y no en video.

---

## Especificaciones comunes

**Capturas de escritorio**
- Formato 16:10, a **2880 × 1800** (el doble de 1440 × 900, para pantallas retina).
- Sin la barra del navegador ni pestañas: solo la página. En Chrome: DevTools → `Ctrl+Shift+P` → "Capture screenshot" con el viewport en 1440 × 900 y DPR 2.
- PNG para capturar; el sitio las sirve convertidas a WebP/AVIF.
- Sin cookies, avisos ni datos de prueba a la vista.

**Capturas de celular**
- Viewport de **390 × 844** con DPR 3 (1170 × 2532).
- Mismas reglas: solo la página.

**Videos**
- Loops cortos de **6 a 12 segundos**, sin audio, que empiecen y terminen en un estado parecido para que el loop no salte.
- **1920 × 1200** (16:10) a 30 fps, grabados a 1440 × 900 y DPR 2 si se puede.
- Exportar en **MP4 H.264** y **WebM VP9**, idealmente de menos de 4 MB cada uno.
- Movimiento de scroll lento y parejo (con Lenis activo o grabando con un scroll automático), sin el cursor saltando.
- Una imagen fija del primer cuadro como póster: es lo que se ve con movimiento reducido.

**Nombres**
`<slug>-<pieza>.<ext>`, por ejemplo `la-rucula-hero.png` o `la-rucula-scroll.mp4`.

---

## Por proyecto

Cada obra necesita como mínimo: **una portada**, **un video de scroll**, **dos o tres capturas de detalle** y **una captura de celular**. La portada actual sirve si cumple las especificaciones.

### La Rúcula Gastrobar
| Pieza | Qué mostrar |
|---|---|
| Portada | La home: el titular editorial sobre la foto de la costa (la actual sirve) |
| Video | Scroll por la home hasta entrar a la carta |
| Detalle 1 | La carta completa, con sus secciones |
| Detalle 2 | Un plato abierto (`/menu/:slug`) |
| Detalle 3 | El panel donde el dueño edita la carta |
| Celular | La llegada por QR: la carta abierta en el teléfono |

### ARG Piscinas
| Pieza | Qué mostrar |
|---|---|
| Portada | La home con la pileta (la actual sirve) |
| Video | El cambio de idioma ES → EN → DE sin perder la página, o un scroll por la home |
| Detalle 1 | El catálogo de obras terminadas |
| Detalle 2 | El blog o una entrada |
| Detalle 3 | El panel de gestión donde se carga una obra |
| Celular | La home o el formulario de presupuesto |

### Ynara (tesis)
| Pieza | Qué mostrar |
|---|---|
| Portada | La interfaz principal del asistente (la actual es de marca: conviene una del producto) |
| Video | Una conversación donde el asistente recuerda algo de antes (la memoria es el diferencial) |
| Detalle 1 | La vista de memoria (semántica, episódica, procedural) |
| Detalle 2 | Un diagrama de arquitectura: FastAPI, Next.js, Postgres con pgvector, modelos locales |
| Detalle 3 | La app de Expo, si está mostrable |
| Celular | La app móvil |

### Barberpole
| Pieza | Qué mostrar |
|---|---|
| Portada | La landing (la actual sirve) |
| Video | El flujo de sacar un turno, de punta a punta |
| Detalle 1 | La agenda del día |
| Detalle 2 | La caja o los reportes |
| Detalle 3 | La ficha de un cliente |
| Celular | El turno sacado desde el teléfono |

### Ynara Web
| Pieza | Qué mostrar |
|---|---|
| Portada | Un cuadro de la forma de luz en su mejor momento |
| Video | **Imprescindible:** el scroll con la forma mutando. Es una obra de movimiento y una captura fija no la representa |
| Detalle 1 | Dos o tres cuadros de distintos estados de la forma |
| Celular | Cómo se ve en el teléfono |

### Eros
| Pieza | Qué mostrar |
|---|---|
| Portada | El grafo del vault de Obsidian o la interfaz del agente |
| Video | El agente trabajando: una tarea de principio a fin, acelerada si hace falta |
| Detalle 1 | El grafo de conocimiento (850 nodos) |
| Detalle 2 | Una propuesta generada |

---

## Fuera de los proyectos

- **Retrato para Sobre mí:** una foto con luz natural, fondo neutro, en vertical (4:5) y en horizontal (16:10). Mejor sin mirar a cámara y con aire alrededor; la actual (`/media/profile/mateo-front.png`) es de documento.
- **Imagen para compartir (Open Graph):** 1200 × 630. La armo yo desde el sitio cuando esté el diseño final.

---

## Cómo cargarlo

Cada pieza entra por el admin como `Media` del proyecto, con su rol: `COVER` para la portada y `GALLERY` para el resto, en el orden en que aparecen. Los videos necesitan dos cambios en el modelo, que entran en la fase R1 del plan:

- `Media.kind = VIDEO`, que ya existe en el schema.
- Un campo `poster` para la imagen del primer cuadro.

Mientras tanto, se pueden dejar en una carpeta y los integro a la demo para probar cómo quedan antes de cargarlos.

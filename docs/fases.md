# Fases

Orden de trabajo y criterios de terminado. Marcar con `[x]` a medida que se cierran.

---

## Fase 0 — Schema ✅ cerrada el 5-sep-2026

- [x] Definir las colecciones reales — `prisma/schema.prisma`
- [x] Definir campos y tipos de cada una
- [x] Decidir a qué mundo pertenece cada campo — `app/lib/fieldMeta.ts`
- [x] Aprobar y migrar — migración `20260905174945_init`

**Terminado cuando:** `schema.prisma` está aprobado y migrado, y cada campo tiene asignado su mundo.

Criterio para las colecciones: **cada una debería ser la respuesta a una pregunta concreta que trae quien entra.**

---

## Fase 1 — Backend ✅ cerrada el 5-sep-2026

- [x] Modelos Prisma y migración
- [x] Los seis endpoints — `server/src/routes/`
- [x] Filtros como query params, con el mapeo uno a uno a la URL pública — `meta.filters` devuelve lo aplicado
- [x] Admin — propio, en `/admin` servido por el API, protegido con `ADMIN_TOKEN`
- [x] Seed con contenido real, no lorem — `server/src/seed.ts`, cronología tomada de GitHub. Falta afinar desde el admin: `Tech.since`, `Tech.note`, `metrics`

**Terminado cuando:** se puede cargar un proyecto de punta a punta desde el admin y verlo en los seis endpoints. ✅ Verificado el 5-sep-2026: proyecto con org, techs, media subida y pasos creado por el admin y leído en `/api/projects/:slug`.

---

## Fase 2 — Shell ✅ cerrada el 5-sep-2026

- [x] Routing `/datos/*` y `/diseno/*` — `app/pages/{datos,diseno}/[[...path]].vue`, un renderer por mundo en `app/worlds/`
- [x] Estado compartido: `path = [collection, slug, sub]` — `app/lib/path.ts`, leído siempre de la ruta (`useMundo`)
- [x] Truncado al cambiar de mundo — tabla `depth` por mundo y raíz; la query viaja intacta
- [x] Tokens de los dos mundos — `app/worlds/<mundo>/tokens.css`, prefijos `--d-` y `--n-`
- [x] Carga de fuentes con preload — `usePreloadFonts`, una lista por superficie
- [x] Umbral, salteable con link directo — `/` (y `/umbral`, que no redirige)
- [x] Persistencia del mundo elegido — cookie `mundo`, un año; `/` redirige en el servidor
- [x] Control de pasaje, sin animar todavía — `PasajeControl.vue`, dos links

**Terminado cuando:** se cambia de mundo conservando la posición, y un link directo saltea el umbral. ✅ Verificado el 5-sep-2026 con un recorrido en Chrome headless: `/datos/projects/la-rucula/techs?stack=vue` → `/diseno/projects/la-rucula?stack=vue` → `/datos/projects/la-rucula?stack=vue`, sin recarga.

Lo que dejó para la Fase 3: DATOS ya resuelve todos los niveles en una sola columna (`app/worlds/datos/levels.ts`), que es la forma mobile; faltan las columnas en perspectiva, el teclado y las facetas. `orgs` no tiene endpoint: `/datos/orgs/:slug` da 404 hasta que lo tenga.

---

## Fase 3 — DATOS completo ✅ cerrada el 5-sep-2026 (revisada el 6-sep)

- [x] Ventana de explorador de archivos — `app/worlds/datos/DatosWorld.vue`: barra con historial, subir, ruta como barra de dirección e "ir a"; contenido; barra de estado con el request real
- [x] Endpoint de `orgs` por relación — `GET /api/orgs/:slug` con proyectos y experiencias
- [x] Carpeta en vista de íconos — `DatosFolder.vue` + `DatosIcono.vue`: la base (carpeta por tabla, archivo por documento) y cada colección (un archivo por record con el dato dominante adentro)
- [x] Archivo abierto — `DatosDetail.vue`: campos con tipos, relaciones a la vista, vecinos anterior y siguiente
- [x] Cabecera única para los tres niveles — `DatosCabecera.vue`: ícono, nombre, línea de tipo, filtros activos o vecinos
- [x] Profundidad: docs y records son archivo; no hay sub-nivel (`depth` de DATOS es 2)
- [x] Teclado de carpeta — flechas en cuatro direcciones, Enter abre, Backspace/Esc suben con el foco en la baldosa de origen, `/` o Ctrl+K ir a; mover el foco no navega
- [x] Command palette — `DatosGoto.vue`: índice de schema, proyectos, experiencia y stack
- [x] Filtros como facetas — tocar un valor filtrable en el archivo agrega `?campo=valor`; chips con `×` en la cabecera de la carpeta
- [x] SSR — todo se resuelve en el servidor; el 404 sale con status 404
- [x] Mobile — la misma ventana con marco angosto, baldosas chicas, tres por fila

**Terminado cuando:** todo el contenido es alcanzable sin mouse y con JS apagado. ✅ Verificado el 5-sep-2026 (29 chequeos en Chrome headless) y de nuevo el 6-sep tras la revisión: recorrido completo por teclado y por clicks vía CDP sin errores de consola, diez rutas en SSR, capturas a 1440, 1024, 768 y 390px.

**Cómo llegó hasta acá.** La Fase 2 copiaba los prototipos y se rehízo como "hoja técnica" con columnas en perspectiva. El 5-sep, con capturas, se vio que la navegación directa se había perdido y la colección pasó a tabla. La misma noche Mateo pidió algo más mínimo y "como un explorador de archivos": salieron las columnas, después la tabla, después la lista, y quedó una ventana con carpetas en grilla de íconos, una sola cosa por pantalla. El 6-sep se unificó la cabecera de los tres niveles y los márgenes. Cada paso, con lo descartado y el porqué, está en `docs/decisiones.md`.

**Auditoría del 5-sep-2026** (`/piso-calidad`, `/revision-mundos`, guidelines de interfaz web, build de producción): CLS 0 · LCP 192 ms · JS 241 KB transferidos · CSS 24 KB · sin JS todo navegable por links · primer Tab cae en "saltar al contenido" · el foco sigue a la navegación por teclado · 320px sin desborde · reduced motion corta las animaciones. Las cifras son de antes de la revisión: volver a medir en la Fase 7 con datos reales de producción y exponerlas como contenido.

**El sitio puede salir acá.** DISEÑO es la parte cara y va segunda. Falta la Fase 7 antes de publicar.

---

## Fase 4 — DISEÑO: proyectos ✅ cerrada el 6-sep-2026

- [x] Tira de película como índice y como pie del visor — `app/worlds/diseno/sections/ProyectosTira.vue`: un fotograma retroiluminado por proyecto; sin portada, una placa oscura con la inicial
- [x] La obra se pinta mientras se cuenta — `SeccionProyectos.vue`: línea de tiempo GSAP con una parada por pedido, etapa y resultado; la portada pasa de apagada a pintada, el título entra fino y blando y toma cuerpo con la obra, cada bloque de texto se enciende cuando le toca
- [x] Construcción por capas desde `Media.layer` — cada capa aparece en su turno sobre la anterior. Implementado sin datos: ningún proyecto trae capas todavía; probar en cuanto uno las tenga
- [x] Scrubber — un `range` nativo con las paradas debajo; arrastrar pausa, tocar una parada salta
- [x] FLIP de fotograma a obra — el fotograma tocado vuela hasta convertirse en la placa, sin plugin
- [x] Degradación — sin portada, sin etapas, sin brief o sin resultado, la sección cuenta lo que hay; sin JS todo está en el estado final y el scrubber no aparece; `prefers-reduced-motion` arranca en el final y el scrubber sigue en manos del visitante
- [x] La portada viaja en la lista — `GET /api/projects` incluye la media `COVER` de cada proyecto

**Terminado cuando:** un proyecto sin capas, sin portada o sin etapas se muestra sin romperse, y todo se entiende con la animación apagada. ✅ Verificado el 6-sep por CDP: índice, vuelo, línea de tiempo completa, scrubber, salto por parada, cambio de proyecto desde la tira (con y sin portada), reduced motion; cero errores de consola; capturas a 1440 y 390.

**Dirección:** ver `docs/decisiones.md` → "Fase 4". Tres formas pesadas, elegida la tira de película con pintado por etapas. Lo que dejó para la Fase 5: el scrubber como instrumento a reusar en `experience`, la película retroiluminada como material, los ejes de Fraunces como variable.

---

## Fase 5 — DISEÑO: el resto

- [x] `experience` — exposición larga (6-sep-2026): bandas sobre el eje de los años, el scrubber mueve una fecha y enciende lo que corría entonces; abrir una etapa la deja encendida con su relato. `sections/SeccionExperiencia.vue`; el scrubber compartido pasa a `DisenoRango.vue`. Verificado por CDP: viaje, scrub, abrir y volver, reduced motion, móvil; sin errores de consola
- [ ] `stack`
- [ ] `about`
- [ ] `contact`

Usar `/nueva-seccion` para cada una. Tres propuestas mínimo por sección.

---

## Fase 6 — El pasaje

- [ ] Ancla FLIP sobre el nombre del record
- [ ] Cortina con el color del mundo destino
- [ ] Transición del fondo
- [ ] Ida y vuelta con animaciones distintas

---

## Fase 7 — Piso de calidad

Correr `/piso-calidad`. No cerrar con bloqueantes abiertos.

- [ ] Sin JS
- [ ] Solo teclado
- [ ] Lector de pantalla
- [ ] Reduced motion
- [ ] CLS en cero
- [ ] Responsive hasta 320px
- [ ] Degradación de contenido
- [ ] Métricas propias expuestas como contenido en DATOS

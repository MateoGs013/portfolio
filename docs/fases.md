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

## Fase 3 — DATOS completo ✅ cerrada el 5-sep-2026

- [x] Explorador de columnas en perspectiva CSS — `app/worlds/datos/DatosWorld.vue` + `DatosColumn.vue`; `explorer.ts` resuelve el path en columnas
- [x] Endpoint de `orgs` por relación — `GET /api/orgs/:slug` con proyectos y experiencias
- [x] Tabla por colección — `DatosTable.vue`: una fila por record, columnas declaradas en `fieldMeta[...].list`, tipo en el encabezado, valores filtrables como links
- [x] Hoja del record con campos y tipos — `DatosDetail.vue`; la raíz es la persona; las relaciones se leen en la hoja y cada item es un link
- [x] Profundidad: docs y records son hoja; no hay sub-nivel (`depth` de DATOS es 2)
- [x] Teclado completo — `↑↓` mover, `→`/Enter entrar, `←`/Esc volver, `/` o Ctrl+K ir a
- [x] Command palette — `DatosGoto.vue`: índice de schema, proyectos, experiencia y stack
- [x] Filtros como facetas — tocar un valor filtrable en la hoja agrega `?campo=valor`; chips con `×` en la columna
- [x] SSR — todo se resuelve en el servidor; el 404 sale con status 404
- [x] Mobile: una columna — bajo 900px, la última columna o la hoja

**Terminado cuando:** todo el contenido es alcanzable sin mouse y con JS apagado. ✅ Verificado el 5-sep-2026: 29 chequeos en Chrome headless (teclado, ir a, facetas, salto proyecto → org → experiencia, pasaje con sub y query) y todos los niveles renderizan en SSR como links.

**Dirección de arte:** hoja técnica (ver `docs/decisiones.md`). La Fase 2 se había construido copiando los prototipos y se rehízo.

**Revisión de UX (5-sep-2026):** con capturas del recorrido completo se vio que la navegación directa se había perdido (nombres truncados en columnas angostas, stack escondido detrás de un tercer nivel, metadata del schema en el panel grande). La colección pasó a ser una tabla, el record una hoja plana con las relaciones a la vista, y el sub-nivel desapareció. **Segunda revisión, la misma noche:** las columnas en perspectiva y la tabla abrumaban; DATOS pasó a ser un explorador de archivos en vista de íconos (`DatosFolder.vue` para la base y para cada colección, `DatosDetail.vue` para la hoja con vecinos), con la ruta como barra de dirección y teclado de foco itinerante. Detalle en `docs/decisiones.md`.

**Auditoría del 5-sep-2026** (`/piso-calidad`, `/revision-mundos`, guidelines de interfaz web, build de producción): CLS 0 · LCP 192 ms · JS 241 KB transferidos · CSS 24 KB · sin JS todo navegable por links · primer Tab cae en "saltar al contenido" · el foco sigue a la navegación por teclado · 320px sin desborde · reduced motion corta las animaciones. Pendiente para la Fase 7: medir con datos reales de producción y exponer esas cifras como contenido.

**El sitio puede salir acá.** DISEÑO es la parte cara y va segunda. Falta la Fase 7 antes de publicar.

---

## Fase 4 — DISEÑO: proyectos

- [ ] Visor con obra y tira de miniaturas
- [ ] Construcción por capas desde `Media.layer`
- [ ] Scrubber
- [ ] FLIP de miniatura a obra
- [ ] Degradación si el proyecto no viene descompuesto

---

## Fase 5 — DISEÑO: el resto

- [ ] `experience`
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

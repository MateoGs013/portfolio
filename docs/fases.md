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

## Fase 2 — Shell

- [ ] Routing `/datos/*` y `/diseno/*`
- [ ] Estado compartido: `path = [collection, slug, sub]`
- [ ] Truncado al cambiar de mundo
- [ ] Tokens de los dos mundos
- [ ] Carga de fuentes con preload
- [ ] Umbral, salteable con link directo
- [ ] Persistencia del mundo elegido
- [ ] Control de pasaje, sin animar todavía

**Terminado cuando:** se cambia de mundo conservando la posición, y un link directo saltea el umbral.

---

## Fase 3 — DATOS completo

- [ ] Explorador de columnas en perspectiva CSS
- [ ] Panel de detalle con campos y tipos
- [ ] Profundidad variable por rama
- [ ] Teclado completo
- [ ] Command palette
- [ ] Filtros como facetas
- [ ] SSR
- [ ] Mobile: una columna

**Terminado cuando:** todo el contenido es alcanzable sin mouse y con JS apagado.

**El sitio puede salir acá.** DISEÑO es la parte cara y va segunda.

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

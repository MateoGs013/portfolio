# Portafolio Dos Mundos

El mismo contenido renderizado en dos mundos opuestos, con un control persistente para pasar de uno al otro.

- **DATOS** — denso, frío, tipográfico, navegable entero con teclado. Presume de velocidad, precisión y accesibilidad.
- **DISEÑO** — cálido, animado, material. Presume de materialidad, tiempo y oficio.

Que la misma estructura de información pueda tener dos formas coherentes y opuestas **es la tesis del portafolio, no una función**.

## Invariantes

Si se violan, es otro proyecto. Si una tarea los contradice, parar y preguntar.

1. **Un solo modelo de contenido, dos renderers.** El contenido se escribe una vez. Cero duplicación.
2. **Cada mundo elige su subset de campos.** DATOS muestra hechos sobre el trabajo (metadata, tipos, relaciones, métricas). DISEÑO muestra el trabajo (imágenes, proceso, texto largo). Si los dos muestran los mismos campos, el proyecto falló. Es la falla más fácil de cometer: correr `/revision-mundos` antes de dar cualquier feature por terminada.
3. **La ruta es el estado y el estado es un request.** Nada de navegación que viva solo en memoria.
4. **La posición se conserva al cambiar de mundo.** No hace falta que las estructuras coincidan.
5. **Los mundos difieren en temperatura, densidad y ritmo, no solo en paleta.** Si el switch se siente como un reskin, no está hecho.
6. **DATOS renderiza todas las colecciones igual. DISEÑO le da a cada sección su propia forma.** Esa asimetría es la diferencia estructural entre los mundos.
7. **DATOS es el piso de accesibilidad del sitio.** No es un fallback degradado: es la mitad buena. Todo tiene que ser alcanzable desde ahí.
8. **`prefers-reduced-motion` corta toda animación y salta al estado final.** Nada puede depender del movimiento para entenderse.

## Stack

Nuxt 4 · TypeScript · CSS nativo con custom properties · GSAP 3 · Express + Prisma + PostgreSQL.
CSS 3D transforms en DATOS. WebGL permitido en DISEÑO si algo lo justifica.
Fuentes: Fraunces Variable, General Sans, Martian Mono.

## Comandos

```bash
cp .env.example .env  # una vez
pnpm db:up            # Postgres 17 en Docker (pnpm db:down para bajarlo)
pnpm dev              # front en :3000
pnpm dev:api          # API Express en :3001
pnpm typecheck        # antes de dar algo por terminado (Nuxt + server)
pnpm lint
pnpm prisma migrate dev
pnpm prisma studio
```

## Estructura

```
app/worlds/datos/     renderer DATOS
app/worlds/diseno/    renderer DISEÑO
app/lib/fieldMeta.ts  qué campos ve cada mundo, y con qué tipo
app/lib/path.ts       la ruta como estado: path, profundidad por mundo, truncado
app/nitro/            reservado; Nitro no sirve rutas (el API es Express)
server/src/           API Express (server/generated/ es el cliente Prisma, ignorado)
server/admin/         UI del admin propio, servida por el API en /admin
prisma/               schema y migraciones
docs/                 concepto, decisiones, fases, prototipos
```

## Dónde está el resto

Este archivo solo tiene lo que aplica siempre. Lo específico se carga solo cuando hace falta:

- `.claude/rules/datos.md` — se carga al tocar `app/worlds/datos/**`
- `.claude/rules/diseno.md` — se carga al tocar `app/worlds/diseno/**`
- `.claude/rules/backend.md` — se carga al tocar `server/**` o `prisma/**`
- `docs/concepto.md` — el porqué, en largo. Leerlo antes de proponer algo estructural.
- `docs/decisiones.md` — qué se probó y se descartó. **Leerlo antes de proponer una idea creativa**, para no repetir un camino ya cerrado.
- `docs/fases.md` — el orden de trabajo y los criterios de terminado.
- `docs/prototipos/` — validaron mecánicas, **no dirección de arte**. Tomar la estructura, decidir el resto de nuevo: reproducirlos ya se rechazó una vez.

## Skills

- `/revision-mundos` — chequea que los dos mundos no hayan convergido. Correr antes de dar una feature por terminada.
- `/nueva-seccion` — procedimiento para agregar una sección al mundo DISEÑO.
- `/piso-calidad` — auditoría de accesibilidad y performance antes de cerrar una fase.

## Estado

Fases 0 a 3 cerradas (5-sep-2026, DATOS revisado el 6-sep): schema, siete endpoints, admin en `/admin`, shell (ruta como estado, truncado, cookie, umbral) y DATOS completo (ventana de explorador de archivos: carpetas en grilla de íconos, archivo abierto con campos y vecinos, la misma cabecera en los tres niveles, teclado de carpeta, ir a, facetas). Sigue la Fase 4 (DISEÑO: proyectos), con `/nueva-seccion`. Cambiar el schema implica migración nueva y revisar `app/lib/fieldMeta.ts`.

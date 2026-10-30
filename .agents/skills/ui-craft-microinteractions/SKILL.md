---
name: ui-craft-microinteractions
description: Cómo implementar el movimiento del sitio público (dirección «movimiento») en Vue 3, Nuxt 4, GSAP y Lenis siguiendo el vocabulario de seis verbos de docs/diseno.md. Úsalo al crear o cambiar cualquier animación, transición, hover, view transition o micro-interacción en app/.
---

# Movimiento del sitio público

El vocabulario, los valores y la política viven en `docs/diseno.md` (§2 verbos, §4 anclas, §5 Hiperfoco, §6 política). Esta skill no repite esos números: explica cómo se implementan. Si algo de acá contradice a `docs/diseno.md`, gana `docs/diseno.md`.

## Antes de animar algo

1. **¿Qué verbo es?** Transformar, Deslizar, Rodar, Seguir, Asomar o Atenuar (solo hover en listas). Si no es ninguno, no se agrega.
2. **¿Es ambiente, transición o respuesta?** Ambiente depende de `allowAmbient` (se apaga con reduced motion y con Hiperfoco). Transiciones y respuestas dependen de `allowTransitions` y en Hiperfoco duran 200–250 ms.
3. **¿Se lee sin JS?** El SSR entrega el estado final; la animación es solo la lectura del cambio.
4. **¿Qué ancla usa?** El movimiento compartido se coordina con las anclas de `docs/diseno.md` §4 (`data-vt`, `data-travel*`, `data-motion`, `data-tint`, `data-hf`, `data-ornament`), no con nombres de componentes.

## Cómo se implementa

- **Todo pasa por `useMotion(scopeRef, setup)`:** un `gsap.context` con `gsap.matchMedia` (`motion`, `fine`, `desktop`); `setup` devuelve su limpieza. Se revierte al desmontar y en `record:before`, y se rearma en `record:after` y cuando cambia el Hiperfoco. Nada de `gsap.to` sueltos en `onMounted`.
- **Preferencias:** solo `useMotionPrefs` (`reduce`, `fine`, `hyperfocus`, `allowAmbient`, `allowTransitions`). Nunca un `matchMedia` propio en un componente.
- **Scroll:** Lenis lo crea el plugin de movimiento, sobre el ticker de GSAP, solo con `allowAmbient`. ScrollTrigger se refresca al terminar cada view transition. Los pin se limpian al desmontar (no quedan `.pin-spacer`).
- **View transitions:** nombres estáticos con `data-vt` en el destino y el par tocado con `data-travel` en el origen; el plugin de elementos compartidos los nombra y limpia. Un clon nunca lleva `view-transition-name`. Chequeo: al tocar un origen, antes de navegar, ningún nombre aparece dos veces en la página saliente (todo `[data-vt]` pasa a `none` antes de nombrar el par; `docs/diseno.md` §4, «Nombres únicos»).
- **Texto:** las líneas y letras se parten en el SSR o con SplitText (con máscara y aria automático); nunca con `innerHTML`.
- **Solo propiedades compuestas:** `transform`, `opacity`, `clip-path`, `filter` y variables CSS registradas con `@property`.
- **Cursor:** un solo `pointermove` pasivo compartido (`useCursor`), con lerp en el ticker solo mientras alguien lo usa. Vista previa, burbuja e imanes solo con puntero fino.

## Lo que no va

Spotlight radial, texto descifrado, destellos de click, bordes láser, física de resortes como regla general, píldoras de estado animadas, globo 3D, sonido en cada click. Ver «Sonido» en `docs/diseno.md` §6 y lo descartado en `docs/decisiones.md`.

## Verificación

`pnpm typecheck` y `pnpm lint` en 0. En el navegador local: con reduced motion todo llega quieto, con Hiperfoco no queda movimiento ambiental, al navegar no aparece el error de nombres de view transition duplicados y no quedan nodos huérfanos después de una transformación. Después, la skill `piso-calidad`.

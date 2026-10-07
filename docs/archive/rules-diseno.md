---
paths:
  - "app/worlds/diseno/**"
  - "app/components/diseno/**"
---

# Mundo DISEÑO

Una forma propia por sección. Película sobre luz: oscuro, cálido, con volumen.

**Acá no hay especificación, hay criterios.** Lo que ya se probó está en `docs/decisiones.md` como referencia, no como norma. Si aparece algo mejor, cambiarlo y anotar por qué.

## Los cinco criterios

Toda propuesta creativa —una sección, un tratamiento, una transición— se juzga con esto. Si las cinco dan bien, la idea sirve aunque no se parezca a nada de lo anterior.

1. **¿Diferencia los mundos o solo los decora?** Si el mismo tratamiento funcionaría igual de bien en el otro mundo, no está haciendo su trabajo.
2. **¿Le queda bien a *ese* contenido?** Un tratamiento que se puede trasplantar de `experience` a `stack` sin cambiar nada es genérico. La forma sale de lo que el dato es.
3. **¿Se entiende en veinte segundos sin instrucciones?** Un portafolio no tiene más crédito que ese. **Distinto no es lo mismo que difícil** — ya se perdió un prototipo entero por confundirlos.
4. **¿Es la primera respuesta o es una decisión?** Si un generador de plantillas produciría esto de entrada, buscar de nuevo.
5. **¿Aguanta la visita número cuarenta?** Lo que se repite en cada navegación tiene que ser barato y claro. Lo caro y espectacular se gasta donde pasa una sola vez.

El criterio 5 ya rindió tres veces: el viaje en Z quedó para el umbral, la construcción por capas para el destino y no para la operación, y la dirección de arte cara para el record y no para el índice.

## Cohesión

Los tratamientos pueden cambiar, pero tienen que compartir **instrumento, material y variable**. En lo construido: el **instrumento** es el scrubber (`DisenoRango.vue`, un `range` nativo; en `projects` mueve el relato y pinta la obra, en `experience` mueve una fecha y enciende las etapas, en `stack` mueve un año y llena la caja, en `about` mueve los ejes de la letra; `contact` no lo tiene porque los créditos pasan una vez), el **material** es la película retroiluminada sobre oscuro (fotogramas, bandas y nombres apagados que se encienden, la obra que se pinta, el cabezal ámbar, los créditos que suben), y la **variable** son los ejes de Fraunces (lo que entra o acompaña va fino y blando, `wght` 300–380 / `SOFT` 100; lo que llega o manda, 560–620 / 30–40; en `about` el recorrido entero es el contenido). Si los tratamientos cambian, que compartan algo equivalente — si no, son ideas sueltas pegadas con cinta.

Cada sección vive en `app/worlds/diseno/sections/` y `DisenoWorld.vue` (cabecera con marca y secciones) solo decide cuál responde a la ruta. GSAP se importa en el componente y solo corre en el cliente: el servidor renderiza el estado final, y con `prefers-reduced-motion` no hay viajes automáticos pero el scrubber sigue en manos del visitante. Cada sección se verifica por CDP con la consola escuchando: viaje, scrub, abrir y volver, reduced motion, móvil.

## Fraunces

Se usa con sus ejes reales (`opsz`, `wght`, `SOFT`, `WONK`) animados, no con pesos estáticos. Es la variable transversal del mundo.

## Degradación

`Media.layer` es opcional. Si un proyecto no viene descompuesto en capas, el mundo tiene que degradar bien y no romperse. Nunca asumir que el contenido está completo.

## Defaults a evitar

Barras de skill con porcentajes — la peor plantilla de portafolio que existe. Scratch-off que revela una foto debajo. Lienzo infinito con zoom, que ya es un género. Mecánicas que hay que descifrar antes de poder usarlas. Metáforas importadas de otras disciplinas por ser lindas: un diseñador dibuja, no mezcla audio.

No son prohibiciones: son respuestas perezosas que aparecen solas. Si una se viola a conciencia y queda mejor, hacerlo y anotarlo en `docs/decisiones.md`.

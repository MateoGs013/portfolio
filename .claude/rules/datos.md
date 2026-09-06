---
paths:
  - "app/worlds/datos/**"
  - "app/components/datos/**"
---

# Mundo DATOS

Un explorador de archivos, tinta sobre papel: claro, frío, plano. Una carpeta muestra solo sus items; recién al abrir uno aparece su contenido. Se vuelve por la ruta.

## Reglas

- **CSS 3D, nunca WebGL.** El texto tiene que seguir siendo DOM: seleccionable, buscable con Ctrl+F, leíble por lector de pantalla, indexable. Este mundo es el piso de accesibilidad del sitio; construirlo sobre canvas lo contradice.
- **Gana la claridad sobre el efecto.** Este mundo existe para argumentar precisión. La profundidad es solo el gesto de entrar o salir de una carpeta: el panel se acerca o se aleja ~56px en Z, casi imperceptible a propósito. El viaje espectacular se gasta una sola vez, en el umbral.
- **Un solo renderer para todas las colecciones.** Una base de datos trata a todos los records igual. No hacer tratamientos especiales por colección: eso es trabajo del otro mundo.
- **La señal primaria de estado es la inversión, no el color.** Item activo = bloque negro con texto papel. El azul (`--d-sig`) queda solo para relaciones y links.

## Dirección (Fase 3, ver `docs/decisiones.md`)

Hoja técnica, no Finder ni terminal. Identificadores en minúscula y sin espaciado, tal como están en el schema. Filas numeradas de 44px. **Una sola cosa por pantalla: una carpeta o una hoja.** La ruta del riel superior es la barra de dirección: cada segmento es una carpeta a la que se vuelve. **La raíz es la carpeta de la base** (`DatosFolder.vue`): solo las tablas y los documentos con su conteo; la persona está en `about` y `contact`. **Una colección es la carpeta de sus records** (el mismo `DatosFolder.vue`): una fila por record con el nombre y el dato dominante (año, período, `since`), más los filtros activos como chips con `×`. Nada más: el stack, el rol y los links se leen al abrir. **El record es una hoja plana** (`DatosDetail.vue`): nombre grande, línea `record · Model · updatedAt`, vecinos anterior y siguiente debajo, campos en orden de lectura con el tipo al lado, relaciones a la vista con un link por item; los valores filtrables son links que dejan la carpeta filtrada. No hay sub-nivel: `depth` es 2. El pie muestra el request real con sus milisegundos. Todo esto vive en `app/worlds/datos/` (`explorer.ts` resuelve, los componentes dibujan).

La prueba de cada pantalla es un recruiter apurado: tiene que entender dónde está sin leer nada, ver los nombres enteros, y poder correr su pregunta ("qué hizo con React") tocando un valor en la hoja o entrando a `stack`.

## Vocabulario como sistema de diseño

La estructura del dato es la decoración. No inventar ornamento.

Tipos declarados (`string`, `int`, `relation → Client`) · `NULL` a la vista, no escondido · `05 records` en lugar de un título decorativo · chevron `›` en lo que se abre · la ruta siempre visible arriba y clickeable por segmento.

## Teclado y mouse

El teclado es el de una carpeta: `↑↓` mueven el foco por las filas del panel (en una hoja, pasan al record vecino) · `→` / `Enter` abren la fila con foco · `←` / `Backspace` / `Esc` suben un nivel y dejan el foco en la fila de la que se venía · `/` o `Cmd+K` abren el "ir a". El mouse hace lo mismo de la forma tradicional: click en una fila, click en un segmento de la ruta para volver. Mover el foco no navega: la ruta sigue siendo el único estado.
Todo el contenido tiene que ser alcanzable sin mouse y con JS apagado.

## Mobile

Por debajo de ~900px la estructura es exactamente la misma: carpetas y hojas. Solo se apagan la perspectiva y las ayudas de teclado.

## Defaults a evitar

Cosplay de terminal: verde sobre negro, JSON viewer, clon de VSCode, cursor parpadeando, texto que se tipea solo. Es un diseñador imaginando cómo se ve programar, y un dev lo detecta al instante. Tampoco: consola SQL falsa, partículas o fondos atmosféricos (acá el 3D es solo el gesto de entrar y salir de una carpeta), animación gratuita (en este mundo el movimiento es latencia), imágenes a sangre (van como datos: thumbnail chico con filename y dimensiones al lado).

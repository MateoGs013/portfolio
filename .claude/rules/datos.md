---
paths:
  - "app/worlds/datos/**"
  - "app/components/datos/**"
---

# Mundo DATOS

Una ventana de explorador de archivos apoyada sobre el papel, tinta sobre papel: claro, frío, plano. La ventana tiene barra de herramientas (atrás, adelante, subir, la ruta como barra de dirección, el "ir a"), el contenido en vista de íconos, y barra de estado (conteo, request, teclas). Una carpeta muestra solo sus items como baldosas; recién al abrir uno aparece su contenido. Se vuelve por la ruta o con los botones de la barra.

## Reglas

- **CSS 3D, nunca WebGL.** El texto tiene que seguir siendo DOM: seleccionable, buscable con Ctrl+F, leíble por lector de pantalla, indexable. Este mundo es el piso de accesibilidad del sitio; construirlo sobre canvas lo contradice.
- **Gana la claridad sobre el efecto.** Este mundo existe para argumentar precisión. La profundidad es solo el gesto de entrar o salir de una carpeta: el panel se acerca o se aleja ~56px en Z, casi imperceptible a propósito. El viaje espectacular se gasta una sola vez, en el umbral.
- **Un solo renderer para todas las colecciones.** Una base de datos trata a todos los records igual. No hacer tratamientos especiales por colección: eso es trabajo del otro mundo.
- **La señal primaria de estado es la inversión, no el color.** Item activo = bloque negro con texto papel. El azul (`--d-sig`) queda solo para relaciones y links.

## Dirección (Fase 3, ver `docs/decisiones.md`)

Hoja técnica, no Finder ni terminal. Identificadores en minúscula y sin espaciado, tal como están en el schema. Filas numeradas de 44px. **Una sola cosa dentro de la ventana: una carpeta o una hoja.** La ventana (`DatosWorld.vue`, `.ventana`) es un recuadro de tinta de hasta 1320px centrado en el papel. El marco alrededor es `--d-frame` a los lados y abajo; arriba se suma la franja del control de pasaje, que se apoya sobre la línea del marco al ras del borde derecho de la ventana. Adentro, la barra, el contenido y la barra de estado comparten el mismo margen `--d-inset`: todo lo que empieza a la izquierda empieza en la misma vertical. Su barra lleva `←` `→` (historial del navegador), `↑` (subir un nivel, un link real) y la ruta como barra de dirección: cada segmento es una carpeta a la que se vuelve. **Los tres niveles abren con la misma cabecera** (`DatosCabecera.vue`): el ícono (`DatosIcono.vue`, carpeta o archivo, trazo de tinta de 1.5px en SVG inline, sin relleno ni sombra) con el dato dominante adentro, el nombre a 22px, la línea de tipo en mono debajo (`database · 05 tables`, `collection · Project · 06 records`, `record · Project · updatedAt · 14 fields`) y, a la derecha, botones de 30px con borde gris: los filtros activos en una carpeta (`stack = vue ×`, tocarlo lo quita), los vecinos `‹ ›` en un archivo. **La raíz es la carpeta de la base** (`DatosFolder.vue`): una grilla de baldosas, carpeta para cada tabla y archivo para cada documento; la persona está en `about` y `contact`. **Una colección es la carpeta de sus records** (el mismo `DatosFolder.vue`): una baldosa de archivo por record, con el dato dominante adentro del ícono (año, `since`, año de inicio) y el nombre debajo. Nada más: el stack, el rol y los links se leen al abrir. **El record es un archivo abierto** (`DatosDetail.vue`): la cabecera y después los campos en orden de lectura con el tipo al lado, relaciones a la vista con un link por item; los valores filtrables son links que dejan la carpeta filtrada. No hay sub-nivel: `depth` es 2. El pie muestra el request real con sus milisegundos. Todo esto vive en `app/worlds/datos/` (`explorer.ts` resuelve, los componentes dibujan).

La prueba de cada pantalla es un recruiter apurado: tiene que entender dónde está sin leer nada, ver los nombres enteros, y poder correr su pregunta ("qué hizo con React") tocando un valor en la hoja o entrando a `stack`.

## Vocabulario como sistema de diseño

La estructura del dato es la decoración. No inventar ornamento.

Tipos declarados (`string`, `int`, `relation → Client`) · `NULL` a la vista, no escondido · `05 records` en lugar de un título decorativo · chevron `›` en lo que se abre · la ruta siempre visible arriba y clickeable por segmento.

## Teclado y mouse

El teclado es el de una carpeta: las cuatro flechas mueven el foco por la grilla (las columnas se leen del layout; en una hoja, `←→` y `↑↓` pasan al record vecino) · `Enter` abre la baldosa con foco · `Backspace` / `Esc` suben un nivel y dejan el foco en la baldosa de la que se venía · `/` o `Cmd+K` abren el "ir a". El mouse hace lo mismo de la forma tradicional: click en una baldosa, click en un segmento de la ruta para volver. Mover el foco no navega: la ruta sigue siendo el único estado.
Todo el contenido tiene que ser alcanzable sin mouse y con JS apagado.

## Mobile

Por debajo de ~900px la ventana sigue siendo una ventana: marco de 10px, el pasaje en la franja de arriba, y crece con el contenido en vez de scrollear adentro. Bajo 640px las baldosas se achican (`--d-tile-sm`) para que entren tres por fila. Solo se apagan la perspectiva, el "ir a" de la barra y las ayudas de teclado. El encabezado de la carpeta es una línea discreta en mono (`db · 05 tables`): el nombre ya está en la barra de dirección, no se repite en grande.

## Defaults a evitar

Cosplay de terminal: verde sobre negro, JSON viewer, clon de VSCode, cursor parpadeando, texto que se tipea solo. Es un diseñador imaginando cómo se ve programar, y un dev lo detecta al instante. Tampoco: consola SQL falsa, partículas o fondos atmosféricos (acá el 3D es solo el gesto de entrar y salir de una carpeta), animación gratuita (en este mundo el movimiento es latencia), imágenes a sangre (van como datos: thumbnail chico con filename y dimensiones al lado).

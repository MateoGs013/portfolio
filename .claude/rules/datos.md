---
paths:
  - "app/worlds/datos/**"
  - "app/components/datos/**"
---

# Mundo DATOS

Una ventana de explorador de archivos apoyada sobre el papel. Tinta sobre papel: claro, frío, plano. Se ve una carpeta o un archivo abierto, nunca las dos cosas; se entra con un click o Enter y se vuelve por la barra de dirección o con `Backspace`.

## Reglas

- **CSS 3D, nunca WebGL.** El texto tiene que seguir siendo DOM: seleccionable, buscable con Ctrl+F, leíble por lector de pantalla, indexable. Este mundo es el piso de accesibilidad del sitio; construirlo sobre canvas lo contradice.
- **Gana la claridad sobre el efecto.** Este mundo existe para argumentar precisión. La profundidad es solo el gesto de entrar o salir de una carpeta: el panel se acerca o se aleja `--d-z` (56px), casi imperceptible a propósito. El viaje espectacular se gasta una sola vez, en el umbral.
- **Un solo renderer para todas las colecciones.** Una base de datos trata a todos los records igual: la misma carpeta, la misma baldosa, la misma cabecera, el mismo archivo abierto. No hacer tratamientos especiales por colección: eso es trabajo del otro mundo.
- **Una sola cosa por pantalla.** Una carpeta muestra solo sus items; recién al abrir uno aparece su contenido. Si una pantalla combina dos superficies, está mal aunque cada una sea sobria. Para Mateo "abrumador" es cantidad de cosas a la vez, no densidad tipográfica.
- **La estructura del dato es la decoración.** Tipos declarados (`string`, `relation → Org`), `NULL` a la vista, `05 records` en lugar de un título decorativo, el conteo o el año dibujado adentro del ícono. Identificadores en minúscula y sin espaciado, tal como están en el schema. No inventar ornamento.
- **El azul (`--d-sig`) es solo para relaciones, links y filtros.** El estado (foco, hover) se marca con borde y fondo gris, no con color.

## Anatomía (ver `docs/decisiones.md` para el porqué de cada cosa)

Todo vive en `app/worlds/datos/`: `explorer.ts` resuelve el path en lo que hay que dibujar, los componentes dibujan.

- **La ventana** (`DatosWorld.vue`, `.ventana`): recuadro de tinta de hasta 1320px centrado en el papel. El marco alrededor es `--d-frame` a los lados y abajo; arriba se suma la franja del control de pasaje, apoyado sobre la línea del marco al ras del borde derecho de la ventana. Adentro, la barra, el contenido y la barra de estado comparten el margen `--d-inset`: todo lo que empieza a la izquierda empieza en la misma vertical.
  - **Barra de herramientas:** `←` `→` (historial del navegador), `↑` (subir un nivel: un link real, apagado en la raíz), la ruta como barra de dirección (cada segmento es una carpeta a la que se vuelve) y el "ir a".
  - **Barra de estado:** conteo, el request real con status y milisegundos, las teclas.
- **La cabecera** (`DatosCabecera.vue`), igual en los tres niveles: el ícono con el dato dominante adentro, el nombre a 22px (`--d-fs-title`), la línea de tipo en mono debajo (`database · 05 tables`, `collection · Project · 06 records`, `record · Project · updatedAt · 14 fields`) y, a la derecha, botones de 30px con borde gris: los filtros activos en una carpeta (`stack = vue ×`, tocarlo lo quita), los vecinos `‹ ›` en un archivo.
- **El ícono** (`DatosIcono.vue`): carpeta o archivo, trazo de tinta de 1.5px en SVG inline, sin relleno ni sombra. Es el mismo dibujo en la baldosa y en la cabecera.
- **La carpeta** (`DatosFolder.vue`), para la base y para cada colección: la cabecera y una grilla de baldosas (`--d-tile` de ancho mínimo, `auto-fill`). En la raíz, carpeta por tabla y archivo por documento; la persona está en `about` y `contact`. En una colección, un archivo por record con el dato dominante adentro (año, `since`, año de inicio) y el nombre debajo. Nada más: el stack, el rol y los links se leen al abrir.
- **El archivo abierto** (`DatosDetail.vue`): la cabecera y los campos en orden de lectura, con el tipo en su columna al lado del valor. Las relaciones están a la vista y cada item es un link; los valores filtrables (`year`, `role`, `category`, `featured`) son links con subrayado punteado que dejan la carpeta filtrada. No hay sub-nivel: `depth` es 2.
- **"Ir a"** (`DatosGoto.vue`): un índice de todo, filtrado mientras se escribe. No es una consola.

La prueba de cada pantalla es un recruiter apurado: tiene que entender dónde está sin leer nada, ver los nombres enteros, y poder correr su pregunta ("qué hizo con React") tocando un valor en la hoja o entrando a `stack`.

## Teclado y mouse

Las cuatro flechas mueven el foco por la grilla (las columnas se leen del layout; en un archivo abierto, `←→` y `↑↓` pasan al vecino) · `Enter` abre la baldosa con foco · `Backspace` / `Esc` suben un nivel y dejan el foco en la baldosa de la que se venía · `/` o `Cmd+K` abren el "ir a". Mover el foco no navega: la ruta sigue siendo el único estado. El mouse hace lo mismo de la forma tradicional: click en una baldosa, en un segmento de la ruta o en los botones de la barra.

Todo el contenido tiene que ser alcanzable sin mouse y con JS apagado. El recorrido por teclado y por clicks se verifica con Edge por CDP, con la consola escuchando.

## Mobile

Por debajo de ~900px la ventana sigue siendo una ventana: el mismo marco, el pasaje en la franja de arriba, y crece con el contenido en vez de scrollear adentro. Bajo 640px las baldosas se achican (`--d-tile-sm`) para que entren tres por fila y los botones de la cabecera bajan a su propia fila. Solo se apagan la perspectiva, el "ir a" de la barra y las ayudas de teclado.

## Defaults a evitar

Cosplay de terminal: verde sobre negro, JSON viewer, clon de VSCode, cursor parpadeando, texto que se tipea solo. Es un diseñador imaginando cómo se ve programar, y un dev lo detecta al instante. Tampoco: consola SQL falsa, partículas o fondos atmosféricos, íconos con relleno, sombra o color, animación gratuita (en este mundo el movimiento es latencia), títulos editoriales (un archivo abierto no es una portada), imágenes a sangre (van como datos: thumbnail chico con filename y dimensiones al lado).

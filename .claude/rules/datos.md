---
paths:
  - "app/worlds/datos/**"
  - "app/components/datos/**"
---

# Mundo DATOS

Explorador de columnas tipo Finder en perspectiva CSS. Tinta sobre papel: claro, frío, plano.

## Reglas

- **CSS 3D, nunca WebGL.** El texto tiene que seguir siendo DOM: seleccionable, buscable con Ctrl+F, leíble por lector de pantalla, indexable. Este mundo es el piso de accesibilidad del sitio; construirlo sobre canvas lo contradice.
- **Gana la claridad sobre el efecto.** Este mundo existe para argumentar precisión. La perspectiva entre columnas es casi imperceptible a propósito (~56px en Z). El viaje espectacular se gasta una sola vez, en el umbral.
- **Un solo renderer para todas las colecciones.** Una base de datos trata a todos los records igual. No hacer tratamientos especiales por colección: eso es trabajo del otro mundo.
- **La señal primaria de estado es la inversión, no el color.** Item activo = bloque negro con texto papel. El azul (`--d-sig`) queda solo para relaciones y links.

## Trampa conocida

La columna 0 es siempre la raíz, y **cada columna extra requiere que haya algo seleccionado en la anterior**. Sin ese chequeo el loop pide los hijos de una ruta vacía en cada vuelta y dibuja N columnas raíz idénticas. Ya pasó una vez.

## Vocabulario como sistema de diseño

La estructura del dato es la decoración. No inventar ornamento.

Tipos declarados (`string`, `int`, `relation → Client`) · `NULL` a la vista, no escondido · `05 records` en lugar de un título decorativo · chevron `›` solo en items con hijos · header de columna con el nombre de la carpeta padre · la ruta siempre visible arriba y clickeable por segmento.

## Teclado

`↑↓` mover · `→` / `Enter` entrar · `←` / `Esc` volver · `/` o `Cmd+K` abrir el "ir a".
Todo el contenido tiene que ser alcanzable sin mouse y con JS apagado.

## Mobile

Por debajo de ~900px se apaga la perspectiva y se muestra una columna sola. Un explorador de columnas en un teléfono no funciona, y fingir que sí es peor que no tenerlo.

## Defaults a evitar

Cosplay de terminal: verde sobre negro, JSON viewer, clon de VSCode, cursor parpadeando, texto que se tipea solo. Es un diseñador imaginando cómo se ve programar, y un dev lo detecta al instante. Tampoco: consola SQL falsa, partículas o fondos atmosféricos (acá el 3D es estructura), animación gratuita (en este mundo el movimiento es latencia), imágenes a sangre (van como datos: thumbnail chico con filename y dimensiones al lado).

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

## Dirección (Fase 3, ver `docs/decisiones.md`)

Hoja técnica, no Finder ni terminal. Identificadores en minúscula y sin espaciado, tal como están en el schema. Filas numeradas de 44px. La ruta se ve como escalera: fila elegida invertida y el encabezado de la columna siguiente repite ese nombre, invertido. **Una colección es una tabla** (`DatosTable.vue`): filas anchas, columnas de `fieldMeta[...].list`, tipo en el encabezado, cada valor filtrable es un link que corre la query. **El record es una hoja plana** (`DatosDetail.vue`): nombre grande, línea `record · Model · updatedAt`, campos en orden de lectura con el tipo al lado, relaciones a la vista con un link por item. No hay sub-nivel: `depth` es 2. El pie muestra el request real con sus milisegundos. Todo esto vive en `app/worlds/datos/` (`explorer.ts` resuelve, los componentes dibujan).

La prueba de cada pantalla es un recruiter apurado: tiene que ver los nombres enteros, el stack sin un click más, y poder correr su pregunta ("qué hizo con React") tocando un valor.

## Trampa conocida

La columna 0 es siempre la raíz, y **cada columna extra requiere que haya algo seleccionado en la anterior**. Sin ese chequeo el loop pide los hijos de una ruta vacía en cada vuelta y dibuja N columnas raíz idénticas. Ya pasó una vez.

## Vocabulario como sistema de diseño

La estructura del dato es la decoración. No inventar ornamento.

Tipos declarados (`string`, `int`, `relation → Client`) · `NULL` a la vista, no escondido · `05 records` en lugar de un título decorativo · chevron `›` solo en items con hijos · header de columna con el nombre de la carpeta padre · la ruta siempre visible arriba y clickeable por segmento.

## Teclado

`↑↓` mover · `→` / `Enter` entrar · `←` / `Esc` volver · `/` o `Cmd+K` abrir el "ir a".
Todo el contenido tiene que ser alcanzable sin mouse y con JS apagado.

## Mobile

Por debajo de ~900px se apaga la perspectiva y se muestra una sola cosa: la lista en la raíz, la tabla apilada (cada record como bloque con sus campos rotulados) en una colección, la hoja en un record. Un explorador de columnas en un teléfono no funciona, y fingir que sí es peor que no tenerlo.

## Defaults a evitar

Cosplay de terminal: verde sobre negro, JSON viewer, clon de VSCode, cursor parpadeando, texto que se tipea solo. Es un diseñador imaginando cómo se ve programar, y un dev lo detecta al instante. Tampoco: consola SQL falsa, partículas o fondos atmosféricos (acá el 3D es estructura), animación gratuita (en este mundo el movimiento es latencia), imágenes a sangre (van como datos: thumbnail chico con filename y dimensiones al lado).
